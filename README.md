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
- 🎉 **Events System** - Submit dan browse community events dengan approval workflow
- 📈 **User Dashboard** - Personal dashboard untuk manage projects dan activity
- 🛠️ **Admin Dashboard** - Full admin panel dengan moderation tools
- ⌨️ **Command Palette** - Quick navigation dan search (cmdk)
- 🎬 **Vibe Videos** - Video content section untuk tutorial dan highlights
- 🌙 **Dark/Light Mode** - UI theme yang nyaman mata
- 📱 **Responsive Design** - Perfect di semua device
- 🏷️ **Project Categories** - Personal Web, SaaS, Landing Page, dan lainnya
- ❤️ **Like System** - Like project yang lo suka
- 🔍 **Discovery** - Filter dan cari project berdasarkan kategori
- 🖼️ **Progressive Image Loading** - Blur placeholders dengan lazy loading
- 🌍 **Internationalization** - Full support English dan Indonesia (next-intl)
- 🛡️ **Spam Protection** - Email domain whitelist dan bot protection
- 📊 **Analytics Dashboard** - Charts dan data visualization (recharts)
- ❓ **FAQ System** - Frequently asked questions management
- 🚨 **Content Moderation** - Report dan moderation system

## Tech Stack

- **Frontend**: React 19 + Vite 8 + React Router
- **Backend**: Hono 4 (Bun runtime in production)
- **Language**: TypeScript 5.x
- **Runtime / package manager**: Bun 1.3+
- **Database**: Supabase (PostgreSQL) with RLS policies
- **Authentication**: Supabase Auth (email/password + OAuth)
- **Styling**: Tailwind CSS v4.1.9
- **UI Components**: Radix UI + shadcn/ui (50+ components)
- **Animations**: Motion 12.23.12
- **Rich Text**: Novel 1.0.2 + TipTap 3.14.0
- **Icons**: Lucide React 0.562.0 + Tabler Icons + LobeHub Icons
- **Fonts**: Geist Sans & Geist Mono
- **Internationalization**: react-i18next (legacy Next.js `app/` routes still use next-intl)
- **Forms**: React Hook Form + Zod
- **AI Integration**: AI SDK + OpenRouter Provider
- **File Uploads**: UploadThing + Better Upload
- **Command Palette**: cmdk 1.1.1
- **Charts**: Recharts 3.7.0
- **Dates**: date-fns + date-fns-tz
- **Testing**: agent-browser (E2E smoke) + Vitest 4.0.18 (unit)
- **Code Quality**: Biome 2.3.10 (linter + formatter)
- **Analytics**: Vercel Analytics + Speed Insights
- **Toast**: Sonner 2.0.7

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) 1.3+ (required for install, dev, test, and production server)
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
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Update `.env.local` with your Supabase credentials and server secrets:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SITE_URL=http://localhost:5173
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
UPLOADTHING_TOKEN=your-uploadthing-token-here
```

5. Set up the database:

Run the SQL scripts in the `scripts/` folder in your Supabase SQL editor:
- `01_create_tables.sql` - Creates the database schema
- `02_seed_data.sql` - Adds sample data
- `03_create_storage_bucket.sql` - Sets up file storage

6. Run the development server:

```bash
bun run dev
```

7. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Commands

```bash
# Install dependencies
bun install

# Development server (Vite + Hono API)
bun run dev

# Build client + server for production
bun run build

# Run production server (after build; default http://localhost:3000)
bun run start
# curl http://127.0.0.1:3000/api/health

# Type checking
bunx tsc --noEmit

# Linting & formatting (Biome)
bun run lint
bun run format

# Unit tests (Vitest)
bun run test

# E2E smoke (agent-browser) — start dev server first; install once: npx agent-browser@latest install
bun run test:e2e

# Run all tests
bun run test:all

# E2E with visible browser
bun run test:e2e:headed

