export const dynamic = 'force-dynamic';
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Department } from "@prisma/client"

export async function GET() {
  const session = await auth()
  
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Department Isolation Rule
  // We enforce that the query strictly filters by the user's department from the JWT token
  const department = session.user.department

  if (!department) {
    return Response.json({ error: "User has no assigned department" }, { status: 403 })
  }

  try {
    // Example: Fetch interns strictly in the user's department
    const departmentUsers = await prisma.user.findMany({
      where: { 
        department: department as Department,
        role: "INTERN"
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
      }
    })

    return Response.json({
      departmentAccess: department,
      users: departmentUsers
    })
  } catch (_error: unknown) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
