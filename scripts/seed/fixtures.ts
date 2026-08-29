export const SEED_PASSWORD = "VibeDevLocal1!";
export const SEED_AVATAR = "/optimized/professional-woman-dark-hair-512.avif";
export const SEED_COVER = "/optimized/professional-woman-dark-hair-512.avif";

export function seedUuid(n: number): string {
  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
}

export type SeedUser = {
  id: string;
  email: string;
  name: string;
  username: string;
  displayName: string;
  bio: string;
  location: string;
  website: string;
  githubUrl: string;
  role: 0 | 1 | 2;
};

export type SeedCategory = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  sortOrder: number;
};

export type SeedProject = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  websiteUrl: string;
  authorId: string;
  featured: boolean;
  tags: string[];
};

export type SeedPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  authorId: string;
  status: "published" | "draft";
  featured: boolean;
  readTimeMinutes: number;
  tags: string[];
  content: { type: "doc"; content: unknown[] };
};

export type SeedParentRef = {
  id: string;
  userId: string;
  projectSlug?: string;
  postSlug?: string;
};

export type SeedComment = SeedParentRef & {
  content: string;
  authorName?: string;
};

export type SeedEvent = {
  id: string;
  slug: string;
  name: string;
  description: string;
  date: string;
  time: string;
  locationType: "online" | "offline" | "hybrid";
  locationDetail: string;
  organizer: string;
  registrationUrl: string;
  category: "workshop" | "meetup" | "conference" | "hackathon";
  status: "upcoming" | "past";
  approved: boolean;
  submittedBy: string;
};

export type SeedFaq = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
};

export type SeedVideo = {
  id: string;
  title: string;
  description: string;
  videoId: string;
  publishedAt: string;
  viewCount: string;
  position: number;
};

export type SeedTestimonial = {
  id: string;
  fullName: string;
  role: string;
  body: string;
  status: "pending" | "approved" | "rejected";
};

export type SeedReport = {
  id: string;
  commentId: string;
  reporterId: string;
  reason: string;
  status: string;
};

export const SEED_USERS: SeedUser[] = [
  {
    id: "seed-admin",
    email: "seed.admin@gmail.com",
    name: "Admin VibeDev",
    username: "seedadmin",
    displayName: "Admin VibeDev",
    bio: "Local admin account for dashboard and moderation.",
    location: "Jakarta, ID",
    website: "https://vibedevid.com",
    githubUrl: "https://github.com/vibedevid",
    role: 0,
  },
  {
    id: "seed-moderator",
    email: "seed.moderator@gmail.com",
    name: "Moderator VibeDev",
    username: "seedmoderator",
    displayName: "Moderator VibeDev",
    bio: "Local moderator account for event and comment review.",
    location: "Bandung, ID",
    website: "https://vibedevid.com",
    githubUrl: "https://github.com/vibedevid",
    role: 1,
  },
  {
    id: "seed-sarah",
    email: "seed.sarah@gmail.com",
    name: "Sarah Chen",
    username: "sarahchen",
    displayName: "Sarah Chen",
    bio: "Full-stack developer who builds React and AI products.",
    location: "San Francisco, CA",
    website: "https://sarahchen.dev",
    githubUrl: "https://github.com/sarahchen",
    role: 2,
  },
  {
    id: "seed-marcus",
    email: "seed.marcus@gmail.com",
    name: "Marcus Rodriguez",
    username: "marcusrodriguez",
    displayName: "Marcus Rodriguez",
    bio: "UI/UX designer and frontend developer.",
    location: "Austin, TX",
    website: "https://marcusrodriguez.design",
    githubUrl: "https://github.com/marcusrodriguez",
    role: 2,
  },
];

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    id: seedUuid(1),
    name: "landing-page",
    displayName: "Landing Page",
    description: "Marketing and launch pages",
    icon: "layout",
    color: "#7c3aed",
    sortOrder: 1,
  },
  {
    id: seedUuid(2),
    name: "personal-web",
    displayName: "Personal Web",
    description: "Portfolios and personal sites",
    icon: "user",
    color: "#2563eb",
    sortOrder: 2,
  },
  {
    id: seedUuid(3),
    name: "saas",
    displayName: "SaaS",
    description: "Software products and dashboards",
    icon: "cloud",
    color: "#059669",
    sortOrder: 3,
  },
  {
    id: seedUuid(4),
    name: "education",
    displayName: "Education",
    description: "Learning products and courses",
    icon: "book",
    color: "#d97706",
    sortOrder: 4,
  },
  {
    id: seedUuid(5),
    name: "mobile",
    displayName: "Mobile",
    description: "Mobile apps and PWA",
    icon: "smartphone",
    color: "#dc2626",
    sortOrder: 5,
  },
  {
    id: seedUuid(6),
    name: "ai-tool",
    displayName: "AI Tool",
    description: "AI-assisted products",
    icon: "sparkles",
    color: "#0891b2",
    sortOrder: 6,
  },
];

