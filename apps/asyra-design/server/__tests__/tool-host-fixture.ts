import { randomUUID } from 'node:crypto'
import { afterEach } from 'vitest'
import { createLocalToolHost, type LocalToolGroup } from '../local-tool-host'
import { LocalToolLibraryLimits } from '../local-tool-library-limits'

const cleanups = new Set<() => Promise<void>>()

afterEach(async () => {
  for (const cleanup of cleanups) {
    await cleanup()
    cleanups.delete(cleanup)
  }
})

/** Fixtures supply owners; production Host owns all admission, projection and leases. */
export const createToolHostFixture = (
  createGroups: Parameters<typeof createLocalToolHost>[0]['createGroups']
) => {
  let groups: readonly LocalToolGroup[] = []
  const host = createLocalToolHost({
    requestId: randomUUID(),
    signal: new AbortController().signal,
    capacity: LocalToolLibraryLimits.entries,
    receiptCapacity: LocalToolLibraryLimits.receipts,
    artifactCapacity: LocalToolLibraryLimits.artifacts,
    limits: LocalToolLibraryLimits.recipe,
    store: {
      read: async () => undefined,

      list: async () => [],

      write: async () => {
        throw Error('This fixture has no durable tool store')
      }
    },

    createGroups: (ownership) => {
      groups = createGroups(ownership)

      return groups
    }
  })

  cleanups.add(async () => {
    await host.dispose()
    for (const { owner } of groups) {
      if ('dispose' in owner && typeof owner.dispose === 'function') {
        await owner.dispose()
      }
    }
  })

  return host
}
