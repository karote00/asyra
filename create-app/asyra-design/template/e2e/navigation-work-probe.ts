import type { Page } from '@playwright/test'

export interface NavigationGpuWork {
  draws: number
  vertexUploadBytes: number
  uniformMatrices: number
}

declare global {
  interface Window {
    navigationGpuWork: NavigationGpuWork
  }
}

/** Test-only WebGL boundary counters; they never decide product output. */
export const installNavigationWorkProbe = (page: Page) =>
  page.addInitScript(() => {
    window.navigationGpuWork = {
      draws: 0,
      vertexUploadBytes: 0,
      uniformMatrices: 0
    }
    for (const prototype of [
      WebGLRenderingContext.prototype,
      WebGL2RenderingContext.prototype
    ]) {
      for (const name of [
        'drawArrays',
        'drawElements',
        'bufferData',
        'bufferSubData',
        'uniformMatrix3fv'
      ]) {
        const original = Object.getOwnPropertyDescriptor(prototype, name)?.value
        if (typeof original !== 'function') continue
        Object.defineProperty(prototype, name, {
          configurable: true,
          writable: true,
          value: function (...args: unknown[]) {
            const work = window.navigationGpuWork
            if (name.startsWith('draw')) work.draws++
            if (name === 'uniformMatrix3fv') work.uniformMatrices++
            if (
              (name === 'bufferData' || name === 'bufferSubData') &&
              (args[0] === 34962 || args[0] === 34963)
            ) {
              const data = args[name === 'bufferData' ? 1 : 2]
              if (typeof data === 'number') work.vertexUploadBytes += data
              else if (ArrayBuffer.isView(data) || data instanceof ArrayBuffer)
                work.vertexUploadBytes += data.byteLength
            }
            return original.apply(this, args)
          }
        })
      }
    }
  })
