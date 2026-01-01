'use client'
import { format } from 'date-fns'
import { ArrowLeft, FilePenLine, FolderOpen, FileText, LayoutGrid, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import ProfileEditDialog from '@/components/ui/profile-edit-dialog'
import { ProfileHeaderSkeleton, ProjectGridSkeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// New Components
import { ProfileHeader } from '@/components/profile/profile-header'
import { ProfileStats } from '@/components/profile/profile-stats'
import { ProjectTab } from '@/components/profile/project-tab'
import { BlogTab } from '@/components/profile/blog-tab'
import { EmptyState } from '@/components/profile/empty-state'

async function updateUserProfile(username: string, profileData: any) {
  const supabase = createClient()

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
    .eq('username', username)
    .select()

  if (error) {
    console.error('Error updating profile:', error)
    return { success: false, error: error.message }
  }

  console.log('[v0] Profile updated in database:', data)
  return { success: true, data }
}

async function fetchUserProjects(username: string) {
  const supabase = createClient()

  // Single optimized query dengan JOIN dan aggregation
  const { data: projectsData, error } = await supabase.rpc('get_user_projects_with_stats', {
    username_param: username,
  })

  if (error) {
    console.warn('RPC not available, falling back to regular queries:', error)
    return await fetchUserProjectsFallback(username)
  }

  return (projectsData || []).map((project: any) => ({
    ...project,
    likes: project.likes_count || project.likes || 0,
    thumbnail_url: project.image_url,
    url: project.website_url,
  }))
}

async function fetchUserProjectsFallback(username: string) {
  const supabase = createClient()

  const { data: user, error: userError } = await supabase.from('users').select('id').eq('username', username).single()

  if (userError || !user) {
    console.error('Error fetching user for projects:', userError)
    return []
  }

  const { data: projects, error } = await supabase
    .from('projects')
    .select(
      `
      id,
      slug,
      title,
      description,
      category,
      website_url,
      image_url,
      author_id,
      created_at,
      updated_at
    `,
    )
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error || !projects?.length) {
    return []
  }

  const projectIds = projects.map((p) => p.id)

  const [likesData, viewsData, commentsData] = await Promise.all([
    supabase.from('likes').select('project_id').in('project_id', projectIds),
    supabase.from('views').select('project_id').in('project_id', projectIds),
    supabase.from('comments').select('project_id').in('project_id', projectIds),
  ])

  const likeCounts =
    likesData.data?.reduce(
      (acc, like) => {
        acc[like.project_id] = (acc[like.project_id] || 0) + 1
        return acc
      },
      {} as Record<number, number>,
    ) || {}

  const viewCounts =
    viewsData.data?.reduce(
      (acc, view) => {
        acc[view.project_id] = (acc[view.project_id] || 0) + 1
        return acc
      },
      {} as Record<number, number>,
    ) || {}

  const commentCounts =
    commentsData.data?.reduce(
      (acc, comment) => {
        acc[comment.project_id] = (acc[comment.project_id] || 0) + 1
        return acc
      },
      {} as Record<number, number>,
    ) || {}

  return projects.map((project) => ({
    ...project,
    likes: likeCounts[project.id] || 0,
    views_count: viewCounts[project.id] || 0,
    comments_count: commentCounts[project.id] || 0,
    thumbnail_url: project.image_url,
    url: project.website_url,
  }))
}

async function fetchUserProfileWithStats(username: string) {
  const supabase = createClient()

  console.log('[v0] Fetching profile and stats for username:', username)

  const { data: user, error: userError } = await supabase.from('users').select('*').eq('username', username).single()

  if (userError || !user) {
    console.error('[v0] Error fetching user:', userError)
    return { user: null, stats: { projects: 0, likes: 0, views: 0 } }
  }

  // Fetch projects and posts in parallel
  const [projectsResult, projectsListResult, postsListResult] = await Promise.all([
    supabase.from('projects').select('id', { count: 'exact' }).eq('author_id', user.id),
    supabase.from('projects').select('id').eq('author_id', user.id),
    supabase.from('posts').select('id').eq('author_id', user.id).eq('status', 'published'),
  ])

  const projectCount = projectsResult.count || 0
  const projectIds = projectsListResult.data?.map((p) => p.id) || []
  const postIds = postsListResult.data?.map((p) => p.id) || []

  // No projects and no posts - return early with zeros
  if (projectIds.length === 0 && postIds.length === 0) {
    return {
      user,
      stats: { projects: projectCount, likes: 0, views: 0 },
    }
  }

  // Fetch counts in parallel based on available data
  const [likesResult, projectViewsResult, blogViewsResult] = await Promise.all([
    // Likes from projects
    projectIds.length > 0
      ? supabase.from('likes').select('id', { count: 'exact' }).in('project_id', projectIds)
      : Promise.resolve({ count: 0, data: null, error: null }),
    // Views from projects
    projectIds.length > 0
      ? supabase.from('views').select('id', { count: 'exact' }).in('project_id', projectIds)
      : Promise.resolve({ count: 0, data: null, error: null }),
    // Views from blog posts
    postIds.length > 0
      ? supabase.from('views').select('id', { count: 'exact' }).in('post_id', postIds)
      : Promise.resolve({ count: 0, data: null, error: null }),
  ])

  const projectViews = projectViewsResult.count || 0
  const blogViews = blogViewsResult.count || 0
  const totalViews = projectViews + blogViews

  const stats = {
    projects: projectCount,
    likes: likesResult.count || 0,
    views: totalViews,
  }

  console.log('[v0] Loaded profile and stats:', {
    username: user.username,
    stats,
    projectViews,
    blogViews,
  })
  return { user, stats }
}

interface BlogPostTag {
  post_tags: { name: string } | null
}

interface UserBlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image: string | null
  published_at: string | null
  read_time_minutes: number | null
  tags?: BlogPostTag[]
}

