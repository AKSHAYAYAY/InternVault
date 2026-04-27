"use client"

import { X } from "lucide-react"

export function MemberChip({ name, onRemove }: { name: string, onRemove: () => void }) {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      backgroundColor: "var(--bg)",
      border: "1px solid var(--border)",
      padding: "0.25rem 0.5rem",
      borderRadius: "9999px",
      fontSize: "0.75rem",
      fontWeight: 500,
      color: "var(--text)"
    }}>
      <span>{name}</span>
      <button 
        type="button" 
        onClick={onRemove}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          display: "flex",
          cursor: "pointer",
          color: "var(--text-muted)"
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
}
