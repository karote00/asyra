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
  designReviewDefinition,
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
  const schema = designReviewDefinition.inputSchema
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
  const planSchema = designReviewDefinition.inputSchema.oneOf.find(
    (schema) => schema.properties.phase.const === 'plan'
  )
  const inspectionSchema = designReviewDefinition.inputSchema.oneOf.find(
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
  sources: ['reference:survey-v1'],
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
      designReviewDefinition.inputSchema
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
  expect(
    operationInputIssue(input, designReviewDefinition.inputSchema)
  ).toBeUndefined()
  expect(review.record(input)).toMatchObject({
    facts: [{ id: sourceFact.id, status: 'valid' }]
  })
  const factBindings = [
    { factId: sourceFact.id, criterionId: 'Viewpoint', elementIds: ['crown'] }
  ]
  expect(
    operationInputIssue(
      { phase: 'facts', factBindings },
      designReviewDefinition.inputSchema
    )
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
  expect(
    operationInputIssue(stage, designReviewDefinition.inputSchema)
  ).toBeUndefined()
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
        operationInputIssue(
          { ...input, ...fields },
          designReviewDefinition.inputSchema
        )
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
      expect(
        operationInputIssue(input, designReviewDefinition.inputSchema)
      ).toBeUndefined()
      const branches = designReviewDefinition.inputSchema.oneOf.filter(
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
  expect(
    operationInputIssue(input, designReviewDefinition.inputSchema)
  ).toBeUndefined()
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
    ...designReviewDefinition.description.matchAll(/```json\n([\s\S]*?)\n```/g)
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
    expect(
      operationInputIssue(example, designReviewDefinition.inputSchema)
    ).toBeUndefined()
    expect(() => review.record(example)).not.toThrow()
  }
  expect(review.record({ phase: 'facts' })).toMatchObject({
    facts: [expect.objectContaining({ status: 'valid' })],
    factBindings: [expect.objectContaining({ criterionId: 'viewpoint' })]
  })
})

it('advertises an executable deferred-detail example including the required reason', () => {
  const description =
    designReviewDefinition.inputSchema.properties.deferredDetails.description
  const match = description.match(/Example: (\{.*\})/)
  expect(match).not.toBeNull()
  if (!match) throw new Error('Missing deferred-detail example')
  const item = JSON.parse(match[1])
  const input = { ...plan, deferredDetails: [item] }
  expect(
    operationInputIssue(input, designReviewDefinition.inputSchema)
  ).toBeUndefined()
  expect(createLocalDesignReview().record(input)).toMatchObject({
    deferredDetailIds: [item.id]
  })
  const { reason: _reason, ...missingReason } = item
  expect(
    operationInputIssue(
      { ...plan, deferredDetails: [missingReason] },
      designReviewDefinition.inputSchema
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
  const r = createLocalDesignReview({ independentAssessment: true })
  r.record({
    ...plan,
    method: 'Assume this geometry is correct',
    referenceImageIndexes: [1]
  })
  const comparison = r.comparisonContext('structure')
  expect(comparison).toEqual({
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
  const r = createLocalDesignReview({ independentAssessment: true })
  r.record({ ...plan, referenceImageIndexes: [0] })
  r.mutate()
  r.record({ phase: 'facts', referenceImageIndexes: [2] })
  expect(r.comparisonContext('structure')).toMatchObject({
    referenceImageIndexes: [2],
    criteria: { Viewpoint: { requirement: 'Viewpoint' } }
  })
  expect(() =>
    r.record({ phase: 'facts', referenceImageIndexes: [-1] })
  ).toThrow()
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
  const r = createLocalDesignReview()
  r.record({ ...plan, referenceImageIndexes: [1] })
  r.record(plan)
  expect(r.comparisonContext('structure').referenceImageIndexes).toEqual([1])
  r.record({ ...plan, referenceImageIndexes: [] })
  expect(r.comparisonContext('structure').referenceImageIndexes).toEqual([])
})

it.each(['plan', 'facts'])(
  'admits reference selection through the advertised %s tool schema',
  (phase) => {
    const input =
      phase === 'plan'
        ? { ...plan, referenceImageIndexes: [1] }
        : { phase, referenceImageIndexes: [1] }
    expect(
      operationInputIssue(input, designReviewDefinition.inputSchema)
    ).toBeUndefined()
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
  expect(designReviewDefinition.description).toContain(
    'optional whole-structure checkpoint'
  )
  expect(JSON.stringify(designReviewDefinition.inputSchema)).not.toContain(
    'before dense detail'
  )
  expect(designReviewDefinition.description).not.toContain(
    'Before dense detail'
  )
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
  const review = createLocalDesignReview()
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
  expect(review.comparisonContext('structure').sourceFacts).toEqual(expected)
  review.record({
    phase: 'facts',
    referenceImageIndexes: [2],
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
