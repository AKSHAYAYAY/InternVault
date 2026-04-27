"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { StatCard } from "@/components/ui/StatCard"
import { AddProjectModal } from "@/components/ui/AddProjectModal"
import { EditProjectModal } from "@/components/ui/EditProjectModal"
import { DeleteProjectButton } from "@/components/ui/DeleteProjectButton"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  dept: string
  activeBatch: { id: string; name: string; startDate: Date }
  stats: { totalIdeas: number; pendingIdeas: number; activeProjects: number; totalInterns: number }
  pendingIdeas: { id: string; title: string; tags: string[]; submittedBy: string; createdAt: Date }[]
  projects: any[]
  interns: { id: string; name: string; email: string; role: string }[]
  recentActivity: { type: "idea" | "project" | "version"; title: string; actor: string | null; status: string; date: Date }[]
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const box: React.CSSProperties = {
  backgroundColor: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: "0.5rem", padding: "1.5rem",
}
const sectionLabel: React.CSSProperties = {
  fontSize: "0.7rem", textTransform: "uppercase" as const,
  letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 700, margin: 0,
}
const btnPrimary: React.CSSProperties = {
  padding: "0.375rem 0.875rem", backgroundColor: "var(--primary)", color: "#fff",
  border: "none", borderRadius: "0.375rem", fontSize: "0.775rem", fontWeight: 600, cursor: "pointer",
}
const btnSuccess: React.CSSProperties = {
  padding: "0.3rem 0.7rem", backgroundColor: "transparent",
  border: "1px solid var(--success)", borderRadius: "0.25rem",
  fontSize: "0.725rem", fontWeight: 600, cursor: "pointer", color: "var(--success)",
}
const btnDanger: React.CSSProperties = {
  padding: "0.3rem 0.7rem", backgroundColor: "transparent",
  border: "1px solid var(--danger)", borderRadius: "0.25rem",
  fontSize: "0.725rem", fontWeight: 600, cursor: "pointer", color: "var(--danger)",
}
const statusColors: Record<string, { bg: string; color: string }> = {
  PENDING:     { bg: "rgba(180,83,9,0.1)",    color: "var(--warning)" },
  APPROVED:    { bg: "rgba(21,128,61,0.1)",   color: "var(--success)" },
  REJECTED:    { bg: "rgba(185,28,28,0.1)",   color: "var(--danger)" },
  IDEA:        { bg: "rgba(180,83,9,0.1)",    color: "var(--warning)" },
  IN_PROGRESS: { bg: "rgba(30,64,175,0.1)",   color: "var(--primary)" },
  COMPLETED:   { bg: "rgba(21,128,61,0.1)",   color: "var(--success)" },
  UPLOADED:    { bg: "rgba(21,128,61,0.1)",   color: "var(--success)" },
}

function StatusBadge({ status }: { status: string }) {
  const s = statusColors[status] ?? { bg: "var(--bg)", color: "var(--text-muted)" }
  return (
    <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "9999px", backgroundColor: s.bg, color: s.color, whiteSpace: "nowrap" as const }}>
      {status.replace("_", " ")}
    </span>
  )
}

const fmt = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

// ── Component ─────────────────────────────────────────────────────────────────

