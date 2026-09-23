import type { CoreRawData } from '@asyra/utils'
import {
  STARTER_STORAGE_SLOT,
  createStarterDocumentWrapper,
  parseStarterDocumentWrapper
} from '../domain/item-domain.js'

export interface StarterStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface SaveResult {
  readonly ok: boolean
  readonly message: string
  readonly savedAt?: string
}

export interface LoadResult {
  readonly ok: boolean
  readonly message: string
}

export const saveCoreDocument = (
  storage: StarterStorage,
  core: CoreRawData
): SaveResult => {
  const wrapper = createStarterDocumentWrapper(core)
  const serialized = JSON.stringify(wrapper)
  storage.setItem(STARTER_STORAGE_SLOT, serialized)
  return {
    ok: true,
    message: `Saved at ${wrapper.savedAt}`,
    savedAt: wrapper.savedAt
  }
}

export const readSavedCoreDocument = (
  storage: StarterStorage
): { readonly core: CoreRawData; readonly savedAt: string } | LoadResult => {
  const serialized = storage.getItem(STARTER_STORAGE_SLOT)
  if (serialized === null) {
    return { ok: false, message: 'Nothing saved yet.' }
  }

  const wrapper = parseStarterDocumentWrapper(serialized)
  return {
    core: wrapper.core,
    savedAt: wrapper.savedAt
  }
}
