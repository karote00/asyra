import { runTransaction } from '@asyra/core'
import {
  projectGroupInsertion,
  transformGroupOffset
} from '@asyra/preset/group-bounds'
import type { EVENT_OPTIONS } from '@asyra/utils'
import { elementApis, type PreparedElementDescriptor } from '../common-apis'
import core from '../contexts'

interface Offset {
  x: number
  y: number
}
interface AttachmentBasis {
  boundary: string
  origin: Offset
  horizontal: Offset
  vertical: Offset
}

// Bind the source basis to the created root's lifetime. Re-read live canonical
// geometry for continuation, including changes from other writers and history.
const partitionBases = new WeakMap<object, AttachmentBasis>()

const numericField = (
  data: Readonly<Record<string, unknown>>,
  key: string,
  defaultValue?: number
) => {
  const value = data[key] ?? defaultValue

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw Error('Invalid attachment geometry: ' + key)
  }

  return value
}

const readBasis = (parentId: string): AttachmentBasis => {
  let origin = { x: 0, y: 0 },
    horizontal = { x: 1, y: 0 },
    vertical = { x: 0, y: 1 }
  const visited = new Set<string>()
  let id = parentId

  while (!visited.has(id)) {
    visited.add(id)
    const meta = core.getElementMetadata(id)

    if (!meta) {
      throw Error('Missing attachment ancestor.')
    }

    if (meta.type !== 'group') {
      return { boundary: id, origin, horizontal, vertical }
    }

    const data = core.getElementComputedData(id, [
      'x',
      'y',
      'scaleX',
      'scaleY',
      'rotation'
    ])

    if (!data) {
      throw Error('Missing attachment pose.')
    }

    const pose = {
      rotation: numericField(data, 'rotation', 0),
      scaleX: numericField(data, 'scaleX', 1),
      scaleY: numericField(data, 'scaleY', 1)
    }
    const shift = transformGroupOffset(pose, origin, false)

    origin = {
      x: numericField(data, 'x') + shift.x,
      y: numericField(data, 'y') + shift.y
    }
    horizontal = transformGroupOffset(pose, horizontal, false)
    vertical = transformGroupOffset(pose, vertical, false)
    id = meta.parentId ?? ''
  }

  throw Error('Cycle in attachment ancestry.')
}

export const originalParentPoint = (
  rootId: string,
  parentId: string,
  point: Offset
): Offset => {
  if (core.getElementMetadata(parentId)?.type !== 'group') {
    return point
  }

  const root = core.deps.sceneTree.getElementById(rootId)
  const original = root && partitionBases.get(root)
  const current = readBasis(parentId)

  if (!original || current.boundary !== original.boundary) {
    throw Error('The original partition attachment basis is unavailable.')
  }

  // Rebasing changes translation only. Equal anchor positions alone cannot
  // prove that the rest of the original offsets still have the same meaning.
  for (const direction of ['horizontal', 'vertical'] as const) {
    for (const axis of ['x', 'y'] as const) {
      const a = original[direction][axis],
        b = current[direction][axis]

      if (
        !Number.isFinite(b) ||
        Math.abs(a - b) >
          64 * Number.EPSILON * Math.max(1, Math.abs(a), Math.abs(b))
      ) {
        throw Error('The partition attachment transform changed.')
      }
    }
  }

  const { horizontal: h, vertical: v } = original
  const determinant = h.x * v.y - h.y * v.x

  if (!Number.isFinite(determinant) || !determinant) {
    throw Error('The partition attachment basis is not invertible.')
  }

  const dx = current.origin.x - original.origin.x,
    dy = current.origin.y - original.origin.y

  return {
    x: point.x + (v.y * dx - v.x * dy) / determinant,
    y: point.y + (h.x * dy - h.y * dx) / determinant
  }
}

const readGeometry = (
  data: Readonly<Record<string, unknown>>,
  type: string
) => {
  return {
    type,
    x: numericField(data, 'x'),
    y: numericField(data, 'y'),
    width: numericField(data, 'width'),
    height: numericField(data, 'height'),
    rotation: numericField(data, 'rotation', 0),
    scaleX: numericField(data, 'scaleX', 1),
    scaleY: numericField(data, 'scaleY', 1),
    skewX: numericField(data, 'skewX', 0),
    skewY: numericField(data, 'skewY', 0)
  }
}

export const createPreparedSiblings = (
  ds: readonly PreparedElementDescriptor[],
  id: string,
  options: EVENT_OPTIONS,
  attachment?: { rootId: string; continuation: boolean }
) => {
  if (!attachment) {
    return elementApis.createElementsInParent(ds, id, options)
  }

  const original =
    !attachment.continuation && ds[0]?.type === 'group'
      ? readBasis(id)
      : undefined
  const plan = projectGroupInsertion(
    id,
    ds.map((d) => readGeometry(d, d.type)),
    (groupId) => {
      const meta = core.getElementMetadata(groupId)

      if (!meta) {
        throw Error('Insertion ancestor is unavailable.')
      }

      if (meta.type !== 'group') {
        return
      }

      return {
        parentId: meta.parentId,
        children: meta.childCount
          ? core.getElementChildren(groupId, 0, meta.childCount).elementIds
          : []
      }
    },
    (elementId) => {
      const meta = core.getElementMetadata(elementId)
      const data = core.getElementComputedData(elementId, [
        'x',
        'y',
        'width',
        'height',
        'rotation',
        'scaleX',
        'scaleY',
        'skewX',
        'skewY'
      ])

      if (!meta || !data) {
        throw Error('Insertion geometry is unavailable.')
      }

      return readGeometry(data, meta.type)
    }
  )
  const ids = runTransaction(() => {
    const values =
      plan.offset.x || plan.offset.y
        ? ds.map((d) => ({
            ...d,
            x: Number(d.x) - plan.offset.x,
            y: Number(d.y) - plan.offset.y
          }))
        : ds
    const created = elementApis.createElementsInParent(values, id, options)

    if (
      created?.length !== ds.length ||
      created.some((value, i) => value !== ds[i].id)
    ) {
      throw Error('Design creation did not preserve its object identities.')
    }

    if (plan.updates.length) {
      const receipt = core.updateElementProperties(plan.updates, options)

      if (receipt.acceptedIds.length !== plan.updates.length) {
        throw Error('Incomplete Group coordinate update.')
      }
    }

    return created
  })

  if (original) {
    const root = core.deps.sceneTree.getElementById(attachment.rootId)

    if (root) {
      partitionBases.set(root, original)
    }
  }

  return ids
}
