import core, {
  type Core,
  createOverlayLayerRegistration,
  defineFeature,
  redoWithRenderPolicy,
  runTransaction,
  subscribeToFileLoadComplete,
  undoWithRenderPolicy,
  type OverlayCanvas,
  type RenderLayerRegistration
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
  type ItemProjection,
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
  readonly storageStatus: string | null
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

const STARTER_RENDER_LAYER_NAME = 'starter-app.items'
const STARTER_RENDER_FRAME_KEY = 'starter-app.render-frame'
const STARTER_ITEM_RENDER_X = 24
const STARTER_ITEM_RENDER_Y = 24
const STARTER_ITEM_RENDER_WIDTH = 160
const STARTER_ITEM_RENDER_HEIGHT = 72
const STARTER_ITEM_RENDER_STEP = 88

export interface StarterItemRenderBounds {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export const getStarterItemRenderBounds = (
  index: number
): StarterItemRenderBounds => ({
  x: STARTER_ITEM_RENDER_X,
  y: STARTER_ITEM_RENDER_Y + index * STARTER_ITEM_RENDER_STEP,
  width: STARTER_ITEM_RENDER_WIDTH,
  height: STARTER_ITEM_RENDER_HEIGHT
})

const ITEM_RENDER_COLORS: Record<ItemStatus, number> = {
  todo: 0xf7f2e8,
  doing: 0xd6ebff,
  done: 0xdff5df
}

class StarterItemRenderLayer {
  readonly registration: RenderLayerRegistration
  private pendingItems: readonly ItemProjection[] | null = null
  private disposed = false

  constructor(private readonly invalidate: () => void) {
    this.registration = createOverlayLayerRegistration({
      name: STARTER_RENDER_LAYER_NAME,
      zIndex: 0,
      update: (canvas) => this.flush(canvas)
    })
  }

  submit(items: readonly ItemProjection[]): void {
    if (this.disposed) {
      return
    }
    this.pendingItems = items
    this.invalidate()
  }

  dispose(): void {
    if (this.disposed) {
      return
    }
    this.disposed = true
    this.pendingItems = null
  }

  private flush(canvas: OverlayCanvas): boolean {
    const items = this.pendingItems
    if (!items || this.disposed) {
      return false
    }
    canvas.clear()
    items.forEach((item, index) => {
      const { x, y, width, height } = getStarterItemRenderBounds(index)
      canvas.polygon(
        [
          { x, y },
          { x: x + width, y },
          { x: x + width, y: y + height },
          { x, y: y + height }
        ],
        ITEM_RENDER_COLORS[item.status],
        { color: 0x27312f, width: 2 }
      )
    })
    this.pendingItems = null
    return true
  }
}

const registerStarterRenderLayer = (
  core: Core,
  projection: StarterProjectionStore
): (() => void) => {
  let renderRevision = 0
  core.defineSystemProperty(STARTER_RENDER_FRAME_KEY, renderRevision, {
    runtime: true,
    silent: true
  })
  const layer = new StarterItemRenderLayer(() => {
    renderRevision += 1
    core.setSystemProperty(STARTER_RENDER_FRAME_KEY, renderRevision)
  })
  core.registerRenderLayer(layer.registration)
  const unsubscribe = projection.subscribe((items) => layer.submit(items))
  layer.submit(projection.getSnapshot())
  return () => {
    unsubscribe()
    core.unregisterRenderLayer(STARTER_RENDER_LAYER_NAME)
    layer.dispose()
  }
}

const registerStarterSharedDataChannels = (core: Core): (() => void) => {
  const ownedChannels: string[] = []
  ;[SharedDataChannelNames.SCENE_TREE, SharedDataChannelNames.PROPS].forEach(
    (name) => {
      if (core.hasSharedDataChannel(name)) {
        return
      }
      core.registerSharedDataChannel(name, core.createLocalSharedDataChannel())
      ownedChannels.push(name)
    }
  )
  return () => {
    ;[...ownedChannels].reverse().forEach((name) => {
      core.unregisterSharedDataChannel(name)
    })
  }
}

const createItemRenderStrategy = () => {
  return (
    graphic: {
      clear(): void
      rect(x: number, y: number, width: number, height: number): void
      fill(color: number): void
      stroke(options: { color: number; width: number }): void
    },
    data: { status?: unknown }
  ): void => {
    const status = isItemStatus(data.status) ? data.status : 'todo'
    graphic.clear()
    graphic.rect(0, 0, STARTER_ITEM_RENDER_WIDTH, STARTER_ITEM_RENDER_HEIGHT)
    graphic.fill(ITEM_RENDER_COLORS[status])
    graphic.stroke({ color: 0x27312f, width: 2 })
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

const createItemApi = (core: Core): ItemCommandApi => {
  let nextOrdinal = 0
  return {
    addItem(input = {}) {
      const title = assertTitle(input.title ?? 'Untitled item')
      const status = assertStatus(input.status ?? 'todo')
      return runActionTransaction(() => {
        const ordinal = nextOrdinal
        nextOrdinal += 1
        const elementId = id(ITEM_COMPONENT_TYPE)
        const propertyId = id(IDTypes.PROPS)
        const element: ElementRawData = {
          id: elementId,
          type: ITEM_COMPONENT_TYPE,
          name: title,
          parentId: core.getCurrentWorkspaceId(),
          visible: true,
          lock: false,
          x: 24,
          y: 24 + ordinal * 44,
          width: 160,
          height: 72,
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
  }
}

const createFeatureApi = (
  api: ItemCommandApi,
  _onCommandComplete: () => void
): ItemCommandApi => {
  const commandApi: ItemCommandApi = {
    addItem(input) {
      return api.addItem(input)
    },
    editItem(id, update) {
      return api.editItem(id, update)
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

const defaultStorage = (): StarterStorage => {
  try {
    return window.localStorage
  } catch (error) {
    return unavailableStorage(storageFailureMessage(error))
  }
}

export const createStarterRuntime = (
  options: StarterRuntimeOptions = {}
): StarterRuntime => {
  const storage = options.storage ?? defaultStorage()
  const projection = new StarterProjectionStore(core)
  const itemApi = createItemApi(core)
  let disposed = false
  const disposeCallbacks: (() => void)[] = []

  registerStarterSchema(core, createItemPropertySchema())
  core.setLoadSource({
    name: 'starter-empty-document',
    load: async () => createEmptyCoreDocument()
  })
  disposeCallbacks.push(registerStarterSharedDataChannels(core))
  applyPreset(core, {
    profile: PresetProfiles['2D'],
    defaults: []
  })
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
  let projectionFlushTimer: ReturnType<typeof setTimeout> | undefined
  const pendingPublications: Parameters<
    StarterProjectionStore['refreshFromPublication']
  >[0][] = []
  disposeCallbacks.push(
    core.subscribeToSharedPublication((publication) => {
      pendingPublications.push(publication)
      if (projectionFlushTimer !== undefined) {
        return
      }
      projectionFlushTimer = setTimeout(() => {
        projectionFlushTimer = undefined
        projection.refreshFromPublications(pendingPublications.splice(0))
      }, 0)
    })
  )
  disposeCallbacks.push(() => {
    if (projectionFlushTimer !== undefined) {
      clearTimeout(projectionFlushTimer)
      projectionFlushTimer = undefined
    }
    pendingPublications.length = 0
  })
  const fileLoadSubscription = subscribeToFileLoadComplete(() => {
    options.onLoadAccepted?.()
    refreshProjection()
  })
  disposeCallbacks.push(() => fileLoadSubscription.unsubscribe())
  disposeCallbacks.push(registerStarterRenderLayer(core, projection))

  return {
    core,
    feature,
    projection,
    storageStatus: storage.unavailableReason ?? null,
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
    },
    async redo() {
      if (disposed) {
        return
      }
      await redoWithRenderPolicy({ mode: 'atomic' })
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
      await core.resetRuntime()
    }
  }
}
