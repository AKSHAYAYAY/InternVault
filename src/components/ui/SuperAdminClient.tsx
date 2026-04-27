"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { StatCard } from "@/components/ui/StatCard"
import Link from "next/link"
import { PasswordInput } from "@/components/ui/PasswordInput"

const DEPARTMENTS = ["IT", "REVENUE", "LAWS", "AICSTL"]

const box: React.CSSProperties = {
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  padding: "1.5rem",
}

const label: React.CSSProperties = {
  fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em",
  color: "var(--text-muted)", fontWeight: 700,
}

const badge = (active: boolean): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: "0.3rem",
  fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em",
  padding: "0.2rem 0.6rem", borderRadius: "9999px",
  backgroundColor: active ? "rgba(21,128,61,0.12)" : "var(--bg)",
  color: active ? "var(--success)" : "var(--text-muted)",
  border: `1px solid ${active ? "var(--success)" : "var(--border)"}`,
})

const btnPrimary: React.CSSProperties = {
  padding: "0.5rem 1.125rem", backgroundColor: "var(--primary)", color: "#fff",
  border: "none", borderRadius: "0.375rem", fontSize: "0.825rem",
  fontWeight: 600, cursor: "pointer",
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

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.5rem 0.75rem",
  border: "1px solid var(--border)", borderRadius: "0.375rem",
  backgroundColor: "var(--bg)", color: "var(--text)", fontSize: "0.875rem",
}

interface SuperAdminClientProps {
  overview: { totalInterns: number; totalProjects: number; totalIdeas: number; activeBatchCount: number }
  batchesByDept: Record<string, any[]>
  allUsers: { id: string; name: string; email: string; role: string; department: string | null }[]
  departments: string[]
}

