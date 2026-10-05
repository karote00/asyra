import type { ElementPropertyPatchUpdate } from '@asyra/core'
import {
  PropertyTypes,
  createDefaultFill,
  id,
  type EVENT_OPTIONS,
  type FillAttrs,
  type FillGradientData,
  type PositionData
} from '@asyra/utils'
import { FILL_PATCH_KEYS, type FillWritableKey } from '../constants'
import core from '../contexts'
import { transactionApis } from './transaction'
import { isNonLinearGradient } from './gradient-handle-geometry'

export type FillPatch = Partial<Pick<FillAttrs, FillWritableKey>>

export interface FillTarget {
  readonly elementId: string
  readonly fillId: string
}

export interface FillFieldsUpdate extends FillTarget {
  readonly patch: FillPatch
}

export interface PrimaryFillColorUpdate {
  readonly color: string
  readonly elementId: string
}

const createFillRecordPatch = (
  elementId: string,
  fillId: string,
  fill: FillPatch
): ElementPropertyPatchUpdate => {
  const fields: Record<string, unknown> = {}
  for (const key of FILL_PATCH_KEYS) {
    const value = fill[key]
    if (value !== undefined) {
      fields[key] = value
    }
  }

  return {
    elementId,
    records: [
      {
        key: PropertyTypes.FILLS,
        set: {
          [fillId]: fields
        }
      }
    ]
  }
}

const assertUniqueFillTargets = (elementIds: readonly string[]) => {
  if (new Set(elementIds).size !== elementIds.length)
    throw new Error('Fill row targets must contain unique element IDs')
}

// Resolve relationships at the canonical caller boundary, once per owner.
const fillRowsAtIndex = (elementIds: readonly string[], index: number) => {
  assertUniqueFillTargets(elementIds)
  if (!Number.isSafeInteger(index) || index < 0)
    throw new Error('Invalid Fill row index')
  return elementIds.map((elementId) => {
    const fills = core.getElementComputedData(elementId, ['fills'])?.fills
    if (!Array.isArray(fills) || !fills[index]?.id)
      throw new Error(`Missing Fill row ${index} on ${elementId}`)
    return {
      elementId,
      fills: fills as FillAttrs[],
      fill: fills[index] as FillAttrs
    }
  })
}

export type GradientHandleIndex = 0 | 1

export interface GradientHandleGeometry {
  elementId: string
  fillId: string
  fill: FillAttrs
  width: number
  height: number
  canvasHandles: [PositionData, PositionData]
}

const getDisplayStartHandle = (
  gradient: FillGradientData
): FillGradientData['gradientHandles'][number] => {
  const [startHandle, endHandle] = gradient.gradientHandles
  if (!startHandle || !endHandle) {
    return startHandle
  }

  if (!isNonLinearGradient(gradient.gradientType)) {
    return startHandle
  }

  return {
    x: (startHandle.x + endHandle.x) / 2,
    y: (startHandle.y + endHandle.y) / 2
  }
}

const getStoredHandleFromDisplay = (
  gradient: FillGradientData,
  handleIndex: GradientHandleIndex,
  displayHandle: { x: number; y: number }
) => {
  if (handleIndex !== 0 || !isNonLinearGradient(gradient.gradientType)) {
    return displayHandle
  }

  const endHandle = gradient.gradientHandles[1]
  if (!endHandle) {
    return displayHandle
  }

  return {
    x: displayHandle.x * 2 - endHandle.x,
    y: displayHandle.y * 2 - endHandle.y
  }
}

const getElementFill = (
  elementId: string,
  fillId: string
): { fill: FillAttrs; width: number; height: number } | null => {
  const computed = core.getElementComputedData(elementId) as Partial<{
    fills: FillAttrs[]
    width: number
    height: number
  }> | null
  if (!computed) return null
  const fills = Array.isArray(computed.fills) ? computed.fills : []
  const fill = fills.find((entry) => entry?.id === fillId)
  if (!fill) {
    return null
  }

  const width = computed.width
  const height = computed.height
  if (
    typeof width !== 'number' ||
    !Number.isFinite(width) ||
    width === 0 ||
    typeof height !== 'number' ||
    !Number.isFinite(height) ||
    height === 0
  ) {
    return null
  }

  return {
    fill,
    width,
    height
  }
}

