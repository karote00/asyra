import { inspectionInputSchema } from '../src/ai/inspection-schema'
import {
  createReferenceDecisions,
  referenceDecisionProperties,
  type ReferenceIdentity
} from './local-reference-decisions'
import { isDeepStrictEqual } from 'node:util'
import {
  validateVisualAssessment,
  type VisualAssessment,
  type VisualAssessmentContext
} from './local-visual-assessment'
import {
  createDesignFacts,
  designFactsSchema,
  designCalculationsSchema
} from './local-design-facts'
import type { InspectionEvidenceStamp } from '../src/ai/inspection-evidence'
import { randomUUID } from 'node:crypto'
import { AiDesignToolIds } from '../src/constants/ai-design'

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const text = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= 1000
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length <= 24 && value.every(text)

interface FactBinding {
  factId: string
  criterionId: string
  elementIds: string[]
}
const factBindingsSchema = {
  type: 'array',
  maxItems: 24,
  description:
    'Link applied source facts to planned criterion IDs and known canonical IDs (prefer their containing group). Update a binding when replacing its targets. Source facts remain unchanged.',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['factId', 'criterionId', 'elementIds'],
    properties: {
      factId: {
        type: 'string',
        minLength: 1,
        maxLength: 1000,
        description: 'The id of a recorded source fact.'
      },
      criterionId: {
        type: 'string',
        minLength: 1,
        maxLength: 1000,
        description: 'The stable ID of a saved plan criterion.'
      },
      elementIds: {
        type: 'array',
        minItems: 1,
        maxItems: 24,
        items: { type: 'string', minLength: 1, maxLength: 1000 }
      }
    }
  }
}

const designReviewProperties = {
  final: {
    type: 'boolean',
    description:
      'Visual phase only. Default true requires all criteria and required native detail. False assesses only the supplied planned criteria at this intermediate stage and never approves completion.'
  },
  factBindings: factBindingsSchema,
  facts: designFactsSchema.properties.facts,
  dependencyChanges: designFactsSchema.properties.dependencyChanges,
  phase: { type: 'string', enum: ['plan', 'structure', 'visual', 'facts'] },
  method: {
    type: 'string',
    maxLength: 1000,
    description:
      'Implementation approach and explicit assumptions, separate from user criterionIds.'
  },
  references: {
    type: 'array',
    maxItems: 24,
    items: { type: 'string', maxLength: 1000 }
  },
  criteria: {
    type: 'object',
    description:
      'Named checks keyed by stable IDs. Each links the original user requirement to an observable check. Do not upgrade the requested quality with extra material, fidelity or detail demands; optional polish is not a completion criterion. Set verification=visual for appearance judged from images or data for numeric scale, editability and other canonical properties. Split mixed requirements into separate criteria. Reuse IDs in structureCriteria, factBindings and checks; do not repeat descriptions as IDs.',
    additionalProperties: {
      type: 'object',
      additionalProperties: false,
      required: ['requirement', 'description', 'verification'],
      properties: {
        requirement: { type: 'string', minLength: 1, maxLength: 1000 },
        description: { type: 'string', minLength: 1, maxLength: 1000 },
        verification: { type: 'string', enum: ['visual', 'data'] }
      }
    }
  },
  structureCriteria: {
    type: 'array',
    description:
      'Select a unique subset of criterion IDs for an optional whole-structure checkpoint. Ready parts can be drawn and reviewed with phase=visual, final=false while other criteria remain pending.',
    maxItems: 24,
    items: { type: 'string', minLength: 1, maxLength: 1000 }
  },
  deferredDetails: {
    type: 'array',
    maxItems: 24,
    description:
      'Deferred-part descriptions, not geometry. Each entry requires id, description and reason. Add in plan or reviews. Final review resolves retained IDs. Example: {"id":"rear-detail","description":"Rear-facing trim","reason":"Likely occluded in the requested view; verify in final review."}',
    items: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'description', 'reason'],
      properties: {
        id: { type: 'string', minLength: 1, maxLength: 1000 },
        description: { type: 'string', minLength: 1, maxLength: 1000 },
        reason: { type: 'string', minLength: 1, maxLength: 1000 }
      }
    }
  },
  deferredChecks: {
    type: 'array',
    description:
      'Visual review of retained IDs. omit/restored resolve the part; pending retains it. Current evidence required.',
    items: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'status', 'evidence'],
      properties: {
        id: { type: 'string', minLength: 1, maxLength: 1000 },
        status: { type: 'string', enum: ['omit', 'restored', 'pending'] },
        evidence: { type: 'string', minLength: 1, maxLength: 1000 }
      }
    }
  },
  detailRequired: { type: 'boolean' },
  inspectionIds: {
    type: 'array',
    minItems: 1,
    maxItems: 24,
    uniqueItems: true,
    items: { type: 'string', minLength: 1 }
  },
  inspections: {
    type: 'array',
    minItems: 1,
    maxItems: 24,
    items: inspectionInputSchema
  },
  checks: {
    type: 'array',
    minItems: 1,
    maxItems: 24,
    items: {
      type: 'object',
      additionalProperties: false,
      required: ['criterionId', 'status', 'evidence'],
      properties: {
        criterionId: {
          type: 'string',
          description: 'The stable ID of the planned criterion being checked.'
        },
        status: { type: 'string', enum: ['pass', 'fail', 'unverified'] },
        evidence: { type: 'string', minLength: 1, maxLength: 1000 }
      }
    }
  }
}

const referenceImageIndexesSchema = {
  type: 'array',
  uniqueItems: true,
  items: { type: 'integer', minimum: 0 },
  description:
    'Attachment indexes of suitable reference images chosen for comparison. Include imported references explicitly; omitted selection uses only original user attachments. Do not select rejected research images.'
}

