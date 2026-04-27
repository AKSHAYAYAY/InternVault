"use client"

import { useState } from "react"
import { FolderTree } from "@/components/files/FolderTree"
import { FileUploadZone } from "@/components/files/FileUploadZone"
import { FileX, Upload } from "lucide-react"

interface ProjectFileSectionProps {
  projectId: string
  initialFolderStructure: any
  initialFileCount: number
  canUpload: boolean
  isAdmin: boolean
}

export function ProjectFileSection({
  projectId,
  initialFolderStructure,
  initialFileCount,
  canUpload,
  isAdmin,
}: ProjectFileSectionProps) {
  const [folderStructure, setFolderStructure] = useState(initialFolderStructure)
  const [fileCount, setFileCount] = useState(initialFileCount)
  const [showUpload, setShowUpload] = useState(false)

  const handleUploadComplete = async () => {
    // Refresh folder structure from API
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, { credentials: "include" })
      const data = await res.json()
      if (data.success) {
        setFolderStructure(data.data.folderStructure)
        setFileCount(data.data.files?.length ?? 0)
      }
    } catch {}
    setShowUpload(false)
  }

  const hasFiles = folderStructure && (folderStructure.children?.length ?? 0) > 0

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Section Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <h2 style={{
            fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em",
            color: "var(--text-muted)", margin: 0, fontWeight: 600,
          }}>
            Project Files
          </h2>
          {hasFiles && (
            <span style={{
              fontSize: "0.65rem", fontWeight: 700,
              backgroundColor: "var(--primary)", color: "white",
              padding: "0.1rem 0.5rem", borderRadius: "9999px",
            }}>
              {fileCount}
            </span>
          )}
        </div>

        {canUpload && hasFiles && (
          <button
            onClick={() => setShowUpload(s => !s)}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              padding: "0.25rem 0.75rem",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--primary)"
              e.currentTarget.style.color = "var(--primary)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--border)"
              e.currentTarget.style.color = "var(--text-muted)"
            }}
          >
            <Upload size={12} />
            {showUpload ? "Cancel" : "Upload New Version"}
          </button>
        )}
      </div>

      {/* Upload Zone — shown when toggled or no files yet */}
      {canUpload && (showUpload || !hasFiles) && (
        <FileUploadZone projectId={projectId} onUploadComplete={handleUploadComplete} />
      )}

      {/* Files Display */}
      {hasFiles ? (
        <FolderTree
          folderStructure={folderStructure}
          projectId={projectId}
          isAdmin={isAdmin}
          onRefresh={handleUploadComplete}
        />
      ) : (
        !canUpload && (
          <div style={{
            textAlign: "center",
            padding: "3rem 1.5rem",
            color: "var(--text-muted)",
            border: "1px dashed var(--border)",
            borderRadius: "0.5rem",
            backgroundColor: "var(--bg)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.75rem",
          }}>
            <FileX size={36} style={{ opacity: 0.4 }} />
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem" }}>No files uploaded yet</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem" }}>
                Files will appear here once uploaded by the team
              </p>
            </div>
          </div>
        )
      )}
    </div>
  )
}
