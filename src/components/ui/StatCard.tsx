interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  accentColor?: string
}

export function StatCard({ title, value, subtitle, accentColor = "var(--primary)" }: StatCardProps) {
  return (
    <div style={{
      backgroundColor: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "0.5rem",
      padding: "1.5rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      borderBottom: `4px solid ${accentColor}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 600 }}>
        {title}
      </span>
      <span style={{ fontSize: "2.25rem", fontWeight: 800, color: accentColor, lineHeight: 1.1, fontFamily: "var(--font-playfair, serif)" }}>
        {value}
      </span>
      {subtitle && (
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {subtitle}
        </span>
      )}
    </div>
  )
}
