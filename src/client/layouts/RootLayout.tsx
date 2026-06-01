import { Outlet } from 'react-router-dom'
import { AgentationProvider } from '@/components/agentation-provider'
import { ClientThemeProvider } from '@/components/client-theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { SeoHead } from '@/src/client/seo/SeoHead'

export function RootLayout() {
  return (
    <ClientThemeProvider>
      <AgentationProvider>
        <SeoHead />
        <Outlet />
        <Toaster />
      </AgentationProvider>
    </ClientThemeProvider>
  )
}
