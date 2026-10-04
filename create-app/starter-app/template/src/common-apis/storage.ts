import type { Core } from '@asyra/core'
import type { ItemFieldExtension } from '../domain/item-domain.js'
import {
  readSavedCoreDocument,
  saveCoreDocument,
  type StarterStorage,
  type LoadResult,
  type SaveResult
} from '../persistence/storage.js'

const storageFailureMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const unavailableStorage = (reason: string): StarterStorage => ({
  unavailableReason: reason,
  getItem() {
    throw new Error(reason)
  },
  setItem() {
    throw new Error(reason)
  }
})

export const defaultStorage = (): StarterStorage => {
  try {
    return window.localStorage
  } catch (error) {
    return unavailableStorage(storageFailureMessage(error))
  }
}

export const createStorageApis = (
  core: Core,
  storage: StarterStorage,
  itemField?: ItemFieldExtension
) => ({
  save: async (): Promise<SaveResult> =>
    saveCoreDocument(storage, await core.save()),
  reload: async (): Promise<LoadResult> => {
    try {
      const loaded = readSavedCoreDocument(storage, itemField)
      if ('ok' in loaded) return loaded
      const diagnostics = core.preflightLoad(loaded.core)
      if (diagnostics.length > 0)
        return {
          ok: false,
          message: diagnostics
            .map((item) => `${item.scope}:${item.path} ${item.message}`)
            .join('; ')
        }
      core.load(loaded.core)
      return { ok: true, message: `Reloaded ${loaded.savedAt}` }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : String(error)
      }
    }
  }
})
