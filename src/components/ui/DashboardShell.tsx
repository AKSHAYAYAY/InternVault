"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/ThemeToggle"
import { NotificationBell } from "@/components/ui/NotificationBell"
import { Menu, X, LayoutDashboard, Lightbulb, FolderKanban, Users, UserCircle, LogOut, ChevronRight } from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

interface SidebarProps {
  navItems: NavItem[]
  user: { name: string; role: string; department: string | null; id: string }
  batchSubtitle: string
  pathname: string
  onClose: () => void
  signOutAction: () => Promise<void>
}

interface Props {
  children: React.ReactNode
  user: { name: string; email: string; role: string; department: string | null; id: string }
  batchSubtitle: string
  signOutAction: () => Promise<void>
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/ideas": "Idea Bank",
  "/dashboard/projects": "Project Repository",
  "/dashboard/interns": "Manage Interns",
  "/dashboard/profile": "My Profile",
  "/dashboard/profile/edit": "Edit Profile",
  "/superadmin": "Super Admin",
  "/superadmin/ideas": "Idea Bank",
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith("/dashboard/projects/")) return "Project Details"
  if (pathname.startsWith("/dashboard/profile/")) return "Profile"
  if (pathname.startsWith("/dashboard/ideas/")) return "Idea Detail"
  if (pathname.startsWith("/superadmin/batches/")) return "Batch Details"
  return "InternVault"
}

function isNavActive(href: string, pathname: string): boolean {
  if (href === "/dashboard" || href === "/superadmin") return pathname === href
  return pathname.startsWith(href)
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
  return (
    <div style={{
      width: 34, height: 34, borderRadius: "50%",
      backgroundColor: "var(--primary)", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
      userSelect: "none",
    }}>
      {initials}
    </div>
  )
}

// ── Extracted as a stable outer component — NOT defined inside render ─────────
// This prevents React from treating it as a new component on every render,
// which was the primary cause of the hydration mismatch.
function SidebarContent({ navItems, user, batchSubtitle, pathname, onClose, signOutAction }: SidebarProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div style={{ padding: "1.5rem 1.5rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontFamily: "var(--font-playfair, serif)", fontSize: "1.25rem", fontWeight: 700, color: "var(--primary)", margin: 0, lineHeight: 1.2 }}>
              InternVault
            </p>
            {batchSubtitle && (
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "0.25rem 0 0", fontWeight: 500 }}>
                {batchSubtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="sidebar-close-btn"
            aria-label="Close menu"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem" }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "1rem 0", overflowY: "auto" }}>
        {navItems.map(item => {
          const active = isNavActive(item.href, pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="ds-nav-link"
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.625rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: active ? 600 : 500,
                color: active ? "var(--primary)" : "var(--text-muted)",
                textDecoration: "none",
                borderLeft: `3px solid ${active ? "var(--primary)" : "transparent"}`,
                backgroundColor: active ? "rgba(30,64,175,0.06)" : "transparent",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.03)"
                  e.currentTarget.style.color = "var(--text)"
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = "transparent"
                  e.currentTarget.style.color = "var(--text-muted)"
                }
              }}
            >
              <span style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }}>{item.icon}</span>
              {item.label}
              {active && <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.5 }} />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom user info + sign out */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "1rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
          <Avatar name={user.name} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.name}
            </p>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.role.replace("_", " ")}{user.department ? ` · ${user.department}` : ""}
            </p>
          </div>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 0.75rem", backgroundColor: "transparent",
              border: "1px solid var(--border)", borderRadius: "0.375rem",
              fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)",
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--danger)"; e.currentTarget.style.color = "var(--danger)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)" }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Main shell ────────────────────────────────────────────────────────────────

export function DashboardShell({ children, user, batchSubtitle, signOutAction }: Props) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // mounted guard — prevents any pathname-dependent rendering mismatch on hydration
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setSidebarOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [sidebarOpen])

  const isCoordinator = user.role === "COORDINATOR"
  const isSuperAdmin = user.role === "SUPER_ADMIN"

  const navItems: NavItem[] = isSuperAdmin ? [
    { href: "/superadmin", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
    { href: "/superadmin/ideas", label: "Idea Bank", icon: <Lightbulb size={17} /> },
    { href: "/dashboard/projects", label: "Project Repository", icon: <FolderKanban size={17} /> },
  ] : [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
    { href: "/dashboard/ideas", label: "Idea Bank", icon: <Lightbulb size={17} /> },
    { href: "/dashboard/projects", label: "Project Repository", icon: <FolderKanban size={17} /> },
    ...(isCoordinator ? [{ href: "/dashboard/interns", label: "Manage Interns", icon: <Users size={17} /> }] : []),
    { href: `/dashboard/profile/${user.id}`, label: "My Profile", icon: <UserCircle size={17} /> },
  ]

  // Use "/" as a stable fallback pathname during SSR so active states are
  // identical on server and client until mounted.
  const stablePathname = mounted ? pathname : "/"
  const pageTitle = mounted ? getPageTitle(pathname) : ""

  const sidebarProps: SidebarProps = {
    navItems,
    user,
    batchSubtitle,
    pathname: stablePathname,
    onClose: () => setSidebarOpen(false),
    signOutAction,
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg)" }}>

      {/* ── Top Header ──────────────────────────────────────────────────── */}
      <header style={{
        backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)",
        position: "sticky", top: 0, zIndex: 50, height: 56,
      }}>
        <div style={{ display: "flex", alignItems: "center", height: "100%", padding: "0 1.5rem", gap: "1rem" }}>
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)", padding: "0.25rem", alignItems: "center" }}
          >
            <Menu size={22} />
          </button>

          <p style={{ fontFamily: "var(--font-playfair, serif)", fontSize: "1.125rem", fontWeight: 600, color: "var(--text)", margin: 0, flex: 1 }}>
            {pageTitle}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <NotificationBell role={user.role} />
            <ThemeToggle />
            <Link href={`/dashboard/profile/${user.id}`} style={{ textDecoration: "none" }}>
              <Avatar name={user.name} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Desktop sidebar */}
        <aside
          className="desktop-sidebar"
          style={{
            width: 240, flexShrink: 0,
            backgroundColor: "var(--surface)", borderRight: "1px solid var(--border)",
            position: "sticky", top: 56, height: "calc(100vh - 56px)",
            overflowY: "auto",
          }}
        >
          <SidebarContent {...sidebarProps} />
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="mobile-overlay"
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 80 }}
          />
        )}

        {/* Mobile sidebar */}
        <aside
          className="mobile-sidebar"
          style={{
            position: "fixed", top: 0, left: 0, bottom: 0,
            width: 260, backgroundColor: "var(--surface)",
            borderRight: "1px solid var(--border)",
            zIndex: 90, overflowY: "auto",
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.25s ease",
          }}
        >
          <SidebarContent {...sidebarProps} />
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: "2rem 2.5rem", overflowY: "auto", minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
