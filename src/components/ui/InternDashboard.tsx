"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { SubmitIdeaModal } from "@/components/ideas/SubmitIdeaModal"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  name: string
  userId: string
  dept: string
  batchLabel: string
  isReadOnly: boolean
  pastBatchName: string | null
  stats: { projectsJoined: number; ideasSubmitted: number; contributions: number }
  myIdeas: { id: string; title: string; status: string; createdAt: Date; tags: string[] }[]
  myContributions: { id: string; description: string; date: Date; batchNumber: number; project: { id: string; name: string } }[]
  continuableProjects: { id: string; name: string; startedInBatch: number; techStack: string[]; description: string }[]
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const box: React.CSSProperties = {
  backgroundColor: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: "0.5rem", padding: "1.5rem",
}
const sectionLabel: React.CSSProperties = {
  fontSize: "0.7rem", textTransform: "uppercase" as const,
  letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 700, margin: "0 0 1rem",
}
const statusColors: Record<string, { bg: string; color: string }> = {
  PENDING:  { bg: "rgba(180,83,9,0.1)",  color: "var(--warning)" },
  APPROVED: { bg: "rgba(21,128,61,0.1)", color: "var(--success)" },
  REJECTED: { bg: "rgba(185,28,28,0.1)", color: "var(--danger)" },
}

function StatusBadge({ status }: { status: string }) {
  const s = statusColors[status] ?? { bg: "var(--bg)", color: "var(--text-muted)" }
  return (
    <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "9999px", backgroundColor: s.bg, color: s.color, whiteSpace: "nowrap" as const }}>
      {status}
    </span>
  )
}

const fmt = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

// ── Component ─────────────────────────────────────────────────────────────────

