// Server Component - No 'use client' directive!

import { Calendar, ExternalLink, Globe, Tag, User } from 'lucide-react'
import { Image } from '@unpic/react'
import { Link } from '@tanstack/react-router'
import { notFound, redirect } from '@/lib/navigation'
import type { ReactNode } from 'react'
import { ProjectActionsClient } from '@/components/project/ProjectActionsClient'
import { ProjectEditClient } from '@/components/project/ProjectEditClient'
import { ShareButton } from '@/components/project/ShareButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CommentSection } from '@/components/ui/comment-section'
import { Footer } from '@/components/ui/footer'
import { ScrollReveal } from '@/components/ui/motion-wrapper'
import { Navbar } from '@/components/ui/navbar'
import { OptimizedAvatar } from '@/components/ui/optimized-avatar'
import { ProjectImageCarousel } from '@/components/ui/project-image-carousel'
import { ProminentLikeButton } from '@/components/ui/prominent-like-button'
import { UserDisplayName } from '@/components/ui/user-display-name'
import { getProjectBySlug } from '@/lib/actions'
import { getComments } from '@/lib/actions/comments'
import { getCategories } from '@/lib/categories'
import { checkProjectOwnership, getCurrentUser } from '@/lib/server/auth'
import { getProjectByUUID, isUUID } from '@/lib/server/utils'

/**
 * Render plain text description with proper line breaks and bullet points.
 */
