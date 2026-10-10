import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  test(`${width}px homepage records cold-load transfer and loads only current artwork`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    const failures: string[] = []
    page.on('requestfailed', (request) => {
      if (request.failure()?.errorText !== 'net::ERR_ABORTED')
        failures.push(request.url())
    })
    await page.goto('/')
    for (const chapter of await page.locator('[data-story-chapter]').all()) {
      await chapter.scrollIntoViewIfNeeded()
    }
    await page.locator('footer').scrollIntoViewIfNeeded()
    await page.locator('img').evaluateAll(async (images) => {
      await Promise.all(
        images.map((image) => (image as HTMLImageElement).decode())
      )
    })
    await page.waitForLoadState('networkidle')
    const entries = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')
      const resources = performance.getEntriesByType('resource')
      return [...navigation, ...resources].map((entry) => {
        const resource = entry as PerformanceResourceTiming
        return {
          url: resource.name,
          type: resource.initiatorType,
          transferBytes: resource.transferSize,
          encodedBytes: resource.encodedBodySize,
          decodedBytes: resource.decodedBodySize
        }
      })
    })
    const local = entries.filter(
      (entry) => new URL(entry.url).origin === new URL(page.url()).origin
    )
    const illustrations = local.filter((entry) =>
      entry.url.includes('/illustrations/')
    )
    expect(illustrations.length).toBe(2)
    expect(
      illustrations.every((entry) => entry.url.includes('/spatial-story/'))
    ).toBe(true)
    expect(new Set(illustrations.map((entry) => entry.url)).size).toBe(2)
    expect(failures).toEqual([])
    expect(illustrations.every((entry) => entry.encodedBytes > 0)).toBe(true)
    expect(
      local.find((entry) => entry.type === 'navigation')?.encodedBytes
    ).toBeGreaterThan(0)
    const report = {
      width,
      url: page.url(),
      requests: local.length,
      transferBytes: local.reduce(
        (total, entry) => total + entry.transferBytes,
        0
      ),
      encodedBytes: local.reduce(
        (total, entry) => total + entry.encodedBytes,
        0
      ),
      imageBytes: local
        .filter((entry) =>
          /\.(?:webp|png|jpe?g|svg|ico)$/u.test(new URL(entry.url).pathname)
        )
        .reduce((total, entry) => total + entry.encodedBytes, 0),
      entries
    }
    const reportPath = testInfo.outputPath('homepage-transfer.json')
    await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n')
    await testInfo.attach('homepage-transfer', {
      path: testInfo.outputPath('homepage-transfer.json'),
      contentType: 'application/json'
    })
  })
}
