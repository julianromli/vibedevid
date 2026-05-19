'use client'

import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true
    const supabase = createClient()

    const verifyRecoverySession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!isMounted) return

      if (!user) {
        router.replace('/user/auth?error=Password reset link expired or invalid. Please request a new one.')
        return
      }

      setIsCheckingSession(false)
    }

    verifyRecoverySession()

    return () => {
      isMounted = false
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        throw updateError
      }

      await supabase.auth.signOut()
      toast.success('Password updated successfully. You can sign in with your new password.')
      router.replace('/user/auth?success=Password updated successfully. You can now sign in.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingSession) {
    return (
      <div className="bg-grid-pattern flex min-h-screen items-center justify-center p-4">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-grid-pattern flex min-h-screen items-center justify-center p-4">
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b" />
      <div className="relative w-full max-w-md">
        <div className="bg-background/80 border-border rounded-3xl border p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-6 left-6">
            <ThemeToggle />
          </div>
          <Link
            href="/user/auth"
            className="absolute top-6 right-6"
          >
            <Button
              variant="ghost"
              size="sm"
              className="bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground h-10 w-10 rounded-full border-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          <div className="mt-6 mb-8 text-center">
            <h1 className="text-foreground mb-2 text-3xl font-bold tracking-tight">Set a new password</h1>
            <p className="text-muted-foreground text-sm">Choose a strong password for your account.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="bg-muted/30 border-border h-12 rounded-xl pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 p-0"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="bg-muted/30 border-border h-12 rounded-xl"
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 h-12 w-full rounded-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update password'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
