import Link from "next/link"

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      backgroundColor: "var(--bg)", padding: "2rem",
    }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <p style={{
          fontFamily: "var(--font-playfair, serif)",
          fontSize: "6rem", fontWeight: 800,
          color: "var(--primary)", lineHeight: 1, margin: "0 0 0.5rem",
        }}>
          404
        </p>
        <h1 style={{
          fontFamily: "var(--font-playfair, serif)",
          fontSize: "1.5rem", fontWeight: 700,
          color: "var(--text)", margin: "0 0 0.75rem",
        }}>
          Page Not Found
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: "0 0 2rem", lineHeight: 1.6 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.625rem 1.5rem",
            backgroundColor: "var(--primary)", color: "#fff",
            borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 600,
            textDecoration: "none",
          }}
        >
          ← Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
