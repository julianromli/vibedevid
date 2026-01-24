'use client'

import { useEffect, useState } from 'react'

export function AgentationProvider() {
  const [Component, setComponent] = useState<any>(null)

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('agentation').then((mod) => {
        setComponent(() => mod.Agentation)
      })
    }
  }, [])

  if (!Component) return null
  return <Component />
}
