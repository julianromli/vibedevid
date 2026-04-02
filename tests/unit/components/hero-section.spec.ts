import { act, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HeroSection } from '@/components/sections/hero-section'

const { messages, translatorRef } = vi.hoisted(() => {
  const baseMessages = {
    announcement: 'Announcement',
    readLatest: 'Read latest',
    subtitle: 'Ship faster with the community.',
    joinCommunity: 'Join community',
    ourShowcase: 'Our showcase',
    titleLine1: 'Build',
    titleLine2: 'Products',
  }

  return {
    messages: { ...baseMessages },
    translatorRef: {
      current: (key: keyof typeof baseMessages) => baseMessages[key],
    },
  }
})

function resetMessages() {
  Object.assign(messages, {
    announcement: 'Announcement',
    readLatest: 'Read latest',
    subtitle: 'Ship faster with the community.',
    joinCommunity: 'Join community',
    ourShowcase: 'Our showcase',
    titleLine1: 'Build',
    titleLine2: 'Products',
  })
  translatorRef.current = (key: keyof typeof messages) => messages[key]
}

vi.mock('next-intl', () => ({
  useTranslations: () => translatorRef.current,
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}))

vi.mock('@/components/ui/animated-gradient-text', () => ({
  AnimatedGradientText: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement('div', { className }, children),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
    React.createElement('button', { type: 'button', ...props }, children),
}))

vi.mock('@/components/ui/logo-marquee', () => ({
  LogoMarquee: () => React.createElement('div', null, 'Logo marquee'),
}))

vi.mock('@/components/ui/progressive-image', () => ({
  ProgressiveImage: (props: React.ImgHTMLAttributes<HTMLImageElement>) => React.createElement('img', props),
}))

vi.mock('@/components/ui/safari-mockup', () => ({
  SafariMockup: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
}))

describe('HeroSection', () => {
  beforeEach(() => {
    resetMessages()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('restarts the title animation when the translated title changes', () => {
    const props = {
      handleJoinWithUs: vi.fn(),
      handleViewShowcase: vi.fn(),
    }

    const { rerender } = render(React.createElement(HeroSection, props))

    act(() => {
      vi.advanceTimersByTime(400)
    })

    Object.assign(messages, {
      titleLine1: 'Build Better',
      titleLine2: 'Products Today',
    })
    translatorRef.current = (key: keyof typeof messages) => messages[key]

    rerender(React.createElement(HeroSection, props))

    expect(screen.getByText('Today')).toHaveClass('opacity-0')

    act(() => {
      vi.advanceTimersByTime(600)
    })

    expect(screen.getByText('Today')).toHaveClass('opacity-100')
  })
})
