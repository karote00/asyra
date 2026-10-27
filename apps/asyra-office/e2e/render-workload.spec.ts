import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { installRenderWorkload } from './helpers/render-workload'

interface Workload {
  calls: number
  triangles: number
  uploads: number
  presentations: number
  intervals: number[]
  callsPerAnimationFrame: number[]
  longTasks: number[]
  liveBuffers: number
  bufferBytes: number
  liveTextures: number
}
const percentile = (values: number[], fraction: number) => {
  const sorted = [...values].sort((a, b) => a - b)
  return (
    sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] ??
    0
  )
}
test.use({ launchOptions: { args: [] } })

for (const dpr of [1, 2])
  test.describe(`hardware workload - DPR ${dpr}`, () => {
    test.use({
      viewport: { width: 1440, height: 960 },
      deviceScaleFactor: dpr
    })
    test('profiles the unchanged scene through real navigation', async ({
      page,
      browser
    }, info) => {
      test.skip(
        process.env.OFFICE_HARDWARE_REVIEW !== '1',
        'Requires hardware WebGL.'
      )
      await installRenderWorkload(page)
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto('/')
      await page
        .getByRole('status', { name: 'Scene status' })
        .filter({ hasText: /^Demo scene ready$/ })
        .waitFor()
      const canvas = page.getByLabel('Office 3D scene').locator('canvas')
      const bounds = await canvas.boundingBox()
      if (!bounds) throw new Error('Missing scene viewport')
      const hardware = await canvas.evaluate((node) => {
        const gl = (node as HTMLCanvasElement).getContext('webgl2')
        if (!gl || gl.isContextLost()) throw new Error('Missing WebGL2')
        const ext = gl.getExtension('WEBGL_debug_renderer_info')
        if (!ext) throw new Error('Missing GPU identity')
        return {
          gpu: String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)),
          width: gl.drawingBufferWidth,
          height: gl.drawingBufferHeight,
          dpr: devicePixelRatio
        }
      })
      expect(hardware.gpu).not.toMatch(/swiftshader|llvmpipe|softpipe/i)
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Performance.enable')
      const scenarios = []
      try {
        for (const action of ['idle', 'orbit', 'pan', 'zoom']) {
          await page
            .getByRole('button', { name: 'Overview', exact: true })
            .click()
          await page.waitForTimeout(400)
          await page.mouse.move(
            bounds.x + bounds.width / 2,
            bounds.y + bounds.height / 2
          )
          await page.evaluate(() =>
            (
              window as unknown as { __renderWorkload: { start(): void } }
            ).__renderWorkload.start()
          )
          const start = Date.now()
          let panKey = 'd'
          if (action === 'pan') await page.keyboard.down(panKey)
          if (action === 'orbit') await page.mouse.down()
          let steps = 0
          while (Date.now() - start < 2000) {
            if (action === 'pan') {
              const nextKey =
                Math.floor((Date.now() - start) / 250) % 2 ? 'a' : 'd'
              if (nextKey !== panKey) {
                await page.keyboard.up(panKey)
                panKey = nextKey
                await page.keyboard.down(panKey)
              }
            }
            if (action === 'orbit')
              await page.mouse.move(
                bounds.x + bounds.width / 2 + 55 * Math.sin(steps / 10),
                bounds.y + bounds.height / 2
              )
            if (action === 'zoom')
              await page.mouse.wheel(0, steps % 40 < 20 ? 8 : -8)
            steps++
            await page.waitForTimeout(20)
          }
          const elapsedMs = Date.now() - start
          const measured = await page.evaluate(() =>
            (
              window as unknown as { __renderWorkload: { stop(): Workload } }
            ).__renderWorkload.stop()
          )
          if (action === 'pan') await page.keyboard.up(panKey)
          if (action === 'orbit') await page.mouse.up()
          const metrics = await cdp.send('Performance.getMetrics')
          expect(measured.intervals.length).toBeGreaterThan(1)
          if (action !== 'idle') expect(measured.calls).toBeGreaterThan(0)
          scenarios.push({
            action,
            elapsedMs,
            inputSteps: steps,
            ...measured,
            frameIntervalMs: {
              median: percentile(measured.intervals, 0.5),
              p95: percentile(measured.intervals, 0.95),
              max: Math.max(...measured.intervals)
            },
            drawingAnimationFramesPerSecond:
              (measured.presentations * 1000) / elapsedMs,
            nonemptyFrameCallsMedian: percentile(
              measured.callsPerAnimationFrame.filter(Boolean),
              0.5
            ),
            jsHeapUsedBytes: metrics.metrics.find(
              (m) => m.name === 'JSHeapUsedSize'
            )?.value
          })
          await canvas.screenshot({ path: info.outputPath(`${action}.png`) })
        }
        await page
          .getByRole('button', { name: 'Overview', exact: true })
          .click()
        // Inspect the canonical composition only after sampling so reconstruction
        // does not contaminate the navigation timing or heap measurements.
        const composition = await page.evaluate(async () => {
          const modulePath = '/src/scene/reference-scene.ts'
          const source = await import(modulePath)
          const scene = source.createReferenceScene()
          const meshes = source.buildSpatialMeshes(scene, {})
          const categories = {
            instancedParts: 0,
            transparentParts: 0,
            opaqueMaterialBatches: 0
          }
          const opaqueKeys = new Set<string>()
          for (const mesh of meshes) {
            if (mesh.id.startsWith('instances-')) categories.instancedParts++
            else if (mesh.descriptor.opacity < 1) categories.transparentParts++
            else {
              categories.opaqueMaterialBatches++
              opaqueKeys.add(mesh.id)
            }
          }
          return {
            parts: scene.parts.length,
            descriptors: meshes.length,
            categories,
            distinctOpaqueKeys: opaqueKeys.size
          }
        })
        const report = {
          url: page.url(),
          browser: browser.version(),
          viewport: page.viewportSize(),
          hardware,
          composition,
          scenarios,
          limits:
            'Instrumented WebGL submissions include all passes. rAF cadence is not GPU completion time. Buffer bytes exclude textures, framebuffers and driver allocations; JS heap is not GPU memory. No host-specific timing assertion. Short navigation workload is not agent-capacity certification.'
        }
        await writeFile(
          info.outputPath('render-workload.json'),
          JSON.stringify(report, null, 2)
        )
        await info.attach('render-workload', {
          path: info.outputPath('render-workload.json'),
          contentType: 'application/json'
        })
        expect(errors).toEqual([])
      } finally {
        await cdp.detach()
      }
    })
  })
