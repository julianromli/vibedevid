import { getAllUsers } from '@/lib/actions/admin/users'
import { UserSearch } from './components/user-search'
import { UsersTable } from './components/users-table'

interface SearchParams {
  search?: string
  role?: string
  status?: string
  page?: string
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams

  const filters = {
    search: params.search,
    role: params.role as 'all' | 'admin' | 'moderator' | 'user' | undefined,
    status: params.status as 'all' | 'active' | 'suspended' | undefined,
  }

  const page = params.page ? parseInt(params.page, 10) : 1

  const { users, totalCount, error } = await getAllUsers(filters, page, 20)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-destructive">Failed to load users</div>
        <div className="text-sm text-muted-foreground mt-1">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <UserSearch />
      <UsersTable
        users={users}
        totalCount={totalCount}
        currentPage={page}
      />
    </div>
  )
}
