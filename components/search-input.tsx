"use client"

import { ComponentProps } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface SearchInputProps extends Omit<ComponentProps<"input">, "onChange"> {
  placeholder?: string
  onChange?: (value: string) => void
  className?: string
}

export function SearchInput({
  placeholder = "Search...",
  onChange,
  className = "",
  ...rest
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        type="search"
        placeholder={placeholder}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="pr-4 pl-10"
        {...rest}
      />
    </div>
  )
}
