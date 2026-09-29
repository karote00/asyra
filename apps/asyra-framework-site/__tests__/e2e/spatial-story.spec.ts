import { expect, test, type Page } from '@playwright/test'

async function seek(page: Page, chapter: number, progress: number) {
  const top = await page
    .locator(`[data-story-chapter="${chapter}"]`)
    .evaluate(
      (node, p) =>
        node.getBoundingClientRect().top +
        window.scrollY -
        80 +
        ((node as HTMLElement).offsetHeight -
          (node.getAttribute('data-story-chapter') === '5'
            ? innerHeight - 80
            : 0)) *
          p,
      progress
    )
  await page.evaluate((y) => window.scrollTo(0, y), top)
  await expect(page.locator('[data-shared-scene]')).toHaveAttribute(
    'data-chapter',
    String(chapter)
  )
  await expect
    .poll(async () =>
      Number(
        await page.locator('[data-shared-scene]').getAttribute('data-progress')
      )
    )
    .toBeCloseTo(progress, 2)
}

test('one mounted scene carries the idea through six chapters and reversible intermediate states', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await expect(page.locator('.spatial-story-shell')).toHaveAttribute(
    'data-motion',
    'on'
  )
  await page
    .locator('[data-shared-scene] [data-story-layer="notebook"]')
    .evaluate((node) =>
      node.setAttribute('data-identity-proof', 'same-notebook')
    )
  for (let chapter = 0; chapter < 6; chapter++) {
    for (const progress of [0.04, 0.5, 0.86]) {
      await seek(page, chapter, progress)
      await expect(
        page.locator('[data-shared-scene] [data-identity-proof]')
      ).toHaveCount(1)
      expect(
        await page
          .locator('[data-shared-scene] img')
          .evaluateAll((nodes) =>
            nodes.every(
              (node) =>
                (node as HTMLImageElement).complete &&
                (node as HTMLImageElement).naturalWidth > 0
            )
          )
      ).toBe(true)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
      await page.screenshot({
        path: testInfo.outputPath(`chapter-${chapter}-${progress}-desktop.png`)
      })
    }
  }
  for (let chapter = 1; chapter < 6; chapter++) {
    await seek(page, chapter - 1, 0.998)
    const before = await page
      .locator('[data-shared-scene] [data-story-layer="notebook"]')
      .boundingBox()
    await seek(page, chapter, 0.002)
    const after = await page
      .locator('[data-shared-scene] [data-story-layer="notebook"]')
      .boundingBox()
    expect(before).not.toBeNull()
    expect(after).not.toBeNull()
    if (!before || !after)
      throw new Error('The shared notebook must have visible bounds')
    for (const key of ['x', 'y', 'width', 'height'] as const)
      expect(Math.abs(after[key] - before[key])).toBeLessThan(2)
  }
  await seek(page, 3, 0.5)
  const styles = await page
    .locator('[data-shared-scene] [data-story-layer]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('style')))
  await seek(page, 4, 0.8)
  await seek(page, 3, 0.5)
  expect(
    await page
      .locator('[data-shared-scene] [data-story-layer]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('style')))
  ).toEqual(styles)
  const idle = await page
    .locator('[data-shared-scene]')
    .evaluate(async (node) => {
      let count = 0
      const observer = new MutationObserver((records) => {
        count += records.length
      })
      observer.observe(node, { attributes: true, subtree: true })
      await new Promise((resolve) => setTimeout(resolve, 250))
      observer.disconnect()
      return count
    })
  expect(idle).toBe(0)
  expect(errors).toEqual([])
})

test('mobile has complete connected snapshots in natural flow and no horizontal overflow', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/')
  await expect(page.locator('.spatial-story-shell')).toHaveAttribute(
    'data-motion',
    'off'
  )
  await expect(page.locator('[data-shared-scene]')).not.toBeVisible()
  for (let chapter = 0; chapter < 6; chapter++) {
    const section = page.locator(`[data-story-chapter="${chapter}"]`)
    await section.scrollIntoViewIfNeeded()
    const y = await section.evaluate(
      (node) => node.getBoundingClientRect().top + scrollY - 80
    )
    await page.evaluate((top) => scrollTo(0, top), y)
    await expect(section.locator('[data-static-scene]')).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath(`chapter-${chapter}-mobile.png`)
    })
  }
})

test('native chapter links, resize and live reduced motion retain content', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.getByRole('link', { name: 'Adapt', exact: true }).click()
  await expect(page).toHaveURL(/#replace$/)
  await expect(page.locator('[data-shared-scene]')).toHaveAttribute(
    'data-chapter',
    '3'
  )
  await page.setViewportSize({ width: 390, height: 900 })
  await expect(page.locator('.spatial-story-shell')).toHaveAttribute(
    'data-motion',
    'off'
  )
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(page.locator('.spatial-story-shell')).toHaveAttribute(
    'data-motion',
    'on'
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.spatial-story-shell')).toHaveAttribute(
    'data-motion',
    'off'
  )
  await expect(page.locator('[data-static-scene]')).toHaveCount(6)
  await page.locator('#compose').scrollIntoViewIfNeeded()
  await page.screenshot({ path: testInfo.outputPath('reduced-motion.png') })
})

