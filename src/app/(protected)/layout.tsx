import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Department } from "@prisma/client"
import { DashboardShell } from "@/components/ui/DashboardShell"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // Build batch subtitle for sidebar
  let batchSubtitle = ""
  if (session?.user?.department && session.user.role !== "SUPER_ADMIN") {
    const activeBatch = await prisma.batch.findFirst({
      where: { department: session.user.department as Department, isActive: true },
      select: { name: true, batchNumber: true },
    })
    if (activeBatch) {
      batchSubtitle = `${session.user.department} · Batch ${activeBatch.batchNumber}`
    } else {
      batchSubtitle = session.user.department
    }
  }

  const signOutAction = async () => {
    "use server"
    await signOut({ redirectTo: "/login" })
  }

  return (
    <DashboardShell
      user={{
        id: session?.user?.id ?? "",
        name: session?.user?.name ?? "User",
        email: session?.user?.email ?? "",
        role: session?.user?.role ?? "INTERN",
        department: session?.user?.department ?? null,
      }}
      batchSubtitle={batchSubtitle}
      signOutAction={signOutAction}
    >
      {children}
    </DashboardShell>
  )
}
