"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Bell, CheckCircle, XCircle, Lightbulb, UserPlus } from "lucide-react"

interface NotifItem {
  id: string
  type: "pending_idea" | "join_request" | "idea_approved" | "idea_rejected"
  message: string
  actor: string | null
  href: string
  date: string
  read: boolean
}

interface NotifData {
  count: number
  pendingIdeas?: number
  pendingJoinRequests?: number
  items: NotifItem[]
}

const TYPE_ICON: Record<NotifItem["type"], React.ReactNode> = {
  pending_idea:   <Lightbulb size={14} />,
  join_request:   <UserPlus size={14} />,
  idea_approved:  <CheckCircle size={14} />,
  idea_rejected:  <XCircle size={14} />,
}

const TYPE_COLOR: Record<NotifItem["type"], string> = {
  pending_idea:   "var(--warning)",
  join_request:   "var(--primary)",
  idea_approved:  "var(--success)",
  idea_rejected:  "var(--danger)",
}

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })

export function NotificationBell({ role }: { role: string }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<NotifData | null>(null)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notifications", { credentials: "include" })
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch {}
    finally { setLoading(false) }
  }, [])

  // Fetch on mount + every 60s
  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 60_000)
    return () => clearInterval(interval)
  }, [fetchNotifs])

  // Outside click close
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const count = data?.count ?? 0
  const items = data?.items ?? []

  const viewAllHref = role === "COORDINATOR" ? "/dashboard/ideas" : "/dashboard/ideas"

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifs() }}
        aria-label="Notifications"
        style={{
          background: "none",
          border: `1px solid ${open ? "var(--primary)" : "var(--border)"}`,
          borderRadius: "0.5rem",
          width: 36, height: 36,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          color: open ? "var(--primary)" : "var(--text-muted)",
          position: "relative",
          transition: "all 0.15s",
        }}
      >
        <Bell size={17} />
        {count > 0 && (
          <span style={{
            position: "absolute", top: -5, right: -5,
            minWidth: 17, height: 17, borderRadius: "9999px",
            backgroundColor: "var(--danger)", color: "#fff",
            fontSize: "0.6rem", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px",
            border: "2px solid var(--surface)",
            lineHeight: 1,
          }}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 320, backgroundColor: "var(--surface)",
          border: "1px solid var(--border)", borderRadius: "0.625rem",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          zIndex: 200, overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: "0.825rem", fontWeight: 700, color: "var(--text)" }}>
              Notifications
            </p>
            {count > 0 && (
              <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "9999px", backgroundColor: "rgba(185,28,28,0.1)", color: "var(--danger)" }}>
                {count} new
              </span>
            )}
          </div>

          {/* Summary pills — coordinator only */}
          {role === "COORDINATOR" && data && (data.pendingIdeas! > 0 || data.pendingJoinRequests! > 0) && (
            <div style={{ padding: "0.625rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {data.pendingIdeas! > 0 && (
                <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "9999px", backgroundColor: "rgba(180,83,9,0.1)", color: "var(--warning)" }}>
                  {data.pendingIdeas} idea{data.pendingIdeas !== 1 ? "s" : ""} pending
                </span>
              )}
              {data.pendingJoinRequests! > 0 && (
                <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "9999px", backgroundColor: "rgba(30,64,175,0.1)", color: "var(--primary)" }}>
                  {data.pendingJoinRequests} join request{data.pendingJoinRequests !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}

          {/* Items */}
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {loading && items.length === 0 ? (
              <p style={{ padding: "1.5rem", textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                Loading...
              </p>
            ) : items.length === 0 ? (
              <p style={{ padding: "1.5rem", textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                You're all caught up ✓
              </p>
            ) : (
              items.map((item, i) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none",
                    textDecoration: "none",
                    backgroundColor: "transparent",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg)"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  {/* Icon circle */}
                  <span style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    backgroundColor: `color-mix(in srgb, ${TYPE_COLOR[item.type]} 12%, transparent)`,
                    color: TYPE_COLOR[item.type],
                  }}>
                    {TYPE_ICON[item.type]}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 500, color: "var(--text)", lineHeight: 1.4 }}>
                      {item.message}
                    </p>
                    {item.actor && (
                      <p style={{ margin: "0.125rem 0 0", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        {item.actor}
                      </p>
                    )}
                  </div>

                  <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", flexShrink: 0, paddingTop: "0.125rem" }}>
                    {fmt(item.date)}
                  </span>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "0.625rem 1rem", borderTop: "1px solid var(--border)", textAlign: "center" }}>
            <Link
              href={viewAllHref}
              onClick={() => setOpen(false)}
              style={{ fontSize: "0.775rem", fontWeight: 600, color: "var(--primary)", textDecoration: "none" }}
            >
              View All →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
