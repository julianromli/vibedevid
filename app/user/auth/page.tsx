"use client";

import type React from "react";
import { useState, useTransition, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { X, Eye, EyeOff, Mail, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { signIn, signUp, resetPassword } from "@/lib/actions";
import Image from "next/image";

// Email domain whitelist helper
const allowedDomains = new Set([
  "gmail.com",
  "googlemail.com", // alias gmail
  "yahoo.com",
  "yahoo.co.id",
  "outlook.com",
  "outlook.co.id",
  "hotmail.com",
  "live.com",
]);

function getEmailDomain(value: string): string | null {
  const at = value.lastIndexOf("@");
  if (at === -1) return null;
  const domain = value
    .slice(at + 1)
    .toLowerCase()
    .trim();
  return domain || null;
}

function isEmailDomainAllowed(value: string): boolean {
  const domain = getEmailDomain(value);
  if (!domain) return false;
  return allowedDomains.has(domain);
}

// Component yang menggunakan useSearchParams
function AuthPageContent() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailDomainError, setEmailDomainError] = useState<string | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();

  // Handle URL parameters on mount
  useEffect(() => {
    const successParam = searchParams.get("success");
    const errorParam = searchParams.get("error");

    if (successParam) {
      setSuccess(decodeURIComponent(successParam));
    }
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    console.log("[Frontend] Calling server action signIn with:", { email });

    try {
      const result = await signIn(null, formData);
      console.log("[Frontend] Server action result:", result);

      if (result?.error) {
        console.log(
          "[Frontend] Sign in error:",
          result.error,
          "emailNotConfirmed:",
          result.emailNotConfirmed,
        );
        setError(result.error);
        if (result.emailNotConfirmed) {
          // Redirect to email confirmation page if email not confirmed
          console.log("[Frontend] Redirecting to confirm email page");
          router.push(
            `/user/auth/confirm-email?email=${encodeURIComponent(email)}`,
          );
        }
      } else if (result?.success) {
        console.log(
          "[Frontend] Sign in success, redirecting to:",
          result.redirect || "/",
        );
        toast.success("Berhasil masuk! 🎉 Selamat datang kembali!");
        router.push(result.redirect || "/");
      } else {
        console.log("[Frontend] Unexpected result structure:", result);
      }
    } catch (error: unknown) {
      console.error("[Frontend] Sign in error:", error);
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    // Guard: whitelist email domain
    if (!isEmailDomainAllowed(email)) {
      const domain = getEmailDomain(email);
      const msg = domain
        ? `Email domain ${domain} tidak diizinkan. Gunakan Gmail, Yahoo, atau Outlook ya cuy.`
        : "Format email nggak valid. Pastikan ada '@' dan domainnya ya cuy.";
      setEmailDomainError(msg);
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/`,
          data: {
            username: username,
            display_name: username,
          },
        },
      });
      if (error) throw error;

      // Redirect to email confirmation page
      router.push(
        `/user/auth/confirm-email?email=${encodeURIComponent(email)}`,
      );
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("email", email);

    try {
      const result = await resetPassword(null, formData);

      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(result.success);
      }
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider: "google" | "github") => {
    const supabase = createClient();
    setError(null);

    // Note: Untuk SSO, filter domain paling aman dilakukan di server side setelah callback,
    // karena kita nggak dapat email user sebelum OAuth flow selesai.
    // Di sisi client kita bisa batasi provider yang tersedia saja.

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleForgotPasswordClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsForgotPassword(true);
    setError(null);
    setSuccess(null);
  };

  const handleBackToSignIn = () => {
    setIsForgotPassword(false);
    setIsSignUp(false);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-grid-pattern flex items-center justify-center p-4">
      {/* Background Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80"></div>

      {/* Auth Modal */}
      <div className="relative w-full max-w-md">
        <div className="bg-background/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-border">
          <div className="absolute top-6 left-6">
            <ThemeToggle />
          </div>

          {/* Close Button */}
          <Link href="/" className="absolute top-6 right-6">
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground transition-colors duration-200 p-0 hover:cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          </Link>

          {!isForgotPassword ? (
            <>
              {/* Toggle Buttons */}
              <div className="flex items-center justify-center mb-8">
                <div className="bg-muted/50 rounded-full p-1 flex relative">
                  {/* Sliding Background */}
                  <div
                    className={`absolute top-1 bottom-1 bg-foreground rounded-full transition-all duration-200 ease-in-out shadow-lg ${
                      isSignUp
                        ? "left-[calc(50%)] right-1"
                        : "left-1 right-[calc(50%)]"
                    }`}
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSignUp(false)}
                    className={`rounded-full px-6 py-2 text-sm transition-all duration-300 relative z-10 ${
                      !isSignUp ? "text-background" : "text-muted-foreground"
                    }`}
                  >
                    Sign in
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSignUp(true)}
                    className={`rounded-full px-6 py-2 text-sm transition-all duration-300 relative z-10 ${
                      isSignUp ? "text-background" : "text-muted-foreground"
                    }`}
                  >
                    Sign up
                  </Button>
                </div>
              </div>

              {/* Form Title */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
                  {isSignUp ? "Create an account" : "Welcome back"}
                </h1>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center mb-8">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToSignIn}
                  className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-0 mr-4"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  Reset password
                </h1>
              </div>

              <div className="text-center mb-8">
                <p className="text-muted-foreground">
                  Enter your email address and we'll send you a link to reset
                  your password.
                </p>
              </div>
            </>
          )}

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-500/10 border border-green-500/50 text-green-700 px-4 py-3 rounded-xl">
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
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isSignUp ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground rounded-xl h-12 focus:border-foreground/40 focus:ring-foreground/20 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground transition-all duration-200" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEmail(val);
                      if (isSignUp) {
                        if (!val) {
                          setEmailDomainError(null);
                        } else if (!isEmailDomainAllowed(val)) {
                          const domain = getEmailDomain(val);
                          setEmailDomainError(
                            domain
                              ? `Domain ${domain} tidak diizinkan. Gunakan Gmail, Yahoo, atau Outlook ya cuy.`
                              : "Format email nggak valid. Pastikan ada '@' dan domainnya ya.",
                          );
                        } else {
                          setEmailDomainError(null);
                        }
                      } else {
                        setEmailDomainError(null);
                      }
                    }}
                    required
                    className={`bg-muted/30 border-border text-foreground placeholder:text-muted-foreground rounded-xl h-12 pl-12 focus:border-foreground/40 focus:ring-foreground/20 transition-all duration-200 ${
                      isSignUp && emailDomainError ? "border-red-500/50" : ""
                    }`}
                  />
                </div>
                {isSignUp && emailDomainError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                      <span className="text-red-500">⚠️</span>
                      {emailDomainError}
                    </p>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground rounded-xl h-12 pr-12 focus:border-foreground/40 focus:ring-foreground/20 transition-all duration-200"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground h-6 w-6 p-0 transition-all duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Remember Me & Forgot Password (Sign In Only) */}
              <div
                className={`flex items-center justify-between transition-all  duration-300 ease-in-out overflow-hidden ${
                  !isSignUp ? "max-h-10 opacity-100" : "max-h-0 opacity-0"
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
                    className="text-sm text-muted-foreground transition-all duration-200"
                  >
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleForgotPasswordClick}
                  className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:cursor-pointer hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 text-base font-medium transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSignUp ? "Creating account..." : "Signing in..."}
                  </>
                ) : (
                  <>{isSignUp ? "Create an account" : "Sign in"}</>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border transition-all duration-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-background text-muted-foreground transition-all duration-200">
                    {isSignUp ? "OR SIGN UP WITH" : "OR CONTINUE WITH"}
                  </span>
                </div>
              </div>

              {/* Social Login Buttons */}
              {/* Batasi provider yang tersedia: hanya Google untuk SSO email yang terverifikasi */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialAuth("google")}
                  className="bg-muted/30 border-border text-foreground hover:bg-muted rounded-xl h-12 flex items-center justify-center"
                >
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/google-color-q23vP6w1nV7ElZybaSRHqpvXY2DFW7.svg"
                    alt="Google"
                    className="w-5 h-5 mr-2"
                    width={24}
                    height={24}
                  />
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialAuth("github")}
                  className="bg-muted/30 border-border text-foreground hover:bg-muted rounded-xl h-12 flex items-center justify-center"
                >
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/github-qFqLvPlTz3nsK0sR6uMXsGl6YFklgn.svg"
                    alt="GitHub"
                    className="w-5 h-5 mr-2"
                    width={24}
                    height={24}
                  />
                  GitHub
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground transition-all duration-200" />
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground rounded-xl h-12 pl-12 focus:border-foreground/40 focus:ring-foreground/20 transition-all duration-200"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 text-base font-medium transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending reset link...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>
          )}

          {/* Terms & Service */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              {!isForgotPassword ? (
                <>
                  By {isSignUp ? "creating an account" : "signing in"}, you
                  agree to our{" "}
                  <Link
                    href="/terms"
                    className="text-foreground hover:text-primary underline"
                  >
                    Terms & Service
                  </Link>
                </>
              ) : (
                <>
                  Remember your password?{" "}
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
  );
}

// Loading component untuk fallback
function AuthLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-grid-pattern flex items-center justify-center p-4">
      {/* Background Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80"></div>

      {/* Loading Modal */}
      <div className="relative w-full max-w-md">
        <div className="bg-background/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-border">
          <div className="text-center space-y-6">
            {/* Header skeleton */}
            <div className="space-y-3">
              <div className="h-8 bg-muted/20 rounded-lg animate-pulse w-2/3 mx-auto"></div>
              <div className="h-4 bg-muted/15 rounded-lg animate-pulse w-1/2 mx-auto"></div>
            </div>

            {/* Form skeleton */}
            <div className="space-y-4">
              <div className="h-12 bg-muted/20 rounded-xl animate-pulse"></div>
              <div className="h-12 bg-muted/20 rounded-xl animate-pulse"></div>
              <div className="h-12 bg-muted/20 rounded-xl animate-pulse"></div>
            </div>

            {/* Buttons skeleton */}
            <div className="grid grid-cols-2 gap-3">
              <div className="h-12 bg-muted/15 rounded-xl animate-pulse"></div>
              <div className="h-12 bg-muted/15 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component dengan Suspense boundary
export default function AuthPage() {
  return (
    <Suspense fallback={<AuthLoadingSkeleton />}>
      <AuthPageContent />
    </Suspense>
  );
}
