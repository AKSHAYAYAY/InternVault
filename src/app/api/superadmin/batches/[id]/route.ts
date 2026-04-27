import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// PATCH /api/superadmin/batches/[id]
// Body: { coordinatorId }
// Assigns a coordinator to an existing batch (replaces previous coordinator)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { coordinatorId } = await req.json()
    if (!coordinatorId) {
      return NextResponse.json({ success: false, message: "coordinatorId is required" }, { status: 400 })
    }

    const batch = await prisma.batch.findUnique({ where: { id: params.id } })
    if (!batch) {
      return NextResponse.json({ success: false, message: "Batch not found" }, { status: 404 })
    }

    const coordinator = await prisma.user.findUnique({ where: { id: coordinatorId } })
    if (!coordinator) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Upsert: if already a member update role to COORDINATOR, else create
    const batchMember = await prisma.batchMember.upsert({
      where: { batchId_userId: { batchId: params.id, userId: coordinatorId } },
      update: { batchRole: "COORDINATOR" },
      create: { batchId: params.id, userId: coordinatorId, batchRole: "COORDINATOR" },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    // Also update the user's role to COORDINATOR if they are INTERN
    if (coordinator.role === "INTERN") {
      await prisma.user.update({
        where: { id: coordinatorId },
        data: { role: "COORDINATOR" },
      })
    }

    return NextResponse.json({
      success: true,
      data: { batchMember },
      message: "Coordinator assigned successfully",
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
