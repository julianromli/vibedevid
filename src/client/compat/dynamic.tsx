import { lazy, type ComponentType } from 'react'

type DynamicOptions = {
  loading?: () => React.ReactNode
  ssr?: boolean
}

export default function dynamic<P = Record<string, never>>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  _options?: DynamicOptions,
) {
  return lazy(loader)
}
