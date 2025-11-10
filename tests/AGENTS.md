# Tests - AI Agent Guidelines

## Package Identity
End-to-end (E2E) tests for VibeDev ID using Playwright. Validates critical user flows, authentication, and analytics.

**Primary tech**: Playwright, TypeScript

## Setup & Run

```bash
# Install Playwright browsers (one-time)
npx playwright install

# Run all tests
npx playwright test

# Run specific test file
npx playwright test views-tracking.spec.ts

# Run tests in UI mode (interactive)
npx playwright test --ui

# Run tests in headed mode (see browser)
npx playwright test --headed

# Debug a specific test
npx playwright test --debug
```

## Patterns & Conventions

### File Organization
```
tests/
├── views-tracking.spec.ts    # Analytics tracking tests
├── auth.spec.ts              # Authentication flow tests (future)
├── project-submit.spec.ts    # Project submission tests (future)
└── ...other test files
```

### Naming Rules
- **File names**: `feature-name.spec.ts` (e.g., `views-tracking.spec.ts`)
- **Test descriptions**: Describe user behavior, not implementation
- **Selectors**: Use data-testid attributes (preferred) or accessible roles

### Test Patterns

#### ✅ DO: Test User Flows, Not Implementation
```typescript
// tests/views-tracking.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Project Views Tracking', () => {
  test('should track view when visiting project page', async ({ page }) => {
    // Navigate to project
    await page.goto('/project/my-awesome-project')
    
    // Wait for page load
    await page.waitForLoadState('networkidle')
    
    // Verify project is displayed
    await expect(page.locator('h1')).toContainText('My Awesome Project')
    
    // Verify analytics event was fired (check network request or database)
    // Implementation depends on your analytics setup
  })
  
  test('should not track duplicate views from same session', async ({ page }) => {
    // Visit project twice with same session
    await page.goto('/project/my-awesome-project')
    await page.waitForLoadState('networkidle')
    
    // Navigate away
    await page.goto('/')
    
    // Return to same project
    await page.goto('/project/my-awesome-project')
    await page.waitForLoadState('networkidle')
    
    // Verify only one view was tracked (check database or analytics)
  })
})
```
**Example**: [`views-tracking.spec.ts`](views-tracking.spec.ts)

#### ✅ DO: Use Accessible Selectors
```typescript
// ✅ GOOD: Use data-testid or accessible roles
await page.getByTestId('submit-button').click()
await page.getByRole('button', { name: 'Submit' }).click()
await page.getByLabel('Email').fill('user@example.com')

// ⚠️ AVOID: CSS selectors (brittle, implementation-dependent)
await page.locator('.submit-btn').click()
await page.locator('#email-input').fill('user@example.com')
```

#### ✅ DO: Test Redirects (UUID → Slug)
```typescript
test('should redirect legacy UUID URLs to slug URLs', async ({ page }) => {
  const projectUUID = '123e4567-e89b-12d3-a456-426614174000'
  
  // Visit legacy UUID URL
  await page.goto(`/project/${projectUUID}`)
  
  // Should redirect to slug URL
  await expect(page).toHaveURL(/\/project\/[a-z0-9-]+$/)
  await expect(page).not.toHaveURL(/\/project\/[0-9a-f-]{36}$/)
})
```
**Pattern**: Critical for backward compatibility (see WARP.md)

#### ✅ DO: Test Authentication Flows
```typescript
test.describe('Authentication', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/user/auth/login')
    
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()
    
    // Should redirect to homepage
    await expect(page).toHaveURL('/')
    
    // Should show user menu
    await expect(page.getByTestId('user-menu')).toBeVisible()
  })
  
  test('should protect project submit page', async ({ page }) => {
    await page.goto('/project/submit')
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/user\/auth\/login/)
  })
})
```

#### ✅ DO: Wait for Network/Load States
```typescript
// Wait for page to fully load
await page.waitForLoadState('networkidle')

// Wait for specific network request
const response = await page.waitForResponse(
  (response) => response.url().includes('/api/projects') && response.status() === 200
)

// Wait for element to be visible
await page.waitForSelector('[data-testid="project-card"]', { state: 'visible' })
```

