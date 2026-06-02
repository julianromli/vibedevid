'use client'

import { IconDotsVertical, IconEdit, IconExternalLink, IconStar, IconStarOff, IconTrash } from '@tabler/icons-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type AdminProject, adminDeleteProject, toggleProjectFeatured } from '@/lib/actions/admin/projects'

interface ProjectActionsProps {
  project: AdminProject
  onEdit: () => void
}

export function ProjectActions({ project, onEdit }: ProjectActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleFeatured = async () => {
    setIsLoading(true)
    try {
      const result = await toggleProjectFeatured(project.id, !project.featured)
      if (result.success) {
        toast.success(project.featured ? 'Project unfeatured' : 'Project featured')
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to update project')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const result = await adminDeleteProject(project.id)
      if (result.success) {
        toast.success('Project deleted successfully')
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to delete project')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
          >
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link
              href={`/project/${project.slug}`}
              target="_blank"
              className="flex items-center"
            >
              <IconExternalLink className="mr-2 h-4 w-4" />
              View Project
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={onEdit}>
            <IconEdit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleToggleFeatured}>
            {project.featured ? (
              <>
                <IconStarOff className="mr-2 h-4 w-4" />
                Unfeature
              </>
            ) : (
              <>
                <IconStar className="mr-2 h-4 w-4" />
                Feature
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <IconTrash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project &quot;{project.title}&quot; and all associated comments, likes,
              and views. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
