import { describe, it, expect } from 'vitest'
import { createLocalDesignReview } from '../local-design-review'
const plan = {
  phase: 'plan',
  method: 'Construct a requested view',
  references: [],
  criteria: ['Viewpoint', 'Finish'],
  structureCriteria: ['Viewpoint'],
  detailRequired: true
}
const check = (requirement: string, status = 'pass') => ({
  requirement,
  status,
  evidence: `Observed ${requirement} ${status}`
})
const inspect = (r: ReturnType<typeof createLocalDesignReview>) => [
  r.inspect('root', true, true)?.inspectionId,
  r.inspect('detail', true, false)?.inspectionId
]
describe('construction and comparison review', () => {
  it('admits a structure overview but never treats it as final approval', () => {
    const r = createLocalDesignReview()
    r.record(plan)
    r.mutate()
    const ids = [r.inspect('root', true, true)?.inspectionId]
    expect(
      r.record({
        phase: 'structure',
        inspectionIds: ids,
        checks: [check('Viewpoint')]
      })
    ).toMatchObject({ readyForDetail: true, accepted: false })
    expect(r.getIssue()).toBeTruthy()
    r.mutate()
    expect(() =>
      r.record({
        phase: 'structure',
        inspectionIds: ids,
        checks: [check('Viewpoint')]
      })
    ).toThrow()
    expect(
      r.record({
        phase: 'visual',
        inspectionIds: inspect(r),
        checks: [check('Viewpoint'), check('Finish')]
      })
    ).toMatchObject({ accepted: true })
  })
  it('reports loss of an earlier passing criterion without accepting stale evidence', () => {
    const r = createLocalDesignReview()
    r.record(plan)
    r.mutate()
    const ids = inspect(r)
    r.record({
      phase: 'visual',
      inspectionIds: ids,
      checks: [check('Viewpoint'), check('Finish', 'fail')]
    })
    r.mutate()
    expect(() =>
      r.record({
        phase: 'visual',
        inspectionIds: ids,
        checks: [check('Viewpoint'), check('Finish')]
      })
    ).toThrow()
    const result = r.record({
      phase: 'visual',
      inspectionIds: inspect(r),
      checks: [check('Viewpoint', 'fail'), check('Finish')]
    })
    expect(result).toMatchObject({
      accepted: false,
      regressions: [
        {
          requirement: 'Viewpoint',
          previousEvidence: 'Observed Viewpoint pass',
          currentEvidence: 'Observed Viewpoint fail'
        }
      ]
    })
  })
  it('rejects unrelated or duplicated structure criteria', () => {
    for (const structureCriteria of [['Other'], ['Viewpoint', 'Viewpoint']])
      expect(() =>
        createLocalDesignReview().record({ ...plan, structureCriteria })
      ).toThrow()
  })
})

it('requires a passing structure checkpoint before detail preparation, independent of final acceptance', () => {
  const r = createLocalDesignReview()
  r.record(plan)
  expect(r.getStructureIssue()).toBeTruthy()
  r.mutate()
  r.record({
    phase: 'structure',
    inspectionIds: [r.inspect('root', true, true)?.inspectionId],
    checks: [check('Viewpoint', 'fail')]
  })
  expect(r.getStructureIssue()).toBeTruthy()
  r.record({
    phase: 'structure',
    inspectionIds: [r.inspect('root', true, true)?.inspectionId],
    checks: [check('Viewpoint')]
  })
  expect(r.getStructureIssue()).toBeUndefined()
  r.mutate()
  expect(r.getStructureIssue()).toBeUndefined()
  expect(r.getIssue()).toBeTruthy()
})

