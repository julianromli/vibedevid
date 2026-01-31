"use client"

import { useRouter } from "next/navigation"
import { Button, type ButtonProps } from "./ui/button"

export function BackButton({
  variant = "outline",
  children = "Go Back",
  ...props
}: ButtonProps) {
  const router = useRouter()
  return (
    <Button variant={variant} onClick={() => router.back()} {...props}>
      {children}
    </Button>
  )
}