#### ❌ DON'T: Use Hardcoded Delays
```typescript
// ❌ BAD: Arbitrary timeouts (flaky tests)
await page.goto('/project/list')
await page.waitForTimeout(3000)  // What if network is slow?

// ✅ GOOD: Wait for specific conditions
await page.goto('/project/list')
await page.waitForLoadState('networkidle')
await page.waitForSelector('[data-testid="project-card"]')
```

#### ❌ DON'T: Test Implementation Details
```typescript
// ❌ BAD: Testing internal state
test('should update state variable', async ({ page }) => {
  // Testing React state is implementation detail
})

// ✅ GOOD: Test user-visible behavior
test('should display success message after submission', async ({ page }) => {
  await page.getByTestId('submit-button').click()
  await expect(page.getByText('Success!')).toBeVisible()
})
```

### Test Categories

**Critical Flows** (Must have tests):
- User authentication (login, logout, session)
- Project submission
- Analytics tracking (views, likes)
- Slug-based routing and redirects

**Important Flows** (Should have tests):
- Project filtering and search
- User profile editing
- Image uploads
- Form validations

**Nice to Have** (Can be tested):
- UI animations
- Responsive layouts
- Theme switching

## Touch Points / Key Files

**Existing Tests**:
- Views tracking: [`views-tracking.spec.ts`](views-tracking.spec.ts)

**Playwright Config**:
- Configuration: `../playwright.config.ts` (in root)

**Test Helpers** (Future):
- Auth helpers: Create `helpers/auth.ts` for login/logout utilities
- Database helpers: Create `helpers/database.ts` for test data setup

## JIT Index Hints

```bash
# Find all test files
pnpm exec find tests -name "*.spec.ts"

# Run specific test suite
npx playwright test --grep "Views Tracking"

# Run tests matching pattern
npx playwright test --grep "authentication"

# Generate test report
npx playwright show-report

# Update snapshots (if using visual testing)
npx playwright test --update-snapshots
```

## Common Gotchas

- **Base URL**: Configured in `playwright.config.ts` (default: `http://localhost:3000`)
- **Dev server must be running**: Tests expect dev server to be active (start with `pnpm dev`)
- **Browser installation**: Run `npx playwright install` after cloning repo
- **Test isolation**: Each test should be independent (use `test.beforeEach` for setup)
- **Flaky tests**: Avoid hardcoded delays, use `waitForLoadState` and selectors
- **Session persistence**: Use Playwright storage state for auth across tests
- **Environment**: Tests use `.env.local` configuration (same as dev)
- **Database state**: Consider test database or cleanup after tests

## Test Checklist

Before adding a new test:
- [ ] Does it test user-visible behavior (not implementation)?
- [ ] Does it use accessible selectors (data-testid, role, label)?
- [ ] Does it wait for proper load states (no arbitrary timeouts)?
- [ ] Is it independent from other tests?
- [ ] Does it clean up after itself (if it modifies data)?
- [ ] Is the test name descriptive (describes user behavior)?

## Pre-Test Writing

```bash
# Ensure dev server is running
cd ../
pnpm dev

# In another terminal, run tests
npx playwright test

# For new tests, use codegen to generate selectors
npx playwright codegen http://localhost:3000
```

## Debugging Failed Tests

```bash
# Run test in debug mode
npx playwright test --debug

# Run test in headed mode
npx playwright test --headed

# Generate trace on failure (configured in playwright.config.ts)
npx playwright show-trace trace.zip

# Take screenshots on failure (automatic if configured)
# Stored in test-results/ directory
```

## Future Test Improvements

- [ ] Add authentication flow tests
- [ ] Add project submission E2E test
- [ ] Add image upload tests
- [ ] Add visual regression tests (screenshots)
- [ ] Add performance tests (lighthouse)
- [ ] Create test helper utilities (auth, database)
- [ ] Add CI/CD integration (GitHub Actions)
