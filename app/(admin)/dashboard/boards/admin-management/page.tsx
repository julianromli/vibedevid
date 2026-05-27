import { getPrivilegedUsers } from '@/lib/actions/admin/admins'
import { AdminManagementBoard } from './components/admin-management-board'

export default async function AdminManagementPage() {
  const result = await getPrivilegedUsers()

  if (!result.success || !result.users || !result.currentUserId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-destructive">Failed to load admin management</div>
        <div className="text-muted-foreground mt-1 text-sm">{result.error || 'Unknown error'}</div>
      </div>
    )
  }

  return (
    <AdminManagementBoard
      initialUsers={result.users}
      adminCount={result.adminCount || 0}
      moderatorCount={result.moderatorCount || 0}
    />
  )
}
