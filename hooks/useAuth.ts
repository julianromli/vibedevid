/**
 * Centralized authentication hook
 * Handles auth state detection, user profile fetching, and auth state changes
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types/homepage'

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [creatingProfile, setCreatingProfile] = useState(false)

  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        console.log('[useAuth] Checking authentication state...')
        const supabase = createClient()

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth check timeout')), 3000)
        )

        const sessionPromise = supabase.auth.getSession()

        const result = (await Promise.race([
          sessionPromise,
          timeoutPromise,
        ])) as { data: { session: any }; error?: any }
        
        const {
          data: { session },
        } = result

        if (!isMounted) return

        console.log('[useAuth] Session data:', session)

        if (session?.user) {
          console.log('[useAuth] User found in session:', session.user)
          setIsLoggedIn(true)

          // Get user profile from database
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (!isMounted) return

          console.log('[useAuth] User profile from database:', profile)

          if (profile) {
            const userData = {
              id: profile.id,
              name: profile.display_name,
              email: session.user.email || '',
              avatar: profile.avatar_url || '/vibedev-guest-avatar.png',
              username: profile.username,
            }
            console.log('[useAuth] Setting user data:', userData)
            setUser(userData)
          } else {
            if (creatingProfile) {
              console.log(
                '[useAuth] Profile creation already in progress, skipping...'
              )
              return
            }

            console.log('[useAuth] No profile found, creating new user profile...')
            setCreatingProfile(true)

            const newProfile = {
              id: session.user.id,
              display_name:
                session.user.user_metadata?.full_name ||
                session.user.email?.split('@')[0] ||
                'User',
              username:
                session.user.email
                  ?.split('@')[0]
                  ?.toLowerCase()
                  .replace(/[^a-z0-9]/g, '') ||
                `user${Math.floor(Math.random() * 999999)}`,
              avatar_url:
                session.user.user_metadata?.avatar_url ||
                '/vibedev-guest-avatar.png',
              bio: '',
              location: '',
              website: '',
              github_url: '',
              twitter_url: '',
              joined_at: new Date().toISOString(),
            }

            console.log('[useAuth] Attempting to insert new profile:', newProfile)

            try {
              const { data: createdProfile, error: insertError } =
                await supabase
                  .from('users')
                  .upsert(newProfile, { onConflict: 'id' })
                  .select()
                  .single()

              if (!isMounted) return

              if (insertError) {
                console.error('[useAuth] Error creating user profile:', insertError)
                setCreatingProfile(false)
                return
              }

              console.log(
                '[useAuth] Successfully created user profile:',
                createdProfile
              )

              const userData = {
                id: newProfile.id,
                name: newProfile.display_name,
                email: session.user.email || '',
                avatar: newProfile.avatar_url,
                username: newProfile.username,
              }
              console.log('[useAuth] Created and set new user data:', userData)
              setUser(userData)
              setCreatingProfile(false)
            } catch (error) {
              if (!isMounted) return
              console.error('[useAuth] Unexpected error creating profile:', error)
              setCreatingProfile(false)
            }
          }
        } else {
          console.log('[useAuth] No session found, user not logged in')
          setIsLoggedIn(false)
          setUser(null)
          setCreatingProfile(false)
        }
      } catch (error) {
        if (!isMounted) return
        console.error('[useAuth] Error in checkAuth:', error)
        setIsLoggedIn(false)
        setUser(null)
        setCreatingProfile(false)
      } finally {
        setAuthReady(true)
      }
    }

    checkAuth()

    // Listen for auth changes
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      console.log('[useAuth] Auth state change:', event, session)
      if (event === 'SIGNED_IN' && session) {
        console.log('[useAuth] User signed in via auth state change')
        setAuthReady(true)
      } else if (event === 'SIGNED_OUT') {
        console.log('[useAuth] User signed out, clearing state')
        setIsLoggedIn(false)
        setUser(null)
        setCreatingProfile(false)
        setAuthReady(true)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return {
    isLoggedIn,
    user,
    authReady,
    creatingProfile,
  }
}
