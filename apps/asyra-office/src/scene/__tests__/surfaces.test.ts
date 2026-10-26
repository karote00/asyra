import { expect, it } from 'vitest'
import { createSurfaces } from '../surfaces'
it('constructs wall lettering from glyph runs without a rectangular backing or filled counters', async () => {
  const { vi } = await import('vitest')
  const { labelMeshes } = await import('../surfaces')
  const data = new Uint8ClampedArray(256 * 256 * 4)
  for (let y = 100; y < 160; y++)
    for (let x = 100; x < 140; x++)
      if (x < 105 || x >= 135 || y < 105 || y >= 155)
        data[(y * 256 + x) * 4 + 3] = 255
  const context = {
    fillRect: vi.fn(),
    fillText: vi.fn(),
    getImageData: () => ({ data })
  }
  const spy = vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue(context as unknown as CanvasRenderingContext2D)
  try {
    const [result] = labelMeshes([
      {
        kind: 'lettering',
        text: 'O',
        width: 0.4,
        height: 0.6,
        position: [0, 0, 0],
        rotation: 0,
        color: '#504838',
        background: 'transparent'
      }
    ])
    const descriptor = result.descriptor
    expect(descriptor.kind).toBe('mesh')
    if (descriptor.kind !== 'mesh' || descriptor.shape.kind !== 'triangles')
      throw new Error('Missing glyph triangles')
    expect(descriptor.surface).toBeUndefined()
    expect(context.fillRect).not.toHaveBeenCalled()
    const { positions, indices } = descriptor.shape
    expect(indices.length).toBeGreaterThan(6)
    for (let i = 0; i < indices.length; i += 3) {
      const vertices = indices
        .slice(i, i + 3)
        .map((j) => positions.slice(j * 3, j * 3 + 2))
      // Every triangle belongs to the border of the O, never its empty counter.
      expect(
        vertices.every((p) => Math.abs(p[0]) < 0.1 && Math.abs(p[1]) < 0.15)
      ).toBe(false)
      const cx = vertices.reduce((s, p) => s + p[0], 0) / 3,
        cy = vertices.reduce((s, p) => s + p[1], 0) / 3
      expect(Math.abs(cx) < 0.1 && Math.abs(cy) < 0.15).toBe(false)
    }
  } finally {
    spy.mockRestore()
  }
})
it('generates valid byte-range material pixels without baking directional light', () => {
  const surfaces = createSurfaces()
  for (const surface of Object.values(surfaces)) {
    expect(
      surface.albedo.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)
    ).toBe(true)
    expect(surface.normals.slice(0, 4)).toEqual([128, 128, 255, 255])
  }
})
it('maps the canvas top row to the top of a scene label', async () => {
  const { vi } = await import('vitest')
  const { labelMeshes } = await import('../surfaces')
  const context = {
    fillRect: vi.fn(),
    fillText: vi.fn(),
    getImageData: () => ({ data: new Uint8ClampedArray(256 * 256 * 4) })
  }
  const spy = vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue(context as unknown as CanvasRenderingContext2D)
  try {
    const [label] = labelMeshes([
      {
        text: 'Office',
        width: 1,
        height: 0.5,
        position: [0, 0, 0],
        rotation: 0,
        color: '#fff',
        background: '#333'
      }
    ])
    const shape = label.descriptor.shape
    expect(shape.kind).toBe('triangles')
    if (shape.kind === 'triangles')
      expect(shape.uvs).toEqual([0, 1, 1, 1, 1, 0, 0, 0])
  } finally {
    spy.mockRestore()
  }
})
