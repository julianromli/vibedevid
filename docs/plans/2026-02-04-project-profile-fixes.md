# Project & Profile Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix high and medium priority issues from the code review: move profile update to server action, add username validation, replace `any` types, replace `alert()` with toast, and fix broken link.

**Architecture:** Server actions for mutations, proper TypeScript interfaces, consistent toast notifications.

**Tech Stack:** Next.js 16, TypeScript, Supabase, sonner (toast)

---

## Task 1: Create Server Action for Profile Update

**Files:**
- Modify: `lib/actions/user.ts` (add new server action)

**Step 1: Add the `updateUserProfile` server action**

Add the following to `lib/actions/user.ts`:

```typescript
// Add these imports at the top if not present
import { revalidatePath } from 'next/cache'

// Add this interface after the imports
interface UpdateProfileData {
  username: string
  displayName: string
  bio: string
  avatar_url: string
  location: string
  website: string
  github_url: string
  twitter_url: string
}

// Add this interface for the result
interface UpdateProfileResult {
  success: boolean
  error?: string
  data?: UpdateProfileData
  usernameChanged?: boolean
  newUsername?: string
}

// Add this function after getCurrentUser
export async function updateUserProfile(
  currentUsername: string,
  profileData: UpdateProfileData
): Promise<UpdateProfileResult> {
  try {
    const supabase = await createClient()

    // Validate user is authenticated
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify user owns this profile
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', currentUsername)
      .single()

    if (userError || !currentUser) {
      return { success: false, error: 'Profile not found' }
    }

    if (currentUser.id !== authData.user.id) {
      return { success: false, error: 'Not authorized to edit this profile' }
    }

    // Check username uniqueness if changed
    const usernameChanged = profileData.username !== currentUsername
    if (usernameChanged) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', profileData.username)
        .neq('id', currentUser.id)
        .single()

      if (existingUser) {
        return { success: false, error: 'Username is already taken' }
      }
    }

    // Perform the update
    const { data, error } = await supabase
      .from('users')
      .update({
        username: profileData.username,
        display_name: profileData.displayName,
        bio: profileData.bio,
        avatar_url: profileData.avatar_url,
        location: profileData.location,
        website: profileData.website,
        github_url: profileData.github_url,
        twitter_url: profileData.twitter_url,
        updated_at: new Date().toISOString(),
      })
      .eq('username', currentUsername)
      .select()

    if (error) {
      console.error('Error updating profile:', error)
      return { success: false, error: error.message }
    }

    // Revalidate the profile page
    revalidatePath(`/${currentUsername}`)
    if (usernameChanged) {
      revalidatePath(`/${profileData.username}`)
    }

    return {
      success: true,
      data: profileData,
      usernameChanged,
      newUsername: usernameChanged ? profileData.username : undefined,
    }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { success: false, error: 'Failed to update profile' }
  }
}
```

**Step 2: Verify the file compiles**

Run: `bun tsc --noEmit`
Expected: No errors in `lib/actions/user.ts`

**Step 3: Commit**

```bash
git add lib/actions/user.ts
git commit -m "feat: add updateUserProfile server action with username validation"
```

---

## Task 2: Update Profile Page to Use Server Action

**Files:**
- Modify: `app/[username]/page.tsx`

**Step 1: Remove client-side `updateUserProfile` function**

Remove lines 22-48 (the `updateUserProfile` function defined in the page).

**Step 2: Import the server action and toast**

Add these imports at the top of the file:

```typescript
import { toast } from 'sonner'
import { updateUserProfile } from '@/lib/actions/user'
```

**Step 3: Update `handleSaveProfile` to use server action and toast**

Replace the `handleSaveProfile` function (around lines 353-390) with:

```typescript
const handleSaveProfile = async (profileData: {
  displayName: string
  username: string
  bio: string
  location: string
  website: string
  github_url: string
  twitter_url: string
  avatar_url: string
}) => {
  setSaving(true)
  try {
    const result = await updateUserProfile(username, profileData)
    if (result.success) {
      setShowEditDialog(false)

      const updatedUser = {
        ...user,
        username: profileData.username,
        display_name: profileData.displayName,
        bio: profileData.bio,
        location: profileData.location,
        website: profileData.website,
        github_url: profileData.github_url,
        twitter_url: profileData.twitter_url,
        avatar_url: profileData.avatar_url,
      }

      setUser(updatedUser)
      toast.success('Profile updated successfully')

      if (result.usernameChanged && result.newUsername) {
        router.push(`/${result.newUsername}`)
      }
    } else {
      toast.error(result.error || 'Failed to update profile')
    }
  } catch (error) {
    console.error('Error saving profile:', error)
    toast.error('Error saving profile')
  } finally {
    setSaving(false)
  }
}
```

**Step 4: Verify the file compiles**

Run: `bun tsc --noEmit`
Expected: No errors related to the profile page

**Step 5: Commit**

```bash
git add app/[username]/page.tsx
git commit -m "refactor: use server action for profile update with toast notifications"
```

---

## Task 3: Replace `any` Types with Proper Interfaces

**Files:**
- Modify: `app/[username]/page.tsx`

**Step 1: Import the User type**

Add this import at the top of the file:

```typescript
import type { User } from '@/types/homepage'
```

**Step 2: Create ProfileUser interface for the page state**

Add this interface after the imports (around line 21):

