import * as THREE from 'three'

/** Reuse opaque radiance and depth only within one ordered optical flush. */
export class OpaqueFrame {
  private target?: THREE.WebGLRenderTarget
  private readonly material = new THREE.ShaderMaterial({
    uniforms: {
      radiance: { value: null as THREE.Texture | null },
      depth: { value: null as THREE.Texture | null }
    },
    vertexShader: `varying vec2 uvFrame;
void main() { uvFrame = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `uniform sampler2D radiance;
uniform sampler2D depth;
varying vec2 uvFrame;
void main() {
  gl_FragColor = texture2D(radiance, uvFrame);
  gl_FragDepth = texture2D(depth, uvFrame).r;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
    depthTest: true,
    depthWrite: true,
    depthFunc: THREE.AlwaysDepth
  })
  private readonly quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    this.material
  )

  constructor() {
    this.quad.frustumCulled = false
    this.quad.renderOrder = -Infinity
    this.quad.layers.enableAll()
  }

  render(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    width: number,
    height: number,
    draw: (scene: THREE.Scene, camera: THREE.Camera) => void,
    consume: () => void
  ): void {
    const opaque = new Set<THREE.Material>()
    const excluded = new Set<THREE.Material>()
    let changingCasters = false
    scene.traverseVisible((object) => {
      if (!(
        object instanceof THREE.Mesh ||
        object instanceof THREE.Line ||
        object instanceof THREE.Points ||
        object instanceof THREE.Sprite
      )) {
        return
      }
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material]
      for (const material of materials) {
        if (!material.visible) {
          continue
        }
        const optical =
          material instanceof THREE.MeshPhysicalMaterial &&
          material.transmission > 0
        if (material.transparent || optical) {
          excluded.add(material)
          changingCasters ||= object.castShadow
        } else {
          opaque.add(material)
        }
      }
    })
    // Native rendering owns cases whose shadow caster set would change.
    if (changingCasters || !opaque.size || scene.overrideMaterial) {
      consume()
      return
    }
    if (!this.target) {
      this.target = new THREE.WebGLRenderTarget(width, height, {
        type: THREE.HalfFloatType,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        samples: 4,
        depthTexture: new THREE.DepthTexture(
          width,
          height,
          THREE.UnsignedIntType
        )
      })
      this.material.uniforms.radiance.value = this.target.texture
      this.material.uniforms.depth.value = this.target.depthTexture
    }
    this.target.setSize(width, height)
    const previous = {
      target: renderer.getRenderTarget(),
      face: renderer.getActiveCubeFace(),
      mip: renderer.getActiveMipmapLevel(),
      tone: renderer.toneMapping,
      clear: renderer.autoClear,
      shadow: renderer.shadowMap?.autoUpdate
    }
    try {
      for (const material of excluded) {
        material.visible = false
      }
      renderer.toneMapping = THREE.NoToneMapping
      renderer.autoClear = true
      renderer.setRenderTarget(this.target)
      draw(scene, camera)
      for (const material of excluded) {
        material.visible = true
      }
      renderer.toneMapping = previous.tone
      renderer.autoClear = previous.clear
      renderer.setRenderTarget(previous.target, previous.face, previous.mip)
      // Prepass used the complete unchanged caster set; downstream visibility
      // changes select color work only, never new semantic shadow inputs.
      if (renderer.shadowMap) {
        renderer.shadowMap.autoUpdate = false
      }
      for (const material of opaque) {
        material.visible = false
      }
      scene.add(this.quad)
      consume()
    } finally {
      this.quad.removeFromParent()
      for (const material of excluded) {
        material.visible = true
      }
      for (const material of opaque) {
        material.visible = true
      }
      renderer.toneMapping = previous.tone
      renderer.autoClear = previous.clear
      if (renderer.shadowMap && previous.shadow !== undefined) {
        renderer.shadowMap.autoUpdate = previous.shadow
      }
      renderer.setRenderTarget(previous.target, previous.face, previous.mip)
    }
  }

  dispose(): void {
    this.target?.dispose()
    this.material.dispose()
    this.quad.geometry.dispose()
  }
}
