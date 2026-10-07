import { RenderGraphics, RenderMesh } from '@asyra/render'
import { createDefaultFill } from '@asyra/utils'
import { describe, expect, it, vi } from 'vitest'
import * as compoundFill from '../components/vector-compound-fill.js'
import { VECTOR_RENDER_STRATEGY } from '../components/vector.js'

// Self-contained observer: the source-proof runner captures this test file.
const vectorFillMeshes = (graphic: RenderGraphics): RenderMesh[] =>
  graphic.children
    .flatMap((child) => child.children)
    .filter((child): child is RenderMesh => child instanceof RenderMesh)

const vectorFillTriangles = (graphic: RenderGraphics) =>
  vectorFillMeshes(graphic).flatMap((mesh) => {
    const geometry = mesh.getEngineProperties().geometry as {
      positions: ArrayLike<number>
      indices: ArrayLike<number>
    }
    const triangles: { x: number; y: number }[][] = []
    for (let i = 0; i < geometry.indices.length; i += 3) {
      triangles.push(
        [0, 1, 2].map((j) => {
          const offset = geometry.indices[i + j] * 2
          return {
            x: geometry.positions[offset],
            y: geometry.positions[offset + 1]
          }
        })
      )
    }
    return triangles
  })

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
  const faces = vectorFillTriangles(graphic)
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

const contourShape = (contours: Point[][]) => ({
  paths: contours.map((contour) => ({
    segments: contour.map((point, index) => {
      const next = contour[(index + 1) % contour.length]
      return {
        type: 'line' as const,
        points: [point.x, point.y, next.x, next.y]
      }
    })
  }))
})

// A fill rule is a coverage input, not a property of the chosen paint.
describe('paint-independent vector coverage', () => {
  it.each(['nonzero', 'evenodd'] as const)(
    'preserves declared %s coverage for same-winding holes',
    (rule) => {
      const shape = contourShape([
        rectangle(0, 0, 100, 100),
        rectangle(20, 20, 60, 60)
      ])
      const original = JSON.stringify(shape)
      const prepared = compoundFill.prepareVectorCompoundFill(shape, rule)
      expect(prepared.faces.reduce((sum, face) => sum + area(face), 0)).toBe(
        rule === 'evenodd' ? 6400 : 10000
      )
      expect(prepared.contains(50, 50)).toBe(rule === 'nonzero')
      expect(prepared.contains(10, 50)).toBe(true)
      expect(prepared.contains(110, 50)).toBe(false)
      expect(JSON.stringify(shape)).toBe(original)
    }
  )

  it('resolves evenodd overlap and nested islands without double filling', () => {
    const overlap = compoundFill.prepareVectorCompoundFill(
      contourShape([rectangle(0, 0, 50, 50), rectangle(25, 25, 50, 50)]),
      'evenodd'
    )
    expect(overlap.faces.reduce((sum, face) => sum + area(face), 0)).toBe(3750)
    expect(overlap.contains(30, 30)).toBe(false)
    expect(overlap.contains(10, 10)).toBe(true)
    const nested = compoundFill.prepareVectorCompoundFill(
      contourShape([
        rectangle(0, 0, 100, 100),
        rectangle(20, 20, 60, 60),
        rectangle(40, 40, 20, 20)
      ]),
      'evenodd'
    )
    expect(nested.faces.reduce((sum, face) => sum + area(face), 0)).toBe(6800)
    expect(nested.contains(50, 50)).toBe(true)
    expect(nested.contains(30, 50)).toBe(false)
  })

  it.each(['nonzero', 'evenodd'] as const)(
    'splits self-crossings and coincident edges using %s coverage',
    (rule) => {
      const bowtie = compoundFill.prepareVectorCompoundFill(
        contourShape([
          [
            { x: 0, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
            { x: 100, y: 0 }
          ]
        ]),
        rule
      )
      expect(bowtie.faces.reduce((sum, face) => sum + area(face), 0)).toBe(5000)
      expect(bowtie.contains(50, 10)).toBe(true)
      expect(bowtie.contains(10, 50)).toBe(false)
      const duplicate = compoundFill.prepareVectorCompoundFill(
        contourShape([rectangle(0, 0, 100, 100), rectangle(0, 0, 100, 100)]),
        rule
      )
      expect(duplicate.faces.reduce((sum, face) => sum + area(face), 0)).toBe(
        rule === 'evenodd' ? 0 : 10000
      )
      expect(duplicate.contains(50, 50)).toBe(rule === 'nonzero')
    }
  )

  it.each(['nonzero', 'evenodd'] as const)(
    'keeps empty %s coverage empty',
    (rule) => {
      const prepared = compoundFill.prepareVectorCompoundFill(
        { paths: [] },
        rule
      )
      expect(prepared.faces).toEqual([])
      expect(prepared.contains(0, 0)).toBe(false)
    }
  )
})
