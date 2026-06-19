'use client'

import { ArrowLeft, Mail, X } from 'lucide-react'
import { Image } from '@unpic/react'
import { Link } from '@tanstack/react-router'
import { useSearchParams } from '@/lib/navigation'
import { useTranslation } from 'react-i18next'
import { Suspense, useEffect } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from '@/lib/navigation'

function getSafeAuthRedirectPath(value: string | null): string {
  if (!value) return '/'

  const trimmed = value.trim()
  if (!trimmed.startsWith('/')) return '/'
  if (trimmed.startsWith('//')) return '/'
  if (trimmed.startsWith('/user/auth')) return '/'

  return trimmed
}

type AuthMode = 'signin' | 'signup' | 'reset'

function buildAuthHref(mode: AuthMode, searchParams: URLSearchParams): string {
  const params = new URLSearchParams()
  if (mode !== 'signin') {
    params.set('mode', mode)
  }
  const redirectTo = searchParams.get('redirectTo')
  if (redirectTo) {
    params.set('redirectTo', redirectTo)
  }
  const success = searchParams.get('success')
  if (success) {
    params.set('success', success)
  }
  const error = searchParams.get('error')
  if (error) {
    params.set('error', error)
  }
  const query = params.toString()
  return query ? `/user/auth?${query}` : '/user/auth'
}

function AuthPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation('auth')
  const safeRedirectTo = getSafeAuthRedirectPath(searchParams.get('redirectTo'))
  const authMode = (searchParams.get('mode') === 'signup'
    ? 'signup'
    : searchParams.get('mode') === 'reset'
      ? 'reset'
      : 'signin') satisfies AuthMode
  const isSignUp = authMode === 'signup'
  const isForgotPassword = authMode === 'reset'
  const signInHref = buildAuthHref('signin', searchParams)
  const signUpHref = buildAuthHref('signup', searchParams)
  const resetHref = buildAuthHref('reset', searchParams)
  const error = searchParams.get('error')
  const success = searchParams.get('success')

  useEffect(() => {
    let isMounted = true
    const supabase = createClient()

    const redirectToTarget = () => {
      router.navigate({ to: safeRedirectTo, replace: true })
      router.refresh()
    }

    const checkExistingSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!isMounted || !user) return
      redirectToTarget()
    }

    checkExistingSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        redirectToTarget()
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router, safeRedirectTo])

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid-pattern p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-border bg-background/80 p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-6 left-6">
            <ThemeToggle />
          </div>

          <a href="/" className="absolute top-6 right-6">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="h-8 w-8 rounded-full p-0 text-muted-foreground transition-colors duration-200 hover:cursor-pointer hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </a>

          {!isForgotPassword ? (
            <>
              <div className="mb-8 flex items-center justify-center">
                <div className="relative flex rounded-full bg-muted/50 p-1">
                  <div
                    className={`absolute top-1 bottom-1 rounded-full bg-foreground shadow-lg transition-all duration-200 ease-in-out ${
                      isSignUp ? 'right-1 left-[calc(50%)]' : 'right-[calc(50%)] left-1'
                    }`}
                  />

                  <a
                    href={signInHref}
                    aria-current={!isSignUp ? 'page' : undefined}
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'sm' }),
                      'relative z-10 rounded-full px-6 py-2 text-sm transition-all duration-300',
                      !isSignUp ? 'text-background' : 'text-muted-foreground',
                    )}
                  >
                    {t('signIn')}
                  </a>
                  <a
                    href={signUpHref}
                    aria-current={isSignUp ? 'page' : undefined}
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'sm' }),
                      'relative z-10 rounded-full px-6 py-2 text-sm transition-all duration-300',
                      isSignUp ? 'text-background' : 'text-muted-foreground',
                    )}
                  >
                    {t('signUp')}
                  </a>
                </div>
              </div>

              <div className="mb-8 text-center">
                <h1 className="mb-2 font-bold text-3xl text-foreground tracking-tight">
                  {isSignUp ? t('createAccount') : t('welcomeBack')}
                </h1>
              </div>
            </>
          ) : (
            <>
              <div className="mb-8 flex items-center">
                <a
                  href={signInHref}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'mr-4 inline-flex h-10 w-10 items-center justify-center rounded-full border-0 bg-muted/50 p-0 text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                  aria-label={t('signIn')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </a>
                <h1 className="font-bold text-3xl text-foreground tracking-tight">{t('resetPassword')}</h1>
              </div>

              <div className="mb-8 text-center">
                <p className="text-muted-foreground">{t('resetPasswordDescription')}</p>
              </div>
            </>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-700">{error}</div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-green-500/50 bg-green-500/10 px-4 py-3 text-green-700">
              {success}
            </div>
          )}

          {!isForgotPassword ? (
            <form
              method="POST"
              action={isSignUp ? '/api/auth/sign-up' : '/api/auth/sign-in'}
              className="space-y-4"
            >
              <input type="hidden" name="redirectTo" value={safeRedirectTo} />
              {isSignUp ? <input type="hidden" name="mode" value="signup" /> : null}

              {isSignUp ? (
                <div className="relative">
                  <Input
                    type="text"
                    name="username"
                    placeholder="Username"
                    autoComplete="username"
                    required
                    className="h-12 rounded-xl border-border bg-muted/30 text-foreground transition-all duration-200 placeholder:text-muted-foreground focus:border-foreground/40 focus:ring-foreground/20"
                  />
                </div>
              ) : null}

              <div className="relative">
                <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform text-muted-foreground transition-all duration-200" />
                <Input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                  className="h-12 rounded-xl border-border bg-muted/30 pl-12 text-foreground transition-all duration-200 placeholder:text-muted-foreground focus:border-foreground/40 focus:ring-foreground/20"
                />
              </div>

              <Input
                type="password"
                name="password"
                placeholder="Enter your password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                className="h-12 rounded-xl border-border bg-muted/30 text-foreground transition-all duration-200 placeholder:text-muted-foreground focus:border-foreground/40 focus:ring-foreground/20"
              />

              {!isSignUp ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      name="remember"
                      className="border-border transition-all duration-200 data-[state=checked]:border-foreground data-[state=checked]:bg-foreground"
                    />
                    <label htmlFor="remember" className="text-muted-foreground text-sm">
                      Remember me
                    </label>
                  </div>
                  <a
                    href={resetHref}
                    className="text-muted-foreground text-sm transition-all duration-200 hover:cursor-pointer hover:text-foreground hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
              ) : null}

              <Button
                type="submit"
                data-testid="auth-submit"
                className="h-12 w-full rounded-xl bg-primary font-medium text-base text-primary-foreground transition-all duration-300 hover:bg-primary/90"
              >
                {isSignUp ? 'Create an account' : 'Sign in'}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-border border-t transition-all duration-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-4 text-muted-foreground transition-all duration-200">
                    {isSignUp ? 'OR SIGN UP WITH' : 'OR CONTINUE WITH'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href="/api/auth/oauth/google"
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'flex h-12 items-center justify-center rounded-xl border-border bg-muted/30 text-foreground hover:bg-muted',
                  )}
                >
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/google-color-q23vP6w1nV7ElZybaSRHqpvXY2DFW7.svg"
                    alt="Google"
                    className="mr-2 h-5 w-5"
                    width={24}
                    height={24}
                  />
                  Google
                </a>
                <a
                  href="/api/auth/oauth/github"
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'flex h-12 items-center justify-center rounded-xl border-border bg-muted/30 text-foreground hover:bg-muted',
                  )}
                >
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/github-qFqLvPlTz3nsK0sR6uMXsGl6YFklgn.svg"
                    alt="GitHub"
                    className="mr-2 h-5 w-5"
                    width={24}
                    height={24}
                  />
                  GitHub
                </a>
              </div>
            </form>
          ) : (
            <form method="POST" action="/api/auth/reset-password" className="space-y-4">
              <input type="hidden" name="mode" value="reset" />
              <input type="hidden" name="redirectTo" value={safeRedirectTo} />

              <div className="relative">
                <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform text-muted-foreground transition-all duration-200" />
                <Input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  autoComplete="email"
                  required
                  className="h-12 rounded-xl border-border bg-muted/30 pl-12 text-foreground transition-all duration-200 placeholder:text-muted-foreground focus:border-foreground/40 focus:ring-foreground/20"
                />
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-primary font-medium text-base text-primary-foreground transition-all duration-300 hover:bg-primary/90"
              >
                Send reset link
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-xs">
              {!isForgotPassword ? (
                <>
                  By {isSignUp ? 'creating an account' : 'signing in'}, you agree to our{' '}
                  <Link to="/terms-of-service" className="text-foreground underline hover:text-primary">
                    Terms & Service
                  </Link>
                </>
              ) : (
                <>
                  Remember your password?{' '}
                  <a href={signInHref} className="text-foreground underline hover:text-primary">
                    Back to sign in
                  </a>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function AuthLoadingSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-grid-pattern p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-border bg-background/80 p-8 shadow-2xl backdrop-blur-xl">
          <div className="space-y-6 text-center">
            <div className="space-y-3">
              <div className="mx-auto h-8 w-2/3 animate-pulse rounded-lg bg-muted/20" />
              <div className="mx-auto h-4 w-1/2 animate-pulse rounded-lg bg-muted/15" />
            </div>

            <div className="space-y-4">
              <div className="h-12 animate-pulse rounded-xl bg-muted/20" />
              <div className="h-12 animate-pulse rounded-xl bg-muted/20" />
              <div className="h-12 animate-pulse rounded-xl bg-muted/20" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="h-12 animate-pulse rounded-xl bg-muted/15" />
              <div className="h-12 animate-pulse rounded-xl bg-muted/15" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthLoadingSkeleton />}>
      <AuthPageContent />
    </Suspense>
  )
}
