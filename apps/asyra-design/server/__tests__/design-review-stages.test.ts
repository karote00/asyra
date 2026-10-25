import correctionFixture from './fixtures/recorded-101/correction-handoff-20261023.json'
import exactReviewBinding from './fixtures/recorded-101/exact-review-binding-20261017.json'
import recordedBindings from './fixtures/recorded-101/review-bindings-20261017.json'
import { wholeViewJudgments } from './fixtures/review-inputs'
import recordedScope from './fixtures/recorded-101/scope-handoff-20261017.json'
import recordedReview from './fixtures/recorded-101/review-handoff.json'
import { createLocalImageTools } from '../local-image-tools'
import { createDesignCheckResults } from '../design-check-results'
// Schema-only fixtures describe the binding shape; owner tests below issue real bindings.
const schemaReviewInput = (input: unknown): unknown => {
  if (
    !input ||
    typeof input !== 'object' ||
    !Array.isArray((input as { checks?: unknown }).checks)
  )
    return input
  const value = input as Record<string, unknown> & {
    checks: Record<string, unknown>[]
  }
  return {
    ...value,
    checks: value.checks.map((check) => ({
      ...check,
      binding: check.binding ?? {
        requestId: 'schema-fixture',
        requirementRevision: 1,
        checkRevision: 1,
        signature: 'schema-only',
        dependencies: [
          {
            inspectionId: 'current',
            elementId: 'root',
            scope: 'overview:whole'
          }
        ]
      }
    }))
  }
}
const reviewCriteria = (names: readonly string[]) =>
  Object.fromEntries(
    names.map((id) => [
      id,
      {
        requirement: id,
        description: id,
        verification: 'visual',
        requiredUnits: []
      }
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
import {
  operationInputIssue,
  nativeToolInputSchema
} from '../operation-input-schema'
const plan = {
  phase: 'plan',
  method: 'Construct a requested view',
  references: [],
  criteria: reviewCriteria(['Viewpoint', 'Finish']),
  structureCriteria: ['Viewpoint'],
  detailRequired: true
}
const testReferenceImages = createLocalImageTools({ metadata: {} })
for (const bytes of ['YQ==', 'Yg==', 'Yw=='])
  testReferenceImages.addReference({
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
const declaredUses = (criteria: string[], limitations: string[] = []) =>
  criteria.flatMap((criterionId) =>
    ['visual', 'fact', 'preparation'].map((purpose) => ({
      id: `${criterionId}-${purpose}`,
      criterionId,
      purpose,
      region: 'whole',
      limitations
    }))
  )
const useReceipts = (
  review: ReturnType<typeof createLocalDesignReview>,
  index: number,
  purpose: string,
  criterionId?: string
) =>
  review
    .correctionContext()
    .referenceDecisions.filter((item) => item.attachmentIndex === index)
    .flatMap((item) =>
      item.uses
        .filter(
          (use) =>
            use.purpose === purpose &&
            (!criterionId || use.criterionId === criterionId)
        )
        .map((use) => use.receipt)
    )
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
        uses: declaredUses(['Viewpoint', 'Finish'])
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
          verification: 'visual',
          requiredUnits: []
        },
        Finish: {
          requirement: 'Rough sketch',
          description: 'Keep rough lines',
          verification: 'visual',
          requiredUnits: []
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
        ...wholeViewJudgments(inspect(review), [check('Viewpoint')])
      })
    ).toMatchObject({ accepted: false })
    expect(() =>
      review.record({
        phase: 'visual',
        ...wholeViewJudgments(inspect(review), [check('Unknown')])
      })
    ).toThrow()
    expect(
      review.record({
        phase: 'visual',
        ...wholeViewJudgments(inspect(review), [
          check('Viewpoint'),
          check('Finish')
        ]),

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
        ...wholeViewJudgments(ids, [check('Viewpoint')])
      })
    ).toMatchObject({ structureAccepted: true, accepted: false })
    expect(r.getIssue()).toBeTruthy()
    r.mutate()
    expect(() =>
      r.record({
        phase: 'structure',
        ...wholeViewJudgments(ids, [check('Viewpoint')])
      })
    ).toThrow()
    expect(
      r.record({
        phase: 'visual',
        ...wholeViewJudgments(inspect(r), [check('Viewpoint'), check('Finish')])
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
      ...wholeViewJudgments(ids, [check('Viewpoint'), check('Finish', 'fail')])
    })
    r.mutate()
    expect(() =>
      r.record({
        phase: 'visual',
        ...wholeViewJudgments(ids, [check('Viewpoint'), check('Finish')])
      })
    ).toThrow()
    const result = r.record({
      phase: 'visual',
      ...wholeViewJudgments(inspect(r), [
        check('Viewpoint', 'fail'),
        check('Finish')
      ])
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
    ...wholeViewJudgments(
      [r.inspect('root', true, true)?.inspectionId],
      [check('Viewpoint', 'fail')]
    )
  })
  expect(r.getStructureIssue()).toBeTruthy()
  r.record({
    phase: 'structure',
    ...wholeViewJudgments(
      [r.inspect('root', true, true)?.inspectionId],
      [check('Viewpoint')]
    )
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
      ...wholeViewJudgments(
        [r.inspect('root', true, true)?.inspectionId],
        [check('Viewpoint')]
      ),

      deferredDetails
    })
  ).toMatchObject({ structureAccepted: true, deferredDetails })
  r.mutate()
  const visual = {
    phase: 'visual',
    ...wholeViewJudgments(inspect(r), [check('Viewpoint'), check('Finish')])
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
  expect(
    r.record({ ...visual, ...wholeViewJudgments(inspect(r), visual.checks) })
  ).toMatchObject({
    accepted: false,
    pendingDetails: ['rear']
  })
  expect(
    r.record({
      ...visual,
      ...wholeViewJudgments(inspect(r), visual.checks),
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
    ...wholeViewJudgments(inspect(r), [check('Viewpoint'), check('Finish')])
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
    other.record({
      ...visual,
      ...wholeViewJudgments(inspect(other), visual.checks)
    })
  ).toMatchObject({ accepted: true })
})

it('reopens final review when a later structure assessment declares deferred work', () => {
  const r = createLocalDesignReview()
  r.record(plan)
  r.mutate()
  r.record({
    phase: 'visual',
    ...wholeViewJudgments(inspect(r), [check('Viewpoint'), check('Finish')])
  })
  expect(r.getIssue()).toBeUndefined()
  r.record({
    phase: 'structure',
    ...wholeViewJudgments(
      [r.inspect('root', true, true)?.inspectionId],
      [check('Viewpoint')]
    ),

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
        ...wholeViewJudgments(inspect(r), [check('Viewpoint'), check('Finish')])
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
    expect(
      operationInputIssue(schemaReviewInput(input), schema),
      field
    ).toBeDefined()
  }
  expect(operationInputIssue(schemaReviewInput(plan), schema)).toBeUndefined()
  for (const phase of ['structure', 'visual']) {
    expect(
      operationInputIssue(schemaReviewInput({ phase }), schema)
    ).toBeDefined()
    expect(
      operationInputIssue(
        schemaReviewInput({
          phase,
          ...wholeViewJudgments(['current'], [check('Viewpoint')])
        }),
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
  expect(
    operationInputIssue(schemaReviewInput(plan), planSchema)
  ).toBeUndefined()
  for (const patch of [
    { method: 42 },
    { references: [42] },
    { criteria: [42] },
    { detailRequired: 'yes' }
  ]) {
    expect(
      operationInputIssue(schemaReviewInput({ ...plan, ...patch }), planSchema)
    ).toBeDefined()
  }
  const visual = {
    phase: 'visual',
    ...wholeViewJudgments(['current'], [check('Viewpoint')])
  }
  expect(
    operationInputIssue(schemaReviewInput(visual), inspectionSchema)
  ).toBeUndefined()
  expect(
    operationInputIssue(
      schemaReviewInput({
        ...visual,
        checks: [{ criterionId: 'Viewpoint', status: 'pass', evidence: 42 }]
      }),
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
      schemaReviewInput({ phase: 'facts', facts: [sourceFact] }),
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
    ...wholeViewJudgments(inspect(review), [
      check('Viewpoint'),
      check('Finish')
    ])
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
    operationInputIssue(schemaReviewInput(input), designEvidenceSchema)
  ).toBeUndefined()
  expect(review.record(input)).toMatchObject({
    facts: [{ id: sourceFact.id, status: 'valid' }]
  })
  const factBindings = [
    { factId: sourceFact.id, criterionId: 'Viewpoint', elementIds: ['crown'] }
  ]
  expect(
    operationInputIssue(
      schemaReviewInput({ phase: 'facts', factBindings }),
      designEvidenceSchema
    )
  ).toBeUndefined()
  review.record({ phase: 'facts', factBindings })
  expect(review.factTargets()).toEqual(['crown'])
  review.mutate()
  const visual = {
    phase: 'visual',
    ...wholeViewJudgments(inspect(review), [
      check('Viewpoint'),
      check('Finish')
    ])
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
    ...wholeViewJudgments(overview, [check('Viewpoint')])
  }
  expect(
    operationInputIssue(schemaReviewInput(stage), designEvidenceSchema)
  ).toBeUndefined()
  expect(review.record(stage)).toMatchObject({
    accepted: false,
    checks: [check('Viewpoint')]
  })
  expect(review.getIssue()).toBeTruthy()
  expect(review.record({ ...stage, final: true })).toMatchObject({
    accepted: false,
    coverage: {
      pending: expect.arrayContaining([
        expect.objectContaining({ criterionId: 'Finish' })
      ])
    }
  })
  expect(
    review.record({
      phase: 'visual',
      ...wholeViewJudgments(inspect(review), [
        check('Viewpoint'),
        check('Finish')
      ])
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
    ...wholeViewJudgments(['current'], [check('Viewpoint')])
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
          schemaReviewInput({ ...input, ...fields }),
          designEvidenceSchema
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
        operationInputIssue(schemaReviewInput(input), designEvidenceSchema)
      ).toBeUndefined()
      const branches = designEvidenceSchema.oneOf.filter(
        (schema) =>
          operationInputIssue(schemaReviewInput(input), schema) === undefined
      )
      expect(branches).toHaveLength(1)
      expect(
        operationInputIssue(
          schemaReviewInput({ ...input, unrelated: true }),
          branches[0]
        )
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
        verification: 'visual',
        requiredUnits: []
      },
      finish: {
        requirement: 'Draw a detailed tower',
        description:
          'Check surface contacts and stray lines against the reference',
        verification: 'visual',
        requiredUnits: []
      }
    },
    structureCriteria: ['silhouette'],
    detailRequired: true
  }
  expect(
    operationInputIssue(schemaReviewInput(input), designEvidenceSchema)
  ).toBeUndefined()
  expect(review.record(input)).toMatchObject({
    criterionIds: ['silhouette', 'finish']
  })
  expect(review.preparationContext().criteria).toMatchObject({
    silhouette: { requirement: input.criteria.silhouette.requirement }
  })
  const inspectionIds = inspect(review)
  expect(
    review.record({
      phase: 'structure',
      ...wholeViewJudgments(inspectionIds, [
        {
          criterionId: 'silhouette',
          status: 'pass',
          evidence: 'Flared outline and recessed corners observed'
        }
      ])
    })
  ).toMatchObject({ structureAccepted: true, accepted: false })
  expect(
    review.record({
      phase: 'visual',
      ...wholeViewJudgments(inspectionIds, [
        {
          criterionId: 'silhouette',
          status: 'pass',
          evidence: 'Structure remains correct'
        }
      ])
    })
  ).toMatchObject({
    accepted: false,
    coverage: {
      pending: expect.arrayContaining([
        expect.objectContaining({ criterionId: 'finish' })
      ])
    }
  })
  expect(
    review.record({
      phase: 'visual',
      ...wholeViewJudgments(inspectionIds, [
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
      ])
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
        verification: 'visual',
        requiredUnits: []
      }
    },
    structureCriteria: []
  })
  for (const example of examples) {
    expect(
      operationInputIssue(schemaReviewInput(example), designEvidenceSchema)
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
    designEvidenceSchema.properties.deferredDetails.description
  const match = description.match(/Example: (\{.*\})/)
  expect(match).not.toBeNull()
  if (!match) throw new Error('Missing deferred-detail example')
  const item = JSON.parse(match[1])
  const input = { ...plan, deferredDetails: [item] }
  expect(
    operationInputIssue(schemaReviewInput(input), designEvidenceSchema)
  ).toBeUndefined()
  expect(createLocalDesignReview().record(input)).toMatchObject({
    deferredDetailIds: [item.id]
  })
  const { reason: _reason, ...missingReason } = item
  expect(
    operationInputIssue(
      schemaReviewInput({ ...plan, deferredDetails: [missingReason] }),
      designEvidenceSchema
    )
  ).toContain('reason')
})

it('validates a candidate without overwriting the previous completed review', () => {
  const r = createLocalDesignReview()
  r.record({ ...plan, detailRequired: false })
  r.mutate()
  const args = {
    phase: 'visual',
    ...wholeViewJudgments(
      [r.inspect('root', true, true)?.inspectionId],
      [check('Viewpoint'), check('Finish')]
    )
  }
  r.record(args)
  const changed = {
    ...args,
    ...wholeViewJudgments(args.inspectionIds, [
      check('Viewpoint', 'fail'),
      check('Finish')
    ])
  }
  r.validateReview(changed)
  expect(r.isAccepted()).toBe(true)
  expect(r.record(changed)).toMatchObject({
    regressions: [{ criterionId: 'Viewpoint' }]
  })
})

it('can select a replacement reference after drawing without rewriting requirements', () => {
  const r = referenceReview({})
  r.record({ ...plan, referenceImageIndexes: [0] })
  r.mutate()
  assessReferences(r, [2])
  expect(r.preparationContext(useReceipts(r, 2, 'preparation'))).toMatchObject({
    referenceUses: expect.any(Array),
    criteria: { Viewpoint: { requirement: 'Viewpoint' } }
  })
  expect(() => r.selectReferences([-1])).toThrow()
})

it('routes visual and data evidence separately without dropping the data requirement', () => {
  const r = createLocalDesignReview({})
  r.record({
    ...plan,
    detailRequired: false,
    criteria: {
      view: {
        requirement: 'solid tower',
        description: 'joined faces',
        verification: 'visual',
        requiredUnits: []
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
  expect(r.preparationContext().criteria).toEqual({
    view: { requirement: 'solid tower' },
    scale: { requirement: '1cm=1px' }
  })
  const args = {
    phase: 'structure',
    ...wholeViewJudgments(
      [r.inspect('root', true, true)?.inspectionId],
      [check('view'), check('scale')]
    )
  }
  expect(r.record(args)).toMatchObject({
    structureAccepted: true
  })
  expect(
    r.record({
      ...args,
      ...wholeViewJudgments(args.inspectionIds, [
        check('view'),
        check('scale', 'unverified')
      ])
    })
  ).toMatchObject({ structureAccepted: false })
})

it('preserves an explicit reference when resubmitting a plan without reference changes', () => {
  const r = referenceReview()
  r.record({ ...plan, referenceImageIndexes: [1] })
  assessReferences(r, [1])
  r.record(plan)
  expect(
    r.preparationContext(useReceipts(r, 1, 'preparation')).referenceUses
  ).toHaveLength(2)
  r.record({ ...plan, referenceImageIndexes: [] })
  expect(r.preparationContext().referenceUses).toEqual([])
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
    expect(
      operationInputIssue(schemaReviewInput(input), schema)
    ).toBeUndefined()
  }
)

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
    operationInputIssue(schemaReviewInput(reviewPlanExample), reviewPlanSchema)
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
    expect(
      operationInputIssue(schemaReviewInput(invalid), reviewPlanSchema)
    ).toContain(field)
    expect(() => createLocalDesignReview().record(invalid)).toThrow()
  }
})

it('records initial criteria after first pixels without accepting or rewriting the result', () => {
  const review = createLocalDesignReview({})
  review.mutate()
  expect(review.getIssue()).toBeDefined()
  expect(review.record(plan)).toMatchObject({ recorded: true })
  expect(review.getIssue()).toBeDefined()
  expect(() => review.record({ ...plan, detailRequired: false })).toThrow()
  expect(review.preparationContext().criteria).toEqual({
    Viewpoint: { requirement: 'Viewpoint' },
    Finish: { requirement: 'Finish' }
  })
  expect(
    review.record({
      phase: 'visual',
      ...wholeViewJudgments(inspect(review), [
        check('Viewpoint'),
        check('Finish')
      ])
    })
  ).toMatchObject({ accepted: true })
})

it('retains source assertions separately while preparation consumes only declared uses', () => {
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
      statement: fact.statement,
      scope: fact.scope,
      sources: fact.sources,
      verification: fact.verification
    }
  ]
  expect(review.record({ phase: 'facts' })).toMatchObject({
    facts: expect.arrayContaining(
      expected.map((item) => expect.objectContaining(item))
    )
  })
  const detached = review.record({ phase: 'facts' })
  const retainedFact = detached.facts?.[0]
  if (!retainedFact) throw new Error('Missing bound source fact')
  retainedFact.sources[0] = 'mutated'
  expect(review.record({ phase: 'facts' }).facts).toEqual(
    expect.arrayContaining(
      expected.map((item) => expect.objectContaining(item))
    )
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
  expect(review.record({ phase: 'facts' })).toMatchObject({
    facts: expect.arrayContaining([
      expect.objectContaining({ id: fact.id, status: 'invalidated' })
    ])
  })
  expect(review.isAccepted()).toBe(false)
})

it('hands all unresolved criteria and inspected scope to correction without accepting stale evidence', () => {
  const r = createLocalDesignReview({})
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
  const result = r.record({
    phase: 'visual',
    ...wholeViewJudgments(inspectionIds, failed.checks)
  })
  expect(result.correction).toMatchObject({
    diagnosticOnly: true,
    requiresFreshReview: true,
    checks: [
      { criterionId: 'Viewpoint', factElementIds: [] },
      { criterionId: 'Finish', factElementIds: [] }
    ],
    inspections: [
      { elementId: 'drawing' },
      { elementId: 'tier', region, coordinateSpace: 'element-local' }
    ]
  })
  r.mutate()
  expect(r.correctionContext()).toMatchObject({
    checks: [{ criterionId: 'Viewpoint' }, { criterionId: 'Finish' }],
    inspections: []
  })
  const passed = {
    overall: { status: 'pass' as const, evidence: 'Corrected' },
    checks: [check('Viewpoint'), check('Finish')]
  }
  expect(() =>
    r.record({
      phase: 'visual',
      ...wholeViewJudgments(inspectionIds, passed.checks)
    })
  ).toThrow()
  expect(r.correctionContext().checks).toHaveLength(2)
  expect(r.isAccepted()).toBe(false)
  const fresh = [
    r.inspect('drawing', true, true)?.inspectionId as string,
    r.inspect('tier', true, false, region)?.inspectionId as string
  ]
  expect(
    r.record({ phase: 'visual', ...wholeViewJudgments(fresh, passed.checks) })
  ).toMatchObject({ accepted: true, correction: { checks: [] } })
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
    ...wholeViewJudgments(inspectionIds, [check('Viewpoint'), check('Finish')])
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
      accepted: true,
      requiresFreshReview: false,
      requiredCriterionIds: []
    }
  })
  expect(review.isAccepted()).toBe(true)
  expect(review.preparationContext().referenceUses).toEqual([])
  expect(review.record({ phase: 'facts' })).toEqual(factsBefore)
  for (const invalid of [[-1], [0, 0], [0.5], [NaN], [Infinity], ['0'], null]) {
    expect(() => review.selectReferences(invalid)).toThrow()
    expect(review.preparationContext().referenceUses).toEqual([])
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
    ...wholeViewJudgments(inspect(review), [
      check('Viewpoint'),
      check('Finish')
    ])
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
    ...wholeViewJudgments(inspect(review), [
      check('Viewpoint'),
      check('Finish')
    ])
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
    ...wholeViewJudgments(inspect(review), [
      check('Viewpoint'),
      check('Finish')
    ])
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
  expect(review.readChecks().items).toHaveLength(2)
  expect(
    review.readChecks().items.every((item) => item.status === 'stale')
  ).toBe(true)
  const inspectionIds = inspect(review)
  review.record({
    phase: 'visual',
    final: false,
    ...wholeViewJudgments(inspectionIds, [check('Finish')])
  })
  expect(
    review.record({
      phase: 'visual',
      ...wholeViewJudgments(inspectionIds, [check('Finish')])
    })
  ).toMatchObject({
    accepted: false,
    coverage: {
      pending: expect.arrayContaining([
        expect.objectContaining({ criterionId: 'Viewpoint' })
      ])
    }
  })
})

it('corrects derived calculation notes without changing source facts or approved geometry', () => {
  const review = createLocalDesignReview()
  review.record({ ...plan, facts: [sourceFact] })
  review.mutate()
  review.record({
    phase: 'visual',
    ...wholeViewJudgments(inspect(review), [
      check('Viewpoint'),
      check('Finish')
    ])
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
  const review = createLocalDesignReview({})
  const criteria = {
    appearance: {
      requirement: 'Recognizable view',
      description: 'Requested appearance',
      verification: 'visual',
      requiredUnits: []
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
  review.record({
    phase: 'visual',
    ...wholeViewJudgments(inspectionIds, [check('appearance'), check('scale')])
  })
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
  expect(review.coverage().pending.map((item) => item.criterionId)).toEqual([
    'scale'
  ])
  expect(
    review.record({
      phase: 'visual',
      ...wholeViewJudgments(inspectionIds, [check('scale')])
    })
  ).toMatchObject({ accepted: true })
  review.mutate()
  expect(
    review.record({
      phase: 'visual',
      ...wholeViewJudgments(
        [requireTestValue(review.inspect('root', true, true)).inspectionId],
        [check('scale')]
      )
    })
  ).toMatchObject({
    accepted: false,
    coverage: {
      pending: expect.arrayContaining([
        expect.objectContaining({ criterionId: 'appearance' })
      ])
    }
  })
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
      uses: declaredUses(
        criterionIds,
        status === 'restricted'
          ? ['Construction-stage source; massing only']
          : []
      ),
      reason: 'Observed applicability to this requirement'
    })
    return { review, images, decision }
  }
  it('cannot approve pending reference selection or bound facts with rejected image support', () => {
    const { review, decision } = setup()
    review.selectReferences([0])
    review.mutate()
    const args = {
      phase: 'visual',
      ...wholeViewJudgments(inspect(review), [
        check('Viewpoint'),
        check('Finish')
      ])
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
    expect(() => review.record(args)).toThrow(/fact-purpose/)
    const saved = review.record({ phase: 'facts' })
    review.selectReferences([0], {
      requirementRevision: 1,
      referenceDecisions: [decision(0)]
    })
    review.record({
      phase: 'facts',
      factBindings: [
        {
          factId: sourceFact.id,
          criterionId: 'Viewpoint',
          elementIds: ['root'],
          referenceUses: useReceipts(review, 0, 'fact', 'Viewpoint')
        }
      ]
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
      ...wholeViewJudgments(inspect(review), [
        check('Viewpoint'),
        check('Finish')
      ])
    })
    const before = review.readChecks({ includePassed: true })
    expect(
      review.selectReferences([0], {
        requirementRevision: 1,
        referenceDecisions: [decision(1, 'rejected', [])]
      })
    ).toMatchObject({
      changed: true,
      review: { accepted: true, affectedCriterionIds: [] }
    })
    expect(review.readChecks({ includePassed: true })).toEqual(before)
    expect(review.isAccepted()).toBe(true)
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
        ...wholeViewJudgments(inspect(review), [
          check('Viewpoint'),
          check('Finish')
        ])
      })
    ).toMatchObject({ accepted: true })
    expect(review.preparationContext().referenceUses).toEqual([])
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
      referenceDecisions: [adopted, rejected]
    })
    expect(
      review.preparationContext(useReceipts(review, 0, 'preparation'))
        .referenceUses.length
    ).toBeGreaterThan(0)
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
    expect(review.preparationContext().referenceUses).toEqual([])
    review.selectReferences([0], {
      requirementRevision: 1,
      referenceDecisions: [decision(0, 'rejected', [])]
    })
    expect(review.preparationContext().referenceUses).toEqual([])
    expect(images.referenceImages([0])).toHaveLength(1)
    expect(review.correctionContext().referenceDecisions).toMatchObject([
      { status: 'rejected', author: 'model' }
    ])
  })
  it('replaces a scoped reference without reopening unrelated accepted criteria', () => {
    const { review, decision } = setup()
    review.selectReferences([0], {
      requirementRevision: 1,
      referenceDecisions: [
        decision(0, 'restricted', ['Viewpoint']),
        decision(1, 'restricted', ['Viewpoint'])
      ]
    })
    const ids = inspect(review)
    expect(
      review.record({
        phase: 'visual',
        ...wholeViewJudgments(ids, [
          {
            ...check('Viewpoint'),
            referenceUses: useReceipts(review, 0, 'visual', 'Viewpoint')
          },
          check('Finish')
        ])
      })
    ).toMatchObject({ accepted: true })
    const finish = review
      .readChecks({ includePassed: true })
      .items.find((item) => item.criterionId === 'Finish')
    expect(review.selectReferences([1])).toMatchObject({
      review: {
        accepted: false,
        affectedCriterionIds: ['Viewpoint']
      }
    })
    expect(
      review
        .readChecks({ includePassed: true })
        .items.find((item) => item.criterionId === 'Finish')
    ).toEqual(finish)
    expect(
      review.record({
        phase: 'visual',
        ...wholeViewJudgments(ids, [
          {
            ...check('Viewpoint'),
            referenceUses: useReceipts(review, 1, 'visual', 'Viewpoint')
          }
        ])
      })
    ).toMatchObject({ accepted: true })
    const accepted = review.readChecks({ includePassed: true })
    expect(() =>
      review.selectReferences([1], {
        requirementRevision: 1,
        referenceDecisions: [{ ...decision(1), criterionIds: ['unknown'] }]
      })
    ).toThrow()
    expect(review.readChecks({ includePassed: true })).toEqual(accepted)
    expect(review.isAccepted()).toBe(true)
  })

  it('recovers pending and rejected reference replacement without discarding unrelated passes', () => {
    const { review, decision } = setup()
    review.selectReferences([0], {
      requirementRevision: 1,
      referenceDecisions: [decision(0, 'restricted', ['Viewpoint'])]
    })
    const ids = inspect(review)
    review.record({
      phase: 'visual',
      ...wholeViewJudgments(ids, [
        {
          ...check('Viewpoint'),
          referenceUses: useReceipts(review, 0, 'visual', 'Viewpoint')
        },
        check('Finish')
      ])
    })
    const finish = review
      .readChecks({ includePassed: true })
      .items.find((item) => item.criterionId === 'Finish')
    const assertFinish = () =>
      expect(
        review
          .readChecks({ includePassed: true })
          .items.find((item) => item.criterionId === 'Finish')
      ).toEqual(finish)
    review.selectReferences([1])
    expect(review.isAccepted()).toBe(false)
    assertFinish()
    review.selectReferences([1], {
      requirementRevision: 1,
      referenceDecisions: [decision(1, 'rejected', [])]
    })
    expect(review.isAccepted()).toBe(false)
    assertFinish()
    const before = review.preparationContext()
    expect(() =>
      review.selectReferences([1], {
        requirementRevision: 1,
        referenceDecisions: [decision(1, 'restricted', ['unknown'])]
      })
    ).toThrow()
    expect(review.preparationContext()).toEqual(before)
    const corrected = review.selectReferences([1], {
      requirementRevision: 1,
      referenceDecisions: [decision(1, 'restricted', ['Viewpoint'])]
    })
    expect(corrected).toMatchObject({
      review: { accepted: false, affectedCriterionIds: [] }
    })
    assertFinish()
    expect(
      review.record({
        phase: 'visual',
        ...wholeViewJudgments(ids, [
          {
            ...check('Viewpoint'),
            referenceUses: useReceipts(review, 1, 'visual', 'Viewpoint')
          }
        ])
      })
    ).toMatchObject({ accepted: true })
    assertFinish()
  })

  it('preserves accepted criteria when selection changes only an attachment alias', () => {
    const { review, images, decision } = setup()
    const alias = images.addReference({
      dataUrl: 'data:image/png;base64,YQ==',
      mediaType: 'image/png',
      size: 1
    })
    review.selectReferences([0], {
      requirementRevision: 1,
      referenceDecisions: [decision(0)]
    })
    review.record({
      phase: 'visual',
      ...wholeViewJudgments(inspect(review), [
        check('Viewpoint'),
        check('Finish')
      ])
    })
    const use = useReceipts(review, 0, 'visual', 'Viewpoint')[0]
    const before = review.readChecks({ includePassed: true })
    expect(
      review.selectReferences([alias], {
        requirementRevision: 1,
        referenceDecisions: [decision(0)]
      })
    ).toMatchObject({ review: { accepted: true, affectedCriterionIds: [] } })
    expect(
      review.resolveReferenceUse(use, 'visual', { criterionId: 'Viewpoint' })
        .receipt
    ).toEqual(use)
    expect(review.readChecks({ includePassed: true })).toEqual(before)
  })

  it('keeps restricted source limitations and original-pixel regions through correction and review', () => {
    const { review, decision } = setup()
    const value = {
      ...decision(0, 'restricted', ['Viewpoint']),
      uses: declaredUses(
        ['Viewpoint'],
        ['Construction-stage source; massing only']
      ).map((use) => ({
        ...use,
        region: { x: 5, y: 10, width: 30, height: 40 }
      }))
    }
    review.selectReferences([0], {
      requirementRevision: 1,
      referenceDecisions: [value]
    })
    expect(review.correctionContext().referenceDecisions).toMatchObject([value])
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
    expect(
      review.preparationContext(useReceipts(review, 0, 'preparation'))
        .referenceUses.length
    ).toBeGreaterThan(0)
  })
  it('rejects an unknown identity or out-of-image region atomically', () => {
    const { review, decision } = setup()
    const before = review.preparationContext()
    for (const invalid of [
      { ...decision(0), referenceId: 'reference:unknown' },
      {
        ...decision(0),
        uses: [
          {
            ...declaredUses(['Viewpoint'])[0],
            region: { x: 99, y: 0, width: 2, height: 2 }
          }
        ]
      }
    ]) {
      expect(() =>
        review.selectReferences([0], {
          requirementRevision: 1,
          referenceDecisions: [invalid]
        })
      ).toThrow()
      expect(review.preparationContext()).toEqual(before)
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
    expect(review.preparationContext().sourceAssertions).toEqual([])
    expect(review.record({ phase: 'facts' }).facts).toMatchObject([
      { id: fact.id, status: 'valid' }
    ])
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
          verification: 'visual',
          requiredUnits: []
        }
      }
    })
    expect(review.preparationContext().referenceUses).toEqual([])
    expect(review.correctionContext().referenceDecisions).toMatchObject([
      { freshness: 'stale' }
    ])
  })
})

it('retains primary-agent passes, pending work and scene invalidation without erasing evidence', () => {
  const review = createLocalDesignReview()
  review.record(plan)
  review.mutate()
  review.record({
    phase: 'visual',
    ...wholeViewJudgments(inspect(review), [
      check('Viewpoint'),
      check('Finish', 'fail')
    ])
  })
  expect(review.readChecks().counts).toEqual({
    pass: 1,
    fail: 1,
    unverified: 0,
    stale: 0
  })
  expect(review.readChecks().items.map((item) => item.id)).toEqual([
    'visual:Finish'
  ])
  expect(() =>
    review.record({
      phase: 'visual',
      ...wholeViewJudgments(inspect(review), [check('Unknown')])
    })
  ).toThrow()
  expect(review.readChecks().counts.fail).toBe(1)
  review.mutate()
  expect(review.readChecks().counts.stale).toBe(2)
  expect(
    review.readChecks().items.find((item) => item.id === 'visual:Viewpoint')
      ?.evidence
  ).toBe('Observed Viewpoint pass')
  review.record({
    phase: 'visual',
    ...wholeViewJudgments(inspect(review), [
      check('Viewpoint'),
      check('Finish')
    ])
  })
  expect(review.readChecks().items).toEqual([])
  expect(review.readChecks({ includePassed: true }).items).toHaveLength(2)
})

it('rechecks only unresolved criteria when the scene and passed dependencies are unchanged', () => {
  const review = createLocalDesignReview()
  review.record(plan)
  review.mutate()
  const inspectionIds = inspect(review)
  review.record({
    phase: 'visual',
    ...wholeViewJudgments(inspectionIds, [
      check('Viewpoint'),
      check('Finish', 'fail')
    ])
  })
  const before = review
    .readChecks({ includePassed: true })
    .items.find((item) => item.id === 'visual:Viewpoint')
  expect(
    review.record({
      phase: 'visual',
      ...wholeViewJudgments(inspectionIds, [check('Finish')])
    })
  ).toMatchObject({ accepted: true })
  const after = review
    .readChecks({ includePassed: true })
    .items.find((item) => item.id === 'visual:Viewpoint')
  expect(after).toEqual(before)
})

it('does not revive stale passes when only another criterion is reviewed after a scene edit', () => {
  const review = createLocalDesignReview()
  review.record(plan)
  review.mutate()
  review.record({
    phase: 'visual',
    ...wholeViewJudgments(inspect(review), [
      check('Viewpoint'),
      check('Finish')
    ])
  })
  review.mutate()
  const inspectionIds = inspect(review)
  review.record({
    phase: 'visual',
    final: false,
    ...wholeViewJudgments(inspectionIds, [check('Finish')])
  })
  expect(
    review.record({
      phase: 'visual',
      ...wholeViewJudgments(inspectionIds, [check('Finish')])
    })
  ).toMatchObject({
    accepted: false,
    coverage: {
      pending: expect.arrayContaining([
        expect.objectContaining({ criterionId: 'Viewpoint' })
      ])
    }
  })
  expect(review.readChecks().items).toContainEqual(
    expect.objectContaining({ id: 'visual:Viewpoint', status: 'stale' })
  )
})

describe('criterion inspection dependencies', () => {
  const scoped = () => {
    const review = createLocalDesignReview()
    const names = Array.from({ length: 8 }, (_, i) => `tier-${i + 1}`)
    review.record({
      ...plan,
      criteria: reviewCriteria(names),
      structureCriteria: [],
      detailRequired: false
    })
    const ids = names.map(
      (name, i) =>
        review.inspect(name, true, true, undefined, false, {
          sessionId: 'browser',
          revision: i,
          receiptId: name
        })?.inspectionId
    )
    review.record({
      phase: 'visual',
      inspectionIds: ids,
      checks: names.map((name, i) => ({
        ...check(name),
        inspectionIds: [ids[i]]
      }))
    })
    return { review, names, ids }
  }
  it('reopens only the changed tier while preserving other passed evidence and mixed current capture ages', () => {
    const { review, names, ids } = scoped()
    const prior = review.readChecks({ includePassed: true }).items
    review.mutate()
    expect(review.isAccepted()).toBe(false)
    expect(review.readChecks().counts.pass).toBe(8)
    review.invalidateInspections([String(ids[2])], 'Third-tier windows changed')
    expect(review.readChecks().items.map((item) => item.id)).toEqual([
      'visual:tier-3'
    ])
    expect(
      review.readChecks({ ids: ['visual:tier-1'], includePassed: true })
        .items[0]
    ).toEqual(prior.find((item) => item.id === 'visual:tier-1'))
    const fresh = review.inspect('tier-3', true, true, undefined, false, {
      sessionId: 'browser',
      revision: 9,
      receiptId: 'tier-3-new'
    })?.inspectionId
    const current = ids.map((id, i) => (i === 2 ? fresh : id))
    expect(review.evidenceFor(current)).toBeDefined()
    expect(
      review.record({
        phase: 'visual',
        inspectionIds: current,
        checks: [{ ...check(names[2]), inspectionIds: [fresh] }]
      }).accepted
    ).toBe(true)
    expect(review.readChecks().counts.pass).toBe(8)
  })
  it('rejects criterion dependencies not delivered in this review and retains explicitly shared image dependencies', () => {
    const { review, ids } = scoped()
    expect(() =>
      review.record({
        phase: 'visual',
        final: false,
        inspectionIds: [ids[0]],
        checks: [{ ...check('tier-1'), inspectionIds: [ids[1]] }]
      })
    ).toThrow(/inspection/i)
    review.record({
      phase: 'visual',
      final: false,
      ...wholeViewJudgments([ids[0], ids[1]], [check('tier-1')])
    })
    review.invalidateInspections([String(ids[1])], 'Shared comparison changed')
    expect(
      review
        .readChecks()
        .items.map((item) => item.id)
        .sort()
    ).toEqual(['visual:tier-1', 'visual:tier-2'])
  })
})

it('retains eight regional units under one criterion and repairs only the invalid unit', () => {
  const review = createLocalDesignReview()
  review.record({
    ...plan,
    criteria: {
      ...reviewCriteria(['Overview']),
      Finish: {
        ...reviewCriteria(['Finish']).Finish,
        requiredUnits: Array.from({ length: 8 }, (_, i) => `tier-${i}`)
      }
    },
    structureCriteria: [],
    detailRequired: false
  })
  review.mutate()
  const crop = { x: 0, y: 0, width: 20, height: 20 }
  const images = Array.from(
    { length: 8 },
    (_, index) =>
      review.inspect(`tier-${index}`, true, false, crop, true, {
        sessionId: 'app',
        revision: index,
        receiptId: `tier-${index}`
      })?.inspectionId as string
  )
  const unit = (index: number, image = images[index]) => ({
    ...check('Finish'),
    unitId: `tier-${index}`,
    inspectionIds: [image]
  })
  const stage = {
    phase: 'visual',
    final: false,
    inspectionIds: images,
    checks: images.map((_, index) => unit(index))
  }
  expect(
    operationInputIssue(schemaReviewInput(stage), designEvidenceSchema)
  ).toBeUndefined()
  expect(review.record(stage)).toMatchObject({ accepted: false })
  const before = review.readChecks({ includePassed: true })
  expect(before.counts).toEqual({ pass: 8, fail: 0, stale: 1, unverified: 0 })
  review.invalidateInspections([images[2]], 'Third tier changed')
  expect(review.readChecks().counts).toEqual({
    pass: 7,
    fail: 0,
    stale: 2,
    unverified: 0
  })
  const overview = review.inspect('root', true, true, undefined, false, {
    sessionId: 'app',
    revision: 9,
    receiptId: 'overview'
  })?.inspectionId as string
  expect(
    review.record({
      phase: 'visual',
      ...wholeViewJudgments([overview], [check('Overview')])
    })
  ).toMatchObject({ accepted: false })
  const repaired = review.inspect('tier-2', true, false, crop, true, {
    sessionId: 'app',
    revision: 10,
    receiptId: 'repaired'
  })?.inspectionId as string
  const repair = {
    phase: 'visual',
    final: false,
    inspectionIds: [repaired],
    checks: [unit(2, repaired)]
  }
  review.record(repair)
  const after = review.readChecks({ includePassed: true })
  for (const index of [0, 1, 3, 4, 5, 6, 7]) {
    expect(after.items.find((item) => item.unitId === `tier-${index}`)).toEqual(
      before.items.find((item) => item.unitId === `tier-${index}`)
    )
  }
  review.record(repair)
  expect(review.readChecks({ includePassed: true })).toEqual(after)
  expect(
    review.record({
      phase: 'visual',
      ...wholeViewJudgments([overview], [check('Overview')])
    })
  ).toMatchObject({ accepted: true })
  const beforeCoverageFailure = review.readChecks({ includePassed: true })
  review.invalidateWholeView('A new drawing root is outside the overview')
  const afterCoverageFailure = review.readChecks({ includePassed: true })
  expect(afterCoverageFailure.counts).toEqual({
    pass: 8,
    stale: 1,
    fail: 0,
    unverified: 0
  })
  expect(afterCoverageFailure.items.filter((item) => item.unitId)).toEqual(
    beforeCoverageFailure.items.filter((item) => item.unitId)
  )
  expect(review.isAccepted()).toBe(false)
  expect(
    review.record({
      phase: 'visual',
      ...wholeViewJudgments([overview], [check('Overview')])
    })
  ).toMatchObject({ accepted: true })
  const repeatedView = review.inspect('tier-2', true, false, crop, true, {
    sessionId: 'app',
    revision: 10,
    receiptId: 'same-scope-again'
  })?.inspectionId as string
  expect(() =>
    review.record({
      ...repair,
      inspectionIds: [repaired, repeatedView],
      checks: [
        { ...unit(2, repaired), inspectionIds: [repaired, repeatedView] }
      ]
    })
  ).not.toThrow()
  // Additional distinct scope cannot silently enlarge this unit dependency.
  expect(() =>
    review.record({
      ...repair,
      inspectionIds: [overview, repaired],
      checks: [{ ...unit(2, repaired), inspectionIds: [overview, repaired] }]
    })
  ).toThrow(/scope/)
  // Later evidence can omit corroboration while retaining the original scope.
  expect(() => review.record(repair)).not.toThrow()
  const foreign = review.inspect('other-tier', true, false, crop)
    ?.inspectionId as string
  expect(() =>
    review.record({
      ...repair,
      inspectionIds: [foreign],
      checks: [unit(2, foreign)]
    })
  ).toThrow(/scope/)
  const current = review
    .readChecks({ includePassed: true })
    .items.find((item) => item.unitId === 'tier-2')
  if (!current) throw new Error('Expected retained third-tier result')
  const handoff = review.judgmentHandoff([foreign], 'visual')
  expect(handoff.next).toMatchObject({
    requiredInputs: ['bindChecks'],
    arguments: { phase: 'visual', inspectionIds: [foreign] }
  })
  expect(() =>
    review.bindReview('visual', [
      { criterionId: 'Finish', unitId: 'tier-2', inspectionIds: [foreign] }
    ])
  ).toThrow(`current result revision ${current.revision}`)
  expect(() =>
    review.record({
      ...repair,
      inspectionIds: [foreign],
      checks: [unit(2, foreign)]
    })
  ).toThrow(`current result revision ${current.revision}`)
  const unchanged = review
    .readChecks({ includePassed: true })
    .items.filter((item) => item.unitId !== 'tier-2')
  const replacement = {
    ...repair,
    inspectionIds: [foreign],
    checks: [
      {
        ...unit(2, foreign),
        status: 'unverified',
        supersedes: {
          revision: current.revision,
          reason: 'The third tier was redesigned at this replacement target.'
        }
      }
    ]
  }
  expect(
    operationInputIssue(schemaReviewInput(replacement), designEvidenceSchema)
  ).toBeUndefined()
  expect(review.record(replacement)).toMatchObject({ accepted: false })
  const updated = review
    .readChecks({ includePassed: true })
    .items.find((item) => item.unitId === 'tier-2')
  if (!updated) throw new Error('Expected replacement third-tier result')
  expect(updated).toMatchObject({
    status: 'unverified',
    revision: current.revision + 1,
    supersedes: replacement.checks[0].supersedes
  })
  expect(
    review
      .readChecks({ includePassed: true })
      .items.filter((item) => item.unitId !== 'tier-2')
  ).toEqual(unchanged)
  review.record(replacement)
  expect(
    review
      .readChecks({ includePassed: true })
      .items.find((item) => item.unitId === 'tier-2')
  ).toEqual(updated)
  expect(() =>
    review.record({
      ...replacement,
      checks: [{ ...replacement.checks[0], status: 'pass' }]
    })
  ).toThrow(/revision/)
  expect(
    review.record({
      phase: 'visual',
      ...wholeViewJudgments([overview], [check('Overview')])
    })
  ).toMatchObject({ accepted: false })
  review.record({
    ...repair,
    inspectionIds: [foreign],
    checks: [unit(2, foreign)]
  })
  expect(
    review.record({
      phase: 'visual',
      ...wholeViewJudgments([overview], [check('Overview')])
    })
  ).toMatchObject({ accepted: true })
})

it('replays unchanged criteria with the retained source-fact acknowledgement', () => {
  const review = createLocalDesignReview()
  const declaration = { ...plan, facts: [sourceFact] }
  const first = review.record(declaration)
  review.mutate()
  expect(review.record(declaration)).toEqual(first)
})

describe('declared regional acceptance', () => {
  const units = Array.from({ length: 8 }, (_, i) => `tier-${i}`)
  const specification = {
    ...plan,
    criteria: {
      ...reviewCriteria(['Overview']),
      Facade: {
        ...reviewCriteria(['Facade']).Facade,
        requiredUnits: [...units, 'alignment']
      }
    },
    structureCriteria: [],
    detailRequired: false
  }
  it('keeps regional declarations and sparse judgments aligned in canonical and native contracts', () => {
    const declaration = requireTestValue(
      designEvidenceDefinitions.find(
        (tool) => tool.name === 'define_design_criteria'
      )
    )
    const inspection = requireTestValue(
      designEvidenceDefinitions.find((tool) => tool.name === 'review_drawing')
    )
    expect(declaration.revision).toBe(5)
    expect(inspection.revision).toBe(15)
    const local = {
      phase: 'visual',
      inspectionIds: ['image'],
      checks: [
        {
          criterionId: 'Facade',
          unitId: 'tier-2',
          status: 'pass',
          evidence: 'Observed the requested region',
          inspectionIds: ['image']
        }
      ]
    }
    for (const [definition, input] of [
      [declaration, specification],
      [inspection, local]
    ] as const) {
      const schema = nativeToolInputSchema(definition.inputSchema)
      expect(
        operationInputIssue(schemaReviewInput(input), definition.inputSchema)
      ).toBeUndefined()
      expect(
        operationInputIssue(schemaReviewInput(input), schema)
      ).toBeUndefined()
    }
    const duplicate = {
      ...specification,
      criteria: {
        ...specification.criteria,
        Facade: {
          ...specification.criteria.Facade,
          requiredUnits: ['tier-2', 'tier-2']
        }
      }
    }
    expect(
      operationInputIssue(schemaReviewInput(duplicate), declaration.inputSchema)
    ).toBeDefined()
    expect(
      operationInputIssue(
        schemaReviewInput(duplicate),
        nativeToolInputSchema(declaration.inputSchema)
      )
    ).toBeDefined()
    expect(inspection.description).toContain(
      'Do not resend unrelated passed checks'
    )
  })

  const setup = () => {
    const review = createLocalDesignReview()
    review.record(specification)
    review.mutate()
    const capture = (id: string, revision = 1, overview = false) =>
      requireTestValue(
        review.inspect(
          id,
          true,
          overview,
          overview ? undefined : { x: 0, y: 0, width: 40, height: 60 },
          !overview,
          { sessionId: 'regional', revision, receiptId: `${id}:${revision}` }
        )
      ).inspectionId
    const submit = (unitId: string, inspectionIds: string[], final = false) =>
      review.record({
        phase: 'visual',
        final,
        inspectionIds,
        checks: [
          {
            criterionId: 'Facade',
            unitId,
            inspectionIds,
            status: 'pass',
            evidence: `Observed ${unitId}`
          }
        ]
      })
    const overall = (id: string) =>
      review.record({
        phase: 'visual',
        ...wholeViewJudgments([id], [check('Overview')])
      })
    return { review, capture, submit, overall }
  }

  it('accumulates regional judgments while preserving a separate whole-view obligation', () => {
    expect(
      operationInputIssue(schemaReviewInput(specification), reviewPlanSchema)
    ).toBeUndefined()
    const { review, capture, submit, overall } = setup()
    const images = units.map((id) => capture(id))
    for (let i = 0; i < 7; i++) submit(units[i], [images[i]])
    const incomplete = submit('alignment', [images[2], images[3]], true)
    expect(incomplete).toMatchObject({
      accepted: false,
      coverage: {
        required: 10,
        passed: 8,
        pending: expect.arrayContaining([
          expect.objectContaining({
            criterionId: 'Facade',
            unitId: 'tier-7',
            status: 'unverified'
          }),
          expect.objectContaining({ criterionId: 'Overview', status: 'stale' })
        ])
      }
    })
    expect(submit('tier-7', [images[7]], true).accepted).toBe(false)
    const whole = capture('building', 1, true)
    expect(overall(whole).accepted).toBe(true)
    const before = review.readChecks({ includePassed: true }).items
    review.mutate()
    review.invalidateInspections(
      [images[2], whole],
      'Tier 3 and whole view changed'
    )
    const replacement = capture(units[2], 2)
    const partial = submit(units[2], [replacement], true)
    expect(partial).toMatchObject({
      accepted: false,
      coverage: {
        passed: 8,
        pending: expect.arrayContaining([
          expect.objectContaining({
            criterionId: 'Facade',
            unitId: 'alignment',
            status: 'stale'
          }),
          expect.objectContaining({ criterionId: 'Overview', status: 'stale' })
        ])
      }
    })
    expect(submit('alignment', [replacement, images[3]], true).accepted).toBe(
      false
    )
    expect(overall(capture('building', 2, true)).accepted).toBe(true)
    const after = review.readChecks({ includePassed: true }).items
    for (const unitId of units.filter((id) => id !== units[2]))
      expect(after.find((item) => item.unitId === unitId)).toEqual(
        before.find((item) => item.unitId === unitId)
      )
    expect(review.evidenceEntries().map((entry) => entry.id)).not.toContain(
      whole
    )
    expect(review.evidenceEntries().map((entry) => entry.id)).toContain(
      images[0]
    )
    expect(() =>
      review.record({
        ...specification,
        criteria: {
          ...specification.criteria,
          Facade: {
            ...specification.criteria.Facade,
            requiredUnits: ['tier-2']
          }
        }
      })
    ).toThrow(/cannot be rewritten/)
    expect(() => submit('foreign', [replacement])).toThrow(/declared/)
    expect(() =>
      review.record({
        phase: 'visual',
        ...wholeViewJudgments([replacement], [check('Facade')])
      })
    ).toThrow(/unit/)
  })

  it('cannot use a regional judgment overview to approve a whole criterion judged only from a crop', () => {
    const { capture, submit, overall } = setup()
    const whole = capture('building', 1, true)
    for (const unit of [...units, 'alignment']) submit(unit, [whole])
    const crop = capture('small-detail')
    const result = overall(crop)
    expect(result.accepted).toBe(false)
    expect(result.coverage.pending).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          criterionId: 'Overview',
          reason: 'whole-view-required'
        })
      ])
    )
    expect(overall(whole).accepted).toBe(true)
  })

  it('rejects invalid declarations before recording any obligations', () => {
    const invalid = [
      { ...specification, criteria: { Facade: specification.criteria.Facade } },
      { ...specification, structureCriteria: ['Facade'] },
      ...[
        ['tier-0', 'tier-0'],
        [''],
        Array.from({ length: 25 }, (_, i) => String(i))
      ].map((requiredUnits) => ({
        ...specification,
        criteria: {
          ...specification.criteria,
          Facade: { ...specification.criteria.Facade, requiredUnits }
        }
      })),
      {
        ...specification,
        criteria: {
          ...specification.criteria,
          Facade: { ...specification.criteria.Facade, verification: 'data' }
        }
      }
    ]
    for (const value of invalid) {
      const review = createLocalDesignReview()
      expect(() => review.record(value)).toThrow()
      expect(review.readChecks({ includePassed: true }).items).toEqual([])
    }
  })

  it('replaces only unjudged pre-drawing obligations without retaining phantom pending results', () => {
    const review = createLocalDesignReview()
    review.record(specification)
    review.record({
      ...plan,
      criteria: reviewCriteria(['Construction']),
      structureCriteria: []
    })
    expect(
      review
        .readChecks({ includePassed: true })
        .items.map((item) => item.criterionId)
    ).toEqual(['Construction'])
    expect(review.coverage().pending.map((item) => item.criterionId)).toEqual([
      'Construction'
    ])
  })

  it('allows the first declaration after drawing and cannot reset existing judgments', () => {
    const review = createLocalDesignReview()
    review.mutate()
    review.record(specification)
    const before = review.readChecks({ includePassed: true })
    review.record(specification)
    expect(review.readChecks({ includePassed: true })).toEqual(before)
    const first = createLocalDesignReview()
    first.record(specification)
    const id = requireTestValue(
      first.inspect('tier', true, false, undefined, true)
    ).inspectionId
    first.record({
      phase: 'visual',
      final: false,
      inspectionIds: [id],
      checks: [
        {
          ...check('Facade'),
          inspectionIds: [id],
          unitId: 'tier-0'
        }
      ]
    })
    const after = first.readChecks({ includePassed: true })
    first.record(specification)
    expect(first.readChecks({ includePassed: true })).toEqual(after)
    expect(() =>
      first.record({
        ...specification,
        criteria: {
          ...specification.criteria,
          Facade: {
            ...specification.criteria.Facade,
            requiredUnits: ['tier-0']
          }
        }
      })
    ).toThrow(/cannot be rewritten/)
  })

  it('locks declarations after structure judgments before changing reference requirements', () => {
    const review = createLocalDesignReview()
    review.record(plan)
    const id = requireTestValue(
      review.inspect('building', true, true)
    ).inspectionId
    review.record({
      phase: 'structure',
      ...wholeViewJudgments([id], [check('Viewpoint')])
    })
    const before = review.readChecks({ includePassed: true })
    const context = review.preparationContext()
    expect(() =>
      review.record({
        ...plan,
        criteria: reviewCriteria(['Changed']),
        structureCriteria: ['Changed']
      })
    ).toThrow(/cannot be rewritten/)
    expect(review.readChecks({ includePassed: true })).toEqual(before)
    expect(review.preparationContext()).toEqual(context)
  })

  it('records valid local work without detail but rejects a malformed submission atomically', () => {
    const { review, capture, submit } = setup()
    const id = capture('tier-0')
    submit('tier-0', [id], true)
    const before = review.readChecks({ includePassed: true })
    expect(() =>
      review.record({
        phase: 'visual',
        final: true,
        inspectionIds: [id],
        checks: [
          { ...check('Facade'), inspectionIds: [id], unitId: 'tier-1' },
          { ...check('Facade'), inspectionIds: [id], unitId: 'foreign' }
        ]
      })
    ).toThrow(/declared/)
    expect(review.readChecks({ includePassed: true })).toEqual(before)
    const detailed = createLocalDesignReview()
    detailed.record({ ...plan, structureCriteria: [] })
    detailed.mutate()
    const overview = requireTestValue(
      detailed.inspect('building', true, true)
    ).inspectionId
    const result = detailed.record({
      phase: 'visual',
      ...wholeViewJudgments([overview], [check('Finish')])
    })
    expect(result.accepted).toBe(false)
    expect(detailed.readChecks({ includePassed: true }).items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ criterionId: 'Finish', status: 'pass' })
      ])
    )
  })
})

