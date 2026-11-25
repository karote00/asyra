import type { WorkspaceTools } from './editor-types.js'

type Session = Pick<WorkspaceTools, 'save' | 'common'>

export function openLocalDocument(storage: Storage, key: string) {
  return {
    read(): unknown {
      const saved = storage.getItem(key)

      return saved === null ? undefined : JSON.parse(saved)
    },

    clear: () => storage.removeItem(key),

    // Coalesce commits made in a single editing turn. Idle boards do no work.
    bind(session: Session, lifetime: AbortSignal) {
      let pending = false

      const flush = () => {
        if (!pending) {
          return
        }

        pending = false
        void session
          .save()
          .then((snapshot) => {
            storage.setItem(key, JSON.stringify(snapshot))
          })
          .catch((error) => globalThis.reportError(error))
      }

      const stop = session.common.transaction.subscribeToTransactionStatus(
        (event) => {
          if (event.status !== 'committed' || !event.changeCount || pending) {
            return
          }

          pending = true
          globalThis.queueMicrotask(flush)
        }
      )

      lifetime.addEventListener(
        'abort',
        () => {
          stop()
          flush()
        },
        { once: true }
      )
    }
  }
}
