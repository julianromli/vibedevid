"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HeartButton } from "@/components/ui/heart-button"
import { ArrowLeft, ExternalLink, Share2, MessageCircle, Calendar, User, Globe, Tag } from "lucide-react"
import Link from "next/link"
import { Navbar } from "@/components/ui/navbar"

const projectDetails = {
  1: {
    id: 1,
    title: "Pointer AI landing page",
    description:
      "A modern, responsive landing page for Pointer AI featuring clean design, smooth animations, and optimized user experience. Built with Next.js and Tailwind CSS, this project showcases advanced UI/UX principles and modern web development practices.",
    fullDescription:
      "This comprehensive landing page project demonstrates the power of modern web technologies in creating engaging user experiences. The design features a clean, minimalist aesthetic with carefully crafted animations and micro-interactions that guide users through the product story. Built using Next.js 14 with the App Router, the project leverages server-side rendering for optimal performance and SEO. The responsive design ensures perfect functionality across all device sizes, from mobile phones to large desktop displays.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/invite-bg-GoB0AHj5ZLt6g7O0aaRA5LzEMiJylB.webp",
    author: {
      name: "Sarah Chen",
      avatar: "https://github.com/shadcn.png",
      bio: "Senior Frontend Developer with 5+ years experience in React and Next.js",
      location: "San Francisco, CA",
    },
    url: "https://pointer-ai.vercel.app",
    category: "Landing Page",
    tags: ["Next.js", "Tailwind CSS", "TypeScript", "Framer Motion"],
    likes: 88,
    views: 1240,
    createdAt: "2024-01-15",
    comments: [
      {
        id: 1,
        author: "Alex Rivera",
        avatar: "https://github.com/shadcn.png",
        content:
          "Amazing work! The animations are so smooth and the design is clean. How did you implement the scroll-triggered animations?",
        timestamp: "2 hours ago",
      },
      {
        id: 2,
        author: "Emma Thompson",
        avatar: "https://github.com/shadcn.png",
        content:
          "Love the color scheme and typography choices. This is exactly the kind of modern design I've been looking for inspiration on.",
        timestamp: "1 day ago",
      },
      {
        id: 3,
        author: "David Kim",
        avatar: "https://github.com/shadcn.png",
        content: "The mobile responsiveness is perfect. Great attention to detail!",
        timestamp: "3 days ago",
      },
    ],
  },
  2: {
    id: 2,
    title: "Liquid Glass - Navigation Menu",
    description:
      "An innovative navigation menu design featuring liquid glass morphism effects and smooth transitions. This component showcases advanced CSS techniques and modern design trends.",
    fullDescription:
      "This navigation menu component pushes the boundaries of modern web design with its innovative liquid glass morphism effects. The design incorporates advanced CSS techniques including backdrop filters, custom animations, and dynamic hover states to create a truly unique user interface element.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/invite-bg-GoB0AHj5ZLt6g7O0aaRA5LzEMiJylB.webp",
    author: {
      name: "Marcus Rodriguez",
      avatar: "https://github.com/shadcn.png",
      bio: "UI/UX Designer specializing in innovative interface design",
      location: "Barcelona, Spain",
    },
    url: "https://liquid-glass-nav.vercel.app",
    category: "Personal Web",
    tags: ["CSS", "JavaScript", "GSAP", "Design"],
    likes: 68,
    views: 892,
    createdAt: "2024-01-10",
    comments: [
      {
        id: 1,
        author: "Jennifer Walsh",
        avatar: "https://github.com/shadcn.png",
        content:
          "This is absolutely stunning! The glass effect is so well executed. Would love to see a tutorial on this.",
        timestamp: "4 hours ago",
      },
    ],
  },
  // Add more project details as needed
}

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState(null)
  const [newComment, setNewComment] = useState("")
  const [guestName, setGuestName] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState({
    name: "John Doe",
    avatar: "https://github.com/shadcn.png",
  })
  const [comments, setComments] = useState([])
  const [showShareMenu, setShowShareMenu] = useState(false)

  useEffect(() => {
    const projectId = Number.parseInt(params.id)
    const projectData = projectDetails[projectId]
    if (projectData) {
      setProject(projectData)
      setComments(projectData.comments || [])
    }
  }, [params.id])

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

  const handleAddComment = () => {
    if (newComment.trim() && (isLoggedIn || guestName.trim())) {
      const newCommentObj = {
        id: Date.now(), // Simple ID generation
        author: isLoggedIn ? currentUser.name : guestName,
        avatar: isLoggedIn ? currentUser.avatar : "https://github.com/shadcn.png",
        content: newComment.trim(),
        timestamp: "Just now",
      }

      setComments((prev) => [newCommentObj, ...prev])
      setNewComment("")
      if (!isLoggedIn) {
        setGuestName("")
      }
    }
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar showBackButton={true} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Image */}
            <div className="relative overflow-hidden rounded-xl bg-muted">
              <img src={project.image || "/placeholder.svg"} alt={project.title} className="w-full h-96 object-cover" />
            </div>

            {/* Project Info */}
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      {project.category}
                    </span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(project.createdAt).toLocaleDateString()}
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
            </div>

            {/* Comments Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Comments ({comments.length})
                </h3>
                <Button variant="outline" size="sm" onClick={() => setIsLoggedIn(!isLoggedIn)}>
                  {isLoggedIn ? "Logout" : "Login"}
                </Button>
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
                          ? `Share your thoughts about this project, ${currentUser.name}...`
                          : "Share your thoughts about this project..."
                      }
                      className="w-full p-3 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || (!isLoggedIn && !guestName.trim())}
                      >
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={comment.avatar || "/placeholder.svg"}
                          alt={comment.author}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{comment.author}</span>
                            <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                          </div>
                          <p className="text-muted-foreground">{comment.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
                  <Button variant="outline" className="w-full bg-transparent">
                    View Profile
                  </Button>
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

            {/* Share Button */}
            <Card>
              <CardContent className="p-6">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
