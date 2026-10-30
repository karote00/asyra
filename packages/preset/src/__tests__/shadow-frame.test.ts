import { expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { createShadowFrame } from '../spatial/shadow-frame.js'

function setup() {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera()
  const caster = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshStandardMaterial()
  )
  caster.castShadow = true
  scene.add(caster)
  const shadowMap = { enabled: true, autoUpdate: true, needsUpdate: false }
  const shadows: string[][] = []
  const renderer = {
    shadowMap,
    render: vi.fn(() => {
      if (
        shadowMap.enabled &&
        (shadowMap.autoUpdate || shadowMap.needsUpdate)
      ) {
        const names: string[] = []
        scene.traverseVisible((object) => {
          if (object.castShadow) {
            names.push(object.uuid)
          }
        })
        shadows.push(names)
        shadowMap.needsUpdate = false
      }
    })
  }
  const draw = createShadowFrame(renderer)
  return { scene, camera, caster, renderer, shadows, draw, shadowMap }
}

it('shares shadow output, not color rendering, and invalidates visible caster configurations', () => {
  const f = setup()
  f.draw(f.scene, f.camera)
  f.draw(f.scene, f.camera)
  expect(f.shadows).toHaveLength(1)
  f.caster.visible = false
  f.draw(f.scene, f.camera)
  expect(f.shadows[1]).toEqual([])
  f.caster.visible = true
  f.draw(f.scene, f.camera)
  expect(f.shadows[2]).toEqual([f.caster.uuid])
  f.caster.material.side = THREE.BackSide
  f.draw(f.scene, f.camera)
  f.caster.material.shadowSide = THREE.FrontSide
  f.draw(f.scene, f.camera)
  f.caster.material.visible = false
  f.draw(f.scene, f.camera)
  expect(f.shadows).toHaveLength(6)
  expect(f.renderer.render).toHaveBeenCalledTimes(7)
})

it('detects caster descendants hidden by a non-casting optical parent', () => {
  const f = setup()
  const parent = new THREE.Mesh()
  parent.add(f.caster)
  f.scene.add(parent)
  f.draw(f.scene, f.camera)
  parent.visible = false
  f.draw(f.scene, f.camera)
  expect(f.shadows).toEqual([[f.caster.uuid], []])
})

it('honors camera identity, explicit dirty requests and a new flush', () => {
  const f = setup()
  f.draw(f.scene, f.camera)
  f.shadowMap.needsUpdate = true
  f.draw(f.scene, f.camera)
  f.draw(f.scene, new THREE.PerspectiveCamera())
  createShadowFrame(f.renderer)(f.scene, f.camera)
  expect(f.shadows).toHaveLength(4)
})

it('preserves disabled shadows and manual shadow scheduling', () => {
  const f = setup()
  f.shadowMap.enabled = false
  f.draw(f.scene, f.camera)
  expect(f.shadows).toHaveLength(0)
  f.shadowMap.enabled = true
  f.shadowMap.autoUpdate = false
  f.draw(f.scene, f.camera)
  f.shadowMap.needsUpdate = true
  f.draw(f.scene, f.camera)
  f.draw(f.scene, f.camera)
  expect(f.shadows).toHaveLength(1)
  expect(f.shadowMap.autoUpdate).toBe(false)
})

it('restores automatic shadows after failure and retries without reusing an incomplete pass', () => {
  const f = setup()
  f.draw(f.scene, f.camera)
  f.renderer.render.mockImplementationOnce(() => {
    expect(f.shadowMap.autoUpdate).toBe(false)
    throw new Error('draw failure')
  })
  expect(() => f.draw(f.scene, f.camera)).toThrow('draw failure')
  expect(f.shadowMap.autoUpdate).toBe(true)
  f.draw(f.scene, f.camera)
  expect(f.shadows).toHaveLength(2)
})
