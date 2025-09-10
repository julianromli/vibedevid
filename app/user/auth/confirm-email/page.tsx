"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Mail, ArrowLeft, Loader2, CheckCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

// Component yang menggunakan useSearchParams
function ConfirmEmailContent() {
  const [email, setEmail] = useState("")
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
      setError("Email address is required")
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
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/`,
        }
      })

      if (error) {
        throw error
      }

      setResendSuccess(true)
      toast.success("Email konfirmasi berhasil dikirim ulang! 📧")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      setError(errorMessage)
      toast.error(`Gagal kirim email: ${errorMessage}`)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-grid-pattern flex items-center justify-center p-4">
      {/* Background Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80"></div>

      {/* Confirmation Modal */}
      <div className="relative w-full max-w-md">
        <div className="bg-background/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-border">
          <div className="absolute top-6 left-6">
            <ThemeToggle />
          </div>

          {/* Back Button */}
          <Link href="/user/auth" className="absolute top-6 right-6">
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          {/* Header */}
          <div className="text-center mb-8 mt-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
              Check your email
            </h1>
            <p className="text-muted-foreground text-sm">
              Gue sudah kirim link konfirmasi ke email lo. Klik link tersebut untuk mengaktifkan akun lo.
            </p>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {resendSuccess && (
            <div className="mb-4 bg-green-500/10 border border-green-500/50 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              Email konfirmasi berhasil dikirim ulang!
            </div>
          )}

          {/* Resend Email Form */}
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Belum dapet emailnya? Cek folder spam atau kirim ulang:
              </p>
            </div>

            <form onSubmit={handleResendConfirmation} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground transition-all duration-200" />
                <Input
                  type="email"
                  placeholder="Masukkan email lo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground rounded-xl h-12 pl-12 focus:border-foreground/40 focus:ring-foreground/20 transition-all duration-200"
                />
              </div>

              <Button
                type="submit"
                disabled={isResending}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 text-base font-medium transition-all duration-300"
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
                <div className="w-full border-t border-border transition-all duration-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background text-muted-foreground transition-all duration-200">
                  OR
                </span>
              </div>
            </div>

            {/* Back to Sign In */}
            <Link href="/user/auth">
              <Button
                variant="outline"
                className="w-full bg-muted/30 border-border text-foreground hover:bg-muted rounded-xl h-12 transition-all duration-300"
              >
                Back to sign in
              </Button>
            </Link>
          </div>

          {/* Instructions */}
          <div className="mt-6 text-center">
            <div className="bg-muted/20 rounded-xl p-4">
              <h3 className="text-sm font-medium text-foreground mb-2">💡 Tips:</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Check folder spam/junk email lo</li>
                <li>• Pastikan email address benar</li>
                <li>• Tunggu beberapa menit jika belum ada</li>
                <li>• Link konfirmasi valid selama 24 jam</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Masih ada masalah?{" "}
              <Link href="/user/auth" className="text-foreground hover:text-primary underline">
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
    <div className="min-h-screen bg-grid-pattern flex items-center justify-center p-4">
      {/* Background Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80"></div>
      
      {/* Loading Modal */}
      <div className="relative w-full max-w-md">
        <div className="bg-background/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-border">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted/20 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted/20 rounded-lg animate-pulse"></div>
              <div className="h-3 bg-muted/15 rounded-lg animate-pulse w-3/4 mx-auto"></div>
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
