import {
  validateVisualAssessment,
  type VisualAssessment,
  type VisualAssessmentContext
} from './local-visual-assessment'
import { createDesignFacts, designFactsSchema } from './local-design-facts'
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
    items: { type: 'string' }
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
    referenceImageIndexes: referenceImageIndexesSchema,
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
  required: ['phase', 'inspectionIds', 'checks'],
  properties: {
    phase: { type: 'string', const: 'structure' },
    inspectionIds: designReviewProperties.inspectionIds,
    checks: designReviewProperties.checks,
    deferredDetails: designReviewProperties.deferredDetails
  }
}
const reviewVisualSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['phase', 'inspectionIds', 'checks'],
  properties: {
    phase: { type: 'string', const: 'visual' },
    inspectionIds: designReviewProperties.inspectionIds,
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

export const designReviewDefinition = {
  type: 'function',
  name: AiDesignToolIds.RECORD_DESIGN_REVIEW,
  description:
    reviewPlanGuidance +
    '\n' +
    'Before semantic review, save phase=plan with method, references, criteria and detailRequired derived from the original request. The first ready part may be drawn before this record; recording criteria is not visual approval. To add or retrieve source facts or update bindings, use phase=facts; unchanged facts need no re-research. Bind facts to stable criterion IDs and known elementIds. Checks contain criterionId, status and evidence; the review owner attaches already-bound factIds automatically. For an optional whole-structure checkpoint, use phase=structure with a current overview to check structureCriteria. This does not gate preparation or drawing of ready parts. For an intermediate visual check, use phase=visual and final=false with a nonempty criterion subset. For completion, use phase=visual with final=true (the default), all criterion IDs, a current overview and required native detail. To defer a detail, supply deferredDetails entries with id, description and reason (why it is deferred). Resolve retained deferredDetails through deferredChecks: each item needs id, status (omit/restored/pending) and evidence. Mutations expire image evidence and approval, not source facts. Repair failed criteria with targeted edits. Select suitable referenceImageIndexes in the plan for independent comparison, or update them with phase=facts when research finds a better reference; imported but unselected references are not used. Declare each criterion verification as visual or data. Independent assessment receives only visual criteria; provide numeric/canonical evidence for data criteria in ordinary checks. Omitting referenceImageIndexes on plan resubmission preserves selection; [] clears it. Structure and final reviews compare the request, selected references and current drawing in a fresh read-only assessment. Its failed or unverified required findings block approval; correct the described discrepancy and inspect again. Optional suggestions are retained separately and do not require another revision or assessment. The original request governs quality, not extra demands introduced by plan criteria or references. This records evidence-backed model judgment, not automatic visual certification. Fact input examples below use placeholder source/criterion/element identities; substitute real evidence and known IDs. A dependency uses key/version; each binding uses singular factId, never factIds.\n' +
    factUsage,
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['phase'],
    // Native discovery can project an alternative; each contains its own field contract.
    oneOf: reviewPhaseSchemas,
    properties: reviewInputProperties
  }
}

/** Evidence lifetime is one local invocation and one mutation revision. */
export const createLocalDesignReview = (
  options: { independentAssessment?: boolean } = {}
) => {
  const facts = createDesignFacts()
  let factBindings = new Map<string, FactBinding>()
  const recordFacts = (value: Record<string, unknown>, criteria: string[]) => {
    const nextBindings = new Map(factBindings)
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
        ...(value.dependencyChanges !== undefined
          ? { dependencyChanges: value.dependencyChanges }
          : {})
      },
      (retained) => {
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
      ...result,
      factBindings: structuredClone([...factBindings.values()])
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
    }
  >()
  return {
    comparisonContext(phase: string): VisualAssessmentContext {
      if (!plan) throw new Error('Record the review plan first.')
      const criteria = plan.criteria
      const ids =
        phase === 'structure'
          ? plan.structureCriteria
          : Object.keys(plan.criteria)
      return {
        criteria: Object.fromEntries(
          ids
            .filter((id) => criteria[id].verification === 'visual')
            .map((id) => [id, { requirement: criteria[id].requirement }])
        ),
        referenceImageIndexes: plan.referenceImageIndexes,
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
    retainAssessment(
      phase: string,
      value: VisualAssessment,
      current: boolean
    ): VisualAssessment {
      const result = validateVisualAssessment(
        value,
        this.comparisonContext(phase).criteria
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
        source
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
      if (
        value.referenceImageIndexes !== undefined &&
        (!Array.isArray(value.referenceImageIndexes) ||
          value.referenceImageIndexes.some(
            (index) => !Number.isSafeInteger(index) || index < 0
          ) ||
          new Set(value.referenceImageIndexes).size !==
            value.referenceImageIndexes.length)
      )
        throw new Error(
          'Reference image indexes must be unique nonnegative integers.'
        )
      if (value.phase === 'facts') {
        const result = recordFacts(value, Object.keys(plan?.criteria ?? {}))
        if (
          (Array.isArray(value.dependencyChanges) &&
            value.dependencyChanges.length) ||
          (Array.isArray(value.facts) && value.facts.length) ||
          (Array.isArray(value.factBindings) && value.factBindings.length)
        ) {
          accepted = false
          acceptedIds = []
          issue =
            'Source conditions changed; check the affected result before completion.'
        }
        if (plan && value.referenceImageIndexes !== undefined) {
          plan.referenceImageIndexes = [
            ...(value.referenceImageIndexes as number[])
          ]
          accepted = false
          acceptedIds = []
          structureAccepted = false
          issue =
            'Reference selection changed; compare the current drawing again.'
        }
        return result
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
          criterionIds: Object.keys(plan.criteria),
          facts: recordedFacts.facts.map(({ id, status }) => ({ id, status })),
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
      if (
        !Array.isArray(value.checks) ||
        !value.checks.length ||
        ((structure || final) && value.checks.length !== criteria.length)
      )
        throw new Error('Assess every planned criterion exactly once.')
      const checks = value.checks.map((check) => ({
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
      const deferredChecks = value.deferredChecks ?? []
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
        Object.keys(this.comparisonContext(String(value.phase)).criteria)
          .length > 0
      const independentAssessment = independent
        ? this.retainAssessment(String(value.phase), independent, true)
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
          facts: facts.snapshot(),
          deferredDetails: [...deferredDetails.values()],
          revision,
          accepted: false,
          readyForDetail: structureAccepted,
          independentAssessment,
          checks,
          inspectionIds: value.inspectionIds
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
        !facts.hasInvalidated()
      acceptedIds = accepted ? [...value.inspectionIds] : []
      const unmet = checks
        .filter((check) => check.status !== 'pass')
        .map((check) => `${check.criterionId}: ${check.evidence}`)
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
        facts: facts.snapshot(),
        deferredDetails: [...deferredDetails.values()],
        deferredChecks,
        pendingDetails,
        regressions,
        revision,
        accepted,
        independentAssessment,
        checks,
        inspectionIds: value.inspectionIds
      }
    },
    getStructureIssue(): string | undefined {
      if (plan?.structureCriteria.length && !structureAccepted)
        return 'Whole-structure review remains pending. Review ready retained parts with phase=visual, final=false and continue coherent batches. Check all structureCriteria at a whole-structure checkpoint; do not remove or weaken final criteria.'
    },
    getIssue(): string | undefined {
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
