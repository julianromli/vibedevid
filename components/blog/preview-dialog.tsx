'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { PostContent } from './post-content'

interface PreviewDialogProps {
  post: {
    title: string
    content: any
    excerpt?: string
    cover_image?: string
    author?: {
      display_name: string
      avatar_url?: string
    }
  }
}

export function PreviewDialog({ post }: PreviewDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          type="button"
        >
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[90vh] overflow-y-auto pt-10">
        <DialogHeader className="sr-only">
          <DialogTitle>Post Preview</DialogTitle>
        </DialogHeader>
        <PostContent
          post={{
            ...post,
            published_at: new Date().toISOString(),
            read_time_minutes: Math.ceil(JSON.stringify(post.content).split(' ').length / 200),
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
