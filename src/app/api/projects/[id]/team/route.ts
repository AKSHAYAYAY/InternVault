import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const WRITE_ROLES = ["COORDINATOR", "SUPER_ADMIN"]

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || !WRITE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await req.json()
    const { userId, action } = body

    if (!userId || !action) {
      return NextResponse.json({ success: false, message: "Missing userId or action" }, { status: 400 })
    }

    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 })
    }

    // SUPER_ADMIN can act on any department; COORDINATOR is scoped to their own
    if (session.user.role !== "SUPER_ADMIN" && project.department !== session.user.department) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Department check: user being added must belong to the project's department
    if (targetUser.department !== project.department) {
      return NextResponse.json({ success: false, message: "User is not in the project's department" }, { status: 400 })
    }

    if (action === "ADD") {
      await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId: id, userId } },
        update: {},
        create: { projectId: id, userId },
      })
    } else if (action === "REMOVE") {
      await prisma.projectMember.delete({
        where: { projectId_userId: { projectId: id, userId } },
      }).catch(() => {})
    } else {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Team updated" })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
