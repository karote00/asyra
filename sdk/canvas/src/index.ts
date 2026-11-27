export interface ToolSession<T> {
  tools: T
  destroy(): void | Promise<void>
}

export interface CanvasBinding {
  readonly target: HTMLCanvasElement
  mount<T>(
    setup: (
      target: HTMLCanvasElement
    ) => ToolSession<T> | Promise<ToolSession<T>>
  ): Promise<T>
  destroy(): Promise<void>
}

const targets = new WeakSet<HTMLCanvasElement>()

export function createCanvas(target: HTMLCanvasElement): CanvasBinding {
  if (!globalThis.HTMLCanvasElement || !(target instanceof HTMLCanvasElement)) {
    throw new TypeError('Expected an HTMLCanvasElement from this window')
  }

  if (targets.has(target)) {
    throw new Error('Canvas already has an active binding')
  }

  targets.add(target)
  let session: Promise<ToolSession<unknown>> | undefined
  let closing: Promise<void> | undefined

  return {
    target,

    async mount<T>(
      setup: (
        target: HTMLCanvasElement
      ) => ToolSession<T> | Promise<ToolSession<T>>
    ) {
      if (closing || session) {
        throw new Error('Canvas is closed or already mounted')
      }

      const pending = Promise.resolve().then(() => setup(target))

      session = pending
      try {
        const mounted = await pending

        if (closing) {
          throw new Error('Canvas closed during mount')
        }

        return mounted.tools
      } catch (error) {
        if (!closing) {
          session = undefined
        }

        throw error
      }
    },

    destroy() {
      closing ??= Promise.resolve(session)
        .then(
          (mounted) => mounted?.destroy(),
          () => undefined
        )
        .finally(() => targets.delete(target))

      return closing
    }
  }
}
