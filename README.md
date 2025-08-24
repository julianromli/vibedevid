# TRAE Community ID

A modern community platform built with Next.js, Supabase, and Tailwind CSS.

## Features

- 🔐 User authentication with Supabase Auth
- 👤 User profiles with customizable avatars
- 📝 Project showcase and management
- 💬 Comments and interactions
- 🌙 Dark/Light mode support
- 📱 Responsive design

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Supabase account and project

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/julianromli/traecommunityid.git
cd traecommunityid
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
# or
pnpm install
# or
bun install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Update `.env.local` with your Supabase credentials:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
\`\`\`

5. Set up the database:
   - Run the SQL scripts in the `scripts/` folder in your Supabase SQL editor:
     - `01_create_tables.sql` - Creates the database schema
     - `02_seed_data.sql` - Adds sample data
     - `03_create_storage_bucket.sql` - Sets up file storage

6. Run the development server:
\`\`\`bash
npm run dev
# or
pnpm dev
# or
bun dev
\`\`\`

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

The project uses Supabase as the backend. You'll need to:

1. Create a new Supabase project
2. Run the SQL scripts in the `scripts/` folder
3. Configure Row Level Security (RLS) policies
4. Set up storage buckets for file uploads

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Yes |
| `NEXT_PUBLIC_SITE_URL` | Your site URL (for production) | Yes |
| `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` | Redirect URL for development | Yes |

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn/ui
- **Icons**: Lucide React
- **Fonts**: Geist Sans & Geist Mono
- **Language**: TypeScript

## Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── [username]/        # Dynamic user profile pages
│   ├── project/           # Project detail pages
│   ├── user/              # User authentication pages
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   └── ui/               # UI components
├── lib/                  # Utility functions
│   ├── actions.ts        # Server actions
│   └── supabase/         # Supabase client configuration
├── scripts/              # Database setup scripts
└── public/               # Static assets
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
