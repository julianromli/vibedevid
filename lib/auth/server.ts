import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { emailOTP } from "better-auth/plugins/email-otp";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getEmailDomain, newAccountEmailError, parseAllowedEmails } from "@/lib/auth/email-domain";
import { buildEmailOtpOptions, OTP_CONFIG, OTP_SEND_PATH } from "@/lib/auth/otp-config";
import { buildOtpEmail, resolveEmailLocale } from "@/lib/auth/otp-email";
import { guardOtpRequest } from "@/lib/auth/otp-request-guard";
import { previewTrustedOrigins } from "@/lib/auth/trusted-origins";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { clientIpFromHeaders, consumeWindowedRateLimit } from "@/lib/server/rate-limit";
import { getServerRuntimeSecrets } from "@/lib/server/runtime-secrets";

function getAuthConfig() {
  const secrets = getServerRuntimeSecrets();
  return {
    secret: secrets.betterAuthSecret,
    baseURL: secrets.betterAuthUrl,
    email: {
      from: secrets.emailFrom,
      resendApiKey: secrets.resendApiKey,
    },
    allowedEmails: parseAllowedEmails(secrets.newAccountAllowedEmails),
    previewHostSuffix: secrets.authPreviewHostSuffix,
  };
}

type AuthConfig = ReturnType<typeof getAuthConfig>;

function hasEmailDelivery(config: AuthConfig): boolean {
  return Boolean(config.email.resendApiKey && config.email.from);
}

/** Local dev without Resend prints the email to the console instead. */
function canSendEmail(config: AuthConfig): boolean {
  return hasEmailDelivery(config) || process.env.NODE_ENV !== "production";
}

async function sendAuthEmail(
  config: AuthConfig,
  input: { to: string; subject: string; html: string; text: string },
) {
  if (!hasEmailDelivery(config)) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[auth] ${input.subject} for ${input.to}: ${input.text}`);
      return;
    }
    throw new Error("RESEND_API_KEY and EMAIL_FROM are required to send auth emails");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.email.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.email.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    // Better Auth swallows errors thrown from sendVerificationOTP, so log here.
    console.error(`[auth] Resend email failed (${response.status}): ${body.slice(0, 300)}`);
    throw new Error(`Resend email failed (${response.status})`);
  }
}

export function createAuth() {
  const config = getAuthConfig();
  const db = getDb();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.authUser,
        session: schema.authSession,
        account: schema.authAccount,
        verification: schema.authVerification,
      },
    }),
    secret: config.secret,
    baseURL: config.baseURL,
    // Production trusts only baseURL. A Cloudflare preview of this worker also trusts its own origin.
    trustedOrigins: (request) => previewTrustedOrigins(request, config.previewHostSuffix),
    // Email OTP is the only sign-in method. No passwords, no OAuth.
    emailAndPassword: { enabled: false },
    plugins: [
      emailOTP(
        buildEmailOtpOptions(async ({ email, otp }, ctx) => {
          const locale = resolveEmailLocale(ctx?.request?.headers ?? ctx?.headers);
          const message = buildOtpEmail({
            otp,
            email,
            locale,
            expiresInMinutes: Math.round(OTP_CONFIG.expiresInSeconds / 60),
          });
          await sendAuthEmail(config, { to: email, ...message });
        }),
      ),
      tanstackStartCookies(),
    ],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        const headers = ctx.request?.headers ?? ctx.headers ?? new Headers();
        const error = await guardOtpRequest({
          path: ctx.path,
          body: ctx.body,
          ip: clientIpFromHeaders(headers),
          emailConfigured: canSendEmail(config),
          userExists: async (email) =>
            Boolean(await ctx.context.internalAdapter.findUserByEmail(email)),
          consume: (bucket, limit, windowMs) => consumeWindowedRateLimit(bucket, limit, windowMs),
          allowedEmails: config.allowedEmails,
        });
        if (!error) return;

        throw new APIError(
          error.status,
          {
            message: error.message,
            code: error.code,
            domain: error.domain,
            retryAfterSeconds: error.retryAfterSeconds,
          },
          error.retryAfterSeconds ? { "Retry-After": String(error.retryAfterSeconds) } : undefined,
        );
      }),
      // The UI runs its resend countdown from the server's send time.
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== OTP_SEND_PATH) return;
        const returned = ctx.context.returned;
        if (!returned || returned instanceof APIError || returned instanceof Response) return;
        return ctx.json({ success: true, sentAt: new Date().toISOString() });
      }),
    },
    databaseHooks: {
      user: {
        create: {
          // Backstop: the send hook already blocks new accounts outside the allowlist.
          before: async (user) => {
            const error = newAccountEmailError(user.email, {
              existingUser: false,
              allowedEmails: config.allowedEmails,
            });
            if (error) {
              throw new APIError("BAD_REQUEST", {
                code: error.code,
                message: error.domain
                  ? `Domain ${getEmailDomain(user.email)} is not allowed for new accounts.`
                  : "Invalid email format.",
              });
            }
          },
        },
      },
    },
  });
}

let _auth: ReturnType<typeof createAuth> | null = null;

export function getAuth() {
  if (!_auth) {
    _auth = createAuth();
  }
  return _auth;
}

export const auth = new Proxy({} as ReturnType<typeof createAuth>, {
  get(_target, prop) {
    return Reflect.get(getAuth(), prop);
  },
});
