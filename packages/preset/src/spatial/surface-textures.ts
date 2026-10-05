import * as THREE from 'three'

export interface SpatialSurface {
  readonly width: number
  readonly height: number
  readonly albedo: readonly number[]
  readonly normals: readonly number[]
}
const admitted = new WeakSet<object>()
export function readSpatialSurface(value: unknown): SpatialSurface {
  if (value && typeof value === 'object' && admitted.has(value))
    return value as SpatialSurface
  if (!value || typeof value !== 'object')
    throw new Error('Invalid surface texture')
  const source = { ...value } as Record<string, unknown>
  const { width, height } = source
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    Number(width) < 2 ||
    Number(height) < 2 ||
    Number(width) > 512 ||
    Number(height) > 512
  )
    throw new Error('Invalid surface dimensions')
  const copy = (key: string) => {
    const data = source[key]
    if (
      !Array.isArray(data) ||
      data.length !== Number(width) * Number(height) * 4
    )
      throw new Error('Invalid surface pixels')
    const result = Array.from(data)
    if (!result.every((n) => Number.isInteger(n) && n >= 0 && n <= 255))
      throw new Error('Invalid surface pixels')
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

/** GPU textures are shared by live materials and released with their last owner. */
export class SurfaceTextureStore {
  private readonly entries = new Map<
    SpatialSurface,
    { map: THREE.DataTexture; normalMap: THREE.DataTexture; users: number }
  >()
  apply(material: THREE.MeshStandardMaterial, surface: SpatialSurface) {
    let entry = this.entries.get(surface)
    if (!entry) {
      const texture = (values: readonly number[]) => {
        const bytes = new Uint8Array(values.length)
        for (let i = 0; i < values.length; i++) bytes[i] = values[i]
        const result = new THREE.DataTexture(
          bytes,
          surface.width,
          surface.height
        )
        result.magFilter = THREE.LinearFilter
        result.minFilter = THREE.LinearMipmapLinearFilter
        result.generateMipmaps = true
        result.needsUpdate = true
        return result
      }
      entry = {
        map: texture(surface.albedo),
        normalMap: texture(surface.normals),
        users: 0
      }
      entry.map.colorSpace = THREE.SRGBColorSpace
      this.entries.set(surface, entry)
    }
    entry.users++
    material.map = entry.map
    material.normalMap = entry.normalMap
    material.normalScale.set(0.8, 0.8)
    const owned = entry
    const release = () => {
      material.removeEventListener('dispose', release)
      if (--owned.users === 0) {
        owned.map.dispose()
        owned.normalMap.dispose()
        this.entries.delete(surface)
      }
    }
    material.addEventListener('dispose', release)
  }
}