it('accumulates deferred decisions before completion and reopens only changed dependencies', () => {
  const r = createLocalDesignReview()
  r.record({
    ...plan,
    detailRequired: false,
    structureCriteria: [],
    criteria: {
      ...reviewCriteria(['Viewpoint']),
      Finish: {
        ...reviewCriteria(['Finish']).Finish,
        requiredUnits: ['rear', 'roof']
      }
    },
    deferredDetails: [
      { id: 'rear', description: 'Rear windows', reason: 'Possibly hidden' },
      { id: 'roof', description: 'Roof railing', reason: 'Check visibility' }
    ]
  })
  const capture = (target: string, revision = 1) =>
    requireTestValue(
      r.inspect(target, true, target === 'root', undefined, target !== 'root', {
        sessionId: 'deferred',
        revision,
        receiptId: `${target}:${revision}`
      })
    ).inspectionId
  const rear = capture('rear')
  const roof = capture('roof')
  const root = capture('root')
  const submit = (id: string, criterionId: string, extra = {}) =>
    r.record({
      phase: 'visual',
      inspectionIds: [id],
      checks: [
        {
          ...check(criterionId),
          inspectionIds: [id],
          ...(criterionId === 'Finish'
            ? { unitId: id === roof ? 'roof' : 'rear' }
            : {})
        }
      ],
      ...extra
    })
  expect(
    submit(rear, 'Finish', {
      final: false,
      deferredChecks: [
        { id: 'rear', status: 'omit', evidence: 'Rear windows are hidden' }
      ]
    })
  ).toMatchObject({ accepted: false, pendingDetails: ['roof'] })
  expect(
    submit(roof, 'Finish', {
      final: false,
      deferredChecks: [
        { id: 'roof', status: 'restored', evidence: 'Railing is visible' }
      ]
    })
  ).toMatchObject({ accepted: false, pendingDetails: [] })
  expect(submit(root, 'Viewpoint')).toMatchObject({
    accepted: true,
    pendingDetails: []
  })
  const before = r.readChecks({ includePassed: true }).items
  r.mutate()
  r.invalidateInspections(
    [rear, root],
    'Only the rear and overall image changed'
  )
  const newRoot = capture('root', 2)
  expect(submit(newRoot, 'Viewpoint')).toMatchObject({
    accepted: false,
    pendingDetails: ['rear']
  })
  expect(
    r
      .readChecks({ includePassed: true })
      .items.find((item) => item.id === 'deferred:roof')
  ).toEqual(before.find((item) => item.id === 'deferred:roof'))
  expect(
    submit(capture('rear', 2), 'Finish', {
      deferredChecks: [
        {
          id: 'rear',
          status: 'restored',
          evidence: 'Rear now visible and restored'
        }
      ]
    })
  ).toMatchObject({ accepted: true, pendingDetails: [] })
})

