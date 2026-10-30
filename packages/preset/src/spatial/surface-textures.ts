import * as THREE from 'three'
import type { SpatialSurface } from '@asyra/render-engine'

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
        for (let i = 0; i < values.length; i++) {
          bytes[i] = values[i]
        }
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
