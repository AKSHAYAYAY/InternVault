import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Code, FileText, MonitorPlay, Sigma, Presentation } from "lucide-react"
import { LinkRow } from "@/components/ui/LinkRow"
import { ContinueProjectButton } from "@/components/ui/ContinueProjectButton"
import { EditProjectModal } from "@/components/ui/EditProjectModal"
import { DeleteProjectButton } from "@/components/ui/DeleteProjectButton"
import { ProjectVersionSection } from "@/components/files/ProjectVersionSection"
import { SocialLink } from "@/components/ui/SocialLink"

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  const { id } = params
  
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      members: { include: { user: { select: { id: true, name: true, role: true, department: true, githubLink: true, linkedinLink: true } } } },
      contributions: { include: { intern: { select: { name: true, department: true } } }, orderBy: { date: "desc" } },
      files: { include: { uploadedBy: { select: { name: true } } }, orderBy: { uploadedAt: "desc" } },
      versions: {
        orderBy: { versionNumber: "desc" },
        include: { uploadedBy: { select: { name: true } } },
      },
    }
  })

  if (!project) return <div>Project not found</div>

  const isSuperAdmin = session.user.role === "SUPER_ADMIN"
  const isCoordinator = session.user.role === "COORDINATOR"
  const isIntern = session.user.role === "INTERN"
  const canWrite = isSuperAdmin || isCoordinator
  
  // Security Checks
  if (!isSuperAdmin && project.department !== session.user.department) {
    return <div>Access Denied. Project is from another department.</div>
  }

  const isMember = project.members.some(m => m.user.id === session.user!.id)
  const canUpload = canWrite || isMember

  // Fetch department members for the Edit modal assignment dropdown
  const interns = canWrite ? await prisma.user.findMany({
    where: { department: project.department, role: "INTERN" },
    select: { id: true, name: true, email: true }
  }) : []

  // Parse folder structure for file section — kept for backward compat display
  const fileCount = project.files.length
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <style>{`
        .layout-grid { display: grid; grid-template-columns: 70% 1fr; gap: 2rem; }
        @media (max-width: 1024px) { .layout-grid { grid-template-columns: 1fr; } }
        .section-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin: 0 0 1rem 0; font-weight: 600; }
        .box { background-color: var(--surface); border: 1px solid var(--border); border-radius: 0.5rem; padding: 1.5rem; }
      `}</style>
      
      <div className="layout-grid">
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          
          {/* Section 1: Header */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "2rem", color: "var(--text)", margin: 0 }}>{project.name}</h1>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.25rem 0.75rem", borderRadius: "9999px", backgroundColor: "var(--bg)", color: "var(--text-muted)" }}>{project.department}</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.25rem 0.75rem", borderRadius: "9999px", backgroundColor: "var(--bg)", color: "var(--text)" }}>{project.status.replace('_', ' ')}</span>
              {project.startedInBatch != null && (
                <span style={{
                  fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.5rem",
                  borderRadius: "0.25rem", backgroundColor: "var(--bg)",
                  border: "1px solid var(--border)", color: "var(--text-muted)", marginLeft: "auto",
                }}>
                  Started: Batch {project.startedInBatch}
                  {(project.continuedInBatches || []).length > 0 && (
                    <> · Continued: {(project.continuedInBatches as number[]).map(n => `Batch ${n}`).join(", ")}</>
                  )}
                </span>
              )}
            </div>
            
            {project.problemStatement && (
              <div style={{ backgroundColor: "var(--bg)", borderLeft: "4px solid var(--primary)", padding: "1rem", borderRadius: "0 0.5rem 0.5rem 0", color: "var(--text)" }}>
                <strong>Problem Statement:</strong> {project.problemStatement}
              </div>
            )}
          </div>

          {/* Section 2: About */}
          <div>
            <h2 className="section-label">About This Project</h2>
            <p style={{ color: "var(--text)", lineHeight: 1.6, whiteSpace: "pre-line", margin: "0 0 1rem 0" }}>{project.description}</p>
            {project.techStack.length > 0 && (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {project.techStack.map(tech => (
                  <span key={tech} style={{ fontSize: "0.75rem", backgroundColor: "var(--bg)", border: "1px solid var(--border)", padding: "0.25rem 0.75rem", borderRadius: "9999px", color: "var(--text)" }}>{tech}</span>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Links */}
          {(project.githubLink || project.prdLink || project.workingModelLink || project.figmaLink || project.presentationLink) && (
            <div>
              <h2 className="section-label">Resources & Links</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {project.githubLink && <LinkRow icon={<Code size={18}/>} label="GitHub Repository" url={project.githubLink} />}
                {project.prdLink && <LinkRow icon={<FileText size={18}/>} label="PRD / Document" url={project.prdLink} />}
                {project.workingModelLink && <LinkRow icon={<MonitorPlay size={18}/>} label="Live Demo" url={project.workingModelLink} />}
                {project.figmaLink && <LinkRow icon={<Sigma size={18}/>} label="Figma Design" url={project.figmaLink} />}
                {project.presentationLink && <LinkRow icon={<Presentation size={18}/>} label="Presentation / Slides" url={project.presentationLink} />}
              </div>
            </div>
          )}

          {/* Section 4: History */}
          <div>
            <h2 className="section-label">Contribution History</h2>
            {project.contributions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: "0.5rem" }}>No contributions recorded yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {project.contributions.map((c, i) => (
                  <div key={c.id} style={{ padding: "1rem 0", borderBottom: i < project.contributions.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.375rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600, color: "var(--text)" }}>{c.intern.name}</span>
                        <span style={{ fontSize: "0.65rem", padding: "0.125rem 0.375rem", backgroundColor: "var(--bg)", borderRadius: "9999px" }}>{c.intern.department}</span>
                        <span style={{
                          fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem",
                          borderRadius: "0.25rem", backgroundColor: "var(--bg)",
                          border: "1px solid var(--border)", color: "var(--text-muted)",
                        }}>Batch {c.batchNumber}</span>
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.date.toLocaleDateString("en-GB", {day: "numeric", month: "long", year: "numeric"})}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text)" }}>{c.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Project Versions */}
          <ProjectVersionSection
            projectId={project.id}
            initialVersions={(project.versions ?? []).map(v => ({
              id: v.id,
              versionNumber: v.versionNumber,
              uploadedBy: v.uploadedBy,
              createdAt: v.createdAt,
              zipPath: v.zipPath,
              extractedJson: v.extractedJson,
              readmeContent: v.readmeContent,
            }))}
            canUpload={canUpload}
            isAdmin={canWrite}
          />

        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div className="box">
            <h2 className="section-label">Project Info</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>Created by</span><span style={{ fontWeight: 500 }}>{project.createdBy.name}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>Created on</span><span style={{ fontWeight: 500 }}>{project.createdAt.toLocaleDateString()}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>Last updated</span><span style={{ fontWeight: 500 }}>{project.updatedAt.toLocaleDateString()}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>Total contributors</span><span style={{ fontWeight: 500 }}>{project.members.length}</span></div>
            </div>
          </div>

          <div className="box">
            <h2 className="section-label">Team Members</h2>
            {project.members.length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>No team members assigned</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {project.members.map(m => (
                  <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: 0 }}>
                      <Link href={`/dashboard/profile/${m.user.id}`} style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)", textDecoration: "none" }}>
                        {m.user.name}
                      </Link>
                      {(m.user.githubLink || m.user.linkedinLink) ? (
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          {m.user.githubLink && (
                            <SocialLink
                              href={m.user.githubLink}
                              label="GitHub"
                              icon={
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/></svg>
                              }
                              compact
                            />
                          )}
                          {m.user.linkedinLink && (
                            <SocialLink
                              href={m.user.linkedinLink}
                              label="LinkedIn"
                              icon={
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                              }
                              compact
                            />
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontStyle: "italic" }}>Profile incomplete</span>
                      )}
                    </div>
                    <span style={{ fontSize: "0.65rem", backgroundColor: "var(--bg)", border: "1px solid var(--border)", padding: "0.125rem 0.375rem", borderRadius: "9999px", color: "var(--text-muted)", flexShrink: 0 }}>
                      {m.user.role.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {canWrite && (
            <div className="box" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
               <EditProjectModal project={project} department={project.department} interns={interns} />
               <DeleteProjectButton projectId={project.id} />
            </div>
          )}

          {isIntern && project.status === "COMPLETED" && !isMember && (
            <div className="box" style={{ backgroundColor: "rgba(59, 130, 246, 0.05)", borderColor: "rgba(59, 130, 246, 0.2)" }}>
              <h2 className="section-label" style={{ color: "var(--primary)" }}>Continue This Project</h2>
              <p style={{ fontSize: "0.875rem", color: "var(--text)", marginBottom: "1rem", lineHeight: 1.5 }}>
                This project was started in Batch {project.startedInBatch}. You can continue building on it.
              </p>
              <ContinueProjectButton projectId={project.id} />
            </div>
          )}
          
        </div>
      </div>
    </div>
  )
}
