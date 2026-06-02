'use client'

import { IconFolder, IconHeart, IconMessageCircle, IconNews } from '@tabler/icons-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import type { AdminUser } from '@/lib/actions/admin/users'

interface UserStatsProps {
  user: AdminUser
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserStats({ user, open, onOpenChange }: UserStatsProps) {
  const maxStat = Math.max(
    user.stats.projects_count,
    user.stats.posts_count,
    user.stats.comments_count,
    user.stats.likes_received,
    1,
  )

  const getRoleName = (role: number) => {
    switch (role) {
      case 0:
        return 'Admin'
      case 1:
        return 'Moderator'
      case 2:
        return 'User'
      default:
        return 'Unknown'
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>User Statistics</DialogTitle>
          <DialogDescription>Activity overview for {user.display_name}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={user.avatar_url || ''}
                alt={user.display_name}
              />
              <AvatarFallback>{user.display_name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{user.display_name}</h3>
              <p className="text-muted-foreground">@{user.username}</p>
              <Badge variant={user.role === 0 ? 'default' : 'secondary'}>{getRoleName(user.role)}</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconFolder className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Projects</span>
                </div>
                <span className="text-sm font-bold">{user.stats.projects_count}</span>
              </div>
              <Progress value={(user.stats.projects_count / maxStat) * 100} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconNews className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Posts</span>
                </div>
                <span className="text-sm font-bold">{user.stats.posts_count}</span>
              </div>
              <Progress value={(user.stats.posts_count / maxStat) * 100} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconMessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Comments</span>
                </div>
                <span className="text-sm font-bold">{user.stats.comments_count}</span>
              </div>
              <Progress value={(user.stats.comments_count / maxStat) * 100} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconHeart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Likes Received</span>
                </div>
                <span className="text-sm font-bold">{user.stats.likes_received}</span>
              </div>
              <Progress value={(user.stats.likes_received / maxStat) * 100} />
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Joined</p>
                <p className="font-medium">{new Date(user.joined_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">
                  {user.is_suspended ? (
                    <span className="text-red-600">Suspended</span>
                  ) : (
                    <span className="text-green-600">Active</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
