"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HeartButton } from "@/components/ui/heart-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  ExternalLink,
  Share2,
  MessageCircle,
  Calendar,
  User,
  Globe,
  Tag,
  Loader2,
  Edit,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { Navbar } from "@/components/ui/navbar"
import { createClient } from "@/lib/supabase/client"
import {
  addComment,
  getComments,
  getProject,
  incrementProjectViews,
  signOut,
  editProject,
  deleteProject,
} from "@/lib/actions"
import { useRouter } from "next/navigation"

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [project, setProject] = useState(null)
  const [newComment, setNewComment] = useState("")
  const [guestName, setGuestName] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [comments, setComments] = useState([])
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [loading, setLoading] = useState(true)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [addingComment, setAddingComment] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isProjectOwner, setIsProjectOwner] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    category: "",
    website_url: "",
    image_url: "",
  })

  useEffect(() => {
    window.scrollTo(0, 0)

    // Additional scroll after a short delay to ensure page is fully rendered
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" })
    }, 100)

    return () => clearTimeout(timer)
  }, [projectId]) // Added projectId dependency to trigger on route changes

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setProjectId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (!projectId) return

    const initializePage = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setIsLoggedIn(true)

        const { data: profile } = await supabase.from("users").select("*").eq("id", session.user.id).single()

        if (profile) {
          setCurrentUser({
            id: session.user.id,
            name: profile.display_name,
            avatar: profile.avatar_url || "/placeholder.svg",
          })
        }
      }

      const { project: projectData, error: projectError } = await getProject(projectId)
      if (projectError) {
        console.error("Failed to load project:", projectError)
        setLoading(false)
        return
      }

      setProject(projectData)

      if (session?.user && projectData) {
        const { data: authorData } = await supabase
          .from("users")
          .select("id")
          .eq("username", projectData.author.username)
          .single()

        if (authorData && authorData.id === session.user.id) {
          setIsProjectOwner(true)
        }
      }

      await incrementProjectViews(projectId)

      await loadComments(projectId)

      setLoading(false)
    }

    initializePage()
  }, [projectId])

  const loadComments = async (projectId?: string) => {
    if (!projectId && !project?.id) return

    setCommentsLoading(true)
    const { comments: commentsData, error } = await getComments(projectId || project.id)
    if (error) {
      console.error("Failed to load comments:", error)
    } else {
      setComments(commentsData)
    }
    setCommentsLoading(false)
  }

  const handleShare = (platform: string) => {
    const url = window.location.href
    const title = project?.title || "Check out this project"

    switch (platform) {
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
          "_blank",
        )
        break
      case "linkedin":
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank")
        break
      case "copy":
        navigator.clipboard.writeText(url)
        alert("Link copied to clipboard!")
        break
    }
    setShowShareMenu(false)
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || (!isLoggedIn && !guestName.trim()) || !project?.id) {
      return
    }

    setAddingComment(true)

    const formData = new FormData()
    formData.append("projectId", project.id)
    formData.append("content", newComment.trim())
    if (!isLoggedIn) {
      formData.append("authorName", guestName.trim())
    }

    const result = await addComment(formData)

    if (result.error) {
      console.error("Failed to add comment:", result.error)
      alert("Failed to add comment. Please try again.")
    } else {
      setNewComment("")
      if (!isLoggedIn) {
        setGuestName("")
      }
      await loadComments()
    }

    setAddingComment(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleProfile = () => {
    if (currentUser && project) {
      router.push(`/${project.author.username}`)
    }
  }

  const handleDeleteProject = async () => {
    if (!project?.id) return

    setIsDeleting(true)
    const result = await deleteProject(project.id.toString())

    if (result.success) {
      router.push("/")
    } else {
      alert(result.error || "Failed to delete project")
      setIsDeleting(false)
    }
  }

  const handleEditProject = () => {
    setEditFormData({
      title: project?.title || "",
      description: project?.description || "",
      category: project?.category || "",
      website_url: project?.url || "",
      image_url: project?.image || "",
    })
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!project?.id) return

    setIsSaving(true)

    try {
      const formData = new FormData()
      formData.append("title", editFormData.title)
      formData.append("description", editFormData.description)
      formData.append("category", editFormData.category)
      formData.append("website_url", editFormData.website_url)
      formData.append("image_url", editFormData.image_url)

      const result = await editProject(project.id.toString(), formData)

      if (result.success) {
        const { project: updatedProject } = await getProject(project.id.toString())
        if (updatedProject) {
          setProject(updatedProject)
        }
        setIsEditing(false)
      } else {
        alert(result.error || "Failed to update project")
      }
    } catch (error) {
      alert("Failed to update project")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditFormData({
      title: "",
      description: "",
      category: "",
      website_url: "",
      image_url: "",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar showBackButton={true} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="w-full h-96 bg-muted animate-pulse rounded-xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted animate-pulse rounded"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                <div className="h-20 bg-muted animate-pulse rounded"></div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-muted animate-pulse rounded-xl"></div>
              <div className="h-32 bg-muted animate-pulse rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar showBackButton={true} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Project Not Found</h1>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        showBackButton={true}
        isLoggedIn={isLoggedIn}
        user={currentUser || undefined}
        onSignOut={handleSignOut}
        onProfile={handleProfile}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Image */}
            <div className="relative overflow-hidden rounded-xl bg-muted">
              <img
                src={project.image || "/placeholder.svg"}
                alt={project.title}
                loading="eager"
                decoding="async"
                className="w-full h-96 object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg"
                }}
              />
            </div>

            {/* Project Info */}
            {isEditing ? (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-6">Edit Project</h3>
                  <div className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-title">Project Title *</Label>
                      <Input
                        id="edit-title"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        placeholder="Enter project title"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description *</Label>
                      <Textarea
                        id="edit-description"
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        placeholder="Describe your project"
                        rows={4}
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-category">Category *</Label>
                      <Select
                        value={editFormData.category}
                        onValueChange={(value) => setEditFormData({ ...editFormData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Web Development">Web Development</SelectItem>
                          <SelectItem value="Mobile App">Mobile App</SelectItem>
                          <SelectItem value="Desktop App">Desktop App</SelectItem>
                          <SelectItem value="AI/ML">AI/ML</SelectItem>
                          <SelectItem value="Game Development">Game Development</SelectItem>
                          <SelectItem value="Design">Design</SelectItem>
                          <SelectItem value="DevTools">DevTools</SelectItem>
                          <SelectItem value="Open Source">Open Source</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Website URL */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-website">Website URL</Label>
                      <Input
                        id="edit-website"
                        type="url"
                        value={editFormData.website_url}
                        onChange={(e) => setEditFormData({ ...editFormData, website_url: e.target.value })}
                        placeholder="https://your-project.com"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleSaveEdit}
                        disabled={!editFormData.title.trim() || !editFormData.description.trim() || isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                      <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                        {project.category}
                      </span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {isMounted && project?.createdAt
                          ? new Date(project.createdAt).toLocaleDateString()
                          : "Loading..."}
                      </span>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">{project.title}</h1>
                    <p className="text-lg text-muted-foreground">{project.description}</p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full flex items-center gap-1"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Full Description */}
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <h3 className="text-xl font-semibold mb-3">About This Project</h3>
                  <p className="text-muted-foreground leading-relaxed">{project.fullDescription}</p>
                </div>

                {/* Project URL */}
                {project.url && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Live Project</p>
                            <p className="text-sm text-muted-foreground">{project.url}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => window.open(project.url, "_blank")}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Visit Site
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Comments Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Comments ({comments.length})
                </h3>
              </div>

              {/* Add Comment */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {!isLoggedIn && (
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Your name"
                        className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    )}
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={
                        isLoggedIn
                          ? `Share your thoughts about this project, ${currentUser?.name}...`
                          : "Share your thoughts about this project..."
                      }
                      className="w-full p-3 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || (!isLoggedIn && !guestName.trim()) || addingComment}
                      >
                        {addingComment ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          "Post Comment"
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comments List */}
              <div className="space-y-4">
                {commentsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading comments...</p>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <Card key={comment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={comment.isGuest ? "/vibedev-guest-avatar.png" : comment.avatar || "/placeholder.svg"}
                            alt={comment.author}
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{comment.author}</span>
                              {comment.isGuest && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                  Guest
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                            </div>
                            <p className="text-muted-foreground">{comment.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author Card */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <img
                    src={project.author.avatar || "/placeholder.svg"}
                    alt={project.author.name}
                    className="w-16 h-16 rounded-full mx-auto"
                  />
                  <div>
                    <h3 className="font-semibold">{project.author.name}</h3>
                    <p className="text-sm text-muted-foreground">{project.author.bio}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <User className="h-3 w-3" />
                      {project.author.location}
                    </p>
                  </div>
                  <Link href={`/${project.author.username}`}>
                    <Button variant="outline" className="w-full bg-transparent">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Project Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Project Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Views</span>
                    <span className="font-medium">{project.views.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Likes</span>
                    <HeartButton
                      projectId={project.id}
                      initialLikes={project.likes}
                      onLikeChange={(newLikes, isLiked) => {
                        console.log(`Project ${project.id} ${isLiked ? "liked" : "unliked"}: ${newLikes} likes`)
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Comments</span>
                    <span className="font-medium">{comments.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Actions & Share */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {isProjectOwner && (
                    <>
                      <Button variant="outline" className="w-full bg-transparent" onClick={handleEditProject}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Project
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full" disabled={isDeleting}>
                            {isDeleting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Project
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your project "{project?.title}"
                              and remove all associated data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteProject}
                              disabled={isDeleting}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isDeleting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                "Delete Project"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}

                  {/* Share Button */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => setShowShareMenu(!showShareMenu)}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Project
                    </Button>

                    {showShareMenu && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-10">
                        <div className="p-2 space-y-1">
                          <button
                            onClick={() => handleShare("twitter")}
                            className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
                          >
                            Share on Twitter
                          </button>
                          <button
                            onClick={() => handleShare("linkedin")}
                            className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
                          >
                            Share on LinkedIn
                          </button>
                          <button
                            onClick={() => handleShare("copy")}
                            className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
                          >
                            Copy Link
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
