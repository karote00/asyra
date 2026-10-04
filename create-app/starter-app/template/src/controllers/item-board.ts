import type { Core } from '@asyra/core'
import type { ItemCommandApi } from '../common-apis/items.js'
import type { createHistoryApis } from '../common-apis/history.js'
import type { createStorageApis } from '../common-apis/storage.js'
import type { StarterProjectionStore } from '../derived-state/item-projection.js'
import { UIProperties, type AppStatus } from '../config/ui-properties.js'

export const createBoardController = (
  core: Core,
  itemActions: ItemCommandApi,
  history: ReturnType<typeof createHistoryApis>,
  storage: ReturnType<typeof createStorageApis>,
  projection: StarterProjectionStore
) => {
  let draft: { commit: () => boolean } | null = null
  let committingDraft = false
  let disposed = false
  let requestedSelection: string | null = null
  const status = (value: AppStatus): void => {
    if (!disposed) core.setUIProperty(UIProperties.status, { ...value })
  }
  const reportError = (error: unknown): void =>
    status({
      tone: 'error',
      message: error instanceof Error ? error.message : String(error)
    })
  const prepareAction = (): boolean => {
    if (
      disposed ||
      !core.getUIProperty(UIProperties.ready) ||
      core.getUIProperty(UIProperties.pending)
    )
      return false
    if (committingDraft || !draft) return true
    committingDraft = true
    try {
      return draft.commit()
    } catch (error) {
      reportError(error)
      return false
    } finally {
      committingDraft = false
    }
  }
  const applySelection = (id: string): void => {
    if (disposed) return
    if (!projection.getItem(id)) {
      requestedSelection = id
      return
    }
    requestedSelection = null
    core.setUIProperty(UIProperties.selectedId, id)
  }
  const unsubscribe = projection.subscribeChanges(() => {
    if (requestedSelection && projection.getItem(requestedSelection))
      applySelection(requestedSelection)
  })
  const edit = (command: () => unknown, message: string): boolean => {
    if (!prepareAction()) return false
    try {
      command()
      status({ tone: 'ok', message })
      return true
    } catch (error) {
      reportError(error)
      return false
    }
  }
  const run = async (command: () => Promise<void>): Promise<void> => {
    if (!prepareAction()) return
    core.setUIProperty(UIProperties.pending, true)
    try {
      await command()
    } catch (error) {
      reportError(error)
    } finally {
      if (!disposed) core.setUIProperty(UIProperties.pending, false)
    }
  }
  return {
    status,
    reportError,
    prepareAction,
    registerDraft: (commit: () => boolean): (() => void) => {
      const participant = { commit }
      if (!disposed) draft = participant
      return () => {
        if (draft === participant) draft = null
      }
    },
    selectItem: (id: string): void => {
      if (prepareAction()) applySelection(id)
    },
    addItem: (): void => {
      edit(
        () =>
          applySelection(
            itemActions.addItem({
              title: 'Item ' + (projection.getSnapshot().length + 1),
              status: 'todo'
            })
          ),
        'Added item'
      )
    },
    editItem: (
      id: string,
      update: Parameters<ItemCommandApi['editItem']>[1],
      message: string
    ): boolean => edit(() => itemActions.editItem(id, update), message),
    moveItem: (id: string, offset: { x: number; y: number }): boolean =>
      edit(() => itemActions.moveItem(id, offset), 'Position accepted'),
    undo: (): Promise<void> =>
      run(async () => {
        await history.undo()
        status({ tone: 'ok', message: 'Undo requested' })
      }),
    redo: (): Promise<void> =>
      run(async () => {
        await history.redo()
        status({ tone: 'ok', message: 'Redo requested' })
      }),
    save: (): Promise<void> =>
      run(async () => {
        const result = await storage.save()
        status({ tone: result.ok ? 'ok' : 'error', message: result.message })
      }),
    reload: (): Promise<void> =>
      run(async () => {
        const result = await storage.reload()
        status({ tone: result.ok ? 'ok' : 'error', message: result.message })
      }),
    dispose: (): void => {
      disposed = true
      draft = null
      requestedSelection = null
      unsubscribe()
    }
  }
}
