import { expect, test } from '@playwright/test'

for (const width of [1440, 820, 390, 320]) {
  test(`factory film is readable and stays idle at ${width}px`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    const requests: string[] = []
    page.on('request', (request) => {
      if (request.url().endsWith('/motion/action-flow.mp4'))
        requests.push(request.url())
    })
    await page.goto('/')
    const film = page.locator('video')
    await film.scrollIntoViewIfNeeded()
    // Observe a quiet idle window before checking requests and capturing native controls.
    await page.waitForTimeout(2000)
    await expect(film).toHaveAttribute('preload', 'none')
    await expect(
      page.getByText(
        'Each package has a clear responsibility. Together, they carry one action from intent to result.'
      )
    ).toBeVisible()
    expect(
      await film.evaluate((video: HTMLVideoElement) => ({
        paused: video.paused,
        currentTime: video.currentTime,
        autoPlay: video.autoplay,
        loop: video.loop,
        controls: video.controls
      }))
    ).toEqual({
      paused: true,
      currentTime: 0,
      autoPlay: false,
      loop: false,
      controls: true
    })
    const bounds = await film.boundingBox()
    if (!bounds) throw new Error('The action film must have visible bounds')
    expect(bounds.x).toBeGreaterThanOrEqual(0)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
    expect(bounds.width).toBeLessThanOrEqual(1720)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(width)
    await film
      .locator('..')
      .screenshot({ path: testInfo.outputPath(`action-film-${width}.png`) })
    expect(requests).toEqual([])
  })
}

test('native keyboard controls play, pause, and finish the approved 16-second film', async ({
  page
}, testInfo) => {
  test.setTimeout(45_000)
  await page.goto('/')
  const film = page.locator('video')
  await film.scrollIntoViewIfNeeded()
  await film.focus()
  await page.keyboard.press('Space')
  await expect
    .poll(() => film.evaluate((video: HTMLVideoElement) => video.currentTime))
    .toBeGreaterThan(0)
  expect(
    await film.evaluate((video: HTMLVideoElement) => video.duration)
  ).toBeCloseTo(16, 1)
  expect(
    await film.evaluate((video: HTMLVideoElement) => [
      video.videoWidth,
      video.videoHeight
    ])
  ).toEqual([2560, 1600])
  await page.keyboard.press('Space')
  await expect
    .poll(() => film.evaluate((video: HTMLVideoElement) => video.paused))
    .toBe(true)
  for (const [name, time] of [
    ['press', 2],
    ['insert', 5.7],
    ['fasten', 9.2],
    ['scan', 13],
    ['finish', 15.8]
  ] as const) {
    await film.evaluate(
      (video: HTMLVideoElement, frameTime) =>
        new Promise<void>((resolve) => {
          video.addEventListener('seeked', () => resolve(), { once: true })
          video.currentTime = frameTime
        }),
      time
    )
    await film.screenshot({
      path: testInfo.outputPath(`action-film-${name}.png`)
    })
  }
  await film.evaluate((video: HTMLVideoElement) => {
    video.currentTime = 0
  })
  await film.focus()
  await page.keyboard.press('Space')
  await expect
    .poll(() => film.evaluate((video: HTMLVideoElement) => video.ended), {
      timeout: 22_000
    })
    .toBe(true)
  expect(
    await film.evaluate((video: HTMLVideoElement) => video.error)
  ).toBeNull()
})

for (const javaScriptEnabled of [true, false]) {
  test(`reduced-motion reading remains complete with JavaScript ${javaScriptEnabled}`, async ({
    browser
  }, testInfo) => {
    const context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      javaScriptEnabled,
      reducedMotion: 'reduce',
      viewport: { width: 390, height: 844 }
    })
    try {
      const page = await context.newPage()
      await page.goto('/')
      const figure = page.locator('figure[aria-labelledby="action-film-title"]')
      await expect(figure).toContainText(
        'Each package has a clear responsibility. Together, they carry one action from intent to result.'
      )
      await expect(figure.locator('figcaption > p')).toHaveCount(1)
      await figure.scrollIntoViewIfNeeded()
      expect(
        await figure
          .locator('video')
          .evaluate((video: HTMLVideoElement) => video.paused)
      ).toBe(true)
      await figure.screenshot({
        path: testInfo.outputPath('action-film-reduced-motion.png')
      })
    } finally {
      await context.close()
    }
  })
}

