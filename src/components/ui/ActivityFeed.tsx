"use client"

function timeAgo(date: Date | string): string {
  const now = new Date()
  const d = new Date(date)
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

interface Activity {
  type: "idea" | "project"
  title: string
  date: string | Date
  status: string
  actor?: string | null
}

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
        No recent activity
      </div>
    )
  }

  return (
    <div style={{ maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {activities.map((item, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "flex-start", gap: "0.875rem",
          padding: "0.875rem 0",
          borderBottom: i < activities.length - 1 ? "1px solid var(--border)" : "none"
        }}>
          {/* Colored dot */}
          <div style={{ flexShrink: 0, marginTop: "0.3rem" }}>
            <div style={{
              width: "8px", height: "8px", borderRadius: "50%",
              backgroundColor: item.type === "project" ? "var(--success)" : "var(--primary)"
            }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "0.825rem", color: "var(--text)", lineHeight: 1.5 }}>
              {item.type === "idea" ? (
                <>
                  <span style={{ fontWeight: 600 }}>{item.actor ?? "Someone"}</span>{" "}
                  submitted idea:{" "}
                  <span style={{ fontStyle: "italic" }}>{item.title}</span>
                </>
              ) : (
                <>
                  Project <span style={{ fontWeight: 600 }}>{item.title}</span> updated to{" "}
                  <span style={{ color: "var(--text-muted)" }}>{item.status.replace("_", " ")}</span>
                </>
              )}
            </p>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.7rem", color: "var(--text-muted)" }}>
              {timeAgo(item.date)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
