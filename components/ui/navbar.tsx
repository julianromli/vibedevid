'use client'

import { ArrowLeft, FileText, LogIn, LogOut, Upload, User } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from '@tanstack/react-router'
import { useRouter } from '@/lib/navigation'
import { useTranslation } from 'react-i18next'
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

interface UserInfo {
  id?: string
  name: string
  email: string
  avatar?: string
  avatar_url?: string
  username?: string
  role?: number | null
}

type NavItem = { label: string; href: string; type: 'link' } | { label: string; action: () => void; type: 'button' }

function MobileMenuPortal({ open, children, className }: { children: React.ReactNode; className?: string; open: boolean }) {
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

function NavItem({ item, closeMenu }: { item: NavItem; closeMenu?: () => void }) {
  if (item.type === 'link') {
    return (
      <Link
        to={item.href}
        onClick={closeMenu}
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-muted-foreground hover:text-foreground')}
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
        closeMenu?.()
      }}
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'sm' }),
        'cursor-pointer text-muted-foreground hover:text-foreground',
      )}
    >
      {item.label}
    </button>
  )
}

function MobileNavItem({ item, closeMenu }: { item: NavItem; closeMenu: () => void }) {
  if (item.type === 'link') {
    return (
      <Link
        to={item.href}
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

function UserMenu({
  user,
  userIsLoggedIn,
  onSignOut,
  onProfile,
  size = 'desktop',
  onClose,
}: {
  user: UserInfo
  userIsLoggedIn: boolean
  onSignOut: () => void
  onProfile: () => void
  size?: 'desktop' | 'mobile'
  onClose?: () => void
}) {
  const { t } = useTranslation()
  const safeUser = {
    ...user,
    avatar: user.avatar_url || user.avatar || '/placeholder.svg',
  }

  if (!userIsLoggedIn) {
    if (size === 'mobile') {
      return (
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="h-11 w-11"
        >
          <Link
            to="/user/auth"
            onClick={onClose}
            aria-label={t('common.signIn')}
          >
            <LogIn className="size-6" />
          </Link>
        </Button>
      )
    }

    return (
      <Button
        asChild
        size="sm"
      >
        <Link
          to="/user/auth"
          onClick={onClose}
        >
          {t('common.signIn')}
        </Link>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={size === 'mobile' ? 'h-11 w-11 rounded-full' : 'h-9 w-9 rounded-full'}
          aria-label={t('common.profile')}
        >
          <UserAvatar user={safeUser} size="md" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <UserDisplayName name={safeUser.name} role={safeUser.role} className="font-medium" />
            <p className="w-[200px] truncate text-muted-foreground text-sm">{safeUser.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        {size === 'mobile' && (
          <DropdownMenuItem asChild>
            <Link to="/project/submit" className="flex items-center">
              <Upload className="mr-2 h-4 w-4" />
              <span>{t('common.submitProject')}</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => {
            onProfile()
            onClose?.()
          }}
        >
          <User className="mr-2 h-4 w-4" />
          <span>{t('common.profile')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard/posts" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            <span>{t('common.myPosts')}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            onSignOut()
            onClose?.()
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('common.signOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export interface NavbarProps {
  showBackButton?: boolean
  showNavigation?: boolean
  isLoggedIn?: boolean
  user?: UserInfo
  onSignOut?: () => void
  onProfile?: () => void
}

export function Navbar({
  showBackButton = false,
  showNavigation = false,
  isLoggedIn,
  user,
  onSignOut,
  onProfile,
}: NavbarProps) {
  const [open, setOpen] = useState(false)
  const scrolled = useScroll(10)
  const router = useRouter()
  const { t } = useTranslation()

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
        await router.refresh()
        router.navigate({ to: '/' })
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
        router.navigate({ to: `/${safeUser.username}` })
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
        style={{ marginLeft: 'auto', marginRight: 'auto' }}
      >
        <nav className="relative flex h-16 items-center justify-between px-4 md:px-6">
          {/* Brand */}
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
              <Link to="/">
                <Button variant="ghost" size="sm" className="hover:shadow-none">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link to="/" className="flex items-center gap-2">
                <AdaptiveLogo className="h-7 w-auto md:h-8" />
              </Link>
            )}
          </motion.div>

          {/* Desktop Navigation */}
          {showNavigation && (
            <motion.div
              className="absolute left-1/2 hidden -translate-x-1/2 items-center justify-center gap-1 md:flex lg:gap-2"
              initial={false}
              animate={{ y: 0, opacity: 1 }}
              transition={springTransition}
            >
              {navItems.map((item) => (
                <NavItem key={item.type === 'link' ? item.href : `nav-${item.label}`} item={item} />
              ))}
            </motion.div>
          )}

          {/* Desktop Actions */}
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
                asChild
                size="sm"
              >
                <Link to="/user/auth">{t('common.signIn')}</Link>
              </Button>
            ) : (
              <>
                <Link to="/project/submit">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Upload className="h-4 w-4" />
                    {t('common.submitProject')}
                  </Button>
                </Link>
                <UserMenu
                  user={safeUser}
                  userIsLoggedIn={userIsLoggedIn}
                  onSignOut={handleSignOut}
                  onProfile={handleProfile}
                />
              </>
            )}
          </motion.div>

          {/* Mobile Actions */}
          <div className="flex items-center justify-end gap-3 md:hidden">
            <UserMenu
              user={safeUser}
              userIsLoggedIn={userIsLoggedIn}
              onSignOut={handleSignOut}
              onProfile={handleProfile}
              size="mobile"
            />
            <Button
              className="relative z-50 h-11 w-11"
              onClick={() => setOpen(!open)}
              size="icon"
              variant="ghost"
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              <MenuToggleIcon className="size-6" duration={300} open={open} />
            </Button>
          </div>
        </nav>
      </motion.div>

      {/* Mobile Menu */}
      {showNavigation && (
        <MobileMenuPortal open={open}>
          <div className="flex h-full flex-col justify-between p-6 pt-24 pb-10">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <MobileNavItem
                  key={item.type === 'link' ? item.href : `nav-${item.label}`}
                  item={item}
                  closeMenu={() => setOpen(false)}
                />
              ))}
            </div>

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

            <div className="flex flex-col gap-4">
              {!userIsLoggedIn ? (
                <Button
                  asChild
                  size="lg"
                  className="w-full"
                >
                  <Link
                    to="/user/auth"
                    onClick={() => setOpen(false)}
                  >
                    {t('common.signIn')}
                  </Link>
                </Button>
              ) : (
                <div className="flex flex-col gap-4 border-t pt-6">
                  <Link to="/project/submit" onClick={() => setOpen(false)}>
                    <Button className="w-full gap-2" size="lg">
                      <Upload className="h-4 w-4" />
                      {t('common.submitProject')}
                    </Button>
                  </Link>

                  <div className="flex items-center gap-3">
                    <UserAvatar user={safeUser} size="md" />
                    <div>
                      <UserDisplayName name={safeUser.name} role={safeUser.role} className="font-medium" />
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
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to="/dashboard/posts" onClick={() => setOpen(false)}>
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
        </MobileMenuPortal>
      )}
    </header>
  )
}