const reviewFactsSchema = {
  ...designFactsSchema,
  properties: {
    ...designFactsSchema.properties,
    factBindings: factBindingsSchema
  }
}
export const reviewPlanSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['phase', 'method', 'references', 'criteria', 'detailRequired'],
  properties: {
    phase: { type: 'string', const: 'plan' },
    method: designReviewProperties.method,
    references: designReviewProperties.references,
    referenceImageIndexes: referenceImageIndexesSchema,
    criteria: designReviewProperties.criteria,
    structureCriteria: designReviewProperties.structureCriteria,
    detailRequired: designReviewProperties.detailRequired,
    deferredDetails: designReviewProperties.deferredDetails,
    facts: designReviewProperties.facts,
    factBindings: designReviewProperties.factBindings,
    dependencyChanges: designReviewProperties.dependencyChanges
  }
}
// One executable minimal example is shared by discovery and App guidance.
export const reviewPlanExample = {
  phase: 'plan',
  method: 'Edit the requested appearance using existing editable objects.',
  references: [],
  criteria: {
    appearance: {
      requirement: 'Use the requested appearance.',
      description: 'The current drawing matches the requested appearance.',
      verification: 'visual'
    }
  },
  detailRequired: false
}
export const reviewPlanGuidance =
  `Criteria are keyed by stable IDs. Plan fields: ${reviewPlanSchema.required.join(', ')}. Each criterion requires ${reviewPlanSchema.properties.criteria.additionalProperties.required.join(', ')}. verification is visual for appearance or data for canonical/numeric checks; split mixed requirements. ` +
  `Plan input example: ${JSON.stringify(reviewPlanExample)}\nAdapt its criterion to the actual request; this example is syntax, not an extra requirement.`

const reviewStructureSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['phase', 'checks'],
  anyOf: [{ required: ['inspectionIds'] }, { required: ['inspections'] }],
  properties: {
    phase: { type: 'string', const: 'structure' },
    inspectionIds: designReviewProperties.inspectionIds,
    inspections: designReviewProperties.inspections,
    checks: designReviewProperties.checks,
    deferredDetails: designReviewProperties.deferredDetails
  }
}
const reviewVisualSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['phase', 'checks'],
  anyOf: [{ required: ['inspectionIds'] }, { required: ['inspections'] }],
  properties: {
    phase: { type: 'string', const: 'visual' },
    inspectionIds: designReviewProperties.inspectionIds,
    inspections: designReviewProperties.inspections,
    checks: designReviewProperties.checks,
    deferredDetails: designReviewProperties.deferredDetails,
    deferredChecks: designReviewProperties.deferredChecks,
    final: designReviewProperties.final
  }
}

// Examples are part of native discovery, tested against admission and the real owner.
const factUsageExamples = [
  {
    phase: 'facts',
    facts: [
      {
        id: 'source-axis',
        statement: 'The adopted reference establishes the selected axis.',
        scope:
          'Reference viewpoint only; this does not certify the current drawing.',
        sources: ['reference:adopted-image'],
        verification: 'Compared the visible axis in the reference.',
        dependencies: [{ key: 'reference:adopted-image', version: '1' }]
      }
    ]
  },
  {
    phase: 'facts',
    factBindings: [
      {
        factId: 'source-axis',
        criterionId: 'viewpoint',
        elementIds: ['applied-root-id']
      }
    ]
  }
]
const factUsage = factUsageExamples
  .map((example) => `\`\`\`json\n${JSON.stringify(example)}\n\`\`\``)
  .join('\n')

const reviewPhaseSchemas = [
  reviewFactsSchema,
  reviewPlanSchema,
  reviewStructureSchema,
  reviewVisualSchema
]
const reviewInputProperties = Object.assign(
  {},
  ...reviewPhaseSchemas.map((schema) => schema.properties),
  {
    phase: {
      type: 'string',
      enum: reviewPhaseSchemas.map((schema) => schema.properties.phase.const)
    }
  }
)

// Internal state admission retains explicit phases; each public tool exposes its own subset.
export const designEvidenceSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['phase'],
  oneOf: reviewPhaseSchemas,
  properties: reviewInputProperties
}

const optionalPhaseSchema = <
  T extends { required: readonly string[]; properties: Record<string, unknown> }
>(
  schema: T
) => {
  return {
    ...schema,
    required: schema.required.filter((key) => key !== 'phase')
  }
}
const sourceEvidenceSchema = optionalPhaseSchema(reviewFactsSchema)

