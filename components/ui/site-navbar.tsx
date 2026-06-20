"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { Navbar, type NavbarProps } from "@/components/ui/navbar";

/**
 * Navbar wired to the root-context current user.
 *
 * Use this in routes/pages instead of constructing <Navbar> with manual
 * isLoggedIn/user props. Explicit props still override the context value
 * (useful for routes that load a richer user object in their own loader).
 */
export function SiteNavbar(
  props: Omit<NavbarProps, "isLoggedIn" | "user"> &
    Partial<Pick<NavbarProps, "isLoggedIn" | "user">>,
) {
  const currentUser = useCurrentUser();

  const user = props.user ?? (currentUser ? { ...currentUser, name: currentUser.name } : undefined);
  const isLoggedIn = props.isLoggedIn ?? Boolean(currentUser);

  return <Navbar {...props} isLoggedIn={isLoggedIn} user={user} />;
}
