import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "COORDINATOR") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const dept = session.user.department as any

    const [ideas, projects, interns, recentIdeas, recentProjects] = await Promise.all([
      prisma.idea.groupBy({ by: ["status"], where: { department: dept }, _count: true }),
      prisma.project.groupBy({ by: ["status"], where: { department: dept }, _count: true }),
      prisma.user.count({ where: { department: dept, role: "INTERN" } }),
      prisma.idea.findMany({
        where: { department: dept },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { title: true, status: true, createdAt: true, submittedBy: { select: { name: true } } }
      }),
      prisma.project.findMany({
        where: { department: dept },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { name: true, status: true, updatedAt: true }
      })
    ])

    const ideasMap = Object.fromEntries(ideas.map(i => [i.status, i._count]))
    const projectsMap = Object.fromEntries(projects.map(p => [p.status, p._count]))

    // Active contributors = interns who are ProjectMembers in this dept
    const activeContributors = await prisma.user.count({
      where: {
        department: dept,
        role: "INTERN",
        projectMemberships: { some: {} }
      }
    })

    const activity = [
      ...recentIdeas.map(i => ({
        type: "idea" as const,
        title: i.title,
        date: i.createdAt,
        status: i.status,
        actor: i.submittedBy?.name ?? "Unknown"
      })),
      ...recentProjects.map(p => ({
        type: "project" as const,
        title: p.name,
        date: p.updatedAt,
        status: p.status,
        actor: null
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

    return NextResponse.json({
      success: true,
      data: {
        ideas: {
          total: (ideasMap["PENDING"] ?? 0) + (ideasMap["APPROVED"] ?? 0) + (ideasMap["REJECTED"] ?? 0),
          pending: ideasMap["PENDING"] ?? 0,
          approved: ideasMap["APPROVED"] ?? 0,
          rejected: ideasMap["REJECTED"] ?? 0,
        },
        projects: {
          total: (projectsMap["IDEA"] ?? 0) + (projectsMap["IN_PROGRESS"] ?? 0) + (projectsMap["COMPLETED"] ?? 0),
          idea: projectsMap["IDEA"] ?? 0,
          inProgress: projectsMap["IN_PROGRESS"] ?? 0,
          completed: projectsMap["COMPLETED"] ?? 0,
        },
        interns: { total: interns, activeContributors },
        recentActivity: activity
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
