import { createClient } from "@/lib/supabase/server";

const allowedEmailDomains = new Set([
  "gmail.com",
  "googlemail.com",
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
  return allowedEmailDomains.has(domain);
}

export function getSafeRedirectPath(value: FormDataEntryValue | null | string | undefined): string {
  if (typeof value !== "string" || !value.trim()) return "/";

  const trimmed = value.trim();
  // Reject anything that isn't a same-origin path:
  // - must start with a single '/'
  // - reject protocol-relative ('//host') and backslash variants ('/\host'),
  //   which browsers normalize to '//host'
  // - reject redirecting back into the auth flow
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.startsWith("/user/auth")
  ) {
    return "/";
  }

  return trimmed;
}

export type AuthCredentialsResult =
  | { ok: true; redirect: string }
  | { ok: false; error: string; emailNotConfirmed?: boolean; email?: string };

export async function signInWithCredentials(formData: FormData): Promise<AuthCredentialsResult> {
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = getSafeRedirectPath(formData.get("redirectTo"));

  if (!email || !password) {
    return { ok: false, error: "Email and password are required" };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      if (!user.email_confirmed_at) {
        await supabase.auth.signOut();
        return {
          ok: false,
          error:
            "Please confirm your email address before signing in. Check your inbox for the confirmation link.",
          emailNotConfirmed: true,
          email: user.email ?? email.toString(),
        };
      }

      const { data: existingProfile } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!existingProfile) {
        const baseUsername =
          user.email
            ?.split("@")[0]
            ?.toLowerCase()
            .replace(/[^a-z0-9]/g, "") || `user${user.id.slice(0, 8)}`;

        let username = baseUsername;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
          const { data: usernameTaken } = await supabase
            .from("users")
            .select("id")
            .eq("username", username)
            .single();

          if (!usernameTaken) break;

          attempts++;
          username = `${baseUsername}${attempts}`;
        }

        if (attempts >= maxAttempts) {
          username = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
        }

        const profileData = {
          id: user.id,
          username,
          display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          updated_at: new Date().toISOString(),
        };

        const { error: profileError } = await supabase.from("users").insert(profileData);

        if (profileError) {
          console.error("[auth] Profile creation error:", profileError);
        }
      }
    }

    return { ok: true, redirect: redirectTo };
  } catch (error) {
    console.error("[auth] Login error:", error);
    return { ok: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function signUpWithCredentials(
  formData: FormData,
  origin: string,
): Promise<AuthCredentialsResult> {
  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const username = formData.get("username")?.toString().trim() ?? "";

  if (!email || !password) {
    return { ok: false, error: "Email and password are required" };
  }

  if (!isEmailDomainAllowed(email)) {
    const domain = getEmailDomain(email);
    return {
      ok: false,
      error: domain
        ? `Domain ${domain} is not allowed. Use Gmail, Yahoo, or Outlook.`
        : "Invalid email format.",
    };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${origin}/`,
        data: {
          username,
          display_name: username,
        },
      },
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return {
      ok: true,
      redirect: `/user/auth/confirm-email?email=${encodeURIComponent(email)}`,
    };
  } catch (error) {
    console.error("[auth] Sign up error:", error);
    return { ok: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function resetPasswordWithEmail(
  formData: FormData,
  origin: string,
): Promise<AuthCredentialsResult> {
  const email = formData.get("email");

  if (!email) {
    return { ok: false, error: "Email is required" };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.toString(), {
      redirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || origin}/user/auth`,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return {
      ok: true,
      redirect: `/user/auth?success=${encodeURIComponent("Password reset email sent. Check your inbox.")}`,
    };
  } catch (error) {
    console.error("[auth] Password reset error:", error);
    return { ok: false, error: "An unexpected error occurred. Please try again." };
  }
}
