'use client'

import { useState, useEffect } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { UserAvatar } from '@/components/ui/user-avatar'
import { AdaptiveLogo } from '@/components/ui/adaptive-logo'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowLeft, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useScroll } from '@/hooks/use-scroll'
import { MenuToggleIcon } from '@/components/menu-toggle-icon'
import { cn } from '@/lib/utils'
import { createPortal } from 'react-dom'

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
  const [open, setOpen] = useState(false)
  const scrolled = useScroll(10)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const safeUser = user
    ? {
        ...user,
        avatar: user.avatar_url || user.avatar || '/placeholder.svg',
      }
    : { name: 'User', email: '', avatar: '/placeholder.svg' }

  const userIsLoggedIn = Boolean(isLoggedIn && user)

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn()
    } else {
      router.push('/user/auth')
    }
  }

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut()
    } else {
      try {
        const supabase = createClient()
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error('Sign out error:', error)
          toast.error('Gagal keluar. Coba lagi!')
          return
        }
        toast.success('Berhasil keluar! 👋 Sampai jumpa lagi!')
        setTimeout(() => {
          router.push('/')
        }, 100)
      } catch (error) {
        console.error('Unexpected sign out error:', error)
        toast.error('Terjadi kesalahan saat keluar')
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

  const navItems = [
    { label: 'Projects', href: '/project/list', type: 'link' },
    { label: 'Leaderboard', href: '/ai/ranking', type: 'link' },
    { label: 'Showcase', action: () => scrollToSection?.('projects'), type: 'button' },
    { label: 'Features', action: () => scrollToSection?.('features'), type: 'button' },
    { label: 'Reviews', action: () => scrollToSection?.('reviews'), type: 'button' },
    { label: 'FAQ', action: () => scrollToSection?.('faq'), type: 'button' },
  ]

  return (
    <header
      className={cn(
        'fixed top-0 z-50 w-full transition-all duration-300 ease-in-out',
        // If scrolled, we want to center it and add margins, otherwise full width
        // Using a container div inside to handle the width/style might be better if we want the "header" tag to be the wrapper
      )}
    >
      <div className={cn(
         "mx-auto w-full transition-all duration-300 ease-in-out border-b border-transparent",
         scrolled 
          ? "md:max-w-7xl md:top-4 md:mt-4 md:rounded-2xl md:border-border/50 md:bg-background/80 md:backdrop-blur-xl md:shadow-md bg-background/80 backdrop-blur-md border-border" 
          : "bg-transparent"
      )}>
        <nav
            className={cn(
                "flex h-16 items-center justify-between px-4 md:px-6"
            )}
        >
            {/* Left Side */}
            <div className="flex items-center gap-3">
                {showBackButton ? (
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="hover:shadow-none">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                ) : (
                    <Link href="/" className="flex items-center gap-2">
                        <AdaptiveLogo />
                    </Link>
                )}
            </div>

            {/* Desktop Navigation */}
            {showNavigation && (
                <div className="hidden items-center gap-1 md:flex lg:gap-2">
                    {navItems.map((item, i) => (
                        item.type === 'link' ? (
                            <Link
                                key={i}
                                href={item.href!}
                                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground hover:text-foreground")}
                            >
                                {item.label}
                            </Link>
                        ) : (
                             <button
                                key={i}
                                onClick={item.action}
                                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground hover:text-foreground cursor-pointer")}
                             >
                                {item.label}
                             </button>
                        )
                    ))}
                </div>
            )}

            {/* Right Side */}
            <div className="hidden items-center gap-2 md:flex">
                 <ThemeToggle />
                 {!userIsLoggedIn ? (
                    <Button onClick={handleSignIn} size="sm">Sign In</Button>
                 ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full h-9 w-9"
                        >
                          <UserAvatar user={safeUser} size="md" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end">
                        <div className="flex items-center justify-start gap-2 p-2">
                            <div className="flex flex-col space-y-1 leading-none">
                                <p className="font-medium">{safeUser.name}</p>
                                <p className="text-muted-foreground w-[200px] truncate text-sm">
                                    {safeUser.email}
                                </p>
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

            {/* Mobile Menu Toggle */}
            <div className="flex items-center gap-2 md:hidden">
                <ThemeToggle />
                {showNavigation && (
                    <Button
                        className="z-50 relative"
                        onClick={() => setOpen(!open)}
                        size="icon"
                        variant="ghost"
                    >
                        <MenuToggleIcon className="size-6" duration={300} open={open} />
                    </Button>
                )}
            </div>
        </nav>
      </div>

      {/* Mobile Menu Portal */}
      {showNavigation && (
        <MobileMenu open={open}>
            <div className="flex flex-col justify-between h-full p-6 pt-24 pb-10">
                <div className="flex flex-col gap-2">
                    {navItems.map((item, i) => (
                        item.type === 'link' ? (
                            <Link
                                key={i}
                                href={item.href!}
                                onClick={() => setOpen(false)}
                                className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "justify-start text-lg h-12")}
                            >
                                {item.label}
                            </Link>
                        ) : (
                             <button
                                key={i}
                                onClick={() => {
                                    item.action?.()
                                    setOpen(false)
                                }}
                                className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "justify-start text-lg h-12")}
                             >
                                {item.label}
                             </button>
                        )
                    ))}
                </div>
                
                <div className="flex flex-col gap-4">
                    {!userIsLoggedIn ? (
                         <Button onClick={() => {
                             handleSignIn()
                             setOpen(false)
                         }} size="lg" className="w-full">Sign In</Button>
                    ) : (
                        <div className="flex flex-col gap-4 border-t pt-6">
                            <div className="flex items-center gap-3">
                                <UserAvatar user={safeUser} size="md" />
                                <div>
                                    <p className="font-medium">{safeUser.name}</p>
                                    <p className="text-sm text-muted-foreground">{safeUser.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" className="w-full justify-start" onClick={() => {
                                    handleProfile()
                                    setOpen(false)
                                }}>
                                    <User className="mr-2 h-4 w-4" /> Profile
                                </Button>
                                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                                    handleSignOut()
                                    setOpen(false)
                                }}>
                                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MobileMenu>
      )}
    </header>
  )
}

type MobileMenuProps = React.ComponentProps<'div'> & {
  open: boolean
}

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
  if (!open || typeof window === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 animate-in fade-in duration-300',
        className
      )}
      {...props}
    >
        {children}
    </div>,
    document.body
  )
}
