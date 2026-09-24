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
  resize(width: number, height: number): void
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
export interface StarterItemRenderBounds {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export const getStarterItemRenderBounds = (
  index: number,
  viewportWidth = 800
): StarterItemRenderBounds => {
  const narrow = viewportWidth < 760
  const width = narrow ? 150 : 218
  const height = narrow ? 94 : 124
  if (viewportWidth < 340) {
    return {
      x: 24,
      y: 86 + index * 126,
      width: Math.min(width, viewportWidth - 48),
      height
    }
  }

  const position = index % 3
  const cycle = Math.floor(index / 3)
  const xFractions = narrow ? [0.05, 0.94, 0.19] : [0.1, 0.55, 0.34]
  const yOffsets = narrow ? [90, 140, 255] : [135, 110, 315]
  const cycleHeight = narrow ? 330 : 430
  return {
    x: Math.round((viewportWidth - width) * (xFractions[position] ?? 0)),
    y: (yOffsets[position] ?? 90) + cycle * cycleHeight,
    width,
    height
  }
}

export const getStarterRenderHeight = (
  itemCount: number,
  viewportWidth = 800
): number => {
  const last =
    itemCount > 0
      ? getStarterItemRenderBounds(itemCount - 1, viewportWidth)
      : null
  return Math.max(
    viewportWidth < 760 ? 390 : 510,
    last ? last.y + last.height + 46 : 0
  )
}

const ITEM_RENDER_COLORS: Record<ItemStatus, number> = {
  todo: 0xffffff,
  doing: 0xffffff,
  done: 0xffffff
}

const ITEM_STATUS_COLORS: Record<ItemStatus, number> = {
  todo: 0x9bad9f,
  doing: 0xd49a55,
  done: 0x2c8073
}

class StarterItemRenderLayer {
  readonly registration: RenderLayerRegistration
  private pendingItems: readonly ItemProjection[] | null = null
  private currentItems: readonly ItemProjection[] = []
  private viewportWidth = 800
  private viewportHeight = 510
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
    this.currentItems = items
    this.pendingItems = items
    this.invalidate()
  }

  resize(width: number, height: number): void {
    if (this.viewportWidth === width && this.viewportHeight === height) return
    this.viewportWidth = width
    this.viewportHeight = height
    this.submit(this.currentItems)
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
    for (let x = 28; x < this.viewportWidth; x += 28) {
      canvas.line(
        { x, y: 0 },
        { x, y: this.viewportHeight },
        { color: 0xeef2ed, width: 1 }
      )
    }
    for (let y = 28; y < this.viewportHeight; y += 28) {
      canvas.line(
        { x: 0, y },
        { x: this.viewportWidth, y },
        { color: 0xeef2ed, width: 1 }
      )
    }
    items.forEach((item, index) => {
      const { x, y, width, height } = getStarterItemRenderBounds(
        index,
        this.viewportWidth
      )
      canvas.polygon(
        [
          { x, y },
          { x: x + width, y },
          { x: x + width, y: y + height },
          { x, y: y + height }
        ],
        ITEM_RENDER_COLORS[item.status],
        { color: 0xb8cbc1, width: 1 }
      )
      canvas.polygon(
        [
          { x, y },
          { x: x + width, y },
          { x: x + width, y: y + 4 },
          { x, y: y + 4 }
        ],
        ITEM_STATUS_COLORS[item.status]
      )
    })
    this.pendingItems = null
    return true
  }
}

const registerStarterRenderLayer = (
  core: Core,
  projection: StarterProjectionStore
): { resize(width: number, height: number): void; dispose(): void } => {
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
  return {
    resize(width, height) {
      layer.resize(width, height)
    },
    dispose() {
      unsubscribe()
      core.unregisterRenderLayer(STARTER_RENDER_LAYER_NAME)
      layer.dispose()
    }
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
    ]
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
  return {
    addItem(input = {}) {
      const title = assertTitle(input.title ?? 'Untitled item')
      const status = assertStatus(input.status ?? 'todo')
      const fields = assertItemFields(input.fields, itemField, true)
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
  const renderLayer = registerStarterRenderLayer(core, projection)
  disposeCallbacks.push(() => renderLayer.dispose())

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
        backgroundColor: 0xfbfcf9,
        width: startOptions.width ?? 800,
        height: startOptions.height ?? 480
      })
      renderLayer.resize(startOptions.width ?? 800, startOptions.height ?? 480)
      refreshProjection()
    },
    resize(width, height) {
      if (disposed) return
      core.resizeRenderer(width, height)
      renderLayer.resize(width, height)
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
