import { createLocalImageTools } from '../local-image-tools'
const reviewCriteria = (names: readonly string[]) =>
  Object.fromEntries(
    names.map((id) => [
      id,
      { requirement: id, description: id, verification: 'visual' }
    ])
  )
import { describe, it, expect } from 'vitest'
import {
  createLocalDesignReview,
  designEvidenceSchema,
  designEvidenceDefinitions,
  reviewPlanSchema,
  reviewPlanExample
} from '../local-design-review'
import { operationInputIssue } from '../operation-input-schema'
const plan = {
  phase: 'plan',
  method: 'Construct a requested view',
  references: [],
  criteria: reviewCriteria(['Viewpoint', 'Finish']),
  structureCriteria: ['Viewpoint'],
  detailRequired: true
}
const testReferenceImages = createLocalImageTools({
  metadata: {
    imageAttachments: ['YQ==', 'Yg==', 'Yw=='].map((bytes) => ({
      dataUrl: `data:image/png;base64,${bytes}`
    }))
  }
})
const referenceReview = (
  options: Parameters<typeof createLocalDesignReview>[0] = {}
) =>
  createLocalDesignReview({
    ...options,
    validateReferences: testReferenceImages.validateReferences,
    resolveSources: testReferenceImages.resolveSources
  })
const assessReferences = (
  review: ReturnType<typeof createLocalDesignReview>,
  indexes: number[]
) =>
  review.selectReferences(indexes, {
    requirementRevision: 1,
    referenceDecisions: testReferenceImages
      .validateReferences(indexes)
      .map(({ referenceId }) => ({
        referenceId,
        status: 'accepted',
        reason: 'Explicit fixture assessment',
        criterionIds: ['Viewpoint', 'Finish'],
        limitations: []
      }))
  })
