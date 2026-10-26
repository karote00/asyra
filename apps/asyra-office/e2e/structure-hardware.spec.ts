import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test.use({ launchOptions: { args: [] } })
test('structural review records the actual hardware renderer and enlarged walls', async ({
  page
}, info) => {
  test.skip(
    process.env.OFFICE_HARDWARE_REVIEW !== '1',
    'Run explicitly on a hardware WebGL host.'
  )
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await page
    .getByRole('status', { name: 'Scene status' })
    .filter({ hasText: /^Demo scene ready$/ })
    .waitFor()
  await expect(page.getByLabel('Composition stage')).toHaveText(
    'Structure review - one floor'
  )
  const canvas = page.getByLabel('Office 3D scene').locator('canvas')
  const graphics = await canvas.evaluate((node) => {
    const gl = (node as HTMLCanvasElement).getContext('webgl2')
    if (!gl || gl.isContextLost())
      throw new Error('Missing live WebGL2 context')
    const extension = gl.getExtension('WEBGL_debug_renderer_info')
    if (!extension) throw new Error('Cannot verify the graphics backend')
    return {
      renderer: String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)),
      vendor: String(gl.getParameter(extension.UNMASKED_VENDOR_WEBGL)),
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      pixelRatio: devicePixelRatio
    }
  })
  expect(graphics.renderer).not.toMatch(
    /swiftshader|llvmpipe|softpipe|software rasterizer/i
  )
  await page.getByRole('button', { name: 'Overview', exact: true }).click()
  await page.evaluate(
    () =>
      new Promise<void>((done) =>
        requestAnimationFrame(() => requestAnimationFrame(() => done()))
      )
  )
  await canvas.screenshot({
    path: info.outputPath('structure-hardware-overview.png')
  })
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
  await page.evaluate(
    () =>
      new Promise<void>((done) =>
        requestAnimationFrame(() => requestAnimationFrame(() => done()))
      )
  )
  await canvas.screenshot({
    path: info.outputPath('structure-hardware-close.png')
  })
  const metadata = info.outputPath('hardware-review-state.json')
  await writeFile(
    metadata,
    JSON.stringify(
      {
        url: page.url(),
        viewport: page.viewportSize(),
        graphics,
        closeView: 'Overview followed by two normal Zoom in actions',
        scene: 'Production structural composition; lighting unchanged',
        acceptance:
          'Backend and runtime checks only; inspect both images before any visual acceptance'
      },
      null,
      2
    ) + '\n'
  )
  await info.attach('hardware-review-state', {
    path: metadata,
    contentType: 'application/json'
  })
  expect(errors).toEqual([])
})