const longDescription = (topic: string) =>
  `${topic} This local seed project is long enough for the public project cards and the submit form limits. It exists so contributors can browse lists, filters, likes, and comments without production data.`;

export const SEED_PROJECTS: SeedProject[] = [
  {
    slug: "seed-pointer-ai",
    title: "Pointer AI landing page",
    tagline: "A launch page for an AI design tool",
    description: longDescription("Modern landing page with motion and a clear product story."),
    category: "landing-page",
    websiteUrl: "https://pointer.so",
    authorId: "seed-sarah",
    featured: true,
    tags: ["ai", "landing", "motion"],
  },
  {
    slug: "seed-liquid-glass",
    title: "Liquid Glass navigation",
    tagline: "Glass-morphism navigation for personal sites",
    description: longDescription("Navigation with liquid glass effects and smooth transitions."),
    category: "personal-web",
    websiteUrl: "https://stripe.com",
    authorId: "seed-marcus",
    featured: false,
    tags: ["css", "nav", "portfolio"],
  },
  {
    slug: "seed-portfolio-v0",
    title: "Portfolio template",
    tagline: "Clean personal site built with Tailwind",
    description: longDescription("A portfolio template for developers who ship often."),
    category: "personal-web",
    websiteUrl: "https://linear.app",
    authorId: "seed-sarah",
    featured: false,
    tags: ["portfolio", "nextjs"],
  },
  {
    slug: "seed-marketing-site",
    title: "Marketing website",
    tagline: "Conversion-focused marketing layout",
    description: longDescription("A marketing site with sections for social proof and pricing."),
    category: "landing-page",
    websiteUrl: "https://vercel.com",
    authorId: "seed-marcus",
    featured: false,
    tags: ["marketing", "seo"],
  },
  {
    slug: "seed-cyberpunk-dashboard",
    title: "Cyberpunk dashboard",
    tagline: "SaaS dashboard with neon charts",
    description: longDescription("A dashboard UI for metrics, alerts, and team settings."),
    category: "saas",
    websiteUrl: "https://github.com",
    authorId: "seed-admin",
    featured: true,
    tags: ["saas", "dashboard"],
  },
  {
    slug: "seed-gpt-chatroom",
    title: "Chatroom using GPT",
    tagline: "Realtime chat with an AI assistant",
    description: longDescription("A chat product that shows streaming replies and rooms."),
    category: "saas",
    websiteUrl: "https://openai.com",
    authorId: "seed-sarah",
    featured: false,
    tags: ["ai", "chat"],
  },
  {
    slug: "seed-pijar-mahir",
    title: "Pijar Mahir",
    tagline: "Learning platform for practical skills",
    description: longDescription("An education product with courses, progress, and certificates."),
    category: "education",
    websiteUrl: "https://example.com/pijar",
    authorId: "seed-marcus",
    featured: false,
    tags: ["edtech", "courses"],
  },
  {
    slug: "seed-mobile-notes",
    title: "Pocket Notes",
    tagline: "Offline-first notes for phones",
    description: longDescription("A mobile notes app with sync, tags, and a compact editor."),
    category: "mobile",
    websiteUrl: "https://example.com/notes",
    authorId: "seed-sarah",
    featured: false,
    tags: ["mobile", "pwa"],
  },
  {
    slug: "seed-ai-prompt-kit",
    title: "Prompt Kit",
    tagline: "Prompt library for product teams",
    description: longDescription("An AI tool that stores, versions, and shares prompt packs."),
    category: "ai-tool",
    websiteUrl: "https://example.com/prompt-kit",
    authorId: "seed-marcus",
    featured: true,
    tags: ["ai", "prompts"],
  },
];

function tipTapDoc(heading: string, body: string) {
  return {
    type: "doc" as const,
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: heading }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: body }],
      },
    ],
  };
}

export const SEED_POST_TAGS = [
  { id: seedUuid(20), name: "Community", slug: "community" },
  { id: seedUuid(21), name: "AI", slug: "ai" },
  { id: seedUuid(22), name: "Draft", slug: "draft" },
];

