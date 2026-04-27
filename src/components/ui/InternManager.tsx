"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PasswordInput } from "@/components/ui/PasswordInput"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Intern {
  id: string
  name: string
  email: string
  joinedAt: Date | string
  projectsCount: number
}

interface EligibleUser {
  id: string
  name: string
  email: string
  role: string
}

interface PastBatch {
  id: string
  name: string
  batchNumber: number
  coordinator: { name: string; email: string } | null
  internCount: number
  projectCount: number
}

interface Props {
  batchId: string
  batchName: string
  department: string
  initialInterns: Intern[]
  eligibleUsers: EligibleUser[]
  pastBatches: PastBatch[]
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const btnPrimary: React.CSSProperties = {
  padding: "0.5rem 1.125rem", backgroundColor: "var(--primary)", color: "#fff",
  border: "none", borderRadius: "0.375rem", fontSize: "0.825rem", fontWeight: 600, cursor: "pointer",
}
const btnOutline: React.CSSProperties = {
  padding: "0.5rem 1.125rem", backgroundColor: "transparent",
  border: "1px solid var(--border)", borderRadius: "0.375rem",
  fontSize: "0.825rem", fontWeight: 500, cursor: "pointer", color: "var(--text)",
}
const btnDanger: React.CSSProperties = {
  padding: "0.375rem 0.75rem", backgroundColor: "transparent",
  border: "1px solid var(--danger)", borderRadius: "0.25rem",
  fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", color: "var(--danger)",
}
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.5rem 0.75rem",
  border: "1px solid var(--border)", borderRadius: "0.375rem",
  backgroundColor: "var(--bg)", color: "var(--text)", fontSize: "0.875rem", outline: "none",
}
const labelStyle: React.CSSProperties = {
  fontSize: "0.7rem", textTransform: "uppercase" as const,
  letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 700,
}

const PAGE_SIZE = 10

// ─── Component ────────────────────────────────────────────────────────────────

