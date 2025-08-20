"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

interface NavbarProps {
  showBackButton?: boolean
  showNavigation?: boolean
  isLoggedIn?: boolean
  user?: {
    name: string
    email: string
    avatar: string
  }
  onSignIn?: () => void
  onSignOut?: () => void
  onProfile?: () => void
  scrollToSection?: (section: string) => void
}

export function Navbar({
  showBackButton = false,
  showNavigation = false,
  isLoggedIn = false,
  user = { name: "John Doe", email: "john@example.com", avatar: "https://github.com/shadcn.png" },
  onSignIn,
  onSignOut,
  onProfile,
  scrollToSection,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn()
    } else {
      router.push("/user/auth")
    }
  }

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut()
    }
  }

  const handleProfile = () => {
    if (onProfile) {
      onProfile()
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
              <>
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/trae-color-glPzZeyKiOpfe7lJ0rYz78T4WDdPS9.svg"
                  alt="Trae Logo"
                  className="w-8 h-8"
                />
                <div className="text-xl font-semibold text-foreground font-mono tracking-tight">TRAE Community ID</div>
              </>
            )}
          </div>

          {/* Center - Logo (when back button is shown) or Navigation */}
          {showBackButton ? (
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Link href="/" className="flex items-center gap-3">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/trae-color-glPzZeyKiOpfe7lJ0rYz78T4WDdPS9.svg"
                  alt="Trae Community ID Logo"
                  className="w-8 h-8"
                />
                <span className="text-xl font-bold text-foreground font-mono tracking-tight">TRAE Community ID</span>
              </Link>
            </div>
          ) : (
            showNavigation && (
              <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
                <div className="flex items-baseline space-x-8">
                  <button
                    onClick={() => scrollToSection?.("projects")}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm cursor-pointer"
                  >
                    Showcase
                  </button>
                  <button
                    onClick={() => scrollToSection?.("features")}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm cursor-pointer"
                  >
                    Features
                  </button>
                  <button
                    onClick={() => scrollToSection?.("reviews")}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm cursor-pointer"
                  >
                    Reviews
                  </button>
                  <button
                    onClick={() => scrollToSection?.("faq")}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm cursor-pointer"
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
              {!isLoggedIn ? (
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
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.name}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
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
              className="block w-full text-left px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              Showcase
            </button>
            <button
              onClick={() => {
                scrollToSection?.("features")
                setIsMenuOpen(false)
              }}
              className="block w-full text-left px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              Features
            </button>
            <button
              onClick={() => {
                scrollToSection?.("reviews")
                setIsMenuOpen(false)
              }}
              className="block w-full text-left px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              Reviews
            </button>
            <button
              onClick={() => {
                scrollToSection?.("faq")
                setIsMenuOpen(false)
              }}
              className="block w-full text-left px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              FAQ
            </button>
            <div className="px-3 py-2">
              {!isLoggedIn ? (
                <Button className="w-full" onClick={handleSignIn}>
                  Sign In
                </Button>
              ) : (
                <div className="flex items-center gap-3 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
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
