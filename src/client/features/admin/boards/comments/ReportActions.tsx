'use client'

import { IconCheck, IconDotsVertical, IconEye, IconTrash, IconX } from '@tabler/icons-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type ReportedComment, takeActionOnReport } from '@/lib/actions/admin/comments'

interface ReportActionsProps {
  report: ReportedComment
  onView: () => void
}

export function ReportActions({ report, onView }: ReportActionsProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async (action: 'delete' | 'dismiss') => {
    setIsLoading(true)
    try {
      const result = await takeActionOnReport(report.id, action)
      if (result.success) {
        toast.success(action === 'delete' ? 'Comment deleted and report resolved' : 'Report dismissed')
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to process report')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
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
        <DropdownMenuItem onClick={onView}>
          <IconEye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>

        {report.status === 'pending' && (
          <>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => handleAction('delete')}>
              <IconTrash className="mr-2 h-4 w-4 text-destructive" />
              <span className="text-destructive">Delete Comment</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => handleAction('dismiss')}>
              <IconX className="mr-2 h-4 w-4" />
              Dismiss Report
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
