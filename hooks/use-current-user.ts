import { useRouteContext } from '@tanstack/react-router'
import type { User } from '@/types/homepage'

/**
 * Read the authenticated user from the root route context.
 *
 * The root route's `beforeLoad` resolves the current user server-side
 * (see app/routes/__root.tsx) so every route and component can read it
 * without an extra client fetch.
 */
export function useCurrentUser(): User | null {
  const context = useRouteContext({ from: '__root__' }) as { currentUser?: User | null }
  return context.currentUser ?? null
}
