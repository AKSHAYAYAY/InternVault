import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isCoordinator, getActiveBatch } from "@/lib/batchHelpers"
import { Department } from "@prisma/client"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

async function guardCoordinator(userId: string, department: Department) {
  const ok = await isCoordinator(userId, department)
  if (!ok) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })
  return null
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const department = session.user.department as Department
    const guard = await guardCoordinator(session.user.id!, department)
    if (guard) return guard

    const activeBatch = await getActiveBatch(department)
    if (!activeBatch) {
      return NextResponse.json({ success: false, message: "No active batch found" }, { status: 400 })
    }

    const { name, email, password } = await req.json()
    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: "name, email, and password are required" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ success: false, message: "Email already in use" }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)

    const [user, batchMember] = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, email, password: hashed, role: "INTERN", department },
        select: { id: true, name: true, email: true, department: true, role: true },
      })
      const member = await tx.batchMember.create({
        data: { batchId: activeBatch.id, userId: newUser.id, batchRole: "INTERN" },
      })
      return [newUser, member]
    })

    return NextResponse.json({
      success: true,
      data: { user, batchMember },
      message: "Intern account created and added to batch",
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const department = session.user.department as Department
    const guard = await guardCoordinator(session.user.id!, department)
    if (guard) return guard

    const activeBatch = await getActiveBatch(department)
    if (!activeBatch) {
      return NextResponse.json({ success: false, message: "No active batch found" }, { status: 400 })
    }

    const members = await prisma.batchMember.findMany({
      where: { batchId: activeBatch.id },
      include: { user: { select: { id: true, name: true, email: true, role: true, department: true } } },
    })

    const coordinators = members.filter(m => m.batchRole === "COORDINATOR").map(m => m.user)
    const interns = members.filter(m => m.batchRole === "INTERN").map(m => m.user)

    return NextResponse.json({
      success: true,
      data: { coordinators, interns, totalCount: members.length },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
