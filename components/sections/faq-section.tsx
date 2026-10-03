/**
 * FAQ Section Component
 * Displays frequently asked questions with an animated accordion (Framer Motion)
 */

'use client'

import { Plus } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface FAQItem {
  question: string
  answer: string
}

interface FAQAccordionItemProps {
  faq: FAQItem
  isOpen: boolean
  onToggle: () => void
  prefersReducedMotion: boolean
}

function FAQAccordionItem({ faq, isOpen, onToggle, prefersReducedMotion }: FAQAccordionItemProps) {
  const contentId = useId()

  return (
    <div
      className={cn(
        'bg-card text-card-foreground rounded-xl border shadow-sm',
        !prefersReducedMotion && 'transition-shadow duration-300',
        isOpen && 'shadow-md',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className={cn(
          'flex w-full cursor-pointer items-center justify-between p-6 text-left font-semibold',
          !prefersReducedMotion && 'transition-colors duration-200',
        )}
      >
        <span className="pr-4">{faq.question}</span>
        <motion.span
          className="text-muted-foreground ml-4 flex-shrink-0"
          aria-hidden="true"
          animate={prefersReducedMotion ? undefined : { rotate: isOpen ? 135 : 0 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
        >
          <Plus className="h-5 w-5" />
        </motion.span>
      </button>

      <div
        id={contentId}
        className={cn('grid', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
      >
        <div className="overflow-hidden">
          <p className="text-muted-foreground px-6 pb-6 text-left leading-relaxed">{faq.answer}</p>
        </div>
      </div>
    </div>
  )
}

export function FAQSection() {
  const { t } = useTranslation('faq')
  const prefersReducedMotion = useReducedMotion() ?? false
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  const faqItems = t('items', { returnObjects: true }) as Record<string, FAQItem>
  const faqArray = Object.values(faqItems).filter((item): item is FAQItem =>
    Boolean(item && typeof item.question === 'string' && item.answer),
  )

  const toggleItem = (question: string) => {
    setOpenItems((prev) => ({ ...prev, [question]: !prev[question] }))
  }

  return (
    <section
      id="faq"
      className="py-20"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">{t('title')}</h2>
          <p className="text-muted-foreground text-xl">{t('subtitle')}</p>
        </div>

        <div className="space-y-4">
          {faqArray.map((faq) => (
            <FAQAccordionItem
              key={faq.question}
              faq={faq}
              isOpen={Boolean(openItems[faq.question])}
              onToggle={() => toggleItem(faq.question)}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