const check = (criterionId: string, status = 'pass') => ({
  criterionId,
  status,
  evidence: `Observed ${criterionId} ${status}`
})
const inspect = (r: ReturnType<typeof createLocalDesignReview>) => [
  r.inspect('root', true, true)?.inspectionId,
  r.inspect('detail', true, false)?.inspectionId
]
describe('construction and comparison review', () => {
  it('acknowledges plan storage without retransmitting narrative and retains review state', () => {
    const review = createLocalDesignReview()
    const source = {
      ...plan,
      method: 'Use supplied coordinates. '.repeat(8),
      references: ['https://example.com/verified-source'],
      criteria: {
        Viewpoint: {
          requirement: 'Requested angle',
          description: 'Visible top surface',
          verification: 'visual'
        },
        Finish: {
          requirement: 'Rough sketch',
          description: 'Keep rough lines',
          verification: 'visual'
        }
      },
      deferredDetails: [
        {
          id: 'back',
          description: 'Hidden back',
          reason: 'Not visible in the selected view'
        }
      ]
    }
    const saved = review.record(source)
    expect(saved).toEqual({
      phase: 'plan',
      recorded: true,
      requirementRevision: 1,
      criterionIds: ['Viewpoint', 'Finish'],
      facts: [],
      deferredDetailIds: ['back']
    })
    const longer = createLocalDesignReview().record({
      ...source,
      method: source.method.repeat(2),
      criteria: {
        ...source.criteria,
        Finish: {
          ...source.criteria.Finish,
          description: 'Keep rough lines. '.repeat(8)
        }
      }
    })
    expect(JSON.stringify(longer)).toBe(JSON.stringify(saved))
    review.mutate()
    expect(
      review.record({
        phase: 'visual',
        final: false,
        inspectionIds: inspect(review),
        checks: [check('Viewpoint')]
      })
    ).toMatchObject({ accepted: false })
    expect(() =>
      review.record({
        phase: 'visual',
        inspectionIds: inspect(review),
        checks: [check('Unknown')]
      })
    ).toThrow()
    expect(
      review.record({
        phase: 'visual',
        inspectionIds: inspect(review),
        checks: [check('Viewpoint'), check('Finish')],
        deferredChecks: [
          { id: 'back', status: 'omit', evidence: 'Back remains fully hidden' }
        ]
      })
    ).toMatchObject({ accepted: true })
  })
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
          criterionId: 'Viewpoint',
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

it('reports whole-structure readiness independently of final acceptance and preparation', () => {
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

it('advertises required plan and inspection fields before tool execution', () => {
  const schema = designEvidenceSchema
  for (const field of ['method', 'references', 'criteria', 'detailRequired']) {
    const input = Object.fromEntries(
      Object.entries(plan).filter(([key]) => key !== field)
    )
    expect(operationInputIssue(input, schema), field).toBeDefined()
  }
  expect(operationInputIssue(plan, schema)).toBeUndefined()
  for (const phase of ['structure', 'visual']) {
    expect(operationInputIssue({ phase }, schema)).toBeDefined()
    expect(
      operationInputIssue(
        { phase, inspectionIds: ['current'], checks: [check('Viewpoint')] },
        schema
      )
    ).toBeUndefined()
  }
})

it('retains field validation when native discovery projects a review alternative', () => {
  const planSchema = designEvidenceSchema.oneOf.find(
    (schema) => schema.properties.phase.const === 'plan'
  )
  const inspectionSchema = designEvidenceSchema.oneOf.find(
    (schema) => schema.properties.phase.const === 'visual'
  )
  if (!planSchema || !inspectionSchema)
    throw new Error('Missing review phase schema')
  expect(operationInputIssue(plan, planSchema)).toBeUndefined()
  for (const patch of [
    { method: 42 },
    { references: [42] },
    { criteria: [42] },
    { detailRequired: 'yes' }
  ]) {
    expect(operationInputIssue({ ...plan, ...patch }, planSchema)).toBeDefined()
  }
  const visual = {
    phase: 'visual',
    inspectionIds: ['current'],
    checks: [check('Viewpoint')]
  }
  expect(operationInputIssue(visual, inspectionSchema)).toBeUndefined()
  expect(
    operationInputIssue(
      {
        ...visual,
        checks: [{ criterionId: 'Viewpoint', status: 'pass', evidence: 42 }]
      },
      inspectionSchema
    )
  ).toBeDefined()
})

const sourceFact = {
  id: 'tower-axis',
  statement: 'The verified source uses the existing tower axis.',
  scope:
    'Source geometry only; not a claim that the rendered canvas is correct.',
  sources: ['https://example.com/survey-v1'],
  verification: 'Compared the source coordinates with the supplied survey.',
  dependencies: [{ key: 'reference:survey', version: '1' }]
}

it('keeps complete plan facts and bindings behind the compact acknowledgement', () => {
  const review = createLocalDesignReview()
  const factBindings = [
    {
      factId: sourceFact.id,
      criterionId: 'Viewpoint',
      elementIds: ['existing-element']
    }
  ]
  expect(review.record({ ...plan, facts: [sourceFact], factBindings })).toEqual(
    {
      phase: 'plan',
      recorded: true,
      requirementRevision: 1,
      criterionIds: ['Viewpoint', 'Finish'],
      facts: [{ id: sourceFact.id, status: 'valid' }],
      deferredDetailIds: []
    }
  )
  expect(review.record({ phase: 'facts' })).toMatchObject({
    facts: [{ ...sourceFact, status: 'valid' }],
    factBindings
  })
  expect(review.isAccepted()).toBe(false)
})

it('retains verified source facts across drawing revisions without rejudging them', () => {
  const review = createLocalDesignReview()
  expect(
    operationInputIssue(
      { phase: 'facts', facts: [sourceFact] },
      designEvidenceSchema
    )
  ).toBeUndefined()
  const saved = review.record({ phase: 'facts', facts: [sourceFact] })
  expect(saved).toMatchObject({ facts: [{ ...sourceFact, status: 'valid' }] })
  review.mutate()
  review.mutate()
  expect(review.record({ phase: 'facts' })).toEqual(saved)
  // Fact retention cannot certify current pixels or permit stale inspection IDs.
  expect(review.isAccepted()).toBe(false)
  expect(review.getIssue()).toBeTruthy()
  const detached = review.record({ phase: 'facts' }) as {
    facts: { statement: string }[]
  }
  detached.facts[0].statement = 'Changed by consumer'
  expect(review.record({ phase: 'facts' })).toEqual(saved)
  expect(createLocalDesignReview().record({ phase: 'facts' })).toMatchObject({
    facts: []
  })
})

it('invalidates only changed source dependencies and requires explicit evidence to replace a fact', () => {
  const review = createLocalDesignReview()
  const unitFact = {
    ...sourceFact,
    id: 'scale',
    dependencies: [{ key: 'request:scale', version: '1' }]
  }
  review.record({ phase: 'facts', facts: [sourceFact, unitFact] })
  expect(() =>
    review.record({
      phase: 'facts',
      facts: [{ ...sourceFact, statement: 'Looks better centered' }]
    })
  ).toThrow(/valid fact/i)
  expect(() =>
    review.record({
      phase: 'facts',
      dependencyChanges: [
        {
          key: 'reference:survey',
          version: '2',
          reason: 'aesthetic',
          evidence: 'looks better'
        }
      ]
    })
  ).toThrow()
  const change = {
    key: 'reference:survey',
    version: '2',
    reason: 'source_changed',
    evidence: 'The corrected survey supersedes revision 1.'
  }
  expect(
    review.record({ phase: 'facts', dependencyChanges: [change] })
  ).toMatchObject({
    facts: [
      { id: 'tower-axis', status: 'invalidated', invalidatedBy: [change] },
      { id: 'scale', status: 'valid' }
    ]
  })
  expect(() => review.record({ phase: 'facts', facts: [sourceFact] })).toThrow(
    /version/i
  )
  const corrected = {
    ...sourceFact,
    dependencies: [{ key: 'reference:survey', version: '2' }],
    verification: 'Verified the corrected survey.'
  }
  expect(review.record({ phase: 'facts', facts: [corrected] })).toMatchObject({
    facts: [
      { ...corrected, status: 'valid' },
      { id: 'scale', status: 'valid' }
    ]
  })
})

it('rejects incomplete and conflicting fact changes atomically', () => {
  const review = createLocalDesignReview()
  review.record({ phase: 'facts', facts: [sourceFact] })
  const saved = review.record({ phase: 'facts' })
  for (const patch of [
    { sources: [] },
    { verification: '' },
    { scope: '' },
    { dependencies: [] },
    { dependencies: [{ key: 'reference:survey', version: 'other' }] }
  ])
    expect(() =>
      review.record({
        phase: 'facts',
        facts: [{ ...sourceFact, id: 'other', ...patch }]
      })
    ).toThrow()
  expect(() =>
    review.record({
      phase: 'facts',
      dependencyChanges: [
        {
          key: 'reference:survey',
          version: '2',
          reason: 'source_changed',
          evidence: 'Revised source'
        },
        {
          key: 'unknown',
          version: '2',
          reason: 'source_changed',
          evidence: 'Unknown dependency'
        }
      ]
    })
  ).toThrow()
  expect(review.record({ phase: 'facts' })).toEqual(saved)
})

it('reopens completion when a source fact changes and cannot approve unresolved facts', () => {
  const review = createLocalDesignReview()
  review.record(plan)
  review.record({ phase: 'facts', facts: [sourceFact] })
  review.mutate()
  const visual = {
    phase: 'visual',
    inspectionIds: inspect(review),
    checks: [check('Viewpoint'), check('Finish')]
  }
  review.record(visual)
  expect(review.isAccepted()).toBe(true)
  review.record({
    phase: 'facts',
    dependencyChanges: [
      {
        key: 'reference:survey',
        version: '2',
        reason: 'contradicting_evidence',
        evidence: 'Source coordinate was corrected.'
      }
    ]
  })
  expect(review.isAccepted()).toBe(false)
  expect(review.getIssue()).toMatch(/source fact/i)
  expect(review.record(visual)).toMatchObject({ accepted: false })
})

it('captures facts with the first plan and binds their application to current criterion checks', () => {
  const review = createLocalDesignReview()
  const input = { ...plan, facts: [sourceFact] }
  expect(operationInputIssue(input, designEvidenceSchema)).toBeUndefined()
  expect(review.record(input)).toMatchObject({
    facts: [{ id: sourceFact.id, status: 'valid' }]
  })
  const factBindings = [
    { factId: sourceFact.id, criterionId: 'Viewpoint', elementIds: ['crown'] }
  ]
  expect(
    operationInputIssue({ phase: 'facts', factBindings }, designEvidenceSchema)
  ).toBeUndefined()
  review.record({ phase: 'facts', factBindings })
  expect(review.factTargets()).toEqual(['crown'])
  review.mutate()
  const visual = {
    phase: 'visual',
    inspectionIds: inspect(review),
    checks: [check('Viewpoint'), check('Finish')]
  }
  expect(review.record(visual)).toMatchObject({
    accepted: true,
    checks: [
      { ...check('Viewpoint'), factIds: [sourceFact.id] },
      { ...check('Finish'), factIds: [] }
    ]
  })
  review.record({
    phase: 'facts',
    dependencyChanges: [
      {
        key: 'reference:survey',
        version: '2',
        reason: 'user_request',
        evidence: 'User supplied corrected axis'
      }
    ]
  })
  expect(review.getIssue()).toMatch(/unverified/)
  expect(review.record({ phase: 'facts' })).toMatchObject({
    factBindings,
    facts: [{ status: 'invalidated' }]
  })
  review.mutate()
  expect(review.factTargets()).toEqual(['crown'])
})

it('rejects invalid bindings atomically and does not borrow another invocation targets', () => {
  const review = createLocalDesignReview()
  review.record(plan)
  expect(() =>
    review.record({
      phase: 'facts',
      facts: [sourceFact],
      factBindings: [
        {
          factId: sourceFact.id,
          criterionId: 'Invented',
          elementIds: ['crown']
        }
      ]
    })
  ).toThrow()
  expect(review.record({ phase: 'facts' })).toMatchObject({
    facts: [],
    factBindings: []
  })
  expect(createLocalDesignReview().factTargets()).toEqual([])
  expect(() =>
    review.record({ ...plan, facts: [sourceFact], criteria: [] })
  ).toThrow()
  expect(review.record({ phase: 'facts' })).toMatchObject({ facts: [] })
})

it('allows a focused intermediate assessment without certifying unfinished final criteria', () => {
  const review = createLocalDesignReview()
  review.record(plan)
  review.mutate()
  const overview = [review.inspect('root', true, true)?.inspectionId]
  const stage = {
    phase: 'visual',
    final: false,
    inspectionIds: overview,
    checks: [check('Viewpoint')]
  }
  expect(operationInputIssue(stage, designEvidenceSchema)).toBeUndefined()
  expect(review.record(stage)).toMatchObject({
    accepted: false,
    checks: [check('Viewpoint')]
  })
  expect(review.getIssue()).toBeTruthy()
  expect(() => review.record({ ...stage, final: true })).toThrow()
  expect(
    review.record({
      phase: 'visual',
      inspectionIds: inspect(review),
      checks: [check('Viewpoint'), check('Finish')]
    })
  ).toMatchObject({ accepted: true })
})

it('reuses an identical fact regardless of JSON property order', () => {
  const review = createLocalDesignReview()
  const first = review.record({ phase: 'facts', facts: [sourceFact] })
  const reordered = Object.fromEntries(Object.entries(sourceFact).reverse())
  expect(review.record({ phase: 'facts', facts: [reordered] })).toEqual(first)
})

describe('phase-specific tool admission', () => {
  const structure = {
    phase: 'structure',
    inspectionIds: ['current'],
    checks: [check('Viewpoint')]
  }
  const visual = { ...structure, phase: 'visual' }
  it.each([
    [plan, { final: true }],
    [plan, { inspectionIds: ['current'] }],
    [plan, { checks: [check('Viewpoint')] }],
    [plan, { deferredChecks: [] }],
    [structure, { final: false }],
    [structure, { facts: [] }],
    [structure, { factBindings: [] }],
    [structure, { dependencyChanges: [] }],
    [structure, { deferredChecks: [] }],
    [visual, { facts: [] }],
    [visual, { factBindings: [] }],
    [visual, { dependencyChanges: [] }],
    [visual, { method: 'irrelevant plan input' }],
    [{ phase: 'facts' }, { checks: [check('Viewpoint')] }]
  ])(
    'rejects fields outside the selected phase before execution: %j + %j',
    (input, fields) => {
      expect(
        operationInputIssue({ ...input, ...fields }, designEvidenceSchema)
      ).toBeDefined()
    }
  )
  it.each([
    plan,
    {
      ...plan,
      facts: [sourceFact],
      factBindings: [
        {
          factId: sourceFact.id,
          criterionId: 'Viewpoint',
          elementIds: ['root']
        }
      ]
    },
    { phase: 'facts' },
    { phase: 'facts', facts: [sourceFact] },
    structure,
    { ...visual, final: false },
    {
      ...visual,
      final: true,
      deferredChecks: [
        { id: 'rear', status: 'omit', evidence: 'Covered in the current view' }
      ]
    }
  ])(
    'admits a complete valid phase independently after native discovery: %j',
    (input) => {
      expect(operationInputIssue(input, designEvidenceSchema)).toBeUndefined()
      const branches = designEvidenceSchema.oneOf.filter(
        (schema) => operationInputIssue(input, schema) === undefined
      )
      expect(branches).toHaveLength(1)
      expect(
        operationInputIssue({ ...input, unrelated: true }, branches[0])
      ).toBeDefined()
    }
  )
})

it('retains observable structure checks linked to the original request by stable IDs', () => {
  const review = createLocalDesignReview()
  const input = {
    phase: 'plan',
    method: 'Use reference-based visible surfaces',
    references: [],
    criteria: {
      silhouette: {
        requirement: 'Draw a detailed tower',
        description: 'Preserve flared tiers and recessed corners',
        verification: 'visual'
      },
      finish: {
        requirement: 'Draw a detailed tower',
        description:
          'Check surface contacts and stray lines against the reference',
        verification: 'visual'
      }
    },
    structureCriteria: ['silhouette'],
    detailRequired: true
  }
  expect(operationInputIssue(input, designEvidenceSchema)).toBeUndefined()
  expect(review.record(input)).toMatchObject({
    criterionIds: ['silhouette', 'finish']
  })
  expect(review.comparisonContext('structure').criteria).toEqual({
    silhouette: { requirement: input.criteria.silhouette.requirement }
  })
  const inspectionIds = inspect(review)
  expect(
    review.record({
      phase: 'structure',
      inspectionIds,
      checks: [
        {
          criterionId: 'silhouette',
          status: 'pass',
          evidence: 'Flared outline and recessed corners observed'
        }
      ]
    })
  ).toMatchObject({ readyForDetail: true, accepted: false })
  expect(() =>
    review.record({
      phase: 'visual',
      inspectionIds,
      checks: [
        {
          criterionId: 'silhouette',
          status: 'pass',
          evidence: 'Structure remains correct'
        }
      ]
    })
  ).toThrow(/every planned criterion/)
  expect(
    review.record({
      phase: 'visual',
      inspectionIds,
      checks: [
        {
          criterionId: 'silhouette',
          status: 'pass',
          evidence: 'Structure remains correct'
        },
        {
          criterionId: 'finish',
          status: 'fail',
          evidence: 'Stray lines extend beyond the surface'
        }
      ]
    })
  ).toMatchObject({ accepted: false })
})

it('provides executable fact and binding examples in the native-discoverable description', () => {
  const examples = [
    ...requireTestValue(
      designEvidenceDefinitions.find(
        (tool) => tool.name === 'record_design_facts'
      )
    ).description.matchAll(/```json\n([\s\S]*?)\n```/g)
  ].map((match) => JSON.parse(match[1]))
  expect(examples.length).toBeGreaterThanOrEqual(2)
  const review = createLocalDesignReview()
  review.record({
    ...plan,
    criteria: {
      viewpoint: {
        requirement: 'Use the requested view',
        description: 'Preserve source axis',
        verification: 'visual'
      }
    },
    structureCriteria: []
  })
  for (const example of examples) {
    expect(operationInputIssue(example, designEvidenceSchema)).toBeUndefined()
    expect(() => review.record(example)).not.toThrow()
  }
  expect(review.record({ phase: 'facts' })).toMatchObject({
    facts: [expect.objectContaining({ status: 'valid' })],
    factBindings: [expect.objectContaining({ criterionId: 'viewpoint' })]
  })
})

it('advertises an executable deferred-detail example including the required reason', () => {
  const description =
    designEvidenceSchema.properties.deferredDetails.description
  const match = description.match(/Example: (\{.*\})/)
  expect(match).not.toBeNull()
  if (!match) throw new Error('Missing deferred-detail example')
  const item = JSON.parse(match[1])
  const input = { ...plan, deferredDetails: [item] }
  expect(operationInputIssue(input, designEvidenceSchema)).toBeUndefined()
  expect(createLocalDesignReview().record(input)).toMatchObject({
    deferredDetailIds: [item.id]
  })
  const { reason: _reason, ...missingReason } = item
  expect(
    operationInputIssue(
      { ...plan, deferredDetails: [missingReason] },
      designEvidenceSchema
    )
  ).toContain('reason')
})

it('cannot approve self-rated structure when independent visual evidence disagrees', () => {
  const r = createLocalDesignReview({ independentAssessment: true })
  r.record(plan)
  r.mutate()
  const input = {
    phase: 'structure',
    inspectionIds: [r.inspect('root', true, true)?.inspectionId],
    checks: [check('Viewpoint')]
  }
  expect(r.record(input)).toMatchObject({ readyForDetail: false })
  expect(
    r.record(input, {
      overall: {
        status: 'fail',
        evidence: 'The requested whole form is not present.'
      },
      checks: [
        {
          criterionId: 'Viewpoint',
          status: 'fail',
          evidence:
            'The two faces form an unfolded sheet rather than the requested solid tower.'
        }
      ]
    })
  ).toMatchObject({
    readyForDetail: false,
    independentAssessment: { checks: [{ status: 'fail' }] }
  })
  expect(r.getStructureIssue()).toBeTruthy()
  expect(
    r.record(input, {
      overall: {
        status: 'pass',
        evidence: 'The requested whole form is present.'
      },
      checks: [check('Viewpoint')]
    })
  ).toMatchObject({
    readyForDetail: true
  })
})

it('rejects the whole requested form even when each named criterion passes', () => {
  const r = createLocalDesignReview({ independentAssessment: true })
  r.record(plan)
  r.mutate()
  const args = {
    phase: 'structure',
    inspectionIds: [r.inspect('root', true, true)?.inspectionId],
    checks: [check('Viewpoint')]
  }
  const independent = {
    overall: {
      status: 'fail' as const,
      evidence:
        'Individually consistent edges form disconnected sheets, not the requested solid.'
    },
    checks: [check('Viewpoint')]
  }
  expect(r.record(args, independent)).toMatchObject({ readyForDetail: false })
  expect(r.comparisonContext('structure')).toMatchObject({
    previousFindings: { overall: { evidence: independent.overall.evidence } }
  })
})

it('validates a candidate without overwriting the previous completed review', () => {
  const r = createLocalDesignReview()
  r.record({ ...plan, detailRequired: false })
  r.mutate()
  const args = {
    phase: 'visual',
    inspectionIds: [r.inspect('root', true, true)?.inspectionId],
    checks: [check('Viewpoint'), check('Finish')]
  }
  r.record(args)
  const changed = {
    ...args,
    checks: [check('Viewpoint', 'fail'), check('Finish')]
  }
  r.validateReview(changed)
  expect(r.isAccepted()).toBe(true)
  expect(r.record(changed)).toMatchObject({
    regressions: [{ criterionId: 'Viewpoint' }]
  })
})

it('keeps the independent comparison free of self-ratings and construction choices', () => {
  const r = referenceReview({ independentAssessment: true })
  r.record({
    ...plan,
    method: 'Assume this geometry is correct',
    referenceImageIndexes: [1]
  })
  assessReferences(r, [1])
  const comparison = r.comparisonContext('structure')
  expect(comparison).toMatchObject({
    criteria: { Viewpoint: { requirement: 'Viewpoint' } },
    referenceImageIndexes: [1],
    sourceFacts: []
  })
  expect(JSON.stringify(comparison)).not.toContain('Assume')
})

it('requires independent final evidence and never upgrades the drawing agent’s own failure', () => {
  const r = createLocalDesignReview({ independentAssessment: true })
  r.record({ ...plan, detailRequired: false })
  r.mutate()
  const args = {
    phase: 'visual',
    inspectionIds: [r.inspect('root', true, true)?.inspectionId],
    checks: [check('Viewpoint'), check('Finish')]
  }
  expect(r.record(args)).toMatchObject({ accepted: false })
  expect(() =>
    r.record(args, {
      overall: { status: 'pass', evidence: 'Whole form' },
      checks: []
    })
  ).toThrow()
  expect(
    r.record(args, {
      overall: { status: 'pass', evidence: 'Whole form agrees.' },
      checks: [check('Viewpoint'), check('Finish', 'unverified')]
    })
  ).toMatchObject({ accepted: false })
  expect(
    r.record(
      { ...args, checks: [check('Viewpoint', 'fail'), check('Finish')] },
      {
        overall: {
          status: 'pass',
          evidence: 'The requested whole form is present.'
        },
        checks: [check('Viewpoint'), check('Finish')]
      }
    )
  ).toMatchObject({ accepted: false })
  expect(
    r.record(args, {
      overall: {
        status: 'pass',
        evidence: 'The requested whole form is present.'
      },
      checks: [check('Viewpoint'), check('Finish')]
    })
  ).toMatchObject({ accepted: true })
})

it('can select a replacement reference after drawing without rewriting requirements', () => {
  const r = referenceReview({ independentAssessment: true })
  r.record({ ...plan, referenceImageIndexes: [0] })
  r.mutate()
  assessReferences(r, [2])
  expect(r.comparisonContext('structure')).toMatchObject({
    referenceImageIndexes: [2],
    criteria: { Viewpoint: { requirement: 'Viewpoint' } }
  })
  expect(() => r.selectReferences([-1])).toThrow()
})

it('routes visual and data evidence separately without dropping the data requirement', () => {
  const r = createLocalDesignReview({ independentAssessment: true })
  r.record({
    ...plan,
    detailRequired: false,
    criteria: {
      view: {
        requirement: 'solid tower',
        description: 'joined faces',
        verification: 'visual'
      },
      scale: {
        requirement: '1cm=1px',
        description: 'canonical numeric scale',
        verification: 'data'
      }
    },
    structureCriteria: ['view', 'scale']
  })
  r.mutate()
  expect(r.comparisonContext('structure').criteria).toEqual({
    view: { requirement: 'solid tower' }
  })
  const args = {
    phase: 'structure',
    inspectionIds: [r.inspect('root', true, true)?.inspectionId],
    checks: [check('view'), check('scale')]
  }
  expect(
    r.record(args, {
      overall: {
        status: 'pass',
        evidence: 'The requested whole form is present.'
      },
      checks: [check('view')]
    })
  ).toMatchObject({
    readyForDetail: true
  })
  expect(
    r.record(
      { ...args, checks: [check('view'), check('scale', 'unverified')] },
      {
        overall: {
          status: 'pass',
          evidence: 'The requested whole form is present.'
        },
        checks: [check('view')]
      }
    )
  ).toMatchObject({ readyForDetail: false })
})

it('preserves an explicit reference when resubmitting a plan without reference changes', () => {
  const r = referenceReview()
  r.record({ ...plan, referenceImageIndexes: [1] })
  assessReferences(r, [1])
  r.record(plan)
  expect(r.comparisonContext('structure').referenceImageIndexes).toEqual([1])
  r.record({ ...plan, referenceImageIndexes: [] })
  expect(r.comparisonContext('structure').referenceImageIndexes).toEqual([])
})

it.each(['plan', 'references'])(
  'admits reference selection through the advertised %s tool schema',
  (phase) => {
    const input =
      phase === 'plan'
        ? { ...plan, referenceImageIndexes: [1] }
        : { referenceImageIndexes: [1] }
    const schema =
      phase === 'plan'
        ? designEvidenceSchema
        : requireTestValue(
            designEvidenceDefinitions.find(
              (tool) => tool.name === 'select_design_references'
            )
          ).inputSchema
    expect(operationInputIssue(input, schema)).toBeUndefined()
  }
)

it('keeps failed findings through stale passes and clears them only after fresh independent agreement', () => {
  const r = createLocalDesignReview({ independentAssessment: true })
  r.record(plan)
  const fail = {
    overall: { status: 'fail' as const, evidence: 'Disconnected faces' },
    checks: [check('Viewpoint', 'fail')]
  }
  r.retainAssessment('structure', fail, false)
  r.mutate()
  const pass = {
    overall: { status: 'pass' as const, evidence: 'Joined faces' },
    checks: [check('Viewpoint')]
  }
  r.retainAssessment('structure', pass, false)
  expect(r.comparisonContext('structure').previousFindings).toMatchObject({
    overall: { evidence: 'Disconnected faces' },
    criteria: { Viewpoint: { phase: 'structure' } }
  })
  expect(r.isAccepted()).toBe(false)
  r.retainAssessment('structure', pass, true)
  expect(r.comparisonContext('structure')).not.toHaveProperty(
    'previousFindings'
  )
})

it('advertises stage review without requiring whole-structure approval for drawing', () => {
  expect(
    requireTestValue(
      designEvidenceDefinitions.find((tool) => tool.name === 'review_drawing')
    ).description
  ).toContain('optional whole-structure checkpoint')
  expect(JSON.stringify(designEvidenceSchema)).not.toContain(
    'before dense detail'
  )
  expect(
    requireTestValue(
      designEvidenceDefinitions.find((tool) => tool.name === 'review_drawing')
    ).description
  ).not.toContain('Before dense detail')
})

it('admits the published plan example through the real schema and review owner', () => {
  expect(
    operationInputIssue(reviewPlanExample, reviewPlanSchema)
  ).toBeUndefined()
  const review = createLocalDesignReview()
  expect(review.record(reviewPlanExample)).toMatchObject({ recorded: true })
  for (const field of reviewPlanSchema.properties.criteria.additionalProperties
    .required) {
    const invalid = {
      ...reviewPlanExample,
      criteria: {
        appearance: Object.fromEntries(
          Object.entries(reviewPlanExample.criteria.appearance).filter(
            ([key]) => key !== field
          )
        )
      }
    }
    expect(operationInputIssue(invalid, reviewPlanSchema)).toContain(field)
    expect(() => createLocalDesignReview().record(invalid)).toThrow()
  }
})

it('records initial criteria after first pixels without accepting or rewriting the result', () => {
  const review = createLocalDesignReview({ independentAssessment: true })
  review.mutate()
  expect(review.getIssue()).toBeDefined()
  expect(review.record(plan)).toMatchObject({ recorded: true })
  expect(review.getIssue()).toBeDefined()
  expect(() => review.record({ ...plan, detailRequired: false })).toThrow()
  expect(review.comparisonContext('visual').criteria).toEqual({
    Viewpoint: { requirement: 'Viewpoint' },
    Finish: { requirement: 'Finish' }
  })
  expect(
    review.record({
      phase: 'visual',
      inspectionIds: inspect(review),
      checks: [check('Viewpoint'), check('Finish')]
    })
  ).toMatchObject({ accepted: false })
})

it('passes only valid bound source facts and their limitations to independent visual comparison', () => {
  const review = referenceReview()
  const fact = {
    ...sourceFact,
    scope:
      'Establishes tower massing only; construction photo does not establish finished facade detail.'
  }
  review.record({
    ...plan,
    referenceImageIndexes: [1],
    criteria: {
      ...plan.criteria,
      Scale: {
        requirement: 'Scale',
        description: 'Metric scale',
        verification: 'data'
      }
    },
    facts: [
      fact,
      { ...sourceFact, id: 'unrelated' },
      { ...sourceFact, id: 'data-only' }
    ],
    factBindings: [
      { factId: fact.id, criterionId: 'Viewpoint', elementIds: ['tower'] },
      { factId: 'data-only', criterionId: 'Scale', elementIds: ['tower'] }
    ]
  })
  assessReferences(review, [1])
  review.mutate()
  const expected = [
    {
      id: fact.id,
      criterionIds: ['Viewpoint'],
      statement: fact.statement,
      scope: fact.scope,
      sources: fact.sources,
      verification: fact.verification
    }
  ]
  expect(review.comparisonContext('visual')).toMatchObject({
    referenceImageIndexes: [1],
    sourceFacts: expected
  })
  const detached = review.comparisonContext('visual')
  const retainedFact = detached.sourceFacts?.[0]
  if (!retainedFact) throw new Error('Missing bound source fact')
  retainedFact.sources[0] = 'mutated'
  expect(review.comparisonContext('structure').sourceFacts).toMatchObject(
    expected
  )
  assessReferences(review, [2])
  review.record({
    phase: 'facts',
    dependencyChanges: [
      {
        key: 'reference:survey',
        version: '2',
        reason: 'source_changed',
        evidence: 'Replaced construction image with completed building.'
      }
    ]
  })
  expect(review.comparisonContext('visual')).toMatchObject({
    referenceImageIndexes: [2],
    sourceFacts: []
  })
  expect(review.isAccepted()).toBe(false)
})

it('hands all unresolved criteria and inspected scope to correction without accepting stale evidence', () => {
  const r = createLocalDesignReview({ independentAssessment: true })
  r.record(plan)
  r.mutate()
  const region = { x: 10, y: 20, width: 30, height: 40 }
  const overview = r.inspect('drawing', true, true)?.inspectionId as string
  const detail = r.inspect('tier', true, false, region)?.inspectionId as string
  const inspectionIds = [overview, detail]
  const failed = {
    overall: {
      status: 'fail' as const,
      evidence: 'Visible relationships disagree'
    },
    checks: [check('Viewpoint', 'fail'), check('Finish', 'fail')]
  }
  const result = r.record(
    { phase: 'visual', inspectionIds, checks: failed.checks },
    failed
  )
  expect(result.correction).toMatchObject({
    diagnosticOnly: true,
    requiresFreshReview: true,
    overall: { evidence: failed.overall.evidence },
    criteria: [
      { criterionId: 'Viewpoint', elementIds: [] },
      { criterionId: 'Finish', elementIds: [] }
    ],
    inspections: [
      { elementId: 'drawing' },
      { elementId: 'tier', region, coordinateSpace: 'element-local' }
    ]
  })
  r.mutate()
  expect(r.correctionContext()).toMatchObject({
    criteria: [{ criterionId: 'Viewpoint' }, { criterionId: 'Finish' }],
    inspections: []
  })
  const passed = {
    overall: { status: 'pass' as const, evidence: 'Corrected' },
    checks: [check('Viewpoint'), check('Finish')]
  }
  r.retainAssessment('visual', passed, false)
  expect(r.correctionContext().criteria).toHaveLength(2)
  expect(r.isAccepted()).toBe(false)
  const fresh = [
    r.inspect('drawing', true, true)?.inspectionId as string,
    r.inspect('tier', true, false, region)?.inspectionId as string
  ]
  expect(
    r.record(
      { phase: 'visual', inspectionIds: fresh, checks: passed.checks },
      passed
    )
  ).toMatchObject({ accepted: true, correction: { criteria: [] } })
})

it('preserves accepted review for identical facts bindings and reference selection', () => {
  const review = referenceReview()
  const factBindings = [
    { factId: sourceFact.id, criterionId: 'Viewpoint', elementIds: ['root'] }
  ]
  review.record({
    ...plan,
    facts: [sourceFact],
    factBindings,
    referenceImageIndexes: [0]
  })
  assessReferences(review, [0])
  review.mutate()
  const inspectionIds = inspect(review)
  review.record({
    phase: 'visual',
    inspectionIds,
    checks: [check('Viewpoint'), check('Finish')]
  })
  expect(review.isAccepted()).toBe(true)
  review.record({
    phase: 'facts',
    facts: [sourceFact],
    factBindings
  })
  expect(review.selectReferences([0])).toMatchObject({
    changed: false,
    review: { accepted: true, requiresFreshReview: false }
  })
  expect(review.isAccepted()).toBe(true)
  expect(review.overviewTargets(inspectionIds)).toEqual(['root'])
  expect(review.getIssue()).toBeUndefined()
  const factsBefore = review.record({ phase: 'facts' })
  expect(review.selectReferences([0])).toMatchObject({
    review: { requiredCriterionIds: [] }
  })
  expect(review.selectReferences([0])).not.toHaveProperty('review.next')
  const indexes = [2]
  const receipt = assessReferences(review, indexes)
  indexes.push(3)
  expect(receipt).toMatchObject({
    changed: true,
    referenceImageIndexes: [2],
    review: {
      accepted: false,
      requiresFreshReview: true,
      requiredCriterionIds: ['Viewpoint', 'Finish'],
      next: { tool: 'review_drawing' }
    }
  })
  expect(review.isAccepted()).toBe(false)
  expect(review.comparisonContext('visual').referenceImageIndexes).toEqual([2])
  expect(review.record({ phase: 'facts' })).toEqual(factsBefore)
  for (const invalid of [[-1], [0, 0], [0.5], [NaN], [Infinity], ['0'], null]) {
    expect(() => review.selectReferences(invalid)).toThrow()
    expect(review.comparisonContext('visual').referenceImageIndexes).toEqual([
      2
    ])
  }
  expect(() =>
    review.record({ phase: 'facts', referenceImageIndexes: [1] })
  ).toThrow('select_design_references')
  expect(review.selectReferences([])).toMatchObject({
    changed: true,
    referenceImageIndexes: []
  })
})

it('preserves reviewed work when adding an unrelated unbound fact', () => {
  const review = createLocalDesignReview()
  review.record(plan)
  review.mutate()
  review.record({
    phase: 'visual',
    inspectionIds: inspect(review),
    checks: [check('Viewpoint'), check('Finish')]
  })
  review.record({ phase: 'facts', facts: [sourceFact] })
  expect(review.isAccepted()).toBe(true)
  expect(review.getIssue()).toBeUndefined()
})

it('returns affected criteria and a fresh review handoff when a bound source changes', () => {
  const review = createLocalDesignReview()
  review.record({
    ...plan,
    facts: [sourceFact],
    factBindings: [
      { factId: sourceFact.id, criterionId: 'Viewpoint', elementIds: ['root'] }
    ]
  })
  review.mutate()
  review.record({
    phase: 'visual',
    inspectionIds: inspect(review),
    checks: [check('Viewpoint'), check('Finish')]
  })
  const receipt = review.record({
    phase: 'facts',
    dependencyChanges: [
      {
        key: 'reference:survey',
        version: '2',
        reason: 'source_changed',
        evidence: 'The source survey has changed.'
      }
    ]
  })
  expect(receipt).toMatchObject({
    review: {
      accepted: false,
      requiresFreshReview: true,
      affectedCriterionIds: ['Viewpoint'],
      next: {
        tool: 'record_design_facts',
        requiredInputs: ['facts'],
        invalidatedFactIds: [sourceFact.id]
      }
    }
  })
  const repaired = review.record({
    phase: 'facts',
    facts: [
      {
        ...sourceFact,
        dependencies: [{ key: 'reference:survey', version: '2' }]
      }
    ]
  })
  expect(repaired).toMatchObject({
    review: {
      requiredCriterionIds: ['Viewpoint'],
      next: {
        tool: 'review_drawing',
        requiredInputs: ['inspectionIds', 'checks']
      }
    }
  })
  expect(review.isAccepted()).toBe(false)
  expect(review.getIssue()).toMatch(/check the affected result/i)
})

it('invalidates unknown review impact when an existing unbound fact is replaced atomically', () => {
  const review = createLocalDesignReview()
  review.record({ ...plan, facts: [sourceFact] })
  review.mutate()
  review.record({
    phase: 'visual',
    inspectionIds: inspect(review),
    checks: [check('Viewpoint'), check('Finish')]
  })
  review.record({
    phase: 'facts',
    dependencyChanges: [
      {
        key: 'reference:survey',
        version: '2',
        reason: 'source_changed',
        evidence: 'New survey replaces the adopted source.'
      }
    ],
    facts: [
      {
        ...sourceFact,
        statement: 'The revised survey uses a different axis.',
        dependencies: [{ key: 'reference:survey', version: '2' }]
      }
    ]
  })
  expect(review.isAccepted()).toBe(false)
})

it('corrects derived calculation notes without changing source facts or approved geometry', () => {
  const review = createLocalDesignReview()
  review.record({ ...plan, facts: [sourceFact] })
  review.mutate()
  review.record({
    phase: 'visual',
    inspectionIds: inspect(review),
    checks: [check('Viewpoint'), check('Finish')]
  })
  const calculation = {
    id: 'projected-length',
    value: 46039.64,
    unit: 'px',
    sourceFactIds: [sourceFact.id],
    verification:
      'Calculated from retained source dimensions and the chosen projection.'
  }
  review.recordCalculations({ calculations: [calculation] })
  const result = review.recordCalculations({
    calculations: [
      {
        ...calculation,
        value: 46040.43558146182,
        verification:
          'Recomputed the derived number; document geometry is unchanged.'
      }
    ]
  })
  expect(result.calculations[0]).toMatchObject({
    value: 46040.43558146182,
    status: 'valid'
  })
  expect(review.isAccepted()).toBe(true)
  expect(review.record({ phase: 'facts' })).toMatchObject({
    facts: [{ ...sourceFact, status: 'valid' }]
  })
  review.record({
    phase: 'facts',
    dependencyChanges: [
      {
        key: 'reference:survey',
        version: '2',
        reason: 'source_changed',
        evidence: 'The source changed.'
      }
    ]
  })
  expect(review.recordCalculations({}).calculations[0].status).toBe(
    'invalidated'
  )
  expect(() =>
    review.recordCalculations({ calculations: [calculation] })
  ).toThrow(/valid source fact/)
})

it('rechecks only affected data criteria after a source correction while retaining unchanged visual evidence', () => {
  const review = createLocalDesignReview({ independentAssessment: true })
  const criteria = {
    appearance: {
      requirement: 'Recognizable view',
      description: 'Requested appearance',
      verification: 'visual'
    },
    scale: {
      requirement: 'Requested scale',
      description: 'Canonical scale',
      verification: 'data'
    }
  }
  review.record({
    ...plan,
    criteria,
    structureCriteria: [],
    detailRequired: false,
    facts: [sourceFact],
    factBindings: [
      { factId: sourceFact.id, criterionId: 'scale', elementIds: ['root'] }
    ]
  })
  review.mutate()
  const inspectionIds = [
    requireTestValue(review.inspect('root', true, true)).inspectionId
  ]
  review.record(
    {
      phase: 'visual',
      inspectionIds,
      checks: [check('appearance'), check('scale')]
    },
    {
      overall: {
        status: 'pass',
        evidence: 'The requested appearance matches.'
      },
      checks: [
        check('appearance') as {
          criterionId: string
          status: 'pass'
          evidence: string
        }
      ]
    }
  )
  expect(review.isAccepted()).toBe(true)
  review.record({
    phase: 'facts',
    dependencyChanges: [
      {
        key: 'reference:survey',
        version: '2',
        reason: 'source_changed',
        evidence: 'New source dimensions.'
      }
    ],
    facts: [
      {
        ...sourceFact,
        statement: 'The new source confirms the numeric scale.',
        dependencies: [{ key: 'reference:survey', version: '2' }]
      }
    ]
  })
  expect(review.isAccepted()).toBe(false)
  expect(review.comparisonContext('visual').criteria).toEqual({})
  expect(
    review.record({ phase: 'visual', inspectionIds, checks: [check('scale')] })
  ).toMatchObject({ accepted: true })
  review.mutate()
  expect(() =>
    review.record({
      phase: 'visual',
      inspectionIds: [
        requireTestValue(review.inspect('root', true, true)).inspectionId
      ],
      checks: [check('scale')]
    })
  ).toThrow(/every planned criterion/)
})

it('expands independent comparison when a scoped recheck introduces deferred work', () => {
  const review = createLocalDesignReview({ independentAssessment: true })
  review.record({
    ...plan,
    facts: [sourceFact],
    factBindings: [
      { factId: sourceFact.id, criterionId: 'Viewpoint', elementIds: ['root'] }
    ]
  })
  review.mutate()
  review.record(
    {
      phase: 'visual',
      inspectionIds: inspect(review),
      checks: [check('Viewpoint'), check('Finish')]
    },
    {
      overall: { status: 'pass', evidence: 'Verified' },
      checks: [check('Viewpoint'), check('Finish')].map((item) => ({
        ...item,
        status: 'pass' as const
      }))
    }
  )
  review.record({
    phase: 'facts',
    dependencyChanges: [
      {
        key: 'reference:survey',
        version: '2',
        reason: 'source_changed',
        evidence: 'Revised source'
      }
    ],
    facts: [
      {
        ...sourceFact,
        dependencies: [{ key: 'reference:survey', version: '2' }]
      }
    ]
  })
  expect(Object.keys(review.comparisonContext('visual').criteria)).toEqual([
    'Viewpoint'
  ])
  expect(
    Object.keys(review.comparisonContext('visual', true).criteria)
  ).toEqual(['Viewpoint', 'Finish'])
})

it('rejects a calculation batch atomically when any source is unavailable', () => {
  const review = createLocalDesignReview()
  review.record({ phase: 'facts', facts: [sourceFact] })
  const good = {
    id: 'length',
    value: 0.8,
    unit: 'px',
    sourceFactIds: [sourceFact.id],
    verification: 'Exact calculation.'
  }
  expect(() =>
    review.recordCalculations({
      calculations: [good, { ...good, id: 'other', sourceFactIds: ['missing'] }]
    })
  ).toThrow(/valid source fact/)
  expect(review.recordCalculations({}).calculations).toEqual([])
  review.recordCalculations({ calculations: [good] })
  review.record({ phase: 'facts', facts: [sourceFact] })
  expect(review.recordCalculations({}).calculations).toMatchObject([
    { value: 0.8, status: 'valid' }
  ])
})

const requireTestValue = <T>(value: T | undefined | null): T => {
  if (value == null) throw new Error('Required test fixture is unavailable')
  return value
}

describe('reference identity handoff', () => {
  const setup = () => {
    const images = createLocalImageTools({
      metadata: {
        imageAttachments: [
          {
            dataUrl: 'data:image/png;base64,YQ==',
            mediaType: 'image/png',
            size: 1
          },
          {
            dataUrl: 'data:image/png;base64,Yg==',
            mediaType: 'image/png',
            size: 1
          }
        ]
      }
    })
    const review = createLocalDesignReview({
      resolveSources: images.resolveSources,
      validateReferences: images.validateReferences
    })
    review.record(plan)
    return { images, review }
  }
  const fact = {
    id: 'facade',
    statement: 'The facade uses glass.',
    scope: 'Facade only',
    verification: 'Visible facade material',
    sources: ['attachment:0'],
    dependencies: [{ key: 'photo', version: '1' }]
  }
  it('rejects nonexistent selected or cited attachments before accepting evidence', () => {
    const { review } = setup()
    expect(() => review.selectReferences([2])).toThrow(/reference/i)
    expect(() =>
      review.record({
        phase: 'facts',
        facts: [{ ...fact, sources: ['attachment:2'] }]
      })
    ).toThrow(/reference/i)
    expect(review.record({ phase: 'facts' }).facts).toEqual([])
  })
  it('corrects provenance explicitly without changing fact value or inventing dependency versions', () => {
    const { review, images } = setup()
    review.record({ phase: 'facts', facts: [fact] })
    const fixed = review.record({
      phase: 'facts',
      sourceCorrections: [
        {
          factId: 'facade',
          sources: ['attachment:1'],
          verification: 'Correct photograph',
          reason: 'Wrong attachment index in the original citation'
        }
      ]
    })
    const retained = (
      fixed.facts as {
        sources: string[]
        statement: string
        dependencies: unknown
      }[]
    )[0]
    expect(retained.sources).toEqual(images.resolveSources(['attachment:1']))
    expect(retained.statement).toBe(fact.statement)
    expect(retained.dependencies).toEqual(fact.dependencies)
    expect(() =>
      review.record({
        phase: 'facts',
        facts: [
          { ...fact, statement: 'Changed material', sources: ['attachment:1'] }
        ]
      })
    ).toThrow(/overwrite/i)
  })
})

describe('reference applicability and fact evidence', () => {
  const setup = () => {
    const images = createLocalImageTools({ metadata: {} })
    for (const bytes of ['YQ==', 'Yg=='])
      images.addReference({
        dataUrl: `data:image/png;base64,${bytes}`,
        mediaType: 'image/png',
        size: 1,
        validation: {
          width: 100,
          height: 200,
          encoding: 'png',
          validity: 'decoded',
          suitability: 'requires-visual-assessment'
        }
      })
    const review = createLocalDesignReview({
      resolveSources: images.resolveSources,
      validateReferences: images.validateReferences
    })
    review.record(plan)
    const decision = (
      index: number,
      status = 'accepted',
      criterionIds = ['Viewpoint', 'Finish']
    ) => ({
      referenceId: images.validateReferences([index])[0].referenceId,
      status,
      criterionIds,
      reason: 'Observed applicability to this requirement',
      limitations:
        status === 'restricted'
          ? ['Construction-stage source; massing only']
          : []
    })
    return { review, images, decision }
  }
  it('cannot approve pending reference selection or bound facts with rejected image support', () => {
    const { review, decision } = setup()
    review.selectReferences([0])
    review.mutate()
    const args = {
      phase: 'visual',
      inspectionIds: inspect(review),
      checks: [check('Viewpoint'), check('Finish')]
    }
    expect(review.record(args)).toMatchObject({ accepted: false })
    review.selectReferences([0], {
      requirementRevision: 1,
      referenceDecisions: [decision(0, 'rejected', [])]
    })
    review.record({
      phase: 'facts',
      facts: [{ ...sourceFact, sources: ['attachment:0'] }],
      factBindings: [
        {
          factId: sourceFact.id,
          criterionId: 'Viewpoint',
          elementIds: ['root']
        }
      ]
    })
    expect(review.record(args)).toMatchObject({ accepted: false })
    expect(review.getIssue()).toMatch(/reference|source/i)
    const saved = review.record({ phase: 'facts' })
    review.selectReferences([0], {
      requirementRevision: 1,
      referenceDecisions: [decision(0)]
    })
    expect(review.record(args)).toMatchObject({ accepted: true })
    expect(review.record({ phase: 'facts' })).toMatchObject({
      facts: [
        {
          statement: sourceFact.statement,
          status: 'valid',
          evidence: { status: 'model-assessed' }
        }
      ]
    })
    expect(saved).toMatchObject({
      facts: [{ evidence: { status: 'unverified' } }]
    })
    expect(
      review.selectReferences([0], {
        requirementRevision: 1,
        referenceDecisions: [decision(0)]
      })
    ).toMatchObject({ changed: false, review: { accepted: true } })
  })
  it('does not invalidate accepted evidence for an unused reference decision change', () => {
    const { review, decision } = setup()
    review.selectReferences([0, 1], {
      requirementRevision: 1,
      referenceDecisions: [decision(0), decision(1)]
    })
    review.selectReferences([0])
    review.mutate()
    review.record({
      phase: 'visual',
      inspectionIds: inspect(review),
      checks: [check('Viewpoint'), check('Finish')]
    })
    const before = review.comparisonContext('visual')
    expect(
      review.selectReferences([0], {
        requirementRevision: 1,
        referenceDecisions: [decision(1, 'rejected', [])]
      })
    ).toMatchObject({
      changed: true,
      review: { accepted: true, affectedCriterionIds: [] }
    })
    expect(review.comparisonIsCurrent(before, 'visual')).toBe(true)
  })
  it('shares one applicability decision across duplicate attachment identities', () => {
    const { review, images, decision } = setup()
    const alias = images.addReference({
      dataUrl: 'data:image/png;base64,YQ==',
      mediaType: 'image/png',
      size: 1
    })
    review.selectReferences([0, alias], {
      requirementRevision: 1,
      referenceDecisions: [decision(0)]
    })
    review.mutate()
    expect(
      review.record({
        phase: 'visual',
        inspectionIds: inspect(review),
        checks: [check('Viewpoint'), check('Finish')]
      })
    ).toMatchObject({ accepted: true })
    expect(review.comparisonContext('visual').referenceImageIndexes).toEqual([
      0,
      alias
    ])
  })
  it('records rejection of an admitted but unselected image in the same selection batch', () => {
    const { review, decision } = setup()
    const adopted = decision(0, 'restricted', ['Viewpoint'])
    const rejected = {
      ...decision(1, 'rejected', []),
      reason: 'Logo is not a building reference'
    }
    expect(
      review.selectReferences([0], {
        requirementRevision: 1,
        referenceDecisions: [adopted, rejected]
      })
    ).toMatchObject({
      referenceDecisions: [
        expect.objectContaining(adopted),
        expect.objectContaining(rejected)
      ]
    })
    expect(review.comparisonContext('visual').referenceImageIndexes).toEqual([
      0
    ])
    expect(
      review.selectReferences([0], {
        requirementRevision: 1,
        referenceDecisions: [adopted, rejected]
      })
    ).toMatchObject({ changed: false })
  })
  it('retains pending and rejected images without supplying them as comparison evidence', () => {
    const { review, images, decision } = setup()
    review.selectReferences([0])
    expect(review.comparisonContext('visual').referenceImageIndexes).toEqual([])
    review.selectReferences([0], {
      requirementRevision: 1,
      referenceDecisions: [decision(0, 'rejected', [])]
    })
    expect(review.comparisonContext('visual').referenceImageIndexes).toEqual([])
    expect(images.referenceImages([0])).toHaveLength(1)
    expect(review.comparisonContext('visual').referenceDecisions).toMatchObject(
      [{ status: 'rejected', author: 'model' }]
    )
  })
  it('keeps restricted source limitations and original-pixel regions through correction and review', () => {
    const { review, decision } = setup()
    const value = {
      ...decision(0, 'restricted', ['Viewpoint']),
      sourceRegion: { x: 5, y: 10, width: 30, height: 40 }
    }
    review.selectReferences([0], {
      requirementRevision: 1,
      referenceDecisions: [value]
    })
    expect(
      review.comparisonContext('structure').referenceDecisions
    ).toMatchObject([value])
    expect(review.correctionContext().referenceDecisions).toMatchObject([value])
  })
  it('admits a source for a construction requirement only after an explicit current decision', () => {
    const { review, decision } = setup()
    review.selectReferences([0], {
      requirementRevision: 1,
      referenceDecisions: [decision(0, 'rejected', [])]
    })
    review.record({
      ...plan,
      criteria: reviewCriteria(['Construction']),
      structureCriteria: ['Construction']
    })
    expect(() =>
      review.selectReferences([0], {
        requirementRevision: 1,
        referenceDecisions: [decision(0, 'accepted', ['Construction'])]
      })
    ).toThrow(/revision/i)
    review.selectReferences([0], {
      requirementRevision: 2,
      referenceDecisions: [decision(0, 'accepted', ['Construction'])]
    })
    expect(review.comparisonContext('visual').referenceImageIndexes).toEqual([
      0
    ])
  })
  it('rejects an unknown identity or out-of-image region atomically', () => {
    const { review, decision } = setup()
    const before = review.comparisonContext('visual')
    for (const invalid of [
      { ...decision(0), referenceId: 'reference:unknown' },
      { ...decision(0), sourceRegion: { x: 99, y: 0, width: 2, height: 2 } }
    ]) {
      expect(() =>
        review.selectReferences([0], {
          requirementRevision: 1,
          referenceDecisions: [invalid]
        })
      ).toThrow()
      expect(review.comparisonContext('visual')).toEqual(before)
    }
  })
  it('does not let one applicable image bless other rejected citations or verify URL assertions', () => {
    const { review, decision } = setup()
    review.selectReferences([0, 1], {
      requirementRevision: 1,
      referenceDecisions: [decision(0), decision(1, 'rejected', [])]
    })
    const fact = {
      ...sourceFact,
      sources: ['attachment:0', 'attachment:1', 'https://example.com/height']
    }
    const result = review.record({
      phase: 'facts',
      facts: [fact],
      factBindings: [
        { factId: fact.id, criterionId: 'Viewpoint', elementIds: ['tower'] }
      ]
    })
    expect(result.facts).toMatchObject([
      {
        status: 'valid',
        freshness: 'current',
        evidence: {
          status: 'unverified',
          author: 'model',
          kind: 'source-assertion'
        }
      }
    ])
    expect(review.comparisonContext('visual').sourceFacts).toEqual([])
    expect(
      review.comparisonContext('visual').unverifiedSourceFacts
    ).toMatchObject([{ id: fact.id }])
  })
  it('expires applicability when requirements change without touching original source assertions', () => {
    const { review, decision } = setup()
    review.selectReferences([0], {
      requirementRevision: 1,
      referenceDecisions: [decision(0)]
    })
    review.record({
      ...plan,
      criteria: {
        ...plan.criteria,
        Finish: {
          requirement: 'Completed exterior',
          description: 'No construction machinery',
          verification: 'visual'
        }
      }
    })
    expect(review.comparisonContext('visual').referenceImageIndexes).toEqual([])
    expect(review.comparisonContext('visual').referenceDecisions).toMatchObject(
      [{ freshness: 'stale' }]
    )
  })
})
