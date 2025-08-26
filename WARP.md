# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**VibeDev ID** - When the Codes Meet the Vibes 🚀

VibeDev ID adalah komunitas vibrant developer, AI enthusiasts, dan tech innovators Indonesia yang punya visi dan passion yang sama untuk bikin produk digital yang keren. Built with Next.js 15, Supabase, and Tailwind CSS.

### Key Features:
- Indonesian-focused developer community platform
- User authentication with Supabase Auth
- Project showcase dan portfolio management
- Community interaction (comments, likes, networking)
- Responsive design with dark/light mode support
- SEO-optimized Indonesian content with informal but professional tone
- Real Indonesian developer testimonials from major tech companies

## Development Commands

### Setup and Installation
\`\`\`bash
# Install dependencies (supports npm, pnpm, or bun)
pnpm install
# or npm install
# or bun install

# Set up environment variables
cp .env.example .env.local
\`\`\`

### Development Server
\`\`\`bash
# Start development server with Turbopack
pnpm dev
# or npm run dev
# or bun dev

# Server runs on http://localhost:3000
\`\`\`

### Build and Production
\`\`\`bash
# Build for production with Turbopack
pnpm build
# or npm run build

# Start production server
pnpm start
# or npm start

# Build for Vercel deployment
pnpm vercel-build
# or npm run vercel-build
\`\`\`

### Code Quality
\`\`\`bash
# Lint the codebase
pnpm lint
# or npm run lint
\`\`\`

## Database Setup

The project uses Supabase with PostgreSQL. Database schema is defined in SQL scripts in the `scripts/` directory:

1. **01_create_tables.sql** - Main database schema with tables for users, projects, comments, likes, and views
2. **02_seed_data.sql** - Sample data for development
3. **03_create_storage_bucket.sql** - File storage setup
4. **04_change_projects_id_to_sequential.sql** - Schema migrations
5. **05_add_foreign_key_constraints.sql** - Additional constraints

### Required Environment Variables
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
\`\`\`

## Architecture Overview

### App Router Structure (Next.js 15)
- **app/** - Main application directory using App Router
  - **[username]/** - Dynamic user profile pages
  - **project/[id]/** - Individual project detail pages
  - **project/submit/** - Project submission form
  - **user/auth/** - Authentication pages
  - **layout.tsx** - Root layout with fonts and metadata
  - **page.tsx** - Main homepage with project showcase

### Authentication System
The app uses Supabase Auth with custom user profiles:
- **lib/actions.ts** - Server actions for sign in/up, password reset, comments
- **middleware.ts** - Supabase middleware for session management
- **lib/supabase/** - Client/server Supabase configuration

### UI Components (shadcn/ui)
- **components/ui/** - Reusable UI components built on Radix UI
  - **Alert Dialog**: Professional confirmation dialogs (e.g., delete project)
  - **Button**: Multiple variants with loading states and icons
  - **Form Components**: Input, Textarea, Select with proper validation
  - **Heart Button**: Custom like/unlike functionality with animations
  - **Navbar**: Responsive navigation with user authentication state
- **components.json** - shadcn/ui configuration using "new-york" style
- Uses Tailwind CSS v4 with CSS variables for theming

### Key Features Implementation
- **User Profiles**: Extended auth.users with custom profile data in `users` table
- **Project Management**: CRUD operations with Row Level Security policies
  - **Inline Editing**: Real-time project editing without page navigation
  - **Loading States**: Professional UX with loading indicators on save operations
- **Comments System**: Supports both authenticated users and guest comments
- **Likes System**: User engagement tracking with unique constraints
- **File Uploads**: Configured with UploadThing for project images
- **Alert Dialogs**: Professional confirmation dialogs using shadcn/ui Alert Dialog
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Indonesian Localization**: 
  - SEO/LEO friendly Indonesian copy throughout the platform
  - Informal but professional tone ("lo", "gue", "bareng") appealing to Indonesian developers
  - Testimonials from real Indonesian tech companies (Tokopedia, Gojek, Bukalapak, Traveloka)
  - Hero headline preserved: "When the Codes Meet the Vibes"

### Database Schema
- **users** - User profiles extending Supabase auth
- **projects** - Project showcase with categories and metadata
- **comments** - Threaded comments on projects
- **likes** - User likes/hearts on projects
- **views** - Project view tracking for analytics

### Security
- Row Level Security (RLS) enabled on all tables
- Policies allow public read access but restrict writes to owners
- Guest comments allowed for engagement without requiring accounts
- Proper authentication checks in server actions

### Styling and Theming
- Tailwind CSS v4 with component-based architecture
- Custom CSS variables for consistent theming
- Support for dark/light mode via next-themes
- Geist font family (Sans, Mono, and Instrument Serif)

## Development Notes

- Uses TypeScript with strict mode enabled
- Supports both client and server components appropriately
- Server actions handle form submissions and database operations
- Middleware manages Supabase session state across requests
- Path aliases configured: `@/*` points to root directory
- **Recent Updates (Latest):**
  - Complete Indonesian localization of homepage copy
  - Updated testimonials with relevant Indonesian developer community content
  - SEO-optimized content for Indonesian search engines
  - Maintained technical English terms familiar to developers
  - Professional UX with informal Indonesian tone

## Data Login for Testing
email: 123@gmail.com
password: 123456
