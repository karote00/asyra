import core, {
  type Core,
  defineFeature,
  redoWithRenderPolicy,
  runTransaction,
  subscribeToFileLoadComplete,
  undoWithRenderPolicy
} from '@asyra/core'
import type { CoreRawData } from '@asyra/utils'
import {
  IDTypes,
  SharedDataChannelNames,
  id,
  type ElementRawData,
  type PropertyComponentRawData,
  type PropertySchema
} from '@asyra/utils'
import { applyPreset, PresetProfiles } from '@asyra/preset'
import {
  ITEM_COMPONENT_TYPE,
  ITEM_PROPERTY_NAME,
  ITEM_PROPERTY_TYPE,
  STARTER_FEATURE_NAME,
  StarterDomainError,
  createItemPropertySchema,
  isItemStatus,
  normalizeItemTitle,
  type ItemStatus
} from '../domain/item-domain.js'
import { StarterProjectionStore } from './projection-store.js'
import {
  readSavedCoreDocument,
  saveCoreDocument,
  type LoadResult,
  type SaveResult,
  type StarterStorage
} from './storage.js'

interface ItemCommandApi extends Record<string, unknown> {
  addItem(input?: { title?: string; status?: ItemStatus }): string
  editItem(
    id: string,
    update: { title?: string; status?: ItemStatus }
  ): readonly string[]
}

export interface StarterRuntime {
  readonly core: Core
  readonly feature: ItemCommandApi
  readonly projection: StarterProjectionStore
  start(
    container: HTMLElement,
    options?: { width?: number; height?: number }
  ): Promise<void>
  undo(): Promise<void>
  redo(): Promise<void>
  save(): Promise<SaveResult>
  reload(): Promise<LoadResult>
  dispose(): Promise<void>
}

export interface StarterRuntimeOptions {
  readonly storage?: StarterStorage
  readonly onLoadAccepted?: () => void
}

const assertStatus = (status: unknown): ItemStatus => {
  if (!isItemStatus(status)) {
    throw new StarterDomainError(
      'item-status',
      `Unsupported item status: ${String(status)}`
    )
  }
  return status
}

const assertTitle = (title: unknown): string => {
  if (typeof title !== 'string') {
    throw new StarterDomainError('item-title', 'Item title must be a string.')
  }
  const normalized = normalizeItemTitle(title)
  if (normalized.length === 0) {
    throw new StarterDomainError('item-title', 'Item title is required.')
  }
  return normalized
}

const runActionTransaction = <T>(action: () => T): T =>
  runTransaction(action, { failureKind: 'handler-error' })

const createItemRenderStrategy = () => {
  return (
    graphic: {
      clear(): void
      rect(x: number, y: number, width: number, height: number): void
      fill(color: number): void
      stroke(options: { color: number; width: number }): void
      x: number
      y: number
    },
    data: { id: string; status?: unknown }
  ): void => {
    const offset = Number.parseInt(data.id.replace(/\D/g, '').slice(-2), 10)
    const index = Number.isFinite(offset) ? offset : 0
    const status = isItemStatus(data.status) ? data.status : 'todo'
    const colors: Record<ItemStatus, number> = {
      todo: 0xf7f2e8,
      doing: 0xd6ebff,
      done: 0xdff5df
    }
    graphic.clear()
    graphic.rect(0, 0, 160, 72)
    graphic.fill(colors[status])
    graphic.stroke({ color: 0x27312f, width: 2 })
    graphic.x = 24 + (index % 3) * 184
    graphic.y = 24 + Math.floor(index / 3) * 96
  }
}

const registerStarterSchema = (
  core: Core,
  itemSchema: PropertySchema
): void => {
  core.definePropertyComponent({
    type: ITEM_PROPERTY_TYPE,
    defaults: {
      title: 'Untitled item',
      status: 'todo'
    },
    persistKeys: ['title', 'status'],
    valueKeys: ['title', 'status']
  })
  core.defineComponent({
    type: ITEM_COMPONENT_TYPE,
    idPrefix: 'item',
    namePrefix: 'Item',
    properties: [
      {
        name: ITEM_PROPERTY_NAME,
        type: ITEM_PROPERTY_TYPE,
        alias: ['title', 'status'],
        schema: itemSchema
      }
    ],
    renderStrategy: createItemRenderStrategy()
  })
}

const createEmptyCoreDocument = (): CoreRawData =>
  ({
    version: '1.0.0',
    sceneTree: {
      workspace: '',
      workspaceList: [],
      elements: {}
    },
    props: {}
  }) as unknown as CoreRawData

