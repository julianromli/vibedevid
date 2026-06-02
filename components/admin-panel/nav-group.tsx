'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { ReactNode } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { DEFAULT_DASHBOARD_TAB, resolveDashboardTab } from '@/lib/admin/dashboard-tabs'
import { Badge } from '../ui/badge'
import type { NavGroup as NavGroupConfig, NavItem } from './types'

export function NavGroup({ title, items }: NavGroupConfig) {
  const { setOpenMobile } = useSidebar()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const dashboardTab = resolveDashboardTab(searchParams.get('tab'))

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          if (!item.items) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={checkIsActive(pathname, dashboardTab, item, true)}
                  tooltip={item.title}
                >
                  <Link
                    href={item.url}
                    onClick={() => setOpenMobile(false)}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge && <NavBadge>{item.badge}</NavBadge>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }
          return (
            <Collapsible
              key={item.title}
              defaultOpen={checkIsActive(pathname, dashboardTab, item, true)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge && <NavBadge>{item.badge}</NavBadge>}
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="CollapsibleContent">
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={checkIsActive(pathname, dashboardTab, subItem)}
                        >
                          <Link
                            href={subItem.url}
                            onClick={() => setOpenMobile(false)}
                          >
                            {subItem.icon && <subItem.icon />}
                            <span>{subItem.title}</span>
                            {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

const NavBadge = ({ children }: { children: ReactNode }) => (
  <Badge className="rounded-full px-1 py-0 text-xs">{children}</Badge>
)

function checkIsActive(pathname: string, dashboardTab: string, item: NavItem, mainNav = false): boolean {
  if (item.items?.length) {
    return item.items.some((subItem) => checkIsActive(pathname, dashboardTab, subItem))
  }

  if (!item.url) {
    return false
  }

  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const itemTab = getDashboardTabFromNavUrl(item.url)
    if (itemTab !== null) {
      return dashboardTab === itemTab
    }
  }

  const itemPath = item.url.split('?')[0]
  return (
    pathname === itemPath ||
    (mainNav && pathname.split('/')[1] !== '' && pathname.split('/')[1] === itemPath.split('/')[1])
  )
}

function getDashboardTabFromNavUrl(url: string | undefined): string | null {
  if (!url?.startsWith('/dashboard')) {
    return null
  }

  const queryIndex = url.indexOf('?')
  if (queryIndex === -1) {
    return DEFAULT_DASHBOARD_TAB
  }

  const params = new URLSearchParams(url.slice(queryIndex))
  return resolveDashboardTab(params.get('tab'))
}
