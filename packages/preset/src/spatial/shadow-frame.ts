import * as THREE from 'three'

interface Renderer {
  shadowMap?: { enabled: boolean; autoUpdate?: boolean; needsUpdate?: boolean }
  render(scene: THREE.Scene, camera: THREE.Camera): void
}

interface Caster {
  object: THREE.Object3D
  sides: number[]
}

/** One synchronous flush: transforms, lights and geometry are already committed. */
export function createShadowFrame(renderer: Renderer) {
  let previous:
    { scene: THREE.Scene; camera: THREE.Camera; casters: Caster[] } | undefined
  return (scene: THREE.Scene, camera: THREE.Camera): void => {
    const shadow = renderer.shadowMap
    if (!shadow?.enabled || shadow.autoUpdate !== true) {
      renderer.render(scene, camera)
      return
    }
    // Capture passes change visibility and material sides, including enclosing
    // parents. These are the only mutable caster inputs within this flush.
    const casters: Caster[] = []
    scene.traverseVisible((object) => {
      if (
        !object.castShadow ||
        !(
          object instanceof THREE.Mesh ||
          object instanceof THREE.Line ||
          object instanceof THREE.Points
        )
      )
        return
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material]
      casters.push({
        object,
        sides: materials.flatMap((material) => [
          Number(material.visible),
          material.side,
          material.shadowSide ?? -1
        ])
      })
    })
    const completed = previous
    const reusable =
      completed?.scene === scene &&
      completed.camera === camera &&
      completed.casters.length === casters.length &&
      casters.every((caster, index) => {
        const old = completed.casters[index]
        return (
          old.object === caster.object &&
          old.sides.length === caster.sides.length &&
          old.sides.every((side, i) => side === caster.sides[i])
        )
      })
    const automatic = shadow.autoUpdate
    if (reusable && !shadow.needsUpdate) shadow.autoUpdate = false
    try {
      renderer.render(scene, camera)
      previous = { scene, camera, casters }
    } catch (error) {
      previous = undefined
      throw error
    } finally {
      shadow.autoUpdate = automatic
    }
  }
}