it('retains deferred work through mutations and requires a current final disposition', () => {
  const r = createLocalDesignReview()
  r.record(plan)
  r.mutate()
  const deferredDetails = [
    {
      id: 'rear',
      description: 'Rear window pattern',
      reason: 'Probably behind the front facade'
    }
  ]
  expect(
    r.record({
      phase: 'structure',
      inspectionIds: [r.inspect('root', true, true)?.inspectionId],
      checks: [check('Viewpoint')],
      deferredDetails
    })
  ).toMatchObject({ readyForDetail: true, deferredDetails })
  r.mutate()
  const visual = {
    phase: 'visual',
    inspectionIds: inspect(r),
    checks: [check('Viewpoint'), check('Finish')]
  }
  expect(r.record(visual)).toMatchObject({
    accepted: false,
    pendingDetails: ['rear']
  })
  expect(r.getIssue()).toContain('rear')
  expect(
    r.record({
      ...visual,
      deferredChecks: [
        {
          id: 'rear',
          status: 'omit',
          evidence:
            'Current view shows the front facade fully covering the rear windows'
        }
      ]
    })
  ).toMatchObject({ accepted: true, pendingDetails: [] })
  r.mutate()
  expect(r.record({ ...visual, inspectionIds: inspect(r) })).toMatchObject({
    accepted: false,
    pendingDetails: ['rear']
  })
  expect(
    r.record({
      ...visual,
      inspectionIds: inspect(r),
      deferredChecks: [
        {
          id: 'rear',
          status: 'restored',
          evidence:
            'Changed view exposed this part; windows have been restored and checked'
        }
      ]
    })
  ).toMatchObject({ accepted: true })
  expect(() =>
    r.record({
      ...visual,
      deferredChecks: [{ id: 'rear', status: 'omit', evidence: 'stale' }]
    })
  ).toThrow()
})

it('rejects unknown, duplicate or empty deferred dispositions and isolates requests', () => {
  const r = createLocalDesignReview()
  r.record({
    ...plan,
    deferredDetails: [
      { id: 'rear', description: 'Rear', reason: 'Likely covered' }
    ]
  })
  r.mutate()
  const visual = {
    phase: 'visual',
    inspectionIds: inspect(r),
    checks: [check('Viewpoint'), check('Finish')]
  }
  for (const deferredChecks of [
    [{ id: 'unknown', status: 'omit', evidence: 'covered' }],
    [{ id: 'rear', status: 'omit', evidence: '' }],
    [
      { id: 'rear', status: 'omit', evidence: 'covered' },
      { id: 'rear', status: 'restored', evidence: 'drawn' }
    ]
  ])
    expect(() => r.record({ ...visual, deferredChecks })).toThrow()
  const other = createLocalDesignReview()
  other.record(plan)
  other.mutate()
  expect(
    other.record({ ...visual, inspectionIds: inspect(other) })
  ).toMatchObject({ accepted: true })
})

it('reopens final review when a later structure assessment declares deferred work', () => {
  const r = createLocalDesignReview()
  r.record(plan)
  r.mutate()
  r.record({
    phase: 'visual',
    inspectionIds: inspect(r),
    checks: [check('Viewpoint'), check('Finish')]
  })
  expect(r.getIssue()).toBeUndefined()
  r.record({
    phase: 'structure',
    inspectionIds: [r.inspect('root', true, true)?.inspectionId],
    checks: [check('Viewpoint')],
    deferredDetails: [
      { id: 'edge', description: 'Edge ornament', reason: 'Possibly hidden' }
    ]
  })
  expect(r.getIssue()).toBeTruthy()
})

it.each(
  [
    [{ id: 'x', description: 'part', reason: '' }],
    [{ id: 'x', description: 'part', reason: 'covered', geometry: [] }],
    [
      { id: 'x', description: 'part', reason: 'covered' },
      { id: 'x', description: 'part', reason: 'covered' }
    ]
  ].map((deferredDetails) => ({ deferredDetails }))
)(
  'rejects malformed deferred additions without recording them',
  ({ deferredDetails }) => {
    const r = createLocalDesignReview()
    expect(() => r.record({ ...plan, deferredDetails })).toThrow()
    r.record(plan)
    r.mutate()
    expect(
      r.record({
        phase: 'visual',
        inspectionIds: inspect(r),
        checks: [check('Viewpoint'), check('Finish')]
      })
    ).toMatchObject({ accepted: true, deferredDetails: [] })
  }
)
