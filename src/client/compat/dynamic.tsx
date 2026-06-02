import { type ComponentType, createElement, lazy, Suspense } from 'react'

type DynamicOptions = {
  loading?: () => React.ReactNode
  ssr?: boolean
}

function normalizeDynamicImport<P>(loaded: { default: ComponentType<P> } | ComponentType<P>): {
  default: ComponentType<P>
} {
  if (loaded && typeof loaded === 'object' && 'default' in loaded && loaded.default) {
    return loaded as { default: ComponentType<P> }
  }

  return { default: loaded as ComponentType<P> }
}

export default function dynamic<P extends object = Record<string, never>>(
  loader: () => Promise<{ default: ComponentType<P> } | ComponentType<P>>,
  options?: DynamicOptions,
): ComponentType<P> {
  const LazyComponent = lazy(async () => normalizeDynamicImport(await loader()))

  function DynamicComponent(props: P) {
    const fallback = options?.loading?.() ?? null

    return <Suspense fallback={fallback}>{createElement(LazyComponent, props)}</Suspense>
  }

  return DynamicComponent as ComponentType<P>
}
