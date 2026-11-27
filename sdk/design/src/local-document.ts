import type { WorkspaceTools } from './editor-types.js'

type Session = Pick<WorkspaceTools, 'save' | 'common'>

export async function openLocalDocument(key: string) {
  const { createDocumentStore } = await import('./document-store.js')
  const store = await createDocumentStore(key)
  let writes = Promise.resolve()
  let legacy: string | null = null

  return {
    async read(): Promise<unknown> {
      const saved = await store.load()

      if (saved !== null) {
        return saved
      }

      try {
        legacy = globalThis.localStorage.getItem(key)
      } catch (error) {
        if (!(
          error instanceof DOMException && error.name === 'SecurityError'
        )) {
          throw error
        }
      }

      return legacy === null ? undefined : JSON.parse(legacy)
    },

    // Only migrate a legacy snapshot after the workspace successfully loads it.
    async migrate(session: Session) {
      if (legacy !== null) {
        if (!(await store.importIfAbsent(await session.save()))) {
          throw new Error(
            'Board changed during migration. Reopen it to load the stored document.'
          )
        }

        if (globalThis.localStorage.getItem(key) === legacy) {
          globalThis.localStorage.removeItem(key)
        }

        legacy = null
      }
    },

    async clear() {
      await writes
      await store.clear()
    },

    async close() {
      try {
        await writes
      } finally {
        store.close()
      }
    },

    bind(session: Session, lifetime: AbortSignal) {
      let pending = false

      const flush = () => {
        if (!pending) {
          return
        }

        pending = false
        const snapshot = session.save()

        writes = snapshot.then((value) => store.save(value))
        void writes.catch((error) => globalThis.reportError(error))
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
