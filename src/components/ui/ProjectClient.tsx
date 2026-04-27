"use client"

import { useState } from "react"
import { ProjectCard } from "./ProjectCard"
import { AddProjectModal } from "./AddProjectModal"

export function ProjectClient({
  projects,
  isAdmin,
  department,
  interns = [],
  batches = [],
}: {
  projects: any[]
  isAdmin: boolean
  department: string
  interns?: any[]
  batches?: { batchNumber: number; isActive: boolean }[]
}) {
  const [status, setStatus] = useState("All")
  const [tags, setTags] = useState("")
  const [batchFilter, setBatchFilter] = useState("All")

  const filtered = projects.filter(p => {
    if (status !== "All" && p.status !== status) return false
    if (batchFilter !== "All") {
      const n = parseInt(batchFilter)
      const started = p.startedInBatch === n
      const continued = (p.continuedInBatches || []).includes(n)
      if (!started && !continued) return false
    }
    if (tags) {
      const searchTags = tags.toLowerCase().split(",").map((t: string) => t.trim()).filter(Boolean)
      const projectTags = (p.tags || []).map((t: string) => t.toLowerCase())
      if (!searchTags.some(st => projectTags.some((pt: string) => pt.includes(st)))) return false
    }
    return true
  })

  const isFiltered = status !== "All" || tags !== "" || batchFilter !== "All"

  const selectStyle = {
    padding: "0.375rem 0.5rem", borderRadius: "0.25rem",
    border: "1px solid var(--border)", backgroundColor: "var(--bg)",
    color: "var(--text)", fontSize: "0.825rem",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Filter Bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
        backgroundColor: "var(--surface)", padding: "1rem", borderRadius: "0.5rem",
        border: "1px solid var(--border)",
      }}>
        {/* Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
            <option value="All">All Statuses</option>
            <option value="IDEA">Idea</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {/* Batch filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Batch</label>
          <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} style={selectStyle}>
            <option value="All">All Batches</option>
            {batches.map(b => (
              <option key={b.batchNumber} value={b.batchNumber.toString()}>
                Batch {b.batchNumber}{b.isActive ? " (Current)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Tags</label>
          <input
            type="text" placeholder="Type tags..." value={tags} onChange={e => setTags(e.target.value)}
            style={{ ...selectStyle, width: "140px" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginLeft: "auto" }}>
          {isFiltered && (
            <button
              onClick={() => { setStatus("All"); setTags(""); setBatchFilter("All") }}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "0.825rem", cursor: "pointer", textDecoration: "underline" }}
            >
              Clear Filters
            </button>
          )}
          {isAdmin && <AddProjectModal department={department} interns={interns} />}
        </div>
      </div>

      {/* Grid */}
      <div className="project-grid">
        {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: "0.5rem" }}>
            No projects found matching these filters.
          </div>
        )}
      </div>

      <style jsx>{`
        .project-grid { display: grid; gap: 1.5rem; grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 1024px) { .project-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .project-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}
