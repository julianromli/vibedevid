import { expect, test } from '@playwright/test'

const TEST_URL = 'http://localhost:3000'
const TEST_EMAIL = '123@gmail.com'
const TEST_PASSWORD = '123456'

async function signInFromAuthPage(page: import('@playwright/test').Page) {
  await page.goto(`${TEST_URL}/user/auth`)

  await page.getByPlaceholder('Enter your email').fill(TEST_EMAIL)
  await page.getByPlaceholder('Enter your password').fill(TEST_PASSWORD)
  await page.locator('form button[type="submit"]').click()
}

test.describe('Auth Redirect Flow', () => {
  test('redirects to home after successful sign in', async ({ page }) => {
    await signInFromAuthPage(page)

    await expect(page).toHaveURL(`${TEST_URL}/`, { timeout: 15000 })
  })

  test('redirects authenticated user away from /user/auth', async ({ page }) => {
    await signInFromAuthPage(page)
    await expect(page).toHaveURL(`${TEST_URL}/`, { timeout: 15000 })

    await page.goto(`${TEST_URL}/user/auth`)
    await expect(page).toHaveURL(`${TEST_URL}/`, { timeout: 15000 })
  })
})
