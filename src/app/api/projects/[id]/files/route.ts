import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const project = await prisma.project.findUnique({
      where: { id },
      include: { files: { include: { uploadedBy: { select: { name: true } } } } }
    })

    if (!project) return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 })

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    if (!isSuperAdmin && project.department !== session.user.department) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    const folderStructure = project.folderStructure ? JSON.parse(project.folderStructure) : null

    return NextResponse.json({
      success: true,
      data: {
        folderStructure,
        files: project.files
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// Helper to rebuild json tree recursively identically to upload script
function walkDir(dir: string, baseDir: string): any {
  if (!fs.existsSync(dir)) return { name: "root", type: "folder", children: [] }
  const name = path.basename(dir)
  const children: any[] = []
  
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name === '__MACOSX' || entry.name.startsWith('.')) continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      children.push(walkDir(fullPath, baseDir))
    } else {
      children.push({
        name: entry.name,
        type: "file",
        path: "/" + path.relative(path.join(process.cwd(), "public"), fullPath).replace(/\\/g, '/')
      })
    }
  }
  return { name, type: "folder", children }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || !([ "COORDINATOR", "SUPER_ADMIN"].includes(session.user.role))) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const targetPath = req.nextUrl.searchParams.get("path")
    
    if (!targetPath) return NextResponse.json({ success: false, message: "Path param required" }, { status: 400 })

    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 })
    if (session.user.role !== "SUPER_ADMIN" && project.department !== session.user.department) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Validate path securely
    const publicDir = path.join(process.cwd(), "public")
    const projectDir = path.join(publicDir, "uploads", id)
    
    // The query param path is expected to be e.g. "/uploads/[id]/file.txt"
    const relativeTarget = targetPath.startsWith("/") ? targetPath.slice(1) : targetPath
    const absoluteTargetPath = path.join(publicDir, relativeTarget)

    // Security check: must reside inside /public/uploads/[id]/
    if (!absoluteTargetPath.startsWith(projectDir)) {
      return NextResponse.json({ success: false, message: "Invalid path traversal detected" }, { status: 403 })
    }

    if (fs.existsSync(absoluteTargetPath)) {
      if (fs.statSync(absoluteTargetPath).isDirectory()) {
         fs.rmSync(absoluteTargetPath, { recursive: true, force: true })
      } else {
         fs.unlinkSync(absoluteTargetPath)
      }
    }

    // Delete matching database records using startsWith syntax logic
    await prisma.projectFile.deleteMany({
      where: {
        projectId: id,
        filePath: { startsWith: targetPath }
      }
    })

    // Rebuild tree
    const structure = walkDir(projectDir, projectDir)
    structure.name = "root"
    
    await prisma.project.update({
      where: { id },
      data: { folderStructure: JSON.stringify(structure) }
    })

    return NextResponse.json({ success: true, message: "File deleted" })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
