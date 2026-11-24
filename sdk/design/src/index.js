import { createRuntime } from './runtime.js'

export function attachDesignTools(canvas, options = {}) {
  return canvas.mount(async (target) => {
    const { destroy, ...tools } = await createRuntime().start(target, options)

    return { tools, destroy }
  })
}
