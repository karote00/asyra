import { RenderGraphics } from '@asyra/render'
import { createDefaultFill } from '@asyra/utils'
import { describe, expect, it, vi } from 'vitest'
import * as compoundFill from '../components/vector-compound-fill.js'
import { VECTOR_RENDER_STRATEGY } from '../components/vector.js'

interface Point {
  x: number
  y: number
}
const rectangle = (x: number, y: number, width: number, height: number) => [
  { x, y },
  { x: x + width, y },
  { x: x + width, y: y + height },
  { x, y: y + height }
]
const area = (points: readonly Point[]) =>
  Math.abs(
    points.reduce((sum, point, index) => {
      const next = points[(index + 1) % points.length]
      return sum + point.x * next.y - next.x * point.y
    }, 0)
  ) / 2

const render = (contours: Point[][]) => {
  const graphic = new RenderGraphics()
  const points: Record<string, unknown> = {}
  const segments: Record<string, unknown> = {}
  const networks: Record<string, unknown> = {}
  contours.forEach((contour, index) => {
    const pointIds = contour.map((point, pointIndex) => {
      const id = `${index}-${pointIndex}`
      points[id] = {
        id,
        kind: 'anchor',
        anchorType: 'sharp',
        handleMode: 'none',
        ...point
      }
      return id
    })
    const segmentIds = pointIds.map((startId, pointIndex) => {
      const id = `segment-${startId}`
      segments[id] = {
        id,
        startId,
        endId: pointIds[(pointIndex + 1) % pointIds.length]
      }
      return id
    })
    networks[index] = { id: String(index), pointIds, segmentIds, closed: true }
  })
  const data = {
    id: 'compound',
    type: 'vector',
    name: 'Compound',
    parentId: 'workspace',
    visible: true,
    lock: false,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    closed: true,
    pointCoordinateSpace: 'workspace',
    fillRule: 'nonzero',
    fills: [createDefaultFill({ color: '#008800', opacity: 0.5 })],
    strokes: [],
    points,
    segments,
    networks
  }
  const original = JSON.stringify(data)
  VECTOR_RENDER_STRATEGY(graphic, data)
  expect(JSON.stringify(data)).toBe(original)
  const operations = graphic.getDrawOperations()
  const fillIndex = operations.findIndex(
    (operation) => operation.type === 'fill'
  )
  const faces: (readonly Point[])[] = []
  let path: Point[] = []
  for (const operation of operations.slice(0, fillIndex)) {
    if (operation.type === 'poly') faces.push(operation.points)
    if (operation.type === 'move-to') {
      path = [{ x: operation.x, y: operation.y }]
      faces.push(path)
    }
    if (operation.type === 'line-to')
      path.push({ x: operation.x, y: operation.y })
  }
  return {
    graphic,
    filledArea: faces.reduce((sum, face) => sum + area(face), 0)
  }
}

describe('solid nonzero compound Vector projection', () => {
  it.each([false, true])(
    'keeps opposite-winding holes transparent regardless of path order (%s)',
    (reverse) => {
      const contours = [
        rectangle(0, 0, 100, 100),
        rectangle(20, 20, 60, 60).reverse()
      ]
      const { graphic, filledArea } = render(
        reverse ? contours.reverse() : contours
      )
      expect(filledArea).toBeCloseTo(6400, 8)
      expect(graphic.hitArea?.contains(50, 50)).toBe(false)
      expect(graphic.hitArea?.contains(10, 50)).toBe(true)
    }
  )
  it('fills same-winding interiors exactly once and keeps hit testing consistent', () => {
    const { graphic, filledArea } = render([
      rectangle(0, 0, 100, 100),
      rectangle(20, 20, 60, 60)
    ])
    expect(filledArea).toBeCloseTo(10000, 8)
    expect(graphic.hitArea?.contains(50, 50)).toBe(true)
  })
  it('preserves nested islands', () => {
    const { graphic, filledArea } = render([
      rectangle(0, 0, 100, 100),
      rectangle(20, 20, 60, 60).reverse(),
      rectangle(40, 40, 20, 20)
    ])
    expect(filledArea).toBeCloseTo(6800, 8)
    expect(graphic.hitArea?.contains(50, 50)).toBe(true)
    expect(graphic.hitArea?.contains(30, 50)).toBe(false)
  })
  it.each([false, true])(
    'resolves crossing contour winding without overlapping translucent faces (%s)',
    (opposite) => {
      const second = rectangle(25, 25, 50, 50)
      const { filledArea } = render([
        rectangle(0, 0, 50, 50),
        opposite ? second.reverse() : second
      ])
      expect(filledArea).toBeCloseTo(opposite ? 3750 : 4375, 8)
    }
  )
  it('splits slabs at diagonal crossings rather than only contour vertices', () => {
    const { filledArea } = render([
      [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ],
      [
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ]
    ])
    expect(filledArea).toBeCloseTo(7500, 8)
  })
})

// Source-space oracle: the two cubic arches enclose exactly 5,760 square units.
// The central 20 x 20 reverse-winding hole must remain transparent.
it('projects curved compound contours within the declared subdivision tolerance', async () => {
  const { prepareVectorCompoundFill } =
    await import('../components/vector-compound-fill.js')
  const shape = {
    paths: [
      {
        segments: [
          {
            type: 'cubicBezier' as const,
            points: [10, 50, 10, -10, 90, -10, 90, 50]
          },
          {
            type: 'cubicBezier' as const,
            points: [90, 50, 90, 110, 10, 110, 10, 50]
          }
        ]
      },
      {
        segments: [
          { type: 'line' as const, points: [40, 40, 40, 60] },
          { type: 'line' as const, points: [40, 60, 60, 60] },
          { type: 'line' as const, points: [60, 60, 60, 40] },
          { type: 'line' as const, points: [60, 40, 40, 40] }
        ]
      }
    ]
  }
  const original = JSON.stringify(shape)
  const prepared = prepareVectorCompoundFill(shape)
  const filledArea = prepared.faces.reduce((sum, face) => sum + area(face), 0)
  expect(Math.abs(filledArea - 5360)).toBeLessThan(10)
  expect(prepared.contains(50, 50)).toBe(false)
  expect(prepared.contains(50, 10)).toBe(true)
  expect(prepared.contains(5, 50)).toBe(false)
  expect(JSON.stringify(shape)).toBe(original)
})

it('prepares one fill geometry shared by rendering and repeated hit queries', () => {
  const prepare = vi.spyOn(compoundFill, 'prepareVectorCompoundFill')
  try {
    const { graphic } = render([
      rectangle(0, 0, 100, 100),
      rectangle(20, 20, 60, 60).reverse()
    ])
    expect(prepare).toHaveBeenCalledTimes(1)
    for (let index = 0; index < 100; index++) {
      expect(graphic.hitArea?.contains(50, 50)).toBe(false)
      expect(graphic.hitArea?.contains(10, 50)).toBe(true)
    }
    expect(prepare).toHaveBeenCalledTimes(1)
  } finally {
    prepare.mockRestore()
  }
})
