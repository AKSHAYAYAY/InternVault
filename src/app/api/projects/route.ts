import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Department, ProjectStatus } from "@prisma/client"

const WRITE_ROLES = ["COORDINATOR", "SUPER_ADMIN"]

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const tags = searchParams.get("tags")
    const batchNumber = searchParams.get("batchNumber")

    const where: any = {}

    if (session.user.role !== "SUPER_ADMIN") {
      where.department = session.user.department
    }
    if (status && status !== "All") where.status = status as ProjectStatus
    if (batchNumber) where.startedInBatch = parseInt(batchNumber)
    if (tags) where.tags = { has: tags }

    const projects = await prisma.project.findMany({
      where,
      include: {
        members: { include: { user: { select: { name: true } } } },
        _count: { select: { contributions: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const transformed = projects.map(p => ({
      ...p,
      memberNames: p.members.map((m: any) => m.user.name),
      contributorCount: p.members.length,
      contributionCount: p._count.contributions,
    }))

    return NextResponse.json({ success: true, data: transformed })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !WRITE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      name, description, status, startedInBatch,
      githubLink, prdLink, workingModelLink, figmaLink, presentationLink,
      techStack, problemStatement, outcomes, tags, teamMemberIds,
    } = body

    if (!name || !description || !status || !startedInBatch) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: status as ProjectStatus,
        startedInBatch: parseInt(startedInBatch),
        githubLink: githubLink || null,
        prdLink: prdLink || null,
        workingModelLink: workingModelLink || null,
        figmaLink: figmaLink || null,
        presentationLink: presentationLink || null,
        techStack: techStack || [],
        problemStatement: problemStatement || null,
        outcomes: outcomes || null,
        tags: tags || [],
        department: session.user.department as Department,
        createdById: session.user.id!,
        members: {
          create: (teamMemberIds || []).map((id: string) => ({ userId: id })),
        },
      },
    })

    return NextResponse.json({ success: true, data: project, message: "Project created" })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
