import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { installOpticsProbe } from './optics-probe'

test.use({
  launchOptions: { args: [] },
  viewport: { width: 1800, height: 1200 },
  deviceScaleFactor: 2
})
test('discussion reference review exposes wall artwork, tabletop and low storage', async ({
  page
}, info) => {
  test.skip(
    process.env.OFFICE_HARDWARE_REVIEW !== '1',
    'Requires hardware WebGL.'
  )
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      !message.location().url.endsWith('/favicon.ico')
    )
      errors.push(message.text() + ' ' + message.location().url)
  })
  await page.goto('/')
  await page
    .getByRole('status', { name: 'Scene status' })
    .filter({ hasText: /^Demo scene ready$/ })
    .waitFor()
  await page
    .getByLabel('Office 3D scene')
    .locator('canvas')
    .screenshot({
      path: info.outputPath('discussion-initial-overview.png')
    })
  await page
    .getByRole('button', {
      name: 'Meeting corner Small room, big ideas',
      exact: true
    })
    .click()
  const canvas = page.getByLabel('Office 3D scene').locator('canvas')
  const graphics = await canvas.evaluate((node) => {
    const gl = (node as HTMLCanvasElement).getContext('webgl2')
    if (!gl || gl.isContextLost()) throw new Error('Missing WebGL2 context')
    const extension = gl.getExtension('WEBGL_debug_renderer_info')
    if (!extension) throw new Error('Cannot verify GPU')
    return String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL))
  })
  expect(graphics).not.toMatch(
    /swiftshader|llvmpipe|softpipe|software rasterizer/i
  )
  const settle = () =>
    page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
    )
  await settle()
  await canvas.screenshot({
    path: info.outputPath('discussion-source-angle.png')
  })
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('Missing canvas bounds')
  // Native live-browser crop keeps the poster readable without enlarging pixels.
  await page.screenshot({
    path: info.outputPath('discussion-poster-detail.png'),
    clip: {
      x: bounds.x + bounds.width * 0.15,
      y: bounds.y + bounds.height * 0.02,
      width: bounds.width * 0.21,
      height: bounds.height * 0.37
    }
  })
  const x = bounds.x + bounds.width / 2,
    y = bounds.y + bounds.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 80, y + 240, { steps: 12 })
  await page.mouse.up()
  await settle()
  await canvas.screenshot({ path: info.outputPath('discussion-overhead.png') })
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
  await settle()
  await canvas.screenshot({
    path: info.outputPath('discussion-storage-detail.png')
  })
  await page.screenshot({
    path: info.outputPath('discussion-left-tree-detail.png'),
    clip: {
      x: bounds.x + bounds.width * 0.1,
      y: bounds.y + bounds.height * 0.44,
      width: bounds.width * 0.21,
      height: bounds.height * 0.38
    }
  })
  // The elevated view exposes the rear note beyond the pantry divider.
  await page.screenshot({
    path: info.outputPath('discussion-note-detail.png'),
    clip: {
      x: bounds.x + bounds.width * 0.56,
      y: bounds.y + bounds.height * 0.055,
      width: bounds.width * 0.36,
      height: bounds.height * 0.37
    }
  })
  await page
    .getByRole('button', {
      name: 'Meeting corner Small room, big ideas',
      exact: true
    })
    .click()
  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
  await settle()
  await canvas.screenshot({
    path: info.outputPath('discussion-tableware-detail.png')
  })
  await page.screenshot({
    path: info.outputPath('discussion-tableware-crop.png'),
    clip: {
      x: bounds.x + bounds.width * 0.28,
      y: bounds.y + bounds.height * 0.26,
      width: bounds.width * 0.33,
      height: bounds.height * 0.21
    }
  })
  expect(errors).toEqual([])
  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
  await settle()
  await canvas.screenshot({
    path: info.outputPath('discussion-tableware-microscope.png')
  })
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x, y + 140, { steps: 12 })
  await page.mouse.up()
  await settle()
  await canvas.screenshot({
    path: info.outputPath('discussion-sugar-overhead.png')
  })
  await info.attach('review-state', {
    body: JSON.stringify({
      url: page.url(),
      viewport: page.viewportSize(),
      deviceScaleFactor: 2,
      graphics,
      controls: 'Meeting corner preset, normal orbit and zoom',
      reference: 'approved-office-reference.jpg crop [438,66,770,330]',
      scope:
        'discussion furnishings only; source-space contacts have separate unit tests',
      acceptance: 'requires enlarged screenshot inspection'
    }),
    contentType: 'application/json'
  })
})

