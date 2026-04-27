import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { IdeaList } from "@/components/ideas/IdeaList"
import { SubmitIdeaModal } from "@/components/ideas/SubmitIdeaModal"
import { redirect } from "next/navigation"

export default async function IdeasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!session.user.department) return <div style={{ padding: "2rem", color: "var(--text-muted)" }}>No department assigned.</div>

  const canSubmit = ["INTERN", "COORDINATOR"].includes(session.user.role)
  const canApprove = ["COORDINATOR", "SUPER_ADMIN"].includes(session.user.role)

  const ideas = await prisma.idea.findMany({
    where: { department: session.user.department as any },
    include: {
      submittedBy: { select: { name: true } },
      batch: { select: { batchNumber: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border)", paddingBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "2rem", color: "var(--text)", margin: "0 0 0.25rem" }}>Idea Bank</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
            {canApprove ? "Review and approve department submissions." : "Submit and explore ideas from your batch."}
          </p>
        </div>
        {canSubmit && <SubmitIdeaModal />}
      </header>

      <IdeaList ideas={ideas} />
    </div>
  )
}
