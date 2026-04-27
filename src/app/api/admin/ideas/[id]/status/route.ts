import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || (!(["COORDINATOR", "SUPER_ADMIN"].includes(session.user.role)))) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await req.json()
    const { status } = body

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 })
    }

    const idea = await prisma.idea.findUnique({ where: { id } })
    if (!idea) return NextResponse.json({ success: false, message: "Idea not found" }, { status: 404 })

    // Department check for COORDINATOR only; SUPER_ADMIN can act on any
    if (session.user.role === "COORDINATOR" && idea.department !== (session.user.department as any)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    await prisma.idea.update({ where: { id }, data: { status } })

    return NextResponse.json({ success: true, message: "Idea status updated" })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
