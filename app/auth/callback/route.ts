import { createServerClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = '/user/auth'

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Detect if user signed in via OAuth (Google, GitHub, etc.)
        const isOAuthUser =
          user.identities &&
          user.identities.some(
            (identity) =>
              identity.provider !== 'email' && identity.provider !== 'phone',
          )

        console.log(
          `[Callback] User login detected - Email: ${user.email}, OAuth: ${isOAuthUser}, Provider(s): ${user.identities?.map((i) => i.provider).join(', ')}`,
        )

        // Only check email confirmation for email/password signup users
        // OAuth users (Google, GitHub, etc.) are already verified by their providers
        if (!isOAuthUser && !user.email_confirmed_at) {
          console.log(
            '[Callback] Email/password user email not confirmed:',
            user.email,
          )
          // Sign out the user and redirect to auth page with message
          await supabase.auth.signOut()
          return NextResponse.redirect(
            `${origin}/user/auth?error=Email not confirmed. Please check your inbox and click the confirmation link.`,
          )
        }

        // Create profile for all authenticated users (OAuth or email confirmed)
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!existingProfile) {
          console.log(
            `[Callback] Creating profile for ${isOAuthUser ? 'OAuth' : 'email confirmed'} user:`,
            user.email,
          )

          // Generate unique username with fallback for collisions
          const baseUsername =
            user.email
              ?.split('@')[0]
              ?.toLowerCase()
              .replace(/[^a-z0-9]/g, '') || `user${user.id.slice(0, 8)}`

          let username = baseUsername
          let attempts = 0
          const maxAttempts = 5

          // Check for username collisions and generate unique one
          while (attempts < maxAttempts) {
            const { data: existingUser } = await supabase
              .from('users')
              .select('username')
              .eq('username', username)
              .single()

            if (!existingUser) {
              break // Username is available
            }

            attempts++
            username = `${baseUsername}${attempts}`
          }

          // Final fallback if all attempts fail
          if (attempts >= maxAttempts) {
            username = `${baseUsername}${Math.floor(Math.random() * 1000)}`
          }

          const profileData = {
            id: user.id,
            username: username,
            display_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0] ||
              'User',
            avatar_url:
              user.user_metadata?.avatar_url ||
              user.user_metadata?.picture ||
              '/vibedev-guest-avatar.png',
            bio: null,
            location: null,
            website: null,
            github_url: null,
            twitter_url: null,
          }

          console.log(`[Callback] Attempting to create profile with data:`, {
            id: profileData.id,
            username: profileData.username,
            display_name: profileData.display_name,
            email: user.email,
          })

          const { error: insertError } = await supabase
            .from('users')
            .insert(profileData)

          if (insertError) {
            console.error('[Callback] Profile creation error:', insertError)
            console.error('[Callback] Failed profile data:', profileData)
            return NextResponse.redirect(
              `${origin}/user/auth?error=Failed to create user profile: ${insertError.message}`,
            )
          }

          console.log(
            `[Callback] Profile created successfully for user: ${user.email} with username: ${username}`,
          )
        }

        console.log('[Callback] User authenticated successfully:', user.email)

        // Handle different flows based on auth method
        if (isOAuthUser) {
          // OAuth users: Keep them signed in and redirect to home
          console.log(
            '[Callback] OAuth user login successful, redirecting to home',
          )
          const forwardedHost = request.headers.get('x-forwarded-host')
          const isLocalEnv = process.env.NODE_ENV === 'development'

          if (isLocalEnv) {
            return NextResponse.redirect(`${origin}/`)
          } else if (forwardedHost) {
            return NextResponse.redirect(`https://${forwardedHost}/`)
          } else {
            return NextResponse.redirect(`${origin}/`)
          }
        } else {
          // Email/password users: Sign out after email confirmation to force proper login
          console.log(
            '[Callback] Email confirmed user, signing out for security',
          )
          await supabase.auth.signOut()

          // Redirect email/password users to auth page with success message
          const forwardedHost = request.headers.get('x-forwarded-host')
          const isLocalEnv = process.env.NODE_ENV === 'development'

          if (isLocalEnv) {
            return NextResponse.redirect(
              `${origin}${next}?success=Email confirmed successfully! You can now sign in.`,
            )
          } else if (forwardedHost) {
            return NextResponse.redirect(
              `https://${forwardedHost}${next}?success=Email confirmed successfully! You can now sign in.`,
            )
          } else {
            return NextResponse.redirect(
              `${origin}${next}?success=Email confirmed successfully! You can now sign in.`,
            )
          }
        }
      }
    } else {
      console.error('[Callback] Exchange code error:', error)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(
    `${origin}/user/auth?error=Could not authenticate user`,
  )
}
