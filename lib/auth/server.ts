import { compare, hash } from "bcryptjs";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
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
    google: {
      clientId: secrets.googleClientId,
      clientSecret: secrets.googleClientSecret,
    },
    github: {
      clientId: secrets.githubClientId,
      clientSecret: secrets.githubClientSecret,
    },
  };
}

async function sendAuthEmail(input: { to: string; subject: string; html: string; text: string }) {
  const config = getAuthConfig();

  if (!config.email.resendApiKey || !config.email.from) {
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
    throw new Error(`Resend email failed (${response.status}): ${body}`);
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
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        await sendAuthEmail({
          to: user.email,
          subject: "Reset your VibeDev ID password",
          text: `Reset your VibeDev ID password: ${url}`,
          html: `
            <p>Hi ${user.name || "there"},</p>
            <p>Click the link below to reset your VibeDev ID password.</p>
            <p><a href="${url}">Reset password</a></p>
            <p>If you did not request this, you can ignore this email.</p>
          `,
        });
      },
      password: {
        hash: async (password) => hash(password, 10),
        verify: async ({ hash: passwordHash, password }) => compare(password, passwordHash),
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url }) => {
        await sendAuthEmail({
          to: user.email,
          subject: "Verify your VibeDev ID email",
          text: `Verify your VibeDev ID email: ${url}`,
          html: `
            <p>Hi ${user.name || "there"},</p>
            <p>Click the link below to verify your VibeDev ID email address.</p>
            <p><a href="${url}">Verify email</a></p>
            <p>If you did not create an account, you can ignore this email.</p>
          `,
        });
      },
    },
    socialProviders: {
      google: {
        clientId: config.google.clientId,
        clientSecret: config.google.clientSecret,
      },
      github: {
        clientId: config.github.clientId,
        clientSecret: config.github.clientSecret,
      },
    },
    plugins: [tanstackStartCookies()],
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