it('never reports accepted with unresolved mechanical evidence and preserves visual work for recovery', () => {
  const results = createDesignCheckResults()
  const r = createLocalDesignReview({ results })
  r.record({ ...plan, detailRequired: false, structureCriteria: [] })
  const id = requireTestValue(r.inspect('root', true, true)).inspectionId
  const mechanical = {
    id: 'measurement:root',
    origin: 'tool' as const,
    status: 'fail' as const,
    evidence: 'Overlapping windows',
    dependencies: { target: '1' }
  }
  results.record(mechanical)
  const review = {
    phase: 'visual',
    ...wholeViewJudgments([id], [check('Viewpoint'), check('Finish')])
  }
  expect(r.record(review)).toMatchObject({ accepted: false })
  expect(r.isAccepted()).toBe(false)
  const before = results
    .read({ includePassed: true })
    .items.filter((item) => item.origin === 'main-agent')
  results.record({ ...mechanical, status: 'pass', evidence: 'No overlap' })
  expect(r.isAccepted()).toBe(true)
  expect(
    results
      .read({ includePassed: true })
      .items.filter((item) => item.origin === 'main-agent')
  ).toEqual(before)
  results.invalidate(['target'], 'Target changed')
  expect(r.isAccepted()).toBe(false)
  expect(r.getIssue()).toBeDefined()
})

