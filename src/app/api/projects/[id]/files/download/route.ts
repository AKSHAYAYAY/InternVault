import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"
import mime from "mime-types"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 })

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    if (!isSuperAdmin && project.department !== session.user.department) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    const targetPath = req.nextUrl.searchParams.get("path")
    if (!targetPath) return NextResponse.json({ success: false, message: "Path required" }, { status: 400 })

    const publicDir = path.join(process.cwd(), "public")
    const projectDir = path.join(publicDir, "uploads", id)
    
    // Convert e.g. "/uploads/123/file.txt" to absolute path
    const relativeTarget = targetPath.startsWith("/") ? targetPath.slice(1) : targetPath
    const absoluteTargetPath = path.resolve(publicDir, relativeTarget)

    // Ensure nobody navigates up utilizing ../../../
    if (!absoluteTargetPath.startsWith(projectDir)) {
      return NextResponse.json({ success: false, message: "Invalid path traversal" }, { status: 403 })
    }

    if (!fs.existsSync(absoluteTargetPath) || fs.statSync(absoluteTargetPath).isDirectory()) {
      return NextResponse.json({ success: false, message: "File not found" }, { status: 404 })
    }

    // Since we are using standard fetch Request/Response, we can pipe a readStream
    const fileStream = fs.createReadStream(absoluteTargetPath)
    const stream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk))
        fileStream.on('end', () => controller.close())
        fileStream.on('error', (err) => controller.error(err))
      }
    })

    const contentType = mime.lookup(absoluteTargetPath) || 'application/octet-stream'
    const fileName = path.basename(absoluteTargetPath)

    return new NextResponse(stream, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
