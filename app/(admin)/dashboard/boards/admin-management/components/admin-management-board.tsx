'use client'

import { IconSearch, IconShield, IconShieldOff, IconUserPlus } from '@tabler/icons-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  grantAdminAccess,
  grantModeratorAccess,
  type PrivilegedUser,
  revokePrivilegedAccess,
  searchUsersForAdminGrant,
} from '@/lib/actions/admin/admins'
import { ROLES } from '@/lib/actions/admin/schemas'

interface SearchUser {
  id: string
  username: string
  display_name: string
  email: string
  avatar_url: string | null
  role: number
}

interface AdminManagementBoardProps {
  initialUsers: PrivilegedUser[]
  adminCount: number
  moderatorCount: number
}

export function AdminManagementBoard({ initialUsers, adminCount, moderatorCount }: AdminManagementBoardProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [searching, setSearching] = useState(false)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    userId: string
    name: string
    action: 'revoke-admin' | 'revoke-moderator'
  } | null>(null)

  const refresh = useCallback(() => {
    router.refresh()
  }, [router])

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) {
      toast.error('Enter at least 2 characters to search')
      return
    }

    setSearching(true)
    try {
      const result = await searchUsersForAdminGrant(searchQuery)
      if (result.success && result.users) {
        setSearchResults(result.users)
        if (result.users.length === 0) {
          toast.message('No users found matching your search')
        }
      } else {
        toast.error(result.error || 'Search failed')
      }
    } catch {
      toast.error('An error occurred while searching')
    } finally {
      setSearching(false)
    }
  }

  const runRoleAction = async (
    userId: string,
    action: () => Promise<{ success: boolean; error?: string }>,
    successMessage: string,
  ) => {
    setPendingUserId(userId)
    try {
      const result = await action()
      if (result.success) {
        toast.success(successMessage)
        setSearchResults((prev) => prev.filter((u) => u.id !== userId))
        refresh()
      } else {
        toast.error(result.error || 'Action failed')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setPendingUserId(null)
      setConfirmAction(null)
    }
  }

  const handleRevokeConfirm = () => {
    if (!confirmAction) return
    runRoleAction(confirmAction.userId, () => revokePrivilegedAccess(confirmAction.userId), 'Access updated')
  }

  const getRoleBadge = (role: number) => {
    if (role === ROLES.ADMIN) {
      return <Badge className="bg-red-500/10 text-red-600">Admin</Badge>
    }
    if (role === ROLES.MODERATOR) {
      return <Badge className="bg-blue-500/10 text-blue-600">Moderator</Badge>
    }
    return <Badge variant="secondary">User</Badge>
  }

  const canRevokeAdmin = (user: PrivilegedUser) => {
    if (user.role !== ROLES.ADMIN) return true
    if (user.is_current_user) return false
    if (adminCount <= 1) return false
    return true
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 font-semibold text-lg">
          <IconShield className="h-5 w-5" />
          Admin management
        </h2>
        <p className="text-muted-foreground text-sm">
          Grant or revoke admin and moderator access. Admins have full dashboard control; moderators can approve events.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Admins</CardDescription>
            <CardTitle className="text-3xl">{adminCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs">Full platform access including this panel</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Moderators</CardDescription>
            <CardTitle className="text-3xl">{moderatorCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs">
            Can moderate events; no full admin dashboard
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add admin or moderator</CardTitle>
          <CardDescription>Search any user by username, display name, or email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <IconSearch className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Username, display name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={searching}
              className="shrink-0"
            >
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="divide-y rounded-lg border">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.avatar_url || ''}
                        alt={user.display_name}
                      />
                      <AvatarFallback>{user.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{user.display_name}</p>
                        {getRoleBadge(user.role)}
                      </div>
                      <p className="text-muted-foreground text-sm">@{user.username}</p>
                      {user.email && <p className="text-muted-foreground text-xs">{user.email}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user.role === ROLES.ADMIN ? (
                      <span className="text-muted-foreground self-center text-sm">Already an admin</span>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          disabled={pendingUserId === user.id}
                          onClick={() =>
                            runRoleAction(
                              user.id,
                              () => grantAdminAccess(user.id),
                              `${user.display_name} is now an admin`,
                            )
                          }
                        >
                          <IconUserPlus className="mr-1 h-4 w-4" />
                          {user.role === ROLES.MODERATOR ? 'Promote to admin' : 'Make admin'}
                        </Button>
                        {user.role !== ROLES.MODERATOR && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={pendingUserId === user.id}
                            onClick={() =>
                              runRoleAction(
                                user.id,
                                () => grantModeratorAccess(user.id),
                                `${user.display_name} is now a moderator`,
                              )
                            }
                          >
                            Make moderator
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current admins & moderators</CardTitle>
          <CardDescription>
            {initialUsers.length} privileged {initialUsers.length === 1 ? 'account' : 'accounts'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {initialUsers.length === 0 ? (
            <p className="text-muted-foreground p-6 text-center text-sm">No admins or moderators found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={user.avatar_url || ''}
                              alt={user.display_name}
                            />
                            <AvatarFallback>{user.display_name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/${user.username}`}
                                className="font-medium hover:underline"
                                target="_blank"
                              >
                                {user.display_name}
                              </Link>
                              {user.is_current_user && (
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                >
                                  You
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground text-sm">@{user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(user.joined_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {user.role === ROLES.MODERATOR && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={pendingUserId === user.id}
                                onClick={() =>
                                  runRoleAction(
                                    user.id,
                                    () => grantAdminAccess(user.id),
                                    `${user.display_name} promoted to admin`,
                                  )
                                }
                              >
                                Promote to admin
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={pendingUserId === user.id}
                                onClick={() =>
                                  setConfirmAction({
                                    userId: user.id,
                                    name: user.display_name,
                                    action: 'revoke-moderator',
                                  })
                                }
                              >
                                Remove moderator
                              </Button>
                            </>
                          )}
                          {user.role === ROLES.ADMIN && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              disabled={!canRevokeAdmin(user) || pendingUserId === user.id}
                              onClick={() =>
                                setConfirmAction({
                                  userId: user.id,
                                  name: user.display_name,
                                  action: 'revoke-admin',
                                })
                              }
                            >
                              <IconShieldOff className="mr-1 h-4 w-4" />
                              Remove admin
                            </Button>
                          )}
                        </div>
                        {user.role === ROLES.ADMIN && user.is_current_user && (
                          <p className="text-muted-foreground mt-1 text-xs">Cannot remove your own access</p>
                        )}
                        {user.role === ROLES.ADMIN && !user.is_current_user && adminCount <= 1 && (
                          <p className="text-muted-foreground mt-1 text-xs">At least one admin is required</p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === 'revoke-admin' ? 'Remove admin access?' : 'Remove moderator access?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === 'revoke-admin'
                ? `${confirmAction.name} will become a standard user and lose access to the admin dashboard.`
                : `${confirmAction?.name} will become a standard user and lose moderator permissions.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
