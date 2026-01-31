# Implementation Plan: Submit Event Modal

## Overview

Implementasi fitur Submit Event Modal dalam dua fase:
- Phase 1: UI components dengan mock submission (console.log/toast)
- Phase 2: Integrasi Supabase (future)

Stack: Next.js 16 + React 19 + TypeScript + Tailwind v4 + UploadThing

## Tasks

- [x] 1. Setup utility functions dan types
  - [x] 1.1 Extend types/events.ts dengan EventFormData interface
    - Tambah field: approved, submitted_by
    - Export EventFormData type
    - _Requirements: 5.1, 5.4_
  
  - [x] 1.2 Create lib/event-form-utils.ts dengan slug generator dan validators
    - Implement generateEventSlug(name: string): string
    - Implement validateEventForm(data: Partial<EventFormData>): ValidationResult
    - Implement validateURL(url: string): boolean
    - _Requirements: 2.2, 4.1, 4.2, 4.3_
  
  - [ ]* 1.3 Write property tests untuk slug generator
    - **Property 1: Slug Generation Consistency**
    - **Validates: Requirements 2.2**
  
  - [ ]* 1.4 Write property tests untuk form validator
    - **Property 5: Required Field Validation**
    - **Property 6: URL Format Validation**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 2. Checkpoint - Ensure utility functions work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Create CoverImageUploader component
  - [x] 3.1 Create components/event/cover-image-uploader.tsx
    - Implement dual mode: upload via UploadThing atau URL input
    - Add tab/toggle untuk switch antara mode
    - Implement image preview setelah upload/URL input
    - Implement file size validation (max 10MB)
    - Use existing UploadThing configuration
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 3.2 Write property test untuk file size validation
    - **Property 3: File Size Validation**
    - **Validates: Requirements 3.3**

- [x] 4. Create useEventForm hook
  - [x] 4.1 Create hooks/useEventForm.ts
    - Manage form state dengan useState
    - Auto-generate slug saat name berubah
    - Auto-set status ke 'upcoming'
    - Auto-set approved ke false
    - Implement setField, validateForm, resetForm, handleSubmit
    - _Requirements: 2.2, 2.5, 5.1_
  
  - [ ]* 4.2 Write property tests untuk hook behavior
    - **Property 2: Status Default Value**
    - **Property 7: Approval Status Default**
    - **Property 8: User Attribution**
    - **Validates: Requirements 2.5, 5.1, 1.3, 5.4**

- [x] 5. Create SubmitEventModal component
  - [x] 5.1 Create components/event/submit-event-modal.tsx
    - Use existing Dialog component dari components/ui/dialog.tsx
    - Implement form dengan semua required fields
    - Add dropdowns untuk locationType dan category
    - Integrate CoverImageUploader component
    - Integrate useEventForm hook
    - Add loading state dan disable submit saat loading
    - _Requirements: 2.1, 2.3, 2.4, 6.1, 6.2, 6.3_
  
  - [x] 5.2 Implement form submission handler (Phase 1: mock)
    - Console.log submitted data
    - Show success toast via sonner
    - Close modal dan redirect ke /event/list
    - _Requirements: 5.2, 5.3_

- [x] 6. Checkpoint - Ensure modal component renders correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Integrate modal ke event list page
  - [x] 7.1 Create components/event/submit-event-section.tsx
    - Section dengan heading dan description
    - Tombol "Submit Event" yang trigger modal
    - Check auth state via useAuth hook
    - Show login prompt jika belum login
    - _Requirements: 1.1, 1.2, 6.4_
  
  - [x] 7.2 Update app/event/list/page.tsx
    - Import dan render SubmitEventSection di bawah event list
    - Pass user ID ke modal jika authenticated
    - _Requirements: 6.4_

- [x] 8. Final checkpoint - Full integration test
  - Ensure all tests pass, ask the user if questions arise.
  - Manual test: open modal, fill form, submit, verify toast dan redirect

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Phase 2 (Supabase integration) akan ditambahkan sebagai spec terpisah
- Gunakan pola yang sama dengan SubmitProjectForm untuk konsistensi
- UploadThing endpoint yang digunakan: projectImageUploader (atau buat endpoint baru eventImageUploader)
