'use client'

import { IconEye, IconHeart, IconMessageCircle } from '@tabler/icons-react'
import Link from 'next/link'
import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AdminProject } from '@/lib/actions/admin/projects'
import { ProjectActions } from './project-actions'
import { ProjectEditDialog } from './project-edit-dialog'

interface ProjectsTableProps {
  projects: AdminProject[]
  totalCount: number
  currentPage: number
}

export function ProjectsTable({ projects, totalCount, currentPage }: ProjectsTableProps) {
  const [editingProject, setEditingProject] = useState<AdminProject | null>(null)

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <p className="text-muted-foreground">No projects found</p>
      </div>
    )
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={project.image_url || ''}
                        alt={project.title}
                      />
                      <AvatarFallback>{project.title[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link
                        href={`/project/${project.slug}`}
                        className="font-medium hover:underline"
                      >
                        {project.title}
                      </Link>
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {project.tagline || project.description}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={project.author.avatar_url || ''} />
                      <AvatarFallback>{project.author.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{project.author.display_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{project.category}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <IconEye className="h-3.5 w-3.5" />
                      {project.views_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <IconHeart className="h-3.5 w-3.5" />
                      {project.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <IconMessageCircle className="h-3.5 w-3.5" />
                      {project.comments_count}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {project.featured ? (
                    <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">Featured</Badge>
                  ) : (
                    <Badge variant="outline">Regular</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <ProjectActions
                    project={project}
                    onEdit={() => setEditingProject(project)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          Showing {projects.length} of {totalCount} projects
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => {
              const params = new URLSearchParams(window.location.search)
              params.set('page', String(currentPage - 1))
              window.location.search = params.toString()
            }}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={projects.length < 20}
            onClick={() => {
              const params = new URLSearchParams(window.location.search)
              params.set('page', String(currentPage + 1))
              window.location.search = params.toString()
            }}
          >
            Next
          </Button>
        </div>
      </div>

      {editingProject && (
        <ProjectEditDialog
          project={editingProject}
          open={!!editingProject}
          onOpenChange={(open: boolean) => !open && setEditingProject(null)}
        />
      )}
    </>
  )
}
