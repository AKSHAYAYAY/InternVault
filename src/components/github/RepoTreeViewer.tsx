"use client"

import { useState, useEffect } from "react"
import {
  ChevronRight, Folder, Code, FileText, Braces,
  Palette, Image, File, ExternalLink, GitBranch,
} from "lucide-react"

interface TreeNode {
  name: string
  type: "file" | "folder"
  path: string
  size?: number
  githubUrl?: string
  children?: TreeNode[]
}

interface RepoData {
  repoName: string
  defaultBranch: string
  tree: TreeNode[]
  totalFiles: number
  totalFolders: number
  repoUrl: string
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  if (["ts", "tsx", "js", "jsx", "mjs", "cjs"].includes(ext)) return <Code size={14} />
  if (["py", "java", "go", "rb", "rs", "cpp", "c", "cs", "php", "kt", "swift"].includes(ext)) return <Code size={14} />
  if (["md", "mdx", "txt", "rst", "pdf"].includes(ext)) return <FileText size={14} />
  if (["json", "yaml", "yml", "toml", "xml"].includes(ext)) return <Braces size={14} />
  if (["css", "scss", "sass", "less"].includes(ext)) return <Palette size={14} />
  if (["png", "jpg", "jpeg", "gif", "svg", "webp", "ico", "bmp"].includes(ext)) return <Image size={14} />
  return <File size={14} />
}

