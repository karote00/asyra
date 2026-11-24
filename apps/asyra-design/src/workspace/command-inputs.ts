import type { PositionData, Rect } from '@asyra/utils'
import core from '../contexts'
import { featureEnabled } from '../workspace-features'
import { requireEditableElement } from '../common-apis/design-edit'

export const edit = { undoable: true, sharedDelivery: 'immediate' } as const

export function position(point: PositionData) {
  if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) {
    throw new TypeError('Expected finite coordinates')
  }

  return { x: point.x, y: point.y }
}

export function rectangle(bounds: Rect) {
  position(bounds)
  if (
    !Number.isFinite(bounds.width) ||
    !Number.isFinite(bounds.height) ||
    bounds.width <= 0 ||
    bounds.height <= 0
  ) {
    throw new TypeError('Expected positive dimensions')
  }

  return {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height
  }
}

export function enabled(feature: string) {
  featureEnabled(feature, 'reject')
}

export function editable(elementId: string) {
  return requireEditableElement(elementId, (id) => core.getElementMetadata(id))
}
