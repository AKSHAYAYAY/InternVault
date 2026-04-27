"use client"

import { useState } from "react"
import { ChevronRight, Folder, Download, Trash2 } from "lucide-react"
import { FileTypeIcon } from "./FileTypeIcon"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface TreeNode {
  name: string
  type: "file" | "folder"
  path?: string
  children?: TreeNode[]
}

interface FolderTreeProps {
  node: TreeNode
  projectId: string
  isAdmin: boolean
  depth?: number
  onRefresh?: () => void
}

function FolderNode({ node, projectId, isAdmin, depth = 0, onRefresh }: FolderTreeProps) {
  const [expanded, setExpanded] = useState(depth === 0)
  const [hovered, setHovered] = useState(false)
  const router = useRouter()

  const childCount = node.children?.length ?? 0

  if (node.type === "folder") {
    return (
      <div>
        <div
          onClick={() => setExpanded(e => !e)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.375rem 0.75rem",
            paddingLeft: `${0.75 + depth * 1.5}rem`,
            cursor: "pointer",
            borderRadius: "0.25rem",
            transition: "background 0.15s",
            backgroundColor: hovered ? "var(--bg)" : "transparent",
            userSelect: "none" as const,
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <ChevronRight
            size={14}
            style={{
              color: "var(--text-muted)",
              flexShrink: 0,
              transition: "transform 0.2s ease",
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            }}
          />
          <Folder size={15} style={{ color: "var(--warning)", flexShrink: 0 }} />
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)", flex: 1 }}>
            {node.name}
          </span>
          {!expanded && childCount > 0 && (
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              {childCount} item{childCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {expanded && node.children && (
          <div>
            {node.children.map((child, i) => (
              <FolderNode
                key={`${child.name}-${i}`}
                node={child}
                projectId={projectId}
                isAdmin={isAdmin}
                depth={depth + 1}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // File row
  return (
    <FileRow
      node={node}
      projectId={projectId}
      isAdmin={isAdmin}
      depth={depth}
      onRefresh={onRefresh}
    />
  )
}

function FileRow({
  node,
  projectId,
  isAdmin,
  depth,
  onRefresh,
}: {
  node: TreeNode
  projectId: string
  isAdmin: boolean
  depth: number
  onRefresh?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDownload() {
    if (!node.path) return
    const url = `/api/projects/${projectId}/files/download?path=${encodeURIComponent(node.path)}`
    window.open(url, "_blank")
  }

  async function handleDelete() {
    if (!node.path) return
    if (!confirm(`Delete "${node.name}"?`)) return
    setDeleting(true)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/files?path=${encodeURIComponent(node.path)}`,
        { method: "DELETE" }
      )
      const data = await res.json()
      if (data.success) {
        toast.success("File deleted")
        onRefresh?.()
        router.refresh()
      } else {
        toast.error(data.message)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.3rem 0.75rem",
        paddingLeft: `${0.75 + depth * 1.5}rem`,
        borderRadius: "0.25rem",
        transition: "background 0.15s",
        backgroundColor: hovered ? "var(--bg)" : "transparent",
        position: "relative" as const,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ color: "var(--text-muted)", display: "flex", flexShrink: 0 }}>
        <FileTypeIcon filename={node.name} size={14} />
      </span>
      <span style={{ fontSize: "0.825rem", color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
        {node.name}
      </span>

      {/* Action buttons — visible only on hover */}
      <div
        style={{
          display: "flex",
          gap: "0.25rem",
          alignItems: "center",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.15s ease",
          pointerEvents: hovered ? "auto" : "none" as any,
        }}
      >
        <button
          onClick={handleDownload}
          title="Download"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "0.25rem",
            color: "var(--text-muted)",
            display: "flex",
            borderRadius: "0.25rem",
            transition: "color 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--primary)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <Download size={13} />
        </button>

        {isAdmin && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "0.25rem",
              color: "var(--danger, #dc2626)",
              display: "flex",
              borderRadius: "0.25rem",
              opacity: deleting ? 0.5 : 1,
            }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

interface FolderTreeRootProps {
  folderStructure: TreeNode
  projectId: string
  isAdmin: boolean
  onRefresh?: () => void
}

export function FolderTree({ folderStructure, projectId, isAdmin, onRefresh }: FolderTreeRootProps) {
  return (
    <div
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "0.5rem",
        maxHeight: "400px",
        overflowY: "auto",
        padding: "0.5rem",
      }}
    >
      <FolderNode
        node={folderStructure}
        projectId={projectId}
        isAdmin={isAdmin}
        depth={0}
        onRefresh={onRefresh}
      />
    </div>
  )
}
