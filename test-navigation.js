// Test navigation delay to project detail page
const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  console.log('🚀 Starting navigation delay test...')

  try {
    // Go to homepage
    console.log('📍 Navigating to homepage...')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })

    // Wait for project cards to load
    console.log('⏳ Waiting for project cards...')
    await page.waitForSelector('.group.cursor-pointer', { timeout: 10000 })

    // Find first project card
    const projectCards = await page.locator('.group.cursor-pointer').first()
    await projectCards.waitFor()

    console.log('🎯 Found project card, preparing to click...')

    // Record timing
    const startTime = Date.now()

    // Try to hover first to trigger any lazy loading
    await projectCards.hover()

    // Look for "Lihat Detail" button
    const detailButton = page.locator('button:has-text("Lihat Detail")').first()

    console.log('🔘 Clicking "Lihat Detail" button...')
    await detailButton.click()

    // Wait for navigation
    console.log('⏳ Waiting for navigation...')
    await page.waitForURL('**/project/**', { timeout: 15000 })

    const endTime = Date.now()
    const navigationTime = endTime - startTime

    console.log(`✅ Navigation completed in ${navigationTime}ms`)

    // Wait for page content to load
    console.log('⏳ Waiting for project content to load...')
    await page.waitForSelector('.grid.lg\\:grid-cols-3', { timeout: 10000 })

    // Check for loading states
    const skeletonLoading = await page.locator('.animate-pulse').count()
    console.log(`📊 Found ${skeletonLoading} loading skeleton elements`)

    // Check console for errors
    const consoleMessages = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text())
      }
    })

    // Performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0]
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart,
      }
    })

    console.log('📈 Performance Metrics:')
    console.log(`   DOM Content Loaded: ${metrics.domContentLoaded}ms`)
    console.log(`   Load Complete: ${metrics.loadComplete}ms`)
    console.log(`   Total Time: ${metrics.totalTime}ms`)

    // Check for avatar loading
    const avatars = await page.locator('img[alt*="author"], img[alt*="avatar"]').count()
    console.log(`👤 Found ${avatars} avatar images`)

    if (consoleMessages.length > 0) {
      console.log('❌ Console Errors:')
      consoleMessages.forEach((msg) => console.log(`   ${msg}`))
    }

    console.log('✅ Test completed successfully!')

    // Keep browser open for 5 seconds to observe
    await page.waitForTimeout(5000)
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  } finally {
    await browser.close()
  }
})()
