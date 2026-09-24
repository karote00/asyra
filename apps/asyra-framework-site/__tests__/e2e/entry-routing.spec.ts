import { expect, test } from '@playwright/test'

for (const width of [1440, 390]) {
  test(`entry cards route to maintained guidance at ${width}px`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const section = page.locator('#start-building')
    const cards = section.locator('article')
    await expect(cards).toHaveCount(3)
    await expect(cards.nth(0)).toContainText('Generic Starter')
    await expect(cards.nth(0)).toContainText('not yet published')
    await expect(cards.nth(1)).toContainText('Complete Design product')
    await expect(cards.nth(2)).toContainText('Advanced composition')
    await expect(
      section.getByRole('link', { name: 'Explore Starter source' })
    ).toHaveAttribute('href', '/docs#generic-starter-source')
    await expect(
      section.getByRole('link', { name: 'Create a design app' })
    ).toHaveAttribute('href', '/docs/start/create-design-app')
    await expect(
      section.getByRole('link', { name: 'Composition guide' })
    ).toHaveAttribute('href', '/docs/start/custom-composition')
    await section.screenshot({
      path: testInfo.outputPath(`entry-${width}.png`)
    })
    await section.getByRole('link', { name: 'Explore Starter source' }).click()
    await expect(page).toHaveURL(/\/docs#generic-starter-source$/)
    await expect(
      page.getByRole('heading', { name: 'Generic Starter source' })
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  })
}

test('entry routes and status remain present with reduced motion and no JavaScript', async ({
  browser
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: 'reduce',
    viewport: { width: 390, height: 900 }
  })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.locator('#start-building')).toContainText('Generic Starter')
  await expect(page.locator('#start-building')).toContainText(
    'not yet published'
  )
  await page
    .locator('#start-building')
    .getByRole('link', { name: 'Explore Starter source' })
    .click()
  await expect(page).toHaveURL(/\/docs#generic-starter-source$/)
  await expect(
    page.getByRole('heading', { name: 'Generic Starter source' })
  ).toBeVisible()
  await context.close()
})
