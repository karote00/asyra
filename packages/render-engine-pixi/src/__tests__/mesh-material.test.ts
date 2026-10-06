import { describe, expect, it } from 'vitest'
import type { RenderEngineMeshMaterial } from '@asyra/render-engine'
import { encodeMeshMaterial } from '../mesh-material.js'

const material: RenderEngineMeshMaterial = {
  fills: [
    {
      kind: 'gradient',
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
      stops: [
        { position: 0, color: [1, 0, 0, 1] },
        { position: 1, color: [0, 0, 1, 0.5] }
      ]
    }
  ]
}

describe('analytic mesh material parameters', () => {
  it('stores stop parameters instead of an image sized by object pixels', () => {
    const original = JSON.stringify(material)
    const encoded = encodeMeshMaterial(material)
    expect(encoded.texels).toBe(8)
    expect(encoded.data.length).toBe(encoded.width * encoded.height * 4)
    expect(encoded.data.length).toBeLessThanOrEqual(64)
    expect(encoded.data[0]).toBe(1)
    expect(JSON.stringify(material)).toBe(original)
  })
  it('preserves equal-position stops and alpha without a sampled color ramp', () => {
    const encoded = encodeMeshMaterial({
      fills: [
        {
          ...material.fills[0],
          kind: 'gradient',
          type: 'linear',
          start: { x: 0, y: 0 },
          end: { x: 1, y: 0 },
          stops: [
            { position: 0.5, color: [1, 0, 0, 0.25] },
            { position: 0.5, color: [0, 1, 0, 0.75] }
          ]
        }
      ]
    })
    expect([...encoded.data.slice(16, 32)]).toEqual([
      0.5, 0, 0, 0, 1, 0, 0, 0.25, 0.5, 0, 0, 0, 0, 1, 0, 0.75
    ])
  })
  it('rejects invalid material values before allocating engine resources', () => {
    expect(() =>
      encodeMeshMaterial({ fills: [{ kind: 'solid', color: [NaN, 0, 0, 1] }] })
    ).toThrow(/finite/)
  })
  it('keeps all layers and grows with stops rather than imposing a stop limit', () => {
    const encoded = encodeMeshMaterial({
      fills: [
        { kind: 'solid', color: [1, 1, 1, 1] },
        {
          kind: 'gradient',
          type: 'radial',
          start: { x: 0.5, y: 0.5 },
          end: { x: 1, y: 0.5 },
          stops: Array.from({ length: 200 }, (_, i) => ({
            position: i / 199,
            color: [1, 0, 0, 1] as const
          }))
        }
      ]
    })
    expect(encoded.data[0]).toBe(2)
    expect(encoded.texels).toBe(409)
  })
})

it('preserves parameter bits in portable RGBA8 storage', async () => {
  const { encodeMeshMaterialBytes } = await import('../mesh-material.js')
  const expected = encodeMeshMaterial(material)
  const encoded = encodeMeshMaterialBytes(material)
  const view = new DataView(encoded.data.buffer)
  expect(Array.from(expected.data)).toEqual(
    Array.from(expected.data, (_, index) => view.getFloat32(index * 4, true))
  )
  expect(encoded.width * encoded.height * 4).toBe(encoded.data.length)
})

it('shares identical material uploads and releases only after the last owner', async () => {
  const { MeshMaterialResources } =
    await import('../mesh-material-resources.js')
  const resources = new MeshMaterialResources()
  const a = resources.acquire(material)
  const b = resources.acquire(structuredClone(material))
  expect(a.texture).toBe(b.texture)
  const source = a.texture.source
  resources.release(a.key)
  expect(a.texture.destroyed).toBe(false)
  const changed = resources.acquire({
    fills: [{ kind: 'solid', color: [0, 1, 0, 1] }]
  })
  expect(changed.texture).not.toBe(a.texture)
  resources.release(b.key)
  expect(a.texture.destroyed).toBe(true)
  expect(source.destroyed).toBe(true)
  resources.release(changed.key)
  expect(changed.texture.destroyed).toBe(true)
})

it('rejects non-normalized channels and numbers that overflow GPU parameters', () => {
  for (const color of [
    [2, 0, 0, 1],
    [-0.1, 0, 0, 1],
    [0, 0, 0, 1.1]
  ]) {
    expect(() =>
      encodeMeshMaterial({
        fills: [
          { kind: 'solid', color: color as [number, number, number, number] }
        ]
      })
    ).toThrow(/color/)
  }
  expect(() =>
    encodeMeshMaterial({
      fills: [
        {
          kind: 'gradient',
          type: 'linear',
          start: { x: 1e100, y: 0 },
          end: { x: 1, y: 0 },
          stops: []
        }
      ]
    })
  ).toThrow(/finite/)
})

it('packs long stop lists within the portable texture row width', async () => {
  const { encodeMeshMaterialBytes } = await import('../mesh-material.js')
  const encoded = encodeMeshMaterialBytes({
    fills: [
      {
        kind: 'gradient',
        type: 'linear',
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        stops: Array.from({ length: 700 }, (_, i) => ({
          position: i / 699,
          color: [1, 0, 0, 1] as const
        }))
      }
    ]
  })
  expect(encoded.width).toBeLessThanOrEqual(4096)
  expect(encoded.height).toBeGreaterThan(1)
})
