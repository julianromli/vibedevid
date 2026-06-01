'use client'

import { Calendar, ExternalLink, Globe, Tag, User as UserIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ProjectActionsClient } from '@/components/project/ProjectActionsClient'
import { ProjectEditClient } from '@/components/project/ProjectEditClient'
import { ShareButton } from '@/components/project/ShareButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CommentSection } from '@/components/ui/comment-section'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import { OptimizedAvatar } from '@/components/ui/optimized-avatar'
import { ProjectImageCarousel } from '@/components/ui/project-image-carousel'
import { ProminentLikeButton } from '@/components/ui/prominent-like-button'
import { formatProjectDescription } from '@/lib/project-format-description'
import type { Category } from '@/lib/categories'
import type { User } from '@/types/homepage'
import { UserDisplayName } from '@/components/ui/user-display-name'

// Server Component - async function

export interface ProjectDetailClientProps {
  slug: string
  project: NonNullable<Awaited<ReturnType<typeof import('@/lib/actions')['getProjectBySlug']>>['project']>
  initialComments: Awaited<ReturnType<typeof import('@/lib/actions/comments')['getComments']>>['comments']
  categories: Category[]
  currentUser: User | null
  isOwner: boolean
}

export default function ProjectDetailClient({
  slug,
  project,
  initialComments,
  categories,
  currentUser,
  isOwner,
}: ProjectDetailClientProps) {
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
            <ProjectImageCarousel
              images={project.imageUrls || (project.image ? [project.image] : [])}
              alt={project.title}
              className="w-full"
            />

            {/* Project Info */}
            <div className="space-y-6">
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
                <div
                  className="text-muted-foreground text-base leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatProjectDescription(project.description) }}
                />
              </div>

              {/* Tech Stack Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
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
            </div>

            {/* Comments Section - Unified Component */}
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author Card - Static */}
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
                      <UserIcon className="h-3 w-3" />
                      {project.author.location}
                    </p>
                  </div>
                  <Link href={`/${project.author.username}`}>
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

            {/* Project Stats - Static */}
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

            {/* Project Actions - Client Component (Owner only) */}
            {isOwner && (
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
            )}

            {/* Share Button - Client Component */}
            <Card>
              <CardContent className="p-6">
                <ShareButton projectTitle={project.title} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
