import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  providers: [], // Added in auth.ts because of Edge runtime limitations
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.department = user.department
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.department = token.department as string | null
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  }
} satisfies NextAuthConfig
