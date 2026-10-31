import type { SpatialSurface } from '@asyra/render-engine'
export type { SpatialSurface } from '@asyra/render-engine'

const admitted = new WeakSet<object>()
export function readSpatialSurface(value: unknown): SpatialSurface {
  if (value && typeof value === 'object' && admitted.has(value)) {
    return value as SpatialSurface
  }
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid surface texture')
  }
  const source = { ...value } as Record<string, unknown>
  const { width, height } = source
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    Number(width) < 2 ||
    Number(height) < 2 ||
    Number(width) > 512 ||
    Number(height) > 512
  ) {
    throw new Error('Invalid surface dimensions')
  }
  const copy = (key: string) => {
    const data = source[key]
    if (
      !Array.isArray(data) ||
      data.length !== Number(width) * Number(height) * 4
    ) {
      throw new Error('Invalid surface pixels')
    }
    const result = Array.from(data)
    if (!result.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
      throw new Error('Invalid surface pixels')
    }
    return Object.freeze(result) as readonly number[]
  }
  const result = Object.freeze({
    width: Number(width),
    height: Number(height),
    albedo: copy('albedo'),
    normals: copy('normals')
  })
  admitted.add(result)
  return result
}