export function InternManager({ batchId, batchName, department, initialInterns, eligibleUsers, pastBatches }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  // Table state
  const [interns, setInterns] = useState<Intern[]>(initialInterns)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  // Modal state
  const [modal, setModal] = useState<"none" | "existing" | "create">("none")
  const [removeTarget, setRemoveTarget] = useState<Intern | null>(null)

  // Add existing
  const [existingSearch, setExistingSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [addingExisting, setAddingExisting] = useState(false)

  // Create new
  const [form, setForm] = useState({ name: "", email: "", password: "", addToBatch: true })
  const [formError, setFormError] = useState("")
  const [creating, setCreating] = useState(false)

  // Remove
  const [removing, setRemoving] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function closeModal() {
    setModal("none")
    setExistingSearch("")
    setSelected(new Set())
    setForm({ name: "", email: "", password: "", addToBatch: true })
    setFormError("")
  }

  // ── Filtered table ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return interns.filter(i =>
      i.name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q)
    )
  }, [interns, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Eligible users not yet in interns list ──────────────────────────────────
  const currentIds = new Set(interns.map(i => i.id))
  const filteredEligible = useMemo(() => {
    const q = existingSearch.toLowerCase()
    return eligibleUsers.filter(u =>
      !currentIds.has(u.id) &&
      (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    )
  }, [eligibleUsers, existingSearch, currentIds])

  // ── Add existing ────────────────────────────────────────────────────────────
  async function handleAddExisting() {
    if (selected.size === 0) return
    setAddingExisting(true)
    let added = 0
    const newInterns: Intern[] = []
    for (const userId of Array.from(selected)) {
      try {
        const res = await fetch("/api/coordinator/members/existing", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        })
        if (res.ok) {
          const user = eligibleUsers.find(u => u.id === userId)!
          newInterns.push({ id: user.id, name: user.name, email: user.email, joinedAt: new Date(), projectsCount: 0 })
          added++
        }
      } catch {}
    }
    setInterns(prev => [...prev, ...newInterns])
    setAddingExisting(false)
    closeModal()
    showToast(`${added} intern${added !== 1 ? "s" : ""} added to batch`)
    startTransition(() => router.refresh())
  }

  // ── Create new account ──────────────────────────────────────────────────────
  async function handleCreate() {
    setFormError("")
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError("All fields are required.")
      return
    }
    if (form.password.length < 8) {
      setFormError("Password must be at least 8 characters.")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/coordinator/members", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.message ?? "Failed to create account."); return }
      if (form.addToBatch) {
        setInterns(prev => [...prev, {
          id: data.data.user.id, name: data.data.user.name,
          email: data.data.user.email, joinedAt: new Date(), projectsCount: 0,
        }])
      }
      closeModal()
      showToast("Intern account created and added to batch")
      startTransition(() => router.refresh())
    } catch {
      setFormError("Something went wrong.")
    } finally {
      setCreating(false)
    }
  }

  // ── Remove intern ───────────────────────────────────────────────────────────
  async function handleRemove() {
    if (!removeTarget) return
    setRemoving(true)
    try {
      const res = await fetch(`/api/coordinator/members/${removeTarget.id}`, { method: "DELETE", credentials: "include" })
      if (res.ok) {
        setInterns(prev => prev.filter(i => i.id !== removeTarget.id))
        showToast(`${removeTarget.name} removed from batch`)
        startTransition(() => router.refresh())
      } else {
        const d = await res.json()
        showToast(d.message ?? "Failed to remove", "error")
      }
    } catch {
      showToast("Something went wrong.", "error")
    } finally {
      setRemoving(false)
      setRemoveTarget(null)
    }
  }

  const fmt = (d: Date | string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <style>{`
        .im-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .im-modal { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .im-table { width: 100%; border-collapse: collapse; font-size: 0.825rem; }
        .im-table th { padding: 0.625rem 1rem; text-align: left; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); border-bottom: 1px solid var(--border); background: var(--bg); white-space: nowrap; }
        .im-table td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: middle; }
        .im-table tr:last-child td { border-bottom: none; }
        .im-table tr:hover td { background: var(--bg); }
        .im-eu-row { display: flex; align-items: center; justify-content: space-between; padding: 0.625rem 0.875rem; border-bottom: 1px solid var(--border); gap: 0.75rem; }
        .im-eu-row:last-child { border-bottom: none; }
        .im-eu-row:hover { background: var(--bg); }
        .im-toast { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 200; padding: 0.75rem 1.25rem; border-radius: 0.5rem; font-size: 0.825rem; font-weight: 600; box-shadow: 0 4px 16px rgba(0,0,0,0.15); animation: slideUp 0.2s ease; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="im-toast" style={{
          backgroundColor: toast.type === "success" ? "var(--success)" : "var(--danger)",
          color: "#fff",
        }}>
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair, serif)", fontSize: "1.875rem", fontWeight: 700, color: "var(--text)", margin: "0 0 0.25rem" }}>
            Manage Interns
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.875rem" }}>
            {department} {batchName} — {interns.length} member{interns.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button style={btnOutline} onClick={() => setModal("existing")}>Add Existing Intern</button>
          <button style={btnPrimary} onClick={() => setModal("create")}>+ Create New Account</button>
        </div>
      </div>

      {/* Search + Table */}
      <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.5rem", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ ...inputStyle, width: "280px" }}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="im-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined Date</th>
                <th>Projects</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)" }}>
                    {search ? "No interns match your search." : "No interns in this batch yet."}
                  </td>
                </tr>
              ) : paginated.map(intern => (
                <tr key={intern.id}>
                  <td style={{ fontWeight: 600 }}>{intern.name}</td>
                  <td style={{ color: "var(--text-muted)" }}>{intern.email}</td>
                  <td style={{ color: "var(--text-muted)" }}>{fmt(intern.joinedAt)}</td>
                  <td>{intern.projectsCount}</td>
                  <td>
                    <span style={{
                      fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.6rem",
                      borderRadius: "9999px", backgroundColor: "rgba(21,128,61,0.1)",
                      color: "var(--success)", border: "1px solid var(--success)",
                      display: "inline-flex", alignItems: "center", gap: "0.3rem",
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "var(--success)", display: "inline-block" }} />
                      Active
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <Link
                        href={`/dashboard/profile/${intern.id}`}
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem", border: "1px solid var(--border)", borderRadius: "0.25rem", color: "var(--text)", textDecoration: "none", whiteSpace: "nowrap" }}
                      >
                        View Profile
                      </Link>
                      <button style={btnDanger} onClick={() => setRemoveTarget(intern)}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: "0.875rem 1.25rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            <span>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ ...btnOutline, padding: "0.25rem 0.75rem", opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? "not-allowed" : "pointer" }}>
                Prev
              </button>
              <span style={{ padding: "0.25rem 0.5rem", fontWeight: 600, color: "var(--text)" }}>{page}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ ...btnOutline, padding: "0.25rem 0.75rem", opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? "not-allowed" : "pointer" }}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Existing Modal ─────────────────────────────────────────────────── */}
      {modal === "existing" && (
        <div className="im-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="im-modal">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>Add Existing Intern</h2>
              <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "var(--text-muted)" }}>×</button>
            </div>

            <input
              type="text"
              placeholder="Search by name or email..."
              value={existingSearch}
              onChange={e => setExistingSearch(e.target.value)}
              style={inputStyle}
            />

            <div style={{ border: "1px solid var(--border)", borderRadius: "0.375rem", maxHeight: "280px", overflowY: "auto" }}>
              {filteredEligible.length === 0 ? (
                <p style={{ padding: "1.25rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.825rem", margin: 0 }}>
                  No eligible users found.
                </p>
              ) : filteredEligible.map(u => (
                <div key={u.id} className="im-eu-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
                    <input
                      type="checkbox"
                      checked={selected.has(u.id)}
                      onChange={e => {
                        const next = new Set(selected)
                        e.target.checked ? next.add(u.id) : next.delete(u.id)
                        setSelected(next)
                      }}
                      style={{ width: 15, height: 15, cursor: "pointer", flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: "0.825rem", margin: 0, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-muted)", flexShrink: 0 }}>{u.role}</span>
                </div>
              ))}
            </div>

            {selected.size > 0 && (
              <p style={{ fontSize: "0.8rem", color: "var(--primary)", margin: 0 }}>
                {selected.size} user{selected.size !== 1 ? "s" : ""} selected
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button style={btnOutline} onClick={closeModal}>Cancel</button>
              <button
                style={{ ...btnPrimary, opacity: (selected.size === 0 || addingExisting) ? 0.6 : 1 }}
                disabled={selected.size === 0 || addingExisting}
                onClick={handleAddExisting}
              >
                {addingExisting ? "Adding..." : `Add Selected (${selected.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create New Account Modal ───────────────────────────────────────────── */}
      {modal === "create" && (
        <div className="im-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="im-modal">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>Create New Account</h2>
              <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "var(--text-muted)" }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { key: "name", label: "Full Name", type: "text", placeholder: "e.g. Priya Sharma" },
                { key: "email", label: "Email", type: "email", placeholder: "e.g. priya@example.com" },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={form[key as keyof typeof form] as string}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    autoComplete="off"
                    style={inputStyle}
                  />
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label style={labelStyle}>Temporary Password (min 8 chars)</label>
                <PasswordInput
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={inputStyle}
                  autoComplete="new-password"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label style={labelStyle}>Department</label>
                <input value={department} disabled style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }} />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer", fontSize: "0.875rem", color: "var(--text)" }}>
                <input
                  type="checkbox"
                  checked={form.addToBatch}
                  onChange={e => setForm(f => ({ ...f, addToBatch: e.target.checked }))}
                  style={{ width: 15, height: 15 }}
                />
                Add to current batch ({batchName})
              </label>

              {formError && (
                <p style={{ fontSize: "0.8rem", color: "var(--danger)", margin: 0 }}>{formError}</p>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button style={btnOutline} onClick={closeModal}>Cancel</button>
              <button
                style={{ ...btnPrimary, opacity: creating ? 0.6 : 1 }}
                disabled={creating}
                onClick={handleCreate}
              >
                {creating ? "Creating..." : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Batch History ──────────────────────────────────────────────────────── */}
      {pastBatches.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 700, margin: 0 }}>
            Previous Batches in {department}
          </p>
          <div style={{ border: "1px solid var(--border)", borderRadius: "0.5rem", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table className="im-table">
                <thead>
                  <tr>
                    <th>Batch Name</th>
                    <th>Coordinator</th>
                    <th>Interns</th>
                    <th>Projects</th>
                  </tr>
                </thead>
                <tbody>
                  {pastBatches.map(b => (
                    <tr key={b.id} style={{ cursor: "pointer" }}>
                      <td style={{ fontWeight: 600, color: "var(--primary)" }}>
                        <Link href={`/dashboard/interns/batch/${b.id}`} style={{ color: "var(--primary)", textDecoration: "none" }}>
                          {b.name}
                        </Link>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>
                        {b.coordinator ? (
                          <span title={b.coordinator.email}>{b.coordinator.name}</span>
                        ) : "—"}
                      </td>
                      <td>{b.internCount}</td>
                      <td>{b.projectCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>Click a batch name to view its details.</p>
        </div>
      )}

      {/* ── Remove Confirmation ────────────────────────────────────────────────── */}
      {removeTarget && (
        <div className="im-overlay" onClick={e => { if (e.target === e.currentTarget) setRemoveTarget(null) }}>
          <div className="im-modal" style={{ maxWidth: 400 }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>Remove from Batch?</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
              This will remove <strong style={{ color: "var(--text)" }}>{removeTarget.name}</strong> from <strong style={{ color: "var(--text)" }}>{batchName}</strong>. Their account will not be deleted.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button style={btnOutline} onClick={() => setRemoveTarget(null)}>Cancel</button>
              <button
                style={{ ...btnDanger, backgroundColor: "var(--danger)", color: "#fff", padding: "0.5rem 1.125rem", opacity: removing ? 0.6 : 1 }}
                disabled={removing}
                onClick={handleRemove}
              >
                {removing ? "Removing..." : "Yes, Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
