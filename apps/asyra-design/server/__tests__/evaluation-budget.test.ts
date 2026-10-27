import { expect, it, vi } from 'vitest'
import { readEvaluationWindow } from '../../src/ai/evaluation-window'
import { DesignPreparationLimits } from '../../src/ai/prepared-design'
import { createDesignPreparationSession } from '../design-preparation'
import { createLocalDesignTools } from '../local-design-tools'
import { measureDesignBudget, inspectDesignBudget } from '../design-budget'
import { createDesignDraftRepairStore } from '../design-draft-repair'
import source from './fixtures/recorded-101/pattern-budget-recovery-20261023.json'

it('preserves explicit evaluation policy and rejects unsupported overrides', () => {
  const window = { workDeadlineAt: Date.now() + 120000, reportTimeoutMs: 60000 }
  expect(readEvaluationWindow({ ...window, expandedNodeLimit: 2000 })).toEqual({
    ...window,
    expandedNodeLimit: 2000
  })
  expect(readEvaluationWindow(window)).toEqual(window)
  expect(readEvaluationWindow(undefined)).toBeUndefined()
  for (const expandedNodeLimit of [
    0,
    1999,
    2001,
    5000,
    10000,
    20000,
    '2000',
    null
  ])
    expect(() =>
      readEvaluationWindow({ ...window, expandedNodeLimit })
    ).toThrow()
})

it('keeps the exact test boundary and default production requests independent', async () => {
  const draft = (count: number) => ({
    type: 'group',
    name: 'Panels',
    children: Array.from({ length: count - 1 }, (_, i) => ({
      type: 'rect',
      key: `r${i}`,
      name: 'Panel',
      width: 1,
      height: 1
    }))
  })
  expect(inspectDesignBudget(draft(2000), 2000)).toBeUndefined()
  expect(
    inspectDesignBudget(draft(2001), 2000)?.budget.allowed.expandedNodes
  ).toBe(2000)
  expect(inspectDesignBudget(draft(2001))).toBeUndefined()
  expect(DesignPreparationLimits.expandedNodes).toBe(10000)
  const session = createDesignPreparationSession(
    undefined,
    undefined,
    undefined,
    2000
  )
  expect(() => session.prepare(draft(2001))).toThrow(/budget/i)
  await expect(
    session.prepareAsync(draft(2001), new AbortController().signal)
  ).rejects.toThrow(/budget/i)
  const tools = createLocalDesignTools(
    [{ name: 'apply_prepared_design', description: 'Apply', inputSchema: {} }],
    session
  )
  const schema = tools.definitions.find(
    (d) => d.name === 'prepare_design'
  )?.inputSchema
  expect(JSON.stringify(schema)).toContain('2000 expanded objects')
  expect(JSON.stringify(schema)).not.toContain('10000 expanded objects')
})

it('partitions the preserved source under the effective limit without changing source coverage', () => {
  const store = createDesignDraftRepairStore(2000)
  const id = store.retain(source.input.draft)
  if (!id) throw new Error('Missing source')
  const parts = store.describe(id)?.partitions
  if (!parts) throw new Error('Missing partitions')
  expect(parts.length).toBeGreaterThan(2)
  let count = 1
  for (let partition = 0; partition < parts.length; partition++) {
    const draft = store.repair({ draftId: id, partition })
    const measured = measureDesignBudget(draft, 2000)
    expect(measured.exceeded).toEqual([])
    expect(measured.allowed.expandedNodes).toBe(2000)
    count += measured.observed.expandedNodes - 1
  }
  expect(count).toBe(13095)
  const production = createDesignDraftRepairStore()
  const productionId = production.retain(source.input.draft)
  if (!productionId) throw new Error('Missing production source')
  expect(production.describe(productionId)?.partitions).toHaveLength(2)
  expect(() => production.repair({ draftId: id, partition: 0 })).toThrow(
    /unavailable/
  )
})

it('admits the authorized fifteen-minute window while enforcing independent work and report ceilings', () => {
  const now = 1793070000000
  const clock = vi.spyOn(Date, 'now').mockReturnValue(now)
  try {
    const policy = { workDeadlineAt: now + 900000, reportTimeoutMs: 60000 }
    expect(readEvaluationWindow(policy)).toEqual(policy)
    expect(() =>
      readEvaluationWindow({ ...policy, workDeadlineAt: now + 900001 })
    ).toThrow('Invalid evaluation window')
    expect(() =>
      readEvaluationWindow({ ...policy, reportTimeoutMs: 60001 })
    ).toThrow('Invalid evaluation window')
  } finally {
    clock.mockRestore()
  }
})
