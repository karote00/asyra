import { expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { TransmissionCapture } from '../spatial/transmission-capture.js'

function setup() {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera()
  const captures: string[][] = []
  const original = new THREE.WebGLRenderTarget(12, 12)
  let target: THREE.WebGLRenderTarget | null = original
  const renderer = {
    toneMapping: THREE.ACESFilmicToneMapping,
    autoClear: false,
    xr: { enabled: true },
    getRenderTarget: () => target,
    getActiveCubeFace: () => 0,
    getActiveMipmapLevel: () => 0,
    setRenderTarget: vi.fn((value) => {
      target = value
    }),
    render: vi.fn((_scene?: THREE.Scene, _camera?: THREE.Camera) => {
      const names: string[] = []
      scene.traverseVisible((object) => {
        if (object instanceof THREE.Mesh) {
          const material = object.material as THREE.MeshPhysicalMaterial
          names.push(
            object.name + (material.side === THREE.BackSide ? ':back' : '')
          )
        }
      })
      captures.push(names)
    })
  }
  const capture = new TransmissionCapture()
  const mesh = (name: string, layer?: number) => {
    const material = new THREE.MeshPhysicalMaterial({ transmission: 1 })
    const object = new THREE.Mesh(new THREE.BoxGeometry(), material)
    object.name = name
    scene.add(object)
    if (layer !== undefined) capture.apply(material, layer)
    return object
  }
  const render = () =>
    capture.render(
      renderer as unknown as THREE.WebGLRenderer,
      scene,
      camera,
      640,
      480,
      (scene, camera) => renderer.render(scene, camera)
    )
  return { scene, camera, capture, renderer, original, captures, mesh, render }
}

it('captures lower media and ordinary transparent objects once per layer, without self feedback', () => {
  const f = setup()
  f.mesh('glass', 2)
  f.mesh('liquid', 1)
  f.mesh('ice-a', 0)
  f.mesh('ice-b', 0)
  const background = f.mesh('background')
  background.material.transparent = true
  const hidden = f.mesh('hidden', 3)
  hidden.visible = false
  f.render()
  expect(f.captures).toEqual([
    ['glass:back', 'liquid:back', 'background'],
    ['glass:back', 'ice-a', 'ice-b', 'background'],
    ['liquid', 'ice-a', 'ice-b', 'background']
  ])
  expect(f.renderer.getRenderTarget()).toBe(f.original)
  expect(f.renderer.toneMapping).toBe(THREE.ACESFilmicToneMapping)
  expect(f.renderer.autoClear).toBe(false)
  expect(f.renderer.xr.enabled).toBe(true)
  expect(hidden.visible).toBe(false)
  const firstTargets = f.renderer.setRenderTarget.mock.calls
    .slice(0, 3)
    .map(([target]) => target)
  f.render()
  const secondTargets = f.renderer.setRenderTarget.mock.calls
    .slice(4, 7)
    .map(([target]) => target)
  expect(secondTargets).toEqual(firstTargets)
  expect(f.captures).toHaveLength(6)
  f.capture.dispose()
})

it('does not redraw the scene for offscreen optical recipients and refreshes them on camera return', () => {
  const f = setup()
  f.camera.position.set(0, 0, 5)
  const glass = f.mesh('glass', 2)
  const liquid = f.mesh('liquid', 1)
  const ice = f.mesh('ice', 0)
  const group = new THREE.Group()
  f.scene.add(group)
  group.add(glass, liquid, ice)
  f.render()
  expect(f.captures).toHaveLength(3)
  const targets = f.renderer.setRenderTarget.mock.calls
    .slice(0, 3)
    .map(([value]) => value)
  const releases = targets.map((target) => vi.spyOn(target, 'dispose'))
  f.renderer.render.mockClear()
  f.camera.position.x = 100
  f.render()
  expect(f.renderer.render).not.toHaveBeenCalled()
  expect(releases.every((release) => release.mock.calls.length === 0)).toBe(
    true
  )
  f.camera.position.x = 0
  f.render()
  expect(f.renderer.render).toHaveBeenCalledTimes(3)
  // Parent transform changes must update culling before the first capture render.
  f.renderer.render.mockClear()
  group.position.x = 100
  f.render()
  expect(f.renderer.render).not.toHaveBeenCalled()
  // Explicit culling opt-out remains authoritative.
  glass.frustumCulled = false
  f.render()
  expect(f.renderer.render).toHaveBeenCalledTimes(1)
  f.capture.dispose()
  expect(releases.every((release) => release.mock.calls.length === 1)).toBe(
    true
  )
})

it('respects camera layers and material visibility when admitting optical captures', () => {
  const f = setup()
  const glass = f.mesh('glass', 2)
  glass.layers.set(1)
  f.render()
  expect(f.renderer.render).not.toHaveBeenCalled()
  f.camera.layers.enable(1)
  glass.material.visible = false
  f.render()
  expect(f.renderer.render).not.toHaveBeenCalled()
  glass.material.visible = true
  f.render()
  expect(f.renderer.render).toHaveBeenCalledTimes(1)
  f.capture.dispose()
})

it('restores visibility and renderer state when a capture fails', () => {
  const f = setup()
  const glass = f.mesh('glass', 2)
  f.mesh('ice', 0)
  f.renderer.render.mockImplementation(() => {
    throw new Error('capture failure')
  })
  expect(f.render).toThrow('capture failure')
  expect(glass.visible).toBe(true)
  expect(glass.material.side).toBe(THREE.FrontSide)
  expect(f.renderer.getRenderTarget()).toBe(f.original)
  expect(f.renderer.xr.enabled).toBe(true)
  expect(f.renderer.toneMapping).toBe(THREE.ACESFilmicToneMapping)
  f.capture.dispose()
})

it('releases removed layers and binds the native transmission chunk to current targets', () => {
  const f = setup()
  const glass = f.mesh('glass', 1)
  f.render()
  const target = f.renderer.setRenderTarget.mock
    .calls[0][0] as THREE.WebGLRenderTarget
  const dispose = vi.spyOn(target, 'dispose')
  const shader = {
    uniforms: {},
    fragmentShader: '#include <transmission_pars_fragment>'
  }
  glass.material.onBeforeCompile(shader as never, f.renderer as never)
  expect(shader.fragmentShader).toContain('spatialTransmissionMap')
  expect(shader.fragmentShader).toContain('if ( spatialCaptureEnabled )')
  expect(shader.fragmentShader).toContain(
    'textureBicubic( transmissionSamplerMap'
  )
  expect(shader.uniforms).toMatchObject({
    spatialTransmissionMap: { value: target.texture }
  })
  f.capture.render(
    f.renderer as never,
    f.scene,
    f.camera,
    320,
    240,
    (scene, camera) => f.renderer.render(scene, camera)
  )
  expect(target.width).toBe(320)
  expect(target.height).toBe(240)
  f.capture.apply(glass.material, undefined)
  f.renderer.render.mockClear()
  f.render()
  expect(dispose).toHaveBeenCalled()
  expect(f.renderer.render).not.toHaveBeenCalled()
  f.capture.dispose()
})

it('draws enclosing back faces before contents without occluding the contents', () => {
  const f = setup()
  const glass = f.mesh('glass', 2)
  const coffee = f.mesh('coffee', 1)
  const ice = f.mesh('ice', 0)
  glass.renderOrder = 7
  coffee.renderOrder = 4
  ice.renderOrder = 2
  let frame = 0
  f.renderer.render.mockImplementation(() => {
    if (frame++ === 0) {
      expect(glass.material.depthWrite).toBe(false)
      expect(coffee.material.depthWrite).toBe(false)
      expect(glass.renderOrder).toBeLessThan(coffee.renderOrder)
      expect(coffee.renderOrder).toBeLessThan(ice.renderOrder)
    }
  })
  f.render()
  expect(glass.material.depthWrite).toBe(true)
  expect(coffee.material.depthWrite).toBe(true)
  expect(glass.renderOrder).toBe(7)
  expect(coffee.renderOrder).toBe(4)
  f.capture.dispose()
})

it('keeps source shader versions stable across repeated enclosing back-face captures', () => {
  const f = setup()
  const glass = f.mesh('glass', 2)
  f.mesh('liquid', 1)
  f.mesh('ice', 0)
  const source = glass.material
  const version = source.version
  f.render()
  f.render()
  expect(source.version).toBe(version)
  expect(glass.material).toBe(source)
  expect(source.side).toBe(THREE.FrontSide)
  f.capture.dispose()
})

it('reuses enclosing materials, synchronizes optical values and releases removed sources', () => {
  const f = setup()
  const glass = f.mesh('glass', 2)
  f.mesh('ice', 0)
  const source = glass.material
  const backFaces: THREE.MeshPhysicalMaterial[] = []
  f.renderer.render.mockImplementation(() => {
    if (glass.visible && glass.material.side === THREE.BackSide)
      backFaces.push(glass.material)
  })
  f.render()
  const back = backFaces[0]
  const version = back.version
  source.color.setHex(0x112233)
  source.roughness = 0.37
  source.attenuationDistance = 0.42
  f.render()
  expect(backFaces[1]).toBe(back)
  expect(back.version).toBe(version)
  expect(back.color.getHex()).toBe(0x112233)
  expect(back.roughness).toBe(0.37)
  expect(back.attenuationDistance).toBe(0.42)
  source.needsUpdate = true
  f.render()
  expect(back.version).toBeGreaterThan(version)
  const release = vi.spyOn(back, 'dispose')
  f.scene.remove(glass)
  f.render()
  expect(release).toHaveBeenCalledTimes(1)
  f.capture.dispose()
  expect(release).toHaveBeenCalledTimes(1)
})

it('releases retained enclosing materials when the original material is disposed', () => {
  const f = setup()
  const glass = f.mesh('glass', 2)
  f.mesh('ice', 0)
  let back: THREE.MeshPhysicalMaterial | undefined
  f.renderer.render.mockImplementation(() => {
    if (glass.visible && glass.material.side === THREE.BackSide)
      back = glass.material
  })
  f.render()
  if (!back) throw new Error('Missing enclosing material')
  const release = vi.spyOn(back, 'dispose')
  glass.material.dispose()
  expect(release).toHaveBeenCalledTimes(1)
  f.capture.dispose()
  expect(release).toHaveBeenCalledTimes(1)
})
