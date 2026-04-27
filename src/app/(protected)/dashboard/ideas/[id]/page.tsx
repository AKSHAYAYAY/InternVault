import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { IdeaActions } from "./IdeaActions"

const sectionLabel: React.CSSProperties = {
  fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em",
  fontWeight: 700, color: "var(--primary)", margin: "0 0 0.75rem",
  paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)",
}
const statusStyle: Record<string, React.CSSProperties> = {
  PENDING:  { backgroundColor: "rgba(180,83,9,0.1)",  color: "var(--warning)" },
  APPROVED: { backgroundColor: "rgba(21,128,61,0.1)", color: "var(--success)" },
  REJECTED: { backgroundColor: "rgba(185,28,28,0.1)", color: "var(--danger)" },
}

export default async function IdeaDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const idea = await prisma.idea.findUnique({
    where: { id: params.id },
    include: {
      submittedBy: { select: { id: true, name: true } },
      batch: { select: { batchNumber: true, name: true } },
    },
  })

  if (!idea) notFound()

  // Department access check (super admin can see all)
  if (session.user.role !== "SUPER_ADMIN" && idea.department !== session.user.department) {
    return <div style={{ padding: "2rem", color: "var(--danger)" }}>Access denied.</div>
  }

  const canApprove = ["COORDINATOR", "SUPER_ADMIN"].includes(session.user.role) && idea.status === "PENDING"
  const s = statusStyle[idea.status] ?? {}

  // Backward compat: use problemStatement if set, else fall back to description
  const problemText = idea.problemStatement || idea.description
  const solutionText = idea.proposedSolution || idea.description

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: 760 }}>

      {/* Back */}
      <Link href="/dashboard/ideas" style={{ fontSize: "0.825rem", color: "var(--text-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
        ← Back to Idea Bank
      </Link>

      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <h1 style={{ fontFamily: "var(--font-playfair, serif)", fontSize: "1.875rem", fontWeight: 700, color: "var(--text)", margin: 0, flex: 1 }}>
            {idea.title}
          </h1>
          <span style={{ ...s, fontSize: "0.7rem", fontWeight: 700, padding: "0.25rem 0.75rem", borderRadius: "9999px", flexShrink: 0 }}>
            {idea.status}
          </span>
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          <span>By <strong style={{ color: "var(--text)" }}>{idea.submittedBy.name}</strong></span>
          <span>{new Date(idea.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</span>
          <span>{idea.department}</span>
          {idea.batch && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "0.25rem", backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              Batch {idea.batch.batchNumber}
            </span>
          )}
        </div>
      </div>

      {/* Short Description — highlighted */}
      {idea.shortDescription && (
        <div style={{ backgroundColor: "rgba(30,64,175,0.05)", borderLeft: "4px solid var(--primary)", padding: "1rem 1.25rem", borderRadius: "0 0.5rem 0.5rem 0" }}>
          <p style={{ fontSize: "1rem", color: "var(--text)", margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
            {idea.shortDescription}
          </p>
        </div>
      )}

      {/* Problem Statement */}
      <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "1.5rem" }}>
        <p style={sectionLabel}>Problem Statement</p>
        <p style={{ fontSize: "0.9rem", color: "var(--text)", margin: 0, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
          {problemText}
        </p>
      </div>

      {/* Proposed Solution */}
      <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "1.5rem" }}>
        <p style={sectionLabel}>Proposed Solution</p>
        <p style={{ fontSize: "0.9rem", color: "var(--text)", margin: 0, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
          {solutionText}
        </p>
      </div>

      {/* Tech Stack + Tags */}
      {(idea.techStack.length > 0 || idea.tags.length > 0) && (
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          {idea.techStack.length > 0 && (
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ ...sectionLabel, borderBottom: "none", marginBottom: "0.5rem" }}>Tech Stack</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                {idea.techStack.map(t => (
                  <span key={t} style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.25rem 0.625rem", borderRadius: "0.25rem", backgroundColor: "rgba(30,64,175,0.08)", color: "var(--primary)", border: "1px solid rgba(30,64,175,0.2)" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {idea.tags.length > 0 && (
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ ...sectionLabel, borderBottom: "none", marginBottom: "0.5rem" }}>Tags</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                {idea.tags.map(t => (
                  <span key={t} style={{ fontSize: "0.7rem", fontWeight: 600, padding: "0.2rem 0.55rem", borderRadius: "9999px", backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Coordinator actions */}
      {canApprove && <IdeaActions ideaId={idea.id} />}
    </div>
  )
}
