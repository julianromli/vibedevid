import type { AuthCredentialsResult } from "@/lib/auth/credentials";
import { getSafeRedirectPath, mergeAuthHeadersIntoResponse } from "@/lib/auth/credentials";

function authPageUrl(request: Request, params: Record<string, string | undefined> = {}) {
  const url = new URL("/user/auth", request.url);

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return url;
}

export function redirectFromAuthResult(
  request: Request,
  formData: FormData,
  result: AuthCredentialsResult,
) {
  const redirectTo = getSafeRedirectPath(formData.get("redirectTo"));
  const mode = formData.get("mode")?.toString();

  if (result.ok) {
    const redirectResponse = Response.redirect(new URL(result.redirect, request.url), 302);
    return mergeAuthHeadersIntoResponse(redirectResponse, result.responseHeaders);
  }

  if (result.emailNotConfirmed && result.email) {
    const confirmResponse = Response.redirect(
      new URL(`/user/auth/confirm-email?email=${encodeURIComponent(result.email)}`, request.url),
      302,
    );
    return mergeAuthHeadersIntoResponse(confirmResponse, result.responseHeaders);
  }

  const url = authPageUrl(request, {
    error: result.error,
    redirectTo: redirectTo !== "/" ? redirectTo : undefined,
    mode: mode === "signup" ? "signup" : mode === "reset" ? "reset" : undefined,
  });

  return Response.redirect(url, 302);
}
