import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPostForEdit } from '@/lib/actions/blog'
import BlogEditorClient from '../blog-editor-client'
import type { User } from '@/types/homepage'

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

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function BlogEditorEditPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/user/auth?redirectTo=/blog/editor/${slug}`)
  }

  const [userData, postResult] = await Promise.all([getUserData(user.id, user.email || ''), getPostForEdit(slug)])

  if (!userData) {
    redirect(`/user/auth?redirectTo=/blog/editor/${slug}`)
  }

  if (!postResult.success || !postResult.data) {
    redirect('/dashboard/posts') // Redirect to dashboard if not found/authorized
  }

  return (
    <BlogEditorClient
      user={userData}
      initialData={postResult.data}
      mode="edit"
    />
  )
}
