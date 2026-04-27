"use client"

import { useState, useMemo } from "react"
import { DataTable, ColumnDef } from "@/components/ui/DataTable"

interface ProjectsTableProps {
  columns: ColumnDef[]
  data: any[]
  department?: string
  interns?: { id: string; name: string }[]
  allProjects?: any[]
}

export function ProjectsTable({ columns, data, ...props }: ProjectsTableProps) {
  const [statusFilter, setStatusFilter] = useState("ALL")

  const filteredData = useMemo(() => {
    if (statusFilter === "ALL") return data
    return data.filter(p => p.status === statusFilter)
  }, [data, statusFilter])

  return (
    <DataTable
      columns={columns}
      data={filteredData}
      pageSize={10}
      searchable
      searchPlaceholder="Search projects..."
      searchKeys={["name"]}
      {...props}
      filterSlot={
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: "0.375rem 0.625rem",
            border: "1px solid var(--border)",
            borderRadius: "0.25rem",
            backgroundColor: "var(--surface)",
            color: "var(--text)",
            fontSize: "0.825rem",
            outline: "none",
          }}
        >
          <option value="ALL">All Status</option>
          <option value="IDEA">Idea</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      }
    />
  )
}