test('no JavaScript retains six explanatory compositions and documentation actions', async ({
  browser
}, testInfo) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 900 }
  })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(page.locator('[data-story-chapter]')).toHaveCount(6)
  for (const scene of await page.locator('[data-static-scene]').all())
    await expect(scene).toBeVisible()
  await page
    .getByRole('link', { name: 'Explore the framework' })
    .scrollIntoViewIfNeeded()
  await expect(
    page.getByRole('link', { name: 'Explore the framework' })
  ).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('no-js.png') })
  await context.close()
})

test('the opened architecture exposes each responsibility label without an overlapping plane', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await seek(page, 1, 0.86)
  for (const name of ['feature', 'transaction', 'state']) {
    const label = page.locator(
      `[data-shared-scene] [data-story-layer="${name}"] strong`
    )
    expect(
      await label.evaluate((node) => {
        const bounds = node.getBoundingClientRect()
        const hit = document.elementFromPoint(
          bounds.x + bounds.width / 2,
          bounds.y + bounds.height / 2
        )
        return hit === node || node.contains(hit)
      }),
      `${name} must remain readable`
    ).toBe(true)
  }
})

test('a flat plan rises into a house and the replacement grows the same footprint into a tower', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const notebook = page.locator(
    '[data-shared-scene] [data-story-layer="notebook"]'
  )
  const building = notebook.locator('[data-drawing-output]')
  const plan = notebook.locator('[data-building-plan]')
  await seek(page, 2, 0.62)
  await expect(building).toHaveAttribute('data-building-height', '0')
  const footprint = await plan.innerHTML()
  await page.screenshot({ path: testInfo.outputPath('building-plan.png') })
  await seek(page, 2, 0.635)
  expect(
    Number(
      await building
        .locator('[data-building-part="slab-top-0"]')
        .getAttribute('opacity')
    )
  ).toBeGreaterThan(0)
  await expect(
    building.locator('[data-building-part="front"]')
  ).toHaveAttribute('opacity', '0')
  await expect(
    building.locator('[data-building-part="roof-left"]')
  ).toHaveAttribute('opacity', '0')
  await page.screenshot({
    path: testInfo.outputPath('building-slab-unfolding.png')
  })
  await seek(page, 2, 0.8)
  const partialHouse = Number(
    await building.getAttribute('data-building-height')
  )
  expect(partialHouse).toBeGreaterThan(0)
  expect(partialHouse).toBeLessThan(44)
  await page.screenshot({
    path: testInfo.outputPath('building-house-growing.png')
  })
  await seek(page, 3, 0)
  await expect(building).toHaveAttribute('data-building-height', '44')
  const pose = await notebook.getAttribute('style')
  const house = await notebook
    .locator('[data-building-part="front"]')
    .getAttribute('points')
  await expect(
    page.locator('[data-shared-scene] [data-story-layer="feature"] code')
  ).toHaveText('drawHouse(input)')
  await page.screenshot({ path: testInfo.outputPath('building-house.png') })
  await seek(page, 3, 0.47)
  await expect(building).toHaveAttribute('data-building-height', '44')
  await expect(
    page.locator('[data-shared-scene] [data-story-layer="replacement"] code')
  ).toHaveText('drawTower(input)')
  await seek(page, 3, 0.65)
  expect(
    Number(await building.getAttribute('data-building-height'))
  ).toBeGreaterThan(44)
  expect(
    Number(await building.getAttribute('data-building-height'))
  ).toBeLessThan(176)
  await page.screenshot({
    path: testInfo.outputPath('building-tower-growing.png')
  })
  await seek(page, 3, 0.9)
  await expect(building).toHaveAttribute('data-building-height', '176')
  expect(await plan.innerHTML()).toBe(footprint)
  expect(await notebook.getAttribute('style')).toBe(pose)
  await page.screenshot({ path: testInfo.outputPath('building-tower.png') })
  await seek(page, 4, 0.9)
  await expect(
    page.locator(
      '[data-shared-scene] [data-story-layer="collection"] [data-drawing-output]'
    )
  ).toHaveAttribute('data-building-height', '176')
  await seek(page, 3, 0.2)
  await expect(building).toHaveAttribute('data-building-height', '44')
  expect(
    await notebook
      .locator('[data-building-part="front"]')
      .getAttribute('points')
  ).toBe(house)
})