# Dead code analysis
bun run analyze:dead-code
bun run analyze:deps
```

## Environment Variables

| Variable | Description | Required |
| -------- | ----------- | -------- |
| `VITE_SUPABASE_URL` | Public Supabase project URL for the Vite client | Yes |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase anonymous key for the Vite client | Yes |
| `VITE_SITE_URL` | Public site URL for metadata, CORS, and canonical links | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (keep secret!) | Yes |
| `UPLOADTHING_TOKEN` | Your UploadThing API token (keep secret!) | Yes |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI features | Optional |
| `GITHUB_TOKEN` / `GH_TOKEN` | GitHub API token for higher import rate limits | Optional |

## Database Schema

### Core Tables

**users** - Extended auth profiles with role system (0=admin, 1=moderator, 2=user), social links, bio, and location

**projects** - Project showcase with slug-based URLs for SEO, tags, and category

**comments** - Unified comments system for both Blog and Projects

**likes** - User likes with unique constraint (one like per user per project/post)

**views** - Session-based views tracking with 30-minute timeout, IP + User Agent fingerprinting

**posts** - Blog posts with rich text content (JSON), featured flag, read time

**post_tags** - Blog tag categorization

**blog_post_tags** - Many-to-many relationship between posts and tags

**events** - Community events with approval workflow, status (upcoming/past), location details

**categories** - Project categories with icon and color

**faqs** - FAQ content with sort order and active status

**blog_reports** - Comment/report moderation system

**vibe_videos** - Video content for tutorials and highlights

### Security

- Row Level Security (RLS) enabled on all tables
- Public read access untuk semua data
- Authenticated insert/update untuk data milik user sendiri
- Guest comments diizinkan dengan author_name field
- Admin/moderator role diperlukan untuk moderation
- Email domain whitelist untuk registration

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
│   ├── event/
│   │   ├── list/           # Event listing
│   │   ├── [slug]/         # Event detail pages
│   │   └── submit/         # Submit new event (auth required)
│   ├── dashboard/          # User dashboard
│   ├── admin/              # Admin dashboard with moderation
│   ├── calendar/           # Community calendar
│   ├── videos/             # Vibe videos section
│   ├── terms/              # Terms page
│   ├── user/auth/          # Authentication pages
│   └── layout.tsx          # Root layout with providers
├── components/
│   ├── ui/                 # 50+ shadcn/ui components
│   ├── sections/           # Page sections (hero, showcase, faq)
│   ├── blog/               # Blog-specific components
│   ├── project/            # Project-specific components
│   ├── admin-panel/        # Admin dashboard components
│   ├── event/              # Event-specific components
│   └── profile/            # Profile-specific components
├── hooks/                  # Custom React hooks (10+ hooks)
├── lib/
│   ├── actions/            # Server actions (comments, blog, projects, events)
│   ├── supabase/           # Supabase client configuration
│   ├── server/             # Server utilities
│   └── ai/                 # AI integration (OpenRouter)
├── types/                  # TypeScript type definitions
├── scripts/                # Database migrations (20+ SQL files)
├── tests/                  # Vitest unit tests; E2E smoke in scripts/smoke-agent-browser.mjs
├── messages/               # i18n messages (en.json, id.json)
├── docs/                   # Documentation (security, database, deployment)
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

### AI Integration

Built-in AI features using OpenRouter:
- AI-powered content suggestions
- Leaderboard for AI tool rankings
- Integration with Agentic workflow

### Events System

Full-featured events management:
- Event submission with approval workflow
- Status tracking (upcoming, past)
- Location types (online, offline, hybrid)
- Organizer profiles
- Cover image support

### Admin Dashboard

Comprehensive admin tools:
- User management (role: admin, moderator, user)
- Content moderation (comments, reports)
- Event approval workflow
- Analytics dashboard

### Skills System

This project includes AI agent skills for enhanced development:

- **frontend-design** - Create distinctive, production-grade frontend interfaces
- **webapp-testing** - Toolkit for interacting with testing local web applications

See `.claude/skills/` for workspace skills and `~/.kiro/skills/` for global skills.

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

### Security

For detailed security documentation, see:
- [Security Audit Summary](docs/security/SECURITY_AUDIT_SUMMARY.md)
- [RLS Policies](docs/security/RLS_POLICIES.md)
- [Auth Dashboard Settings](docs/security/AUTH_DASHBOARD_SETTINGS.md)

## License

This project is licensed under the MIT License.

---

Built with ❤️ by VibeDev ID Community
