import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ProfileEditClient } from "./ProfileEditClient"

export default async function ProfileEditPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id! },
    select: { id: true, name: true, githubLink: true, linkedinLink: true },
  })

  if (!user) redirect("/login")

  return <ProfileEditClient user={user} />
}