export function CoordinatorDashboard({ dept, activeBatch, stats, pendingIdeas, projects, interns, recentActivity }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [ideaLoading, setIdeaLoading] = useState<Record<string, boolean>>({})
  const [localIdeas, setLocalIdeas] = useState(pendingIdeas)
  const [projectFilter, setProjectFilter] = useState<"All" | "IDEA" | "IN_PROGRESS" | "COMPLETED">("All")

  const filteredProjects = useMemo(() =>
    projectFilter === "All" ? projects : projects.filter(p => p.status === projectFilter),
    [projects, projectFilter]
  )

  async function handleIdeaAction(id: string, action: "APPROVED" | "REJECTED") {
    setIdeaLoading(l => ({ ...l, [id]: true }))
    try {
      const res = await fetch(`/api/admin/ideas/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      })
      const data = await res.json()
      if (res.ok) {
        setLocalIdeas(prev => prev.filter(i => i.id !== id))
        toast.success(`Idea ${action.toLowerCase()}`)
        startTransition(() => router.refresh())
      } else {
        toast.error(data.error ?? data.message ?? "Failed to update idea")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIdeaLoading(l => ({ ...l, [id]: false }))
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.25rem" }}>
        <h1 style={{ fontFamily: "var(--font-playfair, serif)", fontSize: "1.875rem", fontWeight: 700, color: "var(--text)", margin: "0 0 0.25rem" }}>
          Coordinator Panel
        </h1>
        <p style={{ color: "var(--text-muted)", margin: "0 0 0.875rem", fontSize: "0.875rem" }}>
          {dept} — {activeBatch.name}
        </p>
        {/* Info pills */}
        <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
          {[
            { label: "Active Batch", value: activeBatch.name },
            { label: "Interns", value: stats.totalInterns },
            { label: "Projects", value: projects.length },
            { label: "Pending Ideas", value: stats.pendingIdeas },
          ].map(({ label, value }) => (
            <span key={label} style={{ fontSize: "0.75rem", padding: "0.25rem 0.75rem", backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "9999px", color: "var(--text-muted)" }}>
              <strong style={{ color: "var(--text)" }}>{value}</strong> {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="cd-stats">
        <StatCard title="Total Ideas" value={stats.totalIdeas} accentColor="var(--warning)" />
        <StatCard title="Pending Approval" value={stats.pendingIdeas} subtitle="Needs review" accentColor="var(--danger)" />
        <StatCard title="Active Projects" value={stats.activeProjects} accentColor="var(--primary)" />
        <StatCard title="Total Interns" value={stats.totalInterns} subtitle="In current batch" accentColor="var(--success)" />
      </div>

      {/* ── Main 70/30 grid ─────────────────────────────────────────────── */}
      <div className="cd-grid">

        {/* LEFT — main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Pending Approvals */}
          <div style={box}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <p style={sectionLabel}>
                Pending Approvals
                {localIdeas.length > 0 && (
                  <span style={{ marginLeft: "0.5rem", backgroundColor: "var(--danger)", color: "#fff", fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "9999px" }}>
                    {localIdeas.length}
                  </span>
                )}
              </p>
              <Link href="/dashboard/ideas" style={{ fontSize: "0.75rem", color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}>
                View All Ideas →
              </Link>
            </div>

            {localIdeas.length === 0 ? (
              <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", textAlign: "center", padding: "1.5rem 0", margin: 0 }}>
                No pending ideas — all caught up ✓
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="cd-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Submitted By</th>
                      <th>Tags</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localIdeas.slice(0, 5).map(idea => (
                      <tr key={idea.id}>
                        <td style={{ fontWeight: 600, maxWidth: 200 }}>
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{idea.title}</span>
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>{idea.submittedBy}</td>
                        <td>
                          <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                            {idea.tags.slice(0, 2).map(t => (
                              <span key={t} style={{ fontSize: "0.6rem", padding: "0.1rem 0.4rem", backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "0.25rem", color: "var(--text-muted)" }}>{t}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmt(idea.createdAt)}</td>
                        <td>
                          <div style={{ display: "flex", gap: "0.375rem" }}>
                            <button
                              style={{ ...btnSuccess, opacity: ideaLoading[idea.id] ? 0.5 : 1 }}
                              disabled={!!ideaLoading[idea.id]}
                              onClick={() => handleIdeaAction(idea.id, "APPROVED")}
                            >
                              Approve
                            </button>
                            <button
                              style={{ ...btnDanger, opacity: ideaLoading[idea.id] ? 0.5 : 1 }}
                              disabled={!!ideaLoading[idea.id]}
                              onClick={() => handleIdeaAction(idea.id, "REJECTED")}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Projects Overview */}
          <div style={box}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <p style={sectionLabel}>Projects Overview</p>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                {(["All", "IDEA", "IN_PROGRESS", "COMPLETED"] as const).map(f => (
                  <button
                    key={f}
                    className={`cd-filter-btn${projectFilter === f ? " active" : ""}`}
                    onClick={() => setProjectFilter(f)}
                  >
                    {f === "All" ? "All" : f === "IN_PROGRESS" ? "In Progress" : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
                <AddProjectModal department={dept} interns={interns} />
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", textAlign: "center", padding: "1.5rem 0", margin: 0 }}>
                No projects found.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="cd-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Batch</th>
                      <th>Members</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, maxWidth: 180 }}>
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                        </td>
                        <td><StatusBadge status={p.status} /></td>
                        <td style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>Batch {p.startedInBatch}</td>
                        <td style={{ color: "var(--text-muted)" }}>{p.memberCount}</td>
                        <td>
                          <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
                            <Link href={`/dashboard/projects/${p.id}`} style={{ fontSize: "0.7rem", padding: "0.2rem 0.55rem", border: "1px solid var(--primary)", borderRadius: "0.25rem", color: "var(--primary)", textDecoration: "none", whiteSpace: "nowrap" }}>
                              View
                            </Link>
                            <EditProjectModal project={p} department={dept} interns={interns} variant="table" />
                            <DeleteProjectButton projectId={p.id} variant="table" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT — sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Batch Summary */}
          <div style={{ ...box, borderTop: "3px solid var(--success)" }}>
            <p style={{ ...sectionLabel, marginBottom: "1rem" }}>Batch Summary</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", fontSize: "0.825rem" }}>
              {[
                { label: "Batch", value: activeBatch.name },
                { label: "Department", value: dept },
                { label: "Started", value: fmt(activeBatch.startDate) },
                { label: "Interns", value: stats.totalInterns },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>{label}</span>
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>{value}</span>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard/interns"
              style={{ ...btnPrimary, display: "block", textAlign: "center", textDecoration: "none", marginTop: "1rem" }}
            >
              Manage Interns
            </Link>
          </div>

          {/* Recent Activity */}
          <div style={box}>
            <p style={{ ...sectionLabel, marginBottom: "1rem" }}>Recent Activity</p>
            {recentActivity.length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>No recent activity.</p>
            ) : (
              <div>
                {recentActivity.map((a, i) => (
                  <div key={i} className="cd-activity-item">
                    <span style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.65rem", fontWeight: 700,
                      backgroundColor: a.type === "idea" ? "rgba(180,83,9,0.1)" : a.type === "version" ? "rgba(21,128,61,0.1)" : "rgba(30,64,175,0.1)",
                      color: a.type === "idea" ? "var(--warning)" : a.type === "version" ? "var(--success)" : "var(--primary)",
                    }}>
                      {a.type === "idea" ? "💡" : a.type === "version" ? "📦" : "📁"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "0.775rem", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.title}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        {a.actor ? `${a.actor} · ` : ""}{fmt(a.date)}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