async function fetchUserBlogPosts(userId: string): Promise<UserBlogPost[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      id,
      title,
      slug,
      excerpt,
      cover_image,
      published_at,
      read_time_minutes,
      tags:blog_post_tags(post_tags(name))
    `,
    )
    .eq('author_id', userId)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(10) // Increased limit since we have a dedicated tab
    .returns<UserBlogPost[]>()

  if (error) {
    console.error('[v0] Error fetching user blog posts:', error)
    return []
  }

  return data || []
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [userProjects, setUserProjects] = useState<any[]>([])
  const [userPosts, setUserPosts] = useState<UserBlogPost[]>([])
  const [userStats, setUserStats] = useState({
    projects: 0,
    posts: 0,
    likes: 0,
    views: 0,
  })
  const [isOwner, setIsOwner] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)

    const loadProfileDataOptimized = async () => {
      setLoading(true)

      try {
        console.log('[v0] Loading profile data for username:', username)
        const supabase = createClient()

        const [sessionResult, profileWithStatsResult] = await Promise.all([
          supabase.auth.getSession(),
          fetchUserProfileWithStats(username),
        ])

        const {
          data: { session },
        } = sessionResult
        const { user: profileUser, stats } = profileWithStatsResult

        let authUser = null
        let isOwnerCheck = false

        if (session?.user) {
          const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single()

          if (profile) {
            authUser = profile
            isOwnerCheck = profile.username === username
          }
        }

        if (!profileUser) {
          console.log('[v0] Profile user not found')
          setLoading(false)
          return
        }

        console.log('[v0] Profile user loaded:', profileUser.username)
        console.log('[v0] Loaded stats:', stats)

        const projectsPromise = fetchUserProjects(username)
        const postsPromise = fetchUserBlogPosts(profileUser.id)

        setIsLoggedIn(!!session?.user)
        if (authUser) setCurrentUser(authUser)
        setIsOwner(isOwnerCheck)
        setUser(profileUser)

        const [projects, posts] = await Promise.all([projectsPromise, postsPromise])
        console.log('[v0] Loaded projects count:', projects.length)
        console.log('[v0] Loaded blog posts count:', posts.length)
        setUserProjects(projects)
        setUserPosts(posts)
        setUserStats({ ...stats, posts: posts.length })
      } catch (error) {
        console.error('[v0] Error loading profile data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfileDataOptimized()
  }, [username])

  const handleEdit = () => {
    setShowEditDialog(true)
  }

  const handleSaveProfile = async (profileData: any) => {
    setSaving(true)
    try {
      console.log('[v0] Saving profile with avatar:', profileData.avatar_url)

      const result = await updateUserProfile(username, profileData)
      if (result.success) {
        setShowEditDialog(false)

        const updatedUser = {
          ...user,
          username: profileData.username,
          display_name: profileData.displayName,
          bio: profileData.bio,
          location: profileData.location,
          website: profileData.website,
          github_url: profileData.github_url,
          twitter_url: profileData.twitter_url,
          avatar_url: profileData.avatar_url,
        }

        console.log('[v0] Updated user state with new avatar:', updatedUser.avatar_url)
        setUser(updatedUser)

        if (profileData.username !== username) {
          router.push(`/${profileData.username}`)
        }
      } else {
        console.error('Failed to update profile:', result.error)
        alert('Failed to update profile: ' + result.error)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error saving profile')
    } finally {
      setSaving(false)
    }
  }

  const scrollToSection = (sectionId: string) => {
    if (['projects', 'features', 'reviews', 'faq'].includes(sectionId)) {
      router.push(`/#${sectionId}`)
    }
  }

  if (loading) {
    return (
      <div className="bg-grid-pattern relative min-h-screen">
        <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>

        <Navbar
          showNavigation={true}
          isLoggedIn={isLoggedIn}
          user={currentUser || undefined}
          scrollToSection={scrollToSection}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-8 pt-24 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <ProfileHeaderSkeleton />
            <div className="bg-card border-border rounded-xl border p-6">
              <div className="bg-muted mb-6 h-7 w-32 animate-pulse rounded"></div>
              <ProjectGridSkeleton
                count={6}
                columns={2}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="bg-grid-pattern relative min-h-screen">
        <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>

        <Navbar
          showNavigation={true}
          isLoggedIn={isLoggedIn}
          user={currentUser || undefined}
          scrollToSection={scrollToSection}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-8 pt-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">User Not Found</h1>
            <p className="text-muted-foreground mb-6">The profile you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-grid-pattern relative min-h-screen">
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>

      <Navbar
        showNavigation={true}
        isLoggedIn={isLoggedIn}
        user={currentUser || undefined}
        scrollToSection={scrollToSection}
      />

      <div className="relative mx-auto max-w-6xl px-4 py-8 pt-24 sm:px-6 lg:px-8">
        {/* Header & Stats */}
        <ProfileHeader
          user={user}
          isOwner={isOwner}
          onEdit={handleEdit}
        />

        <div className="mb-8">
          <ProfileStats stats={userStats} />
        </div>

        {/* Content Tabs */}
        <Tabs
          defaultValue="projects"
          className="w-full"
        >
          <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="bg-muted/50 p-1 h-auto">
              <TabsTrigger
                value="projects"
                className="px-4 py-2 gap-2 data-[state=active]:bg-background"
              >
                <LayoutGrid className="h-4 w-4" />
                Projects
                <span className="ml-1 rounded-full bg-muted-foreground/20 px-2 py-0.5 text-xs">
                  {userStats.projects}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="blog"
                className="px-4 py-2 gap-2 data-[state=active]:bg-background"
              >
                <FileText className="h-4 w-4" />
                Blog Posts
                <span className="ml-1 rounded-full bg-muted-foreground/20 px-2 py-0.5 text-xs">{userStats.posts}</span>
              </TabsTrigger>
              <TabsTrigger
                value="about"
                className="px-4 py-2 gap-2 data-[state=active]:bg-background"
              >
                <User className="h-4 w-4" />
                About
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="projects"
            className="mt-0 focus-visible:outline-none"
          >
            {userProjects.length > 0 ? (
              <ProjectTab projects={userProjects} />
            ) : (
              <EmptyState
                icon={FolderOpen}
                title="No Projects Yet"
                description={
                  isOwner
                    ? "You haven't showcased any projects yet. Start building your portfolio!"
                    : "This user hasn't added any projects yet."
                }
                actionLabel="Add Project"
                actionLink="/project/new"
                isOwner={isOwner}
              />
            )}
          </TabsContent>

          <TabsContent
            value="blog"
            className="mt-0 focus-visible:outline-none"
          >
            {userPosts.length > 0 ? (
              <BlogTab posts={userPosts} />
            ) : (
              <EmptyState
                icon={FilePenLine}
                title="No Blog Posts Yet"
                description={
                  isOwner
                    ? 'Share your thoughts and knowledge with the community.'
                    : "This user hasn't written any blog posts yet."
                }
                actionLabel="Write First Post"
                actionLink="/blog/editor"
                isOwner={isOwner}
              />
            )}
          </TabsContent>

          <TabsContent
            value="about"
            className="mt-0 focus-visible:outline-none"
          >
            <div className="bg-card border-border rounded-xl border p-8">
              <h3 className="text-xl font-bold mb-6">About {user.display_name || user.username}</h3>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed text-base">{user.bio || 'No bio available.'}</p>
              </div>

              <div className="mt-8 pt-8 border-t grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Joined</span>
                  <span className="font-medium">
                    {new Date(user.joined_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Location</span>
                  <span className="font-medium">{user.location || 'Not specified'}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ProfileEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        defaultValues={{
          name: user?.display_name || '',
          username: user?.username || '',
          avatar: user?.avatar_url || '/placeholder.svg',
          bio: user?.bio || '',
          location: user?.location || '',
          website: user?.website || '',
          github_url: user?.github_url || '',
          twitter_url: user?.twitter_url || '',
        }}
        onSave={handleSaveProfile}
        saving={saving}
      />

      <Footer />
    </div>
  )
}
