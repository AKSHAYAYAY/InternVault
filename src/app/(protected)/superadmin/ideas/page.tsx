import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { IdeaList } from "@/components/ideas/IdeaList"
import { DeptFilter } from "@/components/ideas/DeptFilter"
import { Department } from "@prisma/client"
import { redirect } from "next/navigation"

export default async function SuperAdminIdeasPage({
  searchParams,
}: {
  searchParams: { dept?: string }
}) {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/login")

  const selectedDept = (searchParams.dept as Department) || "IT"

  const ideas = await prisma.idea.findMany({
    where: { department: selectedDept },
    include: { submittedBy: { select: { name: true } }, batch: { select: { batchNumber: true, name: true } } },
    orderBy: { createdAt: "desc" }
  })

  // We reuse isAdmin=true since SUPER_ADMIN can also approve/reject
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "2rem", color: "var(--text)" }}>Idea Bank (Global)</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            System-wide idea oversight.
          </p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>Department:</label>
          <DeptFilter current={selectedDept} />
        </div>
      </header>

      <IdeaList ideas={ideas} />
    </div>
  )
}