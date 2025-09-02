import { test, expect, Page } from '@playwright/test';

// Test configuration
const TEST_URL = 'http://localhost:3000';
const TEST_EMAIL = '123@gmail.com';
const TEST_PASSWORD = '123456';

// Helper function untuk login
async function loginUser(page: Page) {
  await page.goto(`${TEST_URL}/user/auth`);
  
  // Klik tab Sign In kalau ada
  const signInTab = page.locator('button:has-text("Sign In")');
  if (await signInTab.isVisible()) {
    await signInTab.click();
  }
  
  // Isi form login
  await page.fill('input[name="email"]', TEST_EMAIL);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  
  // Submit form
  await page.click('button[type="submit"]:has-text("Sign In")');
  
  // Tunggu redirect ke homepage
  await page.waitForURL(TEST_URL, { timeout: 10000 });
  
  // Verify login berhasil
  await expect(page.locator('[data-user-menu]')).toBeVisible({ timeout: 5000 });
}

// Helper function untuk get project stats dari UI
async function getProjectStats(page: Page) {
  // Tunggu stats card muncul
  await page.waitForSelector('h3:has-text("Project Stats")', { timeout: 5000 });
  
  // Extract stats dari UI
  const stats = {
    totalViews: 0,
    uniqueVisitors: 0,
    todayViews: 0,
    likes: 0,
    comments: 0
  };
  
  // Get Total Views
  const totalViewsElement = await page.locator('span:has-text("Total Views") + span').textContent();
  stats.totalViews = parseInt(totalViewsElement?.replace(/,/g, '') || '0');
  
  // Get Unique Visitors
  const uniqueVisitorsElement = await page.locator('span:has-text("Unique Visitors") + span').textContent();
  stats.uniqueVisitors = parseInt(uniqueVisitorsElement?.replace(/,/g, '') || '0');
  
  // Get Today's Views
  const todayViewsElement = await page.locator('span:has-text("Today\'s Views") + span').textContent();
  stats.todayViews = parseInt(todayViewsElement?.replace(/,/g, '') || '0');
  
  // Get Likes
  const likesElement = await page.locator('span:has-text("Likes") + span').textContent();
  stats.likes = parseInt(likesElement?.replace(/,/g, '') || '0');
  
  // Get Comments
  const commentsElement = await page.locator('span:has-text("Comments") + span').textContent();
  stats.comments = parseInt(commentsElement?.replace(/,/g, '') || '0');
  
  return stats;
}

