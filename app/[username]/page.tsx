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

  const { data: projects, error } = await supabase
    .from("projects")
    .select(`
      *,
      users!inner(username)
    `)
    .eq("users.username", username)

  if (error) {
    console.error("Error fetching user projects:", error)
    return []
  }

  return projects || []
}

async function calculateUserStats(username: string) {
  const supabase = createClient()

  // Get user projects with likes and views
  const { data: projects } = await supabase
    .from("projects")
    .select(`
      id,
      likes_count,
      views_count,
      users!inner(username)
    `)
    .eq("users.username", username)

  if (!projects) {
    return { projects: 0, likes: 0, views: 0 }
  }

  const totalLikes = projects.reduce((sum, project) => sum + (project.likes_count || 0), 0)
  const totalViews = projects.reduce((sum, project) => sum + (project.views_count || 0), 0)
  const projectCount = projects.length

  return {
    projects: projectCount,
    likes: totalLikes,
    views: totalViews,
  }
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
    const loadProfileData = async () => {
      setLoading(true)

      try {
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
          setLoading(false)
          return
        }
        setUser(profileUser)

        // Fetch user projects and stats
        const [projects, stats] = await Promise.all([fetchUserProjects(username), calculateUserStats(username)])

        setUserProjects(projects)
        setUserStats(stats)
      } catch (error) {
        console.error("Error loading profile data:", error)
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
      <div className="min-h-screen bg-background">
        <Navbar showBackButton={true} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar showBackButton={true} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
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
    <div className="min-h-screen bg-background">
      <Navbar showBackButton={true} />

      {/* Profile Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
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

            <div className="flex-1 text-center md:text-left">
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
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-6 justify-center md:justify-start">
          <div className="text-center">
            <div className="font-bold text-xl">{userStats.projects}</div>
            <div className="text-sm text-muted-foreground">Projects</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-xl">{userStats.likes}</div>
            <div className="text-sm text-muted-foreground">Likes</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-xl">{userStats.views}</div>
            <div className="text-sm text-muted-foreground">Views</div>
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
                    <div className="relative overflow-hidden rounded-lg bg-muted mb-4">
                      <img
                        src={project.thumbnail_url || "/placeholder.svg"}
                        alt={project.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button variant="secondary" size="sm" asChild>
                          <a href={project.url || "#"} target="_blank" rel="noopener noreferrer">
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