export function SuperAdminClient({ overview, batchesByDept, allUsers, departments }: SuperAdminClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeDept, setActiveDept] = useState(DEPARTMENTS[0])
  const [showModal, setShowModal] = useState(false)
  const [coordMode, setCoordMode] = useState<"existing" | "create">("create")
  const [coordSearch, setCoordSearch] = useState("")
  const [selectedCoord, setSelectedCoord] = useState<{ id: string; name: string; email: string } | null>(null)
  const [newCoord, setNewCoord] = useState({ name: "", email: "", password: "" })
  const [newCoordError, setNewCoordError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [closeConfirm, setCloseConfirm] = useState<string | null>(null)
  const [closingId, setClosingId] = useState<string | null>(null)

  const deptBatches = batchesByDept[activeDept] ?? []
  const activeBatch = deptBatches.find(b => b.isActive) ?? null
  const historyBatches = deptBatches.filter(b => !b.isActive)
  const nextBatchNumber = (deptBatches[0]?.batchNumber ?? 0) + 1

  const filteredCoords = useMemo(() => {
    const q = coordSearch.toLowerCase()
    return allUsers.filter(u =>
      (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    ).slice(0, 8)
  }, [allUsers, coordSearch])

  async function handleCreateBatch() {
    setNewCoordError("")
    let coordinatorId = selectedCoord?.id

    // If creating new account, do that first
    if (coordMode === "create") {
      if (!newCoord.name.trim() || !newCoord.email.trim() || !newCoord.password.trim()) {
        setNewCoordError("All fields are required.")
        return
      }
      if (newCoord.password.length < 8) {
        setNewCoordError("Password must be at least 8 characters.")
        return
      }
      setSubmitting(true)
      try {
        const res = await fetch("/api/superadmin/coordinator", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...newCoord, department: activeDept }),
        })
        const data = await res.json()
        if (!res.ok) { setNewCoordError(data.message ?? "Failed to create account."); setSubmitting(false); return }
        coordinatorId = data.data.user.id
      } catch { setNewCoordError("Something went wrong."); setSubmitting(false); return }
    } else {
      if (!coordinatorId) return
      setSubmitting(true)
    }

    try {
      const res = await fetch("/api/superadmin/batches", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department: activeDept, coordinatorId }),
      })
      if (res.ok) {
        setShowModal(false)
        setSelectedCoord(null)
        setCoordSearch("")
        setNewCoord({ name: "", email: "", password: "" })
        setNewCoordError("")
        startTransition(() => router.refresh())
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCloseBatch(batchId: string) {
    setClosingId(batchId)
    try {
      await fetch(`/api/superadmin/batches/${batchId}/close`, { method: "PATCH", credentials: "include" })
      setCloseConfirm(null)
      startTransition(() => router.refresh())
    } finally {
      setClosingId(null)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      <style>{`
        .sa-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 1.25rem; }
        .sa-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); }
        .sa-tab { padding: 0.625rem 1.25rem; font-size: 0.825rem; font-weight: 600; cursor: pointer; border: none; background: transparent; color: var(--text-muted); border-bottom: 2px solid transparent; transition: all 0.15s; }
        .sa-tab.active { color: var(--primary); border-bottom-color: var(--primary); }
        .sa-tab:hover:not(.active) { color: var(--text); }
        .sa-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .sa-modal { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; width: 100%; max-width: 480px; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .sa-coord-list { border: 1px solid var(--border); border-radius: 0.375rem; max-height: 180px; overflow-y: auto; }
        .sa-coord-item { padding: 0.625rem 0.875rem; cursor: pointer; font-size: 0.825rem; border-bottom: 1px solid var(--border); transition: background 0.1s; }
        .sa-coord-item:last-child { border-bottom: none; }
        .sa-coord-item:hover { background: var(--bg); }
        .sa-coord-item.selected { background: rgba(30,64,175,0.08); color: var(--primary); }
        .sa-hist-table { width: 100%; border-collapse: collapse; font-size: 0.825rem; }
        .sa-hist-table th { padding: 0.625rem 1rem; text-align: left; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); border-bottom: 1px solid var(--border); background: var(--bg); }
        .sa-hist-table td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; }
        .sa-hist-table tr:last-child td { border-bottom: none; }
        .sa-hist-table tr:hover td { background: var(--bg); }
        @media (max-width: 1024px) { .sa-stats { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 640px) { .sa-stats { grid-template-columns: 1fr; } }
      `}</style>

      {/* Stats Row */}
      <div className="sa-stats">
        <StatCard title="Total Interns" value={overview.totalInterns} accentColor="var(--primary)" />
        <StatCard title="Total Projects" value={overview.totalProjects} accentColor="var(--success)" />
        <StatCard title="Total Ideas" value={overview.totalIdeas} accentColor="var(--warning)" />
        <StatCard title="Active Batches" value={overview.activeBatchCount} accentColor="var(--danger)" />
      </div>

      {/* Department Tabs */}
      <div style={box}>
        <div className="sa-tabs" style={{ marginBottom: "1.75rem" }}>
          {DEPARTMENTS.map(dept => (
            <button
              key={dept}
              className={`sa-tab${activeDept === dept ? " active" : ""}`}
              onClick={() => setActiveDept(dept)}
            >
              {dept}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {/* Active Batch Card */}
          {activeBatch ? (
            <div style={{
              border: "1px solid var(--success)", borderRadius: "0.625rem",
              padding: "1.5rem", backgroundColor: "rgba(21,128,61,0.04)",
              display: "flex", flexDirection: "column", gap: "1rem",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                      {activeBatch.name}
                    </h2>
                    <span style={badge(true)}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--success)", display: "inline-block" }} />
                      ACTIVE
                    </span>
                  </div>
                  {activeBatch.coordinator && (
                    <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", margin: 0 }}>
                      Coordinator: <strong style={{ color: "var(--text)" }}>{activeBatch.coordinator.name}</strong>
                      {" · "}{activeBatch.coordinator.email}
                    </p>
                  )}
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                    Started {new Date(activeBatch.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <Link href={`/superadmin/batches/${activeBatch.id}`} style={{ ...btnOutline, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                    View Batch Details
                  </Link>
                  <button style={btnDanger} onClick={() => setCloseConfirm(activeBatch.id)}>
                    Close Batch
                  </button>
                </div>
              </div>

              {/* Counts */}
              <div style={{ display: "flex", gap: "2rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                {[
                  { label: "Interns", value: activeBatch.internCount },
                  { label: "Projects", value: activeBatch.projectCount },
                  { label: "Ideas", value: activeBatch.ideaCount },
                ].map(({ label: l, value }) => (
                  <div key={l} style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                    <span style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--primary)", fontFamily: "var(--font-playfair, serif)" }}>{value}</span>
                    <span style={{ ...label, fontSize: "0.65rem" }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ ...box, border: "1px dashed var(--border)", textAlign: "center", padding: "2rem" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: "0 0 1rem" }}>
                No active batch for {activeDept}
              </p>
            </div>
          )}

          {/* Start New Batch */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button style={btnPrimary} onClick={() => setShowModal(true)}>
              + Start New Batch
            </button>
          </div>

          {/* Batch History Table */}
          {historyBatches.length > 0 && (
            <div>
              <p style={{ ...label, marginBottom: "0.875rem" }}>Batch History</p>
              <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "0.5rem" }}>
                <table className="sa-hist-table">
                  <thead>
                    <tr>
                      <th>Batch</th>
                      <th>Coordinator</th>
                      <th>Interns</th>
                      <th>Projects</th>
                      <th>Ideas</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyBatches.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 600 }}>{b.name}</td>
                        <td style={{ color: "var(--text-muted)" }}>{b.coordinator?.email ?? "—"}</td>
                        <td>{b.internCount}</td>
                        <td>{b.projectCount}</td>
                        <td>{b.ideaCount}</td>
                        <td>
                          <span style={badge(false)}>CLOSED</span>
                        </td>
                        <td>
                          <Link
                            href={`/superadmin/batches/${b.id}`}
                            style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", border: "1px solid var(--border)", borderRadius: "0.25rem", color: "var(--text)", textDecoration: "none" }}
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Batch Modal */}
      {showModal && (
        <div className="sa-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="sa-modal">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>Start New Batch</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "var(--text-muted)" }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Department (locked) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label style={label}>Department</label>
                <input value={activeDept} disabled style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }} />
              </div>

              {/* Mode toggle */}
              <div style={{ display: "flex", gap: "0", border: "1px solid var(--border)", borderRadius: "0.375rem", overflow: "hidden" }}>
                {(["create", "existing"] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => { setCoordMode(mode); setNewCoordError(""); setSelectedCoord(null); setCoordSearch("") }}
                    style={{
                      flex: 1, padding: "0.5rem", border: "none", cursor: "pointer",
                      fontSize: "0.8rem", fontWeight: 600,
                      backgroundColor: coordMode === mode ? "var(--primary)" : "var(--bg)",
                      color: coordMode === mode ? "#fff" : "var(--text-muted)",
                      transition: "all 0.15s",
                    }}
                  >
                    {mode === "create" ? "Create New Account" : "Select Existing User"}
                  </button>
                ))}
              </div>

              {/* Create new coordinator */}
              {coordMode === "create" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {[
                    { key: "name", label: "Full Name", type: "text", placeholder: "e.g. Rahul Sharma" },
                    { key: "email", label: "Email", type: "email", placeholder: "e.g. rahul@example.com" },
                  ].map(({ key, label: lbl, type, placeholder }) => (
                    <div key={key} style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      <label style={label}>{lbl}</label>
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={newCoord[key as keyof typeof newCoord]}
                        onChange={e => setNewCoord(f => ({ ...f, [key]: e.target.value }))}
                        autoComplete="off"
                        style={inputStyle}
                      />
                    </div>
                  ))}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    <label style={label}>Temporary Password (min 8 chars)</label>
                    <PasswordInput
                      name="password"
                      placeholder="••••••••"
                      value={newCoord.password}
                      onChange={e => setNewCoord(f => ({ ...f, password: e.target.value }))}
                      style={inputStyle}
                      autoComplete="new-password"
                    />
                  </div>
                  {newCoordError && (
                    <p style={{ fontSize: "0.8rem", color: "var(--danger)", margin: 0 }}>{newCoordError}</p>
                  )}
                </div>
              )}

              {/* Select existing coordinator */}
              {coordMode === "existing" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={label}>Search User</label>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={coordSearch}
                    onChange={e => { setCoordSearch(e.target.value); setSelectedCoord(null) }}
                    style={inputStyle}
                  />
                  {coordSearch && !selectedCoord && (
                    <div className="sa-coord-list">
                      {filteredCoords.length === 0 ? (
                        <div style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>No users found</div>
                      ) : filteredCoords.map(u => (
                        <div
                          key={u.id}
                          className="sa-coord-item"
                          onClick={() => { setSelectedCoord(u); setCoordSearch(u.name) }}
                        >
                          <span style={{ fontWeight: 600 }}>{u.name}</span>
                          <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem" }}>{u.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedCoord && (
                    <div style={{ fontSize: "0.8rem", color: "var(--success)", padding: "0.375rem 0" }}>
                      ✓ {selectedCoord.name} ({selectedCoord.email})
                    </div>
                  )}
                </div>
              )}

              {/* Preview */}
              <div style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "0.375rem", padding: "0.875rem 1rem", fontSize: "0.825rem" }}>
                <p style={{ margin: "0 0 0.25rem", fontWeight: 600, color: "var(--text)" }}>
                  This will create: <span style={{ color: "var(--primary)" }}>{activeDept} Batch {nextBatchNumber}</span>
                </p>
                {activeBatch && (
                  <p style={{ margin: 0, color: "var(--warning)", fontSize: "0.775rem" }}>
                    ⚠ Previous batch ({activeBatch.name}) will be closed automatically.
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button style={btnOutline} onClick={() => setShowModal(false)}>Cancel</button>
              <button
                style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }}
                disabled={submitting}
                onClick={handleCreateBatch}
              >
                {submitting ? "Creating..." : "Create Batch & Assign Coordinator"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Batch Confirmation */}
      {closeConfirm && (
        <div className="sa-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setCloseConfirm(null) }}>
          <div className="sa-modal" style={{ maxWidth: 400 }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>Close Batch?</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
              This will mark <strong style={{ color: "var(--text)" }}>{activeBatch?.name}</strong> as closed and set today as the end date. This action cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button style={btnOutline} onClick={() => setCloseConfirm(null)}>Cancel</button>
              <button
                style={{ ...btnDanger, backgroundColor: "var(--danger)", color: "#fff", opacity: closingId ? 0.6 : 1 }}
                disabled={!!closingId}
                onClick={() => handleCloseBatch(closeConfirm)}
              >
                {closingId ? "Closing..." : "Yes, Close Batch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