function formatBytes(bytes?: number): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function TreeNodeRow({ node, depth = 0, repoUrl, branch }: {
  node: TreeNode
  depth?: number
  repoUrl: string
  branch: string
}) {
  const [expanded, setExpanded] = useState(depth === 0)
  const indent = depth * 20

  if (node.type === "folder") {
    return (
      <div>
        <div
          onClick={() => setExpanded(e => !e)}
          style={{
            display: "flex", alignItems: "center", gap: "0.375rem",
            padding: "0.3rem 0.75rem",
            paddingLeft: `${0.75 + indent / 16}rem`,
            cursor: "pointer", userSelect: "none",
            borderRadius: "0.25rem",
            transition: "background 0.1s",
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg)"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <ChevronRight
            size={13}
            style={{
              color: "var(--text-muted)", flexShrink: 0,
              transition: "transform 0.15s ease",
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            }}
          />
          <Folder size={14} style={{ color: "var(--warning)", flexShrink: 0 }} />
          <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--text)", flex: 1 }}>
            {node.name}
          </span>
          {!expanded && node.children && node.children.length > 0 && (
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              {node.children.length}
            </span>
          )}
        </div>
        {expanded && node.children && (
          <div>
            {node.children.map((child, i) => (
              <TreeNodeRow key={`${child.path}-${i}`} node={child} depth={depth + 1} repoUrl={repoUrl} branch={branch} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // File row
  const fileUrl = node.githubUrl ?? `${repoUrl}/blob/${branch}/${node.path}`
  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex", alignItems: "center", gap: "0.375rem",
        padding: "0.3rem 0.75rem",
        paddingLeft: `${0.75 + indent / 16}rem`,
        textDecoration: "none", borderRadius: "0.25rem",
        transition: "background 0.1s",
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg)"}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
    >
      <span style={{ color: "var(--text-muted)", flexShrink: 0, display: "flex" }}>
        {getFileIcon(node.name)}
      </span>
      <span style={{ fontSize: "0.825rem", color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {node.name}
      </span>
      {node.size !== undefined && node.size > 0 && (
        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", flexShrink: 0 }}>
          {formatBytes(node.size)}
        </span>
      )}
    </a>
  )
}

function SkeletonLine({ width }: { width: string }) {
  return (
    <div style={{
      height: "0.75rem", width, borderRadius: "0.25rem",
      backgroundColor: "var(--border)",
      animation: "skeleton-pulse 1.5s ease-in-out infinite",
    }} />
  )
}

export function RepoTreeViewer({ projectId, githubLink, canWrite }: {
  projectId: string
  githubLink: string | null
  canWrite: boolean
}) {
  const [data, setData] = useState<RepoData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!!githubLink) // start loading if link exists

  useEffect(() => {
    if (!githubLink) return
    setLoading(true)
    setError(null)
    setData(null)
    fetch(`/api/projects/${projectId}/github-tree`, { credentials: "include" })
      .then(r => r.json())
      .then(json => {
        if (json.success) setData(json.data)
        else setError(json.error ?? "Failed to load repository")
      })
      .catch(() => setError("Failed to connect to GitHub"))
      .finally(() => setLoading(false))
  }, [projectId, githubLink])

  // No GitHub link
  if (!githubLink) {
    return (
      <div style={{
        textAlign: "center", padding: "2.5rem 1.5rem",
        border: "1px dashed var(--border)", borderRadius: "0.5rem",
        backgroundColor: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem",
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--text-muted)", opacity: 0.4 }}>
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
        </svg>
        <div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--text)" }}>No repository linked</p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {canWrite
              ? "Add a GitHub link by editing this project"
              : "The coordinator has not linked a repository yet"}
          </p>
        </div>
      </div>
    )
  }

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", padding: "1rem" }}>
        <style>{`@keyframes skeleton-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", margin: "0 0 0.5rem" }}>
          Fetching repository structure...
        </p>
        {[["60%", "0"], ["45%", "20px"], ["55%", "20px"], ["35%", "40px"], ["50%", "20px"]].map(([w, pl], i) => (
          <div key={i} style={{ paddingLeft: pl, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 14, height: 14, borderRadius: "0.2rem", backgroundColor: "var(--border)", animation: "skeleton-pulse 1.5s ease-in-out infinite", flexShrink: 0 }} />
            <SkeletonLine width={w} />
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div style={{
        padding: "1.5rem", border: "1px solid var(--border)", borderRadius: "0.5rem",
        backgroundColor: "var(--bg)", display: "flex", flexDirection: "column", gap: "0.875rem",
      }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--danger)", fontWeight: 500 }}>
          ⚠ {error}
        </p>
        <a
          href={githubLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.375rem",
            fontSize: "0.8rem", fontWeight: 600, color: "var(--primary)",
            textDecoration: "none", padding: "0.4rem 0.875rem",
            border: "1px solid var(--primary)", borderRadius: "0.375rem",
            width: "fit-content",
          }}
        >
          <ExternalLink size={13} /> Open on GitHub
        </a>
      </div>
    )
  }

  if (!data) return null

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "0.5rem", overflow: "hidden" }}>
      {/* Repo info bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.75rem 1rem", backgroundColor: "var(--surface)",
        borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: "0.5rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
          </svg>
          <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--text)" }}>{data.repoName}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.7rem", color: "var(--text-muted)" }}>
            <GitBranch size={11} />
            {data.defaultBranch}
          </div>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
            {data.totalFiles} files · {data.totalFolders} folders
          </span>
        </div>
        <a
          href={data.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.3rem",
            fontSize: "0.75rem", fontWeight: 600, color: "var(--primary)",
            textDecoration: "none", padding: "0.3rem 0.75rem",
            border: "1px solid var(--primary)", borderRadius: "0.375rem",
          }}
        >
          <ExternalLink size={12} /> View on GitHub
        </a>
      </div>

      {/* Tree */}
      <div style={{ maxHeight: 500, overflowY: "auto", padding: "0.5rem", backgroundColor: "var(--surface)" }}>
        {data.tree.length === 0 ? (
          <p style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.825rem", margin: 0 }}>
            Repository is empty.
          </p>
        ) : (
          data.tree.map((node, i) => (
            <TreeNodeRow key={`${node.path}-${i}`} node={node} depth={0} repoUrl={data.repoUrl} branch={data.defaultBranch} />
          ))
        )}
      </div>
    </div>
  )
}