export const designEvidenceDefinitions = [
  {
    type: 'function',
    name: AiDesignToolIds.DEFINE_DESIGN_CRITERIA,
    description:
      'Define request-linked criteria before review, after the first ready drawing if appropriate. Store requirements; this does not inspect or approve the drawing. phase is fixed by this tool and may be omitted. ' +
      reviewPlanGuidance,
    inputSchema: optionalPhaseSchema(reviewPlanSchema)
  },
  {
    type: 'function',
    name: AiDesignToolIds.RECORD_DESIGN_FACTS,
    description:
      'Record or retrieve verified source facts and their criterion/element bindings. A source fact requires id, statement, scope, sources, verification and dependencies:[{key,version}]. Preserve unchanged facts. Use dependencyChanges only for actual changed sources or contrary evidence, never to fix an arithmetic transcription. Use sourceCorrections:[{factId,sources,verification,reason}] to correct only a citation without changing its statement or dependency versions. Use retained referenceId or an existing attachment:N for image sources; source URLs remain attributed assertions. Use record_design_calculations for derived numbers. Bind with factId, criterionId and known elementIds. Omit all fields to retrieve existing facts. A changed source returns the pending review scope; recording facts is not approval. Examples use placeholder identities; substitute real evidence and known IDs.\n' +
      factUsage,
    inputSchema: sourceEvidenceSchema
  },
  {
    type: 'function',
    name: AiDesignToolIds.RECORD_DESIGN_CALCULATIONS,
    description:
      'Store or retrieve derived numeric notes using existing valid sourceFactIds. Dependencies come from those facts; do not repeat source versions. Corrections replace the note with new evidence and full precision, not source facts or canvas geometry. These notes never certify the drawing. Omit calculations to retrieve notes and their current validity. Do not redraw for negligible numerical narration unless the user requires that precision.',
    inputSchema: designCalculationsSchema
  },
  {
    type: 'function',
    name: AiDesignToolIds.SELECT_DESIGN_REFERENCES,
    description:
      'Select imported reference attachment indexes for independent visual comparison. Identical selection preserves approval; changed selection requires a new comparison. An empty selection clears it. Download success does not establish suitability. Record referenceDecisions with the current requirementRevision in this call; select candidates by index and assess their immutable referenceId against exact criterionIds. Rejected and undecided images are retained but excluded from comparison.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['referenceImageIndexes'],
      properties: {
        referenceImageIndexes: referenceImageIndexesSchema,
        ...referenceDecisionProperties
      }
    }
  },
  {
    type: 'function',
    name: AiDesignToolIds.REVIEW_DRAWING,
    description:
      'Review the current drawing against retained criteria and selected references. phase=structure checks the optional structural subset; phase=visual with final=false checks supplied criteria; phase=visual with final=true (default) checks all requirements and required native detail for completion. Supply checks [{criterionId,status,evidence}] with inspections [{elementId,view?,region?}] for fresh capture and review, current inspectionIds for reuse, or both (24 total). Capture targets use the inspect_drawing schema; regions are target-local and at most 1024 per side. Any failed capture returns successful inspectionIds and failedInspections without assessment. Retry with the successful IDs and corrected failed targets. Follow returned correction scope on failure. Source facts, criteria and calculations use their own tools. Optional polish is advisory; do not invent tighter precision than requested. The optional whole-structure checkpoint does not block ready parts. Record deferredDetails with id, description and reason; resolve them with deferredChecks (id, status and evidence).',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['phase'],
      oneOf: [reviewStructureSchema, reviewVisualSchema],
      properties: {
        ...reviewStructureSchema.properties,
        ...reviewVisualSchema.properties,
        phase: { type: 'string', enum: ['structure', 'visual'] }
      }
    }
  }
]

export const designEvidenceInput = (
  name: string,
  input: Record<string, unknown>
) => {
  if (name === AiDesignToolIds.DEFINE_DESIGN_CRITERIA)
    return { ...input, phase: 'plan' }
  if (name === AiDesignToolIds.RECORD_DESIGN_FACTS)
    return { ...input, phase: 'facts' }
  return input
}

const validateReferenceIndexes = (indexes: unknown): number[] => {
  if (
    !Array.isArray(indexes) ||
    indexes.some((index) => !Number.isSafeInteger(index) || index < 0) ||
    new Set(indexes).size !== indexes.length
  )
    throw new Error(
      'Reference image indexes must be unique nonnegative integers.'
    )
  return [...indexes]
}

