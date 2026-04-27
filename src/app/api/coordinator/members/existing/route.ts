import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isCoordinator, getActiveBatch } from "@/lib/batchHelpers"
import { Department } from "@prisma/client"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const department = session.user.department as Department
    const ok = await isCoordinator(session.user.id!, department)
    if (!ok) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })

    const activeBatch = await getActiveBatch(department)
    if (!activeBatch) {
      return NextResponse.json({ success: false, message: "No active batch found" }, { status: 400 })
    }

    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ success: false, message: "userId is required" }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })

    if (user.department !== department) {
      return NextResponse.json({ success: false, message: "User is not in the same department" }, { status: 400 })
    }

    const alreadyMember = await prisma.batchMember.findUnique({
      where: { batchId_userId: { batchId: activeBatch.id, userId } },
    })
    if (alreadyMember) {
      return NextResponse.json({ success: false, message: "User is already in this batch" }, { status: 409 })
    }

    const batchMember = await prisma.batchMember.create({
      data: { batchId: activeBatch.id, userId, batchRole: "INTERN" },
    })

    return NextResponse.json({ success: true, data: { user, batchMember } })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
