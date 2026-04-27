import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SuperAdminClient } from "@/components/ui/SuperAdminClient"

export default async function SuperAdminPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login")

  const DEPARTMENTS = ["IT", "REVENUE", "LAWS", "AICSTL"]

  const [overviewData, batchesRaw, allUsers] = await Promise.all([
    Promise.all([
      prisma.batchMember.count({ where: { batchRole: "INTERN" } }),
      prisma.project.count(),
      prisma.idea.count(),
      prisma.batch.count({ where: { isActive: true } }),
    ]),
    prisma.batch.findMany({
      orderBy: [{ department: "asc" }, { batchNumber: "desc" }],
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
        _count: { select: { projects: true, ideas: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["INTERN", "COORDINATOR"] } },
      select: { id: true, name: true, email: true, role: true, department: true },
      orderBy: { name: "asc" },
    }),
  ])

  const [totalInterns, totalProjects, totalIdeas, activeBatchCount] = overviewData

  const batchesByDept: Record<string, any[]> = {}
  for (const dept of DEPARTMENTS) batchesByDept[dept] = []

  for (const batch of batchesRaw) {
    const coordinators = batch.members.filter(m => m.batchRole === "COORDINATOR")
    const interns = batch.members.filter(m => m.batchRole === "INTERN")
    batchesByDept[batch.department]?.push({
      id: batch.id,
      name: batch.name,
      batchNumber: batch.batchNumber,
      department: batch.department,
      isActive: batch.isActive,
      startDate: batch.startDate,
      endDate: batch.endDate,
      coordinator: coordinators[0]?.user ?? null,
      internCount: interns.length,
      coordinatorCount: coordinators.length,
      projectCount: batch._count.projects,
      ideaCount: batch._count.ideas,
    })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "var(--font-playfair, serif)", fontSize: "1.875rem", fontWeight: 700, color: "var(--text)", margin: "0 0 0.25rem" }}>
          Super Admin — Municipal Corporation
        </h1>
        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.875rem" }}>
          Internship Management Overview
        </p>
      </div>

      <SuperAdminClient
        overview={{ totalInterns, totalProjects, totalIdeas, activeBatchCount }}
        batchesByDept={batchesByDept}
        allUsers={allUsers}
        departments={DEPARTMENTS}
      />
    </div>
  )
}
