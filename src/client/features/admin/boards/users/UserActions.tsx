'use client'

import { IconBan, IconChartBar, IconDotsVertical, IconEdit, IconShield, IconUserCheck } from '@tabler/icons-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { AdminUser } from '@/lib/actions/admin/users'

interface UserActionsProps {
  user: AdminUser
  onEditRole: () => void
  onSuspend: () => void
  onViewStats: () => void
}

export function UserActions({ user, onEditRole, onSuspend, onViewStats }: UserActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
        >
          <IconDotsVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link
            href={`/${user.username}`}
            target="_blank"
            className="flex items-center"
          >
            <IconUserCheck className="mr-2 h-4 w-4" />
            View Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onViewStats}>
          <IconChartBar className="mr-2 h-4 w-4" />
          View Stats
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onEditRole}>
          <IconShield className="mr-2 h-4 w-4" />
          Edit Role
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onSuspend}
          className={user.is_suspended ? 'text-green-600' : 'text-destructive'}
        >
          <IconBan className="mr-2 h-4 w-4" />
          {user.is_suspended ? 'Unsuspend User' : 'Suspend User'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
