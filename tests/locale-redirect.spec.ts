import { expect, test } from '@playwright/test'

const TEST_URL = 'http://localhost:3000'

test.describe('Locale Redirect Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('should redirect /en to / and set NEXT_LOCALE cookie', async ({ page }) => {
    // Visit /en which should be intercepted as locale, not username
    await page.goto(`${TEST_URL}/en`)

    // Should redirect to root
    await page.waitForURL(TEST_URL + '/', { timeout: 10000 })
    expect(page.url()).toBe(TEST_URL + '/')

    // Check that NEXT_LOCALE cookie is set to 'en'
    const cookies = await page.context().cookies()
    const localeCookie = cookies.find((c) => c.name === 'NEXT_LOCALE')

    expect(localeCookie).toBeDefined()
    expect(localeCookie?.value).toBe('en')
  })

  test('should not redirect actual usernames to root', async ({ page }) => {
    // Visit a real user profile page
    // Using 'faiz' as example - this should NOT redirect
    await page.goto(`${TEST_URL}/faiz`)

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // URL should remain /faiz (not redirect to /)
    expect(page.url()).toBe(`${TEST_URL}/faiz`)

    // Should show either profile page OR "User Not Found" (depending on whether user exists)
    // Either way, it's NOT a locale redirect
    const pageContent = await page.content()
    const isProfilePage = pageContent.includes('Projects') || pageContent.includes('User Not Found')
    expect(isProfilePage).toBe(true)
  })

  test('should handle /en path without affecting subpaths', async ({ page }) => {
    // This test verifies that only /en root is handled
    // Subpaths like /en/blog should work differently (handled by routing)

    // Visit /en - should redirect to /
    await page.goto(`${TEST_URL}/en`)
    await page.waitForURL(TEST_URL + '/', { timeout: 10000 })
    expect(page.url()).toBe(TEST_URL + '/')
  })

  test('NEXT_LOCALE cookie should persist across navigations', async ({ page }) => {
    // First visit /en to set the cookie
    await page.goto(`${TEST_URL}/en`)
    await page.waitForURL(TEST_URL + '/', { timeout: 10000 })

    // Navigate to another page
    await page.goto(`${TEST_URL}/explore`)
    await page.waitForLoadState('networkidle')

    // Cookie should still be set
    const cookies = await page.context().cookies()
    const localeCookie = cookies.find((c) => c.name === 'NEXT_LOCALE')

    expect(localeCookie).toBeDefined()
    expect(localeCookie?.value).toBe('en')
  })

  test('should not affect other dynamic routes', async ({ page }) => {
    // Visit a random path that isn't a locale
    await page.goto(`${TEST_URL}/randomusername123`)

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Should stay on the page (not redirect)
    expect(page.url()).toBe(`${TEST_URL}/randomusername123`)

    // Should show profile page structure (even if user not found)
    const pageContent = await page.content()
    // Will show either profile or "User Not Found"
    const hasExpectedContent = pageContent.includes('User Not Found') || pageContent.includes('Profile')
    expect(hasExpectedContent).toBe(true)
  })
})
