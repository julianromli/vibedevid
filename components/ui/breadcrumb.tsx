import { Slot } from '@radix-ui/react-slot'
import { ChevronRight, MoreHorizontal } from 'lucide-react'
import type * as React from 'react'
import { cn } from '@/lib/utils'

function Breadcrumb({ ref, ...props }: React.ComponentPropsWithoutRef<'nav'> & { ref?: React.Ref<HTMLElement> }) {
  return (
    <nav
      ref={ref}
      aria-label="breadcrumb"
      {...props}
    />
  )
}

function BreadcrumbList({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<'ol'> & { ref?: React.Ref<HTMLOListElement> }) {
  return (
    <ol
      ref={ref}
      className={cn(
        'text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5',
        className,
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<'li'> & { ref?: React.Ref<HTMLLIElement> }) {
  return (
    <li
      ref={ref}
      className={cn('inline-flex items-center gap-1.5', className)}
      {...props}
    />
  )
}

function BreadcrumbLink({
  ref,
  asChild,
  className,
  ...props
}: React.ComponentPropsWithoutRef<'a'> & { asChild?: boolean; ref?: React.Ref<HTMLAnchorElement> }) {
  const Comp = asChild ? Slot : 'a'

  return (
    <Comp
      ref={ref}
      className={cn('hover:text-foreground transition-colors', className)}
      {...props}
    />
  )
}

function BreadcrumbPage({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<'span'> & { ref?: React.Ref<HTMLSpanElement> }) {
  return (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn('text-foreground font-normal', className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn('[&>svg]:h-3.5 [&>svg]:w-3.5', className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  )
}

function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn('flex h-9 w-9 items-center justify-center', className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