export const SEED_POSTS: SeedPost[] = [
  {
    id: seedUuid(30),
    slug: "seed-welcome-to-local-dev",
    title: "Welcome to local VibeDev ID",
    excerpt: "How to use the seed database when you clone this repo.",
    authorId: "seed-admin",
    status: "published",
    featured: true,
    readTimeMinutes: 4,
    tags: ["community"],
    content: tipTapDoc(
      "Start here",
      "This published post is seed data. Use it to check the blog list, the post page, comments, and likes.",
    ),
  },
  {
    id: seedUuid(31),
    slug: "seed-shipping-with-ai",
    title: "Shipping weekend projects with AI",
    excerpt: "A short note on vibe coding in a community setting.",
    authorId: "seed-sarah",
    status: "published",
    featured: false,
    readTimeMinutes: 6,
    tags: ["ai", "community"],
    content: tipTapDoc(
      "Keep the loop short",
      "Write a small slice, preview it, then share it. This post exists so the blog grid is not empty.",
    ),
  },
  {
    id: seedUuid(32),
    slug: "seed-draft-editor-notes",
    title: "Draft: editor notes",
    excerpt: "Unpublished draft for the admin blog board.",
    authorId: "seed-marcus",
    status: "draft",
    featured: false,
    readTimeMinutes: 3,
    tags: ["draft"],
    content: tipTapDoc("Not public", "This draft must not appear on the public blog list."),
  },
];

export const SEED_COMMENTS: SeedComment[] = [
  {
    id: seedUuid(40),
    userId: "seed-marcus",
    projectSlug: "seed-pointer-ai",
    content: "The motion on the hero is clean. Good reference for a launch page.",
  },
  {
    id: seedUuid(41),
    userId: "seed-sarah",
    projectSlug: "seed-liquid-glass",
    content: "How did you get the glass edge to stay sharp on mobile?",
  },
  {
    id: seedUuid(42),
    userId: "seed-moderator",
    postSlug: "seed-welcome-to-local-dev",
    content: "Useful for new contributors. Keep this post in the seed.",
  },
  {
    id: seedUuid(43),
    userId: "seed-marcus",
    postSlug: "seed-shipping-with-ai",
    content: "The short loop advice matches how I ship weekend work.",
  },
];

export const SEED_LIKES: SeedParentRef[] = [
  { id: seedUuid(50), userId: "seed-marcus", projectSlug: "seed-pointer-ai" },
  { id: seedUuid(51), userId: "seed-admin", projectSlug: "seed-pointer-ai" },
  { id: seedUuid(52), userId: "seed-sarah", projectSlug: "seed-cyberpunk-dashboard" },
  { id: seedUuid(53), userId: "seed-marcus", postSlug: "seed-welcome-to-local-dev" },
  { id: seedUuid(54), userId: "seed-sarah", postSlug: "seed-shipping-with-ai" },
];

export const SEED_VIEWS: SeedParentRef[] = [
  { id: seedUuid(60), userId: "seed-marcus", projectSlug: "seed-pointer-ai" },
  { id: seedUuid(61), userId: "seed-admin", projectSlug: "seed-liquid-glass" },
  { id: seedUuid(62), userId: "seed-sarah", postSlug: "seed-welcome-to-local-dev" },
];

export const SEED_EVENTS: SeedEvent[] = [
  {
    id: seedUuid(70),
    slug: "seed-jakarta-meetup",
    name: "Jakarta vibe meetup",
    description: "Approved upcoming meetup so the event list has a future date.",
    date: "2030-03-15",
    time: "18:30:00",
    locationType: "offline",
    locationDetail: "Jakarta, Indonesia",
    organizer: "VibeDev ID",
    registrationUrl: "https://example.com/jakarta-meetup",
    category: "meetup",
    status: "upcoming",
    approved: true,
    submittedBy: "seed-sarah",
  },
  {
    id: seedUuid(71),
    slug: "seed-past-workshop",
    name: "Past AI workshop",
    description: "Approved past workshop so the list can show a past state.",
    date: "2024-11-02",
    time: "09:00:00",
    locationType: "online",
    locationDetail: "Zoom",
    organizer: "VibeDev ID",
    registrationUrl: "https://example.com/past-workshop",
    category: "workshop",
    status: "past",
    approved: true,
    submittedBy: "seed-marcus",
  },
  {
    id: seedUuid(72),
    slug: "seed-pending-hackathon",
    name: "Pending hackathon",
    description: "Unapproved event for the admin moderation board.",
    date: "2030-06-20",
    time: "10:00:00",
    locationType: "hybrid",
    locationDetail: "Bandung + online",
    organizer: "Local crew",
    registrationUrl: "https://example.com/pending-hackathon",
    category: "hackathon",
    status: "upcoming",
    approved: false,
    submittedBy: "seed-marcus",
  },
];

