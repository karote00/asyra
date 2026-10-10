import { expect, test } from '@playwright/test'

const installGuideUrl =
  'https://github.com/karote00/asyra/blob/main/plugins/asyra-agent/README.md'

for (const width of [320, 820, 1440]) {
  test(`developer entry connects product examples to AI and self-guided starts at ${width}px`, async ({
    page
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const section = page.getByRole('region', {
      name: 'Your next app starts with an idea.'
    })
    await section.scrollIntoViewIfNeeded()
    await expect(section).toContainText('Asyra Skill')
    await expect(section).toContainText('your existing AI coding agent')
    const products = await page.locator('#built-with-asyra').boundingBox()
    const entry = await section.boundingBox()
    const starters = await page.locator('#start-building').boundingBox()
    if (!products || !entry || !starters)
      throw new Error('Homepage entry sections are missing')
    expect(entry.y).toBeGreaterThanOrEqual(products.y + products.height - 1)
    expect(starters.y).toBeGreaterThanOrEqual(entry.y + entry.height - 1)

    const install = section.getByRole('link', { name: 'Get Asyra Skill' })
    await expect(install).toHaveAttribute('href', installGuideUrl)
    await expect(install).toHaveAttribute('target', '_blank')
    await expect(install).toHaveAttribute('rel', 'noopener noreferrer')
    const contrast = await install.evaluate((element) => {
      const style = getComputedStyle(element)
      const luminance = (color: string) => {
        const channels = color.match(/[\d.]+/g)
        if (!channels || channels.length < 3)
          throw new Error(`Expected an RGB color: ${color}`)
        const values = channels.slice(0, 3).map(Number)
        const linear = values.map((channel) => {
          const value = channel / 255
          return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4
        })
        return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
      }
      const foreground = luminance(style.color)
      const background = luminance(style.backgroundColor)
      return (
        (Math.max(foreground, background) + 0.05) /
        (Math.min(foreground, background) + 0.05)
      )
    })
    expect(contrast).toBeGreaterThanOrEqual(4.5)
    for (const link of await section.getByRole('link').all()) {
      const box = await link.boundingBox()
      if (!box) throw new Error('Developer entry link is missing')
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(width)
    }
    await section.getByRole('link', { name: 'Explore the starters' }).click()
    await expect(page).toHaveURL(/\/#start-building$/)
    await expect(
      page.getByRole('heading', { name: 'Choose your starting point.' })
    ).toBeInViewport()
    await section.getByRole('link', { name: 'Build with AI guide' }).click()
    await expect(page).toHaveURL(/\/docs\/start\/extend-with-ai$/)
    await expect(
      page.getByRole('heading', {
        name: 'Extend Asyra with an AI coding agent',
        exact: true
      })
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Asyra Skill installation guide' })
    ).toHaveAttribute('href', installGuideUrl)
  })
}

test('primary Start building CTAs route to Generic Starter source', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const startBuildingCtas = page.getByRole('link', {
    name: /Start building/
  })
  await expect(startBuildingCtas).toHaveCount(2)
  for (let index = 0; index < 2; index += 1) {
    const cta = startBuildingCtas.nth(index)
    await expect(cta).toHaveAttribute('href', '/docs#generic-starter-source')
    await cta.evaluate((anchor: HTMLAnchorElement) =>
      anchor.scrollIntoView({ behavior: 'instant', block: 'center' })
    )
    await expect(cta).toBeInViewport()
    await cta.click()
    await expect(page).toHaveURL(/\/docs#generic-starter-source$/)
    await expect(
      page.getByRole('heading', { name: 'Generic Starter source' })
    ).toBeVisible()
    await expect(
      page.getByText('npx create-asyra-app@0.1.0 my-app --package-manager=npm')
    ).toBeVisible()
    if (index === 0) await page.goto('/')
  }
})

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
    await expect(cards.nth(0)).toContainText('published CLI')
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
    await expect(
      page.getByText('npx create-asyra-app@0.1.0 my-app --package-manager=npm')
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'create-asyra-app package' })
    ).toHaveAttribute('target', '_blank')
    await expect(
      page.getByRole('link', { name: 'create-asyra-app package' })
    ).toHaveAttribute('rel', 'noopener noreferrer')
    await page.screenshot({
      path: testInfo.outputPath('published-starter-docs.png'),
      fullPage: false
    })
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
  const developerEntry = page.locator('#build-with-ai')
  await expect(developerEntry).toContainText('Asyra Skill')
  await developerEntry
    .getByRole('link', { name: 'Build with AI guide' })
    .click()
  await expect(page).toHaveURL(/\/docs\/start\/extend-with-ai$/)
  await page.goto('/')
  await expect(page.locator('#start-building')).toContainText('Generic Starter')
  await expect(page.locator('#start-building')).toContainText('published CLI')
  await page
    .locator('#start-building')
    .getByRole('link', { name: 'Explore Starter source' })
    .click()
  await expect(page).toHaveURL(/\/docs#generic-starter-source$/)
  await expect(
    page.getByRole('heading', { name: 'Generic Starter source' })
  ).toBeVisible()
  await expect(
    page.getByText('npx create-asyra-app@0.1.0 my-app --package-manager=npm')
  ).toBeVisible()
  await context.close()
})
