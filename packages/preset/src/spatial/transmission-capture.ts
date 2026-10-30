import * as THREE from 'three'
import { OpaqueFrame } from './opaque-frame.js'

interface CaptureBinding {
  layer: number
  enabled: { value: boolean }
  texture: { value: THREE.Texture | null }
  size: { value: THREE.Vector2 }
  compile: THREE.MeshPhysicalMaterial['onBeforeCompile']
  key: THREE.MeshPhysicalMaterial['customProgramCacheKey']
}

/** Ordered screen-space transmission using Three's native physical shader math. */
export class TransmissionCapture {
  private readonly opaqueFrame = new OpaqueFrame()
  private readonly bindings = new WeakMap<THREE.Material, CaptureBinding>()
  private readonly backFaces = new Map<
    THREE.MeshPhysicalMaterial,
    {
      material: THREE.MeshPhysicalMaterial
      version: number
      release: () => void
    }
  >()
  private readonly targets = new Map<number, THREE.WebGLRenderTarget>()

  apply(material: THREE.MeshPhysicalMaterial, layer: number | undefined): void {
    const previous = this.bindings.get(material)
    if (layer === undefined) {
      if (!previous) {
        return
      }
      material.onBeforeCompile = previous.compile
      material.customProgramCacheKey = previous.key
      this.bindings.delete(material)
      this.backFaces.get(material)?.release()
      material.needsUpdate = true
      return
    }
    if (previous) {
      previous.layer = layer
      return
    }
    const binding: CaptureBinding = {
      layer,
      enabled: { value: true },
      texture: { value: null },
      size: { value: new THREE.Vector2(1, 1) },
      compile: material.onBeforeCompile,
      key: material.customProgramCacheKey
    }
    this.bindings.set(material, binding)
    material.onBeforeCompile = (shader, renderer) => {
      binding.compile.call(material, shader, renderer)
      shader.uniforms.spatialCaptureEnabled = binding.enabled
      shader.uniforms.spatialTransmissionMap = binding.texture
      shader.uniforms.spatialTransmissionSize = binding.size
      // Change the source image only. Preserve native Fresnel, absorption and refraction.
      const chunk = THREE.ShaderChunk.transmission_pars_fragment.replace(
        'float lod = log2( transmissionSamplerSize.x )',
        `if ( spatialCaptureEnabled ) {
          float level = log2( spatialTransmissionSize.x ) * applyIorToRoughness( roughness, ior );
          return textureBicubic( spatialTransmissionMap, fragCoord.xy, level );
        }
        float lod = log2( transmissionSamplerSize.x )`
      )
      const uniforms = `
        uniform bool spatialCaptureEnabled;
        uniform sampler2D spatialTransmissionMap;
        uniform vec2 spatialTransmissionSize;
      `
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <transmission_pars_fragment>',
        uniforms + chunk
      )
    }
    material.customProgramCacheKey = () =>
      binding.key.call(material) + ':spatial-ordered-transmission-v2'
    material.needsUpdate = true
  }

  render(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    width: number,
    height: number,
    draw: (scene: THREE.Scene, camera: THREE.Camera) => void,
    finish?: () => void
  ): void {
    const objects: {
      mesh: THREE.Mesh
      material: THREE.MeshPhysicalMaterial
      order: number
      binding: CaptureBinding
    }[] = []
    scene.traverseVisible((object) => {
      if (!(object instanceof THREE.Mesh) || Array.isArray(object.material)) {
        return
      }
      const binding = this.bindings.get(object.material)
      if (
        binding &&
        (object.material as THREE.MeshPhysicalMaterial).transmission > 0
      ) {
        objects.push({
          mesh: object,
          material: object.material as THREE.MeshPhysicalMaterial,
          order: object.renderOrder,
          binding
        })
      }
    })
    const active = new Set(objects.map(({ material }) => material))
    for (const [source, entry] of this.backFaces) {
      if (!active.has(source)) {
        entry.release()
      }
    }
    const sceneLayers = new Set(objects.map(({ binding }) => binding.layer))
    scene.updateMatrixWorld()
    camera.updateMatrixWorld()
    const frustum = new THREE.Frustum().setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      )
    )
    const layers = [
      ...new Set(
        objects
          .filter(
            ({ mesh, material }) =>
              material.visible &&
              mesh.layers.test(camera.layers) &&
              (!mesh.frustumCulled || frustum.intersectsObject(mesh))
          )
          .map(({ binding }) => binding.layer)
      )
    ].sort((a, b) => a - b)
    for (const [layer, target] of this.targets) {
      if (sceneLayers.has(layer)) {
        continue
      }
      target.dispose()
      this.targets.delete(layer)
    }
    if (!layers.length) {
      finish?.()
      return
    }
    if (
      typeof renderer.getRenderTarget !== 'function' ||
      typeof renderer.setRenderTarget !== 'function'
    ) {
      throw new Error(
        'Ordered spatial transmission requires render-target support'
      )
    }
    for (const layer of layers) {
      let target = this.targets.get(layer)
      if (!target) {
        target = new THREE.WebGLRenderTarget(width, height, {
          type: THREE.HalfFloatType,
          minFilter: THREE.LinearMipmapLinearFilter,
          generateMipmaps: true,
          samples: 4
        })
        this.targets.set(layer, target)
      }
      target.setSize(width, height)
      for (const { binding } of objects) {
        if (binding.layer !== layer) {
          continue
        }
        binding.texture.value = target.texture
        binding.size.value.set(width, height)
      }
    }
    const consume = () => {
      const firstOrder = Math.min(0, ...objects.map(({ order }) => order)) - 1
      const previous = {
        target: renderer.getRenderTarget(),
        face: renderer.getActiveCubeFace(),
        mip: renderer.getActiveMipmapLevel(),
        tone: renderer.toneMapping,
        clear: renderer.autoClear,
        xr: renderer.xr.enabled
      }
      try {
        renderer.xr.enabled = false
        renderer.autoClear = true
        renderer.toneMapping = THREE.NoToneMapping
        for (const layer of layers) {
          for (const { mesh, material, order, binding } of objects) {
            mesh.visible = binding.layer !== layer
            binding.enabled.value = binding.layer < layer
            mesh.material =
              binding.layer > layer ? this.backFace(material) : material
            mesh.renderOrder =
              binding.layer > layer ? firstOrder - binding.layer : order
          }
          const target = this.targets.get(layer)
          if (!target) {
            throw new Error('Missing optical capture target')
          }
          renderer.setRenderTarget(target)
          draw(scene, camera)
        }
      } finally {
        for (const { mesh, material, order, binding } of objects) {
          mesh.visible = true
          binding.enabled.value = true
          mesh.material = material
          mesh.renderOrder = order
        }
        renderer.toneMapping = previous.tone
        renderer.autoClear = previous.clear
        renderer.xr.enabled = previous.xr
        renderer.setRenderTarget(previous.target, previous.face, previous.mip)
      }
      finish?.()
    }
    if (layers.length > 1 && finish) {
      this.opaqueFrame.render(
        renderer,
        scene,
        camera,
        width,
        height,
        draw,
        consume
      )
    } else {
      consume()
    }
  }

  private backFace(
    source: THREE.MeshPhysicalMaterial
  ): THREE.MeshPhysicalMaterial {
    let entry = this.backFaces.get(source)
    if (!entry) {
      const material = source.clone()
      const release = () => {
        source.removeEventListener('dispose', release)
        material.dispose()
        this.backFaces.delete(source)
      }
      entry = { material, version: source.version, release }
      this.backFaces.set(source, entry)
      source.addEventListener('dispose', release)
    }
    const material = entry.material
    material.copy(source)
    material.onBeforeCompile = source.onBeforeCompile
    material.customProgramCacheKey = source.customProgramCacheKey
    material.side = THREE.BackSide
    material.depthWrite = false
    if (entry.version !== source.version) {
      material.needsUpdate = true
      entry.version = source.version
    }
    return material
  }

  dispose(): void {
    this.opaqueFrame.dispose()
    for (const entry of [...this.backFaces.values()]) {
      entry.release()
    }
    for (const target of this.targets.values()) {
      target.dispose()
    }
    this.targets.clear()
  }
}
