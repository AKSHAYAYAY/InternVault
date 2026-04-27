"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { X } from "lucide-react"

export function ProfileBanner({ hasGithub, hasLinkedin }: { hasGithub: boolean; hasLinkedin: boolean }) {
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Before mount: render nothing — same on server and client, no mismatch
  if (!mounted) return null

  if (dismissed || (hasGithub && hasLinkedin)) return null

  return (
    <div style={{
      backgroundColor: "rgba(30,64,175,0.07)",
      border: "1px solid rgba(30,64,175,0.2)",
      borderLeft: "4px solid var(--primary)",
      borderRadius: "0.375rem",
      padding: "0.875rem 1rem",
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      flexWrap: "wrap",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "var(--text)" }}>
          Complete your profile
        </p>
        <p style={{ margin: "0.125rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Add your GitHub and LinkedIn so your contributions are properly credited.
        </p>
      </div>
      <Link
        href="/dashboard/profile/edit"
        style={{
          padding: "0.4rem 1rem",
          backgroundColor: "var(--primary)", color: "#fff",
          borderRadius: "0.375rem", fontSize: "0.8rem", fontWeight: 600,
          textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
        }}
      >
        Complete Profile
      </Link>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text-muted)", display: "flex", padding: "0.25rem", flexShrink: 0,
        }}
      >
        <X size={16} />
      </button>
    </div>
  )
}
