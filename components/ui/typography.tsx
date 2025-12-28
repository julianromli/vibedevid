import type * as React from 'react'
import { cn } from '@/lib/utils'

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {}

export function H1({ className, ...props }: TypographyProps) {
  return (
    <h1
      className={cn('scroll-m-20 font-bold text-fluid-6xl text-foreground tracking-tight', className)}
      {...props}
    />
  )
}

export function H2({ className, ...props }: TypographyProps) {
  return (
    <h2
      className={cn('scroll-m-20 font-semibold text-fluid-5xl text-foreground tracking-tight first:mt-0', className)}
      {...props}
    />
  )
}

export function H3({ className, ...props }: TypographyProps) {
  return (
    <h3
      className={cn('scroll-m-20 font-semibold text-fluid-4xl text-foreground tracking-tight', className)}
      {...props}
    />
  )
}

export function H4({ className, ...props }: TypographyProps) {
  return (
    <h4
      className={cn('scroll-m-20 font-semibold text-fluid-3xl text-foreground tracking-tight', className)}
      {...props}
    />
  )
}

export function P({ className, ...props }: TypographyProps) {
  return (
    <p
      className={cn(
        'max-w-[65ch] text-fluid-base text-foreground leading-relaxed [&:not(:first-child)]:mt-6',
        className,
      )}
      {...props}
    />
  )
}

export function Lead({ className, ...props }: TypographyProps) {
  return (
    <p
      className={cn('text-fluid-lg text-muted-foreground', className)}
      {...props}
    />
  )
}

export function Large({ className, ...props }: TypographyProps) {
  return (
    <div
      className={cn('font-semibold text-fluid-lg text-foreground', className)}
      {...props}
    />
  )
}

export function Small({ className, ...props }: TypographyProps) {
  return (
    <small
      className={cn('font-medium text-fluid-sm text-foreground leading-none', className)}
      {...props}
    />
  )
}

export function Muted({ className, ...props }: TypographyProps) {
  return (
    <p
      className={cn('text-fluid-sm text-muted-foreground', className)}
      {...props}
    />
  )
}
