import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "COORDINATOR") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const dept = session.user.department as any

    const ideas = await prisma.idea.findMany({
      where: { department: dept, status: "PENDING" },
      include: { submittedBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ success: true, data: ideas })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
