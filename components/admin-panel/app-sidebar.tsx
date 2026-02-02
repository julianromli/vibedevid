'use client'

import type { User } from '@/types/homepage'
import { Logo } from '@/components/logo'
import { NavGroup } from '@/components/admin-panel/nav-group'
import { NavUser } from '@/components/admin-panel/nav-user'
import { TeamSwitcher } from '@/components/admin-panel/team-switcher'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { sidebarData } from './data/sidebar-data'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const userData = {
    name: user.displayName || user.name || user.username || 'User',
    email: user.email || '',
    avatar: user.avatar_url || user.avatar || '',
  }

  const teams = [
    {
      name: 'VibeDev ID Community',
      logo: ({ className }: { className: string }) => <Logo className={cn('invert dark:invert-0', className)} />,
      plan: 'Admin Dashboard',
    },
  ]

  return (
    <div className="relative">
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <TeamSwitcher teams={teams} />
        </SidebarHeader>
        <SidebarContent>
          {sidebarData.navGroups.map((props) => (
            <NavGroup key={props.title} {...props} />
          ))}
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={userData} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </div>
  )
}
