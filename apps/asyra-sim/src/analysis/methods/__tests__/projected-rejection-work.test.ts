import { expect, it } from 'vitest'
import { OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'

it.each(
  [
    { target: 'example:fixture-table', start: 0, end: 2, limit: 10000 },
    { target: 'obstacle-10', start: 3.75, end: 4, limit: 50000 }
  ].flatMap((item) => [false, true].map((reverse) => ({ ...item, reverse })))
)(
  'certifies complete original source separation within bounded work - $target reversed $reverse',
  async ({ target, start, end, limit, reverse }) => {
    const snapshot = await representativeSnapshot(0)
    const pair = snapshot.pairs.find(
      (pair) => pair.a.bodyId === 'example:joint-2' && pair.b.bodyId === target
    )
    if (!pair) throw new Error('Missing representative pair')
    const context = new OriginalMeshQuery()
    const query = {
      workcell: snapshot.workcell,
      trajectory: snapshot.trajectory,
      a: reverse ? pair.b : pair.a,
      b: reverse ? pair.a : pair.b,
      interval: [start, end] as const
    }
    const settings = {
      threshold: snapshot.rule.minimumClearance,
      ...snapshot.method.settings,
      maxIntervals: snapshot.budget.maxIntervals
    }
    const result = queryOriginalPartPair(
      query,
      settings,
      () => undefined,
      context
    )
    expect(result.coverage).toBe('complete')
    expect(result.leaves.every((leaf) => leaf.state === 'clear')).toBe(true)
    expect(result.leaves[0].start).toBe(start)
    expect(result.leaves.at(-1)?.end).toBe(end)
    // The fixed cost ceiling includes source preparation, source queries and all
    // rejection attempts. It cannot be met by changing the production budget.
    expect(context.work).toBeLessThan(limit)
  },
  20000
)