it('reopens changed deferred definitions without dropping other decisions or publishing invalid candidates', () => {
  const r = createLocalDesignReview()
  r.record({
    ...plan,
    detailRequired: false,
    structureCriteria: [],
    deferredDetails: [
      { id: 'rear', description: 'Rear windows', reason: 'Check visibility' }
    ]
  })
  const id = requireTestValue(
    r.inspect('root', true, true, undefined, false, {
      sessionId: 'deferred',
      revision: 1,
      receiptId: 'root'
    })
  ).inspectionId
  const review = {
    phase: 'visual',
    ...wholeViewJudgments([id], [check('Viewpoint'), check('Finish')])
  }
  const decision = {
    id: 'rear',
    status: 'omit',
    evidence: 'Current view excludes rear'
  }
  expect(r.record({ ...review, deferredChecks: [decision] }).accepted).toBe(
    true
  )
  const before = r.readChecks({ includePassed: true })
  r.record({ ...review, deferredChecks: [decision] })
  expect(r.readChecks({ includePassed: true })).toEqual(before)
  expect(() =>
    r.record({
      ...review,
      deferredChecks: [decision, { ...decision, id: 'unknown' }]
    })
  ).toThrow()
  expect(r.readChecks({ includePassed: true })).toEqual(before)
  const changed = {
    id: 'rear',
    description: 'Rear windows and ledge',
    reason: 'Also check the ledge'
  }
  expect(
    r.validateReview({ ...review, deferredDetails: [changed] })
  ).toMatchObject({ readyForCompletion: false })
  expect(r.readChecks({ includePassed: true })).toEqual(before)
  expect(r.record({ ...review, deferredDetails: [changed] })).toMatchObject({
    accepted: false,
    pendingDetails: ['rear']
  })
  expect(r.readChecks().items).toContainEqual(
    expect.objectContaining({ id: 'deferred:rear', status: 'stale' })
  )
  expect(
    r.record({
      ...review,
      deferredChecks: [{ ...decision, status: 'pending' }]
    })
  ).toMatchObject({ accepted: false, pendingDetails: ['rear'] })
  expect(
    r.record({
      ...review,
      deferredChecks: [{ ...decision, status: 'restored' }]
    }).accepted
  ).toBe(true)
  const restored = r
    .readChecks({ includePassed: true })
    .items.find((item) => item.id === 'deferred:rear')
  r.record({ ...review, deferredChecks: [decision] })
  expect(
    r
      .readChecks({ includePassed: true })
      .items.find((item) => item.id === 'deferred:rear')
  ).toMatchObject({
    deferredDecision: 'omit',
    revision: requireTestValue(restored).revision + 1
  })
})

