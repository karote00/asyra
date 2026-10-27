import { expect, test } from '@playwright/test'

// This review uses the same production scene and GPU path as the visible app.
test.use({
  launchOptions: { args: [] },
  viewport: { width: 1800, height: 1200 },
  deviceScaleFactor: 2
})
test('pantry source review captures appliances, shelf and sink at readable scale', async ({
  page
}, info) => {
  test.skip(
    process.env.OFFICE_HARDWARE_REVIEW !== '1',
    'Requires a hardware WebGL host.'
  )
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    // Browser-generated favicon requests are outside the scene-rendering contract.
    if (message.location().url.endsWith('/favicon.ico')) return
    if (message.type() === 'error')
      errors.push(message.location().url + ': ' + message.text())
  })
  await page.goto('/')
  await page
    .getByRole('status', { name: 'Scene status' })
    .filter({ hasText: /^Demo scene ready$/ })
    .waitFor()
  await page
    .getByRole('button', {
      name: 'Tea point Coffee, chats, ideas',
      exact: true
    })
    .click()
  const canvas = page.getByLabel('Office 3D scene').locator('canvas')
  const graphics = await canvas.evaluate((node) => {
    const gl = (node as HTMLCanvasElement).getContext('webgl2')
    if (!gl || gl.isContextLost()) throw new Error('Missing WebGL2 context')
    const extension = gl.getExtension('WEBGL_debug_renderer_info')
    if (!extension) throw new Error('Cannot verify graphics backend')
    return String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL))
  })
  expect(graphics).not.toMatch(
    /swiftshader|llvmpipe|softpipe|software rasterizer/i
  )
  const settle = () =>
    page.evaluate(
      () =>
        new Promise<void>((done) =>
          requestAnimationFrame(() => requestAnimationFrame(() => done()))
        )
    )
  await settle()
  await canvas.screenshot({ path: info.outputPath('pantry-source-angle.png') })
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('Missing scene bounds')
  // Native-resolution source-angle crop keeps the refrigerator light readable.
  await page.screenshot({
    clip: {
      x: bounds.x + bounds.width * 0.11,
      y: bounds.y + bounds.height * 0.29,
      width: bounds.width * 0.22,
      height: bounds.height * 0.21
    },
    path: info.outputPath('fridge-night-light-close.png')
  })
  await page.screenshot({
    clip: {
      x: bounds.x + bounds.width * 0.32,
      y: bounds.y + bounds.height * 0.18,
      width: bounds.width * 0.42,
      height: bounds.height * 0.32
    },
    path: info.outputPath('shelf-condiments-close.png')
  })
  const x = bounds.x + bounds.width / 2,
    y = bounds.y + bounds.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x - 80, y + 60, { steps: 8 })
  await page.mouse.up()
  await settle()
  await canvas.screenshot({
    path: info.outputPath('pantry-appliance-fronts.png')
  })
  await page
    .getByRole('button', {
      name: 'Tea point Coffee, chats, ideas',
      exact: true
    })
    .click()
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 60, y + 90, { steps: 8 })
  await page.mouse.up()
  await settle()
  await canvas.screenshot({ path: info.outputPath('pantry-worktops.png') })
  await info.attach('review-state', {
    body: JSON.stringify({
      url: page.url(),
      viewport: page.viewportSize(),
      renderer: graphics,
      reference: 'approved-office-reference.jpg - original pantry crop',
      geometry: 'production scene',
      acceptance: 'requires image inspection; capture is not visual acceptance'
    }),
    contentType: 'application/json'
  })
  expect(errors).toEqual([])
})
