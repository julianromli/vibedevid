/**
 * Structured data (JSON-LD) for the home page.
 *
 * Extracted from the page body so the home composition stays focused on layout
 * and data wiring. Injects the Organization and FAQ schema markup.
 */

import { FAQ_DATA } from "@/lib/constants/faqs";

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "VibeDev ID",
  alternateName: ["Komunitas Vibe Coding Indonesia", "VibeDev Indonesia"],
  url: "https://vibedevid.com",
  logo: "https://vibedevid.com/vibedev-logo.png",
  description:
    "Komunitas vibe coding Indonesia No. 1 untuk developer, AI enthusiasts, dan tech innovators. Tempat belajar coding pake AI, kolaborasi project open source, dan networking dengan vibe coder Indonesia terbaik.",
  foundingDate: "2024",
  address: {
    "@type": "PostalAddress",
    addressCountry: "ID",
    addressRegion: "Indonesia",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Community Support",
    email: "hello@vibedevid.com",
  },
  sameAs: [
    "https://github.com/vibedevid",
    "https://twitter.com/vibedevid",
    "https://linkedin.com/company/vibedevid",
  ],
  memberOf: {
    "@type": "Organization",
    name: "Indonesian Developer Community",
  },
  keywords: [
    "vibe coding",
    "komunitas vibe coding",
    "komunitas vibe coding indonesia",
    "vibe coder indonesia",
    "coding pake AI",
    "AI untuk coding",
    "developer indonesia",
    "open source indonesia",
  ],
  audience: {
    "@type": "Audience",
    audienceType: "Developers, AI Enthusiasts, Tech Innovators",
    geographicArea: "Indonesia",
  },
};

export function HomeStructuredData() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_DATA.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        id="organization-schema"
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema must be injected as raw script content.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }}
      />
      <script
        id="faq-schema"
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema must be injected as raw script content.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
