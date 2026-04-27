"use client"

import { useRouter } from "next/navigation"

export function DeptFilter({ current }: { current: string }) {
  const router = useRouter()

  return (
    <select
      value={current}
      onChange={(e) => {
        router.push(`/superadmin/ideas?dept=${e.target.value}`)
      }}
      style={{
        padding: "0.5rem",
        borderRadius: "0.375rem",
        border: "1px solid var(--border)",
        backgroundColor: "var(--surface)",
        color: "var(--text)",
        cursor: "pointer"
      }}
    >
      <option value="IT">IT</option>
      <option value="REVENUE">REVENUE</option>
      <option value="LAWS">LAWS</option>
      <option value="AICSTL">AICSTL</option>
    </select>
  )
}
