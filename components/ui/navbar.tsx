'use client'

import { ArrowLeft, FileText, LogOut, PenSquare, User } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { MenuToggleIcon } from '@/components/menu-toggle-icon'
import { AdaptiveLogo } from '@/components/ui/adaptive-logo'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { UserAvatar } from '@/components/ui/user-avatar'
import { UserDisplayName } from '@/components/ui/user-display-name'
import { useScroll } from '@/hooks/use-scroll'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const springTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
}

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
    role?: number | null
  }
  onSignIn?: () => void
  onSignOut?: () => void
  onProfile?: () => void
}

type NavItem = { label: string; href: string; type: 'link' } | { label: string; action: () => void; type: 'button' }

interface DesktopNavItemProps {
  item: NavItem
}

function DesktopNavItem({ item }: DesktopNavItemProps) {
  if (item.type === 'link') {
    return (
      <Link
        href={item.href}
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-muted-foreground hover:text-foreground')}
      >
        {item.label}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={item.action}
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'sm' }),
        'cursor-pointer text-muted-foreground hover:text-foreground',
      )}
    >
      {item.label}
    </button>
  )
}

interface MobileNavItemProps {
  item: NavItem
  closeMenu: () => void
}

function MobileNavItem({ item, closeMenu }: MobileNavItemProps) {
  if (item.type === 'link') {
    return (
      <Link
        href={item.href}
        onClick={closeMenu}
        className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'h-12 justify-start text-lg')}
      >
        {item.label}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        item.action()
        closeMenu()
      }}
      className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'h-12 justify-start text-lg')}
    >
      {item.label}
    </button>
  )
}

