"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { Department, IdeaStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export async function submitIdea(formData: FormData) {
  const session = await auth()
  if (!session?.user || !["INTERN", "COORDINATOR"].includes(session.user.role)) {
    throw new Error("Unauthorized to submit ideas")
  }

  const title = (formData.get("title") as string)?.trim()
  const shortDescription = (formData.get("shortDescription") as string)?.trim()
  const problemStatement = (formData.get("problemStatement") as string)?.trim()
  const proposedSolution = (formData.get("proposedSolution") as string)?.trim()
  const techStackStr = (formData.get("techStack") as string) ?? ""
  const tagsStr = (formData.get("tags") as string) ?? ""

  if (!title) throw new Error("Title is required")
  if (!shortDescription) throw new Error("Short description is required")
  if (!problemStatement) throw new Error("Problem statement is required")
  if (!proposedSolution) throw new Error("Proposed solution is required")

  const wordCount = countWords(proposedSolution)
  if (wordCount < 200) {
    throw new Error(`Proposed solution must be at least 200 words (currently ${wordCount})`)
  }

  const techStack = techStackStr ? techStackStr.split(",").map(t => t.trim()).filter(Boolean) : []
  const tags = tagsStr ? tagsStr.split(",").map(t => t.trim()).filter(Boolean) : []

  // Attach to active batch if exists
  const activeBatch = await prisma.batch.findFirst({
    where: { department: session.user.department as Department, isActive: true },
    select: { id: true },
  })

  await prisma.idea.create({
    data: {
      title,
      shortDescription,
      description: problemStatement, // keep description in sync for backward compat
      problemStatement,
      proposedSolution,
      techStack,
      tags,
      department: session.user.department as Department,
      submittedById: session.user.id!,
      status: IdeaStatus.PENDING,
      batchId: activeBatch?.id ?? null,
    },
  })

  revalidatePath("/dashboard/ideas")
  return { success: true }
}

export async function updateIdeaStatus(id: string, status: IdeaStatus) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "COORDINATOR" && session.user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized to update idea status")
  }

  if (session.user.role === "COORDINATOR") {
    const idea = await prisma.idea.findUnique({ where: { id } })
    if (idea?.department !== session.user.department) {
      throw new Error("Unauthorized: Idea outside of your department")
    }
  }

  await prisma.idea.update({ where: { id }, data: { status } })

  revalidatePath("/dashboard/ideas")
  revalidatePath("/dashboard/ideas/" + id)
  revalidatePath("/superadmin/ideas")
  return { success: true }
}