const createItemApi = (core: Core): ItemCommandApi => ({
  addItem(input = {}) {
    const title = assertTitle(input.title ?? 'Untitled item')
    const status = assertStatus(input.status ?? 'todo')
    return runActionTransaction(() => {
      const elementId = id(ITEM_COMPONENT_TYPE)
      const propertyId = id(IDTypes.PROPS)
      const element: ElementRawData = {
        id: elementId,
        type: ITEM_COMPONENT_TYPE,
        name: title,
        parentId: core.getCurrentWorkspaceId(),
        visible: true,
        lock: false,
        props: {
          [ITEM_PROPERTY_NAME]: propertyId
        }
      } as unknown as ElementRawData
      const property: PropertyComponentRawData = {
        id: propertyId,
        type: ITEM_PROPERTY_TYPE,
        title,
        status
      } as PropertyComponentRawData
      const [createdId] = core.createElementsInParentFromCanonicalData(
        [element],
        [property],
        core.getCurrentWorkspaceId()
      )
      if (!createdId) {
        throw new Error('Item creation did not return an element id.')
      }
      return createdId
    })
  },
  editItem(id, update) {
    const values: Record<string, string> = {}
    if (update.title !== undefined) {
      values.title = assertTitle(update.title)
    }
    if (update.status !== undefined) {
      values.status = assertStatus(update.status)
    }
    if (Object.keys(values).length === 0) {
      return Object.freeze([])
    }

    return runActionTransaction(() =>
      core.updateElementProperties([
        {
          elementId: id,
          values
        }
      ])
    )
  }
})

const createFeatureApi = (
  api: ItemCommandApi,
  onCommandComplete: () => void
): ItemCommandApi => {
  const commandApi: ItemCommandApi = {
    addItem(input) {
      const id = api.addItem(input)
      onCommandComplete()
      return id
    },
    editItem(id, update) {
      const updated = api.editItem(id, update)
      onCommandComplete()
      return updated
    }
  }
  const registration = defineFeature<ItemCommandApi>(
    STARTER_FEATURE_NAME,
    undefined,
    {
      api: commandApi,
      priority: 10,
      exclusive: true
    }
  )

  return Object.assign(registration.api, {
    dispose: registration.dispose
  }) as ItemCommandApi & { dispose: () => boolean }
}

const defaultStorage = (): StarterStorage => window.localStorage

export const createStarterRuntime = (
  options: StarterRuntimeOptions = {}
): StarterRuntime => {
  const storage = options.storage ?? defaultStorage()
  const projection = new StarterProjectionStore(core)
  const itemApi = createItemApi(core)
  let disposed = false
  const disposeCallbacks: (() => void)[] = []

  registerStarterSchema(core, createItemPropertySchema())
  core.registerSharedDataChannel(
    SharedDataChannelNames.SCENE_TREE,
    core.createLocalSharedDataChannel()
  )
  core.registerSharedDataChannel(
    SharedDataChannelNames.PROPS,
    core.createLocalSharedDataChannel()
  )
  core.setLoadSource({
    name: 'starter-empty-document',
    load: async () => createEmptyCoreDocument()
  })
  applyPreset(core, { profile: PresetProfiles['2D'], defaults: [] })
  core.registerRuntimeCleanup('starter-app-projection', () => {
    projection.dispose()
  })

  const refreshProjection = (): void => projection.refresh()
  const feature = createFeatureApi(
    itemApi,
    refreshProjection
  ) as ItemCommandApi & {
    dispose?: () => boolean
  }
  disposeCallbacks.push(core.subscribeToSharedPublication(refreshProjection))
  const fileLoadSubscription = subscribeToFileLoadComplete(() => {
    options.onLoadAccepted?.()
    refreshProjection()
  })
  disposeCallbacks.push(() => fileLoadSubscription.unsubscribe())

  return {
    core,
    feature,
    projection,
    async start(container, startOptions = {}) {
      if (disposed) {
        throw new Error('Starter runtime is disposed.')
      }
      await core.start(container, {
        backgroundColor: 0xf3f6f2,
        width: startOptions.width ?? 800,
        height: startOptions.height ?? 480
      })
      refreshProjection()
    },
    async undo() {
      if (disposed) {
        return
      }
      await undoWithRenderPolicy({ mode: 'atomic' })
      refreshProjection()
    },
    async redo() {
      if (disposed) {
        return
      }
      await redoWithRenderPolicy({ mode: 'atomic' })
      refreshProjection()
    },
    async save() {
      if (disposed) {
        return { ok: false, message: 'Runtime is disposed.' }
      }
      return saveCoreDocument(storage, await core.save())
    },
    async reload() {
      if (disposed) {
        return { ok: false, message: 'Runtime is disposed.' }
      }
      try {
        const loaded = readSavedCoreDocument(storage)
        if ('ok' in loaded) {
          return loaded
        }
        const diagnostics = core.preflightLoad(loaded.core)
        if (diagnostics.length > 0) {
          return {
            ok: false,
            message: diagnostics
              .map((item) => `${item.scope}:${item.path} ${item.message}`)
              .join('; ')
          }
        }
        core.load(loaded.core)
        return { ok: true, message: `Reloaded ${loaded.savedAt}` }
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : String(error)
        }
      }
    },
    async dispose() {
      if (disposed) {
        return
      }
      disposed = true
      disposeCallbacks.splice(0).forEach((dispose) => dispose())
      projection.dispose()
      feature.dispose?.()
      await core.destroy()
    }
  }
}
