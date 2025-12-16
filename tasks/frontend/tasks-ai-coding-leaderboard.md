# AI Coding Model Leaderboard Section

## Relevant Files

- `components/sections/ai-leaderboard-section.tsx` - Main section component with horizontal bar chart visualization
- `app/api/ai-leaderboard/route.ts` - Server route to fetch and cache data from Artificial Analysis
- `lib/ai-leaderboard-data.ts` - Static fallback data, type definitions, and provider logo mapping
- `app/(home)/page.tsx` - Home page where section will be imported and placed
- `public/logos/` - Directory for company logos (Google, Anthropic, OpenAI, xAI, etc.)

### Notes

- Data source: Artificial Analysis Coding Index (https://artificialanalysis.ai/?intelligence=coding-index)
- Displays Top 10 AI Coding Models with horizontal bar chart
- Includes company logos, hover effects, and attribution
- Dynamic fetch with 24-hour cache, fallback to static data
- Uses Motion library for animations (already installed)

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Run `git status` to ensure clean working directory
  - [x] 0.2 Create and checkout a new branch (`git checkout -b feature/ai-coding-leaderboard`)

- [x] 1.0 Set up data layer and types
  - [x] 1.1 Create `lib/ai-leaderboard-data.ts` file
  - [x] 1.2 Define `AIModel` TypeScript interface with fields: `rank`, `name`, `score`, `provider`, `providerSlug`, `logoUrl`, `detailsUrl`
  - [x] 1.3 Define `LeaderboardResponse` interface for API response
  - [x] 1.4 Create provider logo URL mapping object (Google, Anthropic, OpenAI, xAI, Moonshot, DeepSeek, Alibaba, Zhipu, Mistral, Meta)
  - [x] 1.5 Create provider brand color mapping object (hex colors for each provider)
  - [x] 1.6 Add static fallback data array with Top 10 models from Artificial Analysis Coding Index
  - [x] 1.7 Export all types, mappings, and fallback data

- [x] 2.0 Create API route for dynamic data fetching
  - [x] 2.1 Create `app/api/ai-leaderboard/route.ts` file
  - [x] 2.2 Implement GET handler with Next.js App Router pattern
  - [x] 2.3 Fetch data from Artificial Analysis page (server-side)
  - [x] 2.4 Parse embedded JSON data from the scraped HTML (look for schema.org Dataset)
  - [x] 2.5 Filter and sort to get Top 10 coding models
  - [x] 2.6 Map parsed data to `AIModel` interface shape
  - [x] 2.7 Add error handling with fallback to static data
  - [x] 2.8 Configure Next.js revalidation to 86400 seconds (24 hours)
  - [x] 2.9 Return JSON response with proper headers

- [x] 3.0 Prepare company logo assets
  - [x] 3.1 Create `public/logos/ai-providers/` directory
  - [x] 3.2 Source SVG logos for: Google, Anthropic, OpenAI, xAI, Moonshot, DeepSeek, Alibaba, Zhipu, Mistral, Meta
  - [x] 3.3 Optimize SVGs (remove unnecessary metadata, consistent viewBox)
  - [x] 3.4 Ensure logos work in both light and dark mode (or create variants)
  - [x] 3.5 Update logo URL mapping in `lib/ai-leaderboard-data.ts` to point to local files

- [x] 4.0 Build leaderboard section component
  - [x] 4.1 Create `components/sections/ai-leaderboard-section.tsx` file
  - [x] 4.2 Add section container with proper padding matching other sections (`py-16 md:py-32`)
  - [x] 4.3 Add section header with headline "Benchmark AI Coding Model 2025"
  - [x] 4.4 Add subtitle paragraph explaining the data source (LiveCodeBench, SciCode, Terminal-Bench Hard)
  - [x] 4.5 Create data fetching logic using `fetch` to `/api/ai-leaderboard` with error handling
  - [x] 4.6 Build horizontal bar chart layout using flex/grid
  - [x] 4.7 For each model: render rank number, provider logo (Image component), model name, animated bar, score
  - [x] 4.8 Style bars with provider brand colors from mapping
  - [x] 4.9 Make bar width proportional to score (percentage of max score)
  - [x] 4.10 Add responsive design (stacked/compact on mobile, full on desktop)
  - [x] 4.11 Add dark mode support using design system tokens
  - [x] 4.12 Add attribution footer with Artificial Analysis logo and link

- [x] 5.0 Implement hover effects and animations
  - [x] 5.1 Import `motion` from `motion/react`
  - [x] 5.2 Wrap each bar row in `motion.div` with hover scale effect (`scale: 1.02`)
  - [x] 5.3 Add spring transition config matching navbar (`stiffness: 300, damping: 30`)
  - [x] 5.4 Implement staggered entrance animation using `variants` and `staggerChildren`
  - [x] 5.5 Add viewport trigger for entrance animation (`whileInView`)
  - [x] 5.6 Create tooltip component for hover showing benchmark breakdown details
  - [x] 5.7 Add subtle glow effect on hover matching bar color
  - [x] 5.8 Implement score counter animation (animate from 0 to actual score)

- [x] 6.0 Integrate section into home page
  - [x] 6.1 Open `app/page.tsx` (corrected path)
  - [x] 6.2 Import `AILeaderboardSection` component
  - [x] 6.3 Place component after `CommunityFeaturesSection` in the page layout
  - [x] 6.4 Verify section renders correctly in development
  - [x] 6.5 Check section spacing and visual flow with adjacent sections

- [x] 7.0 Test and verify
  - [x] 7.1 Run TypeScript check (`pnpm exec tsc --noEmit`) - no errors in new code
  - [x] 7.2 Run ESLint (`pnpm lint`) - no errors in new code
  - [x] 7.3 Test API route directly in browser (`/api/ai-leaderboard`)
  - [x] 7.4 Verify data fetching and fallback behavior (disconnect network to test fallback)
  - [x] 7.5 Test responsive design at mobile (375px), tablet (768px), desktop (1280px)
  - [x] 7.6 Test dark mode toggle
  - [x] 7.7 Test hover effects and animations
  - [x] 7.8 Verify attribution link works
  - [x] 7.9 Check accessibility (contrast, focus states, screen reader)
  - [x] 7.10 Commit changes with message `feat: add AI coding model leaderboard section`
