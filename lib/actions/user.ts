'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types/homepage'

interface UpdateProfileData {
  username: string
  displayName: string
  bio: string
  avatar_url: string
  location: string
  website: string
  github_url: string
  twitter_url: string
}

interface UpdateProfileResult {
  success: boolean
  error?: string
  data?: UpdateProfileData
  usernameChanged?: boolean
  newUsername?: string
}

export async function getCurrentUser(): Promise<{ user: User | null; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return { user: null, error: 'Not authenticated' }
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (userError || !userData) {
      return { user: null, error: 'User not found' }
    }

    return {
      user: {
        id: userData.id,
        username: userData.username,
        name: userData.display_name,
        displayName: userData.display_name,
        email: authData.user.email || '',
        avatar: userData.avatar_url,
        avatar_url: userData.avatar_url,
        role: userData.role,
      } as User,
    }
  } catch (error) {
    console.error('Error fetching current user:', error)
    return { user: null, error: 'Failed to fetch user' }
  }
}

export async function updateUserProfile(
  currentUsername: string,
  profileData: UpdateProfileData,
): Promise<UpdateProfileResult> {
  try {
    const supabase = await createClient()

    // Validate user is authenticated
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify user owns this profile
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', currentUsername)
      .single()

    if (userError || !currentUser) {
      return { success: false, error: 'Profile not found' }
    }

    if (currentUser.id !== authData.user.id) {
      return { success: false, error: 'Not authorized to edit this profile' }
    }

    // Check username uniqueness if changed
    const usernameChanged = profileData.username !== currentUsername
    if (usernameChanged) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', profileData.username)
        .neq('id', currentUser.id)
        .single()

      if (existingUser) {
        return { success: false, error: 'Username is already taken' }
      }
    }

    // Perform the update
    const { data, error } = await supabase
      .from('users')
      .update({
        username: profileData.username,
        display_name: profileData.displayName,
        bio: profileData.bio,
        avatar_url: profileData.avatar_url,
        location: profileData.location,
        website: profileData.website,
        github_url: profileData.github_url,
        twitter_url: profileData.twitter_url,
        updated_at: new Date().toISOString(),
      })
      .eq('username', currentUsername)
      .select()

    if (error) {
      console.error('Error updating profile:', error)
      return { success: false, error: error.message }
    }

    // Revalidate the profile page
    revalidatePath(`/${currentUsername}`)
    if (usernameChanged) {
      revalidatePath(`/${profileData.username}`)
    }

    return {
      success: true,
      data: profileData,
      usernameChanged,
      newUsername: usernameChanged ? profileData.username : undefined,
    }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { success: false, error: 'Failed to update profile' }
  }
}