export function InternDashboard({ name, userId, dept, batchLabel, isReadOnly, pastBatchName, stats, myIdeas, myContributions, continuableProjects }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [joined, setJoined] = useState<Set<string>>(new Set())

  async function handleContinue(projectId: string) {
    setJoiningId(projectId)
    try {
      const res = await fetch(`/api/projects/${projectId}/continue`, { method: "POST", credentials: "include" })
      const data = await res.json()
      if (res.ok) {
        setJoined(prev => new Set(prev).add(projectId))
        toast.success(data.message || "You've joined this project")
        startTransition(() => router.refresh())
      } else {
        toast.error(data.error ?? data.message ?? "Failed to join project")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setJoiningId(null)
    }
  }

  const firstName = name.split(" ")[0]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Read-only banner */}
      {isReadOnly && pastBatchName && (
        <div style={{ backgroundColor: "rgba(180,83,9,0.08)", border: "1px solid rgba(180,83,9,0.3)", borderLeft: "4px solid var(--warning)", borderRadius: "0.375rem", padding: "0.875rem 1.125rem", display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
          <span style={{ flexShrink: 0 }}>⚠</span>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--warning)", fontWeight: 500 }}>
            {dept} {pastBatchName} has ended. You have read-only access.
          </p>
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.25rem" }}>
        <h1 style={{ fontFamily: "var(--font-playfair, serif)", fontSize: "1.875rem", fontWeight: 700, color: "var(--text)", margin: "0 0 0.25rem" }}>
          Intern Portal
        </h1>
        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.875rem" }}>{batchLabel}</p>
      </div>

      {/* Welcome + Stats */}
      <div style={{ ...box, display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <p style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text)", margin: "0 0 0.25rem" }}>
            Welcome back, {firstName} 👋
          </p>
          <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", margin: 0 }}>
            Here's a summary of your activity in {dept}.
          </p>
        </div>
        <div className="id-stats">
          {[
            { label: "Projects Joined", value: stats.projectsJoined, color: "var(--primary)" },
            { label: "Ideas Submitted", value: stats.ideasSubmitted, color: "var(--warning)" },
            { label: "Contributions", value: stats.contributions, color: "var(--success)" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "1rem", borderBottom: `3px solid ${color}` }}>
              <p style={{ fontSize: "1.75rem", fontWeight: 800, color, fontFamily: "var(--font-playfair, serif)", margin: "0 0 0.25rem", lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 600, margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={box}>
        <p style={sectionLabel}>Quick Actions</p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {!isReadOnly && <SubmitIdeaModal />}
          <Link href="/dashboard/projects" style={{ padding: "0.5rem 1.125rem", backgroundColor: "transparent", border: "1px solid var(--border)", borderRadius: "0.375rem", fontSize: "0.825rem", fontWeight: 500, color: "var(--text)", textDecoration: "none" }}>
            Browse Projects
          </Link>
          <Link href={`/dashboard/profile/${userId}`} style={{ padding: "0.5rem 1.125rem", backgroundColor: "transparent", border: "1px solid var(--border)", borderRadius: "0.375rem", fontSize: "0.825rem", fontWeight: 500, color: "var(--text)", textDecoration: "none" }}>
            My Profile
          </Link>
          <Link href="/dashboard/profile/edit" style={{ padding: "0.5rem 1.125rem", backgroundColor: "transparent", border: "1px solid var(--border)", borderRadius: "0.375rem", fontSize: "0.825rem", fontWeight: 500, color: "var(--text)", textDecoration: "none" }}>
            Edit Profile
          </Link>
        </div>
        {isReadOnly && (
          <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", margin: "0.75rem 0 0" }}>
            Idea submission is disabled — your batch has ended.
          </p>
        )}
      </div>

      {/* Available to Continue */}
      {continuableProjects.length > 0 && (
        <div style={box}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <p style={{ ...sectionLabel, margin: 0 }}>Available to Continue</p>
            <Link href="/dashboard/projects" style={{ fontSize: "0.75rem", color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}>
              View All →
            </Link>
          </div>
          <div className="id-projects">
            {continuableProjects.map(p => {
              const isJoined = joined.has(p.id)
              const isJoining = joiningId === p.id
              return (
                <div key={p.id} style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "1.125rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)", margin: "0 0 0.25rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                    <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {p.description}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "0.25rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                      Batch {p.startedInBatch}
                    </span>
                    {p.techStack.slice(0, 2).map(t => (
                      <span key={t} style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem", borderRadius: "0.25rem", backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>{t}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Link href={`/dashboard/projects/${p.id}`} style={{ flex: 1, padding: "0.4rem 0", textAlign: "center", border: "1px solid var(--border)", borderRadius: "0.375rem", fontSize: "0.775rem", fontWeight: 500, color: "var(--text)", textDecoration: "none" }}>
                      View
                    </Link>
                    {!isReadOnly && (
                      <button
                        onClick={() => handleContinue(p.id)}
                        disabled={isJoining || isJoined}
                        style={{ flex: 2, padding: "0.4rem 0", backgroundColor: isJoined ? "var(--success)" : "var(--primary)", color: "#fff", border: "none", borderRadius: "0.375rem", fontSize: "0.775rem", fontWeight: 600, cursor: isJoined ? "default" : "pointer", opacity: isJoining ? 0.6 : 1 }}
                      >
                        {isJoined ? "✓ Joined" : isJoining ? "Joining..." : "Continue Project"}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Activity — 2 col grid */}
      {(myIdeas.length > 0 || myContributions.length > 0) && (
        <div className="id-grid">

          {/* My Ideas */}
          {myIdeas.length > 0 && (
            <div style={box}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <p style={{ ...sectionLabel, margin: 0 }}>My Ideas</p>
                <Link href="/dashboard/ideas" style={{ fontSize: "0.75rem", color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}>View All →</Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {myIdeas.map((idea, i) => (
                  <div key={idea.id} style={{ padding: "0.75rem 0", borderBottom: i < myIdeas.length - 1 ? "1px solid var(--border)" : "none", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: "0.825rem", color: "var(--text)", margin: "0 0 0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{idea.title}</p>
                      <p style={{ fontSize: "0.725rem", color: "var(--text-muted)", margin: 0 }}>{fmt(idea.createdAt)}</p>
                    </div>
                    <StatusBadge status={idea.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Contributions */}
          {myContributions.length > 0 && (
            <div style={box}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <p style={{ ...sectionLabel, margin: 0 }}>Recent Contributions</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {myContributions.map((c, i) => (
                  <div key={c.id} style={{ padding: "0.75rem 0", borderBottom: i < myContributions.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem", gap: "0.5rem" }}>
                      <Link href={`/dashboard/projects/${c.project.id}`} style={{ fontWeight: 600, fontSize: "0.825rem", color: "var(--primary)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.project.name}
                      </Link>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "0.25rem", backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)", flexShrink: 0 }}>
                        Batch {c.batchNumber}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", margin: "0 0 0.2rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {c.description}
                    </p>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0 }}>{fmt(c.date)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Empty state — no data at all */}
      {myIdeas.length === 0 && myContributions.length === 0 && continuableProjects.length === 0 && (
        <div style={{ ...box, textAlign: "center", padding: "2.5rem", border: "1px dashed var(--border)" }}>
          <p style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>🚀</p>
          <p style={{ fontWeight: 600, color: "var(--text)", margin: "0 0 0.25rem" }}>You're all set up!</p>
          <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", margin: 0 }}>
            Start by submitting an idea or joining a project.
          </p>
        </div>
      )}
    </div>
  )
}
