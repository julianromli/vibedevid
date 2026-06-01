import { useQuery } from '@tanstack/react-query'
import type { User } from '@/types/homepage'

const ADMIN_ROLE = 0

interface SessionResponse {
  user: User | null
  error?: string
}

export function useAdminSession() {
  const query = useQuery({
    queryKey: ['session'],
    queryFn: async (): Promise<SessionResponse> => {
      const res = await fetch('/api/session', { credentials: 'include' })
      if (!res.ok) {
        return { user: null, error: 'Failed to load session' }
      }
      return res.json()
    },
  })

  const user = query.data?.user ?? null
  const isAdmin = user?.role === ADMIN_ROLE

  return {
    user,
    isAdmin,
    isLoading: query.isLoading,
    error: query.error ?? query.data?.error,
  }
}
