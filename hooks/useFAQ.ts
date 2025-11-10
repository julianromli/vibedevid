/**
 * FAQ toggle hook
 */

import { useState } from 'react'

export function useFAQ() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index)
  }

  return {
    openFAQ,
    toggleFAQ,
  }
}
