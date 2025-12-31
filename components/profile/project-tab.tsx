'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, MessageCircle } from 'lucide-react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'

interface ProjectTabProps {
  projects: any[]
}

export function ProjectTab({ projects }: ProjectTabProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/project/${project.slug}`}
          className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
        >
          <div className="bg-muted relative overflow-hidden">
            <AspectRatio ratio={16 / 9}>
              <Image
                src={project.thumbnail_url || '/placeholder.svg'}
                alt={project.title}
                fill
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg'
                }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </AspectRatio>
            {project.category && (
              <Badge
                variant="secondary"
                className="absolute top-3 right-3 backdrop-blur-sm bg-background/80"
              >
                {project.category}
              </Badge>
            )}
          </div>

          <div className="flex flex-1 flex-col p-5">
            <h3 className="group-hover:text-primary mb-2 text-lg font-bold transition-colors line-clamp-1">
              {project.title}
            </h3>
            <p className="text-muted-foreground mb-4 text-sm line-clamp-2 flex-1">{project.description}</p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-4 mt-auto">
              <div className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5" />
                <span>{project.likes || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>{project.comments_count || 0}</span>
              </div>
              <div className="ml-auto text-xs">{new Date(project.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
