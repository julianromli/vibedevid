# 🧪 Testing Plan - Slug Migration Verification

## Overview

Dokumen ini berisi comprehensive testing plan untuk memverifikasi bahwa migration dari project ID-based URLs ke slug-based URLs berhasil dengan baik di VibeDev platform.

## Pre-requisites ✅

- [ ] Development server running (`npm run dev`)
- [ ] Database migration sudah dijalankan (slug column exists)
- [ ] Backend server actions sudah di-refactor
- [ ] Frontend routes sudah di-rename dari `[id]` ke `[slug]`

---

## 1. 🏠 Homepage Navigation Test

### Test Case 1.1: Project Cards Loading

**Objective**: Verify project cards load correctly with slug URLs

**Steps**:

1. Buka http://localhost:3000
2. Wait for page to fully load
3. Scroll down untuk lihat project cards

**Expected Results**:

- [ ] Homepage loading tanpa error
- [ ] Project cards tampil dengan proper data (title, author, thumbnail)
- [ ] No console errors di browser dev tools

### Test Case 1.2: Project Links Use Slug URLs

**Objective**: Confirm all project links use slug format, not UUID

**Steps**:

1. Right-click pada project card pertama → Inspect Element
2. Look at `href` attribute dari link element
3. Hover over project cards dan check URL di browser status bar
4. Repeat untuk 3-5 project cards lainnya

**Expected Results**:

- [ ] URLs format: `/project/my-awesome-project-slug` (NOT `/project/uuid-123-456`)
- [ ] Slug URLs are human-readable dan SEO-friendly
- [ ] No UUID-based URLs found

---

## 2. 📄 Project Detail Page Test

### Test Case 2.1: Navigation to Project Detail

**Objective**: Test navigation from homepage to project detail via slug URL

**Steps**:

1. Dari homepage, click salah satu project card
2. Wait for project detail page to load
3. Check URL di address bar
4. Verify page content loads correctly

**Expected Results**:

- [ ] URL format: `http://localhost:3000/project/[readable-slug]`
- [ ] Project detail page loads completely
- [ ] Project title, description, author info tampil dengan benar
- [ ] Project stats (likes, views, comments) tampil
- [ ] No loading errors atau broken data

### Test Case 2.2: Project Page Functionality

**Objective**: Test all functionality pada project detail page

**Steps**:

1. Test Like button (logged-in dan guest)
2. Scroll ke comment section
3. Test add comment (guest dengan name, logged-in user)
4. Test share functionality (copy link, social share)
5. If owner: test Edit dan Delete buttons

**Expected Results**:

- [ ] Like button works dan update count
- [ ] Comments can be added successfully
- [ ] Share links menggunakan slug URL
- [ ] Edit/Delete functionality works (if applicable)
- [ ] View count increments properly

---

## 3. 🔄 Legacy Redirect Test

### Test Case 3.1: UUID to Slug Redirect

**Objective**: Verify legacy UUID URLs redirect to slug URLs

**Steps**:

1. Open browser dev tools → Network tab
2. Get a project UUID dari database (manual query atau dari project page source)
3. Manual navigate ke `http://localhost:3000/project/[project-uuid]`
4. Observe redirect behavior

**Expected Results**:

- [ ] Page redirects automatically dari UUID URL ke slug URL
- [ ] HTTP status is 307 (Temporary Redirect) atau redirect via client
- [ ] Final URL format: `/project/[readable-slug]`
- [ ] Project content loads correctly after redirect

### Test Case 3.2: Invalid UUID Handling

**Objective**: Test behavior dengan invalid/non-existent UUID

**Steps**:

1. Navigate ke `http://localhost:3000/project/00000000-0000-0000-0000-000000000000`
2. Observe behavior

**Expected Results**:

- [ ] Redirects to homepage atau shows 404/not found page
- [ ] No application crash atau unhandled errors

---

## 4. 👤 Profile Page Test

### Test Case 4.1: Profile Navigation

**Objective**: Test project links di profile pages

**Steps**:

1. Dari project detail page, click author name/avatar
2. Wait for profile page to load
3. Scroll ke projects section
4. Check project card URLs

**Expected Results**:

- [ ] Profile page loads correctly
- [ ] User projects tampil dengan proper data
- [ ] Project links menggunakan slug URLs (not UUID)

### Test Case 4.2: Profile Project Navigation

**Objective**: Navigate dari profile ke project detail via slug

**Steps**:

1. Dari profile page, click salah satu project card
2. Verify navigation works correctly

**Expected Results**:

- [ ] Navigation successful ke project detail page
- [ ] Correct project loads
- [ ] URL menggunakan slug format

---

## 5. ➕ Submit New Project Test

### Test Case 5.1: Project Submission Flow

**Objective**: Test new project creation dengan slug generation

**Steps**:

1. Navigate ke `/project/submit` (or use Submit Project button)
2. Fill form dengan unique project title (e.g., "My Testing Project 2024")
3. Complete all required fields
4. Submit form
5. Wait for redirect

**Expected Results**:

- [ ] Form submission successful
- [ ] Redirects ke project detail page dengan slug URL
- [ ] Generated slug is readable (e.g., `/project/my-testing-project-2024`)
- [ ] New project data tampil correctly

