"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDark(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleTheme = () => {
    setIsAnimating(true)

    setTimeout(() => {
      const newTheme = !isDark
      setIsDark(newTheme)

      if (newTheme) {
        document.documentElement.classList.add("dark")
        localStorage.setItem("theme", "dark")
      } else {
        document.documentElement.classList.remove("dark")
        localStorage.setItem("theme", "light")
      }

      setIsAnimating(false)
    }, 150)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={`relative w-10 h-10 rounded-full bg-muted/50 hover:bg-muted border border-border/50 backdrop-blur-sm transition-all duration-300 ${
        isAnimating ? "scale-95" : "hover:scale-105"
      }`}
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon */}
        <Sun
          className={`absolute inset-0 h-5 w-5 transition-all duration-500 ${
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        />

        {/* Moon Icon */}
        <Moon
          className={`absolute inset-0 h-5 w-5 transition-all duration-500 ${
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          }`}
        />
      </div>

      {/* Glow effect */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-300 ${
          isAnimating ? "bg-primary/20 shadow-lg shadow-primary/25" : ""
        }`}
      />
    </Button>
  )
}
