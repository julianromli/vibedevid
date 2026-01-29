'use client'

import { ArrowLeft, Eye, EyeOff, Loader2, Mail, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type React from 'react'
import { Suspense, useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { resetPassword, signIn, signUp } from '@/lib/actions'
import { createClient } from '@/lib/supabase/client'

// Email domain whitelist helper
const allowedDomains = new Set([
  'gmail.com',
  'googlemail.com', // alias gmail
  'yahoo.com',
  'yahoo.co.id',
  'outlook.com',
  'outlook.co.id',
  'hotmail.com',
  'live.com',
])

function getEmailDomain(value: string): string | null {
  const at = value.lastIndexOf('@')
  if (at === -1) return null
  const domain = value
    .slice(at + 1)
    .toLowerCase()
    .trim()
  return domain || null
}

function isEmailDomainAllowed(value: string): boolean {
  const domain = getEmailDomain(value)
  if (!domain) return false
  return allowedDomains.has(domain)
}

// Component yang menggunakan useSearchParams
function AuthPageContent() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emailDomainError, setEmailDomainError] = useState<string | null>(null)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const searchParams = useSearchParams()
  const t = useTranslations('auth')

  // Handle URL parameters on mount
  useEffect(() => {
    const successParam = searchParams.get('success')
    const errorParam = searchParams.get('error')

    if (successParam) {
      setSuccess(decodeURIComponent(successParam))
    }
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)

    const redirectTo = searchParams.get('redirectTo')
    if (redirectTo) {
      formData.append('redirectTo', redirectTo)
    }

    console.log('[Frontend] Calling server action signIn with:', { email })

    try {
      const result = await signIn(null, formData)
      console.log('[Frontend] Server action result:', result)

      if (result?.error) {
        console.log('[Frontend] Sign in error:', result.error, 'emailNotConfirmed:', result.emailNotConfirmed)
        setError(result.error)
        if (result.emailNotConfirmed) {
          // Redirect to email confirmation page if email not confirmed
          console.log('[Frontend] Redirecting to confirm email page')
          router.push(`/user/auth/confirm-email?email=${encodeURIComponent(email)}`)
        }
      } else if (result?.success) {
        console.log('[Frontend] Sign in success, redirecting to:', result.redirect || '/')
        toast.success(t('success.signIn'))
        router.refresh()
        router.push(result.redirect || '/')
      } else {
        console.log('[Frontend] Unexpected result structure:', result)
      }
    } catch (error: unknown) {
      console.error('[Frontend] Sign in error:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    // Guard: whitelist email domain
    if (!isEmailDomainAllowed(email)) {
      const domain = getEmailDomain(email)
      const msg = domain ? t('emailDomainError', { domain }) : t('emailFormatError')
      setEmailDomainError(msg)
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/`,
          data: {
            username: username,
            display_name: username,
          },
        },
      })
      if (error) throw error

      // Redirect to email confirmation page
      router.push(`/user/auth/confirm-email?email=${encodeURIComponent(email)}`)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('email', email)

    try {
      const result = await resetPassword(null, formData)

      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSuccess(result.success)
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialAuth = async (provider: 'google' | 'github') => {
    const supabase = createClient()
    setError(null)

    // Note: Untuk SSO, filter domain paling aman dilakukan di server side setelah callback,
    // karena kita nggak dapat email user sebelum OAuth flow selesai.
    // Di sisi client kita bisa batasi provider yang tersedia saja.

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const handleForgotPasswordClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsForgotPassword(true)
    setError(null)
    setSuccess(null)
  }

  const handleBackToSignIn = () => {
    setIsForgotPassword(false)
    setIsSignUp(false)
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="bg-grid-pattern flex min-h-screen items-center justify-center p-4">
      {/* Background Gradient Overlay */}
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>

      {/* Auth Modal */}
      <div className="relative w-full max-w-md">
        <div className="bg-background/80 border-border rounded-3xl border p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-6 left-6">
            <ThemeToggle />
          </div>

          {/* Close Button */}
          <Link
            href="/"
            className="absolute top-6 right-6"
          >
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-full p-0 transition-colors duration-200 hover:cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          </Link>

          {!isForgotPassword ? (
            <>
              {/* Toggle Buttons */}
              <div className="mb-8 flex items-center justify-center">
                <div className="bg-muted/50 relative flex rounded-full p-1">
                  {/* Sliding Background */}
                  <div
                    className={`bg-foreground absolute top-1 bottom-1 rounded-full shadow-lg transition-all duration-200 ease-in-out ${
                      isSignUp ? 'right-1 left-[calc(50%)]' : 'right-[calc(50%)] left-1'
                    }`}
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSignUp(false)}
                    className={`relative z-10 rounded-full px-6 py-2 text-sm transition-all duration-300 ${
                      !isSignUp ? 'text-background' : 'text-muted-foreground'
                    }`}
                  >
                    {t('signIn')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSignUp(true)}
                    className={`relative z-10 rounded-full px-6 py-2 text-sm transition-all duration-300 ${
                      isSignUp ? 'text-background' : 'text-muted-foreground'
                    }`}
                  >
                    {t('signUp')}
                  </Button>
                </div>
              </div>

              {/* Form Title */}
              <div className="mb-8 text-center">
                <h1 className="text-foreground mb-2 text-3xl font-bold tracking-tight">
                  {isSignUp ? t('createAccount') : t('welcomeBack')}
                </h1>
              </div>
            </>
          ) : (
            <>
              <div className="mb-8 flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToSignIn}
                  className="bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground mr-4 h-10 w-10 rounded-full border-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-foreground text-3xl font-bold tracking-tight">{t('resetPassword')}</h1>
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

          {/* Form */}
          {!isForgotPassword ? (
            <form
              onSubmit={isSignUp ? handleSignUp : handleSignIn}
              className="space-y-4"
            >
              {/* Sign Up Fields */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isSignUp ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:ring-foreground/20 h-12 rounded-xl transition-all duration-200"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform transition-all duration-200" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      const val = e.target.value
                      setEmail(val)
                      if (isSignUp) {
                        if (!val) {
                          setEmailDomainError(null)
                        } else if (!isEmailDomainAllowed(val)) {
                          const domain = getEmailDomain(val)
                          setEmailDomainError(
                            domain
                              ? `Domain ${domain} tidak diizinkan. Gunakan Gmail, Yahoo, atau Outlook ya cuy.`
                              : "Format email nggak valid. Pastikan ada '@' dan domainnya ya.",
                          )
                        } else {
                          setEmailDomainError(null)
                        }
                      } else {
                        setEmailDomainError(null)
                      }
                    }}
                    required
                    className={`bg-muted/30 border-border text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:ring-foreground/20 h-12 rounded-xl pl-12 transition-all duration-200 ${
                      isSignUp && emailDomainError ? 'border-red-500/50' : ''
                    }`}
                  />
                </div>
                {isSignUp && emailDomainError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
                    <p className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                      <span className="text-red-500">⚠️</span>
                      {emailDomainError}
                    </p>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:ring-foreground/20 h-12 rounded-xl pr-12 transition-all duration-200"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 h-6 w-6 -translate-y-1/2 transform p-0 transition-all duration-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>

              {/* Remember Me & Forgot Password (Sign In Only) */}
              <div
                className={`flex items-center justify-between overflow-hidden transition-all duration-300 ease-in-out ${
                  !isSignUp ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={setRememberMe}
                    className="border-border data-[state=checked]:bg-foreground data-[state=checked]:border-foreground transition-all duration-200"
                  />
                  <label
                    htmlFor="remember"
                    className="text-muted-foreground text-sm transition-all duration-200"
                  >
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleForgotPasswordClick}
                  className="text-muted-foreground hover:text-foreground text-sm transition-all duration-200 hover:cursor-pointer hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 w-full rounded-xl text-base font-medium transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </>
                ) : (
                  <>{isSignUp ? 'Create an account' : 'Sign in'}</>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="border-border w-full border-t transition-all duration-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background text-muted-foreground px-4 transition-all duration-200">
                    {isSignUp ? 'OR SIGN UP WITH' : 'OR CONTINUE WITH'}
                  </span>
                </div>
              </div>

              {/* Social Login Buttons */}
              {/* Batasi provider yang tersedia: hanya Google untuk SSO email yang terverifikasi */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialAuth('google')}
                  className="bg-muted/30 border-border text-foreground hover:bg-muted flex h-12 items-center justify-center rounded-xl"
                >
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/google-color-q23vP6w1nV7ElZybaSRHqpvXY2DFW7.svg"
                    alt="Google"
                    className="mr-2 h-5 w-5"
                    width={24}
                    height={24}
                  />
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialAuth('github')}
                  className="bg-muted/30 border-border text-foreground hover:bg-muted flex h-12 items-center justify-center rounded-xl"
                >
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/github-qFqLvPlTz3nsK0sR6uMXsGl6YFklgn.svg"
                    alt="GitHub"
                    className="mr-2 h-5 w-5"
                    width={24}
                    height={24}
                  />
                  GitHub
                </Button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleResetPassword}
              className="space-y-4"
            >
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform transition-all duration-200" />
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:ring-foreground/20 h-12 rounded-xl pl-12 transition-all duration-200"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 w-full rounded-xl text-base font-medium transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending reset link...
                  </>
                ) : (
                  'Send reset link'
                )}
              </Button>
            </form>
          )}

          {/* Terms & Service */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-xs">
              {!isForgotPassword ? (
                <>
                  By {isSignUp ? 'creating an account' : 'signing in'}, you agree to our{' '}
                  <Link
                    href="/terms"
                    className="text-foreground hover:text-primary underline"
                  >
                    Terms & Service
                  </Link>
                </>
              ) : (
                <>
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={handleBackToSignIn}
                    className="text-foreground hover:text-primary underline"
                  >
                    Back to sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading component untuk fallback
function AuthLoadingSkeleton() {
  return (
    <div className="bg-grid-pattern flex min-h-screen items-center justify-center p-4">
      {/* Background Gradient Overlay */}
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>

      {/* Loading Modal */}
      <div className="relative w-full max-w-md">
        <div className="bg-background/80 border-border rounded-3xl border p-8 shadow-2xl backdrop-blur-xl">
          <div className="space-y-6 text-center">
            {/* Header skeleton */}
            <div className="space-y-3">
              <div className="bg-muted/20 mx-auto h-8 w-2/3 animate-pulse rounded-lg"></div>
              <div className="bg-muted/15 mx-auto h-4 w-1/2 animate-pulse rounded-lg"></div>
            </div>

            {/* Form skeleton */}
            <div className="space-y-4">
              <div className="bg-muted/20 h-12 animate-pulse rounded-xl"></div>
              <div className="bg-muted/20 h-12 animate-pulse rounded-xl"></div>
              <div className="bg-muted/20 h-12 animate-pulse rounded-xl"></div>
            </div>

            {/* Buttons skeleton */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/15 h-12 animate-pulse rounded-xl"></div>
              <div className="bg-muted/15 h-12 animate-pulse rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main page component dengan Suspense boundary
export default function AuthPage() {
  return (
    <Suspense fallback={<AuthLoadingSkeleton />}>
      <AuthPageContent />
    </Suspense>
  )
}
