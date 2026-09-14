import { afterEach, beforeEach, it, vi } from 'vitest'
import { useTriangleProjectionControl } from './triangle-projection-control'

// Explicit test-owned policy uses unchanged source, truth and resource oracles.
if (process.env.SIM_TRIANGLE_PROJECTION_EXPERIMENT === '1') {
  beforeEach(() => {
    useTriangleProjectionControl(true)
  })
  afterEach(() => vi.restoreAllMocks())
  await import('./dual-tree-work.test')
  await import('./projected-rejection-work.test')
  await import('./sibling-order-work.test')
  await import('./original-mesh-oracle.test')
  await import('./original-mesh.test')
  await import('./original-motion.test')
  await import('./workpiece-contact.test')
} else {
  it.skip('requires explicit final triangle projection experiment selection', () =>
    undefined)
}
