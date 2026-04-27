import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isCoordinator, getActiveBatch } from "@/lib/batchHelpers"
import { Department } from "@prisma/client"

export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const department = session.user.department as Department
    const ok = await isCoordinator(session.user.id!, department)
    if (!ok) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })

    const activeBatch = await getActiveBatch(department)
    if (!activeBatch) {
      return NextResponse.json({ success: false, message: "No active batch found" }, { status: 400 })
    }

    const membership = await prisma.batchMember.findUnique({
      where: { batchId_userId: { batchId: activeBatch.id, userId: params.userId } },
    })
    if (!membership) {
      return NextResponse.json({ success: false, message: "Member not found in active batch" }, { status: 404 })
    }

    if (membership.batchRole === "COORDINATOR") {
      return NextResponse.json({ success: false, message: "Cannot remove a coordinator" }, { status: 403 })
    }

    await prisma.batchMember.delete({
      where: { batchId_userId: { batchId: activeBatch.id, userId: params.userId } },
    })

    return NextResponse.json({ success: true, message: "Member removed from batch" })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