function renderDescription(text: string): ReactNode {
  if (!text) return null

  // Normalize Windows line endings (CRLF) to Unix (LF)
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Split by double newlines for paragraphs, single newlines for line breaks
  const paragraphs = normalized.split(/\n\n+/)

  return paragraphs.map((paragraph, paragraphIndex) => {
    const lines = paragraph.split('\n')
    const hasBullets = lines.some((line) => /^[\s]*[•\-*]\s/.test(line))

    if (hasBullets) {
      // Check if paragraph contains bullet points
      const firstLine = lines[0]
      const isHeader = firstLine && !/^[\s]*[•\-*]\s/.test(firstLine)
      const contentLines = isHeader ? lines.slice(1) : lines
      const contentNodes: ReactNode[] = []
      let bulletItems: ReactNode[] = []
      let bulletListStartIndex = 0

      const flushBulletItems = () => {
        if (bulletItems.length === 0) return

        contentNodes.push(
          <ul
            key={`para-${paragraphIndex}-list-${bulletListStartIndex}`}
            className="mb-4 list-inside list-disc space-y-1"
          >
            {bulletItems}
          </ul>,
        )
        bulletItems = []
      }

      contentLines.forEach((line, lineIndex) => {
        const bulletMatch = line.match(/^[\s]*[•\-*]\s*(.*)$/)

        if (bulletMatch) {
          if (bulletItems.length === 0) {
            bulletListStartIndex = lineIndex
          }

          bulletItems.push(
            <li key={`para-${paragraphIndex}-bullet-${lineIndex}-${bulletMatch[1]}`}>{bulletMatch[1]}</li>,
          )
          return
        }

        flushBulletItems()

        if (line.trim()) {
          contentNodes.push(
            <p
              key={`para-${paragraphIndex}-line-${lineIndex}-${line}`}
              className="mb-4"
            >
              {line}
            </p>,
          )
        }
      })

      flushBulletItems()

      return (
        <div key={`para-${paragraphIndex}-${paragraph}`}>
          {isHeader && <p className="mt-4 mb-2 font-semibold">{firstLine}</p>}
          {contentNodes}
        </div>
      )
    }

    return (
      <p
        key={`para-${paragraphIndex}-${paragraph}`}
        className="mb-4"
      >
        {lines.map((line, lineIndex) => (
          <span key={`para-${paragraphIndex}-line-${lineIndex}-${line}`}>
            {line}
            {lineIndex < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    )
  })
}

// Server Component - async function
export default async function ProjectDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Handle legacy UUID redirect on server
  if (isUUID(slug)) {
    const legacyProject = await getProjectByUUID(slug)
    if (legacyProject?.slug) {
      redirect(`/project/${legacyProject.slug}`)
    }
    throw notFound()
  }

  // Parallel data fetching on server
  const [currentUser, { project, error: projectError }, categories] = await Promise.all([
    getCurrentUser(),
    getProjectBySlug(slug),
    getCategories(),
  ])

  // Handle errors with Next.js throw notFound()
  if (projectError || !project) {
    throw notFound()
  }

  // Fetch comments using project.id (UUID)
  const { comments: initialComments } = await getComments('project', project.id)

  // Check ownership on server
  const isOwner = currentUser ? await checkProjectOwnership(project.author.username, currentUser.id) : false

  return (
    <div className="bg-grid-pattern relative min-h-screen">
      {/* Background Gradient Overlay */}
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>

      <Navbar
        showBackButton={true}
        showNavigation={true}
        isLoggedIn={!!currentUser}
        user={currentUser || undefined}
      />

      {/* Content Container */}
      <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Project Image Carousel */}
            <ScrollReveal duration={0.36}>
              <ProjectImageCarousel
                images={project.imageUrls || (project.image ? [project.image] : [])}
                alt={project.title}
                className="w-full"
              />
            </ScrollReveal>

            {/* Project Info */}
            <ScrollReveal
              delay={0.08}
              duration={0.32}
              className="space-y-6"
            >
              {/* Header Info */}
              <div className="flex items-center gap-2">
                <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs">{project.category}</span>
                <span className="text-muted-foreground flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3" />
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Favicon + Title + Tagline with Like Button */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-1 items-start gap-3">
                  <div className="flex-shrink-0">
                    <Image
                      src={project.faviconUrl || '/default-favicon.svg'}
                      alt="Project favicon"
                      className="h-12 w-12 rounded-lg"
                      width={48}
                      height={48}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-foreground mb-1 text-3xl leading-tight font-bold">{project.title}</h1>
                    {project.tagline && (
                      <p className="text-muted-foreground text-lg leading-relaxed">{project.tagline}</p>
                    )}
                  </div>
                </div>

                {/* Like Button - Client Component */}
                <div className="flex-shrink-0 self-start">
                  <ProminentLikeButton
                    projectId={project.slug}
                    initialLikes={project.likes}
                    isLoggedIn={!!currentUser}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <div className="text-muted-foreground text-base leading-relaxed">
                  {renderDescription(project.description)}
                </div>
              </div>

              {/* Tech Stack Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="bg-muted text-muted-foreground flex items-center gap-1 rounded-full px-3 py-1 text-sm"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Project URL */}
              {project.url && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="text-muted-foreground h-5 w-5" />
                        <div>
                          <p className="font-medium">Live Project</p>
                          <p className="text-muted-foreground text-sm">{project.url}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Visit Site
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Edit Mode - Client Component */}
              {isOwner && (
                <ProjectEditClient
                  project={{
                    title: project.title,
                    description: project.description,
                    tagline: project.tagline,
                    categoryRaw: project.categoryRaw,
                    url: project.url,
                    imageUrls: project.imageUrls,
                    image: project.image,
                    imageKeys: project.imageKeys,
                    tags: project.tags,
                    faviconUrl: project.faviconUrl,
                  }}
                  categories={categories}
                  projectSlug={slug}
                  isOwner={isOwner}
                />
              )}
            </ScrollReveal>

            {/* Comments Section - Unified Component */}
            <ScrollReveal
              delay={0.12}
              duration={0.32}
            >
              <CommentSection
                entityType="project"
                entityId={project.id}
                initialComments={initialComments}
                isLoggedIn={!!currentUser}
                currentUser={
                  currentUser
                    ? {
                        id: currentUser.id,
                        name: currentUser.name,
                        avatar: currentUser.avatar,
                      }
                    : null
                }
                allowGuest={true}
              />
            </ScrollReveal>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author Card - Static */}
            <ScrollReveal
              delay={0.1}
              duration={0.32}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4 text-center">
                    <div className="flex justify-center">
                      <OptimizedAvatar
                        src={project.author.avatar}
                        alt={project.author.name}
                        size="xl"
                        showSkeleton={false}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        <UserDisplayName
                          name={project.author.name}
                          role={project.author.role}
                        />
                      </h3>
                      <p className="text-muted-foreground text-sm">{project.author.bio}</p>
                      <p className="text-muted-foreground mt-1 flex items-center justify-center gap-1 text-xs">
                        <User className="h-3 w-3" />
                        {project.author.location}
                      </p>
                    </div>
                    <Link to={`/${project.author.username}`}>
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                      >
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Project Stats - Static */}
            <ScrollReveal
              delay={0.16}
              duration={0.32}
            >
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-4 font-semibold">Project Stats</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Views</span>
                      <span className="font-medium">{project.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Unique Visitors</span>
                      <span className="font-medium">{project.uniqueViews.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Today's Views</span>
                      <span className="font-medium">{project.todayViews}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Likes</span>
                      <span className="font-medium">{project.likes}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Comments</span>
                      <span className="font-medium">{initialComments.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Project Actions - Client Component (Owner only) */}
            {isOwner && (
              <ScrollReveal
                delay={0.22}
                duration={0.32}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <ProjectActionsClient
                        projectSlug={slug}
                        projectTitle={project.title}
                      />
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            )}

            {/* Share Button - Client Component */}
            <ScrollReveal
              delay={isOwner ? 0.28 : 0.22}
              duration={0.32}
            >
              <Card>
                <CardContent className="p-6">
                  <ShareButton projectTitle={project.title} />
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
