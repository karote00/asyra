import core from '@asyra/core'
import { RenderGraphics } from '@asyra/render'
import { createDefaultFill } from '@asyra/utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { VECTOR_RENDER_STRATEGY } from '../components/vector.js'

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

describe('native vector material work', () => {
  afterEach(() => vi.restoreAllMocks())
  it('retains polygon coverage and native material without baking its bounding rectangle', () => {
    const raster = vi.spyOn(core, 'createEvenOddFillStyle')
    const data = dataFor()
    const original = JSON.stringify(data)
    const graphic = new RenderGraphics()
    const fillCall = vi.spyOn(graphic, 'fill')
    VECTOR_RENDER_STRATEGY(graphic, data)
    expect(graphic.batched).toBe(true)
    expect(raster).not.toHaveBeenCalled()
    expect(graphic.getDrawOperations().some((op) => op.type === 'rect')).toBe(
      false
    )
    expect(fillCall).toHaveBeenCalledWith(
      expect.objectContaining({
        fill: expect.objectContaining({
          __renderResourceDescriptor: expect.objectContaining({
            kind: 'gradient'
          })
        })
      })
    )
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
    expect(graphic.getDrawOperations()).toEqual(fresh.getDrawOperations())
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
    VECTOR_RENDER_STRATEGY(new RenderGraphics(), dataFor(points))
    expect(raster).toHaveBeenCalledOnce()
  })
  it.each(['radial', 'sharp', 'steep', 'alpha', 'degenerate'])(
    'keeps %s gradients on the established material evaluator',
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
      VECTOR_RENDER_STRATEGY(new RenderGraphics(), data)
      expect(raster).toHaveBeenCalledOnce()
    }
  )
})
