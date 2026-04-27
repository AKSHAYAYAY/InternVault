"use client"

import { useState } from "react"

interface SocialLinkProps {
  href: string
  label: string
  icon: React.ReactNode
  compact?: boolean
}

export function SocialLink({ href, label, icon, compact = false }: SocialLinkProps) {
  const [hovered, setHovered] = useState(false)

  if (compact) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={label}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.2rem",
          fontSize: "0.7rem", fontWeight: 500,
          color: hovered ? "var(--primary)" : "var(--text-muted)",
          textDecoration: "none",
          transition: "color 0.15s",
        }}
      >
        {icon} {label}
      </a>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: "0.375rem",
        padding: "0.4rem 0.875rem",
        border: `1px solid ${hovered ? "var(--primary)" : "var(--border)"}`,
        borderRadius: "0.375rem",
        color: hovered ? "var(--primary)" : "var(--text)",
        textDecoration: "none",
        fontSize: "0.825rem", fontWeight: 500,
        backgroundColor: "var(--bg)",
        transition: "border-color 0.15s, color 0.15s",
      }}
    >
      {icon} {label}
    </a>
  )
}
