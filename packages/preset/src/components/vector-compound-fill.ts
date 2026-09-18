import { subdivideCubicBezierAtHalf, type PositionData } from '@asyra/utils'
import type { EvenOddShape } from '@asyra/core'

type Point = PositionData
interface Edge {
  start: Point
  end: Point
  minY: number
  maxY: number
  winding: number
}
const FLATNESS = 0.05
const MAX_DEPTH = 16
const EPSILON = 1e-9

const distanceToSegment = (point: Point, start: Point, end: Point) => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((point.x - start.x) * dx + (point.y - start.y) * dy) /
              lengthSquared
          )
        )
  return Math.hypot(point.x - start.x - t * dx, point.y - start.y - t * dy)
}

const flattenCurve = (
  points: readonly [Point, Point, Point, Point],
  output: Point[],
  depth = 0
): void => {
  const [start, control1, control2, end] = points
  if (
    depth >= MAX_DEPTH ||
    Math.max(
      distanceToSegment(control1, start, end),
      distanceToSegment(control2, start, end)
    ) <= FLATNESS
  ) {
    output.push(end)
    return
  }
  const { left, right } = subdivideCubicBezierAtHalf(...points)
  flattenCurve(left, output, depth + 1)
  flattenCurve(right, output, depth + 1)
}

const edgeX = (edge: Edge, y: number) =>
  edge.start.x +
  ((y - edge.start.y) * (edge.end.x - edge.start.x)) /
    (edge.end.y - edge.start.y)

/** Transient render geometry only. Canonical anchors and controls are never changed. */
export const prepareVectorCompoundFill = (shape: EvenOddShape) => {
  const edges: Edge[] = []
  const levels = new Set<number>()
  for (const path of shape.paths) {
    const contour: Point[] = []
    for (const segment of path.segments) {
      const p = segment.points
      if (!contour.length) contour.push({ x: p[0], y: p[1] })
      if (segment.type === 'line') contour.push({ x: p[2], y: p[3] })
      else
        flattenCurve(
          [
            { x: p[0], y: p[1] },
            { x: p[2], y: p[3] },
            { x: p[4], y: p[5] },
            { x: p[6], y: p[7] }
          ],
          contour
        )
    }
    contour.forEach((start, index) => {
      const end = contour[(index + 1) % contour.length]
      if (start.y === end.y) return
      const minY = Math.min(start.y, end.y)
      const maxY = Math.max(start.y, end.y)
      edges.push({ start, end, minY, maxY, winding: end.y > start.y ? 1 : -1 })
      levels.add(minY)
      levels.add(maxY)
    })
  }
  edges.sort((a, b) => a.minY - b.minY)
  // Edge order can only change at a crossing. Include these levels so a slab
  // has a constant winding order, including intersecting/self-crossing paths.
  for (let i = 0; i < edges.length; i++) {
    const a = edges[i]
    for (let j = i + 1; j < edges.length && edges[j].minY < a.maxY; j++) {
      const b = edges[j]
      const low = Math.max(a.minY, b.minY)
      const high = Math.min(a.maxY, b.maxY)
      if (low >= high) continue
      const lowDifference = edgeX(a, low) - edgeX(b, low)
      const highDifference = edgeX(a, high) - edgeX(b, high)
      if (lowDifference * highDifference < 0) {
        levels.add(
          low +
            ((high - low) * lowDifference) / (lowDifference - highDifference)
        )
      }
    }
  }
  const sortedLevels = [...levels].sort((a, b) => a - b)
  const faces: Point[][] = []
  let pending = 0
  let active: Edge[] = []
  for (let index = 0; index + 1 < sortedLevels.length; index++) {
    const low = sortedLevels[index]
    const high = sortedLevels[index + 1]
    if (high - low <= EPSILON) continue
    const middle = (low + high) / 2
    while (pending < edges.length && edges[pending].minY <= middle)
      active.push(edges[pending++])
    active = active.filter((edge) => edge.maxY > middle)
    active.sort((a, b) => edgeX(a, middle) - edgeX(b, middle))
    let winding = 0
    let left: Edge | undefined
    for (const edge of active) {
      const wasInside = winding !== 0
      winding += edge.winding
      if (!wasInside && winding !== 0) left = edge
      else if (wasInside && winding === 0 && left) {
        if (edgeX(edge, middle) - edgeX(left, middle) > EPSILON) {
          const face = [
            { x: edgeX(left, low), y: low },
            { x: edgeX(edge, low), y: low },
            { x: edgeX(edge, high), y: high },
            { x: edgeX(left, high), y: high }
          ].filter((point, pointIndex, points) => {
            const previous =
              points[(pointIndex + points.length - 1) % points.length]
            return (
              Math.hypot(point.x - previous.x, point.y - previous.y) > EPSILON
            )
          })
          if (face.length >= 3) faces.push(face)
        }
        left = undefined
      }
    }
  }
  return {
    faces,
    contains: (x: number, y: number) => {
      let winding = 0
      for (const edge of edges) {
        if (edge.minY > y) break
        if (y < edge.maxY && edgeX(edge, y) > x) winding += edge.winding
      }
      return winding !== 0
    }
  }
}