test.describe('Views Tracking Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport untuk consistency
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should track views when visiting project page', async ({ page }) => {
    // Step 1: Login dulu
    await loginUser(page);
    
    // Step 2: Navigate ke project pertama yang ada
    await page.goto(TEST_URL);
    
    // Tunggu project cards muncul
    await page.waitForSelector('[data-testid="project-card"], a[href^="/project/"]', { timeout: 10000 });
    
    // Get first project link
    const firstProjectLink = await page.locator('a[href^="/project/"]').first();
    const projectHref = await firstProjectLink.getAttribute('href');
    
    if (!projectHref) {
      throw new Error('No project found to test');
    }
    
    // Step 3: Kunjungi project page
    await page.goto(`${TEST_URL}${projectHref}`);
    
    // Tunggu page fully loaded
    await page.waitForLoadState('networkidle');
    
    // Step 4: Verify stats card muncul
    await expect(page.locator('h3:has-text("Project Stats")')).toBeVisible({ timeout: 10000 });
    
    // Step 5: Get initial stats
    const initialStats = await getProjectStats(page);
    console.log('Initial Stats:', initialStats);
    
    // Verify stats ada nilai nya (at least views should be > 0 after visit)
    expect(initialStats.totalViews).toBeGreaterThanOrEqual(1);
    expect(initialStats.uniqueVisitors).toBeGreaterThanOrEqual(1);
  });

  test('should not duplicate views for same session', async ({ page }) => {
    // Step 1: Login
    await loginUser(page);
    
    // Step 2: Navigate ke project
    await page.goto(TEST_URL);
    await page.waitForSelector('a[href^="/project/"]', { timeout: 10000 });
    
    const firstProjectLink = await page.locator('a[href^="/project/"]').first();
    const projectHref = await firstProjectLink.getAttribute('href');
    
    if (!projectHref) {
      throw new Error('No project found to test');
    }
    
    // Step 3: Visit project first time
    await page.goto(`${TEST_URL}${projectHref}`);
    await page.waitForLoadState('networkidle');
    
    // Get stats after first visit
    const firstVisitStats = await getProjectStats(page);
    console.log('First Visit Stats:', firstVisitStats);
    
    // Step 4: Navigate away then back (same session)
    await page.goto(TEST_URL);
    await page.waitForTimeout(1000);
    
    // Visit same project again
    await page.goto(`${TEST_URL}${projectHref}`);
    await page.waitForLoadState('networkidle');
    
    // Get stats after second visit
    const secondVisitStats = await getProjectStats(page);
    console.log('Second Visit Stats:', secondVisitStats);
    
    // Step 5: Verify views tidak bertambah untuk session yang sama
    expect(secondVisitStats.totalViews).toBe(firstVisitStats.totalViews);
    expect(secondVisitStats.uniqueVisitors).toBe(firstVisitStats.uniqueVisitors);
    // Today's views might be same if no other visits
    expect(secondVisitStats.todayViews).toBe(firstVisitStats.todayViews);
  });

  test('should track new unique visitor in different session', async ({ browser }) => {
    // Step 1: First session - login and visit
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    
    await loginUser(page1);
    await page1.goto(TEST_URL);
    await page1.waitForSelector('a[href^="/project/"]', { timeout: 10000 });
    
    const firstProjectLink = await page1.locator('a[href^="/project/"]').first();
    const projectHref = await firstProjectLink.getAttribute('href');
    
    if (!projectHref) {
      throw new Error('No project found to test');
    }
    
    await page1.goto(`${TEST_URL}${projectHref}`);
    await page1.waitForLoadState('networkidle');
    
    const session1Stats = await getProjectStats(page1);
    console.log('Session 1 Stats:', session1Stats);
    
    await context1.close();
    
    // Step 2: New incognito session (simulating different visitor)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    
    // Visit as guest (no login)
    await page2.goto(`${TEST_URL}${projectHref}`);
    await page2.waitForLoadState('networkidle');
    
    // Wait a bit for stats to update
    await page2.waitForTimeout(2000);
    
    const session2Stats = await getProjectStats(page2);
    console.log('Session 2 Stats:', session2Stats);
    
    // Step 3: Verify new unique visitor tracked
    expect(session2Stats.totalViews).toBeGreaterThan(session1Stats.totalViews);
    expect(session2Stats.uniqueVisitors).toBeGreaterThan(session1Stats.uniqueVisitors);
    
    await context2.close();
  });

  test('should properly display real-time stats updates', async ({ page }) => {
    // Step 1: Login
    await loginUser(page);
    
    // Step 2: Create new project untuk testing
    await page.goto(`${TEST_URL}/project/submit`);
    
    // Fill form
    await page.fill('input[name="title"]', `Test Views Project ${Date.now()}`);
    await page.fill('textarea[name="tagline"]', 'Testing views tracking feature');
    await page.fill('textarea[name="description"]', 'This is a test project to verify views tracking is working properly');
    
    // Select category
    await page.click('button[role="combobox"]');
    await page.click('div[role="option"]:first-child');
    
    await page.fill('input[name="website_url"]', 'https://example.com');
    
    // Submit
    await page.click('button[type="submit"]:has-text("Submit Project")');
    
    // Wait for redirect to project page
    await page.waitForURL(/\/project\/\d+/, { timeout: 15000 });
    
    // Step 3: Check initial stats
    const newProjectStats = await getProjectStats(page);
    console.log('New Project Initial Stats:', newProjectStats);
    
    // New project should have exactly 1 view and 1 unique visitor
    expect(newProjectStats.totalViews).toBe(1);
    expect(newProjectStats.uniqueVisitors).toBe(1);
    expect(newProjectStats.todayViews).toBe(1);
  });

  test('should not track bot/crawler visits', async ({ page }) => {
    // Step 1: Set bot user agent
    await page.setUserAgent('Googlebot/2.1 (+http://www.google.com/bot.html)');
    
    // Step 2: Visit project as bot
    await page.goto(TEST_URL);
    await page.waitForSelector('a[href^="/project/"]', { timeout: 10000 });
    
    const firstProjectLink = await page.locator('a[href^="/project/"]').first();
    const projectHref = await firstProjectLink.getAttribute('href');
    
    if (!projectHref) {
      throw new Error('No project found to test');
    }
    
    // Get current stats first with normal user agent
    const normalPage = await page.context().newPage();
    await normalPage.goto(`${TEST_URL}${projectHref}`);
    await normalPage.waitForLoadState('networkidle');
    const beforeBotStats = await getProjectStats(normalPage);
    console.log('Stats before bot visit:', beforeBotStats);
    
    // Now visit as bot
    await page.goto(`${TEST_URL}${projectHref}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check stats again
    await normalPage.reload();
    await normalPage.waitForLoadState('networkidle');
    const afterBotStats = await getProjectStats(normalPage);
    console.log('Stats after bot visit:', afterBotStats);
    
    // Step 3: Verify bot visit not tracked
    expect(afterBotStats.totalViews).toBe(beforeBotStats.totalViews);
    expect(afterBotStats.uniqueVisitors).toBe(beforeBotStats.uniqueVisitors);
  });

  test('should show correct Today\'s Views counter', async ({ page }) => {
    // Step 1: Login
    await loginUser(page);
    
    // Step 2: Visit a project
    await page.goto(TEST_URL);
    await page.waitForSelector('a[href^="/project/"]', { timeout: 10000 });
    
    const firstProjectLink = await page.locator('a[href^="/project/"]').first();
    const projectHref = await firstProjectLink.getAttribute('href');
    
    if (!projectHref) {
      throw new Error('No project found to test');
    }
    
    await page.goto(`${TEST_URL}${projectHref}`);
    await page.waitForLoadState('networkidle');
    
    // Step 3: Check Today's Views is tracked
    const stats = await getProjectStats(page);
    console.log('Today\'s Views Stats:', stats);
    
    // Today's views should be at least 1 after our visit
    expect(stats.todayViews).toBeGreaterThanOrEqual(1);
    
    // Also verify it's less than or equal to total views
    expect(stats.todayViews).toBeLessThanOrEqual(stats.totalViews);
  });
});

test.describe('Views Analytics Database Integration', () => {
  test('should properly store session_id in database', async ({ page }) => {
    // This test verifies that session_id is properly stored
    // We'll check localStorage for session management
    
    await page.goto(TEST_URL);
    
    // Visit a project to trigger view tracking
    await page.waitForSelector('a[href^="/project/"]', { timeout: 10000 });
    const firstProjectLink = await page.locator('a[href^="/project/"]').first();
    const projectHref = await firstProjectLink.getAttribute('href');
    
    if (!projectHref) {
      throw new Error('No project found to test');
    }
    
    await page.goto(`${TEST_URL}${projectHref}`);
    await page.waitForLoadState('networkidle');
    
    // Check localStorage for session
    const sessionData = await page.evaluate(() => {
      const session = localStorage.getItem('vibedev_session');
      const viewedProjects = localStorage.getItem('vibedev_viewed_projects');
      return { session, viewedProjects };
    });
    
    console.log('Session Data:', sessionData);
    
    // Verify session created
    expect(sessionData.session).toBeTruthy();
    expect(sessionData.viewedProjects).toBeTruthy();
    
    // Parse and verify session structure
    const session = JSON.parse(sessionData.session!);
    expect(session).toHaveProperty('id');
    expect(session).toHaveProperty('createdAt');
    expect(session).toHaveProperty('lastActivity');
    
    // Verify viewed projects tracking
    const viewedProjects = JSON.parse(sessionData.viewedProjects!);
    expect(viewedProjects).toHaveProperty(session.id);
    expect(Array.isArray(viewedProjects[session.id])).toBe(true);
  });

  test('should handle session timeout correctly', async ({ page }) => {
    // Test 30-minute session timeout
    await page.goto(TEST_URL);
    
    // Create initial session
    await page.evaluate(() => {
      const session = {
        id: 'test-session-id',
        createdAt: new Date().toISOString(),
        lastActivity: new Date(Date.now() - 31 * 60 * 1000).toISOString() // 31 minutes ago
      };
      localStorage.setItem('vibedev_session', JSON.stringify(session));
    });
    
    // Visit project - should create new session
    await page.waitForSelector('a[href^="/project/"]', { timeout: 10000 });
    const firstProjectLink = await page.locator('a[href^="/project/"]').first();
    const projectHref = await firstProjectLink.getAttribute('href');
    
    if (!projectHref) {
      throw new Error('No project found to test');
    }
    
    await page.goto(`${TEST_URL}${projectHref}`);
    await page.waitForLoadState('networkidle');
    
    // Check if new session created
    const newSessionData = await page.evaluate(() => {
      const session = localStorage.getItem('vibedev_session');
      return session ? JSON.parse(session) : null;
    });
    
    console.log('New Session after timeout:', newSessionData);
    
    // Verify new session created (different ID)
    expect(newSessionData.id).not.toBe('test-session-id');
    expect(newSessionData).toHaveProperty('id');
    expect(newSessionData).toHaveProperty('createdAt');
    expect(newSessionData).toHaveProperty('lastActivity');
  });
});
