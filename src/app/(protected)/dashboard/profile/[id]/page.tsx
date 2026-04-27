import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { SocialLink } from "@/components/ui/SocialLink"

const GithubIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
  </svg>
)

const LinkedinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, email: true, role: true, department: true,
      githubLink: true, linkedinLink: true, createdAt: true,
      projectMemberships: { select: { project: { select: { id: true, name: true, status: true } } } },
      submittedIdeas: { select: { id: true }, where: { status: "APPROVED" } },
      contributions: { select: { id: true } },
    },
  })

  if (!user) notFound()

  const isOwner = session.user.id === params.id

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: 640 }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <h1 style={{ fontFamily: "var(--font-playfair, serif)", fontSize: "1.875rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
            {user.name}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "9999px", backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              {user.role.replace("_", " ")}
            </span>
            {user.department && (
              <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "9999px", backgroundColor: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                {user.department}
              </span>
            )}
          </div>

          {/* Social links — rendered by client component to support hover */}
          {(user.githubLink || user.linkedinLink) && (
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
              {user.githubLink && (
                <SocialLink href={user.githubLink} label="GitHub" icon={<GithubIcon />} />
              )}
              {user.linkedinLink && (
                <SocialLink href={user.linkedinLink} label="LinkedIn" icon={<LinkedinIcon />} />
              )}
            </div>
          )}
        </div>

        {isOwner && (
          <Link href="/dashboard/profile/edit" style={{ padding: "0.5rem 1rem", border: "1px solid var(--border)", borderRadius: "0.375rem", fontSize: "0.825rem", fontWeight: 500, color: "var(--text)", textDecoration: "none", backgroundColor: "var(--bg)" }}>
            Edit Profile
          </Link>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {[
          { label: "Projects", value: user.projectMemberships.length },
          { label: "Approved Ideas", value: user.submittedIdeas.length },
          { label: "Contributions", value: user.contributions.length },
        ].map(({ label, value }) => (
          <div key={label} style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "1.25rem", textAlign: "center" }}>
            <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary)", fontFamily: "var(--font-playfair, serif)", margin: "0 0 0.25rem" }}>{value}</p>
            <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: 0, fontWeight: 600 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Projects */}
      {user.projectMemberships.length > 0 && (
        <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "1.5rem" }}>
          <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 700, margin: "0 0 1rem" }}>
            Projects
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {user.projectMemberships.map(({ project: p }) => (
              <Link key={p.id} href={`/dashboard/projects/${p.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.625rem 0.875rem", borderRadius: "0.375rem", backgroundColor: "var(--bg)", textDecoration: "none", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)" }}>{p.name}</span>
                <span style={{
                  fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "9999px",
                  backgroundColor: p.status === "COMPLETED" ? "rgba(21,128,61,0.1)" : p.status === "IN_PROGRESS" ? "rgba(59,130,246,0.1)" : "rgba(180,83,9,0.1)",
                  color: p.status === "COMPLETED" ? "var(--success)" : p.status === "IN_PROGRESS" ? "var(--primary)" : "var(--warning)",
                }}>
                  {p.status.replace("_", " ")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
