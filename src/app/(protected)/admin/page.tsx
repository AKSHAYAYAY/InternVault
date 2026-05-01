import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { StatCard } from "@/components/ui/StatCard"
import { ActivityFeed } from "@/components/ui/ActivityFeed"
import { DataTable, ColumnDef } from "@/components/ui/DataTable"
import { PendingIdeasTable } from "@/components/ui/PendingIdeasTable"
import { EditProjectModal } from "@/components/ui/EditProjectModal"
import { DeleteProjectButton } from "@/components/ui/DeleteProjectButton"
import { ProjectsTable } from "@/components/ui/ProjectsTable"

const sectionLabel: React.CSSProperties = {
  fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.12em",
  color: "var(--text-muted)", fontWeight: 700, margin: 0
}

const box: React.CSSProperties = {
  backgroundColor: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: "0.5rem", padding: "1.5rem"
}

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login")

  const dept = session.user.department as any

  const [pendingIdeas, projects, interns, ideas] = await Promise.all([
    prisma.idea.findMany({
      where: { department: dept, status: "PENDING" },
      include: { submittedBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.project.findMany({
      where: { department: dept },
      include: {
        members: { include: { user: { select: { id: true, name: true } } } },
        _count: { select: { members: true } }
      },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.user.findMany({
      where: { department: dept, role: "INTERN" },
      include: {
        projectMemberships: { select: { id: true } },
        submittedIdeas: { select: { id: true } },
        contributions: { select: { id: true } }
      },
      orderBy: { name: "asc" }
    }),
    prisma.idea.findMany({
      where: { department: dept },
      include: { submittedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ])

  const totalIdeas = await prisma.idea.count({ where: { department: dept } })
  const activeProjects = projects.filter(p => p.status === "IN_PROGRESS").length
  const recentActivity = [
    ...ideas.map(i => ({ type: "idea" as const, title: i.title, date: i.createdAt, status: i.status, actor: i.submittedBy?.name ?? null })),
    ...projects.slice(0, 5).map(p => ({ type: "project" as const, title: p.name, date: p.updatedAt, status: p.status, actor: null }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

  const internRows = interns.map(i => ({
    id: i.id, name: i.name, email: i.email, department: i.department,
    projectsCount: i.projectMemberships.length,
    ideasCount: i.submittedIdeas.length,
    contributionsCount: i.contributions.length
  }))

  const projectRows = projects.map(p => ({
    id: p.id, name: p.name, status: p.status,
    batchNumber: p.startedInBatch, teamSize: p._count.members,
    updatedAt: p.updatedAt
  }))

  const internColumns: ColumnDef[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "email", header: "Email" },
    { key: "projectsCount", header: "Projects", sortable: true },
    { key: "ideasCount", header: "Ideas", sortable: true },
    { key: "contributionsCount", header: "Contributions", sortable: true },
    { key: "actions", header: "Actions", type: "intern-actions" }
  ]

  const projectColumns: ColumnDef[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "status", header: "Status", sortable: true, type: "status" },
    { key: "batchNumber", header: "Batch", sortable: true },
    { key: "teamSize", header: "Team", sortable: true },
    { key: "updatedAt", header: "Last Updated", sortable: true, type: "date" },
    { key: "actions", header: "Actions", type: "project-actions" }
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      <style>{`
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
        .two-col { display: grid; grid-template-columns: 60% 1fr; gap: 1.5rem; }
        @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } .two-col { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "var(--font-playfair, serif)", fontSize: "2rem", color: "var(--text)", margin: "0 0 0.25rem" }}>Admin Panel</h1>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>Department: <strong style={{ color: "var(--text)" }}>{dept}</strong></p>
      </div>

      {/* Row 1 — Stat Cards */}
      <div className="stats-grid">
        <StatCard title="Total Ideas" value={totalIdeas} subtitle={`${pendingIdeas.length} pending`} />
        <StatCard title="Pending Approval" value={pendingIdeas.length} accentColor="var(--warning)" />
        <StatCard title="Active Projects" value={activeProjects} accentColor="var(--success)" subtitle={`of ${projects.length} total`} />
        <StatCard title="Total Interns" value={interns.length} />
      </div>

      {/* Row 2 — Pending Ideas + Activity */}
      <div className="two-col">
        <div style={box}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <h2 style={sectionLabel}>Pending Approvals</h2>
            {pendingIdeas.length > 0 && (
              <span style={{ fontSize: "0.65rem", fontWeight: 700, backgroundColor: "var(--warning)", color: "#fff", padding: "0.1rem 0.5rem", borderRadius: "9999px" }}>
                {pendingIdeas.length}
              </span>
            )}
          </div>
          <PendingIdeasTable ideas={pendingIdeas as any} />
        </div>

        <div style={box}>
          <h2 style={{ ...sectionLabel, marginBottom: "1.25rem" }}>Recent Activity</h2>
          <ActivityFeed activities={recentActivity as any} />
        </div>
      </div>

      {/* Row 3 — Interns Table */}
      <div style={box}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <h2 style={sectionLabel}>Interns</h2>
          <span style={{ fontSize: "0.65rem", fontWeight: 700, backgroundColor: "var(--primary)", color: "#fff", padding: "0.1rem 0.5rem", borderRadius: "9999px" }}>
            {interns.length}
          </span>
        </div>
        <DataTable
          columns={internColumns}
          data={internRows}
          searchable
          searchPlaceholder="Search interns by name or email..."
          searchKeys={["name", "email"]}
          pageSize={10}
        />
      </div>

      {/* Row 4 — Projects Table */}
      <div style={box}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <h2 style={sectionLabel}>Projects</h2>
          <span style={{ fontSize: "0.65rem", fontWeight: 700, backgroundColor: "var(--success)", color: "#fff", padding: "0.1rem 0.5rem", borderRadius: "9999px" }}>
            {projects.length}
          </span>
        </div>
        <ProjectsTable
          columns={projectColumns}
          data={projectRows}
          department={dept}
          interns={interns.map(i => ({ id: i.id, name: i.name, department: i.department }))}
          allProjects={projects}
        />
      </div>
    </div>
  )
}
