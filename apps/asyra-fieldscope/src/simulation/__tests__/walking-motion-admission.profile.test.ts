import { describe, expect, it } from 'vitest'
import { readWalkingNonlinearMotionRequest } from '../../domain/walking-motion-contract'
import { nonlinearFixture } from './walking-motion-test-fixtures'

describe('canonical nonlinear admission negatives', () => {
  it('binds current identities and rejects malformed finite inputs before traversal', () => {
    const { raw, source, demand, cycle, cycleOwner, owner } = nonlinearFixture()
    const current = { owner: cycleOwner, cycle }
    const read = (input: unknown) =>
      readWalkingNonlinearMotionRequest(input, source, demand, current)
    const admitted = read(raw)
    expect(read(admitted)).toBe(admitted)
    expect(admitted.source).toBe(source)
    expect(admitted.demand).toBe(demand)
    expect(admitted.cycle).toBe(cycle)
    expect(admitted.terrain).not.toBe(raw.terrain)
    expect(Object.isFrozen(admitted.terrain.contactAssessments)).toBe(true)
    expect(
      new Set(admitted.terrainEvents.map((e) => e.placementRequest.terrain))
        .size
    ).toBe(4)
    const before = cycleOwner.work
    const cases: readonly [string, unknown][] = [
      ['foreign source', { ...raw, source: { ...source } }],
      ['foreign demand', { ...raw, demand: { ...demand } }],
      ['foreign cycle', { ...raw, cycle: { ...cycle } }],
      ['legacy format', { ...raw, format: 'walking-motion-request/2' }],
      [
        'phase gap',
        {
          ...raw,
          path: {
            ...raw.path,
            phases: [raw.path.phases[0], { ...raw.path.phases[1], from: 1.1 }]
          }
        }
      ],
      [
        'phase overlap',
        {
          ...raw,
          path: {
            ...raw.path,
            phases: [raw.path.phases[0], { ...raw.path.phases[1], from: 0.9 }]
          }
        }
      ],
      [
        'nonfinite time',
        {
          ...raw,
          path: {
            ...raw.path,
            phases: [
              raw.path.phases[0],
              { ...raw.path.phases[1], until: Infinity }
            ]
          }
        }
      ],
      ['nonempty target', { ...raw, targetContacts: [{}] }],
      ['missing external source', { ...raw, externalSources: [] }],
      [
        'partial partition',
        {
          ...raw,
          externalSources: [
            {
              ...raw.externalSources[0],
              regions: [{ ...raw.externalSources[0].regions[0], indexCount: 3 }]
            }
          ]
        }
      ],
      [
        'foreign event receipt',
        {
          ...raw,
          terrainEvents: raw.terrainEvents.map((e, i) =>
            i === 0
              ? {
                  ...e,
                  placementRequest: admitted.terrainEvents[0].placementRequest
                }
              : e
          )
        }
      ],
      [
        'foreign foot patch',
        {
          ...raw,
          terrainEvents: raw.terrainEvents.map((e, i) =>
            i === 0
              ? {
                  ...e,
                  seeds: e.seeds.map((s, j) =>
                    j === 0 ? { ...s, footPatch: { ...s.footPatch } } : s
                  )
                }
              : e
          )
        }
      ],
      [
        'input exhaustion',
        { ...raw, budget: { ...raw.budget, maxInputValues: 1 } }
      ],
      [
        'zero phase budget',
        { ...raw, budget: { ...raw.budget, maxPhaseNodes: 0 } }
      ],
      [
        'unsafe pair budget',
        {
          ...raw,
          budget: { ...raw.budget, maxRegionPairs: Number.MAX_SAFE_INTEGER + 1 }
        }
      ],
      [
        'nonfinite predicate budget',
        { ...raw, budget: { ...raw.budget, maxExactPredicates: Infinity } }
      ],
      [
        'oversized fraction',
        {
          ...raw,
          terrainEvents: raw.terrainEvents.map((e, i) =>
            i === 0
              ? {
                  ...e,
                  seeds: e.seeds.map((s, j) =>
                    j === 0
                      ? {
                          ...s,
                          barycentric: [
                            { numerator: 1n << 24001n, denominator: 1n },
                            ...s.barycentric.slice(1)
                          ]
                        }
                      : s
                  )
                }
              : e
          )
        }
      ]
    ]
    for (const [name, input] of cases) expect(() => read(input), name).toThrow()
    expect(cycleOwner.work).toEqual(before)
    expect(owner.work.preparations).toBe(0)
    raw.terrain.revision++
    expect(admitted.terrain.revision).toBe(1)
    cycleOwner.dispose()
    expect(() => read(admitted)).toThrow()
    expect(owner.read()).toBeUndefined()
  }, 30000)
})
