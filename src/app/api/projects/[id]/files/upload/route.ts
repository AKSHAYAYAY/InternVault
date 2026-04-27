import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { apiSuccess, unauthorized, forbidden, notFound, badRequest, serverError } from "@/lib/apiResponse"
import fs from "fs"
import path from "path"
import AdmZip from "adm-zip"

export const dynamic = "force-dynamic"

function walkDir(dir: string, publicRoot: string): any {
  const name = path.basename(dir)
  const children: any[] = []
  let entries: fs.Dirent[]
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return { name, type: "folder", children: [] } }
  for (const entry of entries) {
    if (entry.name === "__MACOSX" || entry.name.startsWith(".")) continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      children.push(walkDir(fullPath, publicRoot))
    } else {
      children.push({
        name: entry.name,
        type: "file",
        path: "/" + path.relative(publicRoot, fullPath).replace(/\\/g, "/"),
      })
    }
  }
  return { name, type: "folder", children }
}

function findReadme(zip: AdmZip): string | null {
  const entries = zip.getEntries()
  const readme = entries.find(e => e.name.toLowerCase() === "readme.md" && !e.isDirectory)
  if (!readme) return null
  try { return readme.getData().toString("utf-8") } catch { return null }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: { members: true },
    })
    if (!project) return notFound("Project")

    const isWriteRole = ["COORDINATOR", "SUPER_ADMIN"].includes(session.user.role)
    const isMember = project.members.some(m => m.userId === session.user!.id)
    if (!isWriteRole && !isMember) return forbidden()

    let formData: FormData
    try { formData = await req.formData() } catch (e: any) {
      return badRequest("Failed to parse upload: " + e.message)
    }

    const file = formData.get("zipfile") as File | null
    if (!file || typeof file === "string") return badRequest("No file received. Use field name 'zipfile'")
    if (!file.name.toLowerCase().endsWith(".zip")) return badRequest("Only .zip files are accepted")
    if (file.size > 50 * 1024 * 1024) return badRequest("File size exceeds the 50MB limit")

    // Determine next version number
    const lastVersion = await prisma.projectVersion.findFirst({
      where: { projectId: params.id },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    })
    const versionNumber = (lastVersion?.versionNumber ?? 0) + 1

    const arrayBuffer = await file.arrayBuffer()
    const zipBuffer = Buffer.from(arrayBuffer)
    const zip = new AdmZip(zipBuffer)

    // Extract README before touching disk
    const readmeContent = findReadme(zip)

    // Extract to versioned directory — never overwrites previous versions
    const publicRoot = path.join(process.cwd(), "public")
    const extractDir = path.join(publicRoot, "uploads", params.id, `v${versionNumber}`)
    fs.mkdirSync(extractDir, { recursive: true })
    zip.extractAllTo(extractDir, true)

    // Save zip file itself for download
    const zipStorePath = path.join(publicRoot, "uploads", params.id, `v${versionNumber}.zip`)
    fs.writeFileSync(zipStorePath, zipBuffer)

    // Build folder structure JSON
    const structure = walkDir(extractDir, publicRoot)
    structure.name = "root"

    // Save version record
    const version = await prisma.projectVersion.create({
      data: {
        projectId: params.id,
        versionNumber,
        uploadedById: session.user.id!,
        zipPath: `/uploads/${params.id}/v${versionNumber}.zip`,
        extractedJson: structure,
        readmeContent,
      },
      include: { uploadedBy: { select: { name: true } } },
    })

    return apiSuccess(
      { versionNumber, readmeFound: !!readmeContent },
      `Version ${versionNumber} uploaded successfully`
    )
  } catch (err) {
    console.error("[upload error]", err)
    return serverError(err)
  }
}
