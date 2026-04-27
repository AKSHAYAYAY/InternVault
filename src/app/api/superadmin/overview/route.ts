import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const DEPARTMENTS = ["IT", "REVENUE", "LAWS", "AICSTL"] as const

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const [totalInterns, totalProjects, totalIdeas, activeBatches, deptBatches] = await Promise.all([
      prisma.batchMember.count({ where: { batchRole: "INTERN" } }),
      prisma.project.count(),
      prisma.idea.count(),
      prisma.batch.count({ where: { isActive: true } }),
      prisma.batch.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { members: true, projects: true, ideas: true } },
          members: { select: { batchRole: true } },
        },
      }),
    ])

    const perDepartment = DEPARTMENTS.map(dept => {
      const batch = deptBatches.find(b => b.department === dept)
      return {
        department: dept,
        hasActiveBatch: !!batch,
        batchNumber: batch?.batchNumber ?? null,
        internCount: batch?.members.filter(m => m.batchRole === "INTERN").length ?? 0,
        projectCount: batch?._count.projects ?? 0,
        ideaCount: batch?._count.ideas ?? 0,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        totalInterns,
        totalProjects,
        totalIdeas,
        activeBatchCount: activeBatches,
        perDepartment,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
