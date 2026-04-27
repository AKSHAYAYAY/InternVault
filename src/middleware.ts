import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const role = req.auth?.user?.role

  const isProtectedRoute = 
    nextUrl.pathname.startsWith('/dashboard') || 
    nextUrl.pathname.startsWith('/admin') || 
    nextUrl.pathname.startsWith('/superadmin')
                           
  if (isProtectedRoute && !isLoggedIn) {
    return Response.redirect(new URL('/login', nextUrl))
  }

  if (isLoggedIn) {
    if (nextUrl.pathname === '/' || nextUrl.pathname === '/login') {
      if (role === 'SUPER_ADMIN') return Response.redirect(new URL('/superadmin', nextUrl))
      if (role === 'ADMIN') return Response.redirect(new URL('/admin', nextUrl))
      return Response.redirect(new URL('/dashboard', nextUrl))
    }

    if (nextUrl.pathname.startsWith('/dashboard') && role !== 'INTERN') {
      // Allow ADMIN and SUPER_ADMIN to access /dashboard/ideas and /dashboard/projects based on prompt requirements
      const isSharedRoute = nextUrl.pathname.startsWith('/dashboard/ideas') || nextUrl.pathname.startsWith('/dashboard/projects')
      if ((role === 'ADMIN' || role === 'SUPER_ADMIN') && isSharedRoute) {
        // Allow through
      } else {
        if (role === 'SUPER_ADMIN') return Response.redirect(new URL('/superadmin', nextUrl))
        if (role === 'ADMIN') return Response.redirect(new URL('/admin', nextUrl))
      }
    }
    
    if (nextUrl.pathname.startsWith('/admin') && nextUrl.pathname !== '/admin' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
       return Response.redirect(new URL('/dashboard', nextUrl))
    }
    if (nextUrl.pathname === '/admin' && role === 'INTERN') {
       return Response.redirect(new URL('/dashboard', nextUrl))
    }
    
    if (nextUrl.pathname.startsWith('/superadmin') && role !== 'SUPER_ADMIN') {
       if (role === 'ADMIN') return Response.redirect(new URL('/admin', nextUrl))
       return Response.redirect(new URL('/dashboard', nextUrl))
    }
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
