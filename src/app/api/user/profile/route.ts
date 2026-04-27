import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { apiSuccess, unauthorized, badRequest, notFound, serverError } from "@/lib/apiResponse"

// PATCH — update name, githubLink, linkedinLink
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { name, githubLink, linkedinLink } = await req.json()

    if (name !== undefined && !name.trim()) return badRequest("Name cannot be empty")

    const data: Record<string, string | null> = {}
    if (name !== undefined) data.name = name.trim()
    if (githubLink !== undefined) data.githubLink = githubLink?.trim() || null
    if (linkedinLink !== undefined) data.linkedinLink = linkedinLink?.trim() || null

    const user = await prisma.user.update({
      where: { id: session.user.id! },
      data,
      select: { id: true, name: true, githubLink: true, linkedinLink: true },
    })

    return apiSuccess({ user }, "Profile updated")
  } catch (err) {
    return serverError(err)
  }
}

// POST — change password
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { currentPassword, newPassword, confirmPassword } = await req.json()

    if (!currentPassword || !newPassword || !confirmPassword) return badRequest("All password fields are required")
    if (newPassword.length < 8) return badRequest("New password must be at least 8 characters")
    if (newPassword !== confirmPassword) return badRequest("New passwords do not match")

    const user = await prisma.user.findUnique({ where: { id: session.user.id! } })
    if (!user) return notFound("User")

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return badRequest("Current password is incorrect")

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })

    return apiSuccess(null, "Password updated successfully")
  } catch (err) {
    return serverError(err)
  }
}
