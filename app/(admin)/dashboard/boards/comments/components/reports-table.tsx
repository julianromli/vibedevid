'use client'

import { IconFileText, IconMessageCircle } from '@tabler/icons-react'
import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ReportedComment } from '@/lib/actions/admin/comments'
import { CommentPreview } from './comment-preview'
import { ReportActions } from './report-actions'

interface ReportsTableProps {
  reports: ReportedComment[]
  totalCount: number
  currentPage: number
}

export function ReportsTable({ reports, totalCount, currentPage }: ReportsTableProps) {
  const [viewingReport, setViewingReport] = useState<ReportedComment | null>(null)

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <IconMessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No reported comments found</p>
        <p className="text-sm text-muted-foreground mt-1">Reports from users will appear here</p>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600">Pending</Badge>
      case 'reviewed':
        return <Badge className="bg-green-500/10 text-green-600">Reviewed</Badge>
      case 'dismissed':
        return <Badge variant="outline">Dismissed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Comment</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={report.comment.author?.avatar_url || ''} />
                      <AvatarFallback>{report.comment.author?.display_name[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="max-w-[200px]">
                      <p className="text-sm truncate">{report.comment.content}</p>
                      <p className="text-xs text-muted-foreground">
                        by {report.comment.author?.display_name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{report.reporter.display_name}</span>
                    <span className="text-xs text-muted-foreground">@{report.reporter.username}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm max-w-[150px] truncate">{report.reason}</p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <IconFileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate max-w-[100px]">{report.entity_title}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs mt-1"
                  >
                    {report.entity_type}
                  </Badge>
                </TableCell>
                <TableCell>{getStatusBadge(report.status)}</TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <ReportActions
                    report={report}
                    onView={() => setViewingReport(report)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          Showing {reports.length} of {totalCount} reports
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
            disabled={reports.length < 20}
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

      {viewingReport && (
        <CommentPreview
          report={viewingReport}
          open={!!viewingReport}
          onOpenChange={(open: boolean) => !open && setViewingReport(null)}
        />
      )}
    </>
  )
}
