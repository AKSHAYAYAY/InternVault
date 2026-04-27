import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { SuperAdminBatchDetail } from "@/components/ui/SuperAdminBatchDetail"

export default async function SuperAdminBatchPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login")

  const batch = await prisma.batch.findUnique({
    where: { id: params.id },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true, department: true } },
        },
      },
      projects: {
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true, status: true, techStack: true, updatedAt: true },
      },
    },
  })

  if (!batch) notFound()

  const coordinators = batch.members.filter(m => m.batchRole === "COORDINATOR").map(m => m.user)
  const interns = batch.members.filter(m => m.batchRole === "INTERN").map(m => m.user)

  return (
    <SuperAdminBatchDetail
      batch={{
        id: batch.id,
        name: batch.name,
        department: batch.department,
        batchNumber: batch.batchNumber,
        isActive: batch.isActive,
        startDate: batch.startDate,
        endDate: batch.endDate ?? null,
      }}
      coordinators={coordinators}
      interns={interns}
      projects={batch.projects}
    />
  )
}
