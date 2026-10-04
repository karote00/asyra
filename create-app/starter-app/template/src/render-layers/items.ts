import {
  createOverlayLayerRegistration,
  type Core,
  type OverlayCanvas,
  type RenderLayerRegistration
} from '@asyra/core'
import type { ItemProjection, ItemStatus } from '../domain/item-domain.js'
import type { StarterProjectionStore } from '../derived-state/item-projection.js'

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
  viewportWidth = 800,
  offset?: Readonly<{ x: number; y: number }>,
  viewportHeight?: number
): StarterItemRenderBounds => {
  const narrow = viewportWidth < 760
  const width = narrow ? 150 : 218
  const height = narrow ? 94 : 124
  if (viewportWidth < 340) {
    return {
      x: Math.max(
        0,
        Math.min(
          viewportWidth - Math.min(width, viewportWidth - 48),
          24 + (offset?.x ?? 0)
        )
      ),
      y: Math.max(
        0,
        Math.min(
          (viewportHeight ?? Infinity) - height,
          86 + index * 126 + (offset?.y ?? 0)
        )
      ),
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
    x: Math.max(
      0,
      Math.min(
        viewportWidth - width,
        Math.round((viewportWidth - width) * (xFractions[position] ?? 0)) +
          (offset?.x ?? 0)
      )
    ),
    y: Math.max(
      0,
      Math.min(
        (viewportHeight ?? Infinity) - height,
        (yOffsets[position] ?? 90) + cycle * cycleHeight + (offset?.y ?? 0)
      )
    ),
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
  private preview: { id: string; offset: { x: number; y: number } } | null =
    null
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

  setPreview(id: string | null, offset?: { x: number; y: number }): void {
    this.preview = id && offset ? { id, offset } : null
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
        this.viewportWidth,
        this.preview?.id === item.id ? this.preview.offset : item.offset,
        this.viewportHeight
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

export const registerStarterRenderLayer = (
  core: Core,
  projection: StarterProjectionStore
): {
  resize(width: number, height: number): void
  setPreview(id: string | null, offset?: { x: number; y: number }): void
  dispose(): void
} => {
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
  return {
    resize(width, height) {
      layer.resize(width, height)
    },
    setPreview(id, offset) {
      layer.setPreview(id, offset)
    },
    dispose() {
      unsubscribe()
      core.unregisterRenderLayer(STARTER_RENDER_LAYER_NAME)
      layer.dispose()
    }
  }
}
