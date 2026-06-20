import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth/server";

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
  | { ok: true; redirect: string; responseHeaders?: Headers }
  | {
      ok: false;
      error: string;
      emailNotConfirmed?: boolean;
      email?: string;
      responseHeaders?: Headers;
    };

function appendSetCookies(target: Headers, source?: Headers) {
  if (!source) return;
  for (const cookie of source.getSetCookie()) {
    target.append("Set-Cookie", cookie);
  }
}

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message || "Authentication failed";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred. Please try again.";
}

async function parseAuthErrorResponse(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message || "Authentication failed";
  } catch {
    return "Authentication failed";
  }
}

export async function signInWithCredentials(
  formData: FormData,
  requestHeaders: Headers,
): Promise<AuthCredentialsResult> {
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = getSafeRedirectPath(formData.get("redirectTo"));

  if (!email || !password) {
    return { ok: false, error: "Email and password are required" };
  }

  const emailStr = email.toString();

  try {
    const response = await auth.api.signInEmail({
      body: {
        email: emailStr,
        password: password.toString(),
      },
      headers: requestHeaders,
      asResponse: true,
    });

    if (!response.ok) {
      const message = await parseAuthErrorResponse(response);
      if (response.status === 403 || /verify/i.test(message)) {
        return {
          ok: false,
          error:
            "Please confirm your email address before signing in. Check your inbox for the confirmation link.",
          emailNotConfirmed: true,
          email: emailStr,
        };
      }
      return { ok: false, error: message };
    }

    const session = await auth.api.getSession({ headers: response.headers });

    if (session?.user && !session.user.emailVerified) {
      const signOutResponse = await auth.api.signOut({
        headers: response.headers,
        asResponse: true,
      });
      return {
        ok: false,
        error:
          "Please confirm your email address before signing in. Check your inbox for the confirmation link.",
        emailNotConfirmed: true,
        email: session.user.email ?? emailStr,
        responseHeaders: signOutResponse.headers,
      };
    }

    return { ok: true, redirect: redirectTo, responseHeaders: response.headers };
  } catch (error) {
    console.error("[auth] Login error:", error);
    return { ok: false, error: getAuthErrorMessage(error) };
  }
}

export async function signUpWithCredentials(
  formData: FormData,
  origin: string,
  requestHeaders: Headers,
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

  try {
    const response = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: username || email.split("@")[0] || "User",
      },
      headers: requestHeaders,
      asResponse: true,
    });

    if (!response.ok) {
      const message = await parseAuthErrorResponse(response);
      return { ok: false, error: message };
    }

    return {
      ok: true,
      redirect: `/user/auth/confirm-email?email=${encodeURIComponent(email)}`,
      responseHeaders: response.headers,
    };
  } catch (error) {
    console.error("[auth] Sign up error:", error);
    return { ok: false, error: getAuthErrorMessage(error) };
  }
}

export async function resetPasswordWithEmail(
  formData: FormData,
  origin: string,
  requestHeaders: Headers,
): Promise<AuthCredentialsResult> {
  const email = formData.get("email");

  if (!email) {
    return { ok: false, error: "Email is required" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VITE_SITE_URL || origin;
  const redirectTo = `${siteUrl}/user/auth`;

  try {
    const response = await auth.api.requestPasswordReset({
      body: {
        email: email.toString(),
        redirectTo,
      },
      headers: requestHeaders,
      asResponse: true,
    });

    if (!response.ok) {
      const message = await parseAuthErrorResponse(response);
      return { ok: false, error: message };
    }

    return {
      ok: true,
      redirect: `/user/auth?success=${encodeURIComponent("Password reset email sent. Check your inbox.")}`,
      responseHeaders: response.headers,
    };
  } catch (error) {
    console.error("[auth] Password reset error:", error);
    return { ok: false, error: getAuthErrorMessage(error) };
  }
}

export function mergeAuthHeadersIntoResponse(response: Response, authHeaders?: Headers): Response {
  if (!authHeaders) return response;

  const headers = new Headers(response.headers);
  appendSetCookies(headers, authHeaders);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