### Test Case 5.2: Slug Collision Handling

**Objective**: Test slug uniqueness when duplicate titles exist

**Steps**:

1. Submit project dengan title "Test Project"
2. Submit another project dengan same title "Test Project"
3. Check generated slugs

**Expected Results**:

- [ ] First project gets slug: `/project/test-project`
- [ ] Second project gets slug: `/project/test-project-2`
- [ ] Both projects accessible dengan unique URLs
- [ ] No database errors or conflicts

---

## 6. 💬 Comments & Analytics Test

### Test Case 6.1: Comment System with Slugs

**Objective**: Test comment functionality dengan slug-based URLs

**Steps**:

1. Navigate ke any project detail page
2. Add comment sebagai guest (with name)
3. Add comment sebagai logged-in user (if possible)
4. Refresh page dan verify comments persist

**Expected Results**:

- [ ] Comments added successfully
- [ ] Comments visible after page refresh
- [ ] No errors di network tab atau console
- [ ] Comment timestamps dan author info correct

### Test Case 6.2: Analytics Tracking

**Objective**: Verify view tracking works dengan slug system

**Steps**:

1. Note current view count pada project detail page
2. Open project di new browser tab/incognito
3. Refresh original tab dan check view count

**Expected Results**:

- [ ] View count increments appropriately
- [ ] Unique view tracking works (same session doesn't double-count)
- [ ] Analytics data consistent

---

## 7. ✏️ Edit/Delete Project Test (Owner Only)

### Test Case 7.1: Project Editing

**Objective**: Test project edit functionality dengan slug system

**Steps**:

1. Login sebagai project owner
2. Navigate ke your project detail page
3. Click Edit button
4. Modify project details (but NOT title - slug should remain same)
5. Save changes

**Expected Results**:

- [ ] Edit form pre-populated dengan current data
- [ ] Changes saved successfully
- [ ] Slug remains unchanged (even if title modified)
- [ ] Updated data visible on project page

### Test Case 7.2: Project Deletion

**Objective**: Test project deletion via slug

**Steps**:

1. Login sebagai project owner
2. Navigate ke your project detail page
3. Click Delete button
4. Confirm deletion

**Expected Results**:

- [ ] Deletion confirmation dialog appears
- [ ] Project deleted successfully
- [ ] Redirect to homepage atau profile
- [ ] Project no longer accessible via slug URL

---

## 8. 🔍 SEO & Share Test

### Test Case 8.1: Social Share Links

**Objective**: Test sharing functionality menggunakan slug URLs

**Steps**:

1. Navigate ke any project detail page
2. Click Share button
3. Test "Copy Link" functionality
4. Test social media share buttons (Twitter, LinkedIn)

**Expected Results**:

- [ ] Copied link menggunakan slug URL format
- [ ] Social share URLs contain proper slug-based URL
- [ ] Share functionality works without errors

---

## 9. 🚨 Error Handling Test

### Test Case 9.1: Invalid Slug Handling

**Objective**: Test behavior dengan non-existent slugs

**Steps**:

1. Navigate ke `http://localhost:3000/project/non-existent-slug`
2. Observe behavior

**Expected Results**:

- [ ] Shows appropriate 404/not found page
- [ ] No application crash
- [ ] Provides navigation back to homepage

---

## ✅ Final Checklist

Before completing testing, verify:

### Database Integrity

- [ ] All existing projects have unique slugs
- [ ] Slug format follows pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- [ ] No null/empty slug values

### Performance

- [ ] Page load times reasonable (homepage, project detail)
- [ ] No N+1 query problems
- [ ] Database queries optimized for slug lookups

### Browser Compatibility

- [ ] Test di Chrome, Firefox, Safari (if available)
- [ ] Responsive design works pada mobile/tablet
- [ ] No JavaScript errors di any browser

---

## 🐛 Bug Report Template

If any issues found during testing:

```markdown
**Bug Title**: [Brief description]
**Test Case**: [Which test case failed]
**Steps to Reproduce**:

1. Step 1
2. Step 2
3. Step 3

**Expected**: [What should happen]
**Actual**: [What actually happened]
**Browser**: [Chrome/Firefox/Safari version]
**Screenshots**: [If applicable]
**Console Errors**: [Any JavaScript errors]
```

---

## 📝 Test Results Summary

Date: ******\_\_\_******
Tester: ******\_\_\_******

| Test Category       | Status | Notes |
| ------------------- | ------ | ----- |
| Homepage Navigation | ⏳     |       |
| Project Detail Page | ⏳     |       |
| Legacy Redirects    | ⏳     |       |
| Profile Pages       | ⏳     |       |
| Project Submission  | ⏳     |       |
| Comments/Analytics  | ⏳     |       |
| Edit/Delete         | ⏳     |       |
| SEO/Share           | ⏳     |       |
| Error Handling      | ⏳     |       |

**Overall Status**: ⏳ Pending / ✅ Pass / ❌ Fail

**Critical Issues Found**: ******\_\_\_******

**Migration Ready for Production**: ✅ Yes / ❌ No

---

_Happy Testing! 🧪 Semoga migration lancar dan bug-free! 🚀_
