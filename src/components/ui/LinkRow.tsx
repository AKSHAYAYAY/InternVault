"use client"

import { ReactNode } from "react"
import Link from "next/link"

export function LinkRow({ icon, label, url }: { icon: ReactNode, label: string, url: string }) {
  if (!url) return null

  return (
    <Link 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem",
        borderRadius: "0.375rem",
        backgroundColor: "var(--bg)",
        border: "1px solid var(--border)",
        textDecoration: "none",
        color: "var(--text)",
        fontSize: "0.875rem",
        fontWeight: 500,
        transition: "border-color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--primary)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)"
      }}
    >
      <div style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
        {icon}
      </div>
      <span>{label}</span>
    </Link>
  )
}
