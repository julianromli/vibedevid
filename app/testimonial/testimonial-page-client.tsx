"use client";

import { useTranslation } from "react-i18next";
import { TestimonialForm } from "@/components/testimonial/testimonial-form";
import { Footer } from "@/components/ui/footer";
import { Navbar } from "@/components/ui/navbar";
import { useAuth } from "@/hooks/useAuth";

export function TestimonialPageClient() {
  const { t } = useTranslation("testimonialSubmit");
  const { isLoggedIn, user } = useAuth();

  return (
    <div className="bg-background min-h-screen">
      <Navbar
        showNavigation={true}
        isLoggedIn={isLoggedIn}
        user={
          user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                username: user.username,
                role: user.role,
              }
            : undefined
        }
      />

      <main id="main-content" className="pt-28 pb-16">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <header className="mb-8 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-balance">{t("title")}</h1>
            <p className="text-muted-foreground text-pretty">{t("description")}</p>
          </header>
          <TestimonialForm />
        </div>
      </main>

      <Footer />
    </div>
  );
}
