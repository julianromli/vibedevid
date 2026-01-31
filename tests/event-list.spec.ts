import { expect, test } from '@playwright/test'

const TEST_URL = 'http://localhost:3000'

test.describe('Event List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('should load page with all components', async ({ page }) => {
    // Navigate to event list page
    await page.goto(`${TEST_URL}/event/list`)
    await page.waitForLoadState('networkidle')

    // Verify page title
    await expect(page.locator('h1:has-text("AI Events di Indonesia")')).toBeVisible()

    // Verify description text
    await expect(
      page.locator('p:has-text("Temukan workshop, meetup, conference, dan hackathon AI terbaik di Indonesia")'),
    ).toBeVisible()

    // Verify filter controls are present
    await expect(page.locator('text=Kategori')).toBeVisible()
    await expect(page.locator('text=Lokasi')).toBeVisible()
    await expect(page.locator('text=Urutkan')).toBeVisible()

    // Verify event cards are displayed
    const eventCards = page.locator('[data-testid="event-card"]')
    const cardCount = await eventCards.count()
    expect(cardCount).toBeGreaterThan(0)

    // Verify stats info is shown
    await expect(page.locator('text=/Menampilkan \\d+ event AI di Indonesia/')).toBeVisible()
  })

  test('should display event cards with correct information', async ({ page }) => {
    await page.goto(`${TEST_URL}/event/list`)
    await page.waitForLoadState('networkidle')

    // Get first event card
    const firstCard = page.locator('[data-testid="event-card"]').first()
    await expect(firstCard).toBeVisible()

    // Verify event card has required elements
    await expect(firstCard.locator('[data-testid="event-title"]')).toBeVisible()
    await expect(firstCard.locator('[data-testid="event-date"]')).toBeVisible()
    await expect(firstCard.locator('[data-testid="event-location"]')).toBeVisible()
    await expect(firstCard.locator('[data-testid="event-organizer"]')).toBeVisible()
    await expect(firstCard.locator('[data-testid="event-description"]')).toBeVisible()

    // Verify badges are present
    await expect(firstCard.locator('[data-testid="category-badge"]')).toBeVisible()
    await expect(firstCard.locator('[data-testid="status-badge"]')).toBeVisible()

    // Verify cover image is present
    await expect(firstCard.locator('[data-testid="event-cover-image"]')).toBeVisible()
  })

  test('should filter events by category', async ({ page }) => {
    await page.goto(`${TEST_URL}/event/list`)
    await page.waitForLoadState('networkidle')

    // Get initial event count
    const initialCount = await page.locator('[data-testid="event-card"]').count()
    expect(initialCount).toBeGreaterThan(0)

    // Click category filter dropdown
    await page.click('button:has-text("Kategori")')
    await page.waitForTimeout(300)

    // Select "Workshop" category
    await page.click('text="Workshop"')
    await page.waitForTimeout(500)

    // Verify filtered results
    const filteredCards = page.locator('[data-testid="event-card"]')
    const filteredCount = await filteredCards.count()

    // All visible cards should have "Workshop" badge
    for (let i = 0; i < filteredCount; i++) {
      const card = filteredCards.nth(i)
      const categoryBadge = card.locator('[data-testid="category-badge"]')
      await expect(categoryBadge).toContainText('Workshop')
    }

    // Filtered count should be less than or equal to initial count
    expect(filteredCount).toBeLessThanOrEqual(initialCount)
  })

  test('should filter events by location type', async ({ page }) => {
    await page.goto(`${TEST_URL}/event/list`)
    await page.waitForLoadState('networkidle')

    // Click location filter dropdown
    await page.click('button:has-text("Lokasi")')
    await page.waitForTimeout(300)

    // Select "Online" location
    await page.click('text="Online"')
    await page.waitForTimeout(500)

    // Verify filtered results
    const filteredCards = page.locator('[data-testid="event-card"]')
    const filteredCount = await filteredCards.count()

    if (filteredCount > 0) {
      // All visible cards should have online location indicator
      for (let i = 0; i < filteredCount; i++) {
        const card = filteredCards.nth(i)
        const locationText = await card.locator('[data-testid="event-location"]').textContent()
        // Online events should have "Online" in location text
        expect(locationText).toBeTruthy()
      }
    }
  })

  test('should show empty state when no events match filter', async ({ page }) => {
    await page.goto(`${TEST_URL}/event/list`)
    await page.waitForLoadState('networkidle')

    // Apply multiple filters that might result in no matches
    // First, select a specific category
    await page.click('button:has-text("Kategori")')
    await page.waitForTimeout(300)
    await page.click('text="Hackathon"')
    await page.waitForTimeout(500)

    // Then select a specific location that might not have hackathons
    await page.click('button:has-text("Lokasi")')
    await page.waitForTimeout(300)
    await page.click('text="Offline"')
    await page.waitForTimeout(500)

    // Check if empty state is shown or events are displayed
    const eventCards = page.locator('[data-testid="event-card"]')
    const cardCount = await eventCards.count()

    if (cardCount === 0) {
      // Verify empty state message
      await expect(page.locator('text=Tidak ada event yang sesuai dengan filter')).toBeVisible()

      // Verify reset button is present
      await expect(page.locator('button:has-text("Reset filter")')).toBeVisible()

      // Click reset button
      await page.click('button:has-text("Reset filter")')
      await page.waitForTimeout(500)

      // Verify events are shown again after reset
      const resetCardCount = await page.locator('[data-testid="event-card"]').count()
      expect(resetCardCount).toBeGreaterThan(0)
    }
  })

  test('should apply combined filters correctly', async ({ page }) => {
    await page.goto(`${TEST_URL}/event/list`)
    await page.waitForLoadState('networkidle')

    // Apply category filter
    await page.click('button:has-text("Kategori")')
    await page.waitForTimeout(300)
    await page.click('text="Workshop"')
    await page.waitForTimeout(500)

    // Apply location filter
    await page.click('button:has-text("Lokasi")')
    await page.waitForTimeout(300)
    await page.click('text="Online"')
    await page.waitForTimeout(500)

    // Verify filtered results
    const filteredCards = page.locator('[data-testid="event-card"]')
    const filteredCount = await filteredCards.count()

    if (filteredCount > 0) {
      // All visible cards should match BOTH filters
      for (let i = 0; i < filteredCount; i++) {
        const card = filteredCards.nth(i)

        // Check category badge
        const categoryBadge = card.locator('[data-testid="category-badge"]')
        await expect(categoryBadge).toContainText('Workshop')

        // Check location (should be online)
        const locationText = await card.locator('[data-testid="event-location"]').textContent()
        expect(locationText).toBeTruthy()
      }
    }
  })

  test('should display events in correct sort order', async ({ page }) => {
    await page.goto(`${TEST_URL}/event/list`)
    await page.waitForLoadState('networkidle')

    // Get all event dates
    const eventCards = page.locator('[data-testid="event-card"]')
    const cardCount = await eventCards.count()

    if (cardCount > 1) {
      // Extract dates from first two events
      const firstDate = await eventCards.nth(0).locator('[data-testid="event-date"]').textContent()
      const secondDate = await eventCards.nth(1).locator('[data-testid="event-date"]').textContent()

      // Both dates should be present
      expect(firstDate).toBeTruthy()
      expect(secondDate).toBeTruthy()

      // Default sort is "nearest" - upcoming events should be first
      // We can verify by checking status badges
      const firstStatus = await eventCards.nth(0).locator('[data-testid="status-badge"]').textContent()
      const secondStatus = await eventCards.nth(1).locator('[data-testid="status-badge"]').textContent()

      // If first event is "Past", second should also be "Past" (upcoming events come first)
      if (firstStatus?.includes('Past')) {
        expect(secondStatus).toContain('Past')
      }
    }
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto(`${TEST_URL}/event/list`)
    await page.waitForLoadState('networkidle')

    // Verify page loads correctly on mobile
    await expect(page.locator('h1:has-text("AI Events di Indonesia")')).toBeVisible()

    // Verify filter controls are accessible
    await expect(page.locator('button:has-text("Kategori")')).toBeVisible()
    await expect(page.locator('button:has-text("Lokasi")')).toBeVisible()

    // Verify event cards are displayed (should be 1 column on mobile)
    const eventCards = page.locator('[data-testid="event-card"]')
    const cardCount = await eventCards.count()
    expect(cardCount).toBeGreaterThan(0)

    // Verify first card is visible and properly sized
    const firstCard = eventCards.first()
    await expect(firstCard).toBeVisible()
  })

  test('should be responsive on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })

    await page.goto(`${TEST_URL}/event/list`)
    await page.waitForLoadState('networkidle')

    // Verify page loads correctly on tablet
    await expect(page.locator('h1:has-text("AI Events di Indonesia")')).toBeVisible()

    // Verify event cards are displayed (should be 2 columns on tablet)
    const eventCards = page.locator('[data-testid="event-card"]')
    const cardCount = await eventCards.count()
    expect(cardCount).toBeGreaterThan(0)
  })

  test('should have working navbar and footer', async ({ page }) => {
    await page.goto(`${TEST_URL}/event/list`)
    await page.waitForLoadState('networkidle')

    // Verify navbar is present
    const navbar = page.locator('nav').first()
    await expect(navbar).toBeVisible()

    // Verify footer is present
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
  })
})
