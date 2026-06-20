import { useMemo } from "react";
import {
  Link,
  notFound,
  redirect,
  useLocation,
  useNavigate,
  useRouter as useTanStackRouter,
  useSearch,
} from "@tanstack/react-router";

export { Link, notFound, redirect, useLocation, useNavigate, useSearch };

/** Next.js-compatible router with refresh → invalidate. */
export function useRouter() {
  const router = useTanStackRouter();
  return useMemo(
    () => ({
      ...router,
      refresh: () => router.invalidate(),
      push: (href: string) => router.navigate({ to: href }),
      replace: (href: string) => router.navigate({ to: href, replace: true }),
      back: () => router.history.back(),
    }),
    [router],
  );
}
/** Compat helper mirroring Next.js useSearchParams via TanStack location search. */
export function useSearchParams() {
  const { searchStr } = useLocation();
  return useMemo(() => new URLSearchParams(searchStr ?? ""), [searchStr]);
}

/** Compat helper mirroring Next.js usePathname. */
export function usePathname() {
  return useLocation().pathname;
}
