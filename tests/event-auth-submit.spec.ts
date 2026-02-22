import { expect, test } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_EMAIL || '123@gmail.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD || '123456'

async function signInFromAuthPage(page: import('@playwright/test').Page) {
  await page.goto(`/user/auth`)
  const emailInput = page.getByPlaceholder('Enter your email')
  const passwordInput = page.getByPlaceholder('Enter your password')

  await expect(emailInput).toBeVisible({ timeout: 15000 })
  await emailInput.fill(TEST_EMAIL)
  await expect(emailInput).toHaveValue(TEST_EMAIL)

  await expect(passwordInput).toBeVisible({ timeout: 15000 })
  await passwordInput.fill(TEST_PASSWORD)
  await expect(passwordInput).toHaveValue(TEST_PASSWORD)

  await page.getByTestId('auth-submit').click()
  await expect(page).toHaveURL(/\//, { timeout: 15000 })
}

test.describe('Event submit auth continuity', () => {
  test.setTimeout(60000)

  test('keeps user logged in on /event/list and allows event submission', async ({ page }) => {
    let createdEventId: string | undefined
    await signInFromAuthPage(page)

    await page.goto(`/event/list`)

    const submitButton = page.getByRole('button', { name: 'Submit Event' })
    await expect(submitButton).toBeVisible({ timeout: 15000 })
    await submitButton.click()

    const suffix = Date.now().toString().slice(-6)
    const eventTitle = `Auth Regression Event ${suffix}`
    await page.getByLabel('Nama Event *').fill(eventTitle)
    await page.getByLabel('Tanggal *').fill('2026-12-30')
    await page.getByLabel('Waktu *').fill('10:00')

    await page.getByLabel('Tipe Event *').click()
    await page.getByRole('option', { name: 'Online' }).click()

    await page.getByLabel('Detail Lokasi *').fill('Zoom Meeting')

    await page.getByLabel('Kategori *').click()
    await page.getByRole('option', { name: 'Workshop' }).click()

    await page.getByLabel('Penyelenggara *').fill('VibeDev QA')
    await page
      .getByLabel('Deskripsi *')
      .fill('Automated regression submission to validate auth continuity on /event/list.')
    await page.getByLabel('URL Registrasi *').fill('https://example.com/register')

    await page.getByRole('tab', { name: 'Image URL' }).click()
    await page.getByPlaceholder('https://example.com/image.jpg').fill('https://picsum.photos/1200/675')
    await page.getByRole('button', { name: 'Use This URL' }).click()

    // Assuming we can intercept the response to get the created event ID for cleanup
    const [response] = await Promise.all([
      page.waitForResponse((response) => response.url().includes('/api/events') && response.status() === 201),
      page.getByRole('button', { name: 'Submit Event' }).last().click(),
    ]).catch(() => [null])

    if (response) {
      try {
        const data = await response.json()
        createdEventId = data?.id || data?.data?.id
      } catch (e) {
        console.warn('Could not parse response to get event ID for cleanup', e)
      }
    }

    await expect(page.getByText('Event berhasil disubmit!')).toBeVisible({ timeout: 15000 })

    // Cleanup if we have the ID, otherwise fallback to finding it in the list
    if (createdEventId) {
      // Implementation of cleanup would depend on available admin endpoints or direct DB access via setup
      // For now, we will just simulate a cleanup or rely on a cleanup API if available.
      // e.g. await page.request.delete(`/api/events/${createdEventId}`)
    }
  })
})
