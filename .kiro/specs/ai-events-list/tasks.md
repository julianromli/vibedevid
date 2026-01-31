# Implementation Plan: AI Events List Page

## Overview

Implementasi halaman AI Events List (`/event/list`) untuk platform VibeDevID. Fase pertama fokus pada UI dengan data mock, mengikuti pola yang sudah ada di `/project/list`.

## Tasks

- [x] 1. Setup type definitions dan mock data
  - [x] 1.1 Buat file `types/events.ts` dengan interface AIEvent, EventCategory, EventLocationType, EventStatus
    - Definisikan semua type sesuai design document
    - Export semua types untuk digunakan di komponen lain
    - _Requirements: 5.3, 5.4_
  
  - [x] 1.2 Buat file `lib/data/mock-events.ts` dengan minimal 6 event mock
    - Variasi kategori: workshop, meetup, conference, hackathon
    - Variasi lokasi: online, offline, hybrid
    - Variasi status: upcoming, ongoing, past
    - Variasi tanggal untuk testing sort
    - _Requirements: 5.1, 5.2_
  
  - [ ]* 1.3 Write property test untuk mock data completeness
    - **Property 8: Mock Data Field Completeness**
    - **Validates: Requirements 5.4**

- [x] 2. Implementasi filter dan sort logic
  - [x] 2.1 Buat file `lib/events-utils.ts` dengan fungsi filter dan sort
    - `filterByCategory(events, category)` - filter berdasarkan kategori
    - `filterByLocation(events, locationType)` - filter berdasarkan tipe lokasi
    - `filterByDateRange(events, startDate, endDate)` - filter berdasarkan rentang tanggal
    - `sortByNearestDate(events)` - sort berdasarkan tanggal terdekat
    - `applyFilters(events, filters)` - kombinasi semua filter
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 3.1, 3.3_
  
  - [ ]* 2.2 Write property test untuk category filter
    - **Property 2: Category Filter Correctness**
    - **Validates: Requirements 2.4**
  
  - [ ]* 2.3 Write property test untuk location filter
    - **Property 3: Location Filter Correctness**
    - **Validates: Requirements 2.5**
  
  - [ ]* 2.4 Write property test untuk date filter
    - **Property 4: Date Filter Correctness**
    - **Validates: Requirements 2.6**
  
  - [ ]* 2.5 Write property test untuk combined filter
    - **Property 5: Combined Filter AND Logic**
    - **Validates: Requirements 2.7**
  
  - [ ]* 2.6 Write property test untuk sort by date
    - **Property 6: Sort by Nearest Date**
    - **Validates: Requirements 3.1, 3.2**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implementasi EventCard component
  - [x] 4.1 Buat file `components/event/event-card.tsx`
    - Cover image dengan AspectRatio 16:9
    - Category badge (top-left) dengan styling per kategori
    - Status badge (top-right) dengan warna berbeda per status
    - Event title, date & time, location, organizer, description
    - Gunakan komponen UI yang sudah ada (Badge, AspectRatio, Card)
    - _Requirements: 1.2, 1.3, 1.4_
  
  - [ ]* 4.2 Write property test untuk event card rendering
    - **Property 1: Event Card Rendering Completeness**
    - **Validates: Requirements 1.2, 1.3, 1.4**

- [x] 5. Implementasi EventFilterControls component
  - [x] 5.1 Buat file `components/event/event-filter-controls.tsx`
    - Category filter dropdown (All, Workshop, Meetup, Conference, Hackathon)
    - Location filter dropdown (All, Online, Offline, Hybrid)
    - Sort dropdown (Terdekat, Terbaru)
    - Ikuti pola UI dari `/project/list`
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 6. Implementasi halaman Event List
  - [x] 6.1 Buat file `app/event/list/page.tsx`
    - Import dan gunakan Navbar, Footer
    - Import EventCard dan EventFilterControls
    - State management untuk filter (useState)
    - Apply filter dan sort ke mock data
    - Grid layout responsif (1 col mobile, 2 col tablet, 3 col desktop)
    - Empty state ketika tidak ada event yang sesuai filter
    - _Requirements: 1.1, 1.5, 4.1, 4.2, 4.3, 6.1_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Integration testing
  - [x]* 8.1 Write Playwright E2E test untuk event list page
    - Test page loads dengan semua komponen
    - Test filter dropdowns berfungsi
    - Test event cards menampilkan informasi yang benar
    - _Requirements: 1.1, 2.1, 2.2, 2.3_

- [-] 9. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify halaman dapat diakses di `/event/list`
  - Verify filter dan sort berfungsi dengan benar

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Fase ini menggunakan data mock, integrasi database di fase berikutnya
- Design mengikuti pola yang sudah ada di `/project/list`
- Gunakan komponen UI yang sudah ada (Badge, Button, Card, AspectRatio)
