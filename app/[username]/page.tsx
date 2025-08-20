"use client"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, MapPin, Calendar, Globe, Github, Twitter, Heart, MessageCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/ui/navbar"

const showcaseProjects = [
  {
    id: 1,
    title: "Pointer AI landing page",
    author: { username: "sarahchen" },
    likes: 88,
    views: 1247,
  },
  {
    id: 2,
    title: "Liquid Glass - Navigation Menu",
    author: { username: "marcusrodriguez" },
    likes: 68,
    views: 934,
  },
  {
    id: 3,
    title: "Portfolio - Template by v0",
    author: { username: "emmathompson" },
    likes: 90,
    views: 1456,
  },
  {
    id: 4,
    title: "Marketing Website",
    author: { username: "davidkim" },
    likes: 38,
    views: 672,
  },
  {
    id: 5,
    title: "Cyberpunk dashboard design",
    author: { username: "alexrivera" },
    likes: 50,
    views: 823,
  },
  {
    id: 6,
    title: "Chatroom using GPT-5",
    author: { username: "jenniferwalsh" },
    likes: 54,
    views: 945,
  },
]

const calculateUserStats = (username: string) => {
  const userProjects = showcaseProjects.filter((project) => project.author.username === username)
  const totalLikes = userProjects.reduce((sum, project) => sum + project.likes, 0)
  const totalViews = userProjects.reduce((sum, project) => sum + project.views, 0)
  const projectCount = userProjects.length

  return {
    projects: projectCount,
    likes: totalLikes,
    views: totalViews,
  }
}

// Example user data
const users = [
  {
    username: "sarahchen",
    displayName: "Sarah Chen",
    avatar: "/professional-woman-dark-hair.png",
    bio: "Full-stack developer passionate about creating beautiful and functional web experiences. Love working with React, Next.js, and modern design systems.",
    location: "San Francisco, CA",
    joinDate: "March 2023",
    website: "https://sarahchen.dev",
    github: "sarahchen",
    twitter: "sarahchen_dev",
    email: "sarah@example.com",
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Node.js", "PostgreSQL"],
    projects: [
      {
        id: 1,
        title: "E-commerce Dashboard",
        description: "Modern admin dashboard for e-commerce management with real-time analytics.",
        image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/invite-bg-GoB0AHj5ZLt6g7O0aaRA5LzEMiJylB.webp",
        likes: 156,
        comments: 23,
        tags: ["React", "Chart.js", "Tailwind"],
      },
      {
        id: 2,
        title: "Task Management App",
        description: "Collaborative task management tool with drag-and-drop functionality.",
        image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/invite-bg-GoB0AHj5ZLt6g7O0aaRA5LzEMiJylB.webp",
        likes: 89,
        comments: 12,
        tags: ["Next.js", "Prisma", "Framer Motion"],
      },
    ],
  },
  {
    username: "marcusrodriguez",
    displayName: "Marcus Rodriguez",
    avatar: "/hispanic-man-beard.png",
    bio: "UI/UX Designer & Frontend Developer. Specializing in creating intuitive user interfaces and seamless user experiences.",
    location: "Austin, TX",
    joinDate: "January 2023",
    website: "https://marcusux.com",
    github: "marcusrodriguez",
    twitter: "marcus_ux",
    email: "marcus@example.com",
    skills: ["Figma", "React", "Vue.js", "SCSS", "Adobe Creative Suite", "Prototyping"],
    projects: [
      {
        id: 3,
        title: "Banking Mobile App",
        description: "Clean and secure mobile banking interface with biometric authentication.",
        image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/invite-bg-GoB0AHj5ZLt6g7O0aaRA5LzEMiJylB.webp",
        likes: 234,
        comments: 45,
        tags: ["React Native", "UI/UX", "Security"],
      },
    ],
  },
  {
    username: "emmathompson",
    displayName: "Emma Thompson",
    avatar: "/blonde-woman-glasses.png",
    bio: "Backend Engineer with expertise in scalable systems and cloud architecture. Always learning new technologies.",
    location: "London, UK",
    joinDate: "June 2022",
    website: "https://emmathompson.tech",
    github: "emmathompson",
    twitter: "emma_codes",
    email: "emma@example.com",
    skills: ["Python", "Django", "AWS", "Docker", "Kubernetes", "PostgreSQL"],
    projects: [
      {
        id: 4,
        title: "API Gateway Service",
        description: "High-performance API gateway with rate limiting and authentication.",
        image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/invite-bg-GoB0AHj5ZLt6g7O0aaRA5LzEMiJylB.webp",
        likes: 312,
        comments: 67,
        tags: ["Python", "FastAPI", "Redis"],
      },
    ],
  },
]

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const user = users.find((u) => u.username === username)

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
          <p className="text-muted-foreground mb-6">The profile you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  const realStats = calculateUserStats(username)

  return (
    <div className="min-h-screen bg-background">
      <Navbar showBackButton={true} />

      {/* Profile Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="bg-card rounded-xl border border-border p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-32 w-32 mx-auto md:mx-0">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.displayName} />
              <AvatarFallback className="text-2xl">
                {user.displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">{user.displayName}</h1>
              <p className="text-muted-foreground text-lg mb-4">@{user.username}</p>
              <p className="text-foreground mb-4 max-w-2xl">{user.bio}</p>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4 justify-center md:justify-start">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {user.location}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {user.joinDate}
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
                {user.github && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4 mr-2" />
                      GitHub
                    </a>
                  </Button>
                )}
                {user.twitter && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`https://twitter.com/${user.twitter}`} target="_blank" rel="noopener noreferrer">
                      <Twitter className="h-4 w-4 mr-2" />
                      Twitter
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Skills & Technologies</h2>
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6">Projects</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {user.projects.map((project) => (
                <div key={project.id} className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-lg bg-muted mb-4">
                    <img
                      src={project.image || "/placeholder.svg"}
                      alt={project.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Button variant="secondary" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Project
                      </Button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-lg mb-2">{project.title}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{project.description}</p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {project.likes}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {project.comments}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
