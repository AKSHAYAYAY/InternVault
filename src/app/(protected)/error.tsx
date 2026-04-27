"use client"

import { useEffect } from "react"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[App Error]", error)
  }, [error])

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "60vh", gap: "1.25rem", textAlign: "center", padding: "2rem",
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        backgroundColor: "rgba(185,28,28,0.1)", color: "var(--danger)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.5rem",
      }}>
        ⚠
      </div>
      <div>
        <h2 style={{ fontFamily: "var(--font-playfair, serif)", fontSize: "1.25rem", fontWeight: 700, color: "var(--text)", margin: "0 0 0.5rem" }}>
          Something went wrong
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0, maxWidth: 360 }}>
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
      <button
        onClick={reset}
        style={{
          padding: "0.5rem 1.25rem", backgroundColor: "var(--primary)", color: "#fff",
          border: "none", borderRadius: "0.375rem", fontSize: "0.825rem",
          fontWeight: 600, cursor: "pointer",
        }}
      >
        Try Again
      </button>
    </div>
  )
}
