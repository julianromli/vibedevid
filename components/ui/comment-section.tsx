'use client'

import { Flag, Loader2, MessageCircle, Send } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { OptimizedAvatar } from '@/components/ui/optimized-avatar'
import { Textarea } from '@/components/ui/textarea'
import { UserDisplayName } from '@/components/ui/user-display-name'
import { createComment, getComments, reportComment } from '@/lib/actions/comments'
import type { Comment, CommentSectionProps } from '@/types/comments'

/**
 * Unified CommentSection component for both Blog and Project pages
 *
 * Features:
 * - Server-side prefetch with initialComments
 * - Guest commenting (configurable)
 * - Report feature for moderation
 * - Loading states with spinner
 * - Comment count display
 * - Toast notifications
 * - Card-based UI
 * - Newest first ordering
 */
export function CommentSection({
  entityType,
  entityId,
  initialComments,
  isLoggedIn,
  currentUser,
  allowGuest = false,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [guestName, setGuestName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reportingId, setReportingId] = useState<string | null>(null)

  const canSubmit = isLoggedIn
    ? newComment.trim().length >= 2
    : allowGuest && newComment.trim().length >= 2 && guestName.trim().length >= 2

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setIsSubmitting(true)

    const result = await createComment({
      entityType,
      entityId,
      content: newComment.trim(),
      guestName: !isLoggedIn ? guestName.trim() : undefined,
    })

    if (result.success) {
      setNewComment('')
      if (!isLoggedIn) setGuestName('')
      toast.success('Comment posted successfully')

      // Refresh comments
      const { comments: updatedComments } = await getComments(entityType, entityId)
      setComments(updatedComments)
    } else {
      toast.error(result.error ?? 'Failed to post comment')
    }

    setIsSubmitting(false)
  }

  const handleReport = async (commentId: string) => {
    if (!isLoggedIn) {
      toast.error('You must be logged in to report comments')
      return
    }

    setReportingId(commentId)

    const result = await reportComment(commentId, 'inappropriate')

    if (result.success) {
      toast.success('Comment reported for review')
    } else {
      toast.error(result.error ?? 'Failed to report comment')
    }

    setReportingId(null)
  }

  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        return diffMinutes <= 1 ? 'Just now' : `${diffMinutes}m ago`
      }
      return `${diffHours}h ago`
    }
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  return (
    <section className="space-y-6">
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xl font-semibold">
          <MessageCircle className="h-5 w-5" />
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment Form */}
      <Card>
        <CardContent className="p-4">
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Guest name input (only when not logged in and guest allowed) */}
            {!isLoggedIn && allowGuest && (
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Your name"
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border p-3 focus:ring-2 focus:outline-none"
                maxLength={50}
              />
            )}

            {/* Comment textarea */}
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={
                isLoggedIn
                  ? `Share your thoughts${currentUser?.name ? `, ${currentUser.name}` : ''}...`
                  : allowGuest
                    ? 'Share your thoughts...'
                    : 'Sign in to leave a comment'
              }
              className="min-h-[100px] resize-none"
              disabled={!isLoggedIn && !allowGuest}
              maxLength={2000}
            />

            {/* Submit button or sign in prompt */}
            <div className="flex items-center justify-between">
              {!isLoggedIn && !allowGuest ? (
                <p className="text-muted-foreground text-sm">
                  <Link
                    href="/user/auth"
                    className="text-primary hover:underline"
                  >
                    Sign in
                  </Link>{' '}
                  to leave a comment
                </p>
              ) : (
                <div /> // Spacer
              )}

              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Post Comment
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="py-8 text-center">
            <MessageCircle className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <OptimizedAvatar
                    src={comment.author?.avatarUrl}
                    alt={comment.author?.displayName ?? 'Anonymous'}
                    size="sm"
                    isGuest={comment.isGuest}
                    showSkeleton={true}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <UserDisplayName
                          name={comment.author?.displayName ?? 'Anonymous'}
                          role={comment.author?.role ?? null}
                          className="text-sm font-medium"
                        />
                        {comment.isGuest && (
                          <span className="text-muted-foreground bg-muted rounded px-2 py-0.5 text-xs">Guest</span>
                        )}
                        <span className="text-muted-foreground text-xs">{formatTimestamp(comment.createdAt)}</span>
                      </div>

                      {/* Report button (only for logged in users) */}
                      {isLoggedIn && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleReport(comment.id)}
                          disabled={reportingId === comment.id}
                          aria-label="Report comment"
                        >
                          {reportingId === comment.id ? (
                            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                          ) : (
                            <Flag className="text-muted-foreground h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>

                    <p className="text-foreground whitespace-pre-wrap break-words">{comment.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </section>
  )
}
