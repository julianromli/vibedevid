import { escapeHtml } from "@/lib/auth/html";
import { renderOtpEmailHtml } from "@/lib/auth/otp-email-template";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE_NAME, type Locale } from "@/lib/locale";

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

/** OTP email language: site locale cookie, then Accept-Language, then Indonesian. */
export function resolveEmailLocale(headers: Headers | undefined | null): Locale {
  if (!headers) return DEFAULT_LOCALE;
  const cookieLocale = readCookie(headers.get("cookie"), LOCALE_COOKIE_NAME);
  if (cookieLocale) return isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  const preferred = headers
    .get("accept-language")
    ?.split(",")[0]
    ?.split("-")[0]
    ?.trim()
    .toLowerCase();
  return isLocale(preferred) ? preferred : DEFAULT_LOCALE;
}

type EmailCopy = {
  subject: string;
  preheader: (minutes: number) => string;
  heading: string;
  intro: (email: string) => string;
  expiry: (minutes: number) => string;
  noShare: string;
  ignore: string;
  footer: string;
};

// The code is never in the subject or preheader: both show on lock screens.
const COPY: Record<Locale, EmailCopy> = {
  id: {
    subject: "Kode masuk VibeDev ID kamu",
    preheader: (minutes) => `Berlaku ${minutes} menit. Jangan bagikan ke siapa pun.`,
    heading: "Kode masuk kamu",
    intro: (email) =>
      `Masukkan kode ini untuk masuk atau membuat akun VibeDev ID sebagai ${email}.`,
    expiry: (minutes) => `Kode berlaku ${minutes} menit dan cuma bisa dipakai sekali.`,
    noShare: "Jangan bagikan kode ini. Tim VibeDev ID tidak pernah memintanya.",
    ignore:
      "Bukan kamu yang minta? Abaikan saja email ini. Tanpa kode ini, tidak ada yang bisa masuk ke akun kamu.",
    footer: "Email ini dikirim otomatis. Balasan ke alamat ini tidak dibaca.",
  },
  en: {
    subject: "Your VibeDev ID sign-in code",
    preheader: (minutes) => `Expires in ${minutes} minutes. Don't share it with anyone.`,
    heading: "Your sign-in code",
    intro: (email) => `Enter this code to sign in or create your VibeDev ID account as ${email}.`,
    expiry: (minutes) => `This code expires in ${minutes} minutes and works once.`,
    noShare: "Don't share this code. The VibeDev ID team will never ask for it.",
    ignore: "Didn't ask for this? You can ignore this email. Nobody can sign in without this code.",
    footer: "This email was sent automatically. Replies to this address are not read.",
  },
};

export function buildOtpEmail(input: {
  otp: string;
  email: string;
  locale: Locale;
  expiresInMinutes: number;
}): {
  subject: string;
  text: string;
  html: string;
} {
  const copy = COPY[input.locale];
  const minutes = input.expiresInMinutes;
  const intro = copy.intro(input.email);
  const expiry = copy.expiry(minutes);

  const text = [
    copy.heading,
    "",
    intro,
    "",
    `    ${input.otp}`,
    "",
    expiry,
    "",
    copy.noShare,
    copy.ignore,
    "",
    "--",
    copy.footer,
    "https://vibedeveloper.id",
  ].join("\n");

  const html = renderOtpEmailHtml({
    lang: input.locale,
    subject: escapeHtml(copy.subject),
    preheader: escapeHtml(copy.preheader(minutes)),
    heading: escapeHtml(copy.heading),
    intro: escapeHtml(intro),
    code: escapeHtml(input.otp),
    expiry: escapeHtml(expiry),
    noShare: escapeHtml(copy.noShare),
    ignore: escapeHtml(copy.ignore),
    footer: escapeHtml(copy.footer),
  });

  return { subject: copy.subject, text, html };
}
