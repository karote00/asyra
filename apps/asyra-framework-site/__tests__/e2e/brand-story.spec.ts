import { expect, test } from '@playwright/test'

test('chapter navigation lands on the accepted six-part homepage narrative', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Story chapters' })
  for (const link of await nav.getByRole('link').all()) {
    const href = await link.getAttribute('href')
    await link.click()
    await expect(page.locator(`${href} h1, ${href} h2`)).toBeVisible()
  }
})

test('the story exits into real product evidence and executable documentation', async ({
  page
}) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Composition guide' }).click()
  await expect(page).toHaveURL(/\/docs\/start\/custom-composition$/)
  await expect(page.locator('main')).toContainText('composition')
  await page.getByRole('link', { name: 'Asyra home' }).click()
  await expect(page.locator('[data-story-chapter]')).toHaveCount(6)
})
