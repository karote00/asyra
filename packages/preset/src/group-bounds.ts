import { calculateEllipseBounds } from '@asyra/utils/geometry-bounds'
// Pure geometry shared by Preset operations and server-side preparation.
export interface GroupBounds {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly type?: string
  readonly scaleX?: number
  readonly scaleY?: number
  readonly skewX?: number
  readonly skewY?: number
  readonly rotation?: number
}

// Parent-local translation and physical scale share Render's rotate-after-scale order.
export const transformGroupOffset = (
  pose: Pick<GroupBounds, 'rotation' | 'scaleX' | 'scaleY'>,
  point: Readonly<{ x: number; y: number }>,
  inverse: boolean
) => {
  const angle = pose.rotation ?? 0
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const sx = pose.scaleX ?? 1
  const sy = pose.scaleY ?? 1

  return inverse
    ? {
        x: (c * point.x + s * point.y) / sx,
        y: (-s * point.x + c * point.y) / sy
      }
    : {
        x: c * sx * point.x - s * sy * point.y,
        y: s * sx * point.x + c * sy * point.y
      }
}

export const deriveGroupBounds = (
  rectangles: readonly GroupBounds[]
): GroupBounds => {
  if (rectangles.length === 0) {
    return Object.freeze({ x: 0, y: 0, width: 0, height: 0 })
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  rectangles.forEach((rectangle) => {
    const { x, y, type, rotation = 0 } = rectangle
    const width = rectangle.width * (rectangle.scaleX ?? 1)
    const height = rectangle.height * (rectangle.scaleY ?? 1)
    const skewX = type === 'vector' ? (rectangle.skewX ?? 0) : 0
    const skewY = type === 'vector' ? (rectangle.skewY ?? 0) : 0
    const values = [x, y, width, height, rotation, skewX, skewY]

    if (values.some((value) => !Number.isFinite(value))) {
      throw new Error(
        '[Preset] Group operation requires finite 2D geometry: direct-child rectangle is invalid'
      )
    }

    if (type === 'oval' && rotation !== 0) {
      const bounds = calculateEllipseBounds({ x, y, width, height, rotation })

      minX = Math.min(minX, bounds.x)
      maxX = Math.max(maxX, bounds.x + bounds.width)
      minY = Math.min(minY, bounds.y)
      maxY = Math.max(maxY, bounds.y + bounds.height)

      return
    }

    if (rotation !== 0 || skewX !== 0 || skewY !== 0) {
      const wx = Math.cos(rotation + skewY) * width,
        wy = Math.sin(rotation + skewY) * width
      const hx = -Math.sin(rotation - skewX) * height,
        hy = Math.cos(rotation - skewX) * height

      minX = Math.min(minX, x + Math.min(0, wx) + Math.min(0, hx))
      minY = Math.min(minY, y + Math.min(0, wy) + Math.min(0, hy))
      maxX = Math.max(maxX, x + Math.max(0, wx) + Math.max(0, hx))
      maxY = Math.max(maxY, y + Math.max(0, wy) + Math.max(0, hy))

      return
    }

    minX = Math.min(minX, x, x + width)
    minY = Math.min(minY, y, y + height)
    maxX = Math.max(maxX, x, x + width)
    maxY = Math.max(maxY, y, y + height)
  })

  return Object.freeze({
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  })
}

/** Plan a synchronous insertion against the current direct children. All
 * returned updates are expressed in the final parent basis. No scene writes. */
export const projectGroupInsertion = (
  parentId: string,
  incoming: readonly GroupBounds[],
  readGroup: (
    id: string
  ) => { children: readonly string[]; parentId?: string } | undefined,
  readBounds: (id: string) => GroupBounds
) => {
  const original = new Map<string, GroupBounds>()
  const projected = new Map<string, GroupBounds>()

  const rectangle = (id: string) => {
    const known = projected.get(id) ?? original.get(id)

    if (known) {
      return known
    }

    const value = readBounds(id)

    original.set(id, value)

    return value
  }

  let offset = { x: 0, y: 0 }
  const visited = new Set<string>()

  for (let id: string | undefined = parentId; id;) {
    if (visited.has(id)) {
      throw Error('Cycle in insertion ancestry')
    }

    visited.add(id)
    const group = readGroup(id)

    if (!group) {
      break
    }

    const current = rectangle(id)
    const children = group.children.map(rectangle)
    const bounds = deriveGroupBounds(
      id === parentId ? [...children, ...incoming] : children
    )

    if (id === parentId) {
      offset = { x: bounds.x, y: bounds.y }
    }

    if (
      !bounds.x &&
      !bounds.y &&
      current.width === bounds.width &&
      current.height === bounds.height
    ) {
      break
    }

    const shift = transformGroupOffset(current, bounds, false)

    projected.set(id, {
      ...current,
      x: current.x + shift.x,
      y: current.y + shift.y,
      width: bounds.width,
      height: bounds.height
    })
    if (bounds.x || bounds.y) {
      group.children.forEach((childId, i) => {
        const child = children[i]

        projected.set(childId, {
          ...child,
          x: child.x - bounds.x,
          y: child.y - bounds.y
        })
      })
    }

    id = group.parentId
  }

  const updates: { elementId: string; values: Record<string, number> }[] = []

  for (const [elementId, rect] of projected) {
    const before = original.get(elementId)

    if (!before) {
      throw Error('Missing insertion geometry')
    }

    const values: Record<string, number> = {}

    for (const field of ['x', 'y', 'width', 'height'] as const) {
      if (before[field] !== rect[field]) {
        values[field] = rect[field]
      }
    }

    if (Object.keys(values).length) {
      updates.push({ elementId, values })
    }
  }

  return { offset, updates }
}
