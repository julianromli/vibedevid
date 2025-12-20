import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types/homepage'
import BlogEditorClient from './blog-editor-client'

async function getUserData(userId: string, email: string): Promise<User | null> {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name, avatar_url, username, role')
    .eq('id', userId)
    .single()

  if (!profile) {
    return null
  }

  return {
    id: profile.id,
    name: profile.display_name,
    email,
    avatar: profile.avatar_url || '/vibedev-guest-avatar.png',
    username: profile.username,
    role: profile.role ?? null,
  }
}

export default async function BlogEditorPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/user/auth?redirectTo=/blog/editor')
  }

  const userData = await getUserData(user.id, user.email || '')

  if (!userData) {
    console.error('[BlogEditor] User profile not found for user:', user.id)
    redirect('/user/auth?redirectTo=/blog/editor')
  }

  return <BlogEditorClient user={userData} />
}
