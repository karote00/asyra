import { applyPreset, PresetProfiles } from '@asyra/preset'
import { getCore, resetCore } from '../contexts/core.js'
import {
  assertItemFieldExtension,
  createItemApi
} from '../common-apis/items.js'
import { createHistoryApis } from '../common-apis/history.js'
import { createStorageApis, defaultStorage } from '../common-apis/storage.js'
import { registerItemFeatures } from '../features/items/index.js'
import { StarterProjectionStore } from '../derived-state/item-projection.js'
import { registerStarterRenderLayer } from '../render-layers/items.js'
import {
  createItemPropertySchema,
  type ItemFieldExtension
} from '../domain/item-domain.js'
import type { StarterStorage } from '../persistence/storage.js'
import { UIProperties } from '../config/ui-properties.js'
import { createBoardController } from '../controllers/item-board.js'
import {
  registerStarterSchema,
  registerStarterSharedDataChannels,
  createEmptyCoreDocument
} from './foundation/init-document.js'
import { initProjection } from './derived-state/init-projection.js'
import { initUIProperties } from './derived-state/init-ui-properties.js'

export interface AppOptions {
  readonly storage?: StarterStorage
  readonly onLoadAccepted?: () => void
  readonly itemField?: ItemFieldExtension
}

// One mounted App owns one Core lifetime. Dispose before creating the next App.
export const initApp = (options: AppOptions = {}) => {
  assertItemFieldExtension(options.itemField)
  const core = getCore()
  let disposed = false
  let starting: Promise<void> | undefined
  let disposing: Promise<void> | undefined
  const historyApis = createHistoryApis(() => !disposed)
  const storage = options.storage ?? defaultStorage()
  registerStarterSchema(
    core,
    createItemPropertySchema(options.itemField),
    options.itemField
  )
  core.setLoadSource({
    name: 'starter-empty-document',
    load: async () => createEmptyCoreDocument()
  })
  const releaseChannels = registerStarterSharedDataChannels(core)
  applyPreset(core, { profile: PresetProfiles['2D'], defaults: [] })
  const projection = new StarterProjectionStore(core, options.itemField)
  const ui = initUIProperties(core, projection)
  const releaseProjection = initProjection(
    core,
    projection,
    options.onLoadAccepted
  )
  const feature = registerItemFeatures(createItemApi(core, options.itemField))
  const itemActions = feature.api
  const storageApis = createStorageApis(core, storage, options.itemField)
  const controller = createBoardController(
    core,
    itemActions,
    historyApis,
    storageApis,
    projection
  )
  const renderLayer = registerStarterRenderLayer(core, projection)

  return {
    core,
    itemActions,
    historyApis,
    storageApis,
    projection,
    controller,
    ui,
    async start(
      container: HTMLElement,
      { width = 800, height = 480 } = {}
    ): Promise<void> {
      if (disposed) throw new Error('App is disposed.')
      if (!starting)
        starting = (async () => {
          await core.start(container, {
            backgroundColor: 0xfbfcf9,
            width,
            height
          })
          if (disposed) return
          renderLayer.resize(width, height)
          projection.refresh()
          core.setUIProperty(UIProperties.ready, true)
          controller.status(
            storage.unavailableReason
              ? { tone: 'error', message: storage.unavailableReason }
              : { tone: 'ok', message: 'Ready' }
          )
        })()
      return starting
    },
    resize(width: number, height: number): void {
      if (disposed) return
      core.setUIProperty(UIProperties.canvasWidth, width)
      core.resizeRenderer(width, height)
      renderLayer.resize(width, height)
    },
    previewItemPosition(
      id: string | null,
      offset?: { x: number; y: number }
    ): void {
      if (!disposed) renderLayer.setPreview(id, offset)
    },
    dispose(): Promise<void> {
      if (disposing) return disposing
      disposed = true
      controller.dispose()
      releaseProjection()
      ui.dispose()
      disposing = resetCore(async () => {
        // The start caller retains its rejection; teardown must proceed after
        // either outcome, because Core forbids resetting during startup.
        await starting?.catch(() => undefined)
        renderLayer.dispose()
        releaseChannels()
        projection.dispose()
        feature.dispose()
      })
      return disposing
    }
  }
}

export type AppSession = ReturnType<typeof initApp>
