import core from '@asyra/core'
import { RenderGraphics, RenderMesh } from '@asyra/render'
import { createDefaultFill } from '@asyra/utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { VECTOR_RENDER_STRATEGY } from '../components/vector.js'

import type { RenderEngineMeshMaterial } from '@asyra/render-engine'

// Self-contained observer: the source-proof runner captures this test file.
const vectorFillMeshes = (graphic: RenderGraphics): RenderMesh[] =>
  graphic.children
    .flatMap((child) => child.children)
    .filter((child): child is RenderMesh => child instanceof RenderMesh)

const vectorFillMaterial = (graphic: RenderGraphics) =>
  vectorFillMeshes(graphic)[0]?.getEngineProperties().material as
    RenderEngineMeshMaterial | undefined

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

const gradient = () =>
  createDefaultFill({
    kind: 'gradient',
    opacity: 1,
    gradient: {
      gradientType: 'linear',
      gradientHandles: [
        { x: 0, y: 0 },
        { x: 1, y: 0.3 }
      ],
      gradientStops: [
        { position: 0, color: '#31545d', opacity: 1 },
        { position: 0.5, color: '#557b80', opacity: 1 },
        { position: 1, color: '#294b55', opacity: 1 }
      ]
    }
  })
const dataFor = (
  vertices = [
    [20, 30],
    [100, 30],
    [90, 130],
    [30, 130]
  ]
) => {
  const ids = vertices.map((_, index) => `p${index}`)
  const segmentIds = ids.map((id) => `s${id}`)
  return {
    id: 'vector',
    type: 'vector',
    name: 'Vector',
    parentId: 'workspace',
    visible: true,
    lock: false,
    x: 20,
    y: 30,
    width: 80,
    height: 100,
    rotation: 0,
    closed: true,
    pointCoordinateSpace: 'workspace' as const,
    fillRule: 'evenodd',
    fills: [gradient()],
    strokes: [],
    points: Object.fromEntries(
      ids.map((id, index) => [
        id,
        {
          id,
          kind: 'anchor',
          anchorType: 'sharp',
          handleMode: 'none',
          x: vertices[index][0],
          y: vertices[index][1]
        }
      ])
    ),
    segments: Object.fromEntries(
      segmentIds.map((id, index) => [
        id,
        { id, startId: ids[index], endId: ids[(index + 1) % ids.length] }
      ])
    ),
    networks: { n: { id: 'n', pointIds: ids, segmentIds, closed: true } }
  }
}

