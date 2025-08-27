"use client"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Globe,
  Github,
  Twitter,
  Heart,
  MessageCircle,
  ExternalLink,
  Edit,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UserAvatar } from "@/components/ui/user-avatar"
import { Navbar } from "@/components/ui/navbar"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import ProfileEditDialog from "@/components/ui/profile-edit-dialog"

async function updateUserProfile(username: string, profileData: any) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("users")
    .update({
      username: profileData.username,
      display_name: profileData.displayName,
      bio: profileData.bio,
      avatar_url: profileData.avatar_url, // Fixed: use avatar_url instead of avatar
      location: profileData.location,
      website: profileData.website,
      github_url: profileData.github_url,
      twitter_url: profileData.twitter_url,
      updated_at: new Date().toISOString(),
    })
    .eq("username", username)
    .select()

  if (error) {
    console.error("Error updating profile:", error)
    return { success: false, error: error.message }
  }

  console.log("[v0] Profile updated in database:", data)
  return { success: true, data }
}

async function fetchUserProfile(username: string) {
  const supabase = createClient()

  const { data: user, error } = await supabase.from("users").select("*").eq("username", username).single()

  if (error) {
    console.error("Error fetching user profile:", error)
    return null
  }

  return user
}

async function fetchUserProjects(username: string) {
  const supabase = createClient()

  // Single optimized query dengan JOIN dan aggregation
  const { data: projectsData, error } = await supabase.rpc("get_user_projects_with_stats", {
    username_param: username,
  })

  if (error) {
    console.warn("RPC not available, falling back to regular queries:", error)
    // Fallback to regular queries if RPC doesn't exist
    return await fetchUserProjectsFallback(username)
  }

  return (projectsData || []).map((project: any) => ({
    ...project,
    thumbnail_url: project.image_url,
    url: project.website_url,
  }))
}

// Fallback function dengan optimized queries
async function fetchUserProjectsFallback(username: string) {
  const supabase = createClient()

  // Get user ID once
  const { data: user, error: userError } = await supabase.from("users").select("id").eq("username", username).single()

  if (userError || !user) {
    console.error("Error fetching user for projects:", userError)
    return []
  }

  // Get projects with basic info
  const { data: projects, error } = await supabase
    .from("projects")
    .select(`
      id,
      title,
      description,
      category,
      website_url,
      image_url,
      author_id,
      created_at,
      updated_at
    `)
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10) // Limit untuk performance

  if (error || !projects?.length) {
    return []
  }

  // Batch count queries untuk semua projects sekaligus
  const projectIds = projects.map((p) => p.id)

  const [likesData, viewsData, commentsData] = await Promise.all([
    supabase.from("likes").select("project_id").in("project_id", projectIds),
    supabase.from("views").select("project_id").in("project_id", projectIds),
    supabase.from("comments").select("project_id").in("project_id", projectIds),
  ])

  // Count stats per project
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
    likes_count: likeCounts[project.id] || 0,
    views_count: viewCounts[project.id] || 0,
    comments_count: commentCounts[project.id] || 0,
    thumbnail_url: project.image_url,
    url: project.website_url,
  }))
}

