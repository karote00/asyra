import { expect, it, vi } from 'vitest'
import { createDesignCheckResults } from '../design-check-results'
import { createMechanicalChecks } from '../local-mechanical-checks'
import { LocalToolInputError } from '../local-tool-invocation'

const fixture = () => {
  const store = createDesignCheckResults()
  const current = new Set<string>()
  const findings = new Map<string, unknown[]>()
  const record = (id: string) => {
    const pending = findings.get(id) ?? []
    store.record(
      {
        id,
        origin: 'tool',
        status: pending.length ? 'fail' : 'pass',
        evidence: 'Opaque diagnostic',
        dependencies: { [id]: 'geometry' }
      },
      { kind: 'measurement', elementId: id, findings: pending }
    )
    current.add(id)
  }
  const measure = vi.fn(async (ids: readonly string[]) => {
    ids.forEach(record)
  })
  const validate = vi.fn(async (ids: readonly string[]) => {
    ids
      .filter((id) => !current.has(id))
      .forEach((id) => store.invalidate([id], 'Changed'))
    return new Set(ids.filter((id) => current.has(id)))
  })
  const refreshPrepared = vi.fn(async () => undefined)
  const owner = createMechanicalChecks({
    requestId: 'request',
    store,
    validate,
    measure,
    refreshPrepared
  })
  const signal = new AbortController().signal
  return { store, current, findings, record, measure, validate, owner, signal }
}

it('refreshes only changed selected dependencies and retains unrelated passes', async () => {
  const f = fixture()
  const ids = Array.from({ length: 8 }, (_, index) => `region-${index}`)
  ids.forEach(f.record)
  const input = { requestId: 'request', checks: f.store.selection(ids) }
  const first = await f.owner.verify(input, f.signal)
  expect(first.verification.status).toBe('pass')
  expect(f.measure).not.toHaveBeenCalled()
  f.current.delete(ids[2])
  f.findings.set(ids[2], [
    {
      kind: 'container-overflow',
      elementId: 'window',
      parentId: ids[2],
      right: 3
    }
  ])
  const next = await f.owner.verify(input, f.signal)
  expect(f.measure).toHaveBeenCalledExactlyOnceWith([ids[2]], f.signal)
  expect(next.verification.status).toBe('repairable')
  expect(next.checks.filter((item, index) => index !== 2)).toEqual(
    input.checks.filter((item, index) => index !== 2)
  )
  const same = await f.owner.verify(
    { requestId: 'request', checks: next.checks },
    f.signal
  )
  expect(same.verification.progress).toBe(next.verification.progress)
  expect(f.measure).toHaveBeenCalledTimes(1)
})

it('rejects foreign or stale input before reads and preserves partial refreshed results', async () => {
  const f = fixture()
  f.record('a')
  f.record('b')
  const checks = f.store.selection(['a', 'b'])
  await expect(
    f.owner.verify({ requestId: 'foreign', checks }, f.signal)
  ).rejects.toThrow(/request/)
  await expect(
    f.owner.verify(
      { requestId: 'request', checks: [{ checkId: 'a', revision: 900 }] },
      f.signal
    )
  ).rejects.toThrow(/revision/)
  expect(f.validate).not.toHaveBeenCalled()
  f.current.clear()
  f.measure.mockImplementationOnce(async () => {
    f.record('a')
    throw new Error('Transport interrupted')
  })
  const partial = await f.owner.verify(
    { requestId: 'request', checks },
    f.signal
  )
  expect(partial).toMatchObject({
    status: 'partial',
    verification: { status: 'decision-required' }
  })
  expect(partial.checks).toEqual(f.store.selection(['a', 'b']))
  expect(f.store.read({ includePassed: true, ids: ['a'] }).counts.pass).toBe(1)
})

it('keeps terminal retirements and unsupported checks distinct from missing records', async () => {
  const f = fixture()
  f.record('a')
  const checks = f.store.selection(['a'])
  f.store.retire('a', 'Canonical removal')
  expect(
    await f.owner.verify({ requestId: 'request', checks }, f.signal)
  ).toMatchObject({ verification: { status: 'pass' }, checks })
  f.store.record({
    id: 'opaque',
    origin: 'tool',
    status: 'pass',
    evidence: 'Untrusted summary',
    dependencies: {}
  })
  expect(
    await f.owner.verify(
      { requestId: 'request', checks: f.store.selection(['opaque']) },
      f.signal
    )
  ).toMatchObject({ verification: { status: 'decision-required' } })
  expect(f.measure).not.toHaveBeenCalled()
})

it('keeps findings without current receipts unresolved and rejects repairs before writes', async () => {
  const f = fixture()
  f.findings.set('a', [
    { kind: 'container-overflow', elementId: 'child', parentId: 'a' }
  ])
  f.record('a')
  const input = { requestId: 'request', checks: f.store.selection(['a']) }
  f.current.clear()
  f.validate.mockResolvedValue(new Set())
  f.measure.mockResolvedValue(undefined)
  const result = await f.owner.verify(input, f.signal)
  expect(result).toMatchObject({
    status: 'partial',
    verification: { status: 'decision-required' }
  })
  expect(result.unresolved[0].capability).toBeUndefined()
  await expect(f.owner.repairSelection(input, f.signal)).rejects.toBeInstanceOf(
    LocalToolInputError
  )
})

it('classifies a revision changed during repair admission as a prewrite rejection', async () => {
  const f = fixture()
  f.findings.set('a', [
    { kind: 'container-overflow', elementId: 'child', parentId: 'a' }
  ])
  f.record('a')
  const input = { requestId: 'request', checks: f.store.selection(['a']) }
  f.validate.mockImplementationOnce(async () => {
    f.findings.set('a', [
      { kind: 'container-overflow', elementId: 'another', parentId: 'a' }
    ])
    f.record('a')
    return new Set(['a'])
  })
  await expect(f.owner.repairSelection(input, f.signal)).rejects.toBeInstanceOf(
    LocalToolInputError
  )
})
