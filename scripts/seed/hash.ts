import { hash } from "bcryptjs";

/** Match Better Auth local hashing in `lib/auth/server.ts`. */
export function hashSeedPassword(password: string): Promise<string> {
  return hash(password, 10);
}
