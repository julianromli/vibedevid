import * as React from 'react'

import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

function Input({ ref, className, type, ...props }: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
  return (
    <input
      type={type}
      className={cn(
        'border-border bg-card ring-offset-background file:text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary flex h-10 w-full rounded-md border-2 px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
}

Input.displayName = 'Input'

function InputWithIcon({
  ref,
  className,
  type,
  icon,
  ...props
}: InputProps & {
  ref?: React.Ref<HTMLInputElement>
  icon: React.ReactNode
}) {
  return (
    <div className="relative">
      {icon}
      <input
        type={type}
        className={cn(
          'border-border bg-card ring-offset-background file:text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary flex h-10 w-full rounded-md border-2 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          'pr-3 pl-12',
          className,
        )}
        ref={ref}
        {...props}
      />
    </div>
  )
}

InputWithIcon.displayName = 'InputWithIcon'

export { Input, InputWithIcon }
