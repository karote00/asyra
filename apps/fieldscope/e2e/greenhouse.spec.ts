import { expect, test } from '@playwright/test'

test('real greenhouse route exposes the structure, section, inner aisle and responsive controls', async ({
  page
}, testInfo) => {
  await testInfo.attach('review-context', {
    body: JSON.stringify({
      origin: testInfo.project.use.baseURL,
      desktop: [1440, 1100],
      mobile: [390, 844],
      deviceScaleFactor: 1,
      scenario: 'fixed-four-bay-greenhouse',
      dimensions: [28, 50, 5],
      margin: 0.35,
      cropGeometry: 'not configured',
      views: ['overview', 'front', 'top', 'inside']
    }),
    contentType: 'application/json'
  })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(1)
  await expect(
    page.getByRole('heading', { name: '每棟橫向配置' })
  ).toBeVisible()
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  await page.screenshot({
    path: testInfo.outputPath('overview.png'),
    fullPage: true,
    animations: 'disabled'
  })
  await page.getByLabel('塑膠覆膜', { exact: true }).uncheck()
  await expect(page.getByLabel('塑膠覆膜', { exact: true })).not.toBeChecked()
  await page.getByRole('button', { name: '端面', exact: true }).click()
  await expect(
    page.getByRole('button', { name: '端面', exact: true })
  ).toHaveAttribute('aria-pressed', 'true')
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  await page.screenshot({
    path: testInfo.outputPath('front-structure.png'),
    fullPage: true,
    animations: 'disabled'
  })
  await page.getByRole('button', { name: '俯視', exact: true }).click()
  await expect(
    page.getByRole('button', { name: '俯視', exact: true })
  ).toHaveAttribute('aria-pressed', 'true')
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  await page.screenshot({
    path: testInfo.outputPath('top-layout.png'),
    fullPage: true,
    animations: 'disabled'
  })
  await page.getByRole('button', { name: '走道內部', exact: true }).click()
  await expect(
    page.getByRole('button', { name: '走道內部', exact: true })
  ).toHaveAttribute('aria-pressed', 'true')
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  await page.screenshot({
    path: testInfo.outputPath('inside-structure.png'),
    fullPage: true,
    animations: 'disabled'
  })
  const scene = page.getByTestId('scene')
  await scene.focus()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('+')
  await page.getByRole('button', { name: '透視', exact: true }).click()
  await page.getByLabel('塑膠覆膜', { exact: true }).check()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: '展開圖層面板', exact: true }).click()
  await expect(page.getByLabel('完整鋼架', { exact: true })).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true)
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  await page.screenshot({
    path: testInfo.outputPath('mobile.png'),
    fullPage: true,
    animations: 'disabled'
  })
  expect(errors).toEqual([])
})

