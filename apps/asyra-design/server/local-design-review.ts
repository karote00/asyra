import {
  createDesignCheckResults,
  type DesignCheckResult
} from './design-check-results'
import {
  toolResultBoolean,
  toolResultString,
  toolResultCount,
  toolResultIds,
  toolResultObject,
  toolSemantics
} from '../src/ai/tool-contract'
import { inspectionInputSchema } from '../src/ai/inspection-schema'
import {
  createReferenceDecisions,
  referenceDecisionProperties,
  type ReferenceIdentity
} from './local-reference-decisions'
import { isDeepStrictEqual } from 'node:util'
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

interface DesignCriterion {
  requirement: string
  description: string
  verification: 'visual' | 'data'
  requiredUnits?: string[]
}

interface FactBinding {
  factId: string
  criterionId: string
  elementIds: string[]
}
const wholeViewCoverageDependency = 'coverage:whole-view'

const visualCheckIdentity = (check: {
  criterionId: string
  unitId?: string
}) =>
  check.unitId === undefined
    ? `visual:${check.criterionId}`
    : `visual-unit:${JSON.stringify([check.criterionId, check.unitId])}`
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
        verification: { type: 'string', enum: ['visual', 'data'] },
        requiredUnits: {
          type: 'array',
          minItems: 1,
          maxItems: 24,
          uniqueItems: true,
          items: { type: 'string', minLength: 1, maxLength: 256 },
          description:
            'Fixed regional or cross-region judgments for a visual criterion. Keep a separate whole-view visual criterion. Omission cannot remove a required unit. Not supported for data or structure criteria.'
        }
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
        unitId: {
          type: 'string',
          minLength: 1,
          maxLength: 256,
          description:
            'Stable regional check identity within the criterion. Retain its original image target/crop scope; new evidence scope requires explicit supersession; same-scope recaptures preserve it; omit for the whole-criterion judgment. Other units remain independent.'
        },
        supersedes: {
          type: 'object',
          additionalProperties: false,
          required: ['revision', 'reason'],
          properties: {
            revision: { type: 'integer', minimum: 1 },
            reason: { type: 'string', minLength: 1, maxLength: 1000 }
          },
          description:
            'For an explicit unit redesign, name its current result revision and explain how the replacement addresses the same obligation. A new scope without this declaration is rejected.'
        },
        inspectionIds: {
          type: 'array',
          minItems: 1,
          uniqueItems: true,
          items: { type: 'string', minLength: 1 },
          description:
            'Delivered inspection IDs used for this criterion; defaults to all IDs in this review. Include every image needed for cross-region judgments.'
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
const reviewPlanRequiredInputs = reviewPlanSchema.required.filter(
  (field) => field !== 'phase'
)
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
  `Criteria are keyed by stable IDs. Plan fields: ${reviewPlanSchema.required.join(', ')}. Each criterion requires ${reviewPlanSchema.properties.criteria.additionalProperties.required.join(', ')}. verification is visual for appearance or data for canonical/numeric checks; split mixed requirements. Visual criteria can declare requiredUnits (unique stable unit IDs, at most 24). Keep a separate unpartitioned visual whole-view criterion. Do not partition data or structure criteria. Once judged or changed, declared obligations cannot shrink; identical replay preserves results. ` +
  `Plan input example: ${JSON.stringify(reviewPlanExample)}\nAdapt its criterion to the actual request; this example is syntax, not an extra requirement.`

const reviewStructureSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['phase'],
  anyOf: [
    { required: ['inspectionIds', 'checks'] },
    { required: ['inspections'] }
  ],
  properties: {
    phase: { type: 'string', const: 'structure' },
    inspectionIds: designReviewProperties.inspectionIds,
    inspections: designReviewProperties.inspections,
    checks: designReviewProperties.checks,
    deferredDetails: designReviewProperties.deferredDetails
  }
}
export const reviewVisualSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['phase'],
  anyOf: [
    { required: ['inspectionIds', 'checks'] },
    { required: ['inspections'] }
  ],
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
    ...toolSemantics(
      toolResultObject({
        phase: { const: 'plan' },
        recorded: { const: true },
        criterionIds: toolResultIds
      }),
      'prepare',
      ['request-artifacts']
    ),
    revision: 3,
    name: AiDesignToolIds.DEFINE_DESIGN_CRITERIA,
    description:
      'Define request-linked criteria before review, after the first ready drawing if appropriate. Store requirements; this does not inspect or approve the drawing. phase is fixed by this tool and may be omitted. ' +
      reviewPlanGuidance,
    inputSchema: optionalPhaseSchema(reviewPlanSchema)
  },
  {
    type: 'function',
    ...toolSemantics(
      toolResultObject({ phase: { const: 'facts' }, facts: { type: 'array' } }),
      'prepare',
      ['request-artifacts']
    ),
    name: AiDesignToolIds.RECORD_DESIGN_FACTS,
    description:
      'Record or retrieve verified source facts and their criterion/element bindings. A source fact requires id, statement, scope, sources, verification and dependencies:[{key,version}]. Preserve unchanged facts. Use dependencyChanges only for actual changed sources or contrary evidence, never to fix an arithmetic transcription. Use sourceCorrections:[{factId,sources,verification,reason}] to correct only a citation without changing its statement or dependency versions. Use retained referenceId or an existing attachment:N for image sources; source URLs remain attributed assertions. Use record_design_calculations for derived numbers. Bind with factId, criterionId and known elementIds. Omit all fields to retrieve existing facts. A changed source returns the pending review scope; recording facts is not approval. Examples use placeholder identities; substitute real evidence and known IDs.\n' +
      factUsage,
    inputSchema: sourceEvidenceSchema
  },
  {
    type: 'function',
    ...toolSemantics(
      toolResultObject({ calculations: { type: 'array' } }),
      'prepare',
      ['request-artifacts']
    ),
    name: AiDesignToolIds.RECORD_DESIGN_CALCULATIONS,
    description:
      'Store or retrieve derived numeric notes using existing valid sourceFactIds. Dependencies come from those facts; do not repeat source versions. Corrections replace the note with new evidence and full precision, not source facts or canvas geometry. These notes never certify the drawing. Omit calculations to retrieve notes and their current validity. Do not redraw for negligible numerical narration unless the user requires that precision.',
    inputSchema: designCalculationsSchema
  },
  {
    type: 'function',
    ...toolSemantics(
      toolResultObject({
        referenceImageIndexes: { type: 'array', items: toolResultCount },
        referenceDecisions: { type: 'array' }
      }),
      'prepare',
      ['request-artifacts']
    ),
    name: AiDesignToolIds.SELECT_DESIGN_REFERENCES,
    description:
      'Select imported reference attachment indexes for primary-agent visual comparison. Identical selection preserves approval; changed selection requires a new comparison. An empty selection clears it. Download success does not establish suitability. Record referenceDecisions with the current requirementRevision in this call; select candidates by index and assess their immutable referenceId against exact criterionIds. Rejected and undecided images are retained but excluded from comparison.',
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
    ...toolSemantics(
      toolResultObject(
        {
          phase: { enum: ['structure', 'visual'] },
          accepted: toolResultBoolean,
          inspectionIds: toolResultIds,
          next: {
            oneOf: [
              toolResultObject({
                tool: { const: AiDesignToolIds.REVIEW_DRAWING },
                arguments: toolResultObject(
                  {
                    phase: { enum: ['structure', 'visual'] },
                    final: { const: false },
                    inspectionIds: { ...toolResultIds, minItems: 1 }
                  },
                  ['phase', 'inspectionIds']
                ),
                requiredInputs: {
                  type: 'array',
                  items: { const: 'checks' },
                  minItems: 1,
                  maxItems: 1
                },
                instruction: toolResultString
              }),
              toolResultObject({
                tool: { const: AiDesignToolIds.DEFINE_DESIGN_CRITERIA },
                arguments: toolResultObject({ phase: { const: 'plan' } }),
                requiredInputs: {
                  type: 'array',
                  items: { enum: reviewPlanRequiredInputs },
                  minItems: reviewPlanRequiredInputs.length,
                  maxItems: reviewPlanRequiredInputs.length,
                  uniqueItems: true
                },
                instruction: toolResultString
              })
            ]
          },
          coverage: toolResultObject({
            required: { type: 'integer', minimum: 0 },
            passed: { type: 'integer', minimum: 0 },
            pending: {
              type: 'array',
              items: toolResultObject(
                {
                  id: toolResultString,
                  criterionId: toolResultString,
                  unitId: toolResultString,
                  status: { enum: ['missing', 'unverified', 'stale', 'fail'] },
                  reason: toolResultString
                },
                ['id', 'criterionId', 'status']
              )
            }
          })
        },
        ['phase', 'accepted', 'inspectionIds']
      ),
      'prepare',
      ['request-artifacts']
    ),
    revision: 4,
    name: AiDesignToolIds.REVIEW_DRAWING,
    description:
      'Review the current drawing against retained criteria and selected references. phase=structure checks the optional structural subset; phase=visual records valid supplied judgments across calls. final=true (default) additionally attempts completion from all retained current passes; pending coverage returns accepted=false without discarding valid local work. Submit criterionId plus declared unitId and exact inspectionIds for each regional or cross-region check. Do not mix a whole-target image with a crop of that same target in one unit; assign whole-view evidence to its separate criterion. Additional distinct scopes require explicit supersession. Do not resend unrelated passed checks. Coverage reports required/passed counts and pending IDs; omission cannot remove an obligation. A whole-view criterion requires its own whole image and canonical coverage. Requested native detail and mechanical checks remain required. First request inspections [{elementId,view?,region?}] to receive actual images; no checks are needed and judgments in a capture call are not recorded. After viewing those images, use next.arguments and record observed passes and failures before editing; supply checks [{criterionId,status,evidence}] with current inspectionIds and no new capture targets. Captures may reuse prior IDs (24 total). This tool never invokes a model. Capture targets use the inspect_drawing schema; regions are target-local and at most 1024 per side. Any failed capture returns successful images/inspectionIds and failedInspections without recording judgments. Retry with the successful IDs and corrected failed targets. Follow returned correction scope on failure. Source facts, criteria and calculations use their own tools. Optional polish is advisory; do not invent tighter precision than requested. The optional whole-structure checkpoint does not block ready parts. Record deferredDetails with id, description and reason; resolve them with deferredChecks (id, status and evidence). Valid sparse decisions are retained with their submitted image dependencies; omit unchanged decisions in later calls. Defer the whole-view judgment until a final candidate is ready, while recording local results as they become available.',
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
    results?: ReturnType<typeof createDesignCheckResults>
    resolveSources?: (sources: string[]) => string[]
    validateReferences?: (
      indexes: number[],
      referenceIds?: string[]
    ) => ReferenceIdentity[]
  } = {}
) => {
  const results = options.results ?? createDesignCheckResults()
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
        criteria: Record<string, DesignCriterion>
        structureCriteria: string[]
        detailRequired: boolean
        referenceImageIndexes?: number[]
      }
    | undefined
  let planDeclaration: Record<string, unknown> | undefined
  const unitScopes = new Map<string, readonly string[]>()
  let previousChecks: {
    unitId?: string
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
  let reviewRequired = false
  let acceptedIds: string[] = []
  let lastReviewIds: string[] = []
  let issue = 'The drawing has not been checked against the requested result.'
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
  const mechanicalIssue = () => {
    const pending = results.read().items.find((item) => item.origin === 'tool')
    return pending
      ? `Mechanical check ${pending.id} remains ${pending.status}; resolve it without resubmitting unchanged visual judgments.`
      : undefined
  }
  const requiredChecks = () =>
    Object.entries(plan?.criteria ?? {}).flatMap(([criterionId, criterion]) =>
      (criterion.requiredUnits ?? [undefined]).map((unitId) => ({
        id: visualCheckIdentity({ criterionId, unitId }),
        criterionId,
        ...(unitId === undefined ? {} : { unitId })
      }))
    )
  const reviewState = (
    replacements: Pick<
      DesignCheckResult,
      'id' | 'criterionId' | 'unitId' | 'status' | 'scope' | 'evidence'
    >[] = []
  ) => {
    const required = requiredChecks()
    const current = new Map<
      string,
      Pick<
        DesignCheckResult,
        | 'id'
        | 'criterionId'
        | 'unitId'
        | 'status'
        | 'scope'
        | 'evidence'
        | 'reason'
      >
    >(
      results
        .read({ includePassed: true })
        .items.filter((item) => item.origin === 'main-agent')
        .map((item) => [item.id, item])
    )
    for (const item of replacements) current.set(item.id, item)
    const pending = required.flatMap((item) => {
      const result = current.get(item.id)
      let status = result?.status ?? 'missing'
      const wholeViewRequired =
        status === 'pass' &&
        item.unitId === undefined &&
        plan?.criteria[item.criterionId]?.verification === 'visual' &&
        !result?.scope?.some((id) => inspections.get(id)?.overview)
      if (wholeViewRequired) status = 'unverified'
      return status === 'pass'
        ? []
        : [
            {
              ...item,
              status,
              ...(wholeViewRequired ? { reason: 'whole-view-required' } : {})
            }
          ]
    })
    const inspectionIds = [
      ...new Set(
        [...current.values()]
          .filter((item) => item.status === 'pass')
          .flatMap((item) => item.scope ?? [])
      )
    ]
    const evidence = inspectionIds.map((id) => inspections.get(id))
    return {
      coverage: {
        required: required.length,
        passed: required.length - pending.length,
        pending
      },
      inspectionIds,
      unresolvedUnits: [...current.values()].filter(
        (item) => item.unitId !== undefined && item.status !== 'pass'
      ),
      evidenceComplete:
        evidence.length > 0 &&
        evidence.every(Boolean) &&
        evidence.some((entry) => entry?.overview) &&
        (!plan?.detailRequired || evidence.some((entry) => entry?.detail))
    }
  }
  const pendingCriterionIds = () => [
    ...new Set([
      ...reviewState().coverage.pending.map((item) => item.criterionId),
      ...results
        .read()
        .items.flatMap((item) =>
          item.origin === 'main-agent' && item.criterionId
            ? [item.criterionId]
            : []
        )
    ])
  ]
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
    results.invalidate(
      affectedCriterionIds.map((id) => `criterion:${id}`),
      'Source or reference dependencies changed.'
    )
    const invalidatedFactIds = facts
      .snapshot()
      .filter((fact) => fact.status === 'invalidated')
      .map((fact) => fact.id)
    const sourceIssues = referenceIssues()
    const nextReview = {
      tool: AiDesignToolIds.REVIEW_DRAWING,
      phase: 'visual',
      final: false,
      requiredInputs: ['inspectionIds', 'checks'],
      instruction:
        'Record observed pending criterion/unit judgments before editing, including passes and failures; retain unrelated passes. Use final=true only for completion. Reuse unchanged inspection IDs only if canonical evidence validation still accepts them.'
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
      accepted: accepted && !mechanicalIssue(),
      requiresFreshReview: !accepted,
      affectedCriterionIds,
      referenceIssues: sourceIssues,
      requirementRevision: references.revision(),
      requiredCriterionIds: accepted ? [] : pendingCriterionIds(),
      coverage: reviewState().coverage,
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
    readChecks: results.read,
    coverage: () => reviewState().coverage,
    judgmentHandoff(inspectionIds: string[], phase: 'structure' | 'visual') {
      if (!plan)
        return {
          coverage: reviewState().coverage,
          next: {
            tool: AiDesignToolIds.DEFINE_DESIGN_CRITERIA,
            arguments: { phase: 'plan' },
            requiredInputs: reviewPlanRequiredInputs,
            instruction:
              'Define request-linked criteria before recording judgments. Retain the returned images; defining criteria does not inspect or approve them.'
          }
        }
      return {
        coverage: reviewState().coverage,
        ...(inspectionIds.length
          ? {
              next: {
                tool: AiDesignToolIds.REVIEW_DRAWING,
                arguments: {
                  phase,
                  ...(phase === 'visual' ? { final: false } : {}),
                  inspectionIds
                },
                requiredInputs: ['checks'],
                instruction:
                  'After viewing the images, record observed pending checks, including passes and failures, before editing. Supply exact criterion/unit identities and only the images each judgment depends on. Do not resend unrelated passes or invent judgments for unseen parts. Use final=true only to attempt completion from retained results.'
              }
            }
          : {})
      }
    },
    invalidateWholeView(message: string): void {
      results.invalidate([wholeViewCoverageDependency], message)
      structureAccepted = false
      this.requireReview(message)
    },
    reviewEvidenceIds: () =>
      reviewState().inspectionIds.filter((id) => inspections.has(id)),
    preparationContext() {
      if (!plan)
        throw new Error(
          'Define request-linked criteria before prepared review.'
        )
      const criteria = plan.criteria
      const ids = Object.keys(criteria)
      const decisions = references.snapshot()
      return {
        criteria: Object.fromEntries(
          ids.map((id) => [id, { requirement: criteria[id].requirement }])
        ),
        requirementRevision: references.revision(),
        referenceDecisions: decisions,
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
        sourceAssertions: facts.snapshot()
      }
    },
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
    correctionContext(inspectionIds: string[] = []) {
      const checks = results
        .read()
        .items.filter(
          (item) =>
            item.origin === 'main-agent' && item.criterionId !== undefined
        )
      const criterionIds = new Set([
        ...pendingCriterionIds(),
        ...checks.flatMap((check) =>
          check.criterionId ? [check.criterionId] : []
        )
      ])
      return {
        diagnosticOnly: true,
        coverage: reviewState().coverage,
        referenceDecisions: references.snapshot(),
        requiresFreshReview: !accepted,
        revision,
        criteria: [...criterionIds].map((criterionId) => ({
          criterionId,
          evidence: [
            ...new Set(
              [
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
    factTargets: () => [
      ...new Set(
        [...factBindings.values()].flatMap((binding) => binding.elementIds)
      )
    ],
    requireReview(message: string): void {
      reviewRequired = true
      accepted = false
      acceptedIds = []
      issue = message
    },
    invalidateInspections(ids: readonly string[], message: string): void {
      results.invalidate(
        ids.map((id) => `inspection:${id}`),
        message
      )
      for (const id of ids) inspections.delete(id)
      lastReviewIds = lastReviewIds.filter((id) => !ids.includes(id))
      this.requireReview(message)
    },
    mutate(): void {
      results.invalidate(['scene'], 'Unscoped canonical evidence changed.')
      this.invalidateInspections(
        [...inspections]
          .filter(([, item]) => !item.source?.receiptId)
          .map(([id]) => id),
        'The latest changes have not yet been checked against the requested result.'
      )
      revision++
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
          evidence.source?.revision === source?.revision &&
          evidence.source?.receiptId === source?.receiptId
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
            (!source.receiptId &&
              !first.receiptId &&
              source.revision !== first.revision)
        )
      )
        return undefined
      return first
    },
    evidenceEntries(ids: unknown = acceptedIds) {
      return Array.isArray(ids)
        ? ids.map((id) => ({
            id: String(id),
            source: inspections.get(String(id))?.source
          }))
        : []
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
    isAccepted: () => accepted && !mechanicalIssue(),
    invalidateAssessment(message: string): void {
      results.invalidate(
        ['scene', ...[...inspections.keys()].map((id) => `inspection:${id}`)],
        message
      )
      accepted = false
      acceptedIds = []
      issue = message
    },
    validateReview(value: unknown) {
      if (
        !record(value) ||
        !['structure', 'visual'].includes(String(value.phase))
      )
        throw new Error(
          'Only structure and visual review candidates can be validated.'
        )
      return this.record(value, { validateOnly: true })
    },
    record(
      value: unknown,
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
          if (update.unknownImpact)
            results.invalidate(
              [
                'scene',
                ...[...inspections.keys()].map((id) => `inspection:${id}`)
              ],
              'Source changes have unknown review impact.'
            )
          acceptedIds = []
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
        if (
          plan &&
          planDeclaration &&
          isDeepStrictEqual(planDeclaration, value)
        )
          return {
            phase: 'plan',
            recorded: true,
            requirementRevision: references.revision(),
            criterionIds: Object.keys(plan.criteria),
            facts: facts.snapshot().map(({ id, status }) => ({ id, status })),
            deferredDetailIds: [...deferredDetails.keys()]
          }
        if (
          plan &&
          (revision > 0 ||
            results
              .read({ includePassed: true })
              .items.some(
                (item) =>
                  item.origin === 'main-agent' && item.scope !== undefined
              ))
        )
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
                  ![
                    'requirement',
                    'description',
                    'verification',
                    'requiredUnits'
                  ].includes(key)
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
        const declared = value.criteria as Record<string, DesignCriterion>
        const partitioned = Object.entries(declared).filter(
          ([, item]) => item.requiredUnits !== undefined
        )
        if (
          partitioned.some(
            ([id, item]) =>
              item.verification !== 'visual' ||
              structureCriteria.includes(id) ||
              !strings(item.requiredUnits) ||
              item.requiredUnits.length === 0 ||
              item.requiredUnits.some(
                (unit) => !text(unit) || unit.length > 256
              ) ||
              new Set(item.requiredUnits).size !== item.requiredUnits.length
          )
        )
          throw new Error(
            'Provide unique declared units for visual criteria outside structure checkpoints.'
          )
        if (
          partitioned.length &&
          !Object.values(declared).some(
            (item) =>
              item.verification === 'visual' && item.requiredUnits === undefined
          )
        )
          throw new Error(
            'Regional criteria require a separate whole-view visual criterion.'
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
        results.discardDeclarations(requiredChecks().map((item) => item.id))
        plan = {
          structureCriteria,
          criteria: structuredClone(declared),
          detailRequired: value.detailRequired,
          referenceImageIndexes:
            value.referenceImageIndexes !== undefined
              ? [...(value.referenceImageIndexes as number[])]
              : plan?.referenceImageIndexes
        }
        planDeclaration = structuredClone(value)
        deferredDetails = nextDeferred
        for (const required of requiredChecks())
          results.record({
            ...required,
            origin: 'main-agent',
            status: 'unverified',
            evidence: 'Await primary-agent review of actual rendered evidence.',
            dependencies: {
              ...(required.unitId === undefined &&
              plan.criteria[required.criterionId].verification === 'visual'
                ? { [wholeViewCoverageDependency]: 'required' }
                : {}),
              ...(required.unitId === undefined
                ? { scene: String(revision) }
                : {}),
              [`criterion:${required.criterionId}`]: String(
                references.revision()
              )
            }
          })
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
      if (
        structure &&
        !value.inspectionIds.some((id) => inspections.get(id)?.overview)
      )
        throw new Error('Inspect the full drawing before structure review.')
      if (
        !Array.isArray(value.checks) ||
        !value.checks.length ||
        (structure &&
          (!criteria.every((id) =>
            (value.checks as unknown[]).some(
              (check) =>
                record(check) &&
                check.unitId === undefined &&
                check.criterionId === id
            )
          ) ||
            value.checks.length !== criteria.length))
      )
        throw new Error(
          'Assess every planned structure criterion exactly once.'
        )
      const suppliedIds = new Set(
        value.checks.map((check) =>
          record(check)
            ? visualCheckIdentity(
                check as { criterionId: string; unitId?: string }
              )
            : undefined
        )
      )
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
        new Set(checks.map((check) => visualCheckIdentity(check))).size !==
          checks.length
      )
        throw new Error(
          'Each planned criterion needs one pass, fail or unverified status and concrete evidence from the declared verification source.'
        )
      const submittedScopes = new Map<string, readonly string[]>()
      for (const check of value.checks) {
        const requiredUnits = plan.criteria[check.criterionId]?.requiredUnits
        if (
          requiredUnits &&
          (check.unitId === undefined || !requiredUnits.includes(check.unitId))
        )
          throw new Error(
            'Use an exact declared unit for this regional criterion.'
          )
        if (
          check.unitId !== undefined &&
          (structure || !text(check.unitId) || check.unitId.length > 256)
        )
          throw new Error(
            'Visual unitId must be a stable nonempty regional identity.'
          )
        if (
          check.inspectionIds !== undefined &&
          (!strings(check.inspectionIds) ||
            !check.inspectionIds.length ||
            new Set(check.inspectionIds).size !== check.inspectionIds.length ||
            check.inspectionIds.some(
              (id: string) => !(value.inspectionIds as string[]).includes(id)
            ))
        )
          throw new Error(
            'Criterion inspection IDs must be a nonempty unique subset of the current review images.'
          )
      }
      for (const check of value.checks) {
        if (
          check.supersedes !== undefined &&
          (check.unitId === undefined ||
            !record(check.supersedes) ||
            !Number.isInteger(check.supersedes.revision) ||
            check.supersedes.revision < 1 ||
            !text(check.supersedes.reason) ||
            check.supersedes.reason.length > 1000 ||
            Object.keys(check.supersedes).some(
              (key) => !['revision', 'reason'].includes(key)
            ))
        )
          throw new Error(
            'Unit supersession requires an exact revision and redesign reason.'
          )
        if (check.unitId === undefined) continue
        const key = visualCheckIdentity(check)
        const imageIds: string[] = check.inspectionIds ?? value.inspectionIds
        const enclosingIds = imageIds.filter((id) => {
          const image = inspections.get(id)
          return (
            image &&
            !image.region &&
            imageIds.some((otherId) => {
              const other = inspections.get(otherId)
              return other?.region && other.target === image.target
            })
          )
        })
        if (enclosingIds.length)
          throw new Error(
            `Regional check ${check.criterionId}/${check.unitId} mixes whole-target and local evidence. Keep whole-target inspections ${enclosingIds.join(', ')} on a separate whole-view criterion; explicitly resubmit this unit with only its required local inspections. No judgments were recorded.`
          )
        const scope = [
          ...new Set<string>(
            (check.inspectionIds ?? value.inspectionIds).map((id: string) => {
              const image = inspections.get(id)
              if (!image)
                throw new Error('Unit requires current delivered image scope.')
              return JSON.stringify([image.target, image.scope])
            })
          )
        ].sort()
        const previous = results.read({ ids: [key], includePassed: true })
          .items[0]
        const originalScope = unitScopes.get(key)
        const changedScope =
          originalScope !== undefined &&
          (originalScope.length !== scope.length ||
            originalScope.some((item) => !scope.includes(item)))
        if (check.supersedes !== undefined) {
          const exactReplay =
            !changedScope &&
            previous &&
            previous.revision === check.supersedes.revision + 1 &&
            previous.supersedes?.revision === check.supersedes.revision &&
            previous.supersedes?.reason === check.supersedes.reason &&
            previous.status === check.status &&
            previous.evidence === check.evidence &&
            JSON.stringify(previous.scope) ===
              JSON.stringify(check.inspectionIds ?? value.inspectionIds)
          if (
            !previous ||
            (previous.revision !== check.supersedes.revision && !exactReplay)
          )
            throw new Error(
              'Unit supersession revision is stale or unavailable.'
            )
        }
        if (changedScope && !check.supersedes)
          throw new Error(
            'Check unit scope changed; provide supersedes with the current result revision and redesign reason.'
          )
        submittedScopes.set(
          key,
          check.supersedes || !originalScope ? scope : originalScope
        )
      }
      const submittedDeferred = value.deferredChecks ?? []
      const deferredChecks = submittedDeferred
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
      const deferredResults = new Map(
        results
          .read({
            ids: [...nextDeferred.keys()].map((id) => `deferred:${id}`),
            includePassed: true
          })
          .items.map((item) => [item.id, item])
      )
      const deferredCandidates = deferredChecks.map((item) => ({
        id: `deferred:${item.id}`,
        origin: 'main-agent' as const,
        status:
          item.status === 'pending'
            ? ('unverified' as const)
            : ('pass' as const),
        deferredDecision: item.status as 'omit' | 'restored' | 'pending',
        evidence: item.evidence as string,
        scope: [...(value.inspectionIds as string[])],
        dependencies: {
          [`deferred:${item.id}`]: JSON.stringify(nextDeferred.get(item.id)),
          ...Object.fromEntries(
            (value.inspectionIds as string[]).map((id) => [
              `inspection:${id}`,
              String(inspections.get(id)?.source?.revision ?? revision)
            ])
          ),
          ...Object.fromEntries(
            criteria.map((id) => [
              `criterion:${id}`,
              String(references.revision())
            ])
          )
        }
      }))
      for (const item of deferredCandidates)
        deferredResults.set(item.id, { ...item, revision: 0 })
      const currentDeferred = [...nextDeferred].flatMap(([id, detail]) => {
        const result = deferredResults.get(`deferred:${id}`)
        return result?.status === 'pass' &&
          result.deferredDecision &&
          result.dependencies[`deferred:${id}`] === JSON.stringify(detail)
          ? [{ id, status: result.deferredDecision, evidence: result.evidence }]
          : []
      })
      const effective = reviewState([
        ...checks.map((check) => ({
          id: visualCheckIdentity(check),
          criterionId: check.criterionId,
          unitId: check.unitId,
          status: check.status,
          evidence: check.evidence,
          scope: check.inspectionIds ?? value.inspectionIds
        })),
        ...deferredCandidates
      ])
      const resolved = new Set(
        currentDeferred
          .filter((item) => item.status !== 'pending')
          .map((item) => item.id)
      )
      const pendingDetails = [...nextDeferred.keys()].filter(
        (id) => !resolved.has(id)
      )
      const readyForCompletion =
        final &&
        effective.coverage.pending.length === 0 &&
        effective.unresolvedUnits.length === 0 &&
        effective.evidenceComplete &&
        pendingDetails.length === 0 &&
        !facts.hasInvalidated() &&
        referenceIssues().length === 0
      if (recordOptions.validateOnly)
        return {
          phase: value.phase,
          checks,
          readyForCompletion,
          inspectionIds: effective.inspectionIds,
          coverage: effective.coverage
        }

      // A published judgment also governs review-only requests for existing content.
      reviewRequired = true
      for (const [id, detail] of nextDeferred)
        if (
          deferredDetails.has(id) &&
          JSON.stringify(deferredDetails.get(id)) !== JSON.stringify(detail)
        )
          results.invalidate(
            [`deferred:${id}`],
            'The deferred detail definition changed.'
          )
      for (const item of deferredCandidates) results.record(item)
      for (const [key, scope] of submittedScopes) unitScopes.set(key, scope)
      lastReviewIds = [...value.inspectionIds]
      for (const check of checks) {
        if (!suppliedIds.has(visualCheckIdentity(check))) continue
        const supersedes =
          check.supersedes ??
          results.read({
            ids: [visualCheckIdentity(check)],
            includePassed: true
          }).items[0]?.supersedes
        results.record({
          id: visualCheckIdentity(check),
          criterionId: check.criterionId,
          ...(check.unitId === undefined
            ? {}
            : {
                unitId: check.unitId,
                ...(supersedes ? { supersedes } : {})
              }),
          origin: 'main-agent',
          status: check.status as 'pass' | 'fail' | 'unverified',
          evidence: check.evidence,
          scope: [...(check.inspectionIds ?? value.inspectionIds)],
          dependencies: {
            ...(check.unitId === undefined &&
            plan.criteria[check.criterionId].verification === 'visual'
              ? { [wholeViewCoverageDependency]: 'required' }
              : {}),
            ...Object.fromEntries(
              (check.inspectionIds ?? value.inspectionIds).map((id: string) => [
                `inspection:${id}`,
                String(inspections.get(id)?.source?.revision ?? revision)
              ])
            ),
            [`criterion:${check.criterionId}`]: String(references.revision())
          }
        })
      }
      if (structure) {
        deferredDetails = nextDeferred
        structureAccepted = checks.every((check) => check.status === 'pass')
        if (!structureAccepted || additions.length) {
          accepted = false
          acceptedIds = []
          issue = !structureAccepted
            ? `The drawing still needs adjustment: ${checks
                .filter((check) => check.status !== 'pass')
                .map((check) => `${check.criterionId}: ${check.evidence}`)
                .join('; ')}`
            : 'Deferred details require a current final visual review.'
        }
        return {
          phase: 'structure',
          results: results.read(),
          facts: factSnapshots(),
          deferredDetails: [...deferredDetails.values()],
          revision,
          accepted: false,
          readyForDetail: structureAccepted,
          checks,
          inspectionIds: value.inspectionIds,
          correction: this.correctionContext(value.inspectionIds)
        }
      }
      deferredDetails = nextDeferred
      const regressions = checks
        .filter(
          (check) =>
            check.status !== 'pass' &&
            previousChecks.some(
              (old) =>
                visualCheckIdentity(old) === visualCheckIdentity(check) &&
                old.status === 'pass'
            )
        )
        .map((check) => ({
          criterionId: check.criterionId,
          previousEvidence: previousChecks.find(
            (old) => visualCheckIdentity(old) === visualCheckIdentity(check)
          )?.evidence,
          currentEvidence: check.evidence
        }))
      previousChecks = [
        ...previousChecks.filter(
          (old) =>
            !checks.some(
              (check) => visualCheckIdentity(check) === visualCheckIdentity(old)
            )
        ),
        ...checks.map((check) => ({
          criterionId: String(check.criterionId),
          ...(check.unitId === undefined
            ? {}
            : { unitId: String(check.unitId) }),
          status: String(check.status),
          evidence: String(check.evidence)
        }))
      ]
      const unresolvedUnits = effective.unresolvedUnits
      const requiredCoverage = effective.coverage
      accepted = readyForCompletion
      acceptedIds = accepted ? effective.inspectionIds : []
      const unmet = checks
        .filter((check) => check.status !== 'pass')
        .map((check) => `${check.criterionId}: ${check.evidence}`)
      unmet.push(
        ...unresolvedUnits.map(
          (item) =>
            `${item.criterionId} - ${item.unitId}: ${item.status} - ${item.reason ?? item.evidence}`
        )
      )
      unmet.push(
        ...requiredCoverage.pending.map(
          (item) =>
            `${item.criterionId}${item.unitId === undefined ? '' : ` - ${item.unitId}`}: ${item.status}`
        )
      )
      if (!effective.evidenceComplete)
        unmet.push(
          'Current whole-view and requested native detail evidence remain required.'
        )
      unmet.push(...referenceIssues())
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
        results: results.read(),
        coverage: requiredCoverage,
        final,
        facts: factSnapshots(),
        deferredDetails: [...deferredDetails.values()],
        deferredChecks: [
          ...currentDeferred,
          ...deferredChecks.filter((item) => item.status === 'pending')
        ],
        pendingDetails,
        regressions,
        revision,
        accepted: this.isAccepted(),
        checks,
        inspectionIds: value.inspectionIds,
        correction: this.correctionContext(value.inspectionIds)
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
      const mechanical = mechanicalIssue()
      if (mechanical) return mechanical
      if ((revision === 0 && !reviewRequired) || accepted) return undefined
      return plan
        ? issue
        : 'The drawing was created, but its requested quality was not verified against the original request and its review criteria.'
    }
  }
}
