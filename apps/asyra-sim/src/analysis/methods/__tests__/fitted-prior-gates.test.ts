import { it, vi } from 'vitest'

// Run the existing product oracles and unchanged fixed work ceilings with only
// the isolated constructor policy enabled. No source fixture or threshold changes.
vi.mock('../original-mesh-query', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('../original-mesh-query')>()
  return {
    ...original,
    OriginalMeshQuery: class extends original.OriginalMeshQuery {
      constructor(
        ...args: ConstructorParameters<typeof original.OriginalMeshQuery>
      ) {
        args[4] ??= true
        super(...args)
      }
    }
  }
})
if (process.env.SIM_FITTED_TRAVERSAL_EXPERIMENT === '1') {
  await import('./dual-tree-work.test')
  await import('./projected-rejection-work.test')
  await import('./workpiece-contact.test')
  await import('./original-mesh.test')
  await import('./fresh-witness-work.test')
} else {
  it.skip('requires explicit fitted traversal candidate selection', () =>
    undefined)
}
