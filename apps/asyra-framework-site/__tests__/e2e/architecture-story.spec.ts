import { expect, test } from '@playwright/test'

test('the homepage keeps the infrastructure explanation available without animation', async ({
  browser
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 }
  })
  try {
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.locator('[data-story-chapter]')).toHaveCount(6)
    await expect(page.locator('main')).toContainText('Defined relations.')
    await expect(page.locator('main')).toContainText('Change the rule.')
    await expect(
      page.getByRole('link', { name: 'Runtime Atlas', exact: true }).last()
    ).toBeAttached()
  } finally {
    await context.close()
  }
})