async function calculateUserStats(username: string) {
  const supabase = createClient()

  console.log("[v0] Calculating stats for username:", username)

  // First get the user ID from username
  const { data: user, error: userError } = await supabase.from("users").select("id").eq("username", username).single()

  if (userError || !user) {
    console.error("[v0] Error fetching user for stats:", userError)
    return { projects: 0, likes: 0, views: 0 }
  }

  console.log("[v0] Found user ID:", user.id)

  // Get projects count
  const { count: projectCount } = await supabase
    .from("projects")
    .select("id", { count: "exact" })
    .eq("author_id", user.id)

  console.log("[v0] Projects count:", projectCount)

  // Get all project IDs for this user
  const { data: userProjects } = await supabase.from("projects").select("id").eq("author_id", user.id)

  if (!userProjects || userProjects.length === 0) {
    console.log("[v0] No projects found for user")
    return { projects: projectCount || 0, likes: 0, views: 0 }
  }

  const projectIds = userProjects.map((p) => p.id)
  console.log("[v0] Project IDs:", projectIds)

  // Get total likes and views for all user projects
  const [likesResult, viewsResult] = await Promise.all([
    supabase.from("likes").select("id", { count: "exact" }).in("project_id", projectIds),
    supabase.from("views").select("id", { count: "exact" }).in("project_id", projectIds),
  ])

  console.log("[v0] Likes count:", likesResult.count)
  console.log("[v0] Views count:", viewsResult.count)

  const stats = {
    projects: projectCount || 0,
    likes: likesResult.count || 0,
    views: viewsResult.count || 0,
  }

  console.log("[v0] Final calculated stats:", stats)
  return stats
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [userProjects, setUserProjects] = useState<any[]>([])
  const [userStats, setUserStats] = useState({ projects: 0, likes: 0, views: 0 })
  const [isOwner, setIsOwner] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true)

      try {
        console.log("[v0] Loading profile data for username:", username)

        // Check current user authentication
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          const { data: profile } = await supabase.from("users").select("*").eq("id", session.user.id).single()

          setCurrentUser(profile)
          setIsOwner(profile?.username === username)
        }

        // Fetch profile user data
        const profileUser = await fetchUserProfile(username)
        if (!profileUser) {
          console.log("[v0] Profile user not found")
          setLoading(false)
          return
        }
        console.log("[v0] Profile user loaded:", profileUser.username)
        setUser(profileUser)

        // Fetch user projects and stats
        const [projects, stats] = await Promise.all([fetchUserProjects(username), calculateUserStats(username)])

        console.log("[v0] Loaded projects count:", projects.length)
        console.log("[v0] Loaded stats:", stats)

        setUserProjects(projects)
        setUserStats(stats)
      } catch (error) {
        console.error("[v0] Error loading profile data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [username])

  const handleEdit = () => {
    setShowEditDialog(true)
  }

  const handleSaveProfile = async (profileData: any) => {
    setSaving(true)
    try {
      console.log("[v0] Saving profile with avatar:", profileData.avatar_url) // Updated debug log

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
          avatar_url: profileData.avatar_url, // Fixed: use avatar_url
        }

        console.log("[v0] Updated user state with new avatar:", updatedUser.avatar_url)
        setUser(updatedUser)

        if (profileData.username !== username) {
          router.push(`/${profileData.username}`)
        }
      } else {
        console.error("Failed to update profile:", result.error)
        alert("Failed to update profile: " + result.error)
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Error saving profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-grid-pattern relative">
        {/* Background Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/50 via-muted/30 to-background/80"></div>
        
        <Navbar showBackButton={true} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="flex-1 text-center md:text-left py-0"></div>
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-grid-pattern relative">
        {/* Background Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/50 via-muted/30 to-background/80"></div>
        
        <Navbar showBackButton={true} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
            <p className="text-muted-foreground mb-6">The profile you're looking for doesn't exist.</p>
            <Button onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-grid-pattern relative">
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/50 via-muted/30 to-background/80"></div>
      
      <Navbar showBackButton={true} />

      {/* Profile Header */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="bg-card rounded-xl border border-border p-8 mb-8">
          {isOwner && (
            <div className="flex justify-end mb-4">
              <Button onClick={handleEdit} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6">
            <UserAvatar user={user} size="xl" className="mx-auto md:mx-0" />

            {/* User Info Section */}
            <div className="flex-1 text-center md:text-left py-0">
              <h1 className="text-3xl font-bold mb-2">{user.display_name || user.username}</h1>
              <p className="text-muted-foreground text-lg mb-4">@{user.username}</p>
              <p className="text-foreground mb-4 max-w-2xl">{user.bio || "No bio available"}</p>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4 justify-center md:justify-start">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {user.location || "Location not specified"}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(user.joined_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </div>
              </div>

              <div className="flex gap-4 mb-6 justify-center md:justify-start">
                {user.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={user.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                    </a>
                  </Button>
                )}
                {user.github_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={user.github_url} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4 mr-2" />
                      GitHub
                    </a>
                  </Button>
                )}
                {user.twitter_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={user.twitter_url} target="_blank" rel="noopener noreferrer">
                      <Twitter className="h-4 w-4 mr-2" />
                      Twitter
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <div className="flex md:flex-col gap-6 md:gap-3 justify-center md:justify-start md:items-end">
              <div className="bg-muted/30 rounded-xl p-4 text-center min-w-[80px] hover:bg-muted/50 transition-colors duration-200">
                <div className="font-bold text-2xl text-primary">{userStats.projects}</div>
                <div className="text-xs text-muted-foreground font-medium">Projects</div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center min-w-[80px] hover:bg-muted/50 transition-colors duration-200">
                <div className="font-bold text-2xl text-primary">{userStats.likes}</div>
                <div className="text-xs text-muted-foreground font-medium">Likes</div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center min-w-[80px] hover:bg-muted/50 transition-colors duration-200">
                <div className="font-bold text-2xl text-primary">{userStats.views}</div>
                <div className="text-xs text-muted-foreground font-medium">Views</div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6">Projects</h2>
            {userProjects.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {userProjects.map((project) => (
                  <div key={project.id} className="group cursor-pointer">
                    <div className="relative overflow-hidden rounded-lg bg-muted mb-4 aspect-video">
                      <img
                        src={project.thumbnail_url || "/placeholder.svg"}
                        alt={project.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg"
                        }}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button variant="secondary" size="sm" asChild>
                          <a href={`/project/${project.id}`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Project
                          </a>
                        </Button>
                      </div>
                    </div>

                    <h3 className="font-semibold text-lg mb-2">{project.title}</h3>
                    <p className="text-muted-foreground text-sm mb-3">{project.description}</p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {project.likes_count || 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {project.comments_count || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No projects yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ProfileEditDialog component */}
      <ProfileEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        defaultValues={{
          name: user?.display_name || "",
          username: user?.username || "",
          avatar: user?.avatar_url || "/placeholder.svg", // Keep as avatar for dialog compatibility
          bio: user?.bio || "",
          location: user?.location || "",
          website: user?.website || "",
          github_url: user?.github_url || "",
          twitter_url: user?.twitter_url || "",
        }}
        onSave={handleSaveProfile}
        saving={saving}
      />
    </div>
  )
}
