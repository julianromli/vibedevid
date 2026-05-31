import type { Context } from 'hono'
import { createClient } from '@/lib/supabase/server'

export async function authCallbackHandler(c: Context) {
  const url = new URL(c.req.url)
  const code = url.searchParams.get('code')
  const next = '/user/auth'
  const origin = url.origin

  if (!code) {
    return c.redirect(`${origin}/user/auth?error=Could not authenticate user`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[Callback] Exchange code error:', error)
    return c.redirect(`${origin}/user/auth?error=Could not authenticate user`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return c.redirect(`${origin}/user/auth?error=Could not authenticate user`)
  }

  const isOAuthUser =
    user.identities &&
    user.identities.some((identity) => identity.provider !== 'email' && identity.provider !== 'phone')

  if (!isOAuthUser && !user.email_confirmed_at) {
    await supabase.auth.signOut()
    return c.redirect(
      `${origin}/user/auth?error=Email not confirmed. Please check your inbox and click the confirmation link.`,
    )
  }

  const { data: existingProfile } = await supabase.from('users').select('id').eq('id', user.id).single()

  if (!existingProfile) {
    const baseUsername =
      user.email
        ?.split('@')[0]
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, '') || `user${user.id.slice(0, 8)}`

    let username = baseUsername
    let attempts = 0
    while (attempts < 5) {
      const { data: existingUser } = await supabase.from('users').select('username').eq('username', username).single()
      if (!existingUser) break
      attempts++
      username = `${baseUsername}${attempts}`
    }

    if (attempts >= 5) {
      username = `${baseUsername}${Math.floor(Math.random() * 1000)}`
    }

    const profileData = {
      id: user.id,
      username,
      display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '/vibedev-guest-avatar.png',
      bio: null,
      location: null,
      website: null,
      github_url: null,
      twitter_url: null,
    }

    const { error: insertError } = await supabase.from('users').insert(profileData)
    if (insertError) {
      return c.redirect(`${origin}/user/auth?error=Failed to create user profile: ${insertError.message}`)
    }
  }

  if (isOAuthUser) {
    return c.redirect(`${origin}/`)
  }

  await supabase.auth.signOut()
  return c.redirect(`${origin}${next}?success=Email confirmed successfully! You can now sign in.`)
}
