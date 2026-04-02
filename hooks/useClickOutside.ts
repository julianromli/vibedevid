import { type RefObject, useEffect } from 'react'

export function useClickOutside(
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  handler: () => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return

    const handleClickOutside = (event: MouseEvent) => {
      const refsArray = Array.isArray(refs) ? refs : [refs]
      const clickedOutside = refsArray.every((ref) => ref.current && !ref.current.contains(event.target as Node))

      if (clickedOutside) {
        handler()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [refs, handler, enabled])
}
