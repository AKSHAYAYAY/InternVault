"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function ContinueProjectButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleContinue() {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/continue`, { method: "POST", credentials: "include" })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || "You have been added as a contributor")
        router.refresh()
      } else {
        toast.error(data.message)
      }
    } catch(err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleContinue}
      disabled={loading}
      style={{
        width: "100%", padding: "0.75rem", 
        backgroundColor: "var(--primary)", color: "white", 
        border: "none", borderRadius: "0.375rem", 
        fontWeight: 500, cursor: "pointer",
        opacity: loading ? 0.7 : 1
      }}
    >
      {loading ? "Joining..." : "Continue This Project"}
    </button>
  )
}
