"use client";

import { ArrowLeft, CheckCircle, Loader2, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "@/lib/navigation";

function ResetPasswordContent() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Read token from URL query string
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token") || "";

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid or missing reset token. Please request a new reset link.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await authClient.resetPassword({
        token,
        newPassword,
      });

      if (error) {
        toast.error(error.message || "Failed to reset password");
        return;
      }

      setIsSuccess(true);
      toast.success("Password reset successfully! You can now sign in.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid-pattern p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-border bg-background/80 p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-6 left-6">
            <ThemeToggle />
          </div>

          <Link to="/user/auth" className="absolute top-6 right-6">
            <span
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-8 w-8 rounded-full p-0 text-muted-foreground transition-colors duration-200 hover:cursor-pointer hover:text-foreground",
              )}
              aria-hidden="true"
            >
              <ArrowLeft className="h-4 w-4" />
            </span>
          </Link>

          {isSuccess ? (
            <div className="space-y-6 text-center">
              <div className="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                <CheckCircle className="text-primary h-8 w-8" />
              </div>
              <h1 className="text-foreground text-2xl font-bold tracking-tight">
                Password Reset
              </h1>
              <p className="text-muted-foreground text-sm">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 w-full rounded-xl font-medium transition-all duration-300"
                onClick={() => router.navigate({ to: "/user/auth", replace: true })}
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <div className="mt-6 mb-8 text-center">
                <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <Lock className="text-primary h-8 w-8" />
                </div>
                <h1 className="text-foreground mb-2 text-2xl font-bold tracking-tight">
                  Set a new password
                </h1>
                <p className="text-muted-foreground text-sm">
                  Enter your new password below to complete the reset.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform transition-all duration-200" />
                  <Input
                    type="password"
                    placeholder="New password"
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:ring-foreground/20 h-12 rounded-xl pl-12 transition-all duration-200"
                  />
                </div>

                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform transition-all duration-200" />
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:ring-foreground/20 h-12 rounded-xl pl-12 transition-all duration-200"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 w-full rounded-xl font-medium transition-all duration-300"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset password"
                  )}
                </Button>
              </form>

              {!token && (
                <div className="mt-4 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-700">
                  No reset token found. Please request a new password reset link.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <ResetPasswordContent />;
}
