# VibeDev ID

**When the Codes Meet the Vibes** 🚀

VibeDev ID adalah komunitas vibrant developer, AI enthusiasts, dan tech innovators Indonesia yang punya visi dan passion yang sama untuk bikin produk digital yang keren. Kami menghubungkan creator yang sepikiran untuk kolaborasi, belajar, dan berkembang bareng.

*Indonesia's premier community for developers, vibe coders, and AI enthusiasts. Showcase projects, collaborate, network, and level up your skills in web, mobile, and AI development.*

## Features

- 🔐 **User Authentication** - Secure login with Supabase Auth
- 👤 **Developer Profiles** - Customizable profiles with bio, skills, and social links
- 📝 **Project Showcase** - Share dan showcase project keren lo
- 💬 **Community Interaction** - Comments, likes, dan diskusi project
- 🤝 **Networking & Collaboration** - Connect sama developer yang sepikiran
- 🌙 **Dark/Light Mode** - UI theme yang nyaman mata
- 📱 **Responsive Design** - Perfect di semua device
- 🏷️ **Project Categories** - Personal Web, SaaS, Landing Page, dan lainnya
- ❤️ **Like System** - Like project yang lo suka
- 🔍 **Discovery** - Filter dan cari project berdasarkan kategori

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/vibedevid_v0.git
cd vibedevid_v0
```

2. Install dependencies:
\`\`\`bash
npm install
# or
pnpm install
# or
bun install
\`\`\`

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
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
```

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
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (keep secret!) | Yes |
| `UPLOADTHING_TOKEN` | Your UploadThing API token (keep secret!) | Yes |
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

Kami welcome kontribusi dari semua developer! 🎉

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write descriptive commit messages
- Test your changes on both desktop and mobile
- Maintain the informal but professional Indonesian tone in UI copy

## License

This project is licensed under the MIT License.
