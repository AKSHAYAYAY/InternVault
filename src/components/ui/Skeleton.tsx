export function SkeletonBlock({ width = "100%", height = "1rem", radius = "0.375rem", style }: { width?: string | number; height?: string | number; radius?: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      backgroundColor: "var(--border)",
      animation: "skeleton-pulse 1.5s ease-in-out infinite",
      ...style,
    }} />
  )
}

export function SkeletonCard() {
  return (
    <div style={{
      backgroundColor: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "0.5rem", padding: "1.5rem",
      display: "flex", flexDirection: "column", gap: "0.75rem",
    }}>
      <SkeletonBlock height="0.75rem" width="40%" />
      <SkeletonBlock height="2.25rem" width="60%" />
      <SkeletonBlock height="0.65rem" width="50%" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid var(--border)" }}>
      <SkeletonBlock width={120} height="0.8rem" />
      <SkeletonBlock width={80} height="0.8rem" />
      <SkeletonBlock width={60} height="0.8rem" />
      <SkeletonBlock width={80} height="0.8rem" style={{ marginLeft: "auto" }} />
    </div>
  )
}

export function PageLoadingSkeleton({ rows = 3, cards = 4 }: { rows?: number; cards?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Header skeleton */}
      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <SkeletonBlock height="1.875rem" width="280px" />
        <SkeletonBlock height="0.875rem" width="200px" />
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cards}, 1fr)`, gap: "1.25rem" }}>
        {Array.from({ length: cards }).map((_, i) => <SkeletonCard key={i} />)}
      </div>

      {/* Table rows */}
      <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "1.5rem" }}>
        <SkeletonBlock height="0.7rem" width="120px" style={{ marginBottom: "1.25rem" }} />
        {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  )
}
