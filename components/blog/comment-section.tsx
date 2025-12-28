'use client'

import { Flag, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import {
  createComment,
  getComments,
  reportComment,
} from '@/lib/actions/comments'

interface Comment {
  id: string
  content: string
  created_at: string
  user: {
    id: string
    display_name: string
    avatar_url: string | null
  }[]
}

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user, isLoggedIn } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadComments()
  }, [postId])

  const loadComments = async () => {
    setLoading(true)
    const data = await getComments(postId)
    setComments(data as Comment[])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)
    const result = await createComment(postId, newComment)

    if (result.success) {
      setNewComment('')
      await loadComments()
      toast.success('Comment added')
    } else {
      toast.error(result.error ?? 'Failed to add comment')
    }

    setSubmitting(false)
  }

  const handleReport = async (commentId: string, reason: string) => {
    const result = await reportComment(commentId, reason)
    if (result.success) {
      toast.success('Comment reported for review')
    } else {
      toast.error('Failed to report comment')
    }
  }

  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold">Comments</h2>

      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <Textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-3 min-h-[100px]"
          />
          <Button type="submit" disabled={submitting || !newComment.trim()}>
            <Send className="mr-2 h-4 w-4" />
            Post Comment
          </Button>
        </form>
      ) : (
        <div className="bg-muted mb-8 rounded-lg p-4 text-center">
          <p className="text-muted-foreground">
            <a href="/user/auth" className="text-primary hover:underline">
              Sign in
            </a>{' '}
            to leave a comment
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading comments...</p>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <Avatar>
                <AvatarImage src={comment.user?.[0]?.avatar_url ?? undefined} />
                <AvatarFallback>
                  {comment.user?.[0]?.display_name?.charAt(0) ?? 'A'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium">
                    {comment.user?.[0]?.display_name ?? 'Anonymous'}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleReport(comment.id, 'spam')}
                    aria-label="Report comment"
                  >
                    <Flag className="text-muted-foreground h-4 w-4" />
                  </Button>
                </div>
                <p className="text-foreground">{comment.content}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {new Date(comment.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No comments yet. Be the first!</p>
      )}
    </section>
  )
}
