import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/** Shared studio radiance, generated once rather than captured from each product frame. */
function createStudio(driver: unknown): THREE.WebGLRenderTarget {
  const renderer = driver as THREE.WebGLRenderer & {
    readonly isWebGLRenderer?: boolean
  }
  if (renderer.isWebGLRenderer !== true)
    throw new Error('Spatial environment reflection requires a WebGL renderer')
  const target = renderer.getRenderTarget()
  const face = renderer.getActiveCubeFace()
  const mip = renderer.getActiveMipmapLevel()
  const xr = renderer.xr.enabled
  const autoClear = renderer.autoClear
  const toneMapping = renderer.toneMapping
  const clearColor = renderer.getClearColor(new THREE.Color()).clone()
  const clearAlpha = renderer.getClearAlpha()
  const room = new RoomEnvironment()
  const generator = new THREE.PMREMGenerator(renderer)
  try {
    return generator.fromScene(room, 0.04)
  } finally {
    room.dispose()
    generator.dispose()
    renderer.xr.enabled = xr
    renderer.autoClear = autoClear
    renderer.toneMapping = toneMapping
    renderer.setClearColor(clearColor, clearAlpha)
    renderer.setRenderTarget(target, face, mip)
  }
}

export class ReflectionEnvironment {
  private target?: THREE.WebGLRenderTarget
  private disposed = false

  constructor(private readonly create = createStudio) {}

  apply(
    material: THREE.MeshStandardMaterial,
    intensity: number,
    driver: unknown
  ): void {
    if (this.disposed)
      throw new Error('Spatial reflection environment is disposed')
    if (!Number.isFinite(intensity) || intensity < 0)
      throw new Error('Invalid spatial environment material')
    if (intensity > 0 && !this.target) this.target = this.create(driver)
    const texture = intensity > 0 ? (this.target?.texture ?? null) : null
    if (material.envMap !== texture) material.needsUpdate = true
    material.envMap = texture
    material.envMapIntensity = intensity
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.target?.dispose()
    this.target = undefined
  }
}
