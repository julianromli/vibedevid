import { expect, test } from '@playwright/test'

const TEST_URL = 'http://localhost:3000'
const TEST_EMAIL = '123@gmail.com'
const TEST_PASSWORD = '123456'

async function signInFromAuthPage(page: import('@playwright/test').Page) {
  await page.goto(`${TEST_URL}/user/auth`)
  const emailInput = page.getByPlaceholder('Enter your email')
  const passwordInput = page.getByPlaceholder('Enter your password')

  await expect(emailInput).toBeVisible({ timeout: 15000 })
  await emailInput.fill(TEST_EMAIL)
  await expect(emailInput).toHaveValue(TEST_EMAIL)

  await expect(passwordInput).toBeVisible({ timeout: 15000 })
  await passwordInput.fill(TEST_PASSWORD)
  await expect(passwordInput).toHaveValue(TEST_PASSWORD)

  await page.locator('form button[type="submit"]').click()
  await expect(page).toHaveURL(`${TEST_URL}/`, { timeout: 15000 })
}

test.describe('Event submit auth continuity', () => {
  test.setTimeout(60000)

  test('keeps user logged in on /event/list and allows event submission', async ({ page }) => {
    await signInFromAuthPage(page)

    await page.goto(`${TEST_URL}/event/list`)

    const submitButton = page.getByRole('button', { name: 'Submit Event' })
    await expect(submitButton).toBeVisible({ timeout: 15000 })
    await submitButton.click()

    const suffix = Date.now().toString().slice(-6)
    await page.getByLabel('Nama Event *').fill(`Auth Regression Event ${suffix}`)
    await page.getByLabel('Tanggal *').fill('2026-12-30')
    await page.getByLabel('Waktu *').fill('10:00')

    await page.getByRole('combobox').nth(0).click()
    await page.getByRole('option', { name: 'Online' }).click()

    await page.getByLabel('Detail Lokasi *').fill('Zoom Meeting')

    await page.getByRole('combobox').nth(1).click()
    await page.getByRole('option', { name: 'Workshop' }).click()

    await page.getByLabel('Penyelenggara *').fill('VibeDev QA')
    await page
      .getByLabel('Deskripsi *')
      .fill('Automated regression submission to validate auth continuity on /event/list.')
    await page.getByLabel('URL Registrasi *').fill('https://example.com/register')

    await page.getByRole('tab', { name: 'Image URL' }).click()
    await page.getByPlaceholder('https://example.com/image.jpg').fill('https://picsum.photos/1200/675')
    await page.getByRole('button', { name: 'Use This URL' }).click()

    await page.getByRole('button', { name: 'Submit Event' }).last().click()
    await expect(page.getByText('Event berhasil disubmit!')).toBeVisible({ timeout: 15000 })
  })
})
