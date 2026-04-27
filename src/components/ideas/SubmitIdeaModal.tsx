"use client"

import { useState, useRef } from "react"
import { submitIdea } from "@/app/actions/ideas"
import { toast } from "sonner"

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.5rem 0.75rem",
  border: "1px solid var(--border)", borderRadius: "0.375rem",
  backgroundColor: "var(--bg)", color: "var(--text)",
  fontSize: "0.875rem", fontFamily: "inherit", outline: "none",
}
const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: "vertical" as const, lineHeight: 1.6,
}
const labelStyle: React.CSSProperties = {
  fontSize: "0.7rem", textTransform: "uppercase" as const,
  letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 700,
}
const sectionHeadStyle: React.CSSProperties = {
  fontSize: "0.65rem", textTransform: "uppercase" as const,
  letterSpacing: "0.12em", fontWeight: 700,
  color: "var(--primary)", margin: "0 0 0.875rem",
  paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)",
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function SubmitIdeaModal() {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [solution, setSolution] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const formRef = useRef<HTMLFormElement>(null)

  const wordCount = countWords(solution)
  const wordCountOk = wordCount >= 200

  function validate(fd: FormData): Record<string, string> {
    const e: Record<string, string> = {}
    if (!fd.get("title")) e.title = "Title is required"
    if (!fd.get("shortDescription")) e.shortDescription = "Short description is required"
    if (!fd.get("problemStatement")) e.problemStatement = "Problem statement is required"
    if (!fd.get("proposedSolution")) e.proposedSolution = "Proposed solution is required"
    else if (!wordCountOk) e.proposedSolution = `Minimum 200 words required (${wordCount} so far)`
    return e
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const errs = validate(fd)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSubmitting(true)
    try {
      await submitIdea(fd)
      toast.success("Idea submitted successfully!")
      setOpen(false)
      setSolution("")
      formRef.current?.reset()
    } catch (err: any) {
      toast.error(err.message || "Failed to submit idea")
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setErrors({})
    setSolution("")
    formRef.current?.reset()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ padding: "0.5rem 1.125rem", backgroundColor: "var(--primary)", color: "#fff", border: "none", borderRadius: "0.375rem", fontSize: "0.825rem", fontWeight: 600, cursor: "pointer" }}
      >
        Submit Idea
      </button>

      {open && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: "1rem" }}
          onClick={e => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.75rem", width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ fontFamily: "var(--font-playfair, serif)", fontSize: "1.25rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>Submit New Idea</h2>
              <button onClick={handleClose} style={{ background: "none", border: "none", fontSize: "1.375rem", cursor: "pointer", color: "var(--text-muted)", lineHeight: 1 }}>×</button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>

              {/* SECTION 1 — Basic Info */}
              <div>
                <p style={sectionHeadStyle}>Basic Info</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={labelStyle}>Title *</label>
                    <input name="title" placeholder="A concise headline for your idea" style={inputStyle} onChange={() => errors.title && setErrors(p => ({ ...p, title: "" }))} />
                    {errors.title && <p style={{ fontSize: "0.75rem", color: "var(--danger)", margin: 0 }}>{errors.title}</p>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={labelStyle}>Short Description * <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(max 150 chars)</span></label>
                    <input name="shortDescription" maxLength={150} placeholder="2–3 sentence summary visible on the idea card" style={inputStyle} onChange={() => errors.shortDescription && setErrors(p => ({ ...p, shortDescription: "" }))} />
                    {errors.shortDescription && <p style={{ fontSize: "0.75rem", color: "var(--danger)", margin: 0 }}>{errors.shortDescription}</p>}
                  </div>
                </div>
              </div>

              {/* SECTION 2 — Problem */}
              <div>
                <p style={sectionHeadStyle}>Problem</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <label style={labelStyle}>Problem Statement *</label>
                  <textarea name="problemStatement" rows={4} placeholder="Describe the problem this idea addresses in detail..." style={textareaStyle} onChange={() => errors.problemStatement && setErrors(p => ({ ...p, problemStatement: "" }))} />
                  {errors.problemStatement && <p style={{ fontSize: "0.75rem", color: "var(--danger)", margin: 0 }}>{errors.problemStatement}</p>}
                </div>
              </div>

              {/* SECTION 3 — Solution */}
              <div>
                <p style={sectionHeadStyle}>Solution</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={labelStyle}>Proposed Solution * <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(min 200 words)</span></label>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: wordCountOk ? "var(--success)" : solution.length > 0 ? "var(--warning)" : "var(--text-muted)" }}>
                      {wordCount} / 200 words
                    </span>
                  </div>
                  <textarea
                    name="proposedSolution" rows={6}
                    placeholder="Describe your proposed solution in detail. Explain how it works, why it's effective, and what impact it will have..."
                    style={{ ...textareaStyle, borderColor: errors.proposedSolution ? "var(--danger)" : "var(--border)" }}
                    value={solution}
                    onChange={e => { setSolution(e.target.value); errors.proposedSolution && setErrors(p => ({ ...p, proposedSolution: "" })) }}
                  />
                  {errors.proposedSolution
                    ? <p style={{ fontSize: "0.75rem", color: "var(--danger)", margin: 0 }}>{errors.proposedSolution}</p>
                    : !wordCountOk && solution.length > 0 && (
                      <p style={{ fontSize: "0.75rem", color: "var(--warning)", margin: 0 }}>{200 - wordCount} more words needed</p>
                    )
                  }
                </div>
              </div>

              {/* SECTION 4 — Tech + Tags */}
              <div>
                <p style={sectionHeadStyle}>Tech & Tags</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={labelStyle}>Tech Stack <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(comma separated)</span></label>
                    <input name="techStack" placeholder="e.g. React, Node.js, PostgreSQL" style={inputStyle} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={labelStyle}>Tags <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(comma separated)</span></label>
                    <input name="tags" placeholder="e.g. automation, ux, data" style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
                <button type="button" onClick={handleClose} style={{ padding: "0.5rem 1.125rem", backgroundColor: "transparent", border: "1px solid var(--border)", borderRadius: "0.375rem", fontSize: "0.825rem", fontWeight: 500, color: "var(--text)", cursor: "pointer" }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "0.5rem 1.25rem", backgroundColor: "var(--primary)", color: "#fff", border: "none", borderRadius: "0.375rem", fontSize: "0.825rem", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? "Submitting..." : "Submit Idea"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
