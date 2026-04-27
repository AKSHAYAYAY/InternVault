import { prisma } from "./prisma"
import { Department, BatchMemberRole } from "@prisma/client"
import { NextResponse } from "next/server"

/**
 * Returns the active Batch for a department, or null if none.
 */
export async function getActiveBatch(department: Department) {
  return prisma.batch.findFirst({
    where: { department, isActive: true },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  })
}

/**
 * Returns the BatchMemberRole of a user in the active batch for a department,
 * or null if they are not in the active batch.
 */
export async function getCurrentBatchRole(
  userId: string,
  department: Department
): Promise<BatchMemberRole | null> {
  const activeBatch = await prisma.batch.findFirst({
    where: { department, isActive: true },
  })
  if (!activeBatch) return null

  const membership = await prisma.batchMember.findUnique({
    where: { batchId_userId: { batchId: activeBatch.id, userId } },
  })
  return membership?.batchRole ?? null
}

/**
 * Returns true if the user has write access for the department.
 * Super Admin always has write access.
 * Coordinators and Interns in the active batch have write access.
 * Past-batch members get read-only (returns 403 NextResponse).
 */
export async function canWrite(
  userId: string,
  role: string,
  department: Department
): Promise<true | NextResponse> {
  if (role === "SUPER_ADMIN") return true

  const activeBatch = await prisma.batch.findFirst({
    where: { department, isActive: true },
  })

  if (!activeBatch) {
    return NextResponse.json(
      { success: false, message: `No active batch found for ${department}` },
      { status: 403 }
    )
  }

  const membership = await prisma.batchMember.findUnique({
    where: { batchId_userId: { batchId: activeBatch.id, userId } },
  })

  if (!membership) {
    // Check if they were in a past batch — read-only
    const pastMembership = await prisma.batchMember.findFirst({
      where: { userId, batch: { department } },
      include: { batch: true },
    })

    if (pastMembership) {
      return NextResponse.json(
        {
          success: false,
          message: `${department} Batch ${pastMembership.batch.batchNumber} has ended. You have read-only access.`,
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { success: false, message: "You are not a member of any batch in this department." },
      { status: 403 }
    )
  }

  return true
}

/**
 * Returns true if the user is a COORDINATOR in the active batch for their department.
 */
export async function isCoordinator(userId: string, department: Department): Promise<boolean> {
  const activeBatch = await prisma.batch.findFirst({
    where: { department, isActive: true },
  })
  if (!activeBatch) return false

  const membership = await prisma.batchMember.findUnique({
    where: { batchId_userId: { batchId: activeBatch.id, userId } },
  })

  return membership?.batchRole === BatchMemberRole.COORDINATOR
}

/**
 * Returns a user's batch context for a department:
 * - activeBatch: the active batch they belong to (or null)
 * - pastBatch: the most recent past batch they were in (or null)
 * - batchRole: their role in whichever batch was found
 */
export async function getUserBatchContext(userId: string, department: Department) {
  const activeBatch = await prisma.batch.findFirst({
    where: { department, isActive: true },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  })

  if (activeBatch) {
    const membership = activeBatch.members.find(m => m.user.id === userId)
    if (membership) {
      return { activeBatch, pastBatch: null, batchRole: membership.batchRole, isReadOnly: false }
    }
  }

  // Not in active batch — check past batches
  const pastMembership = await prisma.batchMember.findFirst({
    where: { userId, batch: { department, isActive: false } },
    include: { batch: true },
    orderBy: { batch: { batchNumber: "desc" } },
  })

  if (pastMembership) {
    return { activeBatch: null, pastBatch: pastMembership.batch, batchRole: pastMembership.batchRole, isReadOnly: true }
  }

  return { activeBatch: null, pastBatch: null, batchRole: null, isReadOnly: false }
}

/**
 * Returns the active batch + coordinator details for a department.
 */
export async function getActiveBatchWithCoordinator(department: Department) {
  return prisma.batch.findFirst({
    where: { department, isActive: true },
    include: {
      members: {
        where: { batchRole: BatchMemberRole.COORDINATOR },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  })
}
