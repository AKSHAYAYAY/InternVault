"use client"

import { useState, useMemo } from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import Link from "next/link"
import { EditProjectModal } from "./EditProjectModal"
import { DeleteProjectButton } from "./DeleteProjectButton"

export interface ColumnDef {
  key: string
  header: string
  sortable?: boolean
  type?: "text" | "status" | "date" | "intern-actions" | "project-actions" | "dept-actions"
}

interface DataTableProps<T = any> {
  columns: ColumnDef[]
  data: T[]
  searchable?: boolean
  searchPlaceholder?: string
  searchKeys?: string[]
  pageSize?: number
  filterSlot?: React.ReactNode
  // Context for actions
  department?: string
  interns?: { id: string; name: string; department?: string }[]
  onDeptSelect?: (dept: string) => void
  allProjects?: any[] // for full project data in Edit modal
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchable,
  searchPlaceholder = "Search...",
  searchKeys = [],
  pageSize = 10,
  filterSlot,
  department,
  interns = [],
  onDeptSelect,
  allProjects = []
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let rows = [...data]
    if (search && searchKeys.length > 0) {
      const q = search.toLowerCase()
      rows = rows.filter(row => searchKeys.some(k => String(row[k] ?? "").toLowerCase().includes(q)))
    }
    if (sortKey) {
      rows.sort((a, b) => {
        const av = a[sortKey] ?? ""
        const bv = b[sortKey] ?? ""
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
        return sortDir === "asc" ? cmp : -cmp
      })
    }
    return rows
  }, [data, search, sortKey, sortDir, searchKeys])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  function handleSort(col: ColumnDef) {
    if (!col.sortable) return
    if (sortKey === col.key) {
      setSortDir(d => d === "asc" ? "desc" : "asc")
    } else {
      setSortKey(col.key)
      setSortDir("asc")
    }
    setPage(1)
  }

  function renderCell(row: T, col: ColumnDef) {
    const val = row[col.key]

    switch (col.type) {
      case "status": {
        const colors: Record<string, string> = { 
          COMPLETED: "var(--success)", 
          IN_PROGRESS: "var(--primary)", 
          IDEA: "var(--warning)",
          APPROVED: "var(--success)",
          PENDING: "var(--warning)",
          REJECTED: "var(--danger)"
        }
        return (
          <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "9999px", backgroundColor: "var(--bg)", color: colors[val] ?? "var(--text-muted)" }}>
            {String(val ?? "").replace("_", " ")}
          </span>
        )
      }
      case "date":
        return val ? new Date(val).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"
      
      case "intern-actions":
        return (
          <Link href={`/dashboard/profile/${row.id}`} style={{ fontSize: "0.7rem", padding: "0.2rem 0.6rem", border: "1px solid var(--border)", borderRadius: "0.25rem", color: "var(--text)", whiteSpace: "nowrap" }}>
            View Profile
          </Link>
        )

      case "project-actions": {
        const fullProject = allProjects.find(p => p.id === row.id) || row
        const projectDept = fullProject.department || row.department || department
        // Filter interns by department if department info is available on interns
        const projectInterns = interns.filter(i => !i.department || i.department === projectDept)
        
        return (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link href={`/dashboard/projects/${row.id}`} style={{ fontSize: "0.7rem", padding: "0.2rem 0.6rem", border: "1px solid var(--primary)", borderRadius: "0.25rem", color: "var(--primary)", whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>
              View
            </Link>
            <EditProjectModal 
              project={fullProject}
              department={projectDept} 
              interns={projectInterns}
              variant="table"
            />
            <DeleteProjectButton projectId={row.id} variant="table" />
          </div>
        )
      }

      case "dept-actions":
        return (
          <button
            onClick={() => onDeptSelect?.(row.name)}
            style={{ fontSize: "0.7rem", padding: "0.2rem 0.6rem", border: "1px solid var(--border)", borderRadius: "0.25rem", cursor: "pointer", backgroundColor: "transparent", color: "var(--text)" }}
          >
            View Dept
          </button>
        )

      default:
        return String(val ?? "")
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: "0.375rem 0.625rem",
    border: "1px solid var(--border)",
    borderRadius: "0.25rem",
    backgroundColor: "var(--surface)",
    color: "var(--text)",
    fontSize: "0.825rem",
    outline: "none",
    width: "220px",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {(searchable || filterSlot) && (
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          {searchable && (
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={inputStyle}
            />
          )}
          {filterSlot}
        </div>
      )}

      <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "0.5rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.825rem" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--bg)" }}>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col)}
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "left",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-muted)",
                    borderBottom: "1px solid var(--border)",
                    cursor: col.sortable ? "pointer" : "default",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    {col.header}
                    {col.sortable && (
                      sortKey === col.key
                        ? sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        : <ChevronsUpDown size={12} style={{ opacity: 0.4 }} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)" }}>
                  No results found
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr
                  key={row.id || i}
                  style={{ borderBottom: i < paginated.length - 1 ? "1px solid var(--border)" : "none", backgroundColor: "var(--surface)" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--bg)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--surface)")}
                >
                  {columns.map(col => (
                    <td key={col.key} style={{ padding: "0.75rem 1rem", verticalAlign: "middle", color: "var(--text)" }}>
                      {renderCell(row, col)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: "0.25rem 0.75rem", border: "1px solid var(--border)", borderRadius: "0.25rem", backgroundColor: "var(--surface)", color: "var(--text)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1 }}
            >
              Prev
            </button>
            <span style={{ padding: "0.25rem 0.5rem", fontWeight: 600, color: "var(--text)" }}>{page}/{totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: "0.25rem 0.75rem", border: "1px solid var(--border)", borderRadius: "0.25rem", backgroundColor: "var(--surface)", color: "var(--text)", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