const getPrimaryFill = (elementId: string): FillAttrs | null => {
  const computed = core.getElementComputedData(elementId) as {
    fills?: unknown
  } | null
  if (!Array.isArray(computed?.fills)) {
    return null
  }
  const fill = computed.fills[0]
  return fill && typeof fill === 'object' ? (fill as FillAttrs) : null
}

const getCanvasPositionFromClient = (clientPos: PositionData): PositionData => {
  const canvasBounds = core.getCanvasBounds()
  if (!canvasBounds) {
    return clientPos
  }

  return {
    x: clientPos.x - canvasBounds.left,
    y: clientPos.y - canvasBounds.top
  }
}

export const fillApis = {
  getFillTargetsAtIndex: (
    elementIds: readonly string[],
    index: number
  ): FillTarget[] => {
    if (!Number.isInteger(index) || index < 0)
      throw new Error('Invalid Fill row index')
    return [...new Set(elementIds)].map((elementId) => {
      const fills = core.getElementComputedData(elementId, ['fills'])?.fills
      const fill = Array.isArray(fills) ? fills[index] : undefined
      if (!fill?.id)
        throw new Error(`Missing Fill row ${index} on ${elementId}`)
      return { elementId, fillId: fill.id }
    })
  },

  addFills: (
    elementIds: readonly string[],
    options?: EVENT_OPTIONS
  ): string[] => {
    const entries = [...new Set(elementIds)].map((elementId) => ({
      elementId,
      fill: createDefaultFill({ id: id('fill') })
    }))
    if (!entries.length) return []
    transactionApis.runTransaction(() =>
      core.patchElementProperties(
        entries.map(({ elementId, fill }) =>
          createFillRecordPatch(elementId, fill.id, fill)
        ),
        options
      )
    )
    return entries.map(({ fill }) => fill.id)
  },

  addFill: (elementId: string, options?: EVENT_OPTIONS): string | null => {
    if (!core.getElementData(elementId)) return null
    return fillApis.addFills([elementId], options)[0] ?? null
  },

  removeFills: (
    targets: readonly FillTarget[],
    options?: EVENT_OPTIONS
  ): void => {
    if (!targets.length) return
    transactionApis.runTransaction(() =>
      core.patchElementProperties(
        targets.map(({ elementId, fillId }) => ({
          elementId,
          records: [{ key: PropertyTypes.FILLS, remove: [fillId] }]
        })),
        options
      )
    )
  },

  removeFill: (
    elementId: string,
    fillId: string,
    options?: EVENT_OPTIONS
  ): boolean => {
    const fills = core.getElementComputedData(elementId, ['fills'])?.fills
    if (
      !fillId ||
      !Array.isArray(fills) ||
      !fills.some((fill) => fill?.id === fillId)
    )
      return false
    fillApis.removeFills([{ elementId, fillId }], options)
    return true
  },

  getCanvasBounds: (): DOMRect | null => {
    return core.getCanvasBounds()
  },

  getCanvasPositionFromClient: (
    clientPos: PositionData,
    canvasBounds?: DOMRect | null
  ): PositionData => {
    const resolvedBounds = canvasBounds ?? fillApis.getCanvasBounds()
    if (!resolvedBounds) {
      return clientPos
    }

    return {
      x: clientPos.x - resolvedBounds.left,
      y: clientPos.y - resolvedBounds.top
    }
  },

  getFillById: (elementId: string, fillId: string): FillAttrs | null => {
    return getElementFill(elementId, fillId)?.fill ?? null
  },

  getPrimaryFillColor: (elementId: string): string | null => {
    const fill = getPrimaryFill(elementId)
    return typeof fill?.color === 'string' ? fill.color : null
  },

  getNextGradientForHandleAtClientPosition: (
    elementId: string,
    fillId: string,
    handleIndex: GradientHandleIndex,
    clientPos: PositionData
  ) => {
    const geometry = fillApis.getGradientHandleGeometry(elementId, fillId)
    if (!geometry || !geometry.fill.gradient) {
      return null
    }

    const workspacePos = core.getMousePosInWorkspace({
      clientX: clientPos.x,
      clientY: clientPos.y
    })
    const localPos = core.workspaceToElementLocal(elementId, workspacePos)
    if (!localPos) return null
    const displayHandle = {
      x: localPos.x / geometry.width,
      y: localPos.y / geometry.height
    }
    if (
      handleIndex === 1 &&
      isNonLinearGradient(geometry.fill.gradient.gradientType)
    ) {
      const displayStartHandle = getDisplayStartHandle(geometry.fill.gradient)
      const nextStartHandle = displayStartHandle
        ? {
            x: displayStartHandle.x * 2 - displayHandle.x,
            y: displayStartHandle.y * 2 - displayHandle.y
          }
        : geometry.fill.gradient.gradientHandles[0]

      return {
        ...geometry.fill.gradient,
        gradientHandles: geometry.fill.gradient.gradientHandles.map(
          (handle, index) => {
            if (index === 0) {
              return nextStartHandle ?? handle
            }
            if (index === 1) {
              return displayHandle
            }
            return handle
          }
        )
      }
    }

    const nextHandle = getStoredHandleFromDisplay(
      geometry.fill.gradient,
      handleIndex,
      displayHandle
    )

    return {
      ...geometry.fill.gradient,
      gradientHandles: geometry.fill.gradient.gradientHandles.map(
        (handle, index) => (index === handleIndex ? nextHandle : handle)
      )
    }
  },

  getGradientHandleGeometry: (
    elementId: string,
    fillId: string
  ): GradientHandleGeometry | null => {
    const fillData = getElementFill(elementId, fillId)
    if (
      !fillData?.fill.gradient ||
      fillData.fill.gradient.gradientHandles.length < 2
    ) {
      return null
    }

    const [, endHandle] = fillData.fill.gradient.gradientHandles
    const displayStartHandle = getDisplayStartHandle(fillData.fill.gradient)
    const startWorkspace = core.elementLocalToWorkspace(elementId, {
      x: displayStartHandle.x * fillData.width,
      y: displayStartHandle.y * fillData.height
    })
    const endWorkspace = core.elementLocalToWorkspace(elementId, {
      x: endHandle.x * fillData.width,
      y: endHandle.y * fillData.height
    })
    if (!startWorkspace || !endWorkspace) {
      return null
    }
    const canvasHandles: [PositionData, PositionData] = [
      core.workspaceToCanvas(startWorkspace),
      core.workspaceToCanvas(endWorkspace)
    ]

    return {
      elementId,
      fillId,
      fill: fillData.fill,
      width: fillData.width,
      height: fillData.height,
      canvasHandles
    }
  },

  getGradientHandleHitAtClientPos: (
    elementId: string,
    fillId: string,
    clientPos: PositionData,
    hitRadius = 9
  ): { handleIndex: GradientHandleIndex } | null => {
    const geometry = fillApis.getGradientHandleGeometry(elementId, fillId)
    if (!geometry) {
      return null
    }

    const canvasPos = getCanvasPositionFromClient(clientPos)
    const hitRadiusSquared = hitRadius * hitRadius

    for (const [handleIndex, handlePos] of geometry.canvasHandles.entries()) {
      const dx = handlePos.x - canvasPos.x
      const dy = handlePos.y - canvasPos.y
      if (dx * dx + dy * dy <= hitRadiusSquared) {
        return {
          handleIndex: handleIndex as GradientHandleIndex
        }
      }
    }

    return null
  },

  getGradientStopHitAtClientPos: (
    elementId: string,
    fillId: string,
    clientPos: PositionData,
    hitSize = 16
  ): { stopIndex: number } | null => {
    const geometry = fillApis.getGradientHandleGeometry(elementId, fillId)
    if (!geometry?.fill.gradient) {
      return null
    }

    const canvasPos = getCanvasPositionFromClient(clientPos)
    const start = geometry.canvasHandles[0]
    const end = geometry.canvasHandles[1]

    // Perpendicular offset direction (same as render layer)
    const ldx = end.x - start.x
    const ldy = end.y - start.y
    const dist = Math.max(0.001, Math.sqrt(ldx * ldx + ldy * ldy))
    const ux = ldx / dist
    const uy = ldy / dist
    const px = -uy
    const py = ux

    const stopOffsetFromLine = 8 // STOP_TRIANGLE_HEIGHT(6) + 2
    const rectHalf = hitSize / 2
    const offsetDist = stopOffsetFromLine + rectHalf

    const stops = geometry.fill.gradient.gradientStops
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i]

      // Position on the gradient line
      const lineX = start.x + (end.x - start.x) * stop.position
      const lineY = start.y + (end.y - start.y) * stop.position

      // Center of the indicator rectangle (offset perpendicular)
      const cx = lineX + px * offsetDist
      const cy = lineY + py * offsetDist

      // Hit-test using rotated rectangle: project click into the rect's local space
      const relX = canvasPos.x - cx
      const relY = canvasPos.y - cy

      // Rotate into the gradient-aligned coordinate system
      const localAlongLine = relX * ux + relY * uy
      const localPerpLine = relX * px + relY * py

      if (
        Math.abs(localAlongLine) <= rectHalf &&
        Math.abs(localPerpLine) <= rectHalf
      ) {
        return { stopIndex: i }
      }
    }

    return null
  },

  updateGradientHandleAtClientPosition: (
    elementId: string,
    fillId: string,
    handleIndex: GradientHandleIndex,
    clientPos: PositionData,
    options?: EVENT_OPTIONS
  ) => {
    const geometry = fillApis.getGradientHandleGeometry(elementId, fillId)
    const nextGradient = fillApis.getNextGradientForHandleAtClientPosition(
      elementId,
      fillId,
      handleIndex,
      clientPos
    )
    if (!geometry || !geometry.fill.gradient || !nextGradient) {
      return null
    }

    fillApis.updateFillField(
      elementId,
      fillId,
      'gradient',
      nextGradient,
      options
    )

    return nextGradient
  },

  updatePrimaryFillColors: (
    updates: readonly PrimaryFillColorUpdate[],
    options?: EVENT_OPTIONS
  ): readonly boolean[] => {
    const prepared = updates.map(({ color, elementId }) => {
      const fill = getPrimaryFill(elementId)
      if (
        !fill ||
        typeof color !== 'string' ||
        color.length === 0 ||
        fill.color === color
      ) {
        return null
      }
      return {
        elementId,
        fillId: fill.id,
        patch: { color }
      }
    })
    if (!prepared.some((update) => update !== null)) {
      return Object.freeze(prepared.map(() => false))
    }

    transactionApis.runTransaction(() => {
      core.patchElementProperties(
        prepared.flatMap((update) =>
          update
            ? [
                createFillRecordPatch(
                  update.elementId,
                  update.fillId,
                  update.patch
                )
              ]
            : []
        ),
        options
      )
    })
    return Object.freeze(prepared.map((update) => update !== null))
  },

  updatePrimaryFillColor: (
    elementId: string,
    color: string,
    options?: EVENT_OPTIONS
  ): boolean =>
    fillApis.updatePrimaryFillColors(
      [
        {
          color,
          elementId
        }
      ],
      options
    )[0] ?? false,

  /** New values only. Resolve current child identity once per owner, then write in input order. */
  updateFillsAtIndex: (
    elementIds: readonly string[],
    index: number,
    patch: FillPatch | readonly FillPatch[],
    options?: EVENT_OPTIONS
  ): void => {
    const aligned = Array.isArray(patch) ? patch : undefined
    if (aligned && aligned.length !== elementIds.length)
      throw new Error('Fill patches must be aligned with elementIds')
    const targets = fillRowsAtIndex(elementIds, index)
    fillApis.updateFillFieldsBatch(
      targets.map(({ elementId, fill }, offset) => ({
        elementId,
        fillId: fill.id,
        patch: aligned ? aligned[offset] : (patch as FillPatch)
      })),
      options
    )
  },

  /** Explicitly share the child property component; subsequent edits affect all owners. */
  shareFillAtIndex: (
    sourceElementId: string,
    elementIds: readonly string[],
    index: number,
    options?: EVENT_OPTIONS
  ): void => {
    assertUniqueFillTargets(elementIds)
    const [source, ...targets] = fillRowsAtIndex(
      [...new Set([sourceElementId, ...elementIds])],
      index
    )
    const updates = targets
      .filter(({ fill }) => fill.id !== source.fill.id)
      .map(({ elementId, fills }) => ({
        elementId,
        values: {
          fills: fills.map((fill, row) =>
            row === index ? source.fill.id : fill.id
          )
        }
      }))
    if (updates.length)
      transactionApis.runTransaction(() =>
        core.updateElementProperties(updates, options)
      )
  },

  /** Copy only the chosen child property; other rows keep their existing relations. */
  detachFillsAtIndex: (
    elementIds: readonly string[],
    index: number,
    options?: EVENT_OPTIONS
  ): void => {
    const targets = fillRowsAtIndex(elementIds, index).map((target) => ({
      ...target,
      newId: id('fill')
    }))
    if (!targets.length) return
    transactionApis.runTransaction(() => {
      // Record creation and reference replacement are distinct public Core operations.
      // The outer transaction publishes one final relationship and owns rollback.
      core.patchElementProperties(
        targets.map(({ elementId, fill, newId }) =>
          createFillRecordPatch(elementId, newId, fill)
        ),
        options
      )
      core.updateElementProperties(
        targets.map(({ elementId, fills, newId }) => ({
          elementId,
          values: {
            fills: fills.map((fill, row) => (row === index ? newId : fill.id))
          }
        })),
        options
      )
    })
  },

  updateFillFieldsBatch: (
    updates: readonly FillFieldsUpdate[],
    options?: EVENT_OPTIONS
  ): void => {
    for (const { patch } of updates) {
      for (const key of Object.keys(patch)) {
        if (!FILL_PATCH_KEYS.some((allowed) => allowed === key)) {
          throw new Error(
            `Unsupported Fill field "${key}". Gradient fields belong inside "gradient".`
          )
        }
      }
    }
    const patches = updates
      .filter(({ patch }) =>
        FILL_PATCH_KEYS.some((key) => patch[key] !== undefined)
      )
      .map(({ elementId, fillId, patch }) =>
        createFillRecordPatch(elementId, fillId, patch)
      )
    if (!patches.length) return
    transactionApis.runTransaction(() =>
      core.patchElementProperties(patches, options)
    )
  },

  updateFillFields: (
    elementId: string,
    fillId: string,
    patch: FillPatch,
    options?: EVENT_OPTIONS
  ) => {
    fillApis.updateFillFieldsBatch([{ elementId, fillId, patch }], options)
  },
  updateFillField: <K extends FillWritableKey>(
    elementId: string,
    fillId: string,
    key: K,
    value: FillAttrs[K],
    options?: EVENT_OPTIONS
  ) => {
    fillApis.updateFillFields(
      elementId,
      fillId,
      { [key]: value } as FillPatch,
      options
    )
  }
}
