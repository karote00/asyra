import { expect, test } from '@playwright/test'

const views = ['Front', 'Right', 'Back', 'Top', 'Three-quarter', 'Cap detail']

test('wall review shares one live viewport across views, appearance and LoD', async ({
  page
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/?review=wall')
  await expect(
    page.getByRole('status').filter({ hasText: '3D preview ready' })
  ).toHaveText('3D preview ready')
  const viewport = page.getByLabel('Wall 3D viewport')
  await expect(viewport.locator('canvas')).toHaveCount(1)
  const graphics = await viewport.locator('canvas').evaluate((canvas) => {
    const gl = (canvas as HTMLCanvasElement).getContext('webgl2')
    if (!gl || gl.isContextLost()) {
      throw new Error('Missing live WebGL2 context')
    }
    return {
      version: gl.getParameter(gl.VERSION),
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      pixelRatio: devicePixelRatio
    }
  })
  expect(graphics.version).toContain('WebGL 2')
  expect(graphics.width).toBeGreaterThan(0)
  for (const view of views) {
    const button = page.getByRole('button', { name: view, exact: true })
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByLabel('Mesh detail')).toHaveText(
      'Near - 64 triangles'
    )
    // Wait for the browser's paint opportunity, without a hardware-time threshold.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
    )
    await viewport.screenshot({
      animations: 'disabled',
      path: testInfo.outputPath(
        `${view.toLowerCase().replaceAll(' ', '-')}.png`
      )
    })
  }
  await page.getByLabel('Neutral geometry').check()
  await expect(page.getByLabel('Neutral geometry')).toBeChecked()
  await viewport.screenshot({
    animations: 'disabled',
    path: testInfo.outputPath('neutral-cap-detail.png')
  })
  await page.getByRole('button', { name: 'Distant', exact: true }).click()
  await expect(page.getByLabel('Mesh detail')).toHaveText(
    'Distant - 32 triangles'
  )
  await page.getByRole('button', { name: 'Three-quarter', exact: true }).click()
  await page.getByLabel('Neutral geometry').uncheck()
  await expect(page.getByLabel('Mesh detail')).toHaveText('Near - 64 triangles')
  await page.screenshot({
    animations: 'disabled',
    path: testInfo.outputPath('wall-review.png'),
    fullPage: true
  })
  await testInfo.attach('review-state', {
    body: JSON.stringify({
      url: page.url(),
      viewport: page.viewportSize(),
      graphics,
      asset: 'wall-segment',
      view: 'Three-quarter',
      neutral: false,
      zoom: 1,
      scope: views,
      runtimeParity:
        'Visual-only screenshots; geometry is verified by source-space unit tests.'
    }),
    contentType: 'application/json'
  })
  await page.reload()
  await expect(
    page.getByRole('status').filter({ hasText: '3D preview ready' })
  ).toHaveText('3D preview ready')
  await expect(viewport.locator('canvas')).toHaveCount(1)
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('narrow layout retains all review controls without horizontal overflow', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?review=wall')
  await expect(
    page.getByRole('status').filter({ hasText: '3D preview ready' })
  ).toHaveText('3D preview ready')
  await page.getByRole('button', { name: 'Top', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Top', exact: true })
  ).toHaveAttribute('aria-pressed', 'true')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)
  await page.screenshot({
    animations: 'disabled',
    path: testInfo.outputPath('wall-narrow.png'),
    fullPage: true
  })
})
