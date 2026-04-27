import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const DEPARTMENTS = ["IT", "REVENUE", "LAWS", "AICSTL"]

    const [allIdeas, allProjects, allInterns, recentIdeas, recentProjects] = await Promise.all([
      prisma.idea.groupBy({ by: ["status", "department"], _count: true }),
      prisma.project.groupBy({ by: ["status", "department"], _count: true }),
      prisma.user.groupBy({ by: ["department"], where: { role: "INTERN" }, _count: true }),
      prisma.idea.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { title: true, status: true, createdAt: true, submittedBy: { select: { name: true } } }
      }),
      prisma.project.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { name: true, status: true, updatedAt: true }
      })
    ])

    const ideasByStatus = Object.fromEntries(
      ["PENDING", "APPROVED", "REJECTED"].map(s => [s, allIdeas.filter(i => i.status === s).reduce((a, b) => a + b._count, 0)])
    )
    const projectsByStatus = Object.fromEntries(
      ["IDEA", "IN_PROGRESS", "COMPLETED"].map(s => [s, allProjects.filter(p => p.status === s).reduce((a, b) => a + b._count, 0)])
    )

    const totalInterns = allInterns.reduce((a, b) => a + b._count, 0)
    const activeContributors = await prisma.user.count({ where: { role: "INTERN", projectMemberships: { some: {} } } })

    const activity = [
      ...recentIdeas.map(i => ({ type: "idea" as const, title: i.title, date: i.createdAt, status: i.status, actor: i.submittedBy?.name ?? "Unknown" })),
      ...recentProjects.map(p => ({ type: "project" as const, title: p.name, date: p.updatedAt, status: p.status, actor: null }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

    const departments = DEPARTMENTS.map(dept => {
      const deptIdeas = allIdeas.filter(i => i.department === dept)
      const deptProjects = allProjects.filter(p => p.department === dept)
      const deptInterns = allInterns.find(u => u.department === dept)
      return {
        name: dept,
        totalIdeas: deptIdeas.reduce((a, b) => a + b._count, 0),
        totalProjects: deptProjects.reduce((a, b) => a + b._count, 0),
        totalInterns: deptInterns?._count ?? 0,
        completedProjects: deptProjects.find(p => p.status === "COMPLETED")?._count ?? 0,
        activeProjects: deptProjects.find(p => p.status === "IN_PROGRESS")?._count ?? 0,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ideas: { total: allIdeas.reduce((a, b) => a + b._count, 0), pending: ideasByStatus["PENDING"], approved: ideasByStatus["APPROVED"], rejected: ideasByStatus["REJECTED"] },
        projects: { total: allProjects.reduce((a, b) => a + b._count, 0), idea: projectsByStatus["IDEA"], inProgress: projectsByStatus["IN_PROGRESS"], completed: projectsByStatus["COMPLETED"] },
        interns: { total: totalInterns, activeContributors },
        recentActivity: activity,
        departments
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
