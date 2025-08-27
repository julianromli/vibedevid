import * as React from "react"
import { Mail, Lock, User } from "lucide-react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  const renderIcon = () => {
    switch (type) {
      case "email":
        return (
          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground transition-all duration-200" />
        )
      case "password":
        return (
          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground transition-all duration-200" />
        )
      case "text":
        // Check if this is a username field by looking at placeholder or name
        if (props.placeholder?.toLowerCase().includes("username") || props.name === "username") {
          return (
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground transition-all duration-200" />
          )
        }
        return null
      default:
        return null
    }
  }

  const hasIcon =
    type === "email" ||
    type === "password" ||
    (type === "text" && (props.placeholder?.toLowerCase().includes("username") || props.name === "username"))

  if (hasIcon) {
    return (
      <div className="relative">
        {renderIcon()}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border-2 border-border bg-card py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            "pl-12 pr-3", // Added left padding for icon space
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
        "flex h-10 w-full rounded-md border-2 border-border bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
