import * as THREE from 'three'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import type { SpatialBloom } from './lighting.js'

/** Concrete SDK boundary: bloom requires render-target and renderer-state APIs. */
export function requireBloomRenderer(driver: unknown): THREE.WebGLRenderer {
  const candidate = driver as Record<string, unknown>
  for (const method of [
    'getRenderTarget',
    'setRenderTarget',
    'getClearColor',
    'getClearAlpha',
    'setClearColor',
    'render',
    'clear'
  ])
    if (typeof candidate[method] !== 'function')
      throw new Error(`Spatial bloom requires renderer method ${method}`)
  return driver as THREE.WebGLRenderer
}

const vertexShader = `varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`
const blur = `uniform sampler2D source;
uniform vec2 stepUV;
varying vec2 vUv;
vec3 blurred() {
  vec3 sum = vec3(0.0); float weights = 0.0;
  for (int i = -6; i <= 6; i++) {
    float x = float(i); float weight = exp(-0.5 * x * x / 9.0);
    sum += texture2D(source, vUv + x * stepUV).rgb * weight;
    weights += weight;
  }
  return sum / weights;
}`

/** Emission-only screen bloom; normal scene and overlay rendering remain unchanged. */
export class EmissiveBloom {
  private readonly maskTarget = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType
  })
  private readonly blurTarget = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    depthBuffer: false
  })
  private readonly horizontal = new THREE.ShaderMaterial({
    uniforms: {
      source: { value: this.maskTarget.texture },
      stepUV: { value: new THREE.Vector2() }
    },
    vertexShader,
    fragmentShader:
      blur + '\nvoid main() { gl_FragColor = vec4(blurred(), 1.0); }',
    depthTest: false,
    depthWrite: false,
    toneMapped: false
  })
  private readonly composite = new THREE.ShaderMaterial({
    uniforms: {
      source: { value: this.blurTarget.texture },
      stepUV: { value: new THREE.Vector2() },
      strength: { value: 0 }
    },
    vertexShader,
    fragmentShader:
      blur +
      `
uniform float strength;
void main() {
  gl_FragColor = vec4(blurred(), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  gl_FragColor.rgb *= strength;
}`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false
  })
  private readonly quad = new FullScreenQuad(this.horizontal)
  private readonly masks = new Map<
    THREE.Material,
    { material: THREE.MeshBasicMaterial; release: () => void }
  >()
  private disposed = false

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly settings: SpatialBloom
  ) {
    this.composite.uniforms.strength.value = settings.strength
  }

  setSize(width: number, height: number, pixelRatio: number): void {
    const w = Math.max(1, Math.round(width * pixelRatio))
    const h = Math.max(1, Math.round(height * pixelRatio))
    this.maskTarget.setSize(w, h)
    this.blurTarget.setSize(w, h)
    this.horizontal.uniforms.stepUV.value.set(
      (this.settings.radius * pixelRatio) / (6 * w),
      0
    )
    this.composite.uniforms.stepUV.value.set(
      0,
      (this.settings.radius * pixelRatio) / (6 * h)
    )
  }

  private mask(source: THREE.Material): THREE.MeshBasicMaterial {
    let entry = this.masks.get(source)
    if (!entry) {
      const material = new THREE.MeshBasicMaterial({
        color: 0,
        toneMapped: false
      })
      const release = () => {
        source.removeEventListener('dispose', release)
        material.dispose()
        this.masks.delete(source)
      }
      entry = { material, release }
      this.masks.set(source, entry)
      source.addEventListener('dispose', release)
    }
    const material = entry.material
    const transparent = source.transparent
    if (material.transparent !== transparent || material.side !== source.side)
      material.needsUpdate = true
    material.transparent = transparent
    material.opacity = source.opacity
    material.side = source.side
    material.depthTest = source.depthTest
    material.depthWrite = source.depthWrite
    material.visible = source.visible
    material.color.setHex(0)
    if (source instanceof THREE.MeshStandardMaterial)
      material.color
        .copy(source.emissive)
        .multiplyScalar(source.emissiveIntensity)
    return material
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    if (this.disposed) throw new Error('Spatial bloom is disposed')
    if (this.settings.strength === 0) return
    const renderer = this.renderer
    const target = renderer.getRenderTarget()
    const clearColor = renderer.getClearColor(new THREE.Color()).clone()
    const clearAlpha = renderer.getClearAlpha()
    const autoClear = renderer.autoClear
    const background = scene.background
    const shadowUpdate = renderer.shadowMap?.autoUpdate
    const originals: [THREE.Mesh, THREE.Material | THREE.Material[]][] = []
    try {
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        originals.push([object, object.material])
        object.material = Array.isArray(object.material)
          ? object.material.map((material) => this.mask(material))
          : this.mask(object.material)
      })
      scene.background = null
      renderer.autoClear = false
      if (renderer.shadowMap) renderer.shadowMap.autoUpdate = false
      renderer.setClearColor(0, 0)
      renderer.setRenderTarget(this.maskTarget)
      renderer.clear()
      renderer.render(scene, camera)
      renderer.setRenderTarget(this.blurTarget)
      renderer.clear()
      this.quad.material = this.horizontal
      this.quad.render(renderer)
      renderer.setRenderTarget(target)
      this.quad.material = this.composite
      this.quad.render(renderer)
    } finally {
      for (const [object, material] of originals) object.material = material
      scene.background = background
      renderer.autoClear = autoClear
      if (renderer.shadowMap && shadowUpdate !== undefined)
        renderer.shadowMap.autoUpdate = shadowUpdate
      renderer.setClearColor(clearColor, clearAlpha)
      renderer.setRenderTarget(target)
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    for (const { release } of [...this.masks.values()]) release()
    this.maskTarget.dispose()
    this.blurTarget.dispose()
    this.horizontal.dispose()
    this.composite.dispose()
    this.quad.dispose()
  }
}
