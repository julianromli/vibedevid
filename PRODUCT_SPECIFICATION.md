# Product Specification: VibeDev ID Community Website

**Version**: 1.0.0  
**Last Updated**: 19 December 2025  
**Status**: Production Ready  
**Document Type**: Product Requirements & Technical Specification

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Target Audience](#3-target-audience)
4. [Core Features](#4-core-features)
5. [Technical Architecture](#5-technical-architecture)
6. [Database Schema](#6-database-schema)
7. [API Specifications](#7-api-specifications)
8. [Security & Compliance](#8-security--compliance)
9. [Performance Requirements](#9-performance-requirements)
10. [Design System](#10-design-system)
11. [SEO & Analytics](#11-seo--analytics)
12. [Infrastructure & Deployment](#12-infrastructure--deployment)
13. [Appendix](#13-appendix)

---

## 1. Executive Summary

VibeDev ID is a vibrant Indonesian developer community platform built with modern web technologies. The platform serves as a hub for developers to showcase their projects, connect with fellow developers, and participate in the AI-assisted coding movement ("vibe coding"). The application is designed with an informal yet professional Indonesian tone, targeting developers who embrace AI tools in their workflow.

**Key Metrics**:

- **Stack**: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + Supabase
- **Architecture**: Server Components with App Router
- **Authentication**: Supabase Auth with email/password and OAuth providers
- **Database**: PostgreSQL with Row Level Security
- **Deployment**: Vercel (production), local development

---

## 2. Product Overview

### 2.1 Vision Statement

To become the leading community platform for Indonesian developers who embrace AI-assisted coding, providing a space for project showcase, knowledge sharing, and professional networking.

### 2.2 Product Positioning

**Position**: Community-driven project showcase platform for Indonesian AI-assisted developers

**Value Proposition**:

1. **Project Showcase**: Developers can present their work to the community with SEO-friendly URLs
2. **Community Engagement**: Likes, comments, and views create interactive feedback loops
3. **SEO Optimized**: Indonesian-focused keywords and structured data for search visibility
4. **AI Tools Integration**: Platform celebrates and showcases projects built with AI tools

### 2.3 Branding & Tone

**Brand Name**: VibeDev ID

**Tagline**: "When the Codes Meet the Vibes"

**Tone**: Informal but professional Indonesian ("lo/gue" language style) with technical English terms preserved

**Visual Identity**: Modern, dark-mode-first design with grid pattern backgrounds and gradient accents

---

## 3. Target Audience

### 3.1 Primary Users

| Segment                      | Description                                     | Key Needs                           |
| ---------------------------- | ----------------------------------------------- | ----------------------------------- |
| **Indonesian Developers**    | Developers living/working in Indonesia          | Local community, Indonesian content |
| **AI-Assisted Coders**       | Developers using AI tools (Cursor, v0, Lovable) | Showcase AI-built projects          |
| **Open Source Contributors** | Developers with open source projects            | Visibility for their work           |
| **Tech Recruiters**          | Hiring managers seeking talent                  | Discover talented developers        |

### 3.2 User Personas

**Persona 1: "Vibe Coder Budi"**

- Age: 25-35
- Role: Frontend Developer
- Behavior: Uses Cursor/Windsurf for daily coding
- Goal: Showcase projects built with AI assistance
- Pain Point: Needs a platform that understands AI-assisted development

**Persona 2: "Community Leader Siti"**

- Age: 28-40
- Role: Tech Community Organizer
- Behavior: Organizes meetups and hackathons
- Goal: Connect with other community leaders
- Pain Point: Finding quality projects to feature at events

---

## 4. Core Features

### 4.1 Authentication System

#### 4.1.1 Email/Password Authentication

**Purpose**: Allow users to create accounts using email and password

**Flow**:

1. User enters email and password on signup form
2. System validates email domain (whitelist: gmail.com, yahoo.com, outlook.com, hotmail.com, live.com)
3. Supabase Auth sends confirmation email
4. User confirms email via link
5. User redirected to login page with success message
6. User signs in with credentials
7. Profile created automatically in `users` table

**Security Features**:

- Email domain whitelist to prevent spam
- Email confirmation required before login
- Password reset via email
- Session management with automatic refresh

**Server Actions**:

```typescript
signIn(prevState, formData) // Email/password sign in
signUp(prevState, formData) // Email/password sign up
resetPassword(prevState, formData) // Password reset email
resendConfirmationEmail(prevState, formData) // Resend confirmation
signOut() // Sign out user
```

#### 4.1.2 OAuth Authentication

**Purpose**: Allow users to sign in with Google or GitHub

**Supported Providers**:

- Google OAuth
- GitHub OAuth

**Flow**:

1. User clicks "Sign in with Google/GitHub"
2. Redirect to provider's consent screen
3. User authorizes access
4. Callback to `/auth/callback` with auth code
5. System exchanges code for session
6. Profile created/updated with provider data
7. User redirected to homepage

**Special Handling**:

- OAuth users bypass email confirmation (already verified by provider)
- Automatic username generation with collision detection
- Avatar synced from provider profile

#### 4.1.3 Session Management

**Implementation**: Next.js Middleware with Supabase SSR

**Features**:

- Automatic session refresh
- Protected route handling
- Email confirmation enforcement
- Security redirects for unconfirmed users

**Middleware Logic** (`middleware.ts`):

```
1. Create Supabase client from request cookies
2. Get current user via supabase.auth.getUser()
3. Check email confirmation status
4. Redirect unconfirmed users to confirm-email page
5. Prevent confirmed users from accessing confirm-email
6. Return supabaseResponse with updated cookies
```

### 4.2 User Profiles

#### 4.2.1 Profile Structure

**Table**: `public.users`

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | PRIMARY KEY, references auth.users(id) |
| username | TEXT | UNIQUE, display name for URLs |
| display_name | TEXT | Full display name |
| bio | TEXT | User biography |
| avatar_url | TEXT | Profile picture URL |
| location | TEXT | Geographic location |
| website | TEXT | Personal website URL |
| github_url | TEXT | GitHub profile URL |
| twitter_url | TEXT | Twitter/X profile URL |
| joined_at | TIMESTAMP | Account creation date |
| updated_at | TIMESTAMP | Last profile update |

#### 4.2.2 Profile Features

**Username System**:

- Derived from email prefix (e.g., `budi@gmail.com` → `budi`)
- Lowercase alphanumeric with hyphens
- Automatic collision handling with numeric suffixes
- Maximum attempts: 5 before random suffix

**Avatar Management**:

- Upload via UploadThing
- Cropping interface with react-easy-crop
- Automatic old avatar deletion (10-second delay)
- External URLs supported (Google avatars, GitHub)
- Fallback: `/vibedev-guest-avatar.png`

**Profile Editing**:

- Inline editing via profile dialog
- Real-time updates
- Social link management

### 4.3 Project Showcase

#### 4.3.1 Project Structure

**Table**: `public.projects`

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | PRIMARY KEY, auto-generated UUID |
| title | TEXT | Project title |
| description | TEXT | Project description (max 1600 chars) |
| tagline | TEXT | Short tagline for project cards |
| category | TEXT | Project category |
| image_url | TEXT | Project screenshot URL |
| website_url | TEXT | Project live URL |
| favicon_url | TEXT | Auto-fetched favicon |
| author_id | UUID | REFERENCES users(id) |
| tags | JSONB | Array of tags |
| slug | TEXT | UNIQUE SEO-friendly URL identifier |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Last update date |

#### 4.3.2 Slug System

**Purpose**: SEO-friendly URLs for project pages

**Format**: `[a-z0-9]+(?:-[a-z0-9]+)*` (lowercase alphanumeric with hyphens)

**Examples**:

```
/project/asfin-asisten-finansial
/project/catatan-keuangan-simpel
/project/my-awesome-project-2024
```

**Slug Generation**:

1. Convert title to lowercase
2. Replace spaces with hyphens
3. Remove special characters
4. Check uniqueness against database
5. Add numeric suffix if collision detected (project-2, project-3)

**Backward Compatibility**:

- UUID-based URLs redirect to slug URLs
- Legacy format: `/project/uuid-string-here`

#### 4.3.3 Project CRUD Operations

**Create Project** (`submitProject`):

```
1. Validate required fields (title, description, category)
2. Generate unique slug from title
3. Auto-fetch favicon from website URL (2-second timeout)
4. Insert into projects table
5. Return slug for redirect
```

**Read Projects** (`fetchProjectsWithSorting`):

- Sorting options: trending, top, newest
- Category filtering
- Pagination with limit
- Likes count included

**Update Project** (`editProject`):

- Owner-only access
- Title, description, category, URL, image, tags
- Slug remains unchanged (SEO stability)

**Delete Project** (`deleteProject`):

- Owner-only access
- Cascade delete: comments, likes, views
- Confirmation dialog via AlertDialog

#### 4.3.4 Project Categories

**Available Categories**:

- Web App
- Mobile App
- AI/ML Tool
- Open Source
- Chrome Extension
- CLI Tool
- Game
- Other

### 4.4 Engagement System

#### 4.4.1 Likes/Hearts

**Purpose**: Allow users to bookmark projects they like

**Table**: `public.likes`

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | PRIMARY KEY |
| project_id | UUID | REFERENCES projects(id) |
| user_id | UUID | REFERENCES users(id), nullable |
| created_at | TIMESTAMP | Like timestamp |

**Constraints**:

- UNIQUE(project_id, user_id) - one like per user per project

**Client Implementation** (`lib/client-likes.ts`):

- `getLikeStatusClient(projectIdentifier)` - Get like count and user status
- `toggleLikeClient(projectIdentifier)` - Toggle like state

**Server Actions**:

- `toggleLike(projectId)` - Server-side toggle
- `getLikeStatus(projectId)` - Server-side status
- `getBatchLikeStatus(projectIds)` - Batch query for homepage

**UI Components**:

- `HeartButton` - Minimal design for homepage cards
- `ProminentLikeButton` - Primary styled for detail pages
- Both use red-500 color for liked state

#### 4.4.2 Comments

**Purpose**: Enable discussion on projects

**Table**: `public.comments`

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | PRIMARY KEY |
| project_id | UUID | REFERENCES projects(id) |
| user_id | UUID | REFERENCES users(id), nullable |
| author_name | TEXT | Guest commenter name (nullable) |
| content | TEXT | Comment content |
| created_at | TIMESTAMP | Comment timestamp |

**Features**:

- Authenticated users: displays username and avatar
- Guest users: displays author_name with "Anonymous" fallback
- No edit/delete for comments (simplified)
- Recent comments sorted by creation date (descending)

**Server Actions**:

- `addComment(formData)` - Add new comment
- `getComments(projectSlug)` - Get comments with author info

#### 4.4.3 Views Tracking

**Purpose**: Analytics for project popularity

**Table**: `public.views` (enhanced)

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | PRIMARY KEY |
| project_id | UUID | REFERENCES projects(id) |
| user_id | UUID | REFERENCES users(id), nullable |
| session_id | TEXT | Unique visitor session ID |
| ip_address | INET | Optional IP tracking |
| view_date | DATE | Date for time-based analytics |
| created_at | TIMESTAMP | View timestamp |

**Analytics Metrics**:

- Total Views: All view records
- Unique Visitors: COUNT(DISTINCT session_id)
- Today's Views: COUNT(\*) WHERE view_date = today

**Client Implementation** (`lib/client-analytics.ts`):

- `generateSessionId()` - Create unique session ID
- `getOrCreateSession()` - Session management with 30-min timeout
- `shouldTrackView(projectId)` - Check if unique view
- `isValidUserAgent()` - Filter bots/crawlers

**Bot Filtering**:

```
Excluded user agents: bot, crawler, spider, scraper, googlebot, bingbot, slurp, duckduckbot, facebookexternalhit, twitterbot, whatsapp
```

**Indexes**:

```sql
CREATE UNIQUE INDEX idx_views_project_session ON public.views(project_id, session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_views_date ON public.views(view_date);
CREATE INDEX idx_views_project_date ON public.views(project_id, view_date);
```

### 4.5 Admin Features

#### 4.5.1 YouTube Video Manager

**Purpose**: Admin control over homepage video showcase

**Table**: `public.vibe_videos`

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| title | TEXT | Video title |
| description | TEXT | Video description |
| youtube_url | TEXT | YouTube video URL (UNIQUE) |
| thumbnail_url | TEXT | Video thumbnail URL |
| views_count | TEXT | View count string |
| publish_date | TEXT | Publish date string |
| position | INTEGER | Display order |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Last update |

**API Endpoints**:

- `GET /api/vibe-videos` - List all videos (ordered by position)
- `POST /api/vibe-videos` - Create new video
- `PUT /api/vibe-videos/[id]` - Update video (via separate route)
- `DELETE /api/vibe-videos/[id]` - Delete video (via separate route)

**YouTube Metadata Fetching** (`/api/youtube`):

- oEmbed API for basic info (title, author, thumbnail)
- HTML scraping for views, publish date, description
- Multiple regex patterns for robustness
- Error handling for private/deleted videos

**Video URL Formats Supported**:

- `youtube.com/watch?v=VIDEO_ID`
- `youtu.be/VIDEO_ID`
- `youtube.com/shorts/VIDEO_ID`

### 4.6 File Upload

#### 4.6.1 UploadThing Integration

**Purpose**: Image upload for projects and avatars

**Configuration** (`lib/uploadthing.ts`):

- Endpoint: `imageUploader`
- File types: JPEG, PNG, WebP
- Size limit: 20MB default

**Storage**:

- Bucket: Configured via UploadThing
- Public read access
- Automatic URL generation

#### 4.6.2 Image Optimization

**Next.js Image Configuration** (`next.config.mjs`):

- Formats: AVIF, WebP
- Device sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
- Minimum cache TTL: 1 year (31536000 seconds)

**Remote Patterns Supported**:

- Supabase storage: `**.supabase.co`
- UploadThing: `utfs.io`, `**.ufs.sh`
- YouTube: `i.ytimg.com`, `img.youtube.com`
- GitHub: `avatars.githubusercontent.com`, `github.com`
- Google: `lh3.googleusercontent.com`
- Icons: `cdn.jsdelivr.net`, `unpkg.com`
- Favicons: `google.com/s2/favicons`

---

## 5. Technical Architecture

### 5.1 Frontend Stack

| Layer            | Technology                       | Version  |
| ---------------- | -------------------------------- | -------- |
| Framework        | Next.js                          | 16.0.10  |
| Runtime          | Node.js                          | 20+      |
| Language         | TypeScript                       | 5.x      |
| UI Library       | React                            | 19.2.3   |
| Styling          | Tailwind CSS                     | 4.1.9    |
| CSS Framework    | shadcn/ui                        | 3.3.0    |
| Icons            | Lucide React                     | 0.454.0  |
| Motion           | Framer Motion                    | 12.23.12 |
| State Management | React Server Components          |
| Forms            | Server Actions + React Hook Form |

### 5.2 Backend Stack

| Layer          | Technology         | Purpose                    |
| -------------- | ------------------ | -------------------------- |
| Database       | PostgreSQL         | Primary data store         |
| Auth           | Supabase Auth      | User authentication        |
| ORM            | Supabase JS        | Database client            |
| Server Runtime | Next.js App Router | Server actions, API routes |
| Deployment     | Vercel             | Production hosting         |

### 5.3 Application Structure

```
app/
├── [username]/              # Dynamic user profile pages
│   └── page.tsx
├── project/
│   ├── [slug]/              # Dynamic project detail pages
│   │   └── page.tsx
│   └── submit/              # Project submission
│       └── page.tsx
├── user/
│   └── auth/                # Authentication pages
│       ├── page.tsx         # Sign in/up forms
│       └── confirm-email/   # Email confirmation
├── admin/                   # Admin dashboard
│   └── page.tsx
├── api/
│   ├── vibe-videos/         # Admin video CRUD
│   │   └── route.ts
│   └── youtube/             # YouTube metadata
│       └── route.ts
├── auth/
│   └── callback/            # OAuth callback
│       └── route.ts
├── layout.tsx               # Root layout
├── page.tsx                 # Homepage
└── globals.css              # Global styles
```

### 5.4 Routing Architecture

| Route                      | Type        | Description                    |
| -------------------------- | ----------- | ------------------------------ |
| `/`                        | Server Page | Homepage with project showcase |
| `/[username]`              | Dynamic     | User profile page              |
| `/project/[slug]`          | Dynamic     | Project detail page            |
| `/project/submit`          | Protected   | Project submission form        |
| `/user/auth`               | Public      | Authentication page            |
| `/user/auth/confirm-email` | Public      | Email confirmation             |
| `/admin`                   | Protected   | Admin dashboard                |
| `/api/vibe-videos`         | API         | Video CRUD operations          |
| `/api/youtube`             | API         | YouTube metadata fetch         |
| `/auth/callback`           | Route       | OAuth callback handler         |

### 5.5 Data Flow

```
User Action → Server Action/API Route → Supabase Client → Database
                                                           ↓
Response → React Component → UI Update → Optimistic Update
```

### 5.6 State Management

**Server State**:

- React Server Components for initial data
- Server Actions for mutations
- URL-based state for filtering/sorting

**Client State**:

- Supabase auth session (SSR)
- LocalStorage for analytics session
- Optimistic updates for likes/comments

---

## 6. Database Schema

### 6.1 Schema Overview

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  website TEXT,
  github_url TEXT,
  twitter_url TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at()
);

-- Projects
CREATE TABLE public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  image_url TEXT,
  website_url TEXT,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments
CREATE TABLE public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  author_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes
CREATE TABLE public.likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Views (enhanced for analytics)
CREATE TABLE public.views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_id TEXT,
  ip_address INET,
  view_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vibe Videos (admin)
CREATE TABLE public.vibe_videos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT UNIQUE NOT NULL,
  thumbnail_url TEXT,
  views_count TEXT,
  publish_date TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 6.2 Indexes

```sql
CREATE INDEX idx_projects_author_id ON public.projects(author_id);
CREATE INDEX idx_projects_category ON public.projects(category);
CREATE INDEX idx_projects_slug ON public.projects(slug);
CREATE INDEX idx_comments_project_id ON public.comments(project_id);
CREATE INDEX idx_likes_project_id ON public.likes(project_id);
CREATE INDEX idx_views_project_id ON public.views(project_id);
CREATE INDEX idx_users_username ON public.users(username);

-- Analytics indexes
CREATE UNIQUE INDEX idx_views_project_session ON public.views(project_id, session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_views_date ON public.views(view_date);
CREATE INDEX idx_views_project_date ON public.views(project_id, view_date);
```

### 6.3 Row Level Security (RLS)

**Users Table**:

- SELECT: Public (anyone can view profiles)
- INSERT: Authenticated users (create own profile)
- UPDATE: Owner only

**Projects Table**:

- SELECT: Public
- INSERT: Authenticated users (create own projects)
- UPDATE: Owner only
- DELETE: Owner only

**Comments Table**:

- SELECT: Public
- INSERT: Anyone (including guests)
- UPDATE/DELETE: Not supported

**Likes Table**:

- SELECT: Public
- ALL: Owner only

**Views Table**:

- SELECT: Public
- INSERT: Anyone (no auth required)

---

## 7. API Specifications

### 7.1 Server Actions

#### Authentication Actions

**signIn(prevState, formData)**

```typescript
Input: { email, password }
Output: { success: string, redirect: string } | { error: string }
Errors: Missing credentials, Invalid email/password, Email not confirmed
```

**signUp(prevState, formData)**

```typescript
Input: { email, password, firstName, lastName }
Output: { success: string } | { error: string }
Errors: Missing credentials, Invalid email domain, Already registered
```

**signOut()**

```typescript
Output: Redirect to homepage
```

**resetPassword(prevState, formData)**

```typescript
Input: { email }
Output: { success: string } | { error: string }
```

#### Project Actions

**submitProject(formData, userId)**

```typescript
Input: { title, description, category, website_url, image_url, tagline, tags }
Output: { success: boolean, slug: string } | { success: false, error: string }
Features: Auto-generates slug, auto-fetches favicon
```

**getProjectBySlug(slug)**

```typescript
Input: { slug: string }
Output: { project: Project, error: null } | { project: null, error: string }
Includes: Author info, likes count, views stats
```

**fetchProjectsWithSorting(sortBy, category, limit)**

```typescript
Input: { sortBy: 'trending'|'top'|'newest', category?: string, limit?: number }
Output: { projects: Project[], error: null } | { projects: [], error: string }
```

**editProject(projectSlug, formData)**

```typescript
Input: { projectSlug: string, formData: FormData }
Output: { success: boolean, slug: string } | { success: false, error: string }
```

**deleteProject(projectSlug)**

```typescript
Input: { projectSlug: string }
Output: { success: boolean } | { success: false, error: string }
```

#### Engagement Actions

**addComment(formData)**

```typescript
Input: { projectSlug, content, authorName? }
Output: { success: string } | { error: string }
Features: Supports guest comments
```

**getComments(projectSlug)**

```typescript
Input: { projectSlug: string }
Output: { comments: Comment[], error: null } | { comments: [], error: string }
```

**toggleLike(projectId)**

```typescript
Input: { projectId: string }
Output: { success: boolean, isLiked: boolean } | { error: string }
```

**getLikeStatus(projectId)**

```typescript
Input: { projectId: string }
Output: { totalLikes: number, isLiked: boolean, error: null }
```

**incrementProjectViews(projectSlug, sessionId)**

```typescript
Input: { projectSlug: string, sessionId?: string }
Output: void (server-side tracking)
```

### 7.2 REST API Routes

#### GET /api/vibe-videos

**Purpose**: List all admin-managed videos

**Response**:

```json
{
  "videos": [
    {
      "id": 1,
      "title": "Video Title",
      "description": "Video description",
      "thumbnail": "https://...",
      "videoId": "abc123",
      "publishedAt": "2025-01-01",
      "viewCount": "1.2M",
      "position": 1
    }
  ]
}
```

#### POST /api/vibe-videos

**Purpose**: Create new video entry

**Request Body**:

```json
{
  "title": "Video Title",
  "description": "Description",
  "thumbnail": "https://...",
  "video_id": "abc123",
  "published_at": "2025-01-01",
  "view_count": "1.2M"
}
```

**Response**: 201 Created with video data

#### POST /api/youtube

**Purpose**: Fetch YouTube video metadata

**Request Body**:

```json
{
  "url": "https://youtube.com/watch?v=VIDEO_ID"
}
```

**Response**:

```json
{
  "title": "Video Title",
  "description": "Description",
  "thumbnail": "https://...",
  "views": 1234567,
  "publishedAt": "2025-01-01",
  "channelTitle": "Channel Name",
  "videoId": "VIDEO_ID",
  "url": "https://youtube.com/watch?v=VIDEO_ID"
}
```

### 7.3 Authentication Callback

#### GET /auth/callback

**Purpose**: Handle OAuth and email confirmation flows

**Query Parameters**:

- `code`: Authorization code from provider
- Auto-handles session exchange and profile creation

**Flow**:

1. Exchange code for session
2. Get user from session
3. Detect OAuth vs email auth
4. Check email confirmation (email auth only)
5. Create/update profile
6. Sign out email users, redirect OAuth users

---

## 8. Security & Compliance

### 8.1 Authentication Security

**Email Domain Whitelist**:

- Allowed: gmail.com, googlemail.com, yahoo.com, yahoo.co.id, outlook.com, outlook.co.id, hotmail.com, live.com
- Blocked: Temporary emails, .edu domains, disposable emails
- Client-side validation with user-friendly error messages

**Session Security**:

- Automatic session refresh via middleware
- Secure cookie handling with httpOnly
- CSRF protection via Supabase

**Password Requirements**:

- Minimum length: 6 characters (Supabase default)
- No explicit strength requirements

### 8.2 Data Protection

**Row Level Security**:

- Public read access for content
- Authenticated create for users/projects
- Owner-only update/delete
- No public write access

**API Security**:

- No API keys exposed to client
- Service role key server-side only
- Rate limiting via Vercel

### 8.3 Privacy Features

**Analytics Privacy**:

- Session-based tracking (no persistent user tracking)
- No PII in analytics
- Bot filtering
- Optional IP tracking (disabled by default)

**Guest Comments**:

- Optional name field
- No email required
- No account needed

### 8.4 Security Headers

Implemented via Next.js:

- X-DNS-Prefetch-Control: on
- Strict-Transport-Security: max-age=63072000
- X-DNS-Prefetch-Control: on

### 8.5 Environment Variables

**Required**:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=https://vibedevid.com
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
```

---

## 9. Performance Requirements

### 9.1 Core Web Vitals Targets

| Metric                         | Target  | Measurement            |
| ------------------------------ | ------- | ---------------------- |
| LCP (Largest Contentful Paint) | < 2.5s  | Above-the-fold content |
| FID (First Input Delay)        | < 100ms | Interactivity          |
| CLS (Cumulative Layout Shift)  | < 0.1   | Visual stability       |

### 9.2 Optimization Strategies

**Image Optimization**:

- AVIF/WebP format support
- Responsive sizes attribute
- Lazy loading below fold
- Progressive loading with blur placeholders

**Code Splitting**:

- Route-based splitting (automatic in Next.js)
- Component lazy loading for heavy UI
- Bundle size monitoring via `@next/bundle-analyzer`

**Caching**:

- Static page caching (Next.js default)
- Image cache: 1 year TTL
- API response caching (SWR)

**Database**:

- Proper indexing on frequently queried columns
- Query optimization for likes/views counting
- Connection pooling via Supabase

### 9.3 Build Configuration

**Bundle Analyzer**:

```bash
pnpm run analyze
ANALYZE=true pnpm run build
```

**Turbopack (Development)**:

```bash
pnpm dev  # Uses --turbopack by default in Next.js 16
```

### 9.4 Performance Monitoring

**Vercel Analytics**:

- Page views tracking
- Performance metrics
- Real user monitoring

**Vercel Speed Insights**:

- Core Web Vitals tracking
- Performance scores
- Optimization recommendations

---

## 10. Design System

### 10.1 Design Principles

1. **Mobile-First**: Responsive design from smallest screen up
2. **Dark Mode First**: Default dark theme with light mode support
3. **Grid Pattern**: Consistent background across all pages
4. **Consistent Components**: shadcn/ui for uniform UI elements

### 10.2 Color System

**Theme Colors** (via CSS variables):

- Primary: Green/emerald
- Background: Dark/Light
- Muted: Secondary backgrounds
- Accent: Interactive elements

**Background Pattern**:

```css
.bg-grid-pattern {
  background-image: radial-gradient(
    circle at 1px 1px,
    rgba(0, 0, 0, 0.4) 1px,
    transparent 0
  );
  background-size: 20px 20px;
}

.dark .bg-grid-pattern {
  background-image: radial-gradient(
    circle at 1px 1px,
    rgba(255, 255, 255, 0.3) 1px,
    transparent 0
  );
}
```

### 10.3 Typography

**Font Family**: Geist (Sans, Mono, Instrument Serif)

**Heading Scale**:

- H1: 3rem / 48px
- H2: 2.25rem / 36px
- H3: 1.5rem / 24px
- Body: 1rem / 16px

### 10.4 Component Library

**shadcn/ui Components**:

- Alert Dialog
- Avatar
- Button
- Card
- Dialog
- Dropdown Menu
- Form (Input, Textarea, Select)
- Toast (Sonner)

**Custom Components**:

- Navbar (responsive navigation)
- Footer
- HeartButton (minimal like button)
- ProminentLikeButton (detailed like button)
- ProgressiveImage (optimized loading)
- AnimatedGradientText (event announcements)
- AvatarUploader (with cropping)

### 10.5 Layout Pattern

**Standard Page Structure**:

```tsx
<div className="bg-grid-pattern relative min-h-screen">
  <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>
  <Navbar />
  <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
    {/* Page content */}
  </div>
  <Footer />
</div>
```

### 10.6 Responsive Breakpoints

| Breakpoint | Width  | Target           |
| ---------- | ------ | ---------------- |
| sm         | 640px  | Mobile landscape |
| md         | 768px  | Tablet           |
| lg         | 1024px | Desktop          |
| xl         | 1280px | Large desktop    |
| 2xl        | 1536px | Extra large      |

---

## 11. SEO & Analytics

### 11.1 SEO Configuration

**Metadata** (`app/layout.tsx`):

```typescript
export const metadata: Metadata = {
  title: "VibeDev ID — Komunitas Vibe Coding No. 1 di Indonesia | Coding Pake AI",
  description: "Komunitas vibe coding Indonesia terbesar untuk developer...",
  keywords: ["vibe coding", "komunitas vibe coding", ...],
  openGraph: {
    images: [{ url: "/komunitasvibecodingno1diindonesia.jpg", width: 1200, height: 630 }]
  },
  twitter: { images: ["/komunitasvibecodingno1diindonesia.jpg"] }
}
```

**Target Keywords**:

- Primary: "vibe coding", "komunitas vibe coding", "komunitas vibe coding indonesia"
- Secondary: "coding pake AI", "AI untuk coding", "developer indonesia"

### 11.2 Structured Data

**Organization Schema**:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "VibeDev ID",
  "url": "https://vibedevid.com",
  "description": "Komunitas developer Indonesia"
}
```

**FAQ Schema**:

- Structured Q&A for rich results eligibility
- Indonesian language content

### 11.3 URL Structure

**Clean URLs**:

- Homepage: `https://vibedevid.com`
- Profile: `https://vibedevid.com/budi`
- Project: `https://vibedevid.com/project/my-awesome-project`

**Canonical URLs**:

- Set to primary domain (vibedevid.com)
- Prevents duplicate content issues

### 11.4 Analytics Tracking

**Session-Based Analytics**:

- Client-side session ID generation
- 30-minute session timeout
- LocalStorage persistence
- Bot/crawler filtering

**View Tracking**:

- Total views count
- Unique visitor count
- Daily view counts
- Session deduplication

**Excluded User Agents**:

- Bots, crawlers, spiders
- Social media scrapers (Facebook, Twitter, WhatsApp)

---

## 12. Infrastructure & Deployment

### 12.1 Environment Configuration

**Development**:

```bash
pnpm install
pnpm dev  # Runs on localhost:3000
```

**Production Build**:

```bash
pnpm build  # Turbopack not used, standard webpack
pnpm start  # Production server
```

**Vercel Deployment**:

```bash
pnpm vercel-build  # Alias for pnpm build
```

### 12.2 Database Setup

**Supabase Project**:

- Region: Southeast Asia (Singapore) recommended
- Auth: Email + OAuth providers configured
- Storage: Bucket for user uploads
- Edge Functions: Not used (Next.js API routes instead)

**Database Migrations**:

1. `01_create_tables.sql` - Base schema
2. `02_seed_data.sql` - Sample data
3. `03_create_storage_bucket.sql` - Storage setup
4. `04_change_projects_id_to_sequential.sql` - ID format
5. `05_add_foreign_key_constraints.sql` - Relationships
6. `06_enhance_views_table.sql` - Analytics enhancements
7. `07_add_users_role.sql` - Role field
8. `08_optimize_rls_policies.sql` - Security policies
9. `09_consolidate_rls_policies.sql` - Policy consolidation
10. `10_add_composite_indexes.sql` - Performance indexes
11. `11_move_extension_to_extensions_schema.sql` - Schema organization

### 12.3 Environment Variables

**Production Variables**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=https://vibedevid.com
```

**Development Variables**:

```env
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
```

### 12.4 CI/CD Pipeline

**Vercel Deployment**:

- Automatic deploy on git push
- Preview deployments for PRs
- Environment variable management
- Edge caching

**Build Commands**:

```bash
npm run build  # or pnpm build
```

### 12.5 Monitoring

**Vercel Dashboard**:

- Function logs
- Performance metrics
- Edge function execution
- Bandwidth usage

**Error Tracking**:

- Server action errors logged
- API route errors logged
- Client-side error boundaries

---

## 13. Appendix

### 13.1 File Structure Reference

```
├── app/
│   ├── [username]/           # User profile pages
│   ├── admin/                # Admin dashboard
│   ├── api/                  # API routes
│   ├── auth/                 # Auth callback
│   ├── project/              # Project pages
│   ├── user/auth/            # Auth forms
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Homepage
├── components/
│   ├── project/              # Project-related components
│   ├── sections/             # Page sections
│   └── ui/                   # shadcn/ui + custom components
├── hooks/                    # Custom React hooks
├── lib/                      # Utilities and configs
│   ├── actions.ts            # Server actions
│   ├── client-analytics.ts   # Analytics utilities
│   ├── client-likes.ts       # Client like functions
│   ├── env-config.ts         # Environment config
│   ├── slug.ts               # Slug utilities
│   ├── supabase/             # Supabase clients
│   └── youtube-utils.ts      # YouTube utilities
├── scripts/                  # Database migrations
├── types/                    # TypeScript types
├── public/                   # Static assets
├── config/                   # Site configuration
└── tests/                    # E2E tests (Playwright)
```

### 13.2 Key Dependencies

**Core Dependencies**:

- `next`: 16.0.10
- `react`: 19.2.3
- `react-dom`: 19.2.3
- `typescript`: 5.x
- `tailwindcss`: 4.1.9

**UI Dependencies**:

- `@radix-ui/react-*`: Latest
- `lucide-react`: 0.454.0
- `class-variance-authority`: 0.7.1
- `clsx`: 2.1.1
- `tailwind-merge`: 2.5.5

**Backend Dependencies**:

- `@supabase/ssr`: Latest
- `@supabase/supabase-js`: ^2.56.0
- `uploadthing`: Latest
- `@uploadthing/react`: Latest

**Utility Dependencies**:

- `framer-motion`: 12.23.12
- `sonner`: 2.0.7
- `date-fns`: 4.1.0
- `swr`: 2.3.6

### 13.3 Testing Strategy

**E2E Tests** (Playwright):

```bash
npx playwright test                    # Run all tests
npx playwright test tests/file.spec    # Run specific file
npx playwright test -g "test name"     # Run by name
npx playwright test --headed           # See browser
npx playwright test --project=chromium # Specific browser
```

**Test Coverage**:

- Views tracking system
- Authentication flows
- Project CRUD operations
- Comment system
- Like functionality

### 13.4 Development Workflow

**Code Quality**:

```bash
pnpm lint     # Run ESLint
pnpm format   # Run Prettier
pnpm typecheck # Run TypeScript
```

**Git Workflow**:

- Main branch: `main`
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`

### 13.5 Troubleshooting Guide

**Common Issues**:

1. **Auth errors**: Check email confirmation, domain whitelist
2. **Image errors**: Verify remote patterns in next.config.mjs
3. **Build errors**: Check TypeScript ignoreBuildErrors setting
4. **Session errors**: Verify middleware cookie handling

**Debug Commands**:

```bash
# Check build
pnpm exec tsc --noEmit

# Analyze bundle
pnpm run analyze

# Test locally
pnpm dev
```

### 13.6 Resources

**Documentation**:

- WARP.md - Living knowledge base
- docs/README.md - Documentation index
- AGENTS.md - AI agent guidelines
- SECURITY.md - Security policies

**External Resources**:

- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com

---

## Document History

| Version | Date     | Author          | Changes                       |
| ------- | -------- | --------------- | ----------------------------- |
| 1.0.0   | Dec 2025 | VibeDev ID Team | Initial product specification |

---

_This document serves as the single source of truth for the VibeDev ID Community Website product specifications. All team members should refer to this document for feature requirements and technical decisions._
