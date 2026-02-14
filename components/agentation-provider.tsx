'use client'

import type { ComponentType } from 'react'
import { useEffect, useState } from 'react'

function canUseLocalStorage(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const storage = window.localStorage
    const probeKey = '__agentation_storage_probe__'
    storage.setItem(probeKey, '1')
    storage.removeItem(probeKey)
    return true
  } catch {
    return false
  }
}

export function AgentationProvider() {
  const [Component, setComponent] = useState<ComponentType | null>(null)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || !canUseLocalStorage()) {
      return
    }

    let cancelled = false

    import('agentation')
      .then((mod) => {
        if (!cancelled) {
          setComponent(() => mod.Agentation)
        }
      })
      .catch(() => {
        // Silently skip Agentation in restricted environments.
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!Component) return null
  return <Component />
}