```typescript
interface ProfileUser {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  location: string | null
  website: string | null
  github_url: string | null
  twitter_url: string | null
  joined_at: string
  role?: number | null
}

interface UserProject {
  id: string
  slug: string
  title: string
  description: string | null
  category: string | null
  website_url: string | null
  image_url: string | null
  thumbnail_url: string | null
  url: string | null
  author_id: string
  created_at: string
  updated_at: string | null
  likes: number
  views_count: number
  comments_count: number
}
```

**Step 3: Update state declarations to use proper types**

Replace the state declarations (around lines 268-271):

```typescript
// Before
const [currentUser, setCurrentUser] = useState<any>(null)
const [user, setUser] = useState<any>(null)
const [userProjects, setUserProjects] = useState<any[]>([])

// After
const [currentUser, setCurrentUser] = useState<User | null>(null)
const [user, setUser] = useState<ProfileUser | null>(null)
const [userProjects, setUserProjects] = useState<UserProject[]>([])
```

**Step 4: Update function signatures**

Update the `fetchUserProjects` function return type (around line 63):

```typescript
// In the map callback, add type annotation
return (projectsData || []).map((project: UserProject) => ({
```

**Step 5: Verify the file compiles**

Run: `bun tsc --noEmit`
Expected: No type errors

**Step 6: Commit**

```bash
git add app/[username]/page.tsx
git commit -m "refactor: replace any types with proper TypeScript interfaces"
```

---

## Task 4: Replace `alert()` with Toast in ProjectEditClient

**Files:**
- Modify: `components/project/ProjectEditClient.tsx`

**Step 1: Add sonner import**

Add this import at the top of the file:

```typescript
import { toast } from 'sonner'
```

**Step 2: Replace alert() calls with toast**

Replace line 112:
```typescript
// Before
alert(result.error || 'Failed to update project')

// After
toast.error(result.error || 'Failed to update project')
```

Replace line 115:
```typescript
// Before
alert('Failed to update project')

// After
toast.error('Failed to update project')
```

**Step 3: Add success toast after successful update (optional improvement)**

After line 110 (inside the `if (result.success)` block), before `window.location.reload()`:
```typescript
toast.success('Project updated successfully')
```

**Step 4: Verify the file compiles**

Run: `bun tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add components/project/ProjectEditClient.tsx
git commit -m "refactor: replace alert() with toast notifications in ProjectEditClient"
```

---

## Task 5: Replace `alert()` with Toast in ProjectActionsClient

**Files:**
- Modify: `components/project/ProjectActionsClient.tsx`

**Step 1: Add sonner import**

Add this import at the top of the file:

```typescript
import { toast } from 'sonner'
```

**Step 2: Replace alert() with toast**

Replace line 36:
```typescript
// Before
alert(result.error || 'Failed to delete project')

// After
toast.error(result.error || 'Failed to delete project')
```

**Step 3: Verify the file compiles**

Run: `bun tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add components/project/ProjectActionsClient.tsx
git commit -m "refactor: replace alert() with toast notifications in ProjectActionsClient"
```

---

## Task 6: Fix Broken Link `/project/new` → `/project/submit`

**Files:**
- Modify: `app/[username]/page.tsx`

**Step 1: Fix the broken link**

Find line 524 and replace:
```typescript
// Before
actionLink="/project/new"

// After
actionLink="/project/submit"
```

**Step 2: Verify the change**

Search the file for any other occurrences of `/project/new`:
```bash
findstr /i "project/new" "app/[username]/page.tsx"
```
Expected: No results (only the fixed line should exist)

**Step 3: Commit**

```bash
git add app/[username]/page.tsx
git commit -m "fix: correct broken link from /project/new to /project/submit"
```

---

## Task 7: Final Verification

**Step 1: Run type check**

Run: `bun tsc --noEmit`
Expected: No errors

**Step 2: Run linter**

Run: `bun lint`
Expected: No new errors

**Step 3: Run formatter**

Run: `bun format`
Expected: Files formatted

**Step 4: Build test**

Run: `bun build`
Expected: Build succeeds

**Step 5: Manual testing checklist**

- [ ] Navigate to a user profile page
- [ ] Click "Edit Profile" button (as owner)
- [ ] Change display name and save → Toast shows success
- [ ] Try changing username to existing username → Toast shows "Username is already taken"
- [ ] Navigate to project detail page
- [ ] Edit project with error → Toast shows error instead of alert
- [ ] Delete project with error → Toast shows error instead of alert
- [ ] On empty profile, "Add Project" button links to `/project/submit`

**Step 6: Final commit (if any formatting changes)**

```bash
git add -A
git commit -m "chore: format files after refactoring"
```

---

## Summary of Changes

| Task | File | Change |
|------|------|--------|
| 1 | `lib/actions/user.ts` | Add `updateUserProfile` server action with username validation |
| 2 | `app/[username]/page.tsx` | Use server action, add toast notifications |
| 3 | `app/[username]/page.tsx` | Replace `any` types with `User`, `ProfileUser`, `UserProject` |
| 4 | `components/project/ProjectEditClient.tsx` | Replace `alert()` with `toast.error()` |
| 5 | `components/project/ProjectActionsClient.tsx` | Replace `alert()` with `toast.error()` |
| 6 | `app/[username]/page.tsx` | Fix link from `/project/new` to `/project/submit` |

## Files Modified

- `lib/actions/user.ts`
- `app/[username]/page.tsx`
- `components/project/ProjectEditClient.tsx`
- `components/project/ProjectActionsClient.tsx`
