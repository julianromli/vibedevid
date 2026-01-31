# Implementation Plan: AI Event Detail Page

## Overview

Implementasi halaman detail event AI di `/event/[slug]` menggunakan Next.js 16 Server Components. Mengikuti pattern dari project detail page (`/project/[slug]`) dengan data mock untuk fase pertama.

## Tasks

- [x] 1. Extend event utility functions
  - [x] 1.1 Add `getEventBySlug` function to `lib/events-utils.ts`
    - Find event by slug from mockEvents array
    - Return undefined if not found
    - _Requirements: 1.1, 6.1_
  
  - [x] 1.2 Add `getRelatedEvents` function to `lib/events-utils.ts`
    - Filter events by category
    - Exclude current event by id
    - Limit results to specified count (default 3)
    - _Requirements: 9.2, 9.3_
  
  - [x] 1.3 Add date formatting helper functions
    - `formatEventDate` - format date for display (e.g., "15 Feb 2025")
    - `formatEventTime` - format time for display (e.g., "09:00")
    - `formatEventDateRange` - handle multi-day events
    - _Requirements: 1.4_
  
  - [ ]* 1.4 Write property tests for event utility functions
    - **Property 1: Slug lookup returns correct event**
    - **Property 5: Invalid slugs return undefined**
    - **Property 6: Related events filtering**
    - **Validates: Requirements 1.1, 6.1, 9.2, 9.3**

- [x] 2. Create event detail page structure
  - [x] 2.1 Create `app/event/[slug]/page.tsx` Server Component
    - Implement async page component with params
    - Fetch event data using getEventBySlug
    - Call notFound() if event not found
    - Fetch related events
    - _Requirements: 1.1, 6.1_
  
  - [x] 2.2 Implement SEO metadata generation
    - Add generateMetadata async function
    - Set title format: "[Event Name] | AI Events Indonesia"
    - Set description from event.description (truncated to 160 chars)
    - Set og:image from event.coverImage
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 2.3 Write property test for metadata generation
    - **Property 4: Metadata generation follows format**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 3. Checkpoint - Verify page routing works
  - Ensure page loads for valid slugs
  - Ensure 404 for invalid slugs
  - Ask user if questions arise

- [x] 4. Implement event detail UI components
  - [x] 4.1 Create main layout with cover image
    - Use AspectRatio 16:9 for cover image
    - Implement responsive grid layout (2 columns on desktop)
    - Add gradient overlay on image
    - _Requirements: 1.2, 8.1, 10.3_
  
  - [x] 4.2 Implement event header section
    - Display event name as h1
    - Show category badge and status badge
    - Use existing badge styles from EventCard
    - _Requirements: 1.3, 2.1, 2.2, 2.3_
  
  - [x] 4.3 Implement event info section
    - Display date/time with Calendar icon
    - Display location with MapPin icon
    - Display organizer with Users icon
    - Handle multi-day events display
    - _Requirements: 1.4, 1.5, 1.6, 1.7_
  
  - [x] 4.4 Implement registration CTA
    - Create prominent button linking to registrationUrl
    - Open in new tab with rel="noopener noreferrer"
    - Show ExternalLink icon
    - Disable/hide for past events
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ]* 4.5 Write property test for past event CTA state
    - **Property 3: Past events have disabled registration**
    - **Validates: Requirements 3.4**

- [x] 5. Implement share and navigation features
  - [x] 5.1 Create `components/event/event-share-button.tsx` Client Component
    - Copy current URL to clipboard on click
    - Show toast notification on success using sonner
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 5.2 Implement back navigation
    - Add back link/button to `/event/list`
    - Place in header area with ArrowLeft icon
    - _Requirements: 4.1, 4.2_

- [x] 6. Implement related events section
  - [x] 6.1 Create related events grid
    - Display max 3 events with same category
    - Exclude current event
    - Use existing EventCard component with grid variant
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 7. Checkpoint - Full page integration
  - Verify all sections render correctly
  - Test share functionality
  - Test registration button behavior
  - Test related events display
  - Ask user if questions arise

- [x] 8. Create loading state
  - [x] 8.1 Create `app/event/[slug]/loading.tsx`
    - Skeleton for cover image
    - Skeleton for title and badges
    - Skeleton for event info
    - _Requirements: 8.1_

- [x] 9. Final integration and polish
  - [x] 9.1 Add Navbar and Footer
    - Use existing Navbar component
    - Use existing Footer component
    - _Requirements: 10.1_
  
  - [x] 9.2 Apply design system styles
    - Use existing color tokens
    - Use existing typography classes
    - Ensure dark mode compatibility
    - _Requirements: 10.2_
  
  - [ ]* 9.3 Write E2E tests with Playwright
    - Test page renders for valid slug
    - Test 404 for invalid slug
    - Test share button copies link
    - Test registration button opens external URL
    - Test back navigation works
    - _Requirements: 1.1, 6.1, 7.2, 3.2, 4.1_

- [x] 10. Final checkpoint
  - Ensure all tests pass
  - Verify responsive layout on mobile/tablet/desktop
  - Ask user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Use existing components (EventCard, Badge, Navbar, Footer) where possible
- Follow patterns from `/project/[slug]` for consistency
