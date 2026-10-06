import core from '@asyra/core'
import { RenderGraphics, RenderMesh } from '@asyra/render'
import { createDefaultFill } from '@asyra/utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { VECTOR_RENDER_STRATEGY } from '../components/vector.js'
import * as coverage from '../components/vector-compound-fill.js'

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

const meshOf = (graphic: RenderGraphics): RenderMesh => {
  const meshes = graphic.children
    .flatMap((child) => child.children)
    .filter((child) => child instanceof RenderMesh)
  expect(meshes).toHaveLength(1)
  return meshes[0] as RenderMesh
}

describe('retained vector coverage and material', () => {
  afterEach(() => vi.restoreAllMocks())
  it('uses the same mesh coverage for all materials without CPU rasterization', () => {
    const raster = vi.spyOn(core, 'createEvenOddFillStyle')
    for (const type of ['linear', 'radial', 'angular', 'diamond'] as const) {
      const data = dataFor()
      const gradient = data.fills[0].gradient
      if (!gradient) throw new Error('Missing gradient fixture')
      gradient.gradientType = type
      data.fills[0].opacity = 0.5
      const source = JSON.stringify(data)
      const graphic = new RenderGraphics()
      VECTOR_RENDER_STRATEGY(graphic, data)
      expect(meshOf(graphic).getEngineProperties().material).toMatchObject({
        fills: [{ kind: 'gradient', type }]
      })
      expect(graphic.hitArea?.contains(40, 50)).toBe(true)
      expect(graphic.hitArea?.contains(0, 99)).toBe(false)
      expect(JSON.stringify(data)).toBe(source)
      graphic.destroy()
    }
    expect(raster).not.toHaveBeenCalled()
  })
  it('retains coverage for paint and transform edits, and invalidates geometry or fill-rule edits', () => {
    const prepare = vi.spyOn(coverage, 'prepareVectorCompoundFill')
    const data = dataFor()
    const graphic = new RenderGraphics()
    VECTOR_RENDER_STRATEGY(graphic, data)
    const mesh = meshOf(graphic)
    const geometry = mesh.getEngineProperties().geometry
    expect(prepare).toHaveBeenCalledTimes(1)
    VECTOR_RENDER_STRATEGY(graphic, {
      ...data,
      fills: [createDefaultFill({ color: '#00ff00' })]
    })
    expect(meshOf(graphic)).toBe(mesh)
    expect(mesh.getEngineProperties().geometry).toBe(geometry)
    VECTOR_RENDER_STRATEGY(graphic, { ...data, x: 123, rotation: 0.3 })
    expect(prepare).toHaveBeenCalledTimes(1)
    VECTOR_RENDER_STRATEGY(graphic, { ...data, fillRule: 'nonzero' })
    expect(prepare).toHaveBeenCalledTimes(2)
    VECTOR_RENDER_STRATEGY(graphic, {
      ...data,
      points: { ...data.points, p0: { ...data.points.p0, x: 21 } }
    })
    expect(prepare).toHaveBeenCalledTimes(3)
    expect(mesh.getEngineProperties().geometry).not.toBe(geometry)
    VECTOR_RENDER_STRATEGY(graphic, { ...data, networks: {} })
    expect(graphic.children.every((child) => !child.visible)).toBe(true)
    graphic.destroy()
    expect(graphic.children).toHaveLength(0)
  })
})

it('uses the existing constant mesh paint without a parameter texture for one solid layer', () => {
  const graphic = new RenderGraphics()
  const data = {
    ...dataFor(),
    fills: [createDefaultFill({ color: '#ff0000', opacity: 0.5 })]
  }
  VECTOR_RENDER_STRATEGY(graphic, data)
  expect(meshOf(graphic).getEngineProperties()).toMatchObject({
    material: null,
    tint: 0xff0000,
    alpha: 0.5
  })
  expect(graphic.hitArea?.contains(40, 50)).toBe(true)
  graphic.destroy()
})
