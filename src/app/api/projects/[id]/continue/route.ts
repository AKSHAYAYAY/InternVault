import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Department } from "@prisma/client"
import { apiSuccess, unauthorized, forbidden, notFound, badRequest, serverError } from "@/lib/apiResponse"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()
    if (session.user.role !== "INTERN") return forbidden()

    const userId = session.user.id!
    const dept = session.user.department as Department | null

    if (!dept) return badRequest("No department assigned to your account")

    // 1. Fetch the project
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { id: true, department: true, status: true },
    })

    if (!project) return notFound("Project")

    // 2. Department check
    if (project.department !== dept) {
      return forbidden()
    }

    // 3. Only completed projects can be continued
    if (project.status !== "COMPLETED") {
      return badRequest("Only completed projects can be continued")
    }

    // 4. Fetch active batch for user's department
    const activeBatch = await prisma.batch.findFirst({
      where: { department: dept, isActive: true },
      select: { id: true, batchNumber: true },
    })

    if (!activeBatch) {
      return NextResponse.json(
        { success: false, error: "No active batch found for your department", code: "NO_ACTIVE_BATCH" },
        { status: 400 }
      )
    }

    // 5. Prevent duplicate contribution in same batch
    const existingContribution = await prisma.contribution.findFirst({
      where: { projectId: params.id, internId: userId, batchNumber: activeBatch.batchNumber },
    })

    if (existingContribution) {
      return badRequest("You have already continued this project in the current batch")
    }

    // 6. Run upsert member + create contribution in a transaction
    await prisma.$transaction([
      prisma.projectMember.upsert({
        where: { projectId_userId: { projectId: params.id, userId } },
        update: {},
        create: { projectId: params.id, userId },
      }),
      prisma.contribution.create({
        data: {
          projectId: params.id,
          internId: userId,
          description: "Continuing project from previous batch",
          batchNumber: activeBatch.batchNumber,
          date: new Date(),
        },
      }),
    ])

    return apiSuccess(null, "You are now continuing this project")
  } catch (err) {
    return serverError(err)
  }
}
