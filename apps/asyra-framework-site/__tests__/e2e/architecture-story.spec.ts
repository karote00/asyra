import { expect, test, type Page, type Locator } from '@playwright/test'

const story = (page: Page) => page.locator('#architecture-story')
const stages = (page: Page) => story(page).locator('li')
const nodes = (page: Page) => story(page).locator('.architecture-story__node')
const diagram = (page: Page) =>
  story(page).locator('.architecture-story__diagram')

async function boundsOf(locator: Locator) {
  const bounds = await locator.boundingBox()
  if (!bounds) throw new Error('Expected a visible architecture element')
  return bounds
}

async function centerStage(page: Page, index: number) {
  await stages(page)
    .nth(index)
    .evaluate((element) => {
      window.scrollTo({
        top:
          window.scrollY +
          element.getBoundingClientRect().top +
          element.clientHeight / 2 -
          window.innerHeight / 2,
        behavior: 'instant'
      })
    })
  await expect(nodes(page).nth(index)).toHaveCSS(
    'background-color',
    'rgb(8, 119, 184)'
  )
}

async function assertCompact(page: Page) {
  await expect(diagram(page)).toHaveCSS('position', 'static')
  for (const node of await nodes(page).all()) {
    await expect(node).toHaveCSS('animation-name', 'none')
  }
  await expect(stages(page)).toHaveCount(4)
  for (const stage of await stages(page).all()) {
    await expect(stage).toBeVisible()
    expect((await stage.innerText()).length).toBeGreaterThan(70)
    expect((await boundsOf(stage)).height).toBeLessThan(500)
  }
}

test('scroll highlights four responsibility boundaries in both directions without advancing while idle', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  const mediaRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().endsWith('.mp4')) mediaRequests.push(request.url())
  })
  await page.goto('/#architecture-story')
  await expect(diagram(page)).toHaveCSS('position', 'sticky')
  const body = story(page).locator('.architecture-story__body')
  expect((await boundsOf(body)).height).toBeLessThanOrEqual(3000)
  for (const index of [0, 1, 2, 3, 2, 1, 0]) {
    await centerStage(page, index)
    for (let other = 0; other < 4; other++) {
      if (other !== index)
        await expect(nodes(page).nth(other)).toHaveCSS(
          'background-color',
          'rgba(0, 0, 0, 0)'
        )
    }
    const bounds = await boundsOf(diagram(page))
    expect(bounds.y).toBeGreaterThanOrEqual(0)
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(1000)
    await page.screenshot({ path: testInfo.outputPath(`stage-${index}.png`) })
  }
  const progress = () =>
    nodes(page).evaluateAll((elements) =>
      elements.map((element) =>
        element
          .getAnimations()
          .map((animation) => animation.effect?.getComputedTiming().progress)
      )
    )
  const before = await progress()
  await page.waitForTimeout(600)
  expect(await progress()).toEqual(before)
  expect(mediaRequests).toEqual([])
  await expect(page.locator('video')).toHaveJSProperty('currentTime', 0)
})

for (const width of [3840, 1440, 1100, 1099, 864, 820, 390, 320]) {
  test(`architecture stays readable within shared content edges at ${width}px`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/#architecture-story')
    await expect(stages(page)).toHaveCount(4)
    const geometry = await story(page).evaluate((element) => {
      const rect = element.getBoundingClientRect()
      const filmElement = document.querySelector(
        'figure[aria-labelledby="action-film-title"]'
      )
      if (!filmElement) throw new Error('Missing film layout reference')
      const film = filmElement.getBoundingClientRect()
      return {
        left: rect.left,
        right: rect.right,
        filmLeft: film.left,
        filmRight: film.right,
        overflow: document.documentElement.scrollWidth - window.innerWidth
      }
    })
    expect(Math.abs(geometry.left - geometry.filmLeft)).toBeLessThan(1)
    expect(Math.abs(geometry.right - geometry.filmRight)).toBeLessThan(1)
    expect(geometry.overflow).toBeLessThanOrEqual(1)
    if (width < 1100) await assertCompact(page)
    await story(page).screenshot({
      path: testInfo.outputPath(`architecture-${width}.png`)
    })
  })
}

test('native keyboard link skips the story and focuses the code example', async ({
  page
}) => {
  await page.goto('/#architecture-story')
  const link = page.getByRole('link', { name: 'Go to the code example' })
  await link.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#feature-code$/)
  await expect(page.locator('#feature-code')).toBeFocused()
  await expect(
    page.getByRole('link', { name: 'Read the complete Feature session guide' })
  ).toHaveAttribute('href', '/docs/build/feature-session')
})

test('live motion preference and viewport changes remove and restore sticky emphasis', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/#architecture-story')
  await centerStage(page, 2)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await assertCompact(page)
  await story(page).screenshot({
    path: testInfo.outputPath('reduced-motion.png')
  })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await centerStage(page, 1)
  await page.setViewportSize({ width: 1440, height: 700 })
  await assertCompact(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await assertCompact(page)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await centerStage(page, 3)
})

test('complete semantic story and code navigation work without JavaScript', async ({
  browser
}, testInfo) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 }
  })
  const page = await context.newPage()
  await page.goto(`${testInfo.project.use.baseURL}/#architecture-story`)
  await assertCompact(page)
  await expect(
    page.getByRole('heading', { name: 'Transaction and canonical owner' })
  ).toBeVisible()
  await page.getByRole('link', { name: 'Go to the code example' }).click()
  await expect(page).toHaveURL(/#feature-code$/)
  await context.close()
})

test('base content stays compact when the timeline capability block is unavailable', async ({
  page
}, testInfo) => {
  // Remove only the gated enhancement to emulate an unsupported CSS capability.
  // The authored base DOM and utility styles remain intact.
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/#architecture-story')
  const removed = await page.evaluate(() => {
    let count = 0
    for (const sheet of document.styleSheets) {
      for (let index = sheet.cssRules.length - 1; index >= 0; index--) {
        const rule = sheet.cssRules[index]
        if (
          rule instanceof CSSSupportsRule &&
          rule.conditionText.includes('timeline-scope')
        ) {
          sheet.deleteRule(index)
          count++
        }
      }
    }
    return count
  })
  expect(removed).toBeGreaterThan(0)
  await assertCompact(page)
  await story(page).screenshot({
    path: testInfo.outputPath('unsupported-timelines.png')
  })
})

test('static diagram connectors and text retain the intended contrast', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#architecture-story')
  await expect(nodes(page).first()).toHaveCSS(
    'border-top-color',
    'rgba(255, 255, 255, 0.2)'
  )
  const connectors = diagram(page).locator('[data-architecture-connector]')
  await expect(connectors).toHaveCount(3)
  for (const connector of await connectors.all()) {
    await expect(connector).toHaveCSS(
      'background-color',
      'rgba(255, 255, 255, 0.2)'
    )
    const bounds = await boundsOf(connector)
    expect(bounds.width).toBe(1)
    expect(bounds.height).toBe(18)
  }
  await expect(stages(page).first().locator('p')).toHaveCSS(
    'color',
    'rgba(255, 255, 255, 0.7)'
  )
})
