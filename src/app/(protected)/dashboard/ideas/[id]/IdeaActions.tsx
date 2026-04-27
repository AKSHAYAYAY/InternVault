"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateIdeaStatus } from "@/app/actions/ideas"
import { toast } from "sonner"
import { IdeaStatus } from "@prisma/client"

export function IdeaActions({ ideaId }: { ideaId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handle(status: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      try {
        await updateIdeaStatus(ideaId, status as IdeaStatus)
        toast.success(`Idea ${status.toLowerCase()}`)
        router.refresh()
      } catch (e: any) {
        toast.error(e.message || "Failed to update status")
      }
    })
  }

  return (
    <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
      <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", margin: 0 }}>
        Review this idea and take action.
      </p>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={() => handle("REJECTED")}
          disabled={isPending}
          style={{ padding: "0.5rem 1.25rem", backgroundColor: "transparent", border: "1px solid var(--danger)", borderRadius: "0.375rem", fontSize: "0.825rem", fontWeight: 600, color: "var(--danger)", cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.6 : 1 }}
        >
          Reject
        </button>
        <button
          onClick={() => handle("APPROVED")}
          disabled={isPending}
          style={{ padding: "0.5rem 1.25rem", backgroundColor: "var(--success)", border: "none", borderRadius: "0.375rem", fontSize: "0.825rem", fontWeight: 600, color: "#fff", cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.6 : 1 }}
        >
          Approve
        </button>
      </div>
    </div>
  )
}
