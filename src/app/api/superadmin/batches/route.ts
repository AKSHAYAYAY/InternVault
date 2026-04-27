import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Department } from "@prisma/client"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { department, coordinatorId } = await req.json()
    if (!department || !coordinatorId) {
      return NextResponse.json({ success: false, message: "department and coordinatorId are required" }, { status: 400 })
    }

    const coordinator = await prisma.user.findUnique({ where: { id: coordinatorId } })
    if (!coordinator) {
      return NextResponse.json({ success: false, message: "Coordinator not found" }, { status: 404 })
    }

    const lastBatch = await prisma.batch.findFirst({
      where: { department },
      orderBy: { batchNumber: "desc" },
    })
    const batchNumber = (lastBatch?.batchNumber ?? 0) + 1

    const batch = await prisma.$transaction(async (tx) => {
      await tx.batch.updateMany({
        where: { department, isActive: true },
        data: { isActive: false },
      })
      return tx.batch.create({
        data: {
          name: `${department} Batch ${batchNumber}`,
          batchNumber,
          department: department as Department,
          startDate: new Date(),
          isActive: true,
          createdById: session.user.id!,
          members: {
            create: { userId: coordinatorId, batchRole: "COORDINATOR" },
          },
        },
        include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
      })
    })

    const coordinatorMember = batch.members.find(m => m.userId === coordinatorId)

    return NextResponse.json({
      success: true,
      data: { batch, coordinator: coordinatorMember?.user },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const batches = await prisma.batch.findMany({
      orderBy: [{ department: "asc" }, { batchNumber: "desc" }],
      include: {
        _count: { select: { members: true, projects: true, ideas: true } },
        members: { select: { batchRole: true } },
      },
    })

    const grouped: Record<string, any[]> = {}
    for (const batch of batches) {
      const dept = batch.department
      if (!grouped[dept]) grouped[dept] = []
      grouped[dept].push({
        id: batch.id,
        batchNumber: batch.batchNumber,
        name: batch.name,
        isActive: batch.isActive,
        startDate: batch.startDate,
        endDate: batch.endDate,
        internCount: batch.members.filter(m => m.batchRole === "INTERN").length,
        coordinatorCount: batch.members.filter(m => m.batchRole === "COORDINATOR").length,
        projectCount: batch._count.projects,
        ideaCount: batch._count.ideas,
      })
    }

    return NextResponse.json({ success: true, data: grouped })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
