import type { getReportedComments } from '@/lib/actions/admin/comments'
import { ReportsTable } from './components/reports-table'

type ReportsResult = Awaited<ReturnType<typeof getReportedComments>>

export interface CommentsBoardProps {
  reports: ReportsResult['reports']
  totalCount: ReportsResult['totalCount']
  error?: ReportsResult['error']
  page: number
}

export default function CommentsPage({ reports, totalCount, error, page }: CommentsBoardProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-destructive">Failed to load reports</div>
        <div className="text-sm text-muted-foreground mt-1">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ReportsTable
        reports={reports}
        totalCount={totalCount}
        currentPage={page}
      />
    </div>
  )
}
