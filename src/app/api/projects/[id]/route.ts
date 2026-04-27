import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const WRITE_ROLES = ["COORDINATOR", "SUPER_ADMIN"]

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        members: { include: { user: { select: { name: true, email: true, department: true } } } },
        contributions: {
          include: { intern: { select: { name: true, department: true } } },
          orderBy: { date: "desc" },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 })
    }

    if (session.user.role !== "SUPER_ADMIN" && project.department !== session.user.department) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: project })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || !WRITE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const project = await prisma.project.findUnique({ where: { id: params.id } })
    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 })
    }

    if (session.user.role !== "SUPER_ADMIN" && project.department !== session.user.department) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const dataToUpdate = Object.fromEntries(
      Object.entries(body).filter(([_, v]) => v !== undefined)
    )

    await prisma.project.update({ where: { id: params.id }, data: dataToUpdate })

    return NextResponse.json({ success: true, message: "Project updated" })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || !WRITE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const project = await prisma.project.findUnique({ where: { id: params.id } })
    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 })
    }

    if (session.user.role !== "SUPER_ADMIN" && project.department !== session.user.department) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    await prisma.project.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true, message: "Project deleted" })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