for (const width of [3840, 2560, 1920, 1440, 1280, 1279, 1024, 820, 390, 320]) {
  test(`factory film fills the shared content width at ${width}px`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1200 })
    await page.goto('/')
    const figure = page.locator('figure[aria-labelledby="action-film-title"]')
    await figure.scrollIntoViewIfNeeded()
    const layout = await figure.evaluate((element) => {
      const heading = document.querySelector('.feature-evidence__heading')
      const caption = element.querySelector('figcaption')
      const video = element.querySelector('video')
      if (!heading || !caption || !video)
        throw new Error('Missing film layout owner')
      const frame = element.getBoundingClientRect()
      const reference = heading.getBoundingClientRect()
      const text = caption.getBoundingClientRect()
      const media = video.getBoundingClientRect()
      return {
        leftGap: Math.abs(frame.left - reference.left),
        rightGap: Math.abs(frame.right - reference.right),
        columnGap: media.left - text.right,
        rowGap: media.top - text.bottom,
        textWidth: text.width,
        videoWidth: media.width,
        frameWidth: frame.width,
        aspectRatio: media.width / media.height,
        sourcePixelsPerCssPixel: video.width / media.width
      }
    })
    expect(layout.leftGap).toBeLessThanOrEqual(1)
    expect(layout.rightGap).toBeLessThanOrEqual(1)
    expect(layout.aspectRatio).toBeCloseTo(1.6, 2)
    expect(layout.sourcePixelsPerCssPixel).toBeGreaterThanOrEqual(2)
    if (width >= 1280) {
      expect(layout.columnGap).toBeGreaterThanOrEqual(24)
      expect(layout.videoWidth / layout.frameWidth).toBeGreaterThanOrEqual(0.68)
      expect(layout.textWidth).toBeGreaterThanOrEqual(240)
    } else {
      expect(layout.rowGap).toBeGreaterThanOrEqual(24)
      expect(layout.videoWidth).toBeCloseTo(layout.frameWidth, 0)
    }
    // Let the native controls finish their initial visual transition.
    await page.waitForTimeout(2000)
    await figure.screenshot({
      path: testInfo.outputPath(`action-film-layout-${width}.png`)
    })
  })
}

test('HD film supplies native detail on a wide Retina display', async ({
  browser
}, testInfo) => {
  const context = await browser.newContext({
    baseURL: testInfo.project.use.baseURL,
    viewport: { width: 2560, height: 1440 },
    deviceScaleFactor: 2
  })
  try {
    const page = await context.newPage()
    await page.goto('/')
    const film = page.locator('video')
    await film.scrollIntoViewIfNeeded()
    await film.focus()
    await page.keyboard.press('Space')
    await expect
      .poll(() => film.evaluate((video: HTMLVideoElement) => video.currentTime))
      .toBeGreaterThan(0)
    await page.keyboard.press('Space')
    await expect
      .poll(() => film.evaluate((video: HTMLVideoElement) => video.paused))
      .toBe(true)
    const density = await film.evaluate((video: HTMLVideoElement) => ({
      sourceWidth: video.videoWidth,
      sourceHeight: video.videoHeight,
      requiredWidth:
        video.getBoundingClientRect().width * window.devicePixelRatio
    }))
    expect(density.sourceWidth).toBe(2560)
    expect(density.sourceHeight).toBe(1600)
    expect(density.sourceWidth).toBeGreaterThanOrEqual(density.requiredWidth)
    for (const [name, time] of [
      ['press', 2],
      ['fasten', 9.2]
    ] as const) {
      await film.evaluate(
        (video: HTMLVideoElement, frameTime) =>
          new Promise<void>((resolve) => {
            video.addEventListener('seeked', () => resolve(), { once: true })
            video.currentTime = frameTime
          }),
        time
      )
      await film.screenshot({
        path: testInfo.outputPath(`action-film-retina-${name}.png`)
      })
    }
  } finally {
    await context.close()
  }
})

for (const width of [1440, 820, 767, 576, 390, 320]) {
  test(`code card shares adjacent content insets at ${width}px`, async ({
    page
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/')
    const card = page.locator('.code-proof')
    await card.scrollIntoViewIfNeeded()
    const layout = await card.evaluate((element) => {
      const body = element.parentElement
      const heading = document.querySelector('.feature-evidence__heading')
      const film = document.querySelector(
        'figure[aria-labelledby="action-film-title"]'
      )
      const runtime = document.querySelector('.runtime-proof')
      if (!body || !heading || !film || !runtime)
        throw new Error('Missing code card layout owner')
      const rect = element.getBoundingClientRect()
      const references = [body, heading, film].map((node) =>
        node.getBoundingClientRect()
      )
      return {
        leftGaps: references.map((reference) =>
          Math.abs(rect.left - reference.left)
        ),
        rightGap: Math.abs(rect.right - body.getBoundingClientRect().right),
        stacked:
          getComputedStyle(body).gridTemplateColumns.split(' ').length === 1,
        runtimeLeftGap: Math.abs(
          rect.left - runtime.getBoundingClientRect().left
        ),
        overflow: document.documentElement.scrollWidth - window.innerWidth
      }
    })
    for (const gap of layout.leftGaps) expect(gap).toBeLessThanOrEqual(1)
    if (layout.stacked) {
      expect(layout.rightGap).toBeLessThanOrEqual(1)
      expect(layout.runtimeLeftGap).toBeLessThanOrEqual(1)
    }
    expect(layout.overflow).toBeLessThanOrEqual(1)
    await page.locator('.feature-evidence__body').screenshot({
      path: testInfo.outputPath(`code-card-insets-${width}.png`)
    })
  })
}
