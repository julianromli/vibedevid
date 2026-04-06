import { type RefObject, useEffect } from 'react'

export function useClickOutside(
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  handler: () => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return

    const refsArray = Array.isArray(refs) ? refs : [refs]

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target

      if (!(target instanceof Node)) {
        return
      }

      const clickedInside = refsArray.some((ref) => ref.current?.contains(target))

      if (!clickedInside) {
        handler()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [refs, handler, enabled])
}
