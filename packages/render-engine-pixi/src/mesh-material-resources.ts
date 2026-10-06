import type { RenderEngineMeshMaterial } from '@asyra/render-engine'
import { BufferImageSource, Texture, type TextureSource } from 'pixi.js'
import { encodeMeshMaterialBytes } from './mesh-material.js'

export const meshMaterialSources = new WeakSet<TextureSource>()

/** Immutable material values are shared only for the lifetime of this engine. */
export class MeshMaterialResources {
  private entries = new Map<string, { texture: Texture; users: number }>()

  acquire(material: RenderEngineMeshMaterial) {
    const key = JSON.stringify(material)
    let entry = this.entries.get(key)
    if (!entry) {
      const encoded = encodeMeshMaterialBytes(material)
      const source = new BufferImageSource({
        resource: encoded.data,
        width: encoded.width,
        height: encoded.height,
        format: 'rgba8unorm',
        // Bytes are uploaded unchanged; the shader returns premultiplied color.
        alphaMode: 'premultiplied-alpha',
        scaleMode: 'nearest',
        autoGenerateMipmaps: false
      })
      meshMaterialSources.add(source)
      entry = { texture: new Texture({ source }), users: 0 }
      this.entries.set(key, entry)
    }
    entry.users++
    return { key, texture: entry.texture }
  }

  release(key: string): void {
    const entry = this.entries.get(key)
    if (!entry) return
    if (--entry.users === 0) {
      entry.texture.destroy(true)
      this.entries.delete(key)
    }
  }
}
