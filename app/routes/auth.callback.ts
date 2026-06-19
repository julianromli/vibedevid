import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@/lib/supabase/server'

export const Route = createFileRoute('/auth/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { searchParams, origin } = new URL(request.url)
        const code = searchParams.get('code')
        const next = '/user/auth'

        if (code) {
          const supabase = await createClient()
          const { error } = await supabase.auth.exchangeCodeForSession(code)

          if (!error) {
            const {
              data: { user },
            } = await supabase.auth.getUser()

            if (user) {
              const isOAuthUser =
                user.identities &&
                user.identities.some((identity) => identity.provider !== 'email' && identity.provider !== 'phone')

              console.log(
                `[Callback] User login detected - Email: ${user.email}, OAuth: ${isOAuthUser}, Provider(s): ${user.identities?.map((i) => i.provider).join(', ')}`,
              )

              if (!isOAuthUser && !user.email_confirmed_at) {
                console.log('[Callback] Email/password user email not confirmed:', user.email)
                await supabase.auth.signOut()
                return Response.redirect(
                  `${origin}/user/auth?error=Email not confirmed. Please check your inbox and click the confirmation link.`,
                  302,
                )
              }

              const { data: existingProfile } = await supabase.from('users').select('id').eq('id', user.id).single()

              if (!existingProfile) {
                console.log(
                  `[Callback] Creating profile for ${isOAuthUser ? 'OAuth' : 'email confirmed'} user:`,
                  user.email,
                )

                const baseUsername =
                  user.email
                    ?.split('@')[0]
                    ?.toLowerCase()
                    .replace(/[^a-z0-9]/g, '') || `user${user.id.slice(0, 8)}`

                let username = baseUsername
                let attempts = 0
                const maxAttempts = 5

                while (attempts < maxAttempts) {
                  const { data: existingUser } = await supabase
                    .from('users')
                    .select('username')
                    .eq('username', username)
                    .single()

                  if (!existingUser) {
                    break
                  }

                  attempts++
                  username = `${baseUsername}${attempts}`
                }

                if (attempts >= maxAttempts) {
                  username = `${baseUsername}${Math.floor(Math.random() * 1000)}`
                }

                const profileData = {
                  id: user.id,
                  username,
                  display_name:
                    user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                  avatar_url:
                    user.user_metadata?.avatar_url || user.user_metadata?.picture || '/vibedev-guest-avatar.png',
                  bio: null,
                  location: null,
                  website: null,
                  github_url: null,
                  twitter_url: null,
                }

                console.log('[Callback] Attempting to create profile with data:', {
                  id: profileData.id,
                  username: profileData.username,
                  display_name: profileData.display_name,
                  email: user.email,
                })

                const { error: insertError } = await supabase.from('users').insert(profileData)

                if (insertError) {
                  console.error('[Callback] Profile creation error:', insertError)
                  console.error('[Callback] Failed profile data:', profileData)
                  return Response.redirect(
                    `${origin}/user/auth?error=Failed to create user profile: ${insertError.message}`,
                    302,
                  )
                }

                console.log(`[Callback] Profile created successfully for user: ${user.email} with username: ${username}`)
              }

              console.log('[Callback] User authenticated successfully:', user.email)

              const forwardedHost = request.headers.get('x-forwarded-host')
              const isLocalEnv = process.env.NODE_ENV === 'development'

              if (isOAuthUser) {
                console.log('[Callback] OAuth user login successful, redirecting to home')

                if (isLocalEnv) {
                  return Response.redirect(`${origin}/`, 302)
                }
                if (forwardedHost) {
                  return Response.redirect(`https://${forwardedHost}/`, 302)
                }
                return Response.redirect(`${origin}/`, 302)
              }

              console.log('[Callback] Email confirmed user, signing out for security')
              await supabase.auth.signOut()

              const successQuery = `${next}?success=Email confirmed successfully! You can now sign in.`
              if (isLocalEnv) {
                return Response.redirect(`${origin}${successQuery}`, 302)
              }
              if (forwardedHost) {
                return Response.redirect(`https://${forwardedHost}${successQuery}`, 302)
              }
              return Response.redirect(`${origin}${successQuery}`, 302)
            }
          } else {
            console.error('[Callback] Exchange code error:', error)
          }
        }

        return Response.redirect(`${origin}/user/auth?error=Could not authenticate user`, 302)
      },
    },
  },
})
