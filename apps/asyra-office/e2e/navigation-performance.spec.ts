import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'

test.use({
  viewport:
    process.env.OFFICE_NAVIGATION_VIEWPORT === 'panel'
      ? { width: 468, height: 675 }
      : { width: 1800, height: 1200 },
  deviceScaleFactor: 2,
  launchOptions: { args: [] }
})

for (const [view, zoomSteps] of [
  ['overview', 1],
  ['room', 6],
  ['close', 12]
] as const) {
  test(`sustained ${view} navigation records all frame intervals and GPU work`, async ({
    page
  }, info) => {
    test.skip(
      process.env.OFFICE_HARDWARE_REVIEW !== '1',
      'Requires hardware WebGL.'
    )
    await page.addInitScript(() => {
      const state = {
        draws: 0,
        triangles: 0,
        frames: [] as { time: number; draws: number; triangles: number }[],
        active: false
      }
      Object.defineProperty(window, 'navigationProbe', { value: state })
      const p = WebGL2RenderingContext.prototype
      const draw = p.drawElements,
        instanced = p.drawElementsInstanced
      p.drawElements = function (...args) {
        if (state.active) {
          state.draws++
          if (args[0] === this.TRIANGLES) state.triangles += args[1] / 3
        }
        return draw.apply(this, args)
      }
      p.drawElementsInstanced = function (...args) {
        if (state.active) {
          state.draws++
          if (args[0] === this.TRIANGLES)
            state.triangles += (args[1] * args[4]) / 3
        }
        return instanced.apply(this, args)
      }
    })
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/')
    await page
      .getByRole('status', { name: 'Scene status' })
      .filter({ hasText: /^Demo scene ready$/ })
      .waitFor()
    const canvas = page.getByLabel('Office 3D scene').locator('canvas')
    const gpu = await canvas.evaluate((node) => {
      const gl = (node as HTMLCanvasElement).getContext('webgl2')
      if (!gl) throw new Error('Missing WebGL')
      const ext = gl.getExtension('WEBGL_debug_renderer_info')
      if (!ext) throw new Error('Missing renderer information')
      return String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
    })
    expect(gpu).not.toMatch(/swiftshader|llvmpipe|softpipe/i)
    for (let index = 0; index < zoomSteps; index++)
      await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
    await canvas.click({ position: { x: 20, y: 20 } })
    await canvas.screenshot({ path: info.outputPath('navigation-start.png') })
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          let remaining = 30
          const next = () =>
            --remaining === 0 ? resolve() : requestAnimationFrame(next)
          requestAnimationFrame(next)
        })
    )
    const profiler =
      process.env.OFFICE_NAVIGATION_PROFILE === '1'
        ? await page.context().newCDPSession(page)
        : undefined
    if (profiler) {
      await profiler.send('Profiler.enable')
      await profiler.send('Profiler.start')
    }
    const frames: { time: number; draws: number; triangles: number }[] = []
    for (const key of ['d', 'a', 'w', 's']) {
      await page.keyboard.down(key)
      try {
        const segment = await page.evaluate(
          () =>
            new Promise<{ time: number; draws: number; triangles: number }[]>(
              (resolve) => {
                const probe = (
                  window as unknown as {
                    navigationProbe: {
                      active: boolean
                      draws: number
                      triangles: number
                      frames: {
                        time: number
                        draws: number
                        triangles: number
                      }[]
                    }
                  }
                ).navigationProbe
                probe.frames = []
                probe.active = true
                probe.draws = 0
                probe.triangles = 0
                let previous = performance.now()
                const started = previous
                const next = (now: number) => {
                  probe.frames.push({
                    time: now - previous,
                    draws: probe.draws,
                    triangles: probe.triangles
                  })
                  previous = now
                  probe.draws = 0
                  probe.triangles = 0
                  if (now - started >= 1250) {
                    probe.active = false
                    resolve(probe.frames)
                  } else requestAnimationFrame(next)
                }
                requestAnimationFrame(next)
              }
            )
        )
        frames.push(...segment.slice(1))
      } finally {
        await page.keyboard.up(key)
      }
    }
    if (profiler) {
      const { profile } = await profiler.send('Profiler.stop')
      await writeFile(
        info.outputPath('navigation-cpu.json'),
        JSON.stringify(profile)
      )
      await profiler.detach()
    }
    const active = frames
    const percentile = (values: number[], fraction: number) =>
      values.sort((a, b) => a - b)[Math.floor((values.length - 1) * fraction)]
    const summary = {
      gpu,
      url: page.url(),
      viewport: page.viewportSize(),
      deviceScaleFactor: 2,
      frames: active.length,
      elapsedMs: active.reduce((sum, frame) => sum + frame.time, 0),
      meanMs:
        active.reduce((sum, frame) => sum + frame.time, 0) / active.length,
      idleIntervals: active.filter((frame) => frame.draws === 0).length,
      maxMs: Math.max(...active.map((frame) => frame.time)),
      zoomSteps,
      medianMs: percentile(
        active.map((f) => f.time),
        0.5
      ),
      p95Ms: percentile(
        active.map((f) => f.time),
        0.95
      ),
      medianDraws: percentile(
        active.map((f) => f.draws),
        0.5
      ),
      medianTriangles: percentile(
        active.map((f) => f.triangles),
        0.5
      )
    }
    await writeFile(
      info.outputPath('navigation-metrics.json'),
      JSON.stringify({ summary, frames }, null, 2)
    )
    await info.attach('navigation-metrics', {
      body: JSON.stringify(summary),
      contentType: 'application/json'
    })
    expect(active.length).toBeGreaterThan(20)
    expect(errors).toEqual([])
    await canvas.screenshot({ path: info.outputPath('navigation-scene.png') })
  })
}
