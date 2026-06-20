"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";
import { getProfileFn } from "@/lib/auth/profile-client";
import type { User } from "@/types/homepage";

export function useAuth() {
  const { data: session, isPending } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const isLoggedIn = Boolean(session?.user);

  useEffect(() => {
    let isMounted = true;

    const getFallbackUser = (userId: string, email: string, name?: string | null): User => ({
      id: userId,
      name: name || email.split("@")[0] || "User",
      email,
      avatar: "/vibedev-guest-avatar.png",
      username: "",
      role: null,
    });

    const hydrateProfile = async () => {
      if (isPending) return;

      if (!session?.user) {
        if (isMounted) {
          setUser(null);
          setAuthReady(true);
        }
        return;
      }

      const { id, email, name } = session.user;

      if (isMounted) {
        setUser(getFallbackUser(id, email, name));
      }

      try {
        const profile = await getProfileFn();

        if (!isMounted) return;

        if (profile) {
          setUser({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            avatar: profile.avatar || "/vibedev-guest-avatar.png",
            username: profile.username,
            role: profile.role ?? null,
          });
        }
      } catch (error) {
        console.error("[useAuth] Error fetching profile:", error);
      } finally {
        if (isMounted) {
          setAuthReady(true);
        }
      }
    };

    void hydrateProfile();

    return () => {
      isMounted = false;
    };
  }, [session, isPending]);

  return {
    isLoggedIn,
    user,
    authReady,
  };
}
