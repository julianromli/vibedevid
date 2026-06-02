'use client'

import { IconFileText, IconMessageCircle, IconTrash, IconX } from '@tabler/icons-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { type ReportedComment, takeActionOnReport } from '@/lib/actions/admin/comments'

interface CommentPreviewProps {
  report: ReportedComment
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommentPreview({ report, open, onOpenChange }: CommentPreviewProps) {
  const handleAction = async (action: 'delete' | 'dismiss') => {
    try {
      const result = await takeActionOnReport(report.id, action)
      if (result.success) {
        toast.success(action === 'delete' ? 'Comment deleted and report resolved' : 'Report dismissed')
        onOpenChange(false)
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to process report')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const entityUrl = report.entity_type === 'post' ? `/blog/${report.entity_id}` : `/project/${report.entity_id}`

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reported Comment</DialogTitle>
          <DialogDescription>Review the reported content and take appropriate action</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={report.comment.author?.avatar_url || ''} />
                <AvatarFallback>{report.comment.author?.display_name[0] || '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{report.comment.author?.display_name || 'Unknown'}</span>
                  {report.comment.isGuest && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      Guest
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{new Date(report.comment.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm whitespace-pre-wrap">{report.comment.content}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Report Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Reported by</p>
                <p>
                  {report.reporter.display_name} (@{report.reporter.username})
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Reason</p>
                <p>{report.reason}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Entity</p>
                <div className="flex items-center gap-1">
                  <IconFileText className="h-3.5 w-3.5" />
                  <Link
                    href={entityUrl}
                    target="_blank"
                    className="text-primary hover:underline truncate max-w-[150px]"
                  >
                    {report.entity_title}
                  </Link>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant={report.status === 'pending' ? 'default' : 'secondary'}>{report.status}</Badge>
              </div>
            </div>
          </div>
        </div>

        {report.status === 'pending' && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => handleAction('delete')}
            >
              <IconTrash className="h-4 w-4 mr-1" />
              Delete Comment
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleAction('dismiss')}
            >
              <IconX className="h-4 w-4 mr-1" />
              Dismiss Report
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
