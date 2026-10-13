import { describe, expect, it, vi } from 'vitest'
import { createInspectionDependencies } from '../inspection-dependencies'

const setup = () => {
  const parents: Record<string, string | undefined> = { tower: undefined }
  for (let tier = 1; tier <= 8; tier++) {
    parents[`tier-${tier}`] = 'tower'
    parents[`window-${tier}`] = `tier-${tier}`
  }
  let candidates = ['tower', 'tier-3', 'window-3']
  const source = {
    parent: vi.fn((id: string) => {
      if (!Object.hasOwn(parents, id)) throw new Error('Missing element')
      return parents[id]
    }),
    region: vi.fn(() => [...candidates])
  }
  const owner = createInspectionDependencies(source)
  return {
    owner,
    source,
    parents,
    candidates: (ids: string[]) => {
      candidates = ids
    }
  }
}

describe('inspection dependency currency', () => {
  it('preserves seven unrelated tier captures without reading their contents', () => {
    const { owner, source } = setup()
    const tiers = Array.from({ length: 8 }, (_, i) =>
      owner.capture(`tier-${i + 1}`, undefined, 0)
    )
    const whole = owner.capture('tower', undefined, 0)
    source.parent.mockClear()
    owner.change({ elementIds: ['window-3'] })
    expect(tiers.map((stamp) => owner.current(stamp))).toEqual([
      true,
      true,
      false,
      true,
      true,
      true,
      true,
      true
    ])
    expect(owner.current(whole)).toBe(false)
    const reads = source.parent.mock.calls.map(([id]) => id)
    expect(reads).toEqual(['window-3', 'tier-3', 'tower'])
    source.parent.mockClear()
    for (let repeat = 0; repeat < 100; repeat++)
      expect(owner.current(tiers[0])).toBe(true)
    expect(source.parent).not.toHaveBeenCalled()
    expect(source.region).not.toHaveBeenCalled()
  })

  it('tracks regional entrants and exits rather than every sibling under the target', () => {
    const { owner, source, candidates, parents } = setup()
    const stamp = owner.capture(
      'tower',
      { x: 0, y: 0, width: 100, height: 100 },
      3
    )
    owner.change({ elementIds: ['window-8'] })
    expect(owner.current(stamp)).toBe(true)
    expect(source.region).toHaveBeenCalledTimes(2)
    owner.change({ elementIds: ['window-8'] })
    candidates(['tower', 'tier-3', 'window-3', 'tier-8', 'window-8'])
    expect(owner.current(stamp)).toBe(false)
    const next = owner.capture(
      'tower',
      { x: 0, y: 0, width: 100, height: 100 },
      4
    )
    delete parents['window-3']
    candidates(['tower', 'tier-8', 'window-8'])
    owner.change({ elementIds: ['window-3'], parentIds: ['tier-3'] })
    expect(owner.current(next)).toBe(false)
  })

  it('ignores outside membership edits but invalidates changed ordering within a region', () => {
    const { owner, candidates } = setup()
    const region = { x: 0, y: 0, width: 100, height: 100 }
    const stamp = owner.capture('tower', region, 0)
    owner.change({ elementIds: [], parentIds: ['tower'] })
    expect(owner.current(stamp)).toBe(true)
    candidates(['tower', 'window-3', 'tier-3'])
    owner.change({ elementIds: [], parentIds: ['tower'] })
    expect(owner.current(stamp)).toBe(false)
  })

  it('invalidates shared owners and ancestor transforms, but not other tiers', () => {
    const { owner } = setup()
    const a = owner.capture('tier-3', undefined, 0)
    const b = owner.capture('tier-5', undefined, 0)
    const c = owner.capture('tier-8', undefined, 0)
    owner.change({ elementIds: ['window-3', 'window-5'] })
    expect([a, b, c].map(owner.current)).toEqual([false, false, true])
    owner.change({ elementIds: ['tower'] })
    expect(owner.current(c)).toBe(false)
  })

  it('accounts for old parents on moves and fails closed on unknown changes or lookup failures', () => {
    const { owner, parents, source } = setup()
    const a = owner.capture('tier-3', undefined, 0)
    const b = owner.capture('tier-8', undefined, 0)
    parents['window-3'] = 'tier-8'
    owner.change({ elementIds: ['window-3'], parentIds: ['tier-3'] })
    expect([a, b].map(owner.current)).toEqual([false, false])
    const next = owner.capture('tier-1', undefined, 1)
    expect(owner.current({ ...next, revision: 10 })).toBe(false)
    expect(owner.current({ ...next, receiptId: 'foreign' })).toBe(false)
    owner.change()
    expect(owner.current(next)).toBe(false)
    const region = owner.capture(
      'tower',
      { x: 0, y: 0, width: 100, height: 100 },
      2
    )
    owner.change({ elementIds: ['window-8'] })
    source.region.mockImplementation(() => {
      throw new Error('Unavailable')
    })
    expect(owner.current(region)).toBe(false)
    owner.dispose()
    expect(owner.current(next)).toBe(false)
  })
})

it('does not revive a receipt invalidated while a pending region query flushes changes', () => {
  const { owner, source } = setup()
  const stamp = owner.capture(
    'tower',
    { x: 0, y: 0, width: 100, height: 100 },
    0
  )
  owner.change({ elementIds: ['window-8'] })
  source.region.mockImplementation(() => {
    owner.change({ elementIds: ['window-3'] })
    return ['tower', 'tier-3', 'window-3']
  })
  expect(owner.current(stamp)).toBe(false)
})
