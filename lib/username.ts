import { isReservedUsername } from "@/lib/reserved-profile-slugs";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

export type UsernameError = "required" | "too_short" | "too_long" | "invalid_chars" | "reserved";

export type UsernameValidation =
  | { ok: true; username: string }
  | { ok: false; error: UsernameError };

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

/** Rule for claiming or changing a username. Existing names that break it stay until changed. */
export function validateUsername(input: string): UsernameValidation {
  const username = normalizeUsername(input);
  if (!username) return { ok: false, error: "required" };
  if (!/^[a-z0-9_]+$/.test(username)) return { ok: false, error: "invalid_chars" };
  if (username.length < USERNAME_MIN_LENGTH) return { ok: false, error: "too_short" };
  if (username.length > USERNAME_MAX_LENGTH) return { ok: false, error: "too_long" };
  if (isReservedUsername(username)) return { ok: false, error: "reserved" };
  return { ok: true, username };
}

/** A starting suggestion from the email local part. Always passes `validateUsername`. */
export function suggestUsername(email: string): string {
  const local = email.split("@")[0] ?? "";
  let base = local
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, USERNAME_MAX_LENGTH);

  if (!base) base = "vibe";
  if (base.length < USERNAME_MIN_LENGTH || isReservedUsername(base)) {
    base = `${base}_dev`.slice(0, USERNAME_MAX_LENGTH);
  }
  return base;
}

export type UsernameAvailabilityReason = "taken" | "reserved" | "invalid";

/** Maps a validation error to the reason the availability API returns. */
export function availabilityReason(
  error: UsernameError,
): Exclude<UsernameAvailabilityReason, "taken"> {
  return error === "reserved" ? "reserved" : "invalid";
}

/** Valid alternatives to a taken or reserved name, best first, without duplicates. */
export function usernameCandidates(input: string, seed = Math.random): string[] {
  let base = normalizeUsername(input)
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!base) base = "vibe";
  const fit = (suffix: string) => `${base.slice(0, USERNAME_MAX_LENGTH - suffix.length)}${suffix}`;
  const digits = () => String(Math.floor(seed() * 900) + 100);

  const candidates = [fit("_dev"), fit(digits()), fit(`_${digits()}`), fit("_id"), fit(digits())];
  const seen = new Set<string>();
  return candidates.filter((name) => {
    if (seen.has(name) || !validateUsername(name).ok) return false;
    seen.add(name);
    return true;
  });
}
