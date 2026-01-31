'use client'

import { NavGroup } from '@/components/admin-panel/nav-group'
import { NavUser } from '@/components/admin-panel/nav-user'
import { TeamSwitcher } from '@/components/admin-panel/team-switcher'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar'
import { sidebarData } from './data/sidebar-data'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <div className="relative">
      <Sidebar
        collapsible="icon"
        {...props}
      >
        <SidebarHeader>
          <TeamSwitcher teams={sidebarData.teams} />
        </SidebarHeader>
        <SidebarContent>
          {sidebarData.navGroups.map((props) => (
            <NavGroup
              key={props.title}
              {...props}
            />
          ))}
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={sidebarData.user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </div>
  )
}
