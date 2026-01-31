/**
 * Centralized authentication hook
 * Handles auth state detection, user profile fetching, and auth state changes
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types/homepage'

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [creatingProfile, setCreatingProfile] = useState(false)

  useEffect(() => {
    let isMounted = true
    let authReadyTimeout: NodeJS.Timeout

    const checkAuth = async () => {
      try {
        console.log('[useAuth] Checking authentication state...')
        const supabase = createClient()

        // Set a timeout to mark auth as ready if session takes too long
        authReadyTimeout = setTimeout(() => {
          if (isMounted) {
            console.log('[useAuth] Auth check timeout, marking auth ready')
            setAuthReady(true)
          }
        }, 5000)

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!isMounted) return

        console.log('[useAuth] Session data:', session)

        clearTimeout(authReadyTimeout)

        if (session?.user) {
          console.log('[useAuth] User found in session:', session.user)
          setIsLoggedIn(true)

          // Get user profile from database
          const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single()

          if (!isMounted) return

          console.log('[useAuth] User profile from database:', profile)

          if (profile) {
            const userData = {
              id: profile.id,
              name: profile.display_name,
              email: session.user.email || '',
              avatar: profile.avatar_url || '/vibedev-guest-avatar.png',
              username: profile.username,
              role: profile.role ?? null,
            }
            console.log('[useAuth] Setting user data:', userData)
            setUser(userData)
          }
        } else {
          // No session found - user is not logged in
          console.log('[useAuth] No session found, user is not logged in')
          setIsLoggedIn(false)
          setUser(null)
        }

        // Always mark auth as ready after checking session
        setAuthReady(true)
      } catch (error) {
        if (!isMounted) return
        console.error('[useAuth] Error in checkAuth:', error)
        clearTimeout(authReadyTimeout)
        setAuthReady(true)
      }
    }

    checkAuth()

    // Listen for auth changes FIRST, before calling getSession
    // This ensures we catch INITIAL_SESSION event
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      console.log('[useAuth] Auth state change:', event, session)

      if (event === 'INITIAL_SESSION' && session?.user) {
        console.log('[useAuth] Initial session found:', session.user)
        setIsLoggedIn(true)
        await fetchUserProfile(session.user.id, session.user.email || '')
        setAuthReady(true)
      } else if (event === 'SIGNED_IN' && session) {
        console.log('[useAuth] User signed in via auth state change')
        setIsLoggedIn(true)
        await fetchUserProfile(session.user.id, session.user.email || '')
        setAuthReady(true)
      } else if (event === 'SIGNED_OUT') {
        console.log('[useAuth] User signed out, clearing state')
        setIsLoggedIn(false)
        setUser(null)
        setCreatingProfile(false)
        setAuthReady(true)
      }
    })

    // Helper function to fetch user profile
    const fetchUserProfile = async (userId: string, email: string) => {
      try {
        const { data: profile } = await supabase.from('users').select('*').eq('id', userId).single()

        if (!isMounted) return

        console.log('[useAuth] User profile from database:', profile)

        if (profile) {
          const userData = {
            id: profile.id,
            name: profile.display_name,
            email,
            avatar: profile.avatar_url || '/vibedev-guest-avatar.png',
            username: profile.username,
            role: profile.role ?? null,
          }
          console.log('[useAuth] Setting user data:', userData)
          setUser(userData)
        }
      } catch (error) {
        console.error('[useAuth] Error fetching profile:', error)
      }
    }

    return () => {
      isMounted = false
      clearTimeout(authReadyTimeout)
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
