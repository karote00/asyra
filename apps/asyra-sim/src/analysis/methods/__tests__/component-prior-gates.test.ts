import { afterEach, beforeEach, it, vi } from 'vitest'
import * as meshIndex from '../mesh-index'
import { componentIndex } from './component-index-fixture'

// Explicit candidate adapter runs the unchanged permanent source/work oracles.
if (process.env.SIM_COMPONENT_HIERARCHY_EXPERIMENT === '1') {
  const build = meshIndex.buildMeshIndex
  beforeEach(() => {
    // Isolate the recorded eager candidate from the newer demand-time owner.
    vi.spyOn(meshIndex, 'refineMeshIndex').mockImplementation((index) => index)
    vi.spyOn(meshIndex, 'buildMeshIndex').mockImplementation(
      (geometry, checkpoint, hierarchy) => {
        const index = build(geometry, checkpoint, hierarchy)
        return hierarchy === false ? index : componentIndex(index, checkpoint)
      }
    )
  })
  afterEach(() => vi.restoreAllMocks())
  await import('./dual-tree-work.test')
  await import('./projected-rejection-work.test')
} else {
  it.skip('requires explicit component hierarchy experiment selection', () =>
    undefined)
}
