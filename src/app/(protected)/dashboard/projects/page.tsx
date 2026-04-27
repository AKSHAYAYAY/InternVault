import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { ProjectClient } from "@/components/ui/ProjectClient"
import { redirect } from "next/navigation"

export default async function ProjectsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const isAdmin = session.user.role === "COORDINATOR"
  const isSuperAdmin = session.user.role === "SUPER_ADMIN"
  const userDept = session.user.department

  const whereCondition: Prisma.ProjectWhereInput = isSuperAdmin ? {} : { department: (userDept as any) ?? undefined }

  const [rawProjects, batches] = await Promise.all([
    prisma.project.findMany({
      where: whereCondition,
      include: {
        members: { include: { user: { select: { name: true } } } },
        _count: { select: { contributions: true, files: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    userDept
      ? prisma.batch.findMany({
          where: { department: userDept as any },
          select: { batchNumber: true, isActive: true },
          orderBy: { batchNumber: "desc" },
        })
      : Promise.resolve([]),
  ])

  const projects = rawProjects.map(p => ({
    ...p,
    contributorCount: p.members.length,
    contributionCount: p._count.contributions,
  }))

  const interns = isAdmin && userDept
    ? await prisma.user.findMany({
        where: { department: userDept as any, role: "INTERN" },
        select: { id: true, name: true, email: true },
      })
    : []

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "2rem", color: "var(--text)", margin: "0 0 0.5rem 0" }}>
            Project Repository
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>
            Explore and continue projects across internship batches.
          </p>
        </div>
      </header>

      <ProjectClient
        projects={projects}
        isAdmin={isAdmin}
        department={userDept || "System"}
        interns={interns}
        batches={batches}
      />
    </div>
  )
}
