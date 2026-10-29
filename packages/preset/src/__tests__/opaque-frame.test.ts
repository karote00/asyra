import { expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { OpaqueFrame } from '../spatial/opaque-frame.js'

function fixture() {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera()
  const solid = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshStandardMaterial()
  )
  solid.castShadow = true
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshPhysicalMaterial({ transmission: 1 })
  )
  scene.add(solid, glass)
  const original = new THREE.WebGLRenderTarget(12, 12)
  let current = original
  const driver = {
    autoClear: false,
    toneMapping: THREE.ACESFilmicToneMapping,
    shadowMap: { autoUpdate: true },
    getRenderTarget: () => current,
    getActiveCubeFace: () => 0,
    getActiveMipmapLevel: () => 0,
    setRenderTarget: vi.fn((target) => {
      current = target
    })
  }
  const frame = new OpaqueFrame()
  const draw = vi.fn(() => {
    expect(solid.material.visible).toBe(true)
    expect(glass.material.visible).toBe(false)
    expect(driver.toneMapping).toBe(THREE.NoToneMapping)
  })
  const run = (consume: () => void, width = 640, height = 480) =>
    frame.render(
      driver as unknown as THREE.WebGLRenderer,
      scene,
      camera,
      width,
      height,
      draw,
      consume
    )
  const restored = () => {
    expect(scene.children).toEqual([solid, glass])
    expect(solid.material.visible).toBe(true)
    expect(glass.material.visible).toBe(true)
    expect(driver.autoClear).toBe(false)
    expect(driver.toneMapping).toBe(THREE.ACESFilmicToneMapping)
    expect(driver.shadowMap.autoUpdate).toBe(true)
    expect(driver.getRenderTarget()).toBe(original)
  }
  return { frame, solid, glass, scene, driver, draw, run, restored }
}

it('renders opaque geometry once, preserves full resolution HDR/depth and refreshes every flush', () => {
  const f = fixture()
  const consume = vi.fn(() => {
    expect(f.solid.material.visible).toBe(false)
    expect(f.glass.material.visible).toBe(true)
    expect(f.driver.shadowMap.autoUpdate).toBe(false)
    const replay = f.scene.children[2] as THREE.Mesh<
      THREE.PlaneGeometry,
      THREE.ShaderMaterial
    >
    expect(replay.material.depthWrite).toBe(true)
    expect(replay.material.depthFunc).toBe(THREE.AlwaysDepth)
    expect(replay.material.fragmentShader).toContain('gl_FragDepth')
    expect(replay.material.fragmentShader).toContain('tonemapping_fragment')
  })
  f.run(consume)
  const target = f.driver.setRenderTarget.mock
    .calls[0][0] as THREE.WebGLRenderTarget
  expect([target.width, target.height, target.samples]).toEqual([640, 480, 4])
  expect(target.texture.type).toBe(THREE.HalfFloatType)
  expect(target.depthTexture).toBeInstanceOf(THREE.DepthTexture)
  f.restored()
  f.solid.position.x = 2
  f.run(consume, 1000, 700)
  expect(f.driver.setRenderTarget.mock.calls[3][0]).toBe(target)
  expect([target.width, target.height]).toEqual([1000, 700])
  expect(f.draw).toHaveBeenCalledTimes(2)
  expect(consume).toHaveBeenCalledTimes(2)
  const release = vi.spyOn(target, 'dispose')
  f.frame.dispose()
  expect(release).toHaveBeenCalledTimes(1)
})

it('retains native rendering when optical objects cast shadows or override material is active', () => {
  const f = fixture()
  f.glass.castShadow = true
  const consume = vi.fn()
  f.run(consume)
  f.glass.castShadow = false
  f.scene.overrideMaterial = new THREE.MeshBasicMaterial()
  f.run(consume)
  expect(consume).toHaveBeenCalledTimes(2)
  expect(f.draw).not.toHaveBeenCalled()
  expect(f.driver.setRenderTarget).not.toHaveBeenCalled()
  f.restored()
  f.frame.dispose()
})

it.each(['prepass', 'consumer'])(
  'restores source state after %s failure',
  (phase) => {
    const f = fixture()
    if (phase === 'prepass')
      f.draw.mockImplementation(() => {
        throw new Error('failure')
      })
    expect(() =>
      f.run(() => {
        throw new Error('failure')
      })
    ).toThrow('failure')
    f.restored()
    f.frame.dispose()
  }
)
