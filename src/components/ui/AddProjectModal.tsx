"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Modal } from "@/components/ui/Modal"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MemberChip } from "@/components/ui/MemberChip"

export function AddProjectModal({ department, interns = [] }: { department: string, interns?: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [techStack, setTechStack] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [selectedInterns, setSelectedInterns] = useState<string[]>([])
  
  // Basic comma separation handler
  const handleCommaInput = (e: React.KeyboardEvent<HTMLInputElement>, setter: any, list: string[]) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault()
      const val = e.currentTarget.value.trim().replace(',', '')
      if (val && !list.includes(val)) {
        setter([...list, val])
      }
      e.currentTarget.value = ''
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          backgroundColor: "var(--primary)", color: "white",
          padding: "0.5rem 1rem", borderRadius: "0.375rem",
          fontWeight: 500, border: "none", cursor: "pointer"
        }}
      >
        Add Project
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add New Project">
        <FormContent 
          department={department} 
          techStack={techStack} setTechStack={setTechStack}
          tags={tags} setTags={setTags}
          interns={interns} selectedInterns={selectedInterns} setSelectedInterns={setSelectedInterns}
          onSuccess={() => setIsOpen(false)}
        />
      </Modal>
    </>
  )
}

function FormContent({ department, techStack, setTechStack, tags, setTags, interns, selectedInterns, setSelectedInterns, onSuccess }: any) {
  const router = useRouter()
  const { pending } = useFormStatus()
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formUrl = new FormData(e.currentTarget)
    const data = Object.fromEntries(formUrl.entries())
    
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          problemStatement: data.problemStatement,
          status: data.status,
          batchYear: undefined,
          startedInBatch: data.startedInBatch,
          githubLink: data.githubLink || null,
          prdLink: data.prdLink || null,
          workingModelLink: data.workingModelLink || null,
          figmaLink: data.figmaLink || null,
          presentationLink: data.presentationLink || null,
          techStack,
          tags,
          teamMemberIds: selectedInterns
        })
      })
      
      const json = await res.json()
      if (json.success) {
        toast.success(json.message)
        router.refresh()
        onSuccess()
      } else {
        toast.error(json.message)
      }
    } catch(err: any) {
      toast.error(err.message)
    }
  }

  const inputStyle = { width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* SECTION 1 */}
      <div>
        <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Basic Info</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div><label style={{ fontSize:"0.875rem", fontWeight:500 }}>Project Name *</label><input required name="name" style={inputStyle} /></div>
          <div><label style={{ fontSize:"0.875rem", fontWeight:500 }}>Problem Statement</label><textarea name="problemStatement" rows={2} style={{...inputStyle, resize:"vertical"} as any} /></div>
          <div><label style={{ fontSize:"0.875rem", fontWeight:500 }}>Description *</label><textarea required name="description" rows={3} style={{...inputStyle, resize:"vertical"} as any} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
             <div><label style={{ fontSize:"0.875rem", fontWeight:500 }}>Batch Number *</label><input required name="startedInBatch" type="number" min="1" placeholder="e.g. 3" style={inputStyle} /></div>
             <div>
               <label style={{ fontSize:"0.875rem", fontWeight:500 }}>Status *</label>
               <select required name="status" style={inputStyle} defaultValue="IDEA">
                 <option value="IDEA">Idea</option>
                 <option value="IN_PROGRESS">In Progress</option>
                 <option value="COMPLETED">Completed</option>
               </select>
             </div>
          </div>
          <div><label style={{ fontSize:"0.875rem", fontWeight:500 }}>Department</label><input readOnly value={department} style={{...inputStyle, backgroundColor:"var(--bg)", color:"var(--text-muted)"}} /></div>
        </div>
      </div>

      {/* SECTION 2 */}
      <div>
        <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Tags & Tech</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ fontSize:"0.875rem", fontWeight:500 }}>Tags</label>
            <input placeholder="Type and press comma..." onKeyDown={(e) => {
              if (e.key === ',' || e.key === 'Enter') { e.preventDefault(); const v=e.currentTarget.value.trim(); if(v && !tags.includes(v)) setTags([...tags, v]); e.currentTarget.value = ''; }
            }} style={inputStyle} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
              {tags.map((t: string) => <MemberChip key={t} name={t} onRemove={() => setTags(tags.filter((x: string) => x !== t))} />)}
            </div>
          </div>
          <div>
            <label style={{ fontSize:"0.875rem", fontWeight:500 }}>Tech Stack</label>
            <input placeholder="e.g. Next.js, comma to add" onKeyDown={(e) => {
              if (e.key === ',' || e.key === 'Enter') { e.preventDefault(); const v=e.currentTarget.value.trim(); if(v && !techStack.includes(v)) setTechStack([...techStack, v]); e.currentTarget.value = ''; }
            }} style={inputStyle} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
              {techStack.map((t: string) => <MemberChip key={t} name={t} onRemove={() => setTechStack(techStack.filter((x: string) => x !== t))} />)}
            </div>
          </div>
          <div>
            <label style={{ fontSize:"0.875rem", fontWeight:500 }}>Assign Team Members</label>
            <select 
              style={{...inputStyle, cursor:"pointer"} as any}
              onChange={(e) => {
                const val = e.target.value;
                if (val && !selectedInterns.includes(val)) setSelectedInterns([...selectedInterns, val]);
                e.target.value = ''; // reset after selection
              }}
            >
              <option value="">-- Select Intern --</option>
              {interns.filter((i: any) => !selectedInterns.includes(i.id)).map((i: any) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
              {selectedInterns.map((id: string) => {
                const intern = interns.find((i: any) => i.id === id);
                return intern ? <MemberChip key={id} name={intern.name} onRemove={() => setSelectedInterns(selectedInterns.filter((x: string) => x !== id))} /> : null;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3 */}
      <div>
        <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Project Links</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ fontSize:"0.875rem", fontWeight:500 }}>GitHub Repository</label>
            <input
              type="url"
              name="githubLink"
              placeholder="https://github.com/username/repository"
              style={inputStyle}
              onChange={e => {
                const v = e.target.value
                const valid = !v || /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+/.test(v)
                e.target.setCustomValidity(valid ? "" : "Please enter a valid GitHub repository URL")
              }}
            />
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Link a public GitHub repository to display the project file structure here.
            </p>
          </div>
          <div><label style={{ fontSize:"0.875rem", fontWeight:500 }}>PRD / Document</label><input type="url" name="prdLink" style={inputStyle} /></div>
          <div><label style={{ fontSize:"0.875rem", fontWeight:500 }}>Live Demo / Model</label><input type="url" name="workingModelLink" style={inputStyle} /></div>
          <div><label style={{ fontSize:"0.875rem", fontWeight:500 }}>Figma / Design Link</label><input type="url" name="figmaLink" style={inputStyle} /></div>
          <div><label style={{ fontSize:"0.875rem", fontWeight:500 }}>Slides / Presentation</label><input type="url" name="presentationLink" style={inputStyle} /></div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
        <button type="button" onClick={onSuccess} style={{ background:"transparent", border:"1px solid var(--border)", padding:"0.5rem 1rem", borderRadius:"0.375rem", cursor:"pointer", color:"var(--text)", fontWeight:500 }}>
          Cancel
        </button>
        <button type="submit" disabled={pending} style={{ backgroundColor:"var(--primary)", color:"white", padding:"0.5rem 1rem", borderRadius:"0.375rem", fontWeight:500, border:"none", cursor:"pointer" }}>
          {pending ? "Saving..." : "Submit"}
        </button>
      </div>
    </form>
  )
}
