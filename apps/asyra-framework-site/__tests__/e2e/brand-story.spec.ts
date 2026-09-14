import { expect, test } from '@playwright/test'

const chapterLabels = ['Imagine', 'Build', 'Evolve', 'Inside', 'Begin']

for (const width of [1440, 864, 390, 320]) {
  test(`complete brand journey preserves reading order and navigation at ${width}px`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/')
    const chapters = page.locator('[data-story-chapter]')
    await expect(chapters).toHaveCount(5)
    expect(
      await chapters.evaluateAll((elements) =>
        elements.map((element) => element.getAttribute('data-story-chapter'))
      )
    ).toEqual(chapterLabels)
    await expect(chapters.nth(0).locator('#hero-title')).toHaveText(
      'Build product features, not infrastructure.'
    )
    await expect(chapters.nth(1).locator('#poc-story-title')).toBeVisible()
    await expect(
      chapters.nth(1).locator('#product-evidence-title')
    ).toBeVisible()
    await expect(
      chapters.nth(2).locator('#framework-value-title')
    ).toBeVisible()
    await expect(chapters.nth(2).locator('#grow-title')).toBeVisible()
    await expect(chapters.nth(3).locator('#architecture-story')).toBeVisible()
    await expect(chapters.nth(4).locator('#readiness-title')).toBeVisible()
    await page.screenshot({
      path: testInfo.outputPath(`brand-hero-${width}.png`)
    })
    for (const [index, label] of chapterLabels.entries()) {
      const link = page
        .getByRole('navigation', { name: 'Explore the story' })
        .getByRole('link', { name: label, exact: true })
      await link.click()
      await expect(chapters.nth(index)).toBeFocused()
      const geometry = await chapters.nth(index).evaluate((element) => {
        const nav = document.querySelector('.story-navigation')
        if (!nav) throw new Error('Missing chapter navigation')
        const bounds = nav.getBoundingClientRect()
        return {
          chapterTop: element.getBoundingClientRect().top,
          navTop: bounds.top,
          navBottom: bounds.bottom,
          overflow: document.documentElement.scrollWidth - window.innerWidth
        }
      })
      expect(geometry.navTop).toBeGreaterThanOrEqual(-1)
      // The first chapter can be reached before the navigation sticks.
      expect(geometry.navTop).toBeLessThanOrEqual(index === 0 ? 64 : 1)
      expect(geometry.chapterTop).toBeGreaterThanOrEqual(geometry.navBottom)
      expect(geometry.overflow).toBeLessThanOrEqual(1)
      await page.screenshot({
        path: testInfo.outputPath(`chapter-${index}-${width}.png`)
      })
    }
    await page.screenshot({
      path: testInfo.outputPath(`brand-full-${width}.png`),
      fullPage: true
    })
  })
}

test('native chapter keyboard links and reduced motion preserve every destination', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Explore the story' })
  for (const label of chapterLabels) {
    const link = nav.getByRole('link', { name: label, exact: true })
    await expect(link).toHaveCSS('animation-name', 'none')
    await link.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator(`[data-story-chapter="${label}"]`)).toBeFocused()
  }
  await expect(
    page
      .locator('#story-begin')
      .getByRole('link', { name: 'See what comes next' })
  ).toHaveAttribute('href', '/roadmap')
  await expect(page.locator('video')).toHaveJSProperty('currentTime', 0)
})

test('chapter navigation highlights the reading position forward and backward', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  const chapters = page.locator('[data-story-chapter]')
  for (const index of [0, 1, 2, 3, 4, 3, 1, 0]) {
    await chapters.nth(index).evaluate((element) =>
      window.scrollTo({
        top:
          window.scrollY +
          element.getBoundingClientRect().top +
          element.clientHeight / 2 -
          window.innerHeight / 2,
        behavior: 'instant'
      })
    )
    const links = page
      .getByRole('navigation', { name: 'Explore the story' })
      .getByRole('link')
    await expect(links.nth(index)).toHaveCSS(
      'border-bottom-color',
      'rgb(213, 31, 23)'
    )
    for (let other = 0; other < 5; other++) {
      if (other !== index)
        await expect(links.nth(other)).toHaveCSS(
          'border-bottom-color',
          'rgba(0, 0, 0, 0)'
        )
    }
  }
})

test('the whole story remains accessible without JavaScript', async ({
  browser
}, testInfo) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 }
  })
  const page = await context.newPage()
  await page.goto(`${testInfo.project.use.baseURL}/`)
  await expect(page.locator('[data-story-chapter]')).toHaveCount(5)
  await page
    .getByRole('navigation', { name: 'Explore the story' })
    .getByRole('link', { name: 'Begin', exact: true })
    .click()
  await expect(page).toHaveURL(/#story-begin$/)
  await expect(page.locator('#readiness-title')).toBeVisible()
  await expect(
    page
      .locator('#story-begin')
      .getByRole('link', { name: 'Compose the Framework' })
  ).toHaveAttribute('href', '/docs/start/custom-composition')
  await context.close()
})
