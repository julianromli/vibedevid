'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useInView } from 'motion/react'
import {
  type AIModel,
  type LeaderboardResponse,
  FALLBACK_DATA,
  PROVIDER_COLORS,
} from '@/lib/ai-leaderboard-data'
import { cn } from '@/lib/utils'

function useCountAnimation(
  end: number,
  duration: number = 1000,
  shouldStart: boolean = false
) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!shouldStart) return

    let startTime: number | null = null
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(easeOut * end))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration, shouldStart])

  return count
}

function LeaderboardBar({
  model,
  maxScore,
  index,
  isInView,
}: {
  model: AIModel
  maxScore: number
  index: number
  isInView: boolean
}) {
  const barWidth = (model.score / maxScore) * 100
  const color = PROVIDER_COLORS[model.providerSlug] || '#6B7280'
  const animatedScore = useCountAnimation(model.score, 800, isInView)
  const isLeader = model.rank === 1

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="group relative"
    >
      <motion.div
        whileHover={{ scale: 1.015, x: 4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cn(
          'relative flex items-center gap-3 rounded-xl border p-3 transition-all duration-300 md:gap-4 md:p-4',
          'bg-card/50 hover:bg-card border-border/50 hover:border-border',
          isLeader && 'border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10'
        )}
        style={{
          boxShadow: `0 0 0 0 ${color}00`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 4px 20px -4px ${color}40`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = `0 0 0 0 ${color}00`
        }}
      >
        {/* Rank Badge */}
        <div
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold md:size-10 md:text-base',
            isLeader
              ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {model.rank}
        </div>

        {/* Provider Logo */}
        <div className="relative size-8 shrink-0 overflow-hidden rounded-lg bg-white p-1.5 dark:bg-zinc-800 md:size-10 md:p-2">
          <Image
            src={`/logos/ai-providers/${model.providerSlug}.svg`}
            alt={model.provider}
            fill
            className="object-contain p-1"
            onError={(e) => {
              const target = e.currentTarget
              if (!target.dataset.fallbackApplied) {
                target.dataset.fallbackApplied = 'true'
                target.src = '/logos/ai-providers/default.svg'
              }
            }}
          />
        </div>

        {/* Model Info & Bar */}
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-baseline gap-2 md:mb-2">
            <span className="truncate text-sm font-semibold text-foreground md:text-base">
              {model.name}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {model.provider}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-6 w-full overflow-hidden rounded-full bg-muted/50 md:h-7">
            <motion.div
              initial={{ width: 0 }}
              animate={isInView ? { width: `${barWidth}%` } : { width: 0 }}
              transition={{
                duration: 0.8,
                delay: index * 0.08 + 0.2,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${color}CC, ${color})`,
              }}
            />
            {/* Shine effect */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={isInView ? { x: '200%' } : { x: '-100%' }}
              transition={{
                duration: 1.2,
                delay: index * 0.08 + 0.5,
                ease: 'easeInOut',
              }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          </div>
        </div>

        {/* Score */}
        <div className="flex shrink-0 flex-col items-end">
          <span
            className="font-mono text-xl font-bold tabular-nums md:text-2xl"
            style={{ color }}
          >
            {animatedScore}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            score
          </span>
        </div>

        {/* Hover Tooltip */}
        <div className="pointer-events-none absolute -top-12 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-popover px-3 py-1.5 text-xs text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          <div className="font-medium">{model.name}</div>
          <div className="text-muted-foreground">
            LiveCodeBench + SciCode + Terminal-Bench
          </div>
          <div className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-popover" />
        </div>
      </motion.div>
    </motion.div>
  )
}

export function AILeaderboardSection() {
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  useEffect(() => {
    const controller = new AbortController()

    async function fetchData() {
      try {
        const response = await fetch('/api/ai-leaderboard', {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Failed to fetch')
        const result = await response.json()
        setData(result)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        console.error('Error fetching leaderboard:', err)
        setData({
          models: FALLBACK_DATA,
          lastUpdated: new Date().toISOString(),
          source: 'https://artificialanalysis.ai',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    return () => controller.abort()
  }, [])

  const models = data?.models || FALLBACK_DATA
  const maxScore = Math.max(...models.map((m) => m.score))

  return (
    <section
      ref={sectionRef}
      className="bg-gradient-to-b from-transparent via-muted/30 to-transparent py-16 md:py-24 lg:py-32"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center md:mb-14"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Live Rankings
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Benchmark AI Coding Model 2025
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
            Ranking model AI untuk coding berdasarkan{' '}
            <span className="font-medium text-foreground">LiveCodeBench</span>,{' '}
            <span className="font-medium text-foreground">SciCode</span>, dan{' '}
            <span className="font-medium text-foreground">
              Terminal-Bench Hard
            </span>
          </p>
        </motion.div>

        {/* Leaderboard */}
        <div className="space-y-2 md:space-y-3">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-4 rounded-xl border border-border/50 bg-card/50 p-4"
              >
                <div className="size-10 rounded-lg bg-muted" />
                <div className="size-10 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-muted" />
                  <div className="h-7 w-full rounded-full bg-muted" />
                </div>
                <div className="h-8 w-12 rounded bg-muted" />
              </div>
            ))
          ) : (
            models.map((model, index) => (
              <LeaderboardBar
                key={model.name}
                model={model}
                maxScore={maxScore}
                index={index}
                isInView={isInView}
              />
            ))
          )}
        </div>

        {/* Attribution Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border border-border/50 bg-card/30 p-4 sm:flex-row md:mt-10"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <svg
                className="size-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">Data from Artificial Analysis</p>
              <p className="text-xs text-muted-foreground">
                Independent AI model benchmarking
              </p>
            </div>
          </div>
          <Link
            href="https://artificialanalysis.ai/?intelligence=coding-index"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            View Full Rankings
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
