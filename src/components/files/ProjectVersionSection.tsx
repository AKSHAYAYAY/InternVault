"use client"

import { useState } from "react"
import { FileUploadZone } from "@/components/files/FileUploadZone"
import { FolderTree } from "@/components/files/FolderTree"
import { Upload, ChevronDown, ChevronUp, FileText, Download } from "lucide-react"
import { useRouter } from "next/navigation"

interface Version {
  id: string
  versionNumber: number
  uploadedBy: { name: string }
  createdAt: string | Date
  zipPath: string
  extractedJson: any
  readmeContent: string | null
}

interface Props {
  projectId: string
  initialVersions: Version[]
  canUpload: boolean
  isAdmin: boolean
}

const fmt = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

const sectionLabel: React.CSSProperties = {
  fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em",
  color: "var(--text-muted)", margin: "0 0 1rem", fontWeight: 600,
}
const box: React.CSSProperties = {
  backgroundColor: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: "0.5rem", padding: "1.5rem",
}

export function ProjectVersionSection({ projectId, initialVersions, canUpload, isAdmin }: Props) {
  const router = useRouter()
  const [versions, setVersions] = useState<Version[]>(initialVersions)
  const [showUpload, setShowUpload] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(
    initialVersions.length > 0 ? initialVersions[0].id : null
  )

  function handleUploadComplete() {
    setShowUpload(false)
    router.refresh()
  }

  const expandedVersion = versions.find(v => v.id === expandedId) ?? null

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={sectionLabel}>
          Project Versions
          {versions.length > 0 && (
            <span style={{ marginLeft: "0.5rem", backgroundColor: "var(--primary)", color: "#fff", fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "9999px" }}>
              {versions.length}
            </span>
          )}
        </h2>
        {canUpload && (
          <button
            onClick={() => setShowUpload(s => !s)}
            style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              background: "transparent", border: "1px solid var(--border)",
              color: "var(--text-muted)", padding: "0.25rem 0.75rem",
              borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.75rem", fontWeight: 500,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.color = "var(--primary)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)" }}
          >
            <Upload size={12} />
            {showUpload ? "Cancel" : "Upload New Version"}
          </button>
        )}
      </div>

      {/* Upload zone */}
      {canUpload && showUpload && (
        <FileUploadZone projectId={projectId} onUploadComplete={handleUploadComplete} />
      )}

      {/* No versions yet */}
      {versions.length === 0 && !showUpload && (
        <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: "0.5rem", backgroundColor: "var(--bg)" }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem" }}>No versions uploaded yet</p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem" }}>
            {canUpload ? "Upload a ZIP file to create the first version." : "Files will appear here once uploaded by the team."}
          </p>
        </div>
      )}

      {/* Version list */}
      {versions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {versions.map((v, i) => {
            const isLatest = i === 0
            const isExpanded = expandedId === v.id
            return (
              <div key={v.id} style={{
                border: `1px solid ${isLatest ? "var(--primary)" : "var(--border)"}`,
                borderRadius: "0.5rem", overflow: "hidden",
                backgroundColor: "var(--surface)",
              }}>
                {/* Version header row */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.875rem 1.25rem", flexWrap: "wrap", gap: "0.75rem",
                  backgroundColor: isLatest ? "rgba(30,64,175,0.04)" : "transparent",
                  cursor: "pointer",
                }}
                  onClick={() => setExpandedId(isExpanded ? null : v.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)" }}>
                      Version {v.versionNumber}
                    </span>
                    {isLatest && (
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "9999px", backgroundColor: "rgba(30,64,175,0.1)", color: "var(--primary)", border: "1px solid rgba(30,64,175,0.2)" }}>
                        LATEST
                      </span>
                    )}
                    {v.readmeContent && (
                      <span style={{ fontSize: "0.6rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "9999px", backgroundColor: "rgba(21,128,61,0.1)", color: "var(--success)", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                        <FileText size={10} /> README
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{ fontSize: "0.775rem", color: "var(--text-muted)" }}>
                      {v.uploadedBy.name} · {fmt(v.createdAt)}
                    </span>
                    <a
                      href={v.zipPath}
                      download
                      onClick={e => e.stopPropagation()}
                      style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none", padding: "0.2rem 0.5rem", border: "1px solid var(--border)", borderRadius: "0.25rem" }}
                    >
                      <Download size={12} /> ZIP
                    </a>
                    {isExpanded ? <ChevronUp size={16} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />}
                  </div>
                </div>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "1.25rem", display: "grid", gridTemplateColumns: v.readmeContent ? "1fr 1fr" : "1fr", gap: "1.25rem" }}>

                    {/* Folder tree */}
                    <div>
                      <p style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 700, margin: "0 0 0.625rem" }}>
                        File Structure
                      </p>
                      {v.extractedJson ? (
                        <FolderTree
                          folderStructure={v.extractedJson}
                          projectId={projectId}
                          isAdmin={false}
                        />
                      ) : (
                        <p style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>No structure available.</p>
                      )}
                    </div>

                    {/* README preview */}
                    {v.readmeContent && (
                      <div>
                        <p style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 700, margin: "0 0 0.625rem" }}>
                          README.md
                        </p>
                        <div style={{
                          backgroundColor: "var(--bg)", border: "1px solid var(--border)",
                          borderRadius: "0.375rem", padding: "1rem",
                          maxHeight: 360, overflowY: "auto",
                          fontSize: "0.825rem", lineHeight: 1.7,
                          color: "var(--text)", whiteSpace: "pre-wrap",
                          fontFamily: "monospace",
                        }}>
                          {v.readmeContent}
                        </div>
                      </div>
                    )}

                    {/* No README message */}
                    {!v.readmeContent && (
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic", margin: 0 }}>
                        No README found in this version.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
