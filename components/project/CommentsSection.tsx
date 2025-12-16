'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { OptimizedAvatar } from '@/components/ui/optimized-avatar'
import { UserDisplayName } from '@/components/ui/user-display-name'
import { MessageCircle, Loader2 } from 'lucide-react'
import { addComment, getComments } from '@/lib/actions'

interface Comment {
  id: number | string
  author: string
  authorRole: number | null
  avatar: string
  content: string
  timestamp: string
  isGuest: boolean
}

interface CommentsSectionProps {
  projectSlug: string
  initialComments: Comment[]
  isLoggedIn: boolean
  currentUser: any
}

export function CommentsSection({
  projectSlug,
  initialComments,
  isLoggedIn,
  currentUser,
}: CommentsSectionProps) {
  const [comments, setComments] = useState(initialComments)
  const [newComment, setNewComment] = useState('')
  const [guestName, setGuestName] = useState('')
  const [addingComment, setAddingComment] = useState(false)

  const handleAddComment = async () => {
    if (
      !newComment.trim() ||
      (!isLoggedIn && !guestName.trim()) ||
      !projectSlug
    ) {
      return
    }

    setAddingComment(true)

    const formData = new FormData()
    formData.append('projectSlug', projectSlug)
    formData.append('content', newComment.trim())
    if (!isLoggedIn) {
      formData.append('authorName', guestName.trim())
    }

    const result = await addComment(formData)

    if (result.error) {
      console.error('Failed to add comment:', result.error)
      alert('Failed to add comment. Please try again.')
    } else {
      setNewComment('')
      if (!isLoggedIn) {
        setGuestName('')
      }
      // Reload comments
      const { comments: updatedComments } = await getComments(projectSlug)
      if (updatedComments) {
        setComments(updatedComments)
      }
    }

    setAddingComment(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xl font-semibold">
          <MessageCircle className="h-5 w-5" />
          Comments ({comments.length})
        </h3>
      </div>

      {/* Add Comment */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {!isLoggedIn && (
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Your name"
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border p-3 focus:ring-2 focus:outline-none"
              />
            )}
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={
                isLoggedIn
                  ? `Share your thoughts about this project, ${currentUser?.name}...`
                  : 'Share your thoughts about this project...'
              }
              className="border-border bg-background text-foreground focus:ring-primary w-full resize-none rounded-lg border p-3 focus:ring-2 focus:outline-none"
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleAddComment}
                disabled={
                  !newComment.trim() ||
                  (!isLoggedIn && !guestName.trim()) ||
                  addingComment
                }
              >
                {addingComment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Comment'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="py-8 text-center">
            <MessageCircle className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <OptimizedAvatar
                    src={comment.avatar}
                    alt={comment.author}
                    size="sm"
                    isGuest={comment.isGuest}
                    showSkeleton={true}
                  />
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <UserDisplayName
                        name={comment.author}
                        role={comment.authorRole}
                        className="text-sm font-medium"
                      />
                      {comment.isGuest && (
                        <span className="text-muted-foreground bg-muted rounded px-2 py-0.5 text-xs">
                          Guest
                        </span>
                      )}
                      <span className="text-muted-foreground text-xs">
                        {comment.timestamp}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{comment.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