export function Navbar({
  showBackButton = false,
  showNavigation = false,
  isLoggedIn,
  user,
  onSignIn,
  onSignOut,
  onProfile,
}: NavbarProps) {
  const [open, setOpen] = useState(false)
  const scrolled = useScroll(10)
  const router = useRouter()
  const t = useTranslations()

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

  const userIsLoggedIn = Boolean(isLoggedIn)

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
          toast.error(t('toast.signOutError'))
          return
        }
        toast.success(t('toast.signOutSuccess'))
        setTimeout(() => {
          router.refresh()
          router.push('/')
        }, 100)
      } catch (_error) {
        toast.error(t('toast.generalError'))
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

  const navItems: NavItem[] = [
    { label: t('navbar.home'), href: '/', type: 'link' },
    { label: t('navbar.projects'), href: '/project/list', type: 'link' },
    { label: t('navbar.blogs'), href: '/blog', type: 'link' },
    { label: t('navbar.events'), href: '/event/list', type: 'link' },
  ]

  return (
    <header className="fixed top-0 z-50 w-full">
      <motion.div
        className={cn(
          'mx-auto w-full border-b',
          scrolled
            ? 'border-border bg-background/80 backdrop-blur-md md:max-w-7xl md:rounded-2xl md:border-border/50 md:bg-background/80 md:shadow-md md:backdrop-blur-xl'
            : 'border-transparent bg-transparent',
        )}
        initial={false}
        animate={{
          marginTop: scrolled ? 16 : 0,
          borderRadius: scrolled ? 16 : 0,
        }}
        transition={springTransition}
        style={{
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <nav className="relative flex h-16 items-center justify-between px-4 md:px-6">
          {/* Left Side - Logo */}
          <motion.div
            className="flex items-center justify-start gap-3"
            initial={false}
            animate={{
              scale: scrolled ? 0.92 : 1,
              x: scrolled ? -2 : 0,
            }}
            transition={springTransition}
          >
            {showBackButton ? (
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:shadow-none"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link
                href="/"
                className="flex items-center gap-2"
              >
                <AdaptiveLogo className="h-7 w-auto md:h-8" />
              </Link>
            )}
          </motion.div>

          {/* Desktop Navigation - Center */}
          {showNavigation && (
            <motion.div
              className="absolute left-1/2 hidden -translate-x-1/2 items-center justify-center gap-1 md:flex lg:gap-2"
              initial={false}
              animate={{
                y: scrolled ? 0 : 0,
                opacity: 1,
              }}
              transition={springTransition}
            >
              {navItems.map((item) => (
                <DesktopNavItem
                  key={item.type === 'link' ? item.href : `nav-${item.label}`}
                  item={item}
                />
              ))}
            </motion.div>
          )}

          {/* Right Side */}
          <motion.div
            className="hidden items-center justify-end gap-2 md:flex"
            initial={false}
            animate={{
              scale: scrolled ? 0.95 : 1,
              x: scrolled ? 2 : 0,
            }}
            transition={springTransition}
          >
            <LanguageSwitcher />
            <ThemeToggle />
            {!userIsLoggedIn ? (
              <Button
                onClick={handleSignIn}
                size="sm"
              >
                {t('common.signIn')}
              </Button>
            ) : (
              <>
                {/* Write Button - prominent CTA for logged-in users */}
                <Link href="/blog/editor">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                  >
                    <PenSquare className="h-4 w-4" />
                    {t('common.write')}
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                    >
                      <UserAvatar
                        user={safeUser}
                        size="md"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56"
                    align="end"
                  >
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <UserDisplayName
                          name={safeUser.name}
                          role={safeUser.role}
                          className="font-medium"
                        />
                        <p className="w-[200px] truncate text-muted-foreground text-sm">{safeUser.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleProfile}>
                      <User className="mr-2 h-4 w-4" />
                      <span>{t('common.profile')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard/posts"
                        className="flex items-center"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        <span>{t('common.myPosts')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t('common.signOut')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </motion.div>

          {/* Mobile Right Controls */}
          <div className="flex items-center justify-end gap-3 md:hidden">
            {/* Mobile Sign In / User Menu - always visible regardless of showNavigation */}
            {!userIsLoggedIn ? (
              <Button
                onClick={handleSignIn}
                size="sm"
                className="h-11 min-w-[44px]"
              >
                {t('common.signIn')}
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-full"
                  >
                    <UserAvatar
                      user={safeUser}
                      size="md"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56"
                  align="end"
                >
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <UserDisplayName
                        name={safeUser.name}
                        role={safeUser.role}
                        className="font-medium"
                      />
                      <p className="w-[200px] truncate text-muted-foreground text-sm">{safeUser.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/blog/editor"
                      className="flex items-center"
                    >
                      <PenSquare className="mr-2 h-4 w-4" />
                      <span>{t('common.write')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleProfile}>
                    <User className="mr-2 h-4 w-4" />
                    <span>{t('common.profile')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/posts"
                      className="flex items-center"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      <span>{t('common.myPosts')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('common.signOut')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {/* Menu Toggle - only show with navigation */}
            {showNavigation && (
              <Button
                className="relative z-50 h-11 w-11"
                onClick={() => setOpen(!open)}
                size="icon"
                variant="ghost"
              >
                <MenuToggleIcon
                  className="size-6"
                  duration={300}
                  open={open}
                />
              </Button>
            )}
          </div>
        </nav>
      </motion.div>

      {/* Mobile Menu Portal */}
      {showNavigation && (
        <MobileMenu open={open}>
          <div className="flex h-full flex-col justify-between p-6 pt-24 pb-10">
            {/* Navigation Links */}
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <MobileNavItem
                  key={item.type === 'link' ? item.href : `nav-${item.label}`}
                  item={item}
                  closeMenu={() => setOpen(false)}
                />
              ))}
            </div>

            {/* Settings Section */}
            <div className="flex flex-col gap-3 border-t pt-4">
              <div className="flex items-center justify-between px-4">
                <span className="text-sm font-medium text-muted-foreground">{t('settings.language')}</span>
                <LanguageSwitcher />
              </div>
              <div className="flex items-center justify-between px-4">
                <span className="text-sm font-medium text-muted-foreground">{t('settings.theme')}</span>
                <ThemeToggle />
              </div>
            </div>

            {/* Auth Section */}
            <div className="flex flex-col gap-4">
              {!userIsLoggedIn ? (
                <Button
                  onClick={() => {
                    handleSignIn()
                    setOpen(false)
                  }}
                  size="lg"
                  className="w-full"
                >
                  {t('common.signIn')}
                </Button>
              ) : (
                <div className="flex flex-col gap-4 border-t pt-6">
                  {/* Write Button for mobile */}
                  <Link
                    href="/blog/editor"
                    onClick={() => setOpen(false)}
                  >
                    <Button
                      className="w-full gap-2"
                      size="lg"
                    >
                      <PenSquare className="h-4 w-4" />
                      {t('common.writePost')}
                    </Button>
                  </Link>

                  <div className="flex items-center gap-3">
                    <UserAvatar
                      user={safeUser}
                      size="md"
                    />
                    <div>
                      <UserDisplayName
                        name={safeUser.name}
                        role={safeUser.role}
                        className="font-medium"
                      />
                      <p className="text-muted-foreground text-sm">{safeUser.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        handleProfile()
                        setOpen(false)
                      }}
                    >
                      <User className="mr-2 h-4 w-4" /> {t('common.profile')}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link
                        href="/dashboard/posts"
                        onClick={() => setOpen(false)}
                      >
                        <FileText className="mr-2 h-4 w-4" /> {t('common.myPosts')}
                      </Link>
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      handleSignOut()
                      setOpen(false)
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> {t('common.signOut')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </MobileMenu>
      )}
    </header>
  )
}

type MobileMenuProps = {
  children: React.ReactNode
  className?: string
  open: boolean
}

function MobileMenu({ open, children, className }: MobileMenuProps) {
  const menuTransition = {
    duration: 0.5,
    ease: [0.16, 1, 0.3, 1] as const,
  }

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn(
            'fixed inset-0 z-40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80',
            className,
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={menuTransition}
        >
          <motion.div
            className="h-full"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={menuTransition}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(content, document.body)
}
