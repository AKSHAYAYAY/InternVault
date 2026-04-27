import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { apiSuccess, unauthorized, forbidden, notFound, badRequest, serverError } from "@/lib/apiResponse"

export const revalidate = 600 // cache entire route for 10 minutes

function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url)
    if (u.hostname !== "github.com") return null
    const parts = u.pathname.replace(/^\//, "").replace(/\.git$/, "").split("/").filter(Boolean)
    if (parts.length < 2) return null
    return { owner: parts[0], repo: parts[1] }
  } catch {
    return null
  }
}

interface TreeNode {
  name: string
  type: "file" | "folder"
  path: string
  size?: number
  githubUrl?: string
  children?: TreeNode[]
}

function buildTree(
  items: { path: string; type: string; size?: number }[],
  owner: string,
  repo: string,
  branch: string
): TreeNode[] {
  const root: TreeNode[] = []
  const map = new Map<string, TreeNode>()

  // Process in original path order — GitHub returns items breadth-first,
  // so parents always appear before their children. Do NOT re-sort before building.
  for (const item of items) {
    if (!item.path) continue
    const parts = item.path.split("/")
    const name = parts[parts.length - 1]
    const isFolder = item.type === "tree"

    const node: TreeNode = {
      name,
      type: isFolder ? "folder" : "file",
      path: item.path,
      ...(isFolder
        ? { children: [] }
        : {
            size: item.size,
            githubUrl: `https://github.com/${owner}/${repo}/blob/${branch}/${item.path}`,
          }),
    }

    map.set(item.path, node)

    if (parts.length === 1) {
      root.push(node)
    } else {
      const parentPath = parts.slice(0, -1).join("/")
      const parent = map.get(parentPath)
      if (parent?.children) {
        parent.children.push(node)
      }
      // If parent not found (truncated tree), attach to root
      else if (!parentPath.includes("/")) {
        root.push(node)
      }
    }
  }

  // Sort each level: folders first, then files, alphabetically
  function sortLevel(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    nodes.forEach(n => { if (n.children) sortLevel(n.children) })
  }
  sortLevel(root)

  return root
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { githubLink: true, department: true },
    })
    if (!project) return notFound("Project")

    if (session.user.role !== "SUPER_ADMIN" && project.department !== session.user.department) {
      return forbidden()
    }

    if (!project.githubLink?.trim()) {
      return NextResponse.json(
        { success: false, error: "No GitHub repository linked to this project", code: "NO_GITHUB_LINK" },
        { status: 400 }
      )
    }

    const parsed = parseGithubUrl(project.githubLink)
    if (!parsed) {
      return badRequest("Invalid GitHub URL format")
    }

    const { owner, repo } = parsed

    // Fetch default branch first
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
      next: { revalidate: 600 },
    })

    if (repoRes.status === 404) {
      return NextResponse.json(
        { success: false, error: "Repository not found or is private", code: "REPO_NOT_FOUND" },
        { status: 404 }
      )
    }
    if (repoRes.status === 403) {
      return NextResponse.json(
        { success: false, error: "GitHub API rate limit reached. Try again in an hour.", code: "RATE_LIMITED" },
        { status: 429 }
      )
    }
    if (!repoRes.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch repository info", code: "GITHUB_ERROR" },
        { status: repoRes.status }
      )
    }

    const repoData = await repoRes.json()
    const defaultBranch: string = repoData.default_branch ?? "main"

    // Fetch full recursive tree
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      {
        headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
        next: { revalidate: 600 },
      }
    )

    if (treeRes.status === 403) {
      return NextResponse.json(
        { success: false, error: "GitHub API rate limit reached. Try again in an hour.", code: "RATE_LIMITED" },
        { status: 429 }
      )
    }
    if (!treeRes.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch repository tree", code: "GITHUB_ERROR" },
        { status: treeRes.status }
      )
    }

    const treeData = await treeRes.json()
    const items: { path: string; type: string; size?: number }[] = treeData.tree ?? []

    const tree = buildTree(items, owner, repo, defaultBranch)
    const totalFiles = items.filter(i => i.type === "blob").length
    const totalFolders = items.filter(i => i.type === "tree").length

    return apiSuccess({
      repoName: `${owner}/${repo}`,
      defaultBranch,
      tree,
      totalFiles,
      totalFolders,
      repoUrl: `https://github.com/${owner}/${repo}`,
    })
  } catch (err) {
    return serverError(err)
  }
}
