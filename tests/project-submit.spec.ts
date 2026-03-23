import { expect, type Page, test } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_EMAIL || '123@gmail.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD || '123456'

async function signIn(page: Page): Promise<void> {
  await page.goto('/user/auth')

  await expect(page.getByPlaceholder('Enter your email')).toBeVisible({ timeout: 15000 })
  await page.getByPlaceholder('Enter your email').fill(TEST_EMAIL)
  await page.getByPlaceholder('Enter your password').fill(TEST_PASSWORD)
  await page.locator('form button[type="submit"]').click()

  await expect(page).toHaveURL('/', { timeout: 15000 })
}

async function openProjectSubmitPage(page: Page): Promise<void> {
  await signIn(page)
  await page.goto('/project/submit')
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('Project Details', { exact: true })).toBeVisible({ timeout: 15000 })
}

test.describe('Project submit GitHub import', () => {
  test.setTimeout(60000)

  test('keeps manual title and tagline while filling empty fields from GitHub import', async ({ page }) => {
    await openProjectSubmitPage(page)

    await page.route('**/api/github-import', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'Imported Title',
          tagline: 'Imported tagline from GitHub',
          description: 'Imported description from the README fallback.',
          website_url: 'https://imported.example.com',
          favicon_url: 'https://imported.example.com/favicon.ico',
          preview_image_url: 'https://opengraph.githubassets.com/1/example/awesome-project',
          tags: ['typescript', 'next.js'],
          repo: {
            name: 'awesome-project',
            full_name: 'example/awesome-project',
            html_url: 'https://github.com/example/awesome-project',
            owner: 'example',
          },
        }),
      })
    })

    // Go to Basics step
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByLabel('Project Title *').fill('Manual title')
    await page.getByLabel('Tagline').fill('Manual tagline that should survive import')
    
    // Go back to Source step
    await page.getByRole('button', { name: 'Back' }).click()

    await page.getByLabel('Import from GitHub').fill('example/awesome-project')
    await page.getByRole('button', { name: 'Import' }).click()
    await expect(page.getByText('Imported GitHub repo metadata')).toBeVisible()

    // Next to Basics step to verify
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByLabel('Project Title *')).toHaveValue('Manual title')
    await expect(page.getByLabel('Tagline')).toHaveValue('Manual tagline that should survive import')
    await expect(page.getByLabel('Description *')).toHaveValue('Imported description from the README fallback.')
    
    // Fill category to allow next step
    await page.getByRole('combobox').click()
    await page.getByRole('option').first().click()

    // Next to Links & Media step
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByLabel('Website URL')).toHaveValue('https://imported.example.com')
    await expect(page.getByLabel('Favicon URL')).toHaveValue('https://imported.example.com/favicon.ico')
    await expect(page.getByAltText('Project screenshot preview')).toBeVisible()
    await expect(page.getByText('TypeScript', { exact: true })).toBeVisible()
    await expect(page.getByText('Next.js', { exact: true })).toBeVisible()
  })

  test('keeps current draft values when GitHub import returns an error', async ({ page }) => {
    await openProjectSubmitPage(page)

    await page.route('**/api/github-import', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Repository not found' }),
      })
    })

    // Go to Basics step
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByLabel('Project Title *').fill('Draft title')
    await page.getByLabel('Tagline').fill('Draft tagline that should stay put')
    await page.getByLabel('Description *').fill('Draft description that should stay put')
    
    // Fill category to allow next step
    await page.getByRole('combobox').click()
    await page.getByRole('option').first().click()

    // Go to Links & Media step
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByLabel('Website URL').fill('https://draft.example.com')
    await page.getByLabel('Favicon URL').fill('https://draft.example.com/favicon.ico')

    // Go back to Source step (2 clicks)
    await page.getByRole('button', { name: 'Back' }).click()
    await page.getByRole('button', { name: 'Back' }).click()

    await page.getByLabel('Import from GitHub').fill('example/missing-repo')
    await page.getByRole('button', { name: 'Import' }).click()

    await expect(page.getByText('Repository not found')).toBeVisible()
    
    // Verify Basics step
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByLabel('Project Title *')).toHaveValue('Draft title')
    await expect(page.getByLabel('Tagline')).toHaveValue('Draft tagline that should stay put')
    await expect(page.getByLabel('Description *')).toHaveValue('Draft description that should stay put')
    
    // Verify Links & Media step
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByLabel('Website URL')).toHaveValue('https://draft.example.com')
    await expect(page.getByLabel('Favicon URL')).toHaveValue('https://draft.example.com/favicon.ico')
  })

  test('Multi-step happy path preserves values through navigation', async ({ page }) => {
    await openProjectSubmitPage(page)
    
    // Step 0: Source - Next
    await page.getByRole('button', { name: 'Next' }).click()
    
    // Step 1: Basics
    await page.getByLabel('Project Title *').fill('My Cool Project')
    await page.getByLabel('Description *').fill('This is a great project description')
    await page.getByRole('combobox').click()
    await page.getByRole('option').first().click()
    
    // Forward to Step 2
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByLabel('Website URL').fill('https://cool-project.com')
    
    // Go back to Step 1
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByLabel('Project Title *')).toHaveValue('My Cool Project')
    
    // Forward to Step 2
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByLabel('Website URL')).toHaveValue('https://cool-project.com')
  })

  test('Step progression is blocked by validation', async ({ page }) => {
    await openProjectSubmitPage(page)
    
    // Step 0: Source -> Next
    await page.getByRole('button', { name: 'Next' }).click()
    
    // Step 1: Basics - Try to proceed without required fields
    await page.getByRole('button', { name: 'Next' }).click()
    
    // Expect error toast
    await expect(page.getByText('Please fill in all required fields')).toBeVisible()
    
    // We should still be on Basics step (Project Title should still be visible)
    await expect(page.getByLabel('Project Title *')).toBeVisible()
  })
})