/** Evidence lifetime is one local invocation and one mutation revision. */
export const createLocalDesignReview = (
  options: {
    independentAssessment?: boolean
    resolveSources?: (sources: string[]) => string[]
    validateReferences?: (
      indexes: number[],
      referenceIds?: string[]
    ) => ReferenceIdentity[]
  } = {}
) => {
  const facts = createDesignFacts(options.resolveSources)
  const references = createReferenceDecisions()
  let factBindings = new Map<string, FactBinding>()
  const recordFacts = (value: Record<string, unknown>, criteria: string[]) => {
    const nextBindings = new Map(factBindings)
    const affectedCriteria = new Set<string>()
    let changedKnownFact = false
    let unknownImpact = false
    const additions = value.factBindings ?? []
    if (!Array.isArray(additions) || additions.length > 24)
      throw new Error('Invalid factBindings.')
    const keys = new Set<string>()
    for (const item of additions) {
      if (
        !record(item) ||
        !text(item.factId) ||
        !text(item.criterionId) ||
        !criteria.includes(item.criterionId) ||
        !strings(item.elementIds) ||
        !item.elementIds.length ||
        new Set(item.elementIds).size !== item.elementIds.length ||
        Object.keys(item).some(
          (key) => !['factId', 'criterionId', 'elementIds'].includes(key)
        )
      )
        throw new Error(
          'Fact bindings require a planned criterion and unique canonical element IDs.'
        )
      const key = JSON.stringify([item.factId, item.criterionId])
      if (keys.has(key)) throw new Error('Duplicate fact binding.')
      keys.add(key)
      if (!isDeepStrictEqual(factBindings.get(key), item))
        affectedCriteria.add(item.criterionId)
      nextBindings.set(key, {
        factId: item.factId,
        criterionId: item.criterionId,
        elementIds: [...item.elementIds]
      })
    }
    const result = facts.record(
      {
        phase: 'facts',
        ...(value.facts !== undefined ? { facts: value.facts } : {}),
        ...(value.sourceCorrections !== undefined
          ? { sourceCorrections: value.sourceCorrections }
          : {}),
        ...(value.dependencyChanges !== undefined
          ? { dependencyChanges: value.dependencyChanges }
          : {})
      },
      (retained, changes) => {
        const changed = new Set(changes.changedIds)
        changedKnownFact = changes.changedExistingIds.length > 0
        unknownImpact = changes.changedExistingIds.some(
          (id) =>
            ![...nextBindings.values()].some((binding) => binding.factId === id)
        )
        for (const binding of nextBindings.values()) {
          if (changed.has(binding.factId))
            affectedCriteria.add(binding.criterionId)
        }
        const ids = new Set(retained.map((fact) => fact.id))
        for (const binding of nextBindings.values()) {
          if (
            !ids.has(binding.factId) ||
            !criteria.includes(binding.criterionId)
          )
            throw new Error(
              'Fact binding refers to an unknown fact or criterion.'
            )
        }
      }
    )
    factBindings = nextBindings
    return {
      result: {
        ...result,
        factBindings: structuredClone([...factBindings.values()])
      },
      affectedCriterionIds: [...affectedCriteria],
      changedKnownFact,
      unknownImpact
    }
  }
  let revision = 0
  let plan:
    | {
        criteria: Record<
          string,
          {
            requirement: string
            description: string
            verification: 'visual' | 'data'
          }
        >
        structureCriteria: string[]
        detailRequired: boolean
        referenceImageIndexes?: number[]
      }
    | undefined
  let previousChecks: {
    criterionId: string
    status: string
    evidence: string
  }[] = []
  let deferredDetails = new Map<
    string,
    { id: string; description: string; reason: string }
  >()
  let structureAccepted = false
  let accepted = false
  let acceptedIds: string[] = []
  let pendingCriteria: Set<string> | undefined
  let acceptedDeferredChecks: unknown[] = []
  let issue = 'The drawing has not been checked against the requested result.'
  let unresolvedOverall: { phase: string; evidence: string } | undefined
  const unresolvedCriteria = new Map<
    string,
    { phase: string; evidence: string }
  >()
  const inspections = new Map<
    string,
    {
      target: string
      scope: string
      overview: boolean
      detail: boolean
      source?: InspectionEvidenceStamp
      region?: Record<string, unknown>
    }
  >()
  const factSnapshots = () =>
    facts.snapshot().map((fact) => {
      const criterionIds = [
        ...new Set(
          [...factBindings.values()]
            .filter((binding) => binding.factId === fact.id)
            .map((binding) => binding.criterionId)
        )
      ]
      const imageSources = fact.sources.filter((source) =>
        source.startsWith('reference:')
      )
      const inapplicable = imageSources.filter(
        (source) =>
          !criterionIds.length ||
          criterionIds.some((id) => !references.applicable(source, id))
      )
      let assessmentStatus: 'unverified' | 'model-assessed' | 'asserted' =
        'asserted'
      if (imageSources.length) assessmentStatus = 'model-assessed'
      if (inapplicable.length) assessmentStatus = 'unverified'
      return {
        ...fact,
        freshness:
          fact.status === 'valid' ? ('current' as const) : ('stale' as const),
        evidence: {
          kind: 'source-assertion' as const,
          author: 'model' as const,
          status: assessmentStatus,
          inapplicableSources: inapplicable,
          assertedSources: fact.sources.filter(
            (source) => !source.startsWith('reference:')
          ),
          referenceIds: imageSources
        }
      }
    })
  const referenceIssues = () => {
    const decisions = references.snapshot()
    const pending = (plan?.referenceImageIndexes ?? []).filter((index) => {
      const decision = decisions.find((item) => item.attachmentIndex === index)
      return (
        !decision ||
        decision.status === 'pending' ||
        decision.freshness !== 'current'
      )
    })
    const unsupported = factSnapshots().filter(
      (fact) =>
        fact.evidence.status === 'unverified' &&
        [...factBindings.values()].some((binding) => binding.factId === fact.id)
    )
    return [
      ...(pending.length
        ? [
            `Reference applicability is pending for attachment indexes ${pending.join(', ')}; record current decisions with select_design_references.`
          ]
        : []),
      ...(unsupported.length
        ? [
            `Source support is unverified for bound facts ${unsupported.map((fact) => fact.id).join(', ')}; assess every cited image for its criterion or correct source attribution.`
          ]
        : [])
    ]
  }
  const reviewHandoff = (affectedCriterionIds: string[]) => {
    const invalidatedFactIds = facts
      .snapshot()
      .filter((fact) => fact.status === 'invalidated')
      .map((fact) => fact.id)
    const sourceIssues = referenceIssues()
    const nextReview = {
      tool: AiDesignToolIds.REVIEW_DRAWING,
      phase: 'visual',
      final: true,
      requiredInputs: ['inspectionIds', 'checks'],
      instruction:
        'Submit current evidence and checks for requiredCriterionIds. Reuse unchanged inspection IDs only if canonical evidence validation still accepts them.'
    }
    const nextReferences = {
      tool: AiDesignToolIds.SELECT_DESIGN_REFERENCES,
      requiredInputs: [
        'referenceImageIndexes',
        'requirementRevision',
        'referenceDecisions'
      ],
      instruction:
        'Resolve current source applicability for the reported references and bound facts. Retain source limitations; use sourceCorrections only for incorrect attribution.'
    }
    const nextFacts = {
      tool: AiDesignToolIds.RECORD_DESIGN_FACTS,
      requiredInputs: ['facts'],
      instruction:
        'Reverify the invalidated facts with current source evidence. The fact receipt will identify the review required after verification.'
    }
    let next: typeof nextReferences | typeof nextReview | typeof nextFacts =
      nextReview
    if (sourceIssues.length) next = nextReferences
    if (invalidatedFactIds.length) next = nextFacts
    return {
      accepted,
      requiresFreshReview: !accepted,
      affectedCriterionIds,
      referenceIssues: sourceIssues,
      requirementRevision: references.revision(),
      requiredCriterionIds: accepted
        ? []
        : [...(pendingCriteria ?? Object.keys(plan?.criteria ?? {}))],
      ...(!accepted
        ? {
            next: {
              ...next,
              inspectionIds: [...acceptedIds],
              invalidatedFactIds
            }
          }
        : {})
    }
  }

  return {
    selectReferences(
      indexes: unknown,
      decisions: unknown = {}
    ): Record<string, unknown> {
      const selected = validateReferenceIndexes(indexes)
      if (!plan)
        throw new Error(
          'Define design criteria before selecting comparison references.'
        )
      const previousDecisions = references.snapshot()
      const update = references.update(
        (ids) => options.validateReferences?.(selected, ids) ?? [],
        decisions
      )
      const retainedFacts = facts.snapshot()
      const selectionChanged = !isDeepStrictEqual(
        plan.referenceImageIndexes,
        selected
      )
      const changed = selectionChanged || update.changedIds.length > 0
      const affected = selectionChanged
        ? Object.keys(plan.criteria)
        : [
            ...new Set([
              ...[...previousDecisions, ...references.snapshot()]
                .filter(
                  (decision) =>
                    update.changedIds.includes(decision.referenceId) &&
                    selected.includes(decision.attachmentIndex)
                )
                .flatMap((decision) => decision.criterionIds),
              ...[...factBindings.values()]
                .filter((binding) =>
                  retainedFacts.some(
                    (fact) =>
                      fact.id === binding.factId &&
                      fact.sources.some((source) =>
                        update.changedIds.includes(source)
                      )
                  )
                )
                .map((binding) => binding.criterionId)
            ])
          ]
      if (selectionChanged || affected.length) {
        plan.referenceImageIndexes = selected
        pendingCriteria = selectionChanged
          ? undefined
          : new Set([
              ...(pendingCriteria ??
                (accepted ? [] : Object.keys(plan.criteria))),
              ...affected
            ])
        acceptedDeferredChecks = []
        accepted = false
        if (selectionChanged) acceptedIds = []
        if (affected.some((id) => plan?.structureCriteria.includes(id)))
          structureAccepted = false
        issue =
          'Reference selection changed; compare the current drawing again.'
      }
      return {
        referenceImageIndexes: [...selected],
        changed,
        requirementRevision: references.revision(),
        referenceDecisions: references.snapshot(),
        review: reviewHandoff(changed ? affected : [])
      }
    },
    recordCalculations: facts.recordCalculations,
    correctionContext(
      inspectionIds: string[] = [],
      checks: {
        criterionId: string
        status: string
        evidence: string
      }[] = previousChecks
    ) {
      const criterionIds = new Set([
        ...unresolvedCriteria.keys(),
        ...checks
          .filter((check) => check.status !== 'pass')
          .map((check) => check.criterionId)
      ])
      return {
        diagnosticOnly: true,
        referenceDecisions: references.snapshot(),
        requiresFreshReview: !accepted,
        revision,
        ...(unresolvedOverall ? { overall: { ...unresolvedOverall } } : {}),
        criteria: [...criterionIds].map((criterionId) => ({
          criterionId,
          evidence: [
            ...new Set(
              [
                unresolvedCriteria.get(criterionId)?.evidence,
                ...checks
                  .filter(
                    (check) =>
                      check.criterionId === criterionId &&
                      check.status !== 'pass'
                  )
                  .map((check) => check.evidence)
              ].filter((value): value is string => !!value)
            )
          ],
          elementIds: [
            ...new Set(
              [...factBindings.values()]
                .filter((binding) => binding.criterionId === criterionId)
                .flatMap((binding) => binding.elementIds)
            )
          ]
        })),
        inspections: inspectionIds.flatMap((inspectionId) => {
          const entry = inspections.get(inspectionId)
          return entry
            ? [
                {
                  inspectionId,
                  elementId: entry.target,
                  ...(entry.region
                    ? {
                        region: structuredClone(entry.region),
                        coordinateSpace: 'element-local'
                      }
                    : {}),
                  overview: entry.overview,
                  detail: entry.detail
                }
              ]
            : []
        })
      }
    },
    comparisonContext(
      phase: string,
      fullReview = false
    ): VisualAssessmentContext {
      if (!plan) throw new Error('Record the review plan first.')
      const criteria = plan.criteria
      const ids =
        phase === 'structure'
          ? plan.structureCriteria
          : [
              ...(!fullReview && pendingCriteria
                ? pendingCriteria
                : Object.keys(plan.criteria))
            ]
      const retainedFacts = factSnapshots().filter((fact) =>
        [...factBindings.values()].some(
          (binding) =>
            binding.factId === fact.id && ids.includes(binding.criterionId)
        )
      )
      const cited = new Set(retainedFacts.flatMap((fact) => fact.sources))
      const decisions = references
        .snapshot()
        .filter(
          (decision) =>
            (plan?.referenceImageIndexes ?? []).includes(
              decision.attachmentIndex
            ) || cited.has(decision.referenceId)
        )
      return {
        criteria: Object.fromEntries(
          ids
            .filter((id) => criteria[id].verification === 'visual')
            .map((id) => [id, { requirement: criteria[id].requirement }])
        ),
        referenceImageIndexes: (plan.referenceImageIndexes ?? []).filter(
          (index) =>
            decisions.some(
              (decision) =>
                decision.attachmentIndex === index &&
                ids.some((id) =>
                  references.applicable(decision.referenceId, id)
                )
            )
        ),
        requirementRevision: references.revision(),
        referenceDecisions: decisions,
        unverifiedSourceFacts: retainedFacts.filter(
          (fact) => fact.evidence.status === 'unverified'
        ),
        sourceFacts: retainedFacts.flatMap((fact) => {
          if (fact.status !== 'valid' || fact.evidence.status === 'unverified')
            return []
          const criterionIds = [
            ...new Set(
              [...factBindings.values()]
                .filter(
                  (binding) =>
                    binding.factId === fact.id &&
                    ids.includes(binding.criterionId) &&
                    criteria[binding.criterionId].verification === 'visual'
                )
                .map((binding) => binding.criterionId)
            )
          ]
          if (!criterionIds.length) return []
          return [
            {
              id: fact.id,
              criterionIds,
              statement: fact.statement,
              scope: fact.scope,
              sources: fact.sources,
              verification: fact.verification,
              freshness: fact.freshness,
              evidence: fact.evidence
            }
          ]
        }),
        ...(unresolvedOverall || unresolvedCriteria.size
          ? {
              previousFindings: {
                ...(unresolvedOverall &&
                (phase === 'visual' || unresolvedOverall.phase === 'structure')
                  ? { overall: { ...unresolvedOverall } }
                  : {}),
                criteria: Object.fromEntries(
                  [...unresolvedCriteria].filter(([id]) => ids.includes(id))
                )
              }
            }
          : {})
      }
    },
    comparisonIsCurrent(
      context: VisualAssessmentContext,
      phase: string,
      fullReview = false
    ): boolean {
      return isDeepStrictEqual(
        context,
        this.comparisonContext(phase, fullReview)
      )
    },
    retainAssessment(
      phase: string,
      value: VisualAssessment,
      current: boolean,
      fullReview = false
    ): VisualAssessment {
      const result = validateVisualAssessment(
        value,
        this.comparisonContext(phase, fullReview).criteria
      )
      if (result.overall.status !== 'pass')
        unresolvedOverall = { phase, evidence: result.overall.evidence }
      else if (
        current &&
        (phase === 'visual' || unresolvedOverall?.phase === phase)
      )
        unresolvedOverall = undefined
      for (const check of result.checks) {
        if (check.status !== 'pass')
          unresolvedCriteria.set(check.criterionId, {
            phase,
            evidence: check.evidence
          })
        else if (current) unresolvedCriteria.delete(check.criterionId)
      }
      return result
    },
    factTargets: () => [
      ...new Set(
        [...factBindings.values()].flatMap((binding) => binding.elementIds)
      )
    ],
    mutate(): void {
      pendingCriteria = undefined
      acceptedDeferredChecks = []
      revision++
      accepted = false
      inspections.clear()
      acceptedIds = []
      issue =
        'The latest changes have not yet been checked against the requested result.'
    },
    inspect(
      elementId: string,
      available: boolean,
      overview: boolean,
      region?: unknown,
      detail = !overview,
      source?: InspectionEvidenceStamp
    ): { inspectionId: string; revision: number } | undefined {
      if (!available) return undefined
      const scope = record(region)
        ? JSON.stringify([region.x, region.y, region.width, region.height])
        : 'whole'
      const scopedView = `${detail ? 'detail' : 'overview'}:${scope}`
      // Repeated captures are fresh images of the same revision and scope.
      // Their receipt stays valid; only a mutation retires prior evidence.
      for (const [inspectionId, evidence] of inspections) {
        if (
          evidence.target === elementId &&
          evidence.scope === scopedView &&
          evidence.source?.sessionId === source?.sessionId &&
          evidence.source?.revision === source?.revision
        ) {
          evidence.overview ||= overview && !region
          return { inspectionId, revision }
        }
      }
      const inspectionId = randomUUID()
      inspections.set(inspectionId, {
        target: elementId,
        scope: scopedView,
        overview: overview && !region,
        detail,
        source,
        ...(record(region) ? { region: structuredClone(region) } : {})
      })
      return { inspectionId, revision }
    },
    evidenceFor(
      ids: unknown = acceptedIds
    ): InspectionEvidenceStamp | undefined {
      if (!Array.isArray(ids) || !ids.length) return undefined
      const sources = ids.map((id) =>
        typeof id === 'string' ? inspections.get(id)?.source : undefined
      )
      const first = sources[0]
      if (
        !first ||
        sources.some(
          (source) =>
            !source ||
            source.sessionId !== first.sessionId ||
            source.revision !== first.revision
        )
      )
        return undefined
      return first
    },
    overviewTargets(ids: unknown = acceptedIds): string[] {
      if (!Array.isArray(ids)) return []
      return [
        ...new Set(
          ids.flatMap((id) => {
            const inspection =
              typeof id === 'string' ? inspections.get(id) : undefined
            return inspection?.overview ? [inspection.target] : []
          })
        )
      ]
    },
    isAccepted: () => accepted,
    invalidateAssessment(message: string): void {
      pendingCriteria = undefined
      acceptedDeferredChecks = []
      accepted = false
      acceptedIds = []
      issue = message
    },
    validateReview(value: unknown): void {
      if (
        !record(value) ||
        !['structure', 'visual'].includes(String(value.phase))
      )
        throw new Error(
          'Only structure and visual review candidates can be validated.'
        )
      this.record(value, undefined, { validateOnly: true })
    },
    record(
      value: unknown,
      independent?: VisualAssessment,
      recordOptions: { validateOnly?: boolean } = {}
    ): Record<string, unknown> {
      if (!record(value)) throw new Error('Review arguments must be an object.')
      if (value.referenceImageIndexes !== undefined) {
        if (value.phase !== 'plan')
          throw new Error(
            'Use select_design_references to change comparison references.'
          )
        const selected = validateReferenceIndexes(value.referenceImageIndexes)
        options.validateReferences?.(selected)
      }
      if (value.phase === 'facts') {
        const update = recordFacts(value, Object.keys(plan?.criteria ?? {}))
        if (update.changedKnownFact || update.affectedCriterionIds.length) {
          if (!update.unknownImpact && (accepted || pendingCriteria)) {
            const affected = pendingCriteria ?? new Set<string>()
            update.affectedCriterionIds.forEach((id) => affected.add(id))
            pendingCriteria = affected
          } else {
            pendingCriteria = undefined
            acceptedIds = []
          }
          accepted = false
          issue =
            'Source conditions changed; check the affected result before completion.'
        }
        return {
          ...update.result,
          facts: factSnapshots(),
          ...(update.changedKnownFact || update.affectedCriterionIds.length
            ? { review: reviewHandoff(update.affectedCriterionIds) }
            : {})
        }
      }
      if (
        value.phase !== 'plan' &&
        (value.facts !== undefined ||
          value.dependencyChanges !== undefined ||
          value.factBindings !== undefined)
      )
        throw new Error(
          'Record source facts and bindings with phase=plan or phase=facts.'
        )
      const additions = value.deferredDetails ?? []
      if (
        !Array.isArray(additions) ||
        additions.length > 24 ||
        !additions.every(
          (item) =>
            record(item) &&
            text(item.id) &&
            text(item.description) &&
            text(item.reason) &&
            Object.keys(item).every((key) =>
              ['id', 'description', 'reason'].includes(key)
            )
        ) ||
        new Set(additions.map((item) => item.id)).size !== additions.length
      )
        throw new Error(
          'Provide unique deferredDetails with id, description and reason; do not send geometry.'
        )
      if (value.deferredChecks !== undefined && value.phase !== 'visual')
        throw new Error('Deferred decisions require a current visual review.')
      const nextDeferred = new Map(deferredDetails)
      for (const item of additions)
        nextDeferred.set(item.id, {
          id: item.id,
          description: item.description,
          reason: item.reason
        })
      if (value.phase === 'plan') {
        if (revision > 0 && plan)
          throw new Error(
            'Established criteria cannot be rewritten after drawing; preserve the original user requirements.'
          )
        if (
          !text(value.method) ||
          !strings(value.references) ||
          !record(value.criteria) ||
          !Object.keys(value.criteria).length ||
          Object.keys(value.criteria).length > 24 ||
          Object.entries(value.criteria).some(
            ([id, criterion]) =>
              !text(id) ||
              !record(criterion) ||
              !text(criterion.requirement) ||
              !text(criterion.description) ||
              !['visual', 'data'].includes(String(criterion.verification)) ||
              Object.keys(criterion).some(
                (key) =>
                  !['requirement', 'description', 'verification'].includes(key)
              )
          ) ||
          typeof value.detailRequired !== 'boolean'
        )
          throw new Error(
            'Provide method, references, named request-linked criteria and detailRequired for the plan.'
          )
        const structureCriteria = value.structureCriteria ?? []
        if (
          !strings(structureCriteria) ||
          new Set(structureCriteria).size !== structureCriteria.length ||
          structureCriteria.some(
            (id) => !Object.hasOwn(value.criteria as object, id)
          )
        )
          throw new Error(
            'Structure criteria must be a unique subset of planned criteria.'
          )
        const recordedFacts = recordFacts(value, Object.keys(value.criteria))
        references.setRequirements(value.criteria)
        references.update(
          () =>
            options.validateReferences?.(
              (value.referenceImageIndexes ??
                plan?.referenceImageIndexes ??
                []) as number[]
            ) ?? [],
          {}
        )
        plan = {
          structureCriteria,
          criteria: structuredClone(value.criteria) as Record<
            string,
            {
              requirement: string
              description: string
              verification: 'visual' | 'data'
            }
          >,
          detailRequired: value.detailRequired,
          referenceImageIndexes:
            value.referenceImageIndexes !== undefined
              ? [...(value.referenceImageIndexes as number[])]
              : plan?.referenceImageIndexes
        }
        deferredDetails = nextDeferred
        return {
          phase: 'plan',
          recorded: true,
          requirementRevision: references.revision(),
          criterionIds: Object.keys(plan.criteria),
          facts: recordedFacts.result.facts.map(({ id, status }) => ({
            id,
            status
          })),
          deferredDetailIds: [...deferredDetails.keys()]
        }
      }
      if (
        !['visual', 'structure'].includes(String(value.phase)) ||
        !plan ||
        !strings(value.inspectionIds) ||
        !value.inspectionIds.length ||
        value.inspectionIds.some((id) => !inspections.has(id))
      )
        throw new Error(
          'Use current inspection IDs and an existing pre-mutation plan.'
        )
      const structure = value.phase === 'structure'
      if (
        value.final !== undefined &&
        (structure || typeof value.final !== 'boolean')
      )
        throw new Error('final is a visual-review boolean.')
      const final = !structure && value.final !== false
      if (structure && !plan.structureCriteria.length)
        throw new Error(
          'Declare structureCriteria in the plan before using structure review.'
        )
      const criteria = structure
        ? plan.structureCriteria
        : Object.keys(plan.criteria)
      const evidence = value.inspectionIds.map((id) => inspections.get(id))
      const hasOverview = evidence.some((entry) => entry?.overview)
      const hasDetail = evidence.some((entry) => entry?.detail)
      if (!hasOverview || (final && plan.detailRequired && !hasDetail))
        throw new Error(
          'Inspect the full drawing and, for detailed work, a separate detail element or region before reviewing.'
        )
      const recheck =
        final && additions.length === 0 ? pendingCriteria : undefined
      const requiredCriteria = recheck ? [...recheck] : criteria
      if (
        !Array.isArray(value.checks) ||
        !value.checks.length ||
        ((structure || final) &&
          (!requiredCriteria.every((id) =>
            (value.checks as unknown[]).some(
              (check) => record(check) && check.criterionId === id
            )
          ) ||
            (!recheck && value.checks.length !== criteria.length)))
      )
        throw new Error('Assess every planned criterion exactly once.')
      const suppliedIds = new Set(
        value.checks.map((check) =>
          record(check) ? check.criterionId : undefined
        )
      )
      const reviewChecks = [
        ...(recheck
          ? previousChecks.filter(
              (check) => !suppliedIds.has(check.criterionId)
            )
          : []),
        ...value.checks
      ]
      const checks = reviewChecks.map((check) => ({
        ...check,
        factIds: [
          ...new Set(
            [...factBindings.values()]
              .filter((binding) => binding.criterionId === check.criterionId)
              .map((binding) => binding.factId)
          )
        ]
      }))
      if (
        !checks.every(
          (check) =>
            record(check) &&
            criteria.includes(String(check.criterionId)) &&
            ['pass', 'fail', 'unverified'].includes(String(check.status)) &&
            text(check.evidence)
        ) ||
        new Set(checks.map((check) => check.criterionId)).size !== checks.length
      )
        throw new Error(
          'Each planned criterion needs one pass, fail or unverified status and concrete evidence from the declared verification source.'
        )
      const deferredChecks =
        value.deferredChecks ?? (recheck ? acceptedDeferredChecks : [])
      if (
        !Array.isArray(deferredChecks) ||
        !deferredChecks.every(
          (item) =>
            record(item) &&
            text(item.id) &&
            nextDeferred.has(item.id) &&
            ['omit', 'restored', 'pending'].includes(String(item.status)) &&
            text(item.evidence) &&
            Object.keys(item).every((key) =>
              ['id', 'status', 'evidence'].includes(key)
            )
        ) ||
        new Set(deferredChecks.map((item) => item.id)).size !==
          deferredChecks.length
      )
        throw new Error(
          'Assess known deferred IDs once with omit, restored or pending and current visual evidence.'
        )
      if (recordOptions.validateOnly) return { phase: value.phase, checks }
      const needsIndependent =
        options.independentAssessment &&
        (structure || final) &&
        Object.keys(
          this.comparisonContext(String(value.phase), additions.length > 0)
            .criteria
        ).length > 0
      const independentAssessment = independent
        ? this.retainAssessment(
            String(value.phase),
            independent,
            true,
            additions.length > 0
          )
        : undefined
      const independentlyAccepted =
        !needsIndependent ||
        (independentAssessment?.overall.status === 'pass' &&
          !!independentAssessment?.checks.every(
            (check) => check.status === 'pass'
          ))
      if (structure) {
        if (additions.length) {
          accepted = false
          issue = 'Deferred details require a current final visual review.'
        }
        deferredDetails = nextDeferred
        structureAccepted =
          independentlyAccepted &&
          checks.every((check) => check.status === 'pass')
        return {
          phase: 'structure',
          facts: factSnapshots(),
          deferredDetails: [...deferredDetails.values()],
          revision,
          accepted: false,
          readyForDetail: structureAccepted,
          independentAssessment,
          checks,
          inspectionIds: value.inspectionIds,
          correction: this.correctionContext(value.inspectionIds, checks)
        }
      }
      const resolved = new Set(
        deferredChecks
          .filter((item) => item.status !== 'pending')
          .map((item) => item.id)
      )
      const pendingDetails = [...nextDeferred.keys()].filter(
        (id) => !resolved.has(id)
      )
      deferredDetails = nextDeferred
      const regressions = checks
        .filter(
          (check) =>
            check.status !== 'pass' &&
            previousChecks.some(
              (old) =>
                old.criterionId === check.criterionId && old.status === 'pass'
            )
        )
        .map((check) => ({
          criterionId: check.criterionId,
          previousEvidence: previousChecks.find(
            (old) => old.criterionId === check.criterionId
          )?.evidence,
          currentEvidence: check.evidence
        }))
      previousChecks = [
        ...previousChecks.filter(
          (old) =>
            !checks.some((check) => check.criterionId === old.criterionId)
        ),
        ...checks.map((check) => ({
          criterionId: String(check.criterionId),
          status: String(check.status),
          evidence: String(check.evidence)
        }))
      ]
      accepted =
        final &&
        independentlyAccepted &&
        checks.every((check) => check.status === 'pass') &&
        pendingDetails.length === 0 &&
        !facts.hasInvalidated() &&
        referenceIssues().length === 0
      acceptedIds = accepted ? [...value.inspectionIds] : []
      if (accepted) {
        pendingCriteria = undefined
        acceptedDeferredChecks = structuredClone(deferredChecks)
      }
      const unmet = checks
        .filter((check) => check.status !== 'pass')
        .map((check) => `${check.criterionId}: ${check.evidence}`)
      unmet.push(...referenceIssues())
      if (!independentlyAccepted)
        unmet.push(
          ...(independentAssessment?.overall.status !== 'pass' &&
          independentAssessment?.overall
            ? [independentAssessment.overall.evidence]
            : []),
          ...(independentAssessment?.checks
            .filter((check) => check.status !== 'pass')
            .map((check) => `${check.criterionId}: ${check.evidence}`) ?? [
            'Independent visual assessment is not available.'
          ])
        )
      if (!final)
        unmet.push(
          'A final assessment of all requested criteria is still required.'
        )
      unmet.push(
        ...pendingDetails.map(
          (id) => `Deferred detail ${id} needs a current omit/restored decision`
        )
      )
      issue = unmet.length
        ? `The drawing still needs adjustment: ${unmet
            .slice(0, 3)
            .map((item) => item.slice(0, 240))
            .join(
              '; '
            )}${unmet.length > 3 ? '; additional criteria remain unmet.' : ''}`
        : issue
      return {
        phase: 'visual',
        final,
        facts: factSnapshots(),
        deferredDetails: [...deferredDetails.values()],
        deferredChecks,
        pendingDetails,
        regressions,
        revision,
        accepted,
        independentAssessment,
        checks,
        inspectionIds: value.inspectionIds,
        correction: this.correctionContext(value.inspectionIds, checks)
      }
    },
    getStructureIssue(): string | undefined {
      if (plan?.structureCriteria.length && !structureAccepted)
        return 'Whole-structure review remains pending. Review ready retained parts with phase=visual, final=false and continue coherent batches. Check all structureCriteria at a whole-structure checkpoint; do not remove or weaken final criteria.'
    },
    getIssue(): string | undefined {
      if (referenceIssues().length) return referenceIssues().join(' ')
      if (facts.hasInvalidated())
        return 'A changed source fact remains unverified; reverify its dependencies before completion.'
      if (revision === 0 || accepted) return undefined
      return plan
        ? [
            issue,
            unresolvedOverall?.evidence,
            ...[...unresolvedCriteria.values()].map(({ evidence }) => evidence)
          ]
            .filter(Boolean)
            .join(' ')
        : 'The drawing was created, but its requested quality was not verified against the original request and its review criteria.'
    }
  }
}
