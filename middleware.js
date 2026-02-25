import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )

          supabaseResponse = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // check the user from the request cookies and control the access to routes based on auth status
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const currentPath = request.nextUrl.pathname

// 1 if  root(/) do hit, if user not logged in -> go to /login, if logged in -> go to /dashboard
  // User not logged in -> /login
  // User logged in -> /dashboard 
  
  if (currentPath === '/') {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
// 2 if user tries to access protected routes without login, redirect to /login


  const protectedRoutes = [
    '/dashboard',
    '/upload',
    '/results',
    '/settings',
    '/export'
  ]

  const isProtected = protectedRoutes.some((route) =>
    currentPath.startsWith(route)
  )

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
// 3 if user tries to access /login or /signup while logged in, redirect to /dashboard

  if (
    (currentPath === '/login' || currentPath === '/signup') &&
    user
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

// This matcher defines which routes the middleware should run on. We want it to run on all routes that are relevant for authentication checks, including the root, login, signup, and all protected routes.

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/dashboard/:path*',
    '/upload/:path*',
    '/results/:path*',
    '/export/:path*',
    '/settings/:path*'
  ],
}