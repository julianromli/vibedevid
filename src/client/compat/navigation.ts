import { useCallback } from 'react'
import {
  useLocation,
  useNavigate,
  useParams as useRouterParams,
  useSearchParams as useRouterSearchParams,
} from 'react-router-dom'

export function useRouter() {
  const navigate = useNavigate()
  return {
    push: (url: string) => navigate(url),
    replace: (url: string) => navigate(url, { replace: true }),
    back: () => navigate(-1),
    refresh: () => navigate(0),
    prefetch: async (_url: string) => {},
  }
}

export function usePathname() {
  return useLocation().pathname
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>() {
  return useRouterParams() as T
}

export function useSearchParams() {
  const [params, setParams] = useRouterSearchParams()
  const readOnly = {
    get: (key: string) => params.get(key),
    getAll: (key: string) => params.getAll(key),
    has: (key: string) => params.has(key),
    toString: () => params.toString(),
    entries: () => params.entries(),
    keys: () => params.keys(),
    values: () => params.values(),
    forEach: (fn: (value: string, key: string) => void) => params.forEach(fn),
  }
  return [readOnly, setParams] as const
}

export function useSelectedLayoutSegment() {
  const parts = usePathname().split('/').filter(Boolean)
  return parts[parts.length - 1] ?? null
}

export function redirect(url: string): never {
  if (typeof window !== 'undefined') {
    window.location.href = url
  }
  throw new Error('redirect')
}

export { useCallback }

export function notFound(): never {
  throw new Response('Not Found', { status: 404 })
}
