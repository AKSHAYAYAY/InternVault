"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PasswordInput } from "@/components/ui/PasswordInput"

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.5rem 0.75rem",
  border: "1px solid var(--border)", borderRadius: "0.375rem",
  backgroundColor: "var(--bg)", color: "var(--text)", fontSize: "0.875rem", outline: "none",
}
const labelStyle: React.CSSProperties = {
  fontSize: "0.7rem", textTransform: "uppercase" as const,
  letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 700,
}
const btnPrimary: React.CSSProperties = {
  padding: "0.5rem 1.25rem", backgroundColor: "var(--primary)", color: "#fff",
  border: "none", borderRadius: "0.375rem", fontSize: "0.825rem", fontWeight: 600, cursor: "pointer",
}
const box: React.CSSProperties = {
  backgroundColor: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: "0.5rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem",
}

interface Props {
  user: { id: string; name: string; githubLink: string | null; linkedinLink: string | null }
}

export function ProfileEditClient({ user }: Props) {
  const router = useRouter()
  const [name, setName] = useState(user.name)
  const [github, setGithub] = useState(user.githubLink ?? "")
  const [linkedin, setLinkedin] = useState(user.linkedinLink ?? "")
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" })
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [savingPw, setSavingPw] = useState(false)

  function validateGithub(value: string): string {
    if (!value) return ""
    try {
      const url = new URL(value)
      if (url.hostname !== "github.com") return "Must be a github.com URL"
      const parts = url.pathname.replace(/^\//, "").split("/").filter(Boolean)
      if (parts.length === 0) return "Must include a GitHub username (e.g. github.com/username)"
      return ""
    } catch {
      return "Enter a valid URL (e.g. https://github.com/username)"
    }
  }

  function validateLinkedin(value: string): string {
    if (!value) return ""
    try {
      const url = new URL(value)
      if (!url.hostname.includes("linkedin.com")) return "Must be a linkedin.com URL"
      return ""
    } catch {
      return "Enter a valid URL (e.g. https://linkedin.com/in/username)"
    }
  }

  async function handleSaveProfile() {
    const ghErr = validateGithub(github)
    const liErr = validateLinkedin(linkedin)
    if (ghErr || liErr) {
      setProfileMsg({ text: [ghErr, liErr].filter(Boolean).join(" · "), ok: false })
      return
    }
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, githubLink: github || null, linkedinLink: linkedin || null }),
      })
      const data = await res.json()
      setProfileMsg({ text: data.message ?? data.error ?? "Profile updated", ok: res.ok })
      if (res.ok) {
        router.refresh()
        setTimeout(() => router.push(`/dashboard/profile/${user.id}`), 800)
      }
    } catch {
      setProfileMsg({ text: "Something went wrong.", ok: false })
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword() {
    setSavingPw(true)
    setPwMsg(null)
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next, confirmPassword: pw.confirm }),
      })
      const data = await res.json()
      setPwMsg({ text: data.message ?? data.error ?? "Error", ok: res.ok })
      if (res.ok) setPw({ current: "", next: "", confirm: "" })
    } catch {
      setPwMsg({ text: "Something went wrong.", ok: false })
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: 560 }}>
      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "var(--font-playfair, serif)", fontSize: "1.875rem", fontWeight: 700, color: "var(--text)", margin: "0 0 0.25rem" }}>
          Edit Profile
        </h1>
        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.875rem" }}>
          Update your name, social links, and password.
        </p>
      </div>

      {/* Profile info */}
      <div style={box}>
        <p style={{ ...labelStyle, margin: 0 }}>Profile Information</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          <label style={labelStyle}>Full Name</label>
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          <label style={labelStyle}>GitHub</label>
          <input
            type="url"
            value={github}
            onChange={e => setGithub(e.target.value)}
            placeholder="https://github.com/username"
            style={inputStyle}
          />
          {github && validateGithub(github) && (
            <p style={{ fontSize: "0.75rem", color: "var(--danger)", margin: 0 }}>{validateGithub(github)}</p>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          <label style={labelStyle}>LinkedIn</label>
          <input
            type="url"
            value={linkedin}
            onChange={e => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/username"
            style={inputStyle}
          />
          {linkedin && validateLinkedin(linkedin) && (
            <p style={{ fontSize: "0.75rem", color: "var(--danger)", margin: 0 }}>{validateLinkedin(linkedin)}</p>
          )}
        </div>

        {profileMsg && (
          <p style={{ fontSize: "0.8rem", color: profileMsg.ok ? "var(--success)" : "var(--danger)", margin: 0 }}>
            {profileMsg.ok ? "✓ " : "✕ "}{profileMsg.text}
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button style={{ ...btnPrimary, opacity: savingProfile ? 0.6 : 1 }} disabled={savingProfile} onClick={handleSaveProfile}>
            {savingProfile ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Change password */}
      <div style={box}>
        <p style={{ ...labelStyle, margin: 0 }}>Change Password</p>

        {[
          { key: "current", label: "Current Password" },
          { key: "next", label: "New Password (min 8 chars)" },
          { key: "confirm", label: "Confirm New Password" },
        ].map(({ key, label }) => (
          <div key={key} style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <label style={labelStyle}>{label}</label>
            <PasswordInput
              name={key}
              value={pw[key as keyof typeof pw]}
              onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
              style={inputStyle}
            />
          </div>
        ))}

        {pwMsg && (
          <p style={{ fontSize: "0.8rem", color: pwMsg.ok ? "var(--success)" : "var(--danger)", margin: 0 }}>
            {pwMsg.ok ? "✓ " : "✕ "}{pwMsg.text}
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button style={{ ...btnPrimary, opacity: savingPw ? 0.6 : 1 }} disabled={savingPw} onClick={handleChangePassword}>
            {savingPw ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  )
}
