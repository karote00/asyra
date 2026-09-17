import { expect, test } from '@playwright/test'

for (const width of [320, 390, 820]) {
  test(`${width}px story artwork loads once per asset and stays inside the viewport`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    const requested: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/illustrations/'))
        requested.push(request.url())
    })
    await page.goto('/')
    for (const chapter of await page.locator('[data-story-chapter]').all())
      await chapter.scrollIntoViewIfNeeded()
    for (const image of await page.locator('[data-story-chapter] img').all()) {
      await image.evaluate((element: HTMLImageElement) => element.decode())
      expect(
        await image.evaluate(
          (element: HTMLImageElement) => element.naturalWidth
        )
      ).toBeGreaterThan(0)
    }
    expect(new Set(requested).size).toBe(requested.length)
    expect(requested.every((url) => url.includes('/spatial-story/'))).toBe(true)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath(`story-mobile-${width}.png`)
    })
  })
}
