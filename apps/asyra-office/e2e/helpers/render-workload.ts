import type { Page } from '@playwright/test'

/** Test-only WebGL accounting; never exposes or replaces the product renderer. */
export async function installRenderWorkload(page: Page) {
  await page.addInitScript(() => {
    const gl = WebGL2RenderingContext.prototype
    const buffers = new Map<WebGLBuffer, number>()
    const textures = new Set<WebGLTexture>()
    let calls = 0,
      triangles = 0,
      uploads = 0,
      presentations = 0
    let lastCalls = 0,
      previous = 0
    const intervals: number[] = []
    const perFrame: number[] = []
    const longTasks: number[] = []
    let measuring = false
    const observer = new PerformanceObserver((list) => {
      if (measuring)
        for (const entry of list.getEntries()) longTasks.push(entry.duration)
    })
    observer.observe({ type: 'longtask', buffered: false })
    const drawElements = gl.drawElements
    gl.drawElements = function (mode, count, type, offset) {
      calls++
      if (mode === this.TRIANGLES) triangles += count / 3
      return drawElements.call(this, mode, count, type, offset)
    }
    const drawArrays = gl.drawArrays
    gl.drawArrays = function (mode, first, count) {
      calls++
      if (mode === this.TRIANGLES) triangles += count / 3
      return drawArrays.call(this, mode, first, count)
    }
    const elementsInstanced = gl.drawElementsInstanced
    gl.drawElementsInstanced = function (mode, count, type, offset, instances) {
      calls++
      if (mode === this.TRIANGLES) triangles += (count * instances) / 3
      return elementsInstanced.call(this, mode, count, type, offset, instances)
    }
    const arraysInstanced = gl.drawArraysInstanced
    gl.drawArraysInstanced = function (mode, first, count, instances) {
      calls++
      if (mode === this.TRIANGLES) triangles += (count * instances) / 3
      return arraysInstanced.call(this, mode, first, count, instances)
    }
    const createBuffer = gl.createBuffer
    gl.createBuffer = function () {
      const buffer = createBuffer.call(this)
      if (buffer) buffers.set(buffer, 0)
      return buffer
    }
    const deleteBuffer = gl.deleteBuffer
    gl.deleteBuffer = function (buffer) {
      if (buffer) buffers.delete(buffer)
      return deleteBuffer.call(this, buffer)
    }
    const bufferData = gl.bufferData
    gl.bufferData = function (
      this: WebGL2RenderingContext,
      ...args: Parameters<typeof bufferData>
    ) {
      const result = Reflect.apply(bufferData, this, args)
      const target = args[0]
      const binding = new Map<number, number>([
        [this.ARRAY_BUFFER, this.ARRAY_BUFFER_BINDING],
        [this.ELEMENT_ARRAY_BUFFER, this.ELEMENT_ARRAY_BUFFER_BINDING],
        [this.COPY_READ_BUFFER, this.COPY_READ_BUFFER_BINDING],
        [this.COPY_WRITE_BUFFER, this.COPY_WRITE_BUFFER_BINDING],
        [this.PIXEL_PACK_BUFFER, this.PIXEL_PACK_BUFFER_BINDING],
        [this.PIXEL_UNPACK_BUFFER, this.PIXEL_UNPACK_BUFFER_BINDING],
        [
          this.TRANSFORM_FEEDBACK_BUFFER,
          this.TRANSFORM_FEEDBACK_BUFFER_BINDING
        ],
        [this.UNIFORM_BUFFER, this.UNIFORM_BUFFER_BINDING]
      ]).get(target)
      if (binding !== undefined) {
        const buffer = this.getParameter(binding) as WebGLBuffer | null
        if (buffer)
          buffers.set(
            buffer,
            this.getBufferParameter(target, this.BUFFER_SIZE) as number
          )
      }
      uploads++
      return result
    } as typeof bufferData
    const createTexture = gl.createTexture
    gl.createTexture = function () {
      const texture = createTexture.call(this)
      if (texture) textures.add(texture)
      return texture
    }
    const deleteTexture = gl.deleteTexture
    gl.deleteTexture = function (texture) {
      if (texture) textures.delete(texture)
      return deleteTexture.call(this, texture)
    }
    const tick = (now: number) => {
      if (measuring && previous) {
        intervals.push(now - previous)
        perFrame.push(calls - lastCalls)
        if (calls !== lastCalls) presentations++
      }
      lastCalls = calls
      previous = now
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    const snapshot = () => ({
      calls,
      triangles,
      uploads,
      presentations,
      intervals: [...intervals],
      callsPerAnimationFrame: [...perFrame],
      longTasks: [...longTasks],
      liveBuffers: buffers.size,
      bufferBytes: [...buffers.values()].reduce((a, b) => a + b, 0),
      liveTextures: textures.size
    })
    Object.assign(window, {
      __renderWorkload: {
        start() {
          calls = triangles = uploads = presentations = lastCalls = previous = 0
          intervals.length = perFrame.length = longTasks.length = 0
          measuring = true
        },
        stop() {
          measuring = false
          return snapshot()
        }
      }
    })
  })
}
