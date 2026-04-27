"use client"

import Link from "next/link"

type IdeaSummary = {
  id: string
  title: string
  shortDescription: string
  status: string
  department: string
  createdAt: Date
  tags: string[]
  techStack: string[]
  submittedBy: { name: string }
  batch?: { batchNumber: number; name: string } | null
}

const statusStyle: Record<string, React.CSSProperties> = {
  PENDING:  { backgroundColor: "rgba(180,83,9,0.1)",  color: "var(--warning)" },
  APPROVED: { backgroundColor: "rgba(21,128,61,0.1)", color: "var(--success)" },
  REJECTED: { backgroundColor: "rgba(185,28,28,0.1)", color: "var(--danger)" },
}

export function IdeaCard({ idea }: { idea: IdeaSummary }) {
  const s = statusStyle[idea.status] ?? { backgroundColor: "var(--bg)", color: "var(--text-muted)" }

  return (
    <Link
      href={`/dashboard/ideas/${idea.id}`}
      style={{ textDecoration: "none", display: "flex", flexDirection: "column" }}
    >
      <div style={{
        backgroundColor: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "0.5rem", padding: "1.25rem",
        display: "flex", flexDirection: "column", gap: "0.875rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        height: "100%", cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--primary)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)" }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
          <h3 style={{ fontFamily: "var(--font-playfair, serif)", fontSize: "1rem", fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1.3 }}>
            {idea.title}
          </h3>
          <span style={{ ...s, fontSize: "0.6rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "9999px", whiteSpace: "nowrap", flexShrink: 0 }}>
            {idea.status}
          </span>
        </div>

        {/* Short description — 2 line clamp */}
        <p style={{
          fontSize: "0.825rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {idea.shortDescription || idea.title}
        </p>

        {/* Tags */}
        {idea.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
            {idea.tags.slice(0, 4).map(t => (
              <span key={t} style={{ fontSize: "0.6rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "9999px", backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "0.625rem", borderTop: "1px solid var(--border)" }}>
          <span style={{ fontSize: "0.725rem", color: "var(--text-muted)" }}>
            {idea.submittedBy.name} · {new Date(idea.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
          </span>
          {idea.batch && (
            <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "0.25rem", backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              Batch {idea.batch.batchNumber}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
