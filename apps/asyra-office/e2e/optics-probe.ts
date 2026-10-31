import type { Page } from '@playwright/test'

/** Read actual GPU optical uniforms without changing materials or rendered output. */
export async function installOpticsProbe(page: Page) {
  await page.addInitScript(() => {
    const probe = {
      enabled: false,
      draws: [] as Record<string, unknown>[],
      pixel: [] as number[]
    }
    Object.defineProperty(window, 'opticalDrawProbe', { value: probe })
    const original = WebGL2RenderingContext.prototype.drawElements
    WebGL2RenderingContext.prototype.drawElements = function (...args) {
      if (
        probe.enabled &&
        this.getParameter(this.FRAMEBUFFER_BINDING) === null
      ) {
        const program = this.getParameter(
          this.CURRENT_PROGRAM
        ) as WebGLProgram | null
        if (program) {
          const thickness = this.getUniformLocation(program, 'thickness')
          if (thickness) {
            const draw: Record<string, unknown> = {}
            for (const name of [
              'thickness',
              'transmission',
              'attenuationColor',
              'attenuationDistance',
              'spatialCaptureEnabled',
              'opacity',
              'envMapIntensity'
            ]) {
              const location = this.getUniformLocation(program, name)
              if (location) {
                const value = this.getUniform(program, location)
                draw[name] =
                  value instanceof Float32Array ? Array.from(value) : value
              }
            }
            draw.cull = this.getParameter(this.CULL_FACE_MODE)
            if (probe.draws.length < 100) {
              probe.draws.push(draw)
            }
          }
        }
      }
      const result = original.apply(this, args)
      if (
        probe.enabled &&
        this.getParameter(this.FRAMEBUFFER_BINDING) === null
      ) {
        const pixel = new Uint8Array(4)
        this.readPixels(
          Math.floor(this.drawingBufferWidth / 2),
          Math.floor(this.drawingBufferHeight / 2),
          1,
          1,
          this.RGBA,
          this.UNSIGNED_BYTE,
          pixel
        )
        probe.pixel = Array.from(pixel)
      }
      return result
    }
  })
}
