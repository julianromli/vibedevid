import { getReportedComments } from '@/lib/actions/admin/comments'
import { ReportsTable } from './components/reports-table'

interface SearchParams {
  status?: string
  page?: string
}

export default async function CommentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams

  const filters = {
    status: params.status as 'all' | 'pending' | 'reviewed' | 'dismissed' | undefined,
  }

  const page = params.page ? parseInt(params.page, 10) : 1

  const { reports, totalCount, error } = await getReportedComments(filters, page, 20)

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
