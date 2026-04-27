"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const badge = (active: boolean): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: "0.3rem",
  fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em",
  padding: "0.2rem 0.6rem", borderRadius: "9999px",
  backgroundColor: active ? "rgba(21,128,61,0.12)" : "var(--bg)",
  color: active ? "var(--success)" : "var(--text-muted)",
  border: `1px solid ${active ? "var(--success)" : "var(--border)"}`,
})

const statusColor: Record<string, string> = {
  COMPLETED: "var(--success)", IN_PROGRESS: "var(--primary)",
  IDEA: "var(--warning)", ACTIVE: "var(--success)", CLOSED: "var(--text-muted)",
}

const btnOutline: React.CSSProperties = {
  padding: "0.5rem 1.125rem", backgroundColor: "transparent",
  border: "1px solid var(--border)", borderRadius: "0.375rem",
  fontSize: "0.825rem", fontWeight: 500, cursor: "pointer", color: "var(--text)",
}

const btnDanger: React.CSSProperties = {
  padding: "0.5rem 1.125rem", backgroundColor: "transparent",
  border: "1px solid var(--danger)", borderRadius: "0.375rem",
  fontSize: "0.825rem", fontWeight: 600, cursor: "pointer", color: "var(--danger)",
}

interface BatchDetailProps {
  batch: {
    id: string; name: string; department: string; batchNumber: number
    isActive: boolean; startDate: Date; endDate: Date | null
  }
  coordinators: { id: string; name: string; email: string }[]
  interns: { id: string; name: string; email: string }[]
  projects: { id: string; name: string; status: string; techStack: string[]; updatedAt: Date }[]
}

const TABS = ["Coordinators", "Interns", "Projects"] as const
type Tab = typeof TABS[number]

export function SuperAdminBatchDetail({ batch, coordinators, interns, projects }: BatchDetailProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<Tab>("Coordinators")
  const [showConfirm, setShowConfirm] = useState(false)
  const [closing, setClosing] = useState(false)

  const fmt = (d: Date | null) => d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "Present"

  async function handleClose() {
    setClosing(true)
    try {
      await fetch(`/api/superadmin/batches/${batch.id}/close`, { method: "PATCH", credentials: "include" })
      setShowConfirm(false)
      startTransition(() => router.refresh())
    } finally {
      setClosing(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <style>{`
        .bd-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); }
        .bd-tab { padding: 0.625rem 1.25rem; font-size: 0.825rem; font-weight: 600; cursor: pointer; border: none; background: transparent; color: var(--text-muted); border-bottom: 2px solid transparent; transition: all 0.15s; }
        .bd-tab.active { color: var(--primary); border-bottom-color: var(--primary); }
        .bd-tab:hover:not(.active) { color: var(--text); }
        .bd-table { width: 100%; border-collapse: collapse; font-size: 0.825rem; }
        .bd-table th { padding: 0.625rem 1rem; text-align: left; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); border-bottom: 1px solid var(--border); background: var(--bg); }
        .bd-table td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; }
        .bd-table tr:last-child td { border-bottom: none; }
        .bd-table tr:hover td { background: var(--bg); }
        .bd-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .bd-modal { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; width: 100%; max-width: 400px; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
      `}</style>

      {/* Back */}
      <Link href="/superadmin" style={{ fontSize: "0.825rem", color: "var(--text-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
        ← Back to Overview
      </Link>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: "var(--font-playfair, serif)", fontSize: "1.75rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
              {batch.department} — {batch.name}
            </h1>
            <span style={badge(batch.isActive)}>
              {batch.isActive && <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--success)", display: "inline-block" }} />}
              {batch.isActive ? "ACTIVE" : "CLOSED"}
            </span>
          </div>
          <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", margin: 0 }}>
            {fmt(batch.startDate)} — {fmt(batch.endDate)}
          </p>
          {coordinators[0] && (
            <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", margin: 0 }}>
              Coordinator: <strong style={{ color: "var(--text)" }}>{coordinators[0].name}</strong> · {coordinators[0].email}
            </p>
          )}
        </div>
        {batch.isActive && (
          <button style={btnDanger} onClick={() => setShowConfirm(true)}>
            Close Batch
          </button>
        )}
      </div>

      {/* Read-only notice */}
      <div style={{
        backgroundColor: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)",
        borderRadius: "0.375rem", padding: "0.75rem 1rem",
        fontSize: "0.825rem", color: "var(--primary)",
      }}>
        ℹ Coordinator manages intern membership for this batch.
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.5rem", overflow: "hidden" }}>
        <div className="bd-tabs" style={{ padding: "0 1.5rem", borderBottom: "1px solid var(--border)" }}>
          {TABS.map(t => (
            <button key={t} className={`bd-tab${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>
              {t}
              <span style={{ marginLeft: "0.375rem", fontSize: "0.65rem", color: "var(--text-muted)" }}>
                ({t === "Coordinators" ? coordinators.length : t === "Interns" ? interns.length : projects.length})
              </span>
            </button>
          ))}
        </div>

        <div style={{ padding: "1.5rem" }}>
          {/* Coordinators Tab */}
          {activeTab === "Coordinators" && (
            <div style={{ overflowX: "auto" }}>
              {coordinators.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No coordinators assigned.</p>
              ) : (
                <table className="bd-table">
                  <thead><tr><th>Name</th><th>Email</th></tr></thead>
                  <tbody>
                    {coordinators.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td style={{ color: "var(--text-muted)" }}>{c.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Interns Tab */}
          {activeTab === "Interns" && (
            <div style={{ overflowX: "auto" }}>
              {interns.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No interns in this batch.</p>
              ) : (
                <table className="bd-table">
                  <thead><tr><th>Name</th><th>Email</th></tr></thead>
                  <tbody>
                    {interns.map(i => (
                      <tr key={i.id}>
                        <td style={{ fontWeight: 600 }}>{i.name}</td>
                        <td style={{ color: "var(--text-muted)" }}>{i.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === "Projects" && (
            <div style={{ overflowX: "auto" }}>
              {projects.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No projects in this batch.</p>
              ) : (
                <table className="bd-table">
                  <thead><tr><th>Name</th><th>Status</th><th>Tech Stack</th><th>Last Updated</th></tr></thead>
                  <tbody>
                    {projects.map(p => (
                      <tr key={p.id}>
                        <td>
                          <Link href={`/dashboard/projects/${p.id}`} style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
                            {p.name}
                          </Link>
                        </td>
                        <td>
                          <span style={{
                            fontSize: "0.7rem", fontWeight: 600, padding: "0.15rem 0.5rem",
                            borderRadius: "9999px", backgroundColor: "var(--bg)",
                            color: statusColor[p.status] ?? "var(--text-muted)",
                          }}>
                            {p.status.replace("_", " ")}
                          </span>
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.775rem" }}>
                          {p.techStack.slice(0, 3).join(", ") || "—"}
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>
                          {new Date(p.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Close Confirmation Modal */}
      {showConfirm && (
        <div className="bd-overlay" onClick={e => { if (e.target === e.currentTarget) setShowConfirm(false) }}>
          <div className="bd-modal">
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>Close Batch?</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
              This will mark <strong style={{ color: "var(--text)" }}>{batch.name}</strong> as closed with today as the end date. This cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button style={btnOutline} onClick={() => setShowConfirm(false)}>Cancel</button>
              <button
                style={{ ...btnDanger, backgroundColor: "var(--danger)", color: "#fff", opacity: closing ? 0.6 : 1 }}
                disabled={closing}
                onClick={handleClose}
              >
                {closing ? "Closing..." : "Yes, Close Batch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
