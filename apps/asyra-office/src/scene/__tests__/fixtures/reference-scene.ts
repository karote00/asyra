import { afterEach, beforeAll, vi } from 'vitest'
import { setImmediate } from 'node:timers/promises'
import * as tableware from '../../../assets/discussion-tableware'
import type { AssetPart } from '../../../assets/catalog'
import { createReferenceScene } from '../../reference-scene'

/**
 * Build real optical solids and the real scene in separate bounded setup steps.
 * Each file owns its fixture; no geometry is omitted or persisted across files.
 * Placement creates new meshes, so the prepared local solids remain unchanged.
 */
export function useReferenceSceneFixture() {
  // CPU-heavy synchronous cases must leave a host turn for worker RPC replies.
  // Microtask-only hook completion can otherwise starve the runner transport.
  afterEach(() => setImmediate())
  let coffee: AssetPart[]
  let sugar: AssetPart[]
  let scene: ReturnType<typeof createReferenceScene> | undefined
  beforeAll(() => {
    coffee = tableware.americanoGlass()
  })
  beforeAll(() => {
    sugar = tableware.sugarJar()
  })
  beforeAll(() => {
    const coffeeFactory = vi.spyOn(tableware, 'americanoGlass')
    const sugarFactory = vi.spyOn(tableware, 'sugarJar')
    coffeeFactory.mockImplementation((...args) => {
      if (args.length) {
        throw new Error('Scene coffee parameters require a new fixture')
      }
      return coffee
    })
    sugarFactory.mockImplementation((...args) => {
      if (args.length) {
        throw new Error('Scene sugar parameters require a new fixture')
      }
      return sugar
    })
    try {
      scene = createReferenceScene()
    } finally {
      coffeeFactory.mockRestore()
      sugarFactory.mockRestore()
    }
  })
  return () => {
    if (!scene) {
      throw new Error('Reference scene fixture has not been constructed')
    }
    return scene
  }
}
