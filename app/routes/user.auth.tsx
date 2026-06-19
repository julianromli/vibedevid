import { createFileRoute } from '@tanstack/react-router'
import AuthPage from '@/app/user/auth/page'

type AuthMode = 'signin' | 'signup' | 'reset'

function parseAuthMode(value: unknown): AuthMode {
  if (value === 'signup' || value === 'reset') return value
  return 'signin'
}

export const Route = createFileRoute('/user/auth')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirectTo: typeof search.redirectTo === 'string' ? search.redirectTo : undefined,
    success: typeof search.success === 'string' ? search.success : undefined,
    error: typeof search.error === 'string' ? search.error : undefined,
    mode: parseAuthMode(search.mode),
  }),
  component: UserAuthRoute,
})

function UserAuthRoute() {
  return <AuthPage />
}
