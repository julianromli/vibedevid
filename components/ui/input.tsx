import * as React from 'react'
import { Mail, Lock, User } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const renderIcon = () => {
      switch (type) {
        case 'email':
          return (
            <Mail className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform transition-all duration-200" />
          )
        case 'password':
          return (
            <Lock className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform transition-all duration-200" />
          )
        case 'text':
          // Check if this is a username field by looking at placeholder or name
          if (
            props.placeholder?.toLowerCase().includes('username') ||
            props.name === 'username'
          ) {
            return (
              <User className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform transition-all duration-200" />
            )
          }
          return null
        default:
          return null
      }
    }

    const hasIcon =
      type === 'email' ||
      type === 'password' ||
      (type === 'text' &&
        (props.placeholder?.toLowerCase().includes('username') ||
          props.name === 'username'))

    if (hasIcon) {
      return (
        <div className="relative">
          {renderIcon()}
          <input
            type={type}
            className={cn(
              'border-border bg-card ring-offset-background file:text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary flex h-10 w-full rounded-md border-2 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              'pr-3 pl-12', // Added left padding for icon space
              className,
            )}
            ref={ref}
            {...props}
          />
        </div>
      )
    }

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
  },
)
Input.displayName = 'Input'

export { Input }
