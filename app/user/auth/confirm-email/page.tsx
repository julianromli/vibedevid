'use client'

import type React from 'react'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Mail, ArrowLeft, Loader2, CheckCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// Component yang menggunakan useSearchParams
function ConfirmEmailContent() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  // Auto-fill email from URL parameter
  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
    }
  }, [searchParams])

  const handleResendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError('Email address is required')
      return
    }

    const supabase = createClient()
    setIsResending(true)
    setError(null)
    setResendSuccess(false)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.toString(),
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/`,
        },
      })

      if (error) {
        throw error
      }

      setResendSuccess(true)
      toast.success('Email konfirmasi berhasil dikirim ulang! 📧')
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      setError(errorMessage)
      toast.error(`Gagal kirim email: ${errorMessage}`)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="bg-grid-pattern flex min-h-screen items-center justify-center p-4">
      {/* Background Gradient Overlay */}
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>

      {/* Confirmation Modal */}
      <div className="relative w-full max-w-md">
        <div className="bg-background/80 border-border rounded-3xl border p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-6 left-6">
            <ThemeToggle />
          </div>

          {/* Back Button */}
          <Link href="/user/auth" className="absolute top-6 right-6">
            <Button
              variant="ghost"
              size="sm"
              className="bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground h-10 w-10 rounded-full border-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          {/* Header */}
          <div className="mt-6 mb-8 text-center">
            <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Mail className="text-primary h-8 w-8" />
            </div>
            <h1 className="text-foreground mb-2 text-3xl font-bold tracking-tight">
              Check your email
            </h1>
            <p className="text-muted-foreground text-sm">
              Gue sudah kirim link konfirmasi ke email lo. Klik link tersebut
              untuk mengaktifkan akun lo.
            </p>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {resendSuccess && (
            <div className="mb-4 flex items-center rounded-xl border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700">
              <CheckCircle className="mr-2 h-4 w-4 flex-shrink-0" />
              Email konfirmasi berhasil dikirim ulang!
            </div>
          )}

          {/* Resend Email Form */}
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-4 text-sm">
                Belum dapet emailnya? Cek folder spam atau kirim ulang:
              </p>
            </div>

            <form onSubmit={handleResendConfirmation} className="space-y-4">
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform transition-all duration-200" />
                <Input
                  type="email"
                  placeholder="Masukkan email lo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:ring-foreground/20 h-12 rounded-xl pl-12 transition-all duration-200"
                />
              </div>

              <Button
                type="submit"
                disabled={isResending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 w-full rounded-xl text-base font-medium transition-all duration-300"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Kirim ulang email
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="border-border w-full border-t transition-all duration-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background text-muted-foreground px-4 transition-all duration-200">
                  OR
                </span>
              </div>
            </div>

            {/* Back to Sign In */}
            <Link href="/user/auth">
              <Button
                variant="outline"
                className="bg-muted/30 border-border text-foreground hover:bg-muted h-12 w-full rounded-xl transition-all duration-300"
              >
                Back to sign in
              </Button>
            </Link>
          </div>

          {/* Instructions */}
          <div className="mt-6 text-center">
            <div className="bg-muted/20 rounded-xl p-4">
              <h3 className="text-foreground mb-2 text-sm font-medium">
                💡 Tips:
              </h3>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Check folder spam/junk email lo</li>
                <li>• Pastikan email address benar</li>
                <li>• Tunggu beberapa menit jika belum ada</li>
                <li>• Link konfirmasi valid selama 24 jam</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-xs">
              Masih ada masalah?{' '}
              <Link
                href="/user/auth"
                className="text-foreground hover:text-primary underline"
              >
                Coba daftar ulang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading component untuk fallback
function LoadingSkeleton() {
  return (
    <div className="bg-grid-pattern flex min-h-screen items-center justify-center p-4">
      {/* Background Gradient Overlay */}
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>

      {/* Loading Modal */}
      <div className="relative w-full max-w-md">
        <div className="bg-background/80 border-border rounded-3xl border p-8 shadow-2xl backdrop-blur-xl">
          <div className="space-y-4 text-center">
            <div className="bg-muted/20 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
            <div className="space-y-2">
              <div className="bg-muted/20 h-4 animate-pulse rounded-lg"></div>
              <div className="bg-muted/15 mx-auto h-3 w-3/4 animate-pulse rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main page component dengan Suspense boundary
export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ConfirmEmailContent />
    </Suspense>
  )
}