it('replays the saved Taipei101 base judgment without inheriting the whole-building dependency', () => {
  const review = createLocalDesignReview()
  review.record({
    ...recordedReview.plan,
    criteria: {
      ...recordedReview.plan.criteria,
      whole: { ...recordedReview.plan.criteria.whole, requiredUnits: [] },
      view: { ...recordedReview.plan.criteria.view, requiredUnits: [] }
    }
  })
  const ids = new Map<string, string>()
  recordedReview.images.forEach((image, index) => {
    const capture = recordedReview.capture.inspections[index]
    const result = review.inspect(
      image.elementId,
      true,
      capture.view === 'overview',
      'region' in capture ? capture.region : undefined,
      capture.view === 'detail',
      image.evidence
    )
    if (!result) throw new Error('Missing replay image')
    ids.set(image.inspectionId, result.inspectionId)
  })
  const input = {
    ...recordedReview.judgment,
    inspectionIds: recordedReview.judgment.inspectionIds.map((id) =>
      requireTestValue(ids.get(id))
    ),
    checks: recordedReview.judgment.checks.map((check) => ({
      ...check,
      inspectionIds: check.inspectionIds.map((id) =>
        requireTestValue(ids.get(id))
      )
    }))
  }
  const original = review.readChecks({ includePassed: true })
  expect(() => review.record(input, { validateOnly: true })).not.toThrow()
  expect(review.readChecks({ includePassed: true })).toEqual(original)
  const overview = input.inspectionIds[0]
  const local = {
    ...input,
    checks: input.checks.map((check) =>
      check.unitId === 'base'
        ? {
            ...check,
            inspectionIds: check.inspectionIds.filter((id) => id !== overview)
          }
        : check
    )
  }
  review.record(local)
  const base = () =>
    review
      .readChecks({ includePassed: true })
      .items.find((item) => item.unitId === 'base')
  const passedBase = base()
  expect(passedBase?.status).toBe('pass')
  review.invalidateInspections(
    [overview, input.inspectionIds[1]],
    'Recorded crown correction'
  )
  expect(base()).toEqual(passedBase)
  expect(
    review
      .readChecks({ includePassed: true })
      .items.find((item) => item.criterionId === 'whole')?.status
  ).toBe('stale')
  review.invalidateInspections([input.inspectionIds[3]], 'Actual base edit')
  expect(base()?.status).toBe('stale')
})

