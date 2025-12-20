import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const { searchParams } = new URL(request.url)
  const redirectTo = searchParams.get('redirectTo') || '/blog/editor'

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // User not authenticated, redirect to login
    return NextResponse.redirect(new URL(`/user/auth?redirectTo=${encodeURIComponent(redirectTo)}`, request.url))
  }

  // User is authenticated, redirect to the requested page
  return NextResponse.redirect(new URL(redirectTo, request.url))
}
