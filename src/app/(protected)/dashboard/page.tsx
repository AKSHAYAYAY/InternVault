import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { getUserBatchContext } from "@/lib/batchHelpers"
import { Department } from "@prisma/client"
import { StatCard } from "@/components/ui/StatCard"
import { ProfileBanner } from "@/components/ui/ProfileBanner"
import { CoordinatorDashboard } from "@/components/ui/CoordinatorDashboard"
import { InternDashboard } from "@/components/ui/InternDashboard"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role === "SUPER_ADMIN") redirect("/superadmin")

  const dept = session.user.department as Department | null
  const role = session.user.role

  const ctx = dept
    ? await getUserBatchContext(session.user.id!, dept)
    : { activeBatch: null, pastBatch: null, batchRole: null, isReadOnly: false }

  const { activeBatch, pastBatch, isReadOnly } = ctx
  const currentBatch = activeBatch ?? pastBatch

  const profileUser = await prisma.user.findUnique({
    where: { id: session.user.id! },
    select: { githubLink: true, linkedinLink: true },
  })

  // ── COORDINATOR full dashboard ──────────────────────────────────────────
  if (role === "COORDINATOR" && activeBatch) {
    const [ideas, projects, batchMembers] = await Promise.all([
      prisma.idea.findMany({
        where: { department: dept as Department },
        include: { submittedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.project.findMany({
        where: { department: dept as Department },
        include: {
          members: { include: { user: { select: { id: true, name: true } } } },
          _count: { select: { contributions: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.batchMember.findMany({
        where: { batchId: activeBatch.id },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      }),
    ])

    const interns = batchMembers.filter((m: any) => m.batchRole === "INTERN").map((m: any) => m.user)
    const pendingIdeas = ideas.filter((i: any) => i.status === "PENDING")
    const activeProjects = projects.filter((p: any) => p.status === "IN_PROGRESS").length

    const recentActivity = [
      ...ideas.slice(0, 5).map((i: any) => ({
        type: "idea" as const,
        title: i.title,
        actor: i.submittedBy.name,
        status: i.status,
        date: i.createdAt,
      })),
      ...projects.slice(0, 5).map((p: any) => ({
        type: "project" as const,
        title: p.name,
        actor: null,
        status: p.status,
        date: p.updatedAt,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <ProfileBanner hasGithub={!!profileUser?.githubLink} hasLinkedin={!!profileUser?.linkedinLink} />

        <CoordinatorDashboard
          dept={dept!}
          activeBatch={{ id: activeBatch.id, name: activeBatch.name, startDate: activeBatch.startDate }}
          stats={{
            totalIdeas: ideas.length,
            pendingIdeas: pendingIdeas.length,
            activeProjects,
            totalInterns: interns.length,
          }}
          pendingIdeas={pendingIdeas.map(i => ({
            id: i.id, title: i.title, tags: i.tags,
            submittedBy: i.submittedBy.name, createdAt: i.createdAt,
          }))}
          projects={projects.map(p => ({
            id: p.id, name: p.name, status: p.status,
            startedInBatch: p.startedInBatch, techStack: p.techStack,
            memberCount: p.members.length,
            members: p.members,
            description: p.description,
            problemStatement: p.problemStatement,
            continuedInBatches: p.continuedInBatches,
            tags: p.tags,
            githubLink: p.githubLink,
            prdLink: p.prdLink,
            workingModelLink: p.workingModelLink,
            figmaLink: p.figmaLink,
            presentationLink: p.presentationLink,
          }))}
          interns={interns}
          recentActivity={recentActivity}
        />
      </div>
    )
  }

  // ── COORDINATOR no active batch ─────────────────────────────────────────
  if (role === "COORDINATOR") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <ProfileBanner hasGithub={!!profileUser?.githubLink} hasLinkedin={!!profileUser?.linkedinLink} />
        <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem" }}>
          <h1 style={{ fontFamily: "var(--font-playfair, serif)", fontSize: "1.875rem", fontWeight: 700, color: "var(--text)", margin: "0 0 0.25rem" }}>Coordinator Panel</h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.875rem" }}>{dept} — No active batch</p>
        </div>
        <div style={{ backgroundColor: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "0.5rem", padding: "2.5rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>No active batch assigned. Contact Super Admin to create one.</p>
        </div>
      </div>
    )
  }

  // ── INTERN view ─────────────────────────────────────────────────────────
  const batchLabel = currentBatch ? `${dept} — ${currentBatch.name}` : dept ? `${dept} — No active batch` : "No department assigned"

  const userId = session.user.id!

  // No department — show minimal view
  if (!dept) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <ProfileBanner hasGithub={!!profileUser?.githubLink} hasLinkedin={!!profileUser?.linkedinLink} />
        <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.25rem" }}>
          <h1 style={{ fontFamily: "var(--font-playfair, serif)", fontSize: "1.875rem", fontWeight: 700, color: "var(--text)", margin: "0 0 0.25rem" }}>Intern Portal</h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.875rem" }}>No department assigned</p>
        </div>
        <div style={{ backgroundColor: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "0.5rem", padding: "2.5rem", textAlign: "center" }}>
          <p style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>📋</p>
          <p style={{ fontWeight: 600, color: "var(--text)", margin: "0 0 0.25rem" }}>No department assigned</p>
          <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", margin: 0 }}>Contact your coordinator or Super Admin to be assigned to a batch.</p>
        </div>
      </div>
    )
  }

  const [myIdeas, myContributions, continuableProjects, myProjectIds] = await Promise.all([
    prisma.idea.findMany({
      where: { submittedById: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, createdAt: true, tags: true },
    }),
    prisma.contribution.findMany({
      where: { internId: userId },
      orderBy: { date: "desc" },
      take: 5,
      include: { project: { select: { id: true, name: true } } },
    }),
    // Completed projects in this dept that the intern is NOT already a member of
    prisma.project.findMany({
      where: {
        department: dept,
        status: "COMPLETED",
        members: { none: { userId } },
      },
      select: { id: true, name: true, startedInBatch: true, techStack: true, description: true },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    }),
  ])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <ProfileBanner hasGithub={!!profileUser?.githubLink} hasLinkedin={!!profileUser?.linkedinLink} />
      <InternDashboard
        name={session.user.name ?? "Intern"}
        dept={dept ?? ""}
        batchLabel={batchLabel}
        isReadOnly={isReadOnly}
        pastBatchName={pastBatch?.name ?? null}
        stats={{
          projectsJoined: myProjectIds.length,
          ideasSubmitted: myIdeas.length,
          contributions: myContributions.length,
        }}
        myIdeas={myIdeas.map(i => ({ id: i.id, title: i.title, status: i.status, createdAt: i.createdAt, tags: i.tags }))}
        myContributions={myContributions.map(c => ({ id: c.id, description: c.description, date: c.date, batchNumber: c.batchNumber, project: c.project }))}
        continuableProjects={continuableProjects}
        userId={userId}
      />
    </div>
  )
}