it('preserves pending judgment evidence across partial correction and structure recovery', () => {
  const review = createLocalDesignReview()
  review.record(plan)
  review.mutate()
  const inspectionIds = inspect(review)
  review.record({
    phase: 'visual',
    ...wholeViewJudgments(inspectionIds, [
      check('Viewpoint', 'fail'),
      check('Finish', 'fail')
    ])
  })
  const partial = review.record({
    phase: 'visual',
    final: false,
    ...wholeViewJudgments(inspectionIds, [check('Finish')])
  })
  expect(partial.correction).toMatchObject({
    checks: [{ criterionId: 'Viewpoint', evidence: 'Observed Viewpoint fail' }]
  })
  const finish = review
    .readChecks({ includePassed: true })
    .items.find((item) => item.id === 'visual:Finish')
  review.record({
    phase: 'structure',
    ...wholeViewJudgments(inspectionIds, [check('Viewpoint')])
  })
  expect(review.correctionContext().checks).toEqual([])
  expect(
    review
      .readChecks({ includePassed: true })
      .items.find((item) => item.id === 'visual:Finish')
  ).toEqual(finish)
  expect(review.isAccepted()).toBe(false)
  expect(
    review.record({
      phase: 'visual',
      ...wholeViewJudgments(inspectionIds, [check('Viewpoint')])
    })
  ).toMatchObject({ accepted: true })
})

it('revokes final acceptance on a later structure failure and recovers without losing unrelated passes', () => {
  const review = createLocalDesignReview()
  review.record(plan)
  review.mutate()
  const inspectionIds = inspect(review)
  review.record({
    phase: 'visual',
    ...wholeViewJudgments(inspectionIds, [check('Viewpoint'), check('Finish')])
  })
  expect(review.isAccepted()).toBe(true)
  const before = review.readChecks({ includePassed: true })
  const failure = {
    phase: 'structure',
    ...wholeViewJudgments(inspectionIds, [check('Viewpoint', 'fail')])
  }
  review.validateReview(failure)
  expect(review.readChecks({ includePassed: true })).toEqual(before)
  expect(review.isAccepted()).toBe(true)
  review.record(failure)
  expect(review.isAccepted()).toBe(false)
  expect(review.getIssue()).toContain('Observed Viewpoint fail')
  expect(review.correctionContext()).toMatchObject({
    requiresFreshReview: true,
    checks: [{ criterionId: 'Viewpoint', evidence: 'Observed Viewpoint fail' }]
  })
  const failed = review.readChecks({ includePassed: true })
  expect(() =>
    review.record({ ...failure, checks: [check('Unknown')] })
  ).toThrow()
  expect(review.readChecks({ includePassed: true })).toEqual(failed)
  review.record({
    phase: 'structure',
    ...wholeViewJudgments(inspectionIds, [check('Viewpoint')])
  })
  expect(review.isAccepted()).toBe(false)
  expect(
    review.record({
      phase: 'visual',
      ...wholeViewJudgments(inspectionIds, [check('Viewpoint')])
    })
  ).toMatchObject({ accepted: true })
  expect(review.getIssue()).toBeUndefined()
  expect(
    review
      .readChecks({ includePassed: true })
      .items.find((item) => item.id === 'visual:Finish')
  ).toEqual(before.items.find((item) => item.id === 'visual:Finish'))
})

it.each(['structure', 'visual'])(
  'preserves a failed %s judgment of existing content without a preceding edit',
  (phase) => {
    const review = createLocalDesignReview()
    review.record(plan)
    const inspectionIds = inspect(review)
    expect(review.getIssue()).toBeUndefined()
    const failure = {
      phase,
      ...wholeViewJudgments(
        inspectionIds,
        phase === 'structure'
          ? [check('Viewpoint', 'fail')]
          : [check('Viewpoint', 'fail'), check('Finish')]
      )
    }
    review.validateReview(failure)
    expect(review.getIssue()).toBeUndefined()
    review.record(failure)
    expect(review.isAccepted()).toBe(false)
    expect(review.getIssue()).toContain('Observed Viewpoint fail')
    expect(
      review.record({
        phase: 'visual',
        ...wholeViewJudgments(inspectionIds, [
          check('Viewpoint'),
          check('Finish')
        ])
      })
    ).toMatchObject({ accepted: true })
    expect(review.getIssue()).toBeUndefined()
  }
)

