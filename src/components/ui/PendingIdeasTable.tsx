"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"

interface Idea {
  id: string
  title: string
  tags: string[]
  status: string
  createdAt: string | Date
  submittedBy?: { name: string; email: string } | null
}

export function PendingIdeasTable({ ideas: initial }: { ideas: Idea[] }) {
  const [ideas, setIdeas] = useState(initial)
  const [dismissing, setDismissing] = useState<Set<string>>(new Set())
  const router = useRouter()

  async function handleAction(id: string, status: "APPROVED" | "REJECTED") {
    setDismissing(prev => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/admin/ideas/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(status === "APPROVED" ? "Idea approved" : "Idea rejected")
        setTimeout(() => {
          setIdeas(prev => prev.filter(i => i.id !== id))
          setDismissing(prev => { const s = new Set(prev); s.delete(id); return s })
        }, 400)
      } else {
        toast.error(data.message)
        setDismissing(prev => { const s = new Set(prev); s.delete(id); return s })
      }
    } catch (err: any) {
      toast.error(err.message)
      setDismissing(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  if (ideas.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
        <CheckCircle size={32} style={{ opacity: 0.4, color: "var(--success)" }} />
        <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>No pending ideas — all caught up</span>
      </div>
    )
  }

  const btnBase: React.CSSProperties = {
    border: "1px solid", borderRadius: "0.25rem",
    padding: "0.2rem 0.6rem", fontSize: "0.7rem", fontWeight: 600,
    cursor: "pointer", backgroundColor: "transparent", transition: "all 0.15s"
  }

  return (
    <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "0.5rem" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.825rem" }}>
        <thead>
          <tr style={{ backgroundColor: "var(--bg)" }}>
            {["Title", "Submitted By", "Tags", "Submitted On", "Actions"].map(h => (
              <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ideas.map((idea, i) => (
            <tr
              key={idea.id}
              style={{
                borderBottom: i < ideas.length - 1 ? "1px solid var(--border)" : "none",
                backgroundColor: "var(--surface)",
                borderLeft: "3px solid var(--warning)",
                opacity: dismissing.has(idea.id) ? 0 : 1,
                transition: "opacity 0.3s ease",
              }}
            >
              <td style={{ padding: "0.75rem 1rem", fontWeight: 500, color: "var(--text)" }}>{idea.title}</td>
              <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>{idea.submittedBy?.name ?? "—"}</td>
              <td style={{ padding: "0.75rem 1rem" }}>
                <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                  {(idea.tags ?? []).slice(0, 3).map((t: string) => (
                    <span key={t} style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "9999px", color: "var(--text-muted)" }}>{t}</span>
                  ))}
                </div>
              </td>
              <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                {new Date(idea.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </td>
              <td style={{ padding: "0.75rem 1rem" }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleAction(idea.id, "APPROVED")}
                    disabled={dismissing.has(idea.id)}
                    style={{ ...btnBase, borderColor: "var(--success)", color: "var(--success)" }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--success)"; e.currentTarget.style.color = "#fff" }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--success)" }}
                  >Approve</button>
                  <button
                    onClick={() => handleAction(idea.id, "REJECTED")}
                    disabled={dismissing.has(idea.id)}
                    style={{ ...btnBase, borderColor: "var(--danger)", color: "var(--danger)" }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--danger)"; e.currentTarget.style.color = "#fff" }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--danger)" }}
                  >Reject</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
