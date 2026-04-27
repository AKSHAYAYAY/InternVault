import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Department } from "@prisma/client"
import { apiSuccess, unauthorized, serverError } from "@/lib/apiResponse"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { role, department, id: userId } = session.user
    const dept = department as Department | null

    // ── COORDINATOR ──────────────────────────────────────────────────────
    if (role === "COORDINATOR" && dept) {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      const [pendingIdeas, recentJoins] = await Promise.all([
        prisma.idea.findMany({
          where: { department: dept, status: "PENDING" },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, title: true, createdAt: true, submittedBy: { select: { name: true } } },
        }),
        prisma.projectMember.findMany({
          where: { joinedAt: { gte: since }, project: { department: dept } },
          orderBy: { joinedAt: "desc" },
          take: 5,
          select: {
            id: true, joinedAt: true,
            user: { select: { name: true } },
            project: { select: { id: true, name: true } },
          },
        }),
      ])

      const items = [
        ...pendingIdeas.map(i => ({
          id: `idea-${i.id}`,
          type: "pending_idea" as const,
          message: `"${i.title}" needs approval`,
          actor: i.submittedBy.name,
          href: "/dashboard/ideas",
          date: i.createdAt,
          read: false,
        })),
        ...recentJoins.map(j => ({
          id: `join-${j.id}`,
          type: "join_request" as const,
          message: `${j.user.name} joined "${j.project.name}"`,
          actor: j.user.name,
          href: `/dashboard/projects/${j.project.id}`,
          date: j.joinedAt,
          read: false,
        })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)

      return apiSuccess({
        count: pendingIdeas.length + recentJoins.length,
        pendingIdeas: pendingIdeas.length,
        pendingJoinRequests: recentJoins.length,
        items,
      })
    }

    // ── INTERN ───────────────────────────────────────────────────────────
    if (role === "INTERN") {
      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

      const updatedIdeas = await prisma.idea.findMany({
        where: {
          submittedById: userId!,
          status: { in: ["APPROVED", "REJECTED"] },
          createdAt: { gte: since },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, status: true, createdAt: true },
      })

      const items = updatedIdeas.map(i => ({
        id: `idea-${i.id}`,
        type: i.status === "APPROVED" ? ("idea_approved" as const) : ("idea_rejected" as const),
        message: i.status === "APPROVED"
          ? `Your idea "${i.title}" was approved`
          : `Your idea "${i.title}" was rejected`,
        actor: null,
        href: "/dashboard/ideas",
        date: i.createdAt,
        read: false,
      }))

      return apiSuccess({ count: items.length, items })
    }

    // SUPER_ADMIN — no notifications
    return apiSuccess({ count: 0, items: [] })
  } catch (err) {
    return serverError(err)
  }
}
