import { createRuntime } from './runtime.js'

const targets = new WeakSet()

export async function createCanvas(target, options = {}) {
  if (
    !globalThis.HTMLCanvasElement ||
    !(target instanceof globalThis.HTMLCanvasElement)
  ) {
    throw new TypeError('Expected an HTMLCanvasElement from this window')
  }

  if (targets.has(target)) {
    throw new Error('Canvas already has an active editor')
  }

  targets.add(target)
  try {
    const session = await createRuntime().start(target, options)
    let closing

    return {
      ...session,

      destroy() {
        closing ??= session.destroy().finally(() => targets.delete(target))

        return closing
      }
    }
  } catch (error) {
    targets.delete(target)
    throw error
  }
}
