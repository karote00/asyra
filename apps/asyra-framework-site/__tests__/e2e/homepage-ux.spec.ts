import { expect, test } from '@playwright/test'

for (const width of [320, 394, 820, 1024, 1280, 1440, 2560]) {
  test(`homepage navigation and reading hierarchy remain usable at ${width}px`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const header = page.locator('header').first()
    if (width >= 1024) {
      await expect(header.locator('summary')).toBeHidden()
      await expect(
        header.getByRole('link', { name: 'Docs', exact: true })
      ).toBeVisible()
      await expect(
        header.getByRole('link', { name: 'Runtime Atlas', exact: true })
      ).toBeVisible()
    } else {
      await expect(header.locator('summary')).toBeVisible()
    }
    const links = await header.locator('a, summary').all()
    const boxes = []
    for (const link of links) {
      if (!(await link.isVisible())) continue
      const font = await link.evaluate((el) =>
        parseFloat(getComputedStyle(el).fontSize)
      )
      expect.soft(font).toBeGreaterThanOrEqual(14)
      const box = await link.boundingBox()
      if (!box) throw new Error('Header control has no bounds')
      expect.soft(box.height).toBeGreaterThanOrEqual(40)
      expect.soft(box.x).toBeGreaterThanOrEqual(0)
      expect.soft(box.x + box.width).toBeLessThanOrEqual(width)
      for (const other of boxes) {
        expect
          .soft(
            box.x >= other.x + other.width - 1 ||
              other.x >= box.x + box.width - 1 ||
              box.y >= other.y + other.height - 1 ||
              other.y >= box.y + box.height - 1
          )
          .toBe(true)
      }
      boxes.push(box)
    }
    for (const chapter of await page.locator('[data-story-chapter]').all()) {
      const copy = chapter.locator(':scope > div').first()
      const body = copy.locator(':scope > p').nth(1)
      expect
        .soft(
          await body.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
        )
        .toBeGreaterThanOrEqual(width >= 1024 ? 18 : 16)
      for (const item of await copy.locator('li').all()) {
        expect
          .soft(
            await item.evaluate((el) =>
              parseFloat(getComputedStyle(el).fontSize)
            )
          )
          .toBeGreaterThanOrEqual(14)
      }
      expect
        .soft(await copy.evaluate((el) => el.scrollWidth <= el.clientWidth))
        .toBe(true)
    }
    await page.screenshot({ path: testInfo.outputPath(`home-ux-${width}.png`) })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  })
}

test('short desktop windows retain the complete readable story in natural flow', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 700 })
  await page.goto('/')
  await expect(page.locator('.spatial-story-shell')).toHaveAttribute(
    'data-motion',
    'off'
  )
  await expect(page.locator('[data-shared-scene]')).toBeHidden()
  for (const chapter of await page.locator('[data-story-chapter]').all()) {
    const copy = chapter.locator(':scope > div').first()
    expect(await copy.evaluate((el) => getComputedStyle(el).position)).not.toBe(
      'sticky'
    )
  }
  await page.screenshot({ path: testInfo.outputPath('short-desktop.png') })
})