test('film is visible by default and Shift drag, Command 1 and Command 0 operate the real canvas', async ({
  page
}, testInfo) => {
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  await expect(page.getByLabel('覆膜不透明度', { exact: true })).toHaveValue(
    '60'
  )
  const settle = () =>
    page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
    )
  await settle()
  const canvas = page.locator('canvas')
  const covered = await canvas.screenshot()
  await page.getByLabel('塑膠覆膜', { exact: true }).uncheck()
  await settle()
  expect((await canvas.screenshot()).equals(covered)).toBe(false)
  await page.getByLabel('塑膠覆膜', { exact: true }).check()
  const scene = page.getByTestId('scene')
  const bounds = await scene.boundingBox()
  if (!bounds) throw new Error('Missing canvas bounds')
  await settle()
  const beforePan = await canvas.screenshot()
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2
  )
  await page.keyboard.down('Shift')
  await page.mouse.down()
  await page.mouse.move(
    bounds.x + bounds.width / 2 + 100,
    bounds.y + bounds.height / 2 + 40,
    { steps: 8 }
  )
  await page.mouse.up()
  await page.keyboard.up('Shift')
  await settle()
  expect((await canvas.screenshot()).equals(beforePan)).toBe(false)
  await expect(page.getByTestId('zoom-percent')).toHaveText('100%')
  await page.keyboard.down('Alt')
  await page.mouse.wheel(0, -300)
  await page.keyboard.up('Alt')
  await expect(page.getByTestId('zoom-percent')).not.toHaveText('100%')
  await page.keyboard.press('Meta+0')
  await expect(page.getByTestId('zoom-percent')).toHaveText('100%')
  await page.keyboard.press('Meta+1')
  await settle()
  await page.screenshot({
    path: testInfo.outputPath('film-fit.png'),
    fullPage: true,
    animations: 'disabled'
  })
  // The fit shortcut must match its button route, including after a displaced view.
  const fitted = await canvas.screenshot()
  await page.keyboard.down('Alt')
  await page.mouse.wheel(0, -300)
  await page.keyboard.up('Alt')
  await page.getByTitle('適合畫面（⌘1）').click()
  // Compare both routes with the same canvas focus outline.
  await scene.focus()
  await page.keyboard.press('Shift')
  await settle()
  const refitted = await canvas.screenshot()
  // Re-solving the perspective fit can change subpixel edge rounding, not the view.
  const difference = await page.evaluate(
    async ({ first, second }) => {
      const pixels = async (data: string) => {
        const image = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${data}`)).blob()
        )
        const buffer = document.createElement('canvas')
        buffer.width = image.width
        buffer.height = image.height
        const context = buffer.getContext('2d')
        if (!context) throw new Error('Missing comparison canvas')
        context.drawImage(image, 0, 0)
        image.close()
        return context.getImageData(0, 0, buffer.width, buffer.height).data
      }
      const a = await pixels(first),
        b = await pixels(second)
      if (a.length !== b.length)
        throw new Error('Screenshot dimensions changed')
      let delta = 0
      for (let i = 0; i < a.length; i++) delta += Math.abs(a[i] - b[i])
      return delta / a.length
    },
    { first: fitted.toString('base64'), second: refitted.toString('base64') }
  )
  expect(difference).toBeLessThan(0.1)
  await page.keyboard.press('Meta+0')
  await expect(page.getByTestId('zoom-percent')).toHaveText('100%')
})

test('spring clips are inspectable at the real upright connection', async ({
  page
}, testInfo) => {
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  await page.getByLabel('塑膠覆膜', { exact: true }).uncheck()
  await page.getByRole('button', { name: '夾具近看', exact: true }).click()
  await expect(
    page.getByRole('button', { name: '夾具近看', exact: true })
  ).toHaveAttribute('aria-pressed', 'true')
  const settle = () =>
    page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
    )
  await settle()
  await page.screenshot({
    path: testInfo.outputPath('joint.png'),
    fullPage: true
  })
  const withClip = await page.locator('canvas').screenshot()
  await page.getByLabel('跨接彈簧夾', { exact: true }).uncheck()
  await settle()
  expect((await page.locator('canvas').screenshot()).equals(withClip)).toBe(
    false
  )
  await page.getByLabel('跨接彈簧夾', { exact: true }).check()
  await page.getByLabel('栽培鋼管', { exact: true }).uncheck()
  await settle()
  await page.screenshot({
    path: testInfo.outputPath('wire-profile.png'),
    fullPage: true
  })
  await testInfo.attach('review-context', {
    body: JSON.stringify({
      origin: testInfo.project.use.baseURL,
      viewport: [1440, 1100],
      camera: 'joint',
      zoom: '100%',
      supports: 1992,
      clips: 2256,
      embeddedDepth: 0.15,
      aboveGround: 3.15,
      wireDiameterAssumption: 0.0025
    }),
    contentType: 'application/json'
  })
})

test('trellis net and top cable ties are visible and independently controlled', async ({
  page
}, testInfo) => {
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  await page.getByLabel('塑膠覆膜', { exact: true }).uncheck()
  await page.getByRole('button', { name: '夾具近看', exact: true }).click()
  const canvas = page.locator('canvas')
  await canvas.hover()
  await page.keyboard.down('Alt')
  await page.mouse.wheel(0, 900)
  await page.keyboard.up('Alt')
  const settle = () =>
    page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
    )
  await settle()
  const withNet = await canvas.screenshot()
  await page.screenshot({
    path: testInfo.outputPath('net-top.png'),
    fullPage: true
  })
  await page.getByLabel('攀爬拉網', { exact: true }).uncheck()
  await settle()
  expect((await canvas.screenshot()).equals(withNet)).toBe(false)
  await page.getByLabel('攀爬拉網', { exact: true }).check()
  const withTies = await canvas.screenshot()
  await page.getByLabel('網頂束帶', { exact: true }).uncheck()
  await settle()
  expect((await canvas.screenshot()).equals(withTies)).toBe(false)
  await page.getByLabel('網頂束帶', { exact: true }).check()
  await page.getByRole('button', { name: '走道內部', exact: true }).click()
  await settle()
  await page.screenshot({
    path: testInfo.outputPath('net-rows.png'),
    fullPage: true
  })
  await testInfo.attach('net-dimensions', {
    body: JSON.stringify({
      baseURL: testInfo.project.use.baseURL,
      bottom: 0.45,
      top: 3,
      spacing: 0.6,
      mesh: 0.15,
      rows: 24,
      ties: 1992
    }),
    contentType: 'application/json'
  })
})

test('joint inspection reaches 10000 percent and restores the baseline', async ({
  page
}, testInfo) => {
  await page.goto('/')
  await expect(page.getByText('空間模型已就緒')).toBeVisible()
  await page.getByRole('button', { name: '夾具近看', exact: true }).click()
  const scene = page.getByTestId('scene')
  await scene.hover()
  await page.keyboard.down('Alt')
  await page.mouse.wheel(0, -Math.log(10) * 1000)
  await page.keyboard.up('Alt')
  await expect(page.getByTestId('zoom-percent')).toHaveText('1000%')
  await page.screenshot({
    path: testInfo.outputPath('joint-1000.png'),
    fullPage: true
  })
  await page.keyboard.down('Alt')
  await page.mouse.wheel(0, -10000)
  await page.keyboard.up('Alt')
  await expect(page.getByTestId('zoom-percent')).toHaveText('10000%')
  await page.keyboard.down('Alt')
  await page.mouse.wheel(0, -500)
  await page.keyboard.up('Alt')
  await expect(page.getByTestId('zoom-percent')).toHaveText('10000%')
  await page.screenshot({
    path: testInfo.outputPath('joint-10000.png'),
    fullPage: true
  })
  await scene.focus()
  await page.keyboard.press('Meta+0')
  await expect(page.getByTestId('zoom-percent')).toHaveText('100%')
})
