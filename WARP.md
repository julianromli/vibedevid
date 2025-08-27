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
- **Session-based Analytics** - Advanced visitor tracking dengan unique session management
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
6. **06_enhance_views_table.sql** - Session-based analytics enhancement with unique visitor tracking

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
- **Avatar Management**: Smart auto-cleanup system dengan scheduled deletion
  - **Auto-Delete Old Avatars**: Automatically removes old avatar files setelah user upload new ones
  - **10-Second Delay**: Configurable delay before deletion untuk ensure upload success
  - **Smart URL Filtering**: Only deletes files from own Supabase storage, skips external URLs
  - **Safe Implementation**: Error handling dan validation untuk prevent accidental deletions
- **Project Management**: CRUD operations with Row Level Security policies
  - **Inline Editing**: Real-time project editing without page navigation
  - **Loading States**: Professional UX with loading indicators on save operations
- **Comments System**: Supports both authenticated users and guest comments
- **Likes System**: User engagement tracking with unique constraints
- **Advanced Analytics System**: Session-based visitor tracking dengan sophisticated features
  - **Unique Visitor Detection**: Session-based tracking dengan 30-minute timeout
  - **Bot Protection**: User agent filtering untuk valid visitors saja
  - **Duplicate Prevention**: Unique constraint per session per project
  - **Time-based Analytics**: Daily, weekly, dan custom date range analysis
  - **Real-time Stats**: Live project statistics dengan optimized queries
- **File Uploads**: Configured with UploadThing for project images
- **Avatar Auto-Delete System**: Smart cleanup system untuk avatar lama dengan 10-second delay scheduling
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
- **views** - Enhanced project view tracking dengan session-based analytics:
  - `session_id` (TEXT) - Unique session identifier untuk visitor tracking
  - `view_date` (DATE) - Date column untuk time-based analytics
  - `ip_address` (INET) - Optional IP tracking
  - Unique indexes untuk performance dan duplicate prevention

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
- **Grid Pattern Background System** - Consistent visual identity across all pages

## UI Design System Rules

### 🎨 **MANDATORY: Background Pattern for All Pages**

**RULE: Every new page MUST use the standardized 3-layer background system**

#### Required Implementation:
```tsx
// ALWAYS use this exact pattern for new pages
<div className="min-h-screen bg-grid-pattern relative">
  {/* Layer 1: Background Gradient Overlay - MANDATORY */}
  <div className="absolute inset-0 bg-gradient-to-br from-background/50 via-muted/30 to-background/80"></div>
  
  {/* Layer 2: Content Container - MANDATORY */}
  <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
    {/* Your page content here */}
  </div>
</div>
```

#### Apply to ALL Page States:
- ✅ **Main Content** - Primary page view
- ✅ **Loading States** - Skeleton loaders, loading indicators
- ✅ **Error States** - 404, user not found, project not found
- ✅ **Empty States** - No data, no projects, etc.

#### Background System Components:
1. **Base Layer**: `bg-grid-pattern` - CSS-defined minimalist grid dots
   - Light mode: Black dots (rgba(0,0,0,0.4))
   - Dark mode: White dots (rgba(255,255,255,0.3))
   - Grid size: 20x20px spacing

2. **Overlay Layer**: `bg-gradient-to-br from-background/50 via-muted/30 to-background/80`
   - Creates depth and softens the grid pattern
   - Theme-adaptive colors using CSS variables

3. **Content Layer**: `relative` positioning for proper z-index stacking

#### Pages Currently Implemented:
- ✅ `app/user/auth` (Authentication pages)
- ✅ `app/project/submit` (Project submission)
- ✅ `app/project/[id]` (Project details)
- ✅ `app/[username]` (User profiles)

#### CSS Definition Location:
```css
/* Located in app/globals.css lines 231-239 */
.bg-grid-pattern {
  background-image: radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.4) 1px, transparent 0);
  background-size: 20px 20px;
}

.dark .bg-grid-pattern {
  background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.3) 1px, transparent 0);
  background-size: 20px 20px;
}
```

#### Benefits:
- **Visual Consistency**: Professional, modern aesthetic across all pages
- **Theme Adaptive**: Automatically works with light/dark mode
- **Performance**: CSS-only solution, no image assets
- **Accessibility**: Subtle pattern doesn't interfere with content readability
- **Brand Identity**: Creates recognizable VibeDev ID visual signature

---

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
  - **Background System Standardization** - Grid pattern applied across all pages
  - **Session-based Analytics Enhancement** - Advanced visitor tracking system implementation
  - **Avatar Auto-Delete Implementation** - Smart storage cleanup system dengan scheduled deletion
    - Automatic cleanup of old avatar files when users upload new profile pictures
    - 10-second configurable delay untuk ensure upload success sebelum deletion
    - Smart filtering untuk only delete files from own Supabase storage bucket
    - Background processing tidak blocking UI dengan proper error handling

## Analytics Implementation Details

### Client-side Analytics (`lib/client-analytics.ts`)
- **Session Management**: Automatic session creation dengan localStorage persistence
- **Unique Visitor Detection**: Sophisticated algorithm dengan timeout-based session expiry
- **Bot Filtering**: User agent validation untuk skip crawlers dan automated requests
- **View Deduplication**: Client-side prevention untuk duplicate views per session
- **Performance Optimized**: Minimal overhead dengan efficient localStorage management

### Server-side Implementation (`lib/actions.ts`)
- **Enhanced Analytics Queries**: Parallel database operations untuk real-time stats
- **Upsert Mechanism**: Graceful handling untuk duplicate constraint violations
- **Time-based Filtering**: Support untuk daily, weekly, dan custom date range analytics
- **Optimized Performance**: Proper indexing dan query optimization untuk scalability

### Analytics Features Available:
1. **Total Views** - Aggregate view count per project
2. **Unique Visitors** - Session-based unique visitor counting
3. **Today's Views** - Real-time daily analytics
4. **Time-based Analytics** - Historical data dengan date filtering
5. **Performance Metrics** - Optimized queries dengan proper indexing

### Database Enhancements:
```sql
-- Session-based tracking columns
ALTER TABLE public.views ADD COLUMN session_id TEXT;
ALTER TABLE public.views ADD COLUMN view_date DATE DEFAULT CURRENT_DATE;

-- Performance indexes
CREATE UNIQUE INDEX idx_views_project_session ON public.views(project_id, session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_views_date ON public.views(view_date);
CREATE INDEX idx_views_project_date ON public.views(project_id, view_date);
```

## Data Login for Testing
email: 123@gmail.com
password: 123456
