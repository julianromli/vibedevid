'use client'

import {
  IconArchive,
  IconArchiveOff,
  IconDotsVertical,
  IconEdit,
  IconExternalLink,
  IconStar,
  IconStarOff,
  IconTrash,
} from '@tabler/icons-react'
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
import { type AdminPost, adminDeletePost, togglePostFeatured } from '@/lib/actions/admin/posts'

interface PostActionsProps {
  post: AdminPost
  onEdit: () => void
}

export function PostActions({ post, onEdit }: PostActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleFeatured = async () => {
    setIsLoading(true)
    try {
      const result = await togglePostFeatured(post.id, !post.featured)
      if (result.success) {
        toast.success(post.featured ? 'Post unfeatured' : 'Post featured')
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to update post')
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
      const result = await adminDeletePost(post.id)
      if (result.success) {
        toast.success('Post deleted successfully')
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to delete post')
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
              href={`/blog/${post.slug}`}
              target="_blank"
              className="flex items-center"
            >
              <IconExternalLink className="mr-2 h-4 w-4" />
              View Post
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={onEdit}>
            <IconEdit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleToggleFeatured}>
            {post.featured ? (
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
              This will permanently delete the post &quot;{post.title}&quot; and all associated comments and likes. This
              action cannot be undone.
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
