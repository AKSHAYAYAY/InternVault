import Link from "next/link"
import { Code, FileText, MonitorPlay, Sigma, Presentation } from "lucide-react"

function BatchPill({ n, label }: { n: number; label?: string }) {
  return (
    <span style={{
      fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem",
      borderRadius: "0.25rem", backgroundColor: "var(--bg)",
      border: "1px solid var(--border)", color: "var(--text-muted)",
      whiteSpace: "nowrap",
    }}>
      {label ? `${label} Batch ${n}` : `Batch ${n}`}
    </span>
  )
}

export function ProjectCard({ project }: { project: any }) {
  const visibleTech = project.techStack?.slice(0, 3) || []
  const excessTech = (project.techStack?.length || 0) - 3
  const continuedBatches: number[] = project.continuedInBatches || []

  return (
    <div style={{
      backgroundColor: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "0.5rem",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 1px 3px 0 rgba(0,0,0,0.08)",
      overflow: "hidden",
    }}>
      {/* Top */}
      <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--bg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
          <h3 style={{ margin: 0, fontFamily: "var(--font-playfair)", fontSize: "1.125rem", fontWeight: 600, color: "var(--text)" }}>
            {project.name}
          </h3>
          <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span style={{
              fontSize: "0.65rem", fontWeight: 600, padding: "0.125rem 0.5rem",
              borderRadius: "9999px", backgroundColor: "var(--bg)", color: "var(--text-muted)",
            }}>{project.department}</span>
            <span style={{
              fontSize: "0.65rem", fontWeight: 600, padding: "0.125rem 0.5rem",
              borderRadius: "9999px",
              backgroundColor: project.status === "COMPLETED" ? "rgba(74,222,128,0.15)"
                : project.status === "IN_PROGRESS" ? "rgba(59,130,246,0.15)" : "rgba(251,191,36,0.15)",
              color: project.status === "COMPLETED" ? "var(--success)"
                : project.status === "IN_PROGRESS" ? "var(--primary)" : "var(--warning)",
            }}>{project.status.replace("_", " ")}</span>
          </div>
        </div>
      </div>

      {/* Middle */}
      <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        <p style={{
          margin: 0, fontSize: "0.875rem", color: "var(--text-muted)",
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {project.problemStatement || project.description}
        </p>

        {/* Tech stack */}
        {visibleTech.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
            {visibleTech.map((tech: string) => (
              <span key={tech} style={{
                fontSize: "0.7rem", backgroundColor: "var(--bg)", border: "1px solid var(--border)",
                padding: "0.125rem 0.375rem", borderRadius: "0.25rem", color: "var(--text-muted)",
              }}>{tech}</span>
            ))}
            {excessTech > 0 && (
              <span style={{
                fontSize: "0.7rem", backgroundColor: "var(--bg)", border: "1px solid var(--border)",
                padding: "0.125rem 0.375rem", borderRadius: "0.25rem", color: "var(--text-muted)",
              }}>+{excessTech} more</span>
            )}
          </div>
        )}

        {/* Batch info */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", alignItems: "center" }}>
          {project.startedInBatch != null && (
            <BatchPill n={project.startedInBatch} label="Started:" />
          )}
          {continuedBatches.map((n: number) => (
            <BatchPill key={n} n={n} label="Continued:" />
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "1rem", backgroundColor: "var(--bg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
              {project.contributorCount || 0} Members
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
              {project.contributionCount || 0} Contributions
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {project.githubLink && <IconLink url={project.githubLink} icon={<Code size={16} />} title="GitHub" />}
            {project.prdLink && <IconLink url={project.prdLink} icon={<FileText size={16} />} title="PRD" />}
            {project.workingModelLink && <IconLink url={project.workingModelLink} icon={<MonitorPlay size={16} />} title="Demo" />}
            {project.figmaLink && <IconLink url={project.figmaLink} icon={<Sigma size={16} />} title="Figma" />}
            {project.presentationLink && <IconLink url={project.presentationLink} icon={<Presentation size={16} />} title="Slides" />}
          </div>
        </div>

        <Link
          href={`/dashboard/projects/${project.id}`}
          style={{
            display: "block", textAlign: "center", textDecoration: "none",
            backgroundColor: "transparent", border: "1px solid var(--primary)",
            color: "var(--primary)", padding: "0.5rem", borderRadius: "0.375rem",
            fontSize: "0.875rem", fontWeight: 600, transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--primary)"; e.currentTarget.style.color = "#fff" }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--primary)" }}
        >
          View Details
        </Link>
      </div>
    </div>
  )
}

function IconLink({ url, icon, title }: { url: string; icon: React.ReactNode; title: string }) {
  return (
    <a
      href={url} target="_blank" rel="noopener noreferrer" title={title}
      style={{ color: "var(--text-muted)", display: "flex", cursor: "pointer", transition: "color 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.color = "var(--primary)"}
      onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
    >
      {icon}
    </a>
  )
}
