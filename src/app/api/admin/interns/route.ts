import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const dept = session.user.department as any

    const interns = await prisma.user.findMany({
      where: { department: dept, role: "INTERN" },
      select: {
        id: true, name: true, email: true, department: true,
        projectMemberships: { select: { id: true } },
        submittedIdeas: { select: { id: true } },
        contributions: { select: { id: true } }
      },
      orderBy: { name: "asc" }
    })

    const data = interns.map(i => ({
      id: i.id,
      name: i.name,
      email: i.email,
      department: i.department,
      projectsCount: i.projectMemberships.length,
      ideasCount: i.submittedIdeas.length,
      contributionsCount: i.contributions.length
    }))

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
