import { expect, test } from '@playwright/test'

test('every public hero shares the landing page content edge', async ({
  page
}, testInfo) => {
  const routes = [
    [
      'docs',
      '/docs',
      '.site-frame-header .site-frame-wordmark',
      '.page-hero__copy'
    ],
    [
      'atlas',
      '/atlas',
      '.site-frame-header .site-frame-wordmark',
      '.page-hero__copy'
    ],
    [
      'asyra-design',
      '/asyra-design',
      '.site-frame-header .site-frame-wordmark',
      '.page-hero__copy'
    ],
    [
      'releases',
      '/releases',
      '.site-frame-header .site-frame-wordmark',
      '.page-hero__copy'
    ],
    [
      'roadmap',
      '/roadmap',
      '.site-frame-header .site-frame-wordmark',
      '.page-hero__copy'
    ]
  ] as const

  for (const viewport of [
    { width: 320, height: 844 },
    { width: 390, height: 844 },
    { width: 820, height: 1000 },
    { width: 1440, height: 1000 },
    { width: 2560, height: 1200 }
  ]) {
    await page.setViewportSize(viewport)

    for (const [name, route, wordmarkSelector, heroCopySelector] of routes) {
      await page.goto(route)

      const [wordmark, heroCopy] = await Promise.all([
        page.locator(wordmarkSelector).boundingBox(),
        page.locator(heroCopySelector).boundingBox()
      ])

      expect
        .soft(wordmark, `${name} wordmark must be measurable`)
        .not.toBeNull()
      expect
        .soft(heroCopy, `${name} hero copy must be measurable`)
        .not.toBeNull()
      expect
        .soft(
          heroCopy?.x,
          `${name} hero copy must align with its wordmark at ${viewport.width}px`
        )
        .toBeCloseTo(wordmark?.x ?? 0, 0)
    }

    await page.goto('/docs')
    await page.screenshot({
      animations: 'disabled',
      path: testInfo.outputPath(
        `docs-header-hero-alignment-${viewport.width}.png`
      )
    })
  }
})

test('homepage navigation works with keyboard and no JavaScript at desktop and mobile widths', async ({
  browser
}, testInfo) => {
  for (const width of [320, 1440]) {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width, height: 900 }
    })
    try {
      const page = await context.newPage()
      await page.goto('/')
      if (width < 1024) {
        await page.locator('summary').focus()
        await page.keyboard.press('Enter')
      } else {
        await expect(page.locator('summary')).toBeHidden()
      }
      const nav = page.getByRole('navigation', { name: 'Primary navigation' })
      await expect(
        nav.getByRole('link', { name: 'Docs', exact: true })
      ).toBeVisible()
      expect(
        await nav.evaluate(
          (element) => element.getBoundingClientRect().right <= innerWidth
        )
      ).toBe(true)
      await page.screenshot({
        path: testInfo.outputPath(`home-menu-${width}.png`)
      })
      await nav.getByRole('link', { name: 'Docs', exact: true }).click()
      await expect(page).toHaveURL(/\/docs$/)
    } finally {
      await context.close()
    }
  }
})

test('mobile menu top row aligns with the header controls it replaces', async ({
  page
}) => {
  for (const width of [520, 390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/atlas')

    const wordmark = await page.locator('.site-frame-wordmark').boundingBox()
    const wordmarkTypography = await page
      .locator('.site-frame-wordmark')
      .evaluate((element) => {
        const style = getComputedStyle(element)
        return {
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          letterSpacing: style.letterSpacing,
          lineHeight: style.lineHeight
        }
      })
    const trigger = await page.locator('.navigation-trigger').boundingBox()
    await page.getByRole('button', { name: 'Open navigation' }).click()
    const title = await page.locator('#navigation-title').boundingBox()
    const titleTypography = await page
      .locator('#navigation-title')
      .evaluate((element) => {
        const style = getComputedStyle(element)
        return {
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          letterSpacing: style.letterSpacing,
          lineHeight: style.lineHeight
        }
      })
    const close = await page
      .getByRole('button', { name: 'Close navigation' })
      .boundingBox()

    expect(title?.x).toBeCloseTo(wordmark?.x ?? 0, 0)
    expect((title?.y ?? 0) + (title?.height ?? 0) / 2).toBeCloseTo(
      (wordmark?.y ?? 0) + (wordmark?.height ?? 0) / 2,
      0
    )
    expect((close?.x ?? 0) + (close?.width ?? 0)).toBeCloseTo(
      (trigger?.x ?? 0) + (trigger?.width ?? 0),
      0
    )
    expect(close?.y).toBeCloseTo(trigger?.y ?? 0, 0)
    expect(titleTypography.fontSize).toBe(wordmarkTypography.fontSize)
    expect(
      (close?.x ?? 0) - ((title?.x ?? 0) + (title?.width ?? 0))
    ).toBeGreaterThanOrEqual(12)
  }
})

test('mobile menu presents every destination as one uniform full-height list', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/roadmap')

  const triggerStyle = await page
    .getByRole('button', { name: 'Open navigation' })
    .evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        borderRightWidth: style.borderRightWidth,
        borderTopStyle: style.borderTopStyle,
        borderTopWidth: style.borderTopWidth,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        letterSpacing: style.letterSpacing,
        textTransform: style.textTransform
      }
    })

  await page.getByRole('button', { name: 'Open navigation' }).click()

  const dialog = page.locator('.navigation-dialog')
  const dialogBox = await dialog.boundingBox()
  const mobileNavigation = page.getByRole('navigation', {
    name: 'Mobile navigation'
  })
  const links = mobileNavigation.getByRole('link')

  expect(await links.allTextContents()).toEqual([
    'Docs',
    'Runtime Atlas',
    'Asyra Design',
    'Releases',
    'Roadmap',
    'GitHub'
  ])
  expect(page.locator('.navigation-dialog__source')).toHaveCount(0)
  expect(dialogBox?.x).toBeCloseTo(0, 0)
  expect(dialogBox?.y).toBeCloseTo(0, 0)
  expect(dialogBox?.width).toBeCloseTo(390, 0)
  expect(dialogBox?.height).toBeCloseTo(844, 0)
  expect(
    await links
      .first()
      .evaluate((element) => getComputedStyle(element).borderTopWidth)
  ).toBe('0px')

  const linkStyles = await links.evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element)
      return {
        borderBottomStyle: style.borderBottomStyle,
        borderBottomWidth: style.borderBottomWidth,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        letterSpacing: style.letterSpacing,
        lineHeight: style.lineHeight,
        minHeight: style.minHeight,
        paddingBottom: style.paddingBottom,
        paddingTop: style.paddingTop
      }
    })
  )

  for (const style of linkStyles.slice(1)) {
    expect(style).toEqual(linkStyles[0])
  }

  const closeStyle = await page
    .getByRole('button', { name: 'Close navigation' })
    .evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        borderRightWidth: style.borderRightWidth,
        borderTopStyle: style.borderTopStyle,
        borderTopWidth: style.borderTopWidth,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        letterSpacing: style.letterSpacing,
        textTransform: style.textTransform
      }
    })

  expect(closeStyle).toEqual(triggerStyle)
  expect(triggerStyle.borderTopWidth).toBe('0px')
  expect(triggerStyle.borderRightWidth).toBe('0px')
})