test('discussion conifer microscope retains production geometry across views', async ({
  page
}, info) => {
  test.skip(
    process.env.OFFICE_HARDWARE_REVIEW !== '1',
    'Requires hardware WebGL.'
  )
  await page.goto('/?review=discussion-conifer')
  await page
    .getByRole('status')
    .filter({ hasText: '3D preview ready' })
    .waitFor()
  for (const view of ['Front', 'Right', 'Three-quarter', 'Cap detail']) {
    await page.getByRole('button', { name: view, exact: true }).click()
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
    )
    await page.getByLabel('Asset 3D viewport').screenshot({
      path: info.outputPath(
        'conifer-' + view.toLowerCase().replace(' ', '-') + '.png'
      )
    })
  }
  await expect(page.getByRole('alert')).toHaveCount(0)
  await info.attach('review-state', {
    body: JSON.stringify({
      url: page.url(),
      viewport: page.viewportSize(),
      deviceScaleFactor: 2,
      source:
        'Exact floor-sized discussionTree production factory with independent branch reach',
      reference: 'discussion-conifer-owner-reference.png',
      acceptance: 'Requires image inspection'
    }),
    contentType: 'application/json'
  })
})

test('iced Americano microscope shows the same production transparent regions', async ({
  page
}, info) => {
  test.skip(
    process.env.OFFICE_HARDWARE_REVIEW !== '1',
    'Requires hardware WebGL.'
  )
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      !message.location().url.endsWith('/favicon.ico')
    )
      errors.push(message.text() + ' ' + message.location().url)
  })
  await installOpticsProbe(page)
  await page.goto('/?review=iced-americano')
  await page
    .getByRole('status')
    .filter({ hasText: '3D preview ready' })
    .waitFor()
  for (const view of ['Front', 'Right', 'Top', 'Three-quarter', 'Cap detail']) {
    await page.evaluate((enabled) => {
      const probe = (
        window as unknown as {
          opticalDrawProbe: { enabled: boolean; draws: unknown[] }
        }
      ).opticalDrawProbe
      probe.enabled = enabled
      probe.draws = []
    }, view === 'Top')
    await page.getByRole('button', { name: view, exact: true }).click()
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
    )
    if (view === 'Top') {
      const draws = await page.evaluate(
        () =>
          (
            window as unknown as {
              opticalDrawProbe: { draws: Record<string, unknown>[] }
            }
          ).opticalDrawProbe.draws
      )
      const pixel = await page.evaluate(
        () =>
          (window as unknown as { opticalDrawProbe: { pixel: number[] } })
            .opticalDrawProbe.pixel
      )
      // The top camera projects the open centre of the liquid to the canvas centre.
      // Source tests separately establish its upward winding and ice clearance.
      const path = info.outputPath('optical-gpu-uniforms.json')
      await writeFile(path, JSON.stringify({ draws, pixel }, null, 2))
      await info.attach('optical-gpu-uniforms', {
        path,
        contentType: 'application/json'
      })
      expect(
        pixel[0],
        'coffee must retain brown absorption, not a white reflection disc'
      ).toBeGreaterThan(pixel[2] * 1.3)
      expect(
        draws.some(
          (draw) =>
            Math.abs(Number(draw.thickness) - 0.075) < 1e-6 &&
            draw.transmission === 1 &&
            draw.spatialCaptureEnabled === true
        )
      ).toBe(true)
    }
    await page.getByLabel('Asset 3D viewport').screenshot({
      path: info.outputPath(
        'coffee-' + view.toLowerCase().replace(' ', '-') + '.png'
      )
    })
  }
  expect(errors).toEqual([])
  await info.attach('review-state', {
    body: JSON.stringify({
      url: page.url(),
      viewport: page.viewportSize(),
      deviceScaleFactor: 2,
      factory: 'americanoGlass',
      scope:
        'production glass, liquid and ice; ordered screen-space physical transmission'
    }),
    contentType: 'application/json'
  })
})

test('sugar ceramic surfaces remain smooth around the spoon notch and leaning lid', async ({
  page
}, info) => {
  test.skip(
    process.env.OFFICE_HARDWARE_REVIEW !== '1',
    'Requires hardware WebGL.'
  )
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/?review=sugar-jar')
  const viewport = page.getByLabel('Asset 3D viewport')
  await viewport.locator('canvas').waitFor()
  const renderer = await viewport.locator('canvas').evaluate((node) => {
    const gl = (node as HTMLCanvasElement).getContext('webgl2')
    if (!gl || gl.isContextLost()) throw new Error('Missing WebGL')
    const debug = gl.getExtension('WEBGL_debug_renderer_info')
    if (!debug) throw new Error('Missing renderer information')
    return String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
  })
  expect(renderer).not.toMatch(/swiftshader|llvmpipe|softpipe/i)
  for (const view of ['Front', 'Right', 'Top', 'Three-quarter', 'Cap detail']) {
    await page.getByRole('button', { name: view, exact: true }).click()
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
    )
    await viewport.screenshot({
      path: info.outputPath(
        'sugar-' + view.toLowerCase().replace(' ', '-') + '.png'
      )
    })
  }
  expect(errors).toEqual([])
  await info.attach('review-state', {
    body: JSON.stringify({
      url: page.url(),
      viewport: page.viewportSize(),
      deviceScaleFactor: 2,
      renderer,
      factory: 'sugarJar',
      scope:
        'production geometry, authored normals, source materials and batching'
    }),
    contentType: 'application/json'
  })
})
