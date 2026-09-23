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
  type ItemFieldExtension,
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
  addItem(input?: {
    title?: string
    status?: ItemStatus
    fields?: Record<string, unknown>
  }): string
  editItem(
    id: string,
    update: {
      title?: string
      status?: ItemStatus
      fields?: Record<string, unknown>
    }
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
  readonly itemField?: ItemFieldExtension
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

const assertItemFieldExtension = (itemField?: ItemFieldExtension): void => {
  if (!itemField) {
    return
  }
  if (
    !itemField.key ||
    itemField.key === 'title' ||
    itemField.key === 'status' ||
    !itemField.validate(itemField.defaultValue)
  ) {
    throw new StarterDomainError(
      'item-field-definition',
      'Item field must have a distinct key and a valid default.'
    )
  }
}

const assertItemFields = (
  fields: Record<string, unknown> | undefined,
  itemField: ItemFieldExtension | undefined,
  includeDefault: boolean
): Record<string, string> => {
  if (
    fields !== undefined &&
    (!fields || typeof fields !== 'object' || Array.isArray(fields))
  ) {
    throw new StarterDomainError('item-field', 'Item fields must be an object.')
  }
  const keys = fields ? Object.keys(fields) : []
  if (keys.some((key) => key !== itemField?.key)) {
    throw new StarterDomainError('item-field', 'Unsupported Item field.')
  }
  if (!itemField) {
    return {}
  }
  if (keys.length === 0) {
    return includeDefault ? { [itemField.key]: itemField.defaultValue } : {}
  }
  const value = fields?.[itemField.key]
  if (!itemField.validate(value)) {
    throw new StarterDomainError('item-field', itemField.invalidMessage)
  }
  return { [itemField.key]: value as string }
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
  itemSchema: PropertySchema,
  itemField?: ItemFieldExtension
): void => {
  const propertyKeys = [
    'title',
    'status',
    ...(itemField ? [itemField.key] : [])
  ]
  core.definePropertyComponent({
    type: ITEM_PROPERTY_TYPE,
    defaults: {
      title: 'Untitled item',
      status: 'todo',
      ...(itemField ? { [itemField.key]: itemField.defaultValue } : {})
    },
    persistKeys: propertyKeys,
    valueKeys: propertyKeys
  })
  core.defineComponent({
    type: ITEM_COMPONENT_TYPE,
    idPrefix: 'item',
    namePrefix: 'Item',
    properties: [
      {
        name: ITEM_PROPERTY_NAME,
        type: ITEM_PROPERTY_TYPE,
        alias: propertyKeys,
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

const createItemApi = (
  core: Core,
  itemField?: ItemFieldExtension
): ItemCommandApi => {
  let nextOrdinal = 0
  return {
    addItem(input = {}) {
      const title = assertTitle(input.title ?? 'Untitled item')
      const status = assertStatus(input.status ?? 'todo')
      const fields = assertItemFields(input.fields, itemField, true)
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
          status,
          ...fields
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
      Object.assign(values, assertItemFields(update.fields, itemField, false))
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

let activeCore: Core = core

export const createStarterRuntime = (
  options: StarterRuntimeOptions = {}
): StarterRuntime => {
  const itemField = options.itemField
  assertItemFieldExtension(itemField)
  const core = activeCore
  const storage = options.storage ?? defaultStorage()
  const projection = new StarterProjectionStore(core, itemField)
  const itemApi = createItemApi(core, itemField)
  let disposed = false
  const disposeCallbacks: (() => void)[] = []

  registerStarterSchema(core, createItemPropertySchema(itemField), itemField)
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
        const loaded = readSavedCoreDocument(storage, itemField)
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
      activeCore = await core.resetRuntime()
    }
  }
}