describe('recorded 101 scope admission', () => {
  it('rejects the original omitted-scope plan atomically before retaining criteria', () => {
    const review = createLocalDesignReview()
    expect(() => review.record(recordedScope.plan)).toThrow(/requiredUnits/)
    expect(review.readChecks({ includePassed: true }).items).toEqual([])
    expect(
      operationInputIssue(
        schemaReviewInput(recordedScope.plan),
        reviewPlanSchema
      )
    ).toBeDefined()
  })
  it('rejects inherited image scope without replacing current checks', () => {
    const review = createLocalDesignReview()
    review.record({
      phase: 'plan',
      method: 'Explicit scope',
      references: [],
      detailRequired: false,
      criteria: {
        whole: {
          requirement: 'Whole view',
          description: 'Whole view',
          verification: 'visual',
          requiredUnits: []
        }
      }
    })
    const image = requireTestValue(
      review.inspect('building', true, true)
    ).inspectionId
    const before = review.readChecks({ includePassed: true })
    expect(() =>
      review.record({
        phase: 'visual',
        final: false,
        inspectionIds: [image],
        checks: [recordedScope.judgments[0].input.checks[0]]
      })
    ).toThrow(/inspectionIds/)
    expect(review.readChecks({ includePassed: true })).toEqual(before)
  })
})

it('rejects undeclared units instead of silently adding obligations to a whole-view criterion', () => {
  const review = createLocalDesignReview()
  review.record(reviewPlanExample)
  const image = requireTestValue(
    review.inspect('building', true, true)
  ).inspectionId
  const before = review.readChecks({ includePassed: true })
  expect(() =>
    review.record({
      phase: 'visual',
      inspectionIds: [image],
      checks: [
        {
          criterionId: 'appearance',
          unitId: 'undeclared',
          inspectionIds: [image],
          status: 'pass',
          evidence: 'A local claim cannot redefine a whole-view criterion'
        }
      ]
    })
  ).toThrow(/declared/)
  expect(review.readChecks({ includePassed: true })).toEqual(before)
})

it.each(['pass', 'fail', 'unverified'] as const)(
  'does not inherit unused retired images during sparse %s judgment recovery',
  (status) => {
    const review = createLocalDesignReview()
    review.record(reviewPlanExample)
    const retired = requireTestValue(
      review.inspect('old', true, true)
    ).inspectionId
    review.invalidateInspections([retired], 'The old target changed')
    const current = requireTestValue(
      review.inspect('current', true, true)
    ).inspectionId
    const result = review.record({
      phase: 'visual',
      inspectionIds: [retired, current],
      checks: [
        {
          criterionId: 'appearance',
          status,
          evidence: 'Current target',
          inspectionIds: [current]
        }
      ]
    })
    expect(result).toMatchObject({ accepted: status === 'pass' })
    const retained = review.readChecks({ includePassed: true })
    expect(() =>
      review.record({
        phase: 'visual',
        inspectionIds: [retired, current],
        checks: [
          {
            criterionId: 'appearance',
            status: 'pass',
            evidence: 'Retired target',
            inspectionIds: [retired]
          }
        ]
      })
    ).toThrow(/inspection/i)
    expect(review.readChecks({ includePassed: true })).toEqual(retained)
  }
)

it('keeps deferred-detail image dependencies when filtering the judgment menu', () => {
  const review = createLocalDesignReview()
  review.record({
    ...reviewPlanExample,
    deferredDetails: [
      {
        id: 'rear',
        description: 'Rear details',
        reason: 'Confirm visibility'
      }
    ]
  })
  const retired = requireTestValue(
    review.inspect('old', true, true)
  ).inspectionId
  review.invalidateInspections([retired], 'The deferred evidence changed')
  const current = requireTestValue(
    review.inspect('current', true, true)
  ).inspectionId
  const before = review.readChecks({ includePassed: true })
  expect(() =>
    review.record({
      phase: 'visual',
      inspectionIds: [retired, current],
      checks: [
        {
          criterionId: 'appearance',
          status: 'pass',
          evidence: 'Current image',
          inspectionIds: [current]
        }
      ],
      deferredChecks: [
        {
          id: 'rear',
          status: 'omit',
          evidence: 'Hidden in both submitted images'
        }
      ]
    })
  ).toThrow(/current inspection IDs/)
  expect(review.readChecks({ includePassed: true })).toEqual(before)
})

it('replays recorded crown rejection and explicit local redesign from the delivered binding guide', () => {
  const review = createLocalDesignReview()
  // This replay isolates image binding; reference acquisition and facts are separate owners.
  review.record({
    ...recordedBindings.plan,
    referenceImageIndexes: [],
    facts: []
  })
  const ids = new Map<string, string>()
  const capture = (index: number) => {
    const call = recordedBindings.calls[index]
    const input = call.input as {
      inspections: { elementId: string; view?: string; region?: unknown }[]
    }
    input.inspections.forEach((target, offset) => {
      const image = review.inspect(
        target.elementId,
        true,
        target.view === 'overview',
        target.region,
        target.view === 'detail',
        {
          sessionId: 'recorded-bindings',
          revision: index,
          receiptId: `${index}:${offset}`
        }
      )
      if (!image) throw new Error('Expected delivered image')
      ids.set(call.inspectionIds[offset], image.inspectionId)
    })
  }
  const judgment = (index: number) => {
    const input = structuredClone(recordedBindings.calls[index].input) as {
      inspectionIds: string[]
      checks: {
        criterionId: string
        unitId?: string
        inspectionIds: string[]
        supersedes?: { revision: number; reason: string }
      }[]
    }
    input.inspectionIds = input.inspectionIds.map((id) =>
      requireTestValue(ids.get(id))
    )
    input.checks.forEach((check) => {
      check.inspectionIds = check.inspectionIds.map((id) =>
        requireTestValue(ids.get(id))
      )
    })
    return input
  }
  capture(0)
  review.record(judgment(1))
  capture(2)
  const before = review.readChecks({ includePassed: true })
  expect(() => review.record(judgment(3))).toThrow(/scope changed/)
  expect(() => review.record(judgment(4))).toThrow(/current result revision/)
  expect(review.readChecks({ includePassed: true })).toEqual(before)
  const handoff = review.judgmentHandoff(
    recordedBindings.calls[2].inspectionIds.map((id) =>
      requireTestValue(ids.get(id))
    ),
    'visual'
  )
  expect(handoff.next?.requiredInputs).toEqual(['bindChecks'])
  const corrected = judgment(5)
  for (const check of corrected.checks) {
    if (check.supersedes) {
      const prior = before.items.find(
        (item) =>
          item.criterionId === check.criterionId && item.unitId === check.unitId
      )
      check.supersedes.revision = requireTestValue(prior).revision
    }
  }
  review.record(corrected)
  expect(review.readChecks({ includePassed: true }).items).toContainEqual(
    expect.objectContaining({
      criterionId: 'details',
      unitId: 'crown',
      status: 'pass'
    })
  )
  const camera = before.items.find((item) => item.criterionId === 'camera')
  expect(review.readChecks({ includePassed: true }).items).toContainEqual(
    camera
  )
})

describe('explicit review binding handoff', () => {
  const setup = () => {
    const review = createLocalDesignReview()
    review.record({ ...plan, structureCriteria: [], detailRequired: false })
    const image = requireTestValue(
      review.inspect('root', true, true, undefined, false, {
        sessionId: 'binding-document',
        revision: 1,
        receiptId: 'current-root'
      })
    ).inspectionId
    return { review, image }
  }
  it('binds exact delivered evidence before primary verdict and retains independent passes', () => {
    const { review, image } = setup()
    const bound = review.bindReview('visual', [
      { criterionId: 'Viewpoint', inspectionIds: [image] },
      { criterionId: 'Finish', inspectionIds: [image] }
    ])
    expect(bound.checks[0].binding).toMatchObject({
      requirementRevision: 1,
      checkRevision: 1
    })
    expect(bound.checks[0].binding.dependencies[0]).toMatchObject({
      inspectionId: image,
      elementId: 'root',
      source: { receiptId: 'current-root' }
    })
    const submit = {
      ...bound,
      checks: bound.checks.map((item) => ({
        ...item,
        status: 'pass',
        evidence: 'Observed the requested surface.'
      }))
    }
    const receipt = review.recordBoundReview({ ...submit, final: false })
    expect(receipt).toMatchObject({
      reviewOperation: 'record',
      accepted: false,
      recordedChecks: [
        {
          id: 'visual:Viewpoint',
          criterionId: 'Viewpoint',
          origin: 'main-agent',
          status: 'pass',
          revision: expect.any(Number)
        },
        {
          id: 'visual:Finish',
          criterionId: 'Finish',
          origin: 'main-agent',
          status: 'pass',
          revision: expect.any(Number)
        }
      ]
    })
    expect(receipt.recordedChecks?.every((item) => !('evidence' in item))).toBe(
      true
    )
    review.recordBoundReview(submit)
    const before = review.readChecks({ includePassed: true })
    review.recordBoundReview(submit)
    expect(review.readChecks({ includePassed: true })).toEqual(before)
    const fresh = review.bindReview('visual', [
      { criterionId: 'Finish', inspectionIds: [image] }
    ])
    review.recordBoundReview({
      ...fresh,
      checks: fresh.checks.map((item) => ({
        ...item,
        status: 'fail',
        evidence: 'Finish needs adjustment.'
      }))
    })
    expect(() => review.recordBoundReview(submit)).toThrow(/stale/)
    expect(
      review
        .readChecks({ includePassed: true })
        .items.find((item) => item.criterionId === 'Viewpoint')?.status
    ).toBe('pass')
  })
  it('rejects forged or foreign bindings atomically without accepting an unbound tool verdict', () => {
    const { review, image } = setup()
    const initial = review.readChecks({ includePassed: true })
    const bound = review.bindReview('visual', [
      { criterionId: 'Viewpoint', inspectionIds: [image] }
    ])
    const submit = {
      ...bound,
      checks: bound.checks.map((item) => ({
        ...item,
        status: 'pass',
        evidence: 'Observed.'
      }))
    }
    expect(() => setup().review.recordBoundReview(submit)).toThrow(/binding/)
    expect(() =>
      review.recordBoundReview({
        ...submit,
        checks: [{ ...submit.checks[0], criterionId: 'Finish' }]
      })
    ).toThrow(/binding/)
    expect(() =>
      review.recordBoundReview({
        ...submit,
        checks: [{ ...submit.checks[0], binding: undefined }]
      })
    ).toThrow(/binding/)
    expect(review.readChecks({ includePassed: true })).toEqual(initial)
  })
})

