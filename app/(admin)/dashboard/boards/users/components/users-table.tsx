'use client'

import { IconFolder, IconHeart, IconMessageCircle, IconNews } from '@tabler/icons-react'
import Link from 'next/link'
import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AdminUser } from '@/lib/actions/admin/users'
import { UserActions } from './user-actions'
import { UserRoleDialog } from './user-role-dialog'
import { UserStats } from './user-stats'
import { UserSuspendDialog } from './user-suspend-dialog'

interface UsersTableProps {
  users: AdminUser[]
  totalCount: number
  currentPage: number
}

export function UsersTable({ users, totalCount, currentPage }: UsersTableProps) {
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [suspendingUser, setSuspendingUser] = useState<AdminUser | null>(null)
  const [viewingStats, setViewingStats] = useState<AdminUser | null>(null)

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <p className="text-muted-foreground">No users found</p>
      </div>
    )
  }

  const getRoleBadge = (role: number) => {
    switch (role) {
      case 0:
        return <Badge className="bg-red-500/10 text-red-600">Admin</Badge>
      case 1:
        return <Badge className="bg-blue-500/10 text-blue-600">Moderator</Badge>
      case 2:
        return <Badge variant="secondary">User</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.avatar_url || ''}
                        alt={user.display_name}
                      />
                      <AvatarFallback>{user.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link
                        href={`/${user.username}`}
                        className="font-medium hover:underline"
                      >
                        {user.display_name}
                      </Link>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <button
                      onClick={() => setViewingStats(user)}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      <IconFolder className="h-3.5 w-3.5" />
                      {user.stats.projects_count}
                    </button>
                    <span className="flex items-center gap-1">
                      <IconNews className="h-3.5 w-3.5" />
                      {user.stats.posts_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <IconMessageCircle className="h-3.5 w-3.5" />
                      {user.stats.comments_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <IconHeart className="h-3.5 w-3.5" />
                      {user.stats.likes_received}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {user.is_suspended ? (
                    <Badge className="bg-red-500/10 text-red-600">Suspended</Badge>
                  ) : (
                    <Badge className="bg-green-500/10 text-green-600">Active</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{new Date(user.joined_at).toLocaleDateString()}</span>
                </TableCell>
                <TableCell className="text-right">
                  <UserActions
                    user={user}
                    onEditRole={() => setEditingUser(user)}
                    onSuspend={() => setSuspendingUser(user)}
                    onViewStats={() => setViewingStats(user)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          Showing {users.length} of {totalCount} users
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
            disabled={users.length < 20}
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

      {editingUser && (
        <UserRoleDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open: boolean) => !open && setEditingUser(null)}
        />
      )}

      {suspendingUser && (
        <UserSuspendDialog
          user={suspendingUser}
          open={!!suspendingUser}
          onOpenChange={(open: boolean) => !open && setSuspendingUser(null)}
        />
      )}

      {viewingStats && (
        <UserStats
          user={viewingStats}
          open={!!viewingStats}
          onOpenChange={(open: boolean) => !open && setViewingStats(null)}
        />
      )}
    </>
  )
}
