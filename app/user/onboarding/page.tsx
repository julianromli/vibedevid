"use client";

import { useCallback } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { UsernameClaim } from "@/components/auth/username-claim";
import { signOut } from "@/lib/auth/client";
import { clearOtpPending } from "@/lib/auth/otp-flow";
import { getSafeRedirectPath } from "@/lib/auth/redirect-path";

export default function OnboardingPage({
  suggestion,
  redirectTo,
}: {
  suggestion: string;
  redirectTo?: string;
}) {
  const onClaimed = useCallback(() => {
    // Full load so the header, session cache and gate all see the claimed username.
    window.location.replace(getSafeRedirectPath(redirectTo));
  }, [redirectTo]);

  const onSignOut = useCallback(async () => {
    try {
      clearOtpPending(window.sessionStorage);
    } catch {
      // storage unavailable
    }
    try {
      await signOut();
    } finally {
      window.location.assign("/");
    }
  }, []);

  return (
    <AuthCard showClose={false}>
      <UsernameClaim
        initialUsername={suggestion}
        onClaimed={onClaimed}
        onSignOut={() => void onSignOut()}
      />
    </AuthCard>
  );
}