describe('unified vector material work', () => {
  afterEach(() => vi.restoreAllMocks())
  it('retains polygon coverage and analytic material without baking its bounding rectangle', () => {
    const raster = vi.spyOn(core, 'createEvenOddFillStyle')
    const data = dataFor()
    const original = JSON.stringify(data)
    const graphic = new RenderGraphics()
    VECTOR_RENDER_STRATEGY(graphic, data)
    expect(graphic.batched).toBe(true)
    expect(raster).not.toHaveBeenCalled()
    expect(graphic.getDrawOperations().some((op) => op.type === 'rect')).toBe(
      false
    )
    expect(vectorFillMaterial(graphic)).toMatchObject({
      fills: [{ kind: 'gradient', type: 'linear', stops: expect.any(Array) }]
    })
    expect(vectorFillTriangles(graphic).length).toBeGreaterThan(0)
    expect(graphic.hitArea?.contains(40, 50)).toBe(true)
    expect(graphic.hitArea?.contains(0, 99)).toBe(false)
    expect(JSON.stringify(data)).toBe(original)
    const changed = {
      ...data,
      fills: [createDefaultFill({ color: '#ff0000' })]
    }
    VECTOR_RENDER_STRATEGY(graphic, changed)
    const fresh = new RenderGraphics()
    VECTOR_RENDER_STRATEGY(fresh, changed)
    expect(vectorFillMaterial(graphic)).toEqual(vectorFillMaterial(fresh))
  })
  it('preserves material for dimension roundoff without changing the source', () => {
    const raster = vi
      .spyOn(core, 'createEvenOddFillStyle')
      .mockReturnValue(null)
    for (const axis of ['width', 'height'] as const) {
      const data = dataFor([
        [8000.1, 20000.2],
        [8143.470889656126, 20000.2],
        [8143.470889656126, 20285.092074066404],
        [8000.1, 20285.092074066404]
      ])
      data.width = 8143.470889656126 - 8000.1
      data.height = 20285.092074066404 - 20000.2
      data[axis] *= 1 - 40 * Number.EPSILON
      const before = JSON.stringify(data)
      VECTOR_RENDER_STRATEGY(new RenderGraphics(), data)
      expect(JSON.stringify(data)).toBe(before)
    }
    expect(raster).not.toHaveBeenCalled()
  })

  it('preserves actual size differences without raster routing', () => {
    const raster = vi
      .spyOn(core, 'createEvenOddFillStyle')
      .mockReturnValue(null)
    for (const axis of ['width', 'height'] as const) {
      const data = dataFor()
      data[axis] *= 1 + 1e-9
      VECTOR_RENDER_STRATEGY(new RenderGraphics(), data)
    }
    // An absolute tolerance must not swallow a large relative change in tiny geometry.
    const tiny = dataFor([
      [0, 0],
      [1e-10, 0],
      [1e-10, 1e-10],
      [0, 1e-10]
    ])
    tiny.width = 2e-10
    tiny.height = 1e-10
    VECTOR_RENDER_STRATEGY(new RenderGraphics(), tiny)
    expect(raster).not.toHaveBeenCalled()
  })

  it.each([
    {
      name: 'concave',
      points: [
        [0, 0],
        [80, 0],
        [20, 20],
        [80, 100],
        [0, 100]
      ]
    },
    {
      name: 'crossed',
      points: [
        [0, 0],
        [80, 100],
        [80, 0],
        [0, 100]
      ]
    },
    {
      name: 'star',
      points: Array.from({ length: 5 }, (_, i) => {
        const a = (i * 4 * Math.PI) / 5
        return [40 + 40 * Math.cos(a), 50 + 50 * Math.sin(a)]
      })
    }
  ])('preserves canonical coverage for $name contours', ({ points }) => {
    const raster = vi
      .spyOn(core, 'createEvenOddFillStyle')
      .mockReturnValue(null)
    const graphic = new RenderGraphics()
    const source = dataFor(points)
    const before = JSON.stringify(source)
    VECTOR_RENDER_STRATEGY(graphic, source)
    expect(vectorFillTriangles(graphic).length).toBeGreaterThan(0)
    expect(vectorFillMaterial(graphic)?.fills[0].kind).toBe('gradient')
    expect(JSON.stringify(source)).toBe(before)
    expect(raster).not.toHaveBeenCalled()
  })
  it.each(['radial', 'sharp', 'steep', 'alpha', 'degenerate'])(
    'keeps %s gradients on the unified material evaluator',
    (kind) => {
      const raster = vi
        .spyOn(core, 'createEvenOddFillStyle')
        .mockReturnValue(null)
      const data = dataFor()
      const fill = data.fills[0]
      if (!fill.gradient) throw new Error('Gradient fixture missing')
      if (kind === 'radial') fill.gradient.gradientType = 'radial'
      if (kind === 'steep') {
        fill.gradient.gradientStops[1].position = 0.01
        fill.gradient.gradientStops[1].color = '#ffffff'
      }
      if (kind === 'sharp') fill.gradient.gradientStops[1].position = 0
      if (kind === 'alpha') fill.gradient.gradientStops[1].opacity = 0.5
      if (kind === 'degenerate')
        fill.gradient.gradientHandles[1] = { x: 0, y: 0 }
      const graphic = new RenderGraphics()
      VECTOR_RENDER_STRATEGY(graphic, data)
      expect(vectorFillMaterial(graphic)).toMatchObject({
        fills: [
          {
            kind: 'gradient',
            type: fill.gradient.gradientType,
            start: fill.gradient.gradientHandles[0],
            end: fill.gradient.gradientHandles[1],
            stops: fill.gradient.gradientStops.map((stop) => ({
              position: stop.position
            }))
          }
        ]
      })
      expect(raster).not.toHaveBeenCalled()
    }
  )
})
