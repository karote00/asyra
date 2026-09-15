import { expect, test } from '@playwright/test'

for (const width of [320, 390, 820, 1024, 1280, 1440, 2560]) {
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

test('story layout reflows with its artwork instead of retaining empty space', async ({
  page
}) => {
  await page.goto('/')
  const chapter = page.locator('[data-story-chapter="0"]')
  const copy = chapter.locator(':scope > div').first()
  const artwork = chapter.locator('[data-static-scene]')
  await page.setViewportSize({ width: 390, height: 1000 })
  const mobileArt = await artwork.boundingBox()
  if (!mobileArt) throw new Error('Mobile artwork is missing')
  expect(mobileArt.height).toBeLessThan(360)
  await page.setViewportSize({ width: 820, height: 1000 })
  const tabletCopy = await copy.boundingBox()
  const tabletArt = await artwork.boundingBox()
  if (!tabletArt || !tabletCopy)
    throw new Error('Tablet composition is missing')
  expect(tabletArt.x).toBeGreaterThanOrEqual(tabletCopy.x + tabletCopy.width)
  expect(Math.abs(tabletArt.y - tabletCopy.y)).toBeLessThan(100)
  await page.setViewportSize({ width: 1024, height: 1000 })
  const shared = await page.locator('[data-shared-scene]').boundingBox()
  if (!shared) throw new Error('Shared scene is missing')
  expect(shared.height).toBeLessThan(700)
  await page.setViewportSize({ width: 2560, height: 1000 })
  await expect(page.locator('.spatial-story-shell')).toHaveAttribute(
    'data-motion',
    'on'
  )
  const track = await page.locator('[data-story-track]').boundingBox()
  if (!track) throw new Error('Story track is missing')
  expect(track.width).toBeLessThanOrEqual(1800)
  expect(track.x).toBeGreaterThan(300)
})

test('compact architecture snapshots keep the state plane above the caption', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 1000 })
  await page.goto('/')
  for (const index of [1, 2, 3]) {
    const scene = page.locator(
      `[data-story-chapter="${index}"] [data-static-scene]`
    )
    const state = await scene
      .locator('[data-story-layer="state"] > div')
      .boundingBox()
    const caption = await scene.locator('[data-scene-caption]').boundingBox()
    if (!state || !caption) throw new Error('Architecture snapshot is missing')
    expect(state.y + state.height).toBeLessThanOrEqual(caption.y - 8)
  }
})

test('394px story artwork stays between chapter copy and its caption', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 394, height: 852 })
  await page.goto('/')
  for (let index = 0; index < 6; index++) {
    const chapter = page.locator(`[data-story-chapter="${index}"]`)
    await chapter.scrollIntoViewIfNeeded()
    await chapter.screenshot({
      path: testInfo.outputPath(`chapter-${index}-394.png`)
    })
    const copy = await chapter.locator(':scope > div').first().boundingBox()
    const scene = chapter.locator('[data-static-scene]')
    const caption = await scene.locator('[data-scene-caption]').boundingBox()
    if (!copy || !caption) throw new Error('Chapter layout is missing')
    const sectionBox = await chapter.boundingBox()
    if (!sectionBox) throw new Error('Chapter bounds are missing')
    expect
      .soft(caption.y + caption.height)
      .toBeLessThanOrEqual(sectionBox.y + sectionBox.height - 16)
    for (const layer of await scene.locator('[data-story-layer]').all()) {
      if (
        Number(await layer.evaluate((el) => getComputedStyle(el).opacity)) < 0.1
      )
        continue
      const box = await layer.locator(':scope > *').first().boundingBox()
      if (!box) continue
      expect
        .soft(box.y, `chapter ${index} artwork above copy`)
        .toBeGreaterThanOrEqual(copy.y + copy.height)
      expect
        .soft(box.y + box.height, `chapter ${index} artwork overlaps caption`)
        .toBeLessThanOrEqual(caption.y - 8)
    }
    for (const label of await scene
      .locator('[data-scene-caption] span')
      .all()) {
      await label.scrollIntoViewIfNeeded()
      const visibility = await label.evaluate((el) => {
        const r = el.getBoundingClientRect()
        const hit = document.elementFromPoint(
          r.x + r.width / 2,
          r.y + r.height / 2
        )
        return {
          visible: hit === el || el.contains(hit),
          hit: hit?.outerHTML.slice(0, 180),
          chapter: el
            .closest('[data-story-chapter]')
            ?.getAttribute('data-story-chapter')
        }
      })
      expect.soft(visibility.visible, JSON.stringify(visibility)).toBe(true)
    }
  }
})

for (const width of [320, 394, 576]) {
  test(`opening illustration and caption share edges and a stable gap at ${width}px`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/')
    const scene = page.locator('[data-story-chapter="0"] [data-static-scene]')
    const picture = scene.locator('img').first()
    await picture.evaluate((img: HTMLImageElement) => img.decode())
    const imageBox = await picture.boundingBox()
    const caption = await scene.locator('[data-scene-caption]').boundingBox()
    if (!imageBox || !caption) throw new Error('Opening composition is missing')
    expect.soft(Math.abs(imageBox.x - caption.x)).toBeLessThanOrEqual(1)
    expect
      .soft(Math.abs(imageBox.x + imageBox.width - caption.x - caption.width))
      .toBeLessThanOrEqual(1)
    expect
      .soft(caption.y - imageBox.y - imageBox.height)
      .toBeGreaterThanOrEqual(12)
    expect
      .soft(caption.y - imageBox.y - imageBox.height)
      .toBeLessThanOrEqual(24)
    await scene.screenshot({
      path: testInfo.outputPath(`opening-caption-${width}.png`)
    })
  })
}

for (const width of [394, 820, 1440, 2560]) {
  test(`homepage resource content follows the story gutter at ${width}px`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/')
    const story = await page
      .locator('[data-story-chapter="0"] > div')
      .first()
      .boundingBox()
    if (!story) throw new Error('Story copy is missing')
    for (const id of ['built-with-asyra', 'start-building']) {
      const section = page.locator(`#${id}`)
      const content = await section.locator('h2').boundingBox()
      if (!content) throw new Error('Resource content is missing')
      expect.soft(Math.abs(content.x - story.x)).toBeLessThanOrEqual(1)
      await section.scrollIntoViewIfNeeded()
      for (const img of await section.locator('img').all()) {
        await img.evaluate((element: HTMLImageElement) => element.decode())
      }
      await section.screenshot({
        path: testInfo.outputPath(`${id}-${width}.png`)
      })
    }
  })
}
