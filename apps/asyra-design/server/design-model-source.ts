import { AiModelBackendError } from './ai-model-contract'
import type { AiModelSource } from './ai-model-sources'

/** App-owned admission and cancellation; protocol resources remain with the driver. */
export const createDesignModelSource = (driver: {
  id: string
  request: AiModelSource['request']
  status: AiModelSource['status']
  stop?: () => void | Promise<void>
  dispose?: () => void | Promise<void>
}): AiModelSource => {
  const controllers = new Set<AbortController>()
  const requests = new Set<Promise<unknown>>()
  let disposed = false
  let disposal: Promise<void> | undefined

  return {
    id: driver.id,
    status: driver.status,

    request(input, options) {
      if (disposed) {
        return Promise.reject(
          new AiModelBackendError(
            'AI_MODEL_BACKEND_ABORTED',
            'The AI source is disposed.'
          )
        )
      }

      const controller = new AbortController()

      const abort = () => controller.abort(options.signal?.reason)

      options.signal?.addEventListener('abort', abort, { once: true })
      if (options.signal?.aborted) {
        abort()
      }

      controllers.add(controller)
      const task = (async () => {
        try {
          controller.signal.throwIfAborted()
          const value = await driver.request(input, {
            ...options,
            signal: controller.signal
          })

          controller.signal.throwIfAborted()

          return value
        } catch (error) {
          if (controller.signal.aborted) {
            throw new AiModelBackendError(
              'AI_MODEL_BACKEND_ABORTED',
              'The AI request was aborted.'
            )
          }

          throw error
        } finally {
          options.signal?.removeEventListener('abort', abort)
          controllers.delete(controller)
        }
      })()

      requests.add(task)
      void task.finally(() => requests.delete(task)).catch(() => undefined)

      return task
    },

    dispose() {
      disposal ??= (async () => {
        disposed = true
        for (const controller of controllers) {
          controller.abort()
        }

        await Promise.allSettled([
          ...requests,
          Promise.resolve().then(() => driver.stop?.())
        ])
        await driver.dispose?.()
      })()

      return disposal
    }
  }
}
