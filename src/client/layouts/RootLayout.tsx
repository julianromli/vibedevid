import { Outlet } from 'react-router-dom'
import { AgentationProvider } from '@/components/agentation-provider'
import { ClientThemeProvider } from '@/components/client-theme-provider'
import { Toaster } from '@/components/ui/sonner'

export function RootLayout() {
  return (
    <ClientThemeProvider>
      <AgentationProvider>
        <Outlet />
        <Toaster />
      </AgentationProvider>
    </ClientThemeProvider>
  )
}