it('admits recorded multiscale input without changing unrelated passes before local recovery', () => {
  const review = createLocalDesignReview()
  review.record({
    ...plan,
    structureCriteria: [],
    detailRequired: false,
    criteria: {
      ...reviewCriteria(['view', 'material']),
      detail: {
        requirement: 'Crown detail',
        description: 'Check the crown crop',
        verification: 'visual',
        requiredUnits: ['crown']
      }
    }
  })
  const ids = new Map<string, string>()
  exactReviewBinding.captures.forEach((target, index) => {
    const image = requireTestValue(
      review.inspect(
        target.elementId,
        true,
        target.view === 'overview',
        'region' in target ? target.region : undefined,
        target.view === 'detail',
        {
          sessionId: 'recorded-current',
          revision: 1,
          receiptId: `recorded-${index}`
        }
      )
    )
    ids.set(
      exactReviewBinding.rejected.inspectionIds[index],
      image.inspectionId
    )
  })
  const select = (input: typeof exactReviewBinding.rejected) =>
    input.checks.map(({ status: _status, evidence: _evidence, ...check }) => ({
      ...check,
      inspectionIds: check.inspectionIds.map((id) =>
        requireTestValue(ids.get(id))
      )
    }))
  const prior = review.bindReview('visual', [
    select(exactReviewBinding.corrected)[0]
  ])
  review.recordBoundReview({
    ...prior,
    checks: prior.checks.map((check) => ({
      ...check,
      status: 'pass',
      evidence: 'Independent viewpoint passed.'
    }))
  })
  const before = review.readChecks({ includePassed: true })
  expect(() =>
    review.bindReview('visual', select(exactReviewBinding.rejected))
  ).not.toThrow()
  expect(review.readChecks({ includePassed: true })).toEqual(before)
  const corrected = review.bindReview(
    'visual',
    select(exactReviewBinding.corrected).slice(1)
  )
  review.recordBoundReview({
    ...corrected,
    checks: corrected.checks.map((check, index) => ({
      ...check,
      status: exactReviewBinding.corrected.checks[index + 1].status,
      evidence: exactReviewBinding.corrected.checks[index + 1].evidence
    }))
  })
  const passed = review.readChecks({ includePassed: true })
  const crown = requireTestValue(
    corrected.checks.find((check) => check.unitId === 'crown')
  )
  review.invalidateInspections(
    crown.inspectionIds,
    'Only the crown dependency changed'
  )
  expect(() =>
    review.recordBoundReview({
      ...corrected,
      checks: [{ ...crown, status: 'pass', evidence: 'Old crop' }]
    })
  ).toThrow(/binding|inspection/)
  const target = exactReviewBinding.captures[2]
  const image = requireTestValue(
    review.inspect(target.elementId, true, false, target.region, true, {
      sessionId: 'recorded-current',
      revision: 2,
      receiptId: 'fresh-crown'
    })
  )
  const fresh = review.bindReview('visual', [
    {
      criterionId: 'detail',
      unitId: 'crown',
      inspectionIds: [image.inspectionId]
    }
  ])
  review.recordBoundReview({
    ...fresh,
    checks: fresh.checks.map((check) => ({
      ...check,
      status: 'pass',
      evidence: 'Corrected local crown.'
    }))
  })
  expect(
    review
      .readChecks({ includePassed: true })
      .items.find((item) => item.criterionId === 'view')
  ).toEqual(passed.items.find((item) => item.criterionId === 'view'))
})

it('routes a mechanical blocker without demanding a new accepted visual judgment', () => {
  const results = createDesignCheckResults()
  const review = createLocalDesignReview({ results })
  review.record({ ...plan, detailRequired: false })
  const image = requireTestValue(
    review.inspect('root', true, true)
  ).inspectionId
  review.record({
    phase: 'visual',
    ...wholeViewJudgments([image], [check('Viewpoint'), check('Finish')])
  })
  expect(review.isAccepted()).toBe(true)
  results.record({
    id: 'mechanical-root',
    origin: 'tool',
    status: 'fail',
    evidence: 'Constraint needs repair.',
    dependencies: {}
  })
  const handoff = review.selectReferences([]).review
  expect(handoff).toMatchObject({
    accepted: false,
    requiresFreshReview: false,
    requiredCriterionIds: [],
    next: {
      tool: 'read_design_checks',
      arguments: { ids: ['mechanical-root'] }
    }
  })
  results.record({
    id: 'mechanical-root',
    origin: 'tool',
    status: 'pass',
    evidence: 'Constraint repaired.',
    dependencies: {}
  })
  expect(review.selectReferences([]).review).toMatchObject({
    accepted: true,
    requiresFreshReview: false
  })
  expect(review.isAccepted()).toBe(true)
})

it('delivers individual correction scopes across sparse reviews without inferring edit targets', () => {
  const review = createLocalDesignReview()
  review.record({
    ...plan,
    structureCriteria: [],
    detailRequired: false,
    criteria: {
      Whole: reviewCriteria(['Whole']).Whole,
      Surface: {
        ...reviewCriteria(['Surface']).Surface,
        requiredUnits: ['left', 'right', 'base']
      }
    }
  })
  const capture = (elementId: string, overview: boolean, region?: object) => {
    const image = review.inspect(elementId, true, overview, region)
    if (!image) throw new Error('Missing image')
    return image.inspectionId
  }
  const left = capture('assembly', false, { x: 0, y: 0, width: 20, height: 30 })
  const right = capture('assembly', false, {
    x: 20,
    y: 0,
    width: 20,
    height: 30
  })
  const base = capture('base', false)
  const submit = (
    unitId: string,
    image: string,
    status: string,
    evidence: string
  ) => {
    const args = review.bindReview('visual', [
      { criterionId: 'Surface', unitId, inspectionIds: [image] }
    ])
    return review.recordBoundReview({
      ...args,
      checks: args.checks.map((check) => ({ ...check, status, evidence }))
    })
  }
  submit('left', left, 'fail', 'Left highlight is discontinuous')
  submit('right', right, 'unverified', 'Right reflection needs a closer view')
  const result = submit('base', base, 'pass', 'Base material agrees')
  const correction = result.correction
  expect(correction).not.toHaveProperty('criteria')
  expect(correction).toMatchObject({
    diagnosticOnly: true,
    checks: [
      {
        criterionId: 'Whole',
        status: 'unverified',
        inspectionIds: [],
        factElementIds: []
      },
      {
        criterionId: 'Surface',
        unitId: 'left',
        status: 'fail',
        evidence: 'Left highlight is discontinuous',
        inspectionIds: [left],
        factElementIds: []
      },
      {
        criterionId: 'Surface',
        unitId: 'right',
        status: 'unverified',
        evidence: 'Right reflection needs a closer view',
        inspectionIds: [right],
        factElementIds: []
      }
    ],
    inspections: [
      {
        inspectionId: left,
        elementId: 'assembly',
        region: { x: 0, y: 0, width: 20, height: 30 },
        coordinateSpace: 'element-local'
      },
      {
        inspectionId: right,
        elementId: 'assembly',
        region: { x: 20, y: 0, width: 20, height: 30 },
        coordinateSpace: 'element-local'
      }
    ],
    unavailableInspectionIds: [],
    discovery: {
      tool: 'describe_design_apis',
      arguments: { view: 'full' },
      requiredInputs: ['query']
    }
  })
  const passed = review
    .readChecks({ includePassed: true })
    .items.find((item) => item.unitId === 'base')
  const unchanged = review.readChecks({ includePassed: true })
  expect(review.correctionContext()).toEqual(correction)
  expect(review.readChecks({ includePassed: true })).toEqual(unchanged)
  review.invalidateInspections([left], 'The left surface was edited')
  expect(review.correctionContext()).toMatchObject({
    checks: expect.arrayContaining([
      expect.objectContaining({
        unitId: 'left',
        status: 'stale',
        evidence: 'Left highlight is discontinuous',
        inspectionIds: [left],
        reason: 'The left surface was edited'
      })
    ]),
    unavailableInspectionIds: [left],
    inspections: [expect.objectContaining({ inspectionId: right })]
  })
  const replacement = capture('assembly', false, {
    x: 0,
    y: 0,
    width: 20,
    height: 30
  })
  submit('left', replacement, 'pass', 'Corrected highlight agrees')
  expect(
    review
      .readChecks({ includePassed: true })
      .items.find((item) => item.unitId === 'base')
  ).toEqual(passed)
  expect(review.correctionContext().checks.map((item) => item.unitId)).toEqual([
    undefined,
    'right'
  ])
  expect(review.isAccepted()).toBe(false)
})

it('replays the saved failed material judgment with complete correction evidence and no extra read', () => {
  const review = createLocalDesignReview()
  review.record(correctionFixture.plan)
  review.mutate()
  const observed = correctionFixture.judgment.checks[0]
  const image = review.inspect(
    observed.binding.dependencies[0].elementId,
    true,
    true
  )
  if (!image) throw new Error('Missing current image')
  const bound = review.bindReview('visual', [
    { criterionId: observed.criterionId, inspectionIds: [image.inspectionId] }
  ])
  const result = review.recordBoundReview({
    ...bound,
    checks: bound.checks.map((check) => ({
      ...check,
      status: observed.status,
      evidence: observed.evidence
    }))
  })
  expect(result.accepted).toBe(false)
  const correction = result.correction
  expect(
    correction.checks.find(
      (check) => check.criterionId === observed.criterionId
    )
  ).toMatchObject({
    status: 'fail',
    evidence: observed.evidence,
    inspectionIds: [image.inspectionId],
    factElementIds: []
  })
  expect(correction.inspections).toEqual([
    {
      inspectionId: image.inspectionId,
      elementId: observed.binding.dependencies[0].elementId,
      overview: true,
      detail: false
    }
  ])
  // Compare the complete exchange with the old reply plus its missing pending-result read.
  const priorExchange =
    JSON.stringify(correctionFixture.receipt) +
    JSON.stringify({ view: 'details' }) +
    JSON.stringify(review.deliverChecks({ view: 'details' }))
  const currentExchange = JSON.stringify(result)
  expect(Buffer.byteLength(currentExchange)).toBeLessThan(
    Buffer.byteLength(priorExchange)
  )
  expect(correction.checks.map((check) => check.criterionId)).toEqual([
    'overall',
    'material',
    'ornament'
  ])
})

it('keeps fact targets on the exact correction unit and shares only explicitly cited image metadata', () => {
  const review = createLocalDesignReview()
  review.record({
    ...plan,
    structureCriteria: [],
    detailRequired: false,
    criteria: {
      Whole: reviewCriteria(['Whole']).Whole,
      Surface: {
        ...reviewCriteria(['Surface']).Surface,
        requiredUnits: ['a', 'b']
      }
    },
    facts: [sourceFact],
    factBindings: [
      {
        factId: sourceFact.id,
        criterionId: 'Surface',
        unitId: 'a',
        elementIds: ['fact-only-target']
      }
    ]
  })
  const image = review.inspect('assembly', true, true)
  if (!image) throw new Error('Missing image')
  const bound = review.bindReview(
    'visual',
    ['a', 'b'].map((unitId) => ({
      criterionId: 'Surface',
      unitId,
      inspectionIds: [image.inspectionId]
    }))
  )
  review.recordBoundReview({
    ...bound,
    checks: bound.checks.map((check) => ({
      ...check,
      status: 'fail',
      evidence: 'Same wording is not the same check identity'
    }))
  })
  expect(review.correctionContext()).toMatchObject({
    checks: [
      { criterionId: 'Whole', factElementIds: [] },
      {
        unitId: 'a',
        factElementIds: ['fact-only-target'],
        inspectionIds: [image.inspectionId]
      },
      { unitId: 'b', factElementIds: [], inspectionIds: [image.inspectionId] }
    ],
    inspections: [{ inspectionId: image.inspectionId, elementId: 'assembly' }]
  })
  const before = review.readChecks({ includePassed: true })
  expect(() =>
    review.recordBoundReview({
      ...bound,
      checks: [
        {
          ...bound.checks[0],
          unitId: 'foreign',
          status: 'pass',
          evidence: 'Invalid'
        }
      ]
    })
  ).toThrow()
  expect(review.readChecks({ includePassed: true })).toEqual(before)
})
