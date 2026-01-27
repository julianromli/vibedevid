# VibeDev ID

**When the Codes Meet the Vibes** 🚀

VibeDev ID adalah komunitas vibrant developer, AI enthusiasts, dan tech innovators Indonesia yang punya visi dan passion yang sama untuk bikin produk digital yang keren. Kami menghubungkan creator yang sepikiran untuk kolaborasi, belajar, dan berkembang bareng.

_Indonesia's premier community for developers, vibe coders, and AI enthusiasts. Showcase projects, collaborate, network, and level up your skills in web, mobile, and AI development._

## Features

- 🔐 **User Authentication** - Secure login with Supabase Auth (email + OAuth)
- 👤 **Developer Profiles** - Customizable profiles with bio, skills, and social links
- 📝 **Project Showcase** - Share dan showcase project keren lo
- 💬 **Community Interaction** - Comments, likes, dan diskusi project
- 🤝 **Networking & Collaboration** - Connect sama developer yang sepikiran
- 📰 **Blog System** - Rich text editor dengan Novel/TipTap untuk artikel teknis
- 📊 **Views Tracking** - Session-based analytics untuk project insights
- 🤖 **AI Leaderboard** - Ranking dan showcase AI tools favorit komunitas
- 🗓️ **Community Calendar** - Event dan activity tracker
- 🌙 **Dark/Light Mode** - UI theme yang nyaman mata
- 📱 **Responsive Design** - Perfect di semua device
- 🏷️ **Project Categories** - Personal Web, SaaS, Landing Page, dan lainnya
- ❤️ **Like System** - Like project yang lo suka
- 🔍 **Discovery** - Filter dan cari project berdasarkan kategori
- 🖼️ **Progressive Image Loading** - Blur placeholders dengan lazy loading
- 🌍 **Internationalization** - Full support English dan Indonesia (next-intl)
- 🛡️ **Spam Protection** - Email domain whitelist dan bot protection

## Tech Stack

- **Framework**: Next.js 16.0.10 with App Router
- **Language**: TypeScript 5.x
- **Database**: Supabase (PostgreSQL) with RLS policies
- **Authentication**: Supabase Auth (email/password + OAuth)
- **Styling**: Tailwind CSS v4.1.9
- **UI Components**: Radix UI + shadcn/ui (50+ components)
- **Animations**: Motion 12.23.12
- **Rich Text**: Novel 1.0.2 + TipTap 3.14.0
- **Icons**: Lucide React 0.562.0
- **Fonts**: Geist Sans & Geist Mono
- **Internationalization**: next-intl 4.7.0
- **Forms**: React Hook Form + Zod
- **Testing**: Playwright 1.55.0 (E2E) + Vitest 4.0.18 (unit)
- **Code Quality**: Biome 2.3.10 (linter + formatter)

## Getting Started

### Prerequisites

- Node.js 18+ or **Bun** (recommended)
- A Supabase account and project

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/vibedevid_v0.git
cd vibedevid_v0
```

2. Install dependencies:

```bash
bun install

# or

npm install

# or

pnpm install
```

3. Set up environment variables:

```bash
cp .env.local.example .env.local
```

4. Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
UPLOADTHING_TOKEN=your-uploadthing-token-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

5. Set up the database:

Run the SQL scripts in the `scripts/` folder in your Supabase SQL editor:
- `01_create_tables.sql` - Creates the database schema
- `02_seed_data.sql` - Adds sample data
- `03_create_storage_bucket.sql` - Sets up file storage

6. Run the development server:

```bash
bun dev

# or

npm run dev

# or

pnpm dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Commands

```bash
# Install dependencies
bun install

# Development server (Turbopack is default in Next.js 16)
bun dev

# Build for production
bun build

# Type checking (CRITICAL: build ignores TS errors via ignoreBuildErrors: true)
bun tsc --noEmit

# Linting & Formatting (Biome)
bun lint
bun format

# E2E tests (Playwright) - runs all tests in tests/ directory
bunx playwright test

# Run unit tests only
bunx playwright test tests/unit/
```

