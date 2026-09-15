import { expect, test } from '@playwright/test'

for (const width of [320, 390, 820, 1440, 2560]) {
  test(`integrated homepage remains readable at ${width}px`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('main')).toHaveCount(1)
    await expect(page.locator('footer')).toHaveCount(1)
    await expect(page.locator('[data-story-chapter]')).toHaveCount(6)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath(`home-opening-${width}.png`)
    })
    for (const id of ['built-with-asyra', 'start-building']) {
      const section = page.locator(`#${id}`)
      await section.scrollIntoViewIfNeeded()
      await expect(section.locator('h2')).toBeVisible()
      expect(
        await section.evaluate((element) => element.scrollWidth <= innerWidth)
      ).toBe(true)
      for (const img of await section.locator('img').all())
        await img.evaluate((element: HTMLImageElement) => element.decode())
      await section.screenshot({
        path: testInfo.outputPath(`home-${id}-${width}.png`)
      })
    }
    await page.locator('footer').scrollIntoViewIfNeeded()
    await expect(
      page
        .getByRole('navigation', { name: 'Footer navigation' })
        .getByRole('link', { name: 'Docs', exact: true })
    ).toBeVisible()
    await page.screenshot({
      path: testInfo.outputPath(`home-closing-${width}.png`)
    })
  })
}

test('the preview route is removed and home keeps canonical metadata', async ({
  request
}) => {
  const preview = await request.get('/story', { maxRedirects: 0 })
  expect(preview.status()).toBe(404)
  const home = await request.get('/')
  const html = await home.text()
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
  if (!canonical) throw new Error('Homepage canonical link is missing')
  expect(new URL(canonical).pathname).toBe('/')
  expect(new URL(canonical).protocol).toBe('https:')
  expect(html).not.toContain(
    'canonical" href="https://asyra-framework.vercel.app/story'
  )
})
