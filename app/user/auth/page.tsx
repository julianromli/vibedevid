"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { X, Eye, EyeOff, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isForgotPassword) {
      console.log("Password reset requested for:", formData.email)
    } else {
      console.log("Form submitted:", { isSignUp, formData, rememberMe })
    }
  }

  const handleSocialAuth = (provider: string) => {
    console.log(`Authenticating with ${provider}`)
  }

  const handleForgotPasswordClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsForgotPassword(true)
  }

  const handleBackToSignIn = () => {
    setIsForgotPassword(false)
    setIsSignUp(false)
  }

  return (
    <div className="min-h-screen bg-grid-pattern flex items-center justify-center p-4">
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/50 via-muted/30 to-background/80"></div>

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
              className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground transition-colors duration-200 p-0"
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
                      isSignUp ? "left-[calc(50%)] right-1" : "left-1 right-[calc(50%)]"
                    }`}
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSignUp(false)}
                    className={`rounded-full px-6 py-2 text-sm transition-all duration-300 relative z-10 ${
                      !isSignUp ? "text-background" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Sign in
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSignUp(true)}
                    className={`rounded-full px-6 py-2 text-sm transition-all duration-300 relative z-10 ${
                      isSignUp ? "text-background" : "text-muted-foreground hover:text-foreground"
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
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Reset password</h1>
              </div>

              <div className="text-center mb-8">
                <p className="text-muted-foreground">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isForgotPassword ? (
              <>
                {/* Sign Up Fields */}
                <div
                  className={`grid grid-cols-2 gap-3 transition-all duration-300 ease-in-out overflow-hidden ${
                    isSignUp ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground rounded-xl h-12 focus:border-foreground/40 focus:ring-foreground/20 transition-all duration-200"
                    />
                  </div>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground rounded-xl h-12 focus:border-foreground/40 focus:ring-foreground/20 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground transition-all duration-200" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground rounded-xl h-12 pl-12 focus:border-foreground/40 focus:ring-foreground/20 transition-all duration-200"
                  />
                </div>

                {/* Password Field */}
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground rounded-xl h-12 pr-12 focus:border-foreground/40 focus:ring-foreground/20 transition-all duration-200"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground h-6 w-6 p-0 transition-all duration-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Remember Me & Forgot Password (Sign In Only) */}
                <div
                  className={`flex items-center justify-between transition-all duration-300 ease-in-out overflow-hidden ${
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
                    <label htmlFor="remember" className="text-sm text-muted-foreground transition-all duration-200">
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleForgotPasswordClick}
                    className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 text-base font-medium transition-all duration-300"
                >
                  {isSignUp ? "Create an account" : "Sign in"}
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
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialAuth("google")}
                    className="bg-muted/30 border-border text-foreground hover:bg-muted rounded-xl h-12 flex items-center justify-center"
                  >
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/google-color-q23vP6w1nV7ElZybaSRHqpvXY2DFW7.svg"
                      alt="Google"
                      className="w-5 h-5 mr-2"
                    />
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialAuth("github")}
                    className="bg-muted/30 border-border text-foreground hover:bg-muted rounded-xl h-12 flex items-center justify-center"
                  >
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/github-qFqLvPlTz3nsK0sR6uMXsGl6YFklgn.svg"
                      alt="GitHub"
                      className="w-5 h-5 mr-2"
                    />
                    GitHub
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground transition-all duration-200" />
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground rounded-xl h-12 pl-12 focus:border-foreground/40 focus:ring-foreground/20 transition-all duration-200"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 text-base font-medium transition-all duration-300"
                >
                  Send reset link
                </Button>
              </>
            )}
          </form>

          {/* Terms & Service */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              {!isForgotPassword ? (
                <>
                  By {isSignUp ? "creating an account" : "signing in"}, you agree to our{" "}
                  <Link href="/terms" className="text-foreground hover:text-primary underline">
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
  )
}