## Environment Variables

| Variable | Description | Required |
| -------- | ----------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (keep secret!) | Yes |
| `UPLOADTHING_TOKEN` | Your UploadThing API token (keep secret!) | Yes |
| `NEXT_PUBLIC_SITE_URL` | Your site URL (for production) | Yes |

## Database Schema

### Core Tables

**users** - Extended auth profiles with social links and bio

**projects** - Project showcase with slug-based URLs for SEO

**comments** - Unified comments system for both Blog and Projects

**likes** - User likes dengan unique constraint (one like per user per project)

**views** - Session-based views tracking with 30-minute timeout

**posts** - Blog posts dengan rich text content

**post_tags** - Blog tag categorization

### Security

- Row Level Security (RLS) enabled on all tables
- Public read access untuk semua data
- Authenticated insert/update untuk data milik user sendiri
- Guest comments diizinkan dengan author_name field
- Admin role diperlukan untuk moderation

## Project Structure

```
├── app/                      # Next.js App Router
│   ├── [username]/          # Dynamic user profile pages
│   ├── project/
│   │   ├── [slug]/         # Project detail pages (slug-based)
│   │   ├── submit/         # Submit new project (auth required)
│   │   └── list/           # Project listing with filters
│   ├── blog/
│   │   ├── page.tsx        # Blog listing
│   │   ├── [id]/           # Blog post detail
│   │   └── editor/         # Rich text blog editor
│   ├── admin/              # Admin dashboard
│   ├── calendar/           # Community calendar
│   ├── terms/              # Terms page
│   ├── user/auth/          # Authentication pages
│   └── layout.tsx          # Root layout with providers
├── components/
│   ├── ui/                 # 50+ shadcn/ui components
│   ├── sections/           # Page sections (hero, showcase, faq)
│   ├── blog/               # Blog-specific components
│   └── project/            # Project-specific components
├── hooks/                  # Custom React hooks
├── lib/
│   ├── actions/            # Server actions (comments, blog, projects)
│   ├── supabase/           # Supabase client configuration
│   └── server/             # Server utilities
├── types/                  # TypeScript type definitions
├── scripts/                # Database migrations (15+ SQL files)
├── tests/                  # Playwright E2E tests
├── messages/               # i18n messages (en.json, id.json)
├── biome.json              # Biome configuration
├── next.config.mjs         # Next.js configuration
└── tsconfig.json           # TypeScript configuration
```

## Key Features Deep Dive

### Comments System

Centralized comments component yang works untuk both Blog dan Project.

```tsx
import { CommentSection } from '@/components/ui/comment-section'

<CommentSection
  entityType="post"        // or "project"
  entityId={id}
  initialComments={comments}
  isLoggedIn={!!user}
/>
```

### Views Tracking

Session-based analytics dengan:
- 30-minute session timeout
- IP + User Agent fingerprinting
- Bot protection (user agent filtering)
- Unique visitor counting

### Progressive Image Loading

- SVG blur placeholders
- Intersection Observer lazy loading
- AVIF/WebP automatic optimization
- Client-safe processing (no sharp in client bundle)

### Email Domain Whitelist

Registration dibatasi ke domain terpercaya:
- gmail.com, yahoo.com, outlook.com
- dan 20+ domain edukasi/tech lain

## Contributing

Kami welcome kontribusi dari semua developer! 🎉

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Submit a pull request

### Development Guidelines

- Follow TypeScript strict mode
- Use Tailwind CSS for styling
- Biome will auto-format on commit
- Write descriptive commit messages (Conventional Commits)
- Test your changes on both desktop and mobile
- Maintain the informal but professional Indonesian tone in UI copy

### Code Style

- 2-space indentation, no semicolons, single quotes
- Biome enforces unified linting + formatting
- `@/` prefix untuk absolute imports
- Group imports: React → Third-party → Internal

## License

This project is licensed under the MIT License.

---

Built with ❤️ by VibeDev ID Community
