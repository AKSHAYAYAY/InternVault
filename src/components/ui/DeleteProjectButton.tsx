"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function DeleteProjectButton({ projectId, variant = "default" }: { projectId: string, variant?: "default" | "table" }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;

    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE", credentials: "include" })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || "Project deleted")
        router.push("/dashboard/projects")
      } else {
        toast.error(data.message)
        setLoading(false)
      }
    } catch(err: any) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={loading}
      style={variant === "table" ? {
        fontSize: "0.7rem", padding: "0.2rem 0.6rem", border: "1px solid var(--danger)", 
        borderRadius: "0.25rem", color: "var(--danger)", cursor: "pointer", backgroundColor: "transparent",
        opacity: loading ? 0.7 : 1
      } : { 
        width: "100%", padding: "0.75rem", backgroundColor: "transparent", 
        color: "var(--danger)", border: "1px solid var(--danger)", 
        borderRadius: "0.375rem", fontWeight: 500, cursor: "pointer",
        opacity: loading ? 0.7 : 1
      }}
    >
      {loading ? "Deleting..." : (variant === "table" ? "Delete" : "Delete Project")}
    </button>
  )
}
