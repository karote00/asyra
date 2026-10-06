import { describe, expect, it } from 'vitest'
import {
  buildProjectionMeshData,
  createMeshProjection
} from '../projections/mesh-projection.js'
import { RenderContainer, RenderMesh } from '../types/render-object.js'

describe('mesh projection', () => {
  it('triangulates polygon geometry into indexed mesh data', () => {
    const meshData = buildProjectionMeshData({
      polygons: [
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 }
        ],
        [
          { x: 12, y: 0 },
          { x: 20, y: 0 },
          { x: 20, y: 8 },
          { x: 12, y: 8 }
        ]
      ]
    })

    expect(meshData).not.toBeNull()
    expect(meshData?.vertices.length).toBe(16)
    expect(meshData?.indices.length).toBe(12)
    expect(meshData?.uvs.length).toBe(meshData?.vertices.length)
    expect(meshData?.bounds).toEqual({
      minX: 0,
      minY: 0,
      maxX: 20,
      maxY: 10
    })
  })

  it('keeps concave polygon triangulation valid while using convex fast paths', () => {
    const convexMeshData = buildProjectionMeshData({
      polygons: [
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 12, y: 8 },
          { x: 4, y: 14 },
          { x: -2, y: 6 }
        ]
      ]
    })
    const concaveMeshData = buildProjectionMeshData({
      polygons: [
        [
          { x: 0, y: 0 },
          { x: 12, y: 0 },
          { x: 12, y: 12 },
          { x: 6, y: 6 },
          { x: 0, y: 12 }
        ]
      ]
    })

    expect(convexMeshData).not.toBeNull()
    expect(convexMeshData?.vertices.length).toBe(10)
    expect(convexMeshData?.indices.length).toBe(9)
    expect(concaveMeshData).not.toBeNull()
    expect(concaveMeshData?.vertices.length).toBe(10)
    expect(concaveMeshData?.indices.length).toBeGreaterThanOrEqual(9)
  })

  it('projects solid geometry through engine-neutral render objects', () => {
    const host = new RenderContainer()
    const projection = createMeshProjection({
      model: {
        polygons: [
          [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 }
          ],
          [
            { x: 12, y: 0 },
            { x: 20, y: 0 },
            { x: 20, y: 8 },
            { x: 12, y: 8 }
          ]
        ]
      },
      paint: {
        kind: 'solid',
        color: 0x00ff00,
        alpha: 0.5
      }
    })

    expect(projection.attach(host)).toBe(true)
    expect(host.children).toHaveLength(1)
    expect(host.children[0]).toBeInstanceOf(RenderContainer)

    const root = host.children[0] as RenderContainer
    expect(root.children).toHaveLength(1)
    expect(root.children[0]).toBeInstanceOf(RenderMesh)

    const mesh = root.children[0] as RenderMesh
    const initialProperties = mesh.getEngineProperties()
    const initialGeometry = initialProperties.geometry as {
      positions: Float32Array
      indices: Uint32Array
      uvs: Float32Array
    }
    expect(initialProperties.tint).toBe(0x00ff00)
    expect(initialProperties.alpha).toBe(0.5)
    expect(initialGeometry.positions.length).toBe(16)
    expect(initialGeometry.indices.length).toBe(12)

    projection.update({
      model: {
        polygons: [
          [
            { x: 20, y: 20 },
            { x: 30, y: 20 },
            { x: 30, y: 30 },
            { x: 20, y: 30 }
          ]
        ]
      },
      paint: {
        kind: 'solid',
        color: 0xff0000,
        alpha: 1
      }
    })

    const updatedProperties = mesh.getEngineProperties()
    const updatedGeometry = updatedProperties.geometry as {
      positions: Float32Array
      indices: Uint32Array
      uvs: Float32Array
    }
    expect(updatedProperties.tint).toBe(0xff0000)
    expect(updatedProperties.alpha).toBe(1)
    expect(updatedGeometry).not.toBe(initialGeometry)
    expect(updatedGeometry.positions.length).toBe(8)
    expect(updatedGeometry.indices.length).toBe(6)

    projection.dispose()
    expect(host.children).toHaveLength(0)
  })

  it('detaches and destroys disposed engine-neutral projections', () => {
    const host = new RenderContainer()
    const projection = createMeshProjection({
      model: {
        polygons: [
          [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 }
          ]
        ]
      },
      paint: {
        kind: 'solid',
        color: 0x00ff00,
        alpha: 1
      }
    })

    expect(projection.attach(host)).toBe(true)
    const root = host.children[0] as RenderContainer

    projection.dispose()

    expect(host.children).toHaveLength(0)
    expect(root.visible).toBe(false)
    expect(root.children).toHaveLength(0)
  })
})

it('updates complete mesh materials without rebuilding geometry and clears old paint on a solid edit', () => {
  const host = new RenderContainer()
  const projection = createMeshProjection({
    model: {
      polygons: [
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 }
        ]
      ]
    },
    paint: { kind: 'solid', color: 0xff0000, alpha: 1 }
  })
  projection.attach(host)
  const mesh = host.children[0].children[0] as RenderMesh
  const geometry = mesh.getEngineProperties().geometry
  const material = {
    fills: [{ kind: 'solid' as const, color: [0, 1, 0, 0.5] as const }]
  }
  projection.updatePaint({ kind: 'material', material })
  expect(mesh.getEngineProperties()).toMatchObject({
    material,
    tint: 0xffffff,
    alpha: 1
  })
  expect(mesh.getEngineProperties().geometry).toBe(geometry)
  projection.updatePaint({ kind: 'solid', color: 0x0000ff, alpha: 0.25 })
  expect(mesh.getEngineProperties()).toMatchObject({
    material: null,
    tint: 0x0000ff,
    alpha: 0.25
  })
  expect(mesh.getEngineProperties().geometry).toBe(geometry)
  projection.dispose()
  expect(host.children).toHaveLength(0)
})

it('rejects material delivery to an engine without the required capability', async () => {
  const { RecordingRenderEngine } = await import('@asyra/render-engine/testing')
  const { RenderObjectRuntime } = await import('../types/render-object.js')
  const engine = new RecordingRenderEngine({
    name: 'solid-only',
    capabilities: ['objects']
  })
  const initialized = engine.initialize({ host: {}, width: 100, height: 100 })
  const runtime = new RenderObjectRuntime(engine, initialized.root)
  const mesh = new RenderMesh({
    material: { fills: [{ kind: 'solid', color: [1, 0, 0, 1] }] }
  })
  expect(() => runtime.attachNode(mesh)).toThrow(/mesh-materials/)
  expect(
    engine
      .getOperations()
      .filter((operation) => operation.type === 'create-object')
  ).toHaveLength(0)
})