export const SEED_FAQS: SeedFaq[] = [
  {
    id: seedUuid(80),
    question: "What is this seed database?",
    answer: "Demo rows for local development. They are safe to delete and re-seed.",
    sortOrder: 1,
  },
  {
    id: seedUuid(81),
    question: "How do I log in locally?",
    answer: "Use the seed Gmail accounts and the shared password printed by bun run db:seed.",
    sortOrder: 2,
  },
];

export const SEED_VIDEOS: SeedVideo[] = [
  {
    id: seedUuid(90),
    title: "Community highlight 1",
    description: "Seed video so the homepage showcase is not empty.",
    videoId: "dQw4w9WgXcQ",
    publishedAt: "2025-01-15",
    viewCount: "1200",
    position: 1,
  },
  {
    id: seedUuid(91),
    title: "Community highlight 2",
    description: "Second seed video for the showcase grid.",
    videoId: "9bZkp7q19f0",
    publishedAt: "2025-03-01",
    viewCount: "860",
    position: 2,
  },
];

export const SEED_TESTIMONIALS: SeedTestimonial[] = [
  {
    id: seedUuid(100),
    fullName: "Ayu Pratama",
    role: "Frontend engineer",
    body: "I found collaborators here and shipped a weekend product.",
    status: "approved",
  },
  {
    id: seedUuid(101),
    fullName: "Bimo Santoso",
    role: "Product designer",
    body: "Pending review so the testimonials admin tab has a queue.",
    status: "pending",
  },
];

export const SEED_REPORTS: SeedReport[] = [
  {
    id: seedUuid(110),
    commentId: seedUuid(42),
    reporterId: "seed-sarah",
    reason: "Seed report so the comments moderation board is not empty.",
    status: "pending",
  },
];

function unique(values: string[], label: string) {
  if (new Set(values).size !== values.length) {
    throw new Error(`Seed fixtures have duplicate ${label}`);
  }
}

function hasXorParent(row: { projectSlug?: string; postSlug?: string }) {
  return Boolean(row.projectSlug) !== Boolean(row.postSlug);
}

export function assertSeedFixtures(): void {
  unique(
    SEED_USERS.map((user) => user.id),
    "user ids",
  );
  unique(
    SEED_USERS.map((user) => user.email),
    "user emails",
  );
  unique(
    SEED_USERS.map((user) => user.username),
    "usernames",
  );
  unique(
    SEED_PROJECTS.map((project) => project.slug),
    "project slugs",
  );
  unique(
    SEED_POSTS.map((post) => post.slug),
    "post slugs",
  );
  unique(
    SEED_EVENTS.map((event) => event.slug),
    "event slugs",
  );

  for (const user of SEED_USERS) {
    if (!user.email.endsWith("@gmail.com")) {
      throw new Error(`Seed email ${user.email} must use gmail.com`);
    }
    if (user.role !== 0 && user.role !== 1 && user.role !== 2) {
      throw new Error(`Seed user ${user.id} has an invalid role`);
    }
  }

  const categoryNames = new Set(SEED_CATEGORIES.map((category) => category.name));
  for (const project of SEED_PROJECTS) {
    if (!categoryNames.has(project.category)) {
      throw new Error(`Project ${project.slug} uses unknown category ${project.category}`);
    }
  }

  for (const row of [...SEED_COMMENTS, ...SEED_LIKES, ...SEED_VIEWS]) {
    if (!hasXorParent(row)) {
      throw new Error(`Seed row ${row.id} must set exactly one parent`);
    }
  }

  const commentIds = new Set(SEED_COMMENTS.map((comment) => comment.id));
  for (const report of SEED_REPORTS) {
    if (!commentIds.has(report.commentId)) {
      throw new Error(`Report ${report.id} points at an unknown comment`);
    }
  }
}

export function seedOwnedIds() {
  return {
    userIds: SEED_USERS.map((user) => user.id),
    categoryIds: SEED_CATEGORIES.map((category) => category.id),
    projectSlugs: SEED_PROJECTS.map((project) => project.slug),
    postIds: SEED_POSTS.map((post) => post.id),
    postSlugs: SEED_POSTS.map((post) => post.slug),
    categoryNames: SEED_CATEGORIES.map((category) => category.name),
    postTagIds: SEED_POST_TAGS.map((tag) => tag.id),
    commentIds: SEED_COMMENTS.map((comment) => comment.id),
    likeIds: SEED_LIKES.map((like) => like.id),
    viewIds: SEED_VIEWS.map((view) => view.id),
    eventIds: SEED_EVENTS.map((event) => event.id),
    faqIds: SEED_FAQS.map((faq) => faq.id),
    videoIds: SEED_VIDEOS.map((video) => video.id),
    testimonialIds: SEED_TESTIMONIALS.map((row) => row.id),
    reportIds: SEED_REPORTS.map((report) => report.id),
  };
}
