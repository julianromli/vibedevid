"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { UserAvatar } from "@/components/ui/user-avatar"
import { AdaptiveLogo } from "@/components/ui/adaptive-logo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowLeft, Menu, X, User, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/actions"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface NavbarProps {
  showBackButton?: boolean
  showNavigation?: boolean
  isLoggedIn?: boolean
  user?: {
    id?: string
    name: string
    email: string
    avatar?: string
    avatar_url?: string
    username?: string
  }
  onSignIn?: () => void
  onSignOut?: () => void
  onProfile?: () => void
  scrollToSection?: (section: string) => void
}

export function Navbar({
  showBackButton = false,
  showNavigation = false,
  isLoggedIn,
  user,
  onSignIn,
  onSignOut,
  onProfile,
  scrollToSection,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    console.log("[v0] Navbar received props:", {
      isLoggedIn,
      user: user
        ? {
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            avatar_url: user.avatar_url,
            username: user.username,
          }
        : null,
    })
  }, [isLoggedIn, user])

  const safeUser = user
    ? {
        ...user,
        avatar: user.avatar_url || user.avatar || "/placeholder.svg",
      }
    : { name: "User", email: "", avatar: "/placeholder.svg" }

  const userIsLoggedIn = Boolean(isLoggedIn && user)

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn()
    } else {
      router.push("/user/auth")
    }
  }

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut()
    } else {
      try {
        // Use client-side sign out first to trigger auth listeners
        const supabase = createClient()
        const { error } = await supabase.auth.signOut()
        
        if (error) {
          console.error("Sign out error:", error)
          toast.error("Gagal keluar. Coba lagi!")
          return
        }
        
        toast.success("Berhasil keluar! 👋 Sampai jumpa lagi!")
        
        // Small delay to let auth listeners update state before redirect
        setTimeout(() => {
          router.push("/")
        }, 100)
      } catch (error) {
        console.error("Unexpected sign out error:", error)
        toast.error("Terjadi kesalahan saat keluar")
      }
    }
  }

  const handleProfile = () => {
    if (onProfile) {
      onProfile()
    } else {
      if (safeUser.username) {
        router.push(`/${safeUser.username}`)
      }
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 relative">
          {/* Left Side - Back Button or Logo */}
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            ) : (
              <AdaptiveLogo />
            )}
          </div>

          {/* Center - Logo (when back button is shown) or Navigation */}
          {showBackButton ? (
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Link href="/" className="flex items-center gap-3">
                <AdaptiveLogo />
              </Link>
            </div>
          ) : (
            showNavigation && (
              <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
                <div className="flex items-baseline space-x-8">
                  <button
                    onClick={() => scrollToSection?.("projects")}
                    className="text-muted-foreground hover:text-foreground transition-all duration-300 text-sm cursor-pointer relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                  >
                    Showcase
                  </button>
                  <button
                    onClick={() => scrollToSection?.("features")}
                    className="text-muted-foreground hover:text-foreground transition-all duration-300 text-sm cursor-pointer relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                  >
                    Features
                  </button>
                  <button
                    onClick={() => scrollToSection?.("reviews")}
                    className="text-muted-foreground hover:text-foreground transition-all duration-300 text-sm cursor-pointer relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                  >
                    Reviews
                  </button>
                  <button
                    onClick={() => scrollToSection?.("faq")}
                    className="text-muted-foreground hover:text-foreground transition-all duration-300 text-sm cursor-pointer relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                  >
                    FAQ
                  </button>
                </div>
              </div>
            )
          )}

          {/* Right Side - Theme Toggle and Auth */}
          <div className="hidden md:block">
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {!userIsLoggedIn ? (
                <Button
                  variant="default"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleSignIn}
                >
                  Sign In
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full transition-all duration-300 hover:shadow-lg hover:bg-accent/50"
                    >
                      <UserAvatar user={safeUser} size="md" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{safeUser.name}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">{safeUser.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleProfile}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          {showNavigation && (
            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          )}

          {/* Mobile Theme Toggle (when no navigation) */}
          {!showNavigation && (
            <div className="md:hidden">
              <ThemeToggle />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {showNavigation && isMenuOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <button
              onClick={() => {
                scrollToSection?.("projects")
                setIsMenuOpen(false)
              }}
              className="block w-full text-left px-3 py-2 text-muted-foreground hover:text-foreground transition-all duration-300 hover:bg-accent/50 rounded-md hover:translate-x-1"
            >
              Showcase
            </button>
            <button
              onClick={() => {
                scrollToSection?.("features")
                setIsMenuOpen(false)
              }}
              className="block w-full text-left px-3 py-2 text-muted-foreground hover:text-foreground transition-all duration-300 hover:bg-accent/50 rounded-md hover:translate-x-1"
            >
              Features
            </button>
            <button
              onClick={() => {
                scrollToSection?.("reviews")
                setIsMenuOpen(false)
              }}
              className="block w-full text-left px-3 py-2 text-muted-foreground hover:text-foreground transition-all duration-300 hover:bg-accent/50 rounded-md hover:translate-x-1"
            >
              Reviews
            </button>
            <button
              onClick={() => {
                scrollToSection?.("faq")
                setIsMenuOpen(false)
              }}
              className="block w-full text-left px-3 py-2 text-muted-foreground hover:text-foreground transition-all duration-300 hover:bg-accent/50 rounded-md hover:translate-x-1"
            >
              FAQ
            </button>
            <div className="px-3 py-2">
              {!userIsLoggedIn ? (
                <Button className="w-full" onClick={handleSignIn}>
                  Sign In
                </Button>
              ) : (
                <div className="flex items-center gap-3 p-2">
                  <UserAvatar user={safeUser} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{safeUser.name}</p>
                    <p className="text-xs text-muted-foreground">{safeUser.email}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
