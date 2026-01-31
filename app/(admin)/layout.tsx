'use client'

import { useState } from 'react'
import { AppSidebar } from '@/components/admin-panel/app-sidebar'
import SearchProvider from '@/components/search-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface Props {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-grid flex flex-1 flex-col">
      <SearchProvider value={{ open, setOpen }}>
        <SidebarProvider>
          <AppSidebar />
          <div
            id="content"
            className={cn(
              'flex h-full w-full flex-col',
              'has-[div[data-layout=fixed]]:h-svh',
              'group-data-[scroll-locked=1]/body:h-full',
              'has-[data-layout=fixed]:group-data-[scroll-locked=1]/body:h-svh',
            )}
          >
            {children}
          </div>
        </SidebarProvider>
      </SearchProvider>
    </div>
  )
}
