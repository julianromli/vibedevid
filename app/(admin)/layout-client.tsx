'use client'

import { useState } from 'react'
import { AppSidebar } from '@/components/admin-panel/app-sidebar'
import SearchProvider from '@/components/search-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import type { User } from '@/types/homepage'

interface Props {
  children: React.ReactNode
  user: User
  isReadOnly: boolean
}

export default function DashboardLayoutClient({ children, user, isReadOnly }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="border-grid flex flex-1 flex-col"
      suppressHydrationWarning
    >
      <SearchProvider value={{ open, setOpen }}>
        <SidebarProvider>
          <AppSidebar
            user={user}
            isReadOnly={isReadOnly}
          />
          <div
            id="content"
            className={cn(
              'flex h-full w-full flex-col',
              'has-[div[data-layout=fixed]]:h-svh',
              'group-data-[scroll-locked=1]/body:h-full',
              'has-[data-layout=fixed]:group-data-[scroll-locked=1]/body:h-svh',
            )}
          >
            {isReadOnly && (
              <div className="border-b bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
                Moderator access is read-only. Admin approval is required for dashboard changes.
              </div>
            )}
            {children}
          </div>
        </SidebarProvider>
      </SearchProvider>
    </div>
  )
}
