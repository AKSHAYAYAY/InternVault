import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { getActiveBatch, isCoordinator } from "@/lib/batchHelpers"
import { Department } from "@prisma/client"
import { InternManager } from "@/components/ui/InternManager"

export default async function ManageInternsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const dept = session.user.department as Department
  const coordCheck = await isCoordinator(session.user.id!, dept)
  if (!coordCheck) redirect("/dashboard")

  const activeBatch = await getActiveBatch(dept)
  if (!activeBatch) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h1 style={{ fontFamily: "var(--font-playfair, serif)", fontSize: "1.875rem", fontWeight: 700, color: "var(--text)" }}>
          Manage Interns
        </h1>
        <p style={{ color: "var(--text-muted)" }}>No active batch found for {dept}. Ask Super Admin to create one.</p>
      </div>
    )
  }

  const batchMemberIds = activeBatch.members.map(m => m.user.id)

  const [eligibleUsers, pastBatchesRaw] = await Promise.all([
    prisma.user.findMany({
      where: {
        department: dept,
        id: { notIn: batchMemberIds },
        role: { in: ["INTERN", "COORDINATOR"] },
      },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.batch.findMany({
      where: { department: dept, isActive: false },
      orderBy: { batchNumber: "desc" },
      include: {
        members: {
          where: { batchRole: "COORDINATOR" },
          include: { user: { select: { name: true, email: true } } },
        },
        _count: { select: { members: true, projects: true } },
      },
    }),
  ])

  const interns = activeBatch.members
    .filter(m => m.user.role === "INTERN")
    .map(m => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      joinedAt: m.joinedAt,
      projectsCount: 0,
    }))

  const projectCounts = await prisma.projectMember.groupBy({
    by: ["userId"],
    where: { userId: { in: interns.map(i => i.id) } },
    _count: true,
  })
  const countMap = Object.fromEntries(projectCounts.map(p => [p.userId, p._count]))
  const enrichedInterns = interns.map(i => ({ ...i, projectsCount: countMap[i.id] ?? 0 }))

  const pastBatches = pastBatchesRaw.map(b => ({
    id: b.id,
    name: b.name,
    batchNumber: b.batchNumber,
    coordinator: b.members[0]?.user ?? null,
    internCount: b._count.members,
    projectCount: b._count.projects,
  }))

  return (
    <InternManager
      batchId={activeBatch.id}
      batchName={activeBatch.name}
      department={dept}
      initialInterns={enrichedInterns}
      eligibleUsers={eligibleUsers}
      pastBatches={pastBatches}
    />
  )
}
