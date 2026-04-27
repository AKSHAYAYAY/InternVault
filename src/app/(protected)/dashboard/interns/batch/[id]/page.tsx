import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { isCoordinator } from "@/lib/batchHelpers"
import { Department } from "@prisma/client"
import Link from "next/link"

export default async function CoordinatorBatchDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const dept = session.user.department as Department
  const coordCheck = await isCoordinator(session.user.id!, dept)
  if (!coordCheck) redirect("/dashboard")

  const batch = await prisma.batch.findUnique({
    where: { id: params.id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
      projects: {
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true, status: true, startedInBatch: true, techStack: true },
      },
    },
  })

  if (!batch) notFound()

  // Coordinator can only view batches from their own department
  if (batch.department !== dept) redirect("/dashboard/interns")

  const coordinators = batch.members.filter(m => m.batchRole === "COORDINATOR").map(m => m.user)
  const interns = batch.members.filter(m => m.batchRole === "INTERN").map(m => m.user)

  const fmt = (d: Date) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

  const statusColor: Record<string, string> = {
    COMPLETED: "var(--success)", IN_PROGRESS: "var(--primary)", IDEA: "var(--warning)",
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em",
    color: "var(--text-muted)", fontWeight: 700, margin: "0 0 0.875rem",
  }
  const box: React.CSSProperties = {
    backgroundColor: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "0.5rem", padding: "1.5rem",
  }
  const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: "0.825rem" }
  const th: React.CSSProperties = {
    padding: "0.5rem 0.875rem", textAlign: "left", fontSize: "0.65rem", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)",
    borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg)",
  }
  const td: React.CSSProperties = {
    padding: "0.625rem 0.875rem", borderBottom: "1px solid var(--border)", color: "var(--text)",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* Back */}
      <Link href="/dashboard/interns" style={{ fontSize: "0.825rem", color: "var(--text-muted)", textDecoration: "none" }}>
        ← Back to Manage Interns
      </Link>

      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
          <h1 style={{ fontFamily: "var(--font-playfair, serif)", fontSize: "1.875rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
            {batch.name}
          </h1>
          <span style={{
            fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "9999px",
            backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)",
          }}>
            CLOSED
          </span>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.825rem", margin: "0 0 0.25rem" }}>
          {fmt(batch.startDate)}{batch.endDate ? ` — ${fmt(batch.endDate)}` : ""}
        </p>
        {coordinators[0] && (
          <p style={{ color: "var(--text-muted)", fontSize: "0.825rem", margin: 0 }}>
            Coordinator: <strong style={{ color: "var(--text)" }}>{coordinators[0].name}</strong> · {coordinators[0].email}
          </p>
        )}
      </div>

      {/* Read-only notice */}
      <div style={{
        backgroundColor: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)",
        borderRadius: "0.375rem", padding: "0.75rem 1rem", fontSize: "0.825rem", color: "var(--primary)",
      }}>
        ℹ This is a past batch. All data is read-only.
      </div>

      {/* Interns */}
      <div style={box}>
        <p style={sectionLabel}>Interns ({interns.length})</p>
        {interns.length === 0 ? (
          <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", margin: 0 }}>No interns in this batch.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Name</th>
                  <th style={th}>Email</th>
                </tr>
              </thead>
              <tbody>
                {interns.map((intern, i) => (
                  <tr key={intern.id}>
                    <td style={{ ...td, fontWeight: 600, borderBottom: i < interns.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <Link href={`/dashboard/profile/${intern.id}`} style={{ color: "var(--primary)", textDecoration: "none" }}>
                        {intern.name}
                      </Link>
                    </td>
                    <td style={{ ...td, color: "var(--text-muted)", borderBottom: i < interns.length - 1 ? "1px solid var(--border)" : "none" }}>
                      {intern.email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Projects */}
      {batch.projects.length > 0 && (
        <div style={box}>
          <p style={sectionLabel}>Projects ({batch.projects.length})</p>
          <div style={{ overflowX: "auto" }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Name</th>
                  <th style={th}>Status</th>
                  <th style={th}>Batch</th>
                </tr>
              </thead>
              <tbody>
                {batch.projects.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ ...td, fontWeight: 600, borderBottom: i < batch.projects.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <Link href={`/dashboard/projects/${p.id}`} style={{ color: "var(--primary)", textDecoration: "none" }}>
                        {p.name}
                      </Link>
                    </td>
                    <td style={{ ...td, borderBottom: i < batch.projects.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <span style={{
                        fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem",
                        borderRadius: "9999px", backgroundColor: "var(--bg)",
                        color: statusColor[p.status] ?? "var(--text-muted)",
                      }}>
                        {p.status.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ ...td, color: "var(--text-muted)", borderBottom: i < batch.projects.length - 1 ? "1px solid var(--border)" : "none" }}>
                      Batch {p.startedInBatch}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
