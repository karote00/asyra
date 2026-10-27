import { operationInputIssue } from './operation-input-schema'
import {
  createDesignCheckResults,
  designCheckDeliverySchema,
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
  referenceUsesSchema,
  referenceUseDependency,
  type ReferenceUseReceipt,
  type ReferencePurpose,
  type ReferenceIdentity
} from './local-reference-decisions'
import { isDeepStrictEqual } from 'node:util'
import {
  createDesignFacts,
  designFactsSchema,
  designCalculationsSchema
} from './local-design-facts'
import {
  inspectionEvidenceSchema,
  type InspectionEvidenceStamp
} from '../src/ai/inspection-evidence'
import { createHmac, randomUUID } from 'node:crypto'
import { AiDesignToolIds } from '../src/constants/ai-design'

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const text = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= 1000
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length <= 24 && value.every(text)

/** Select actual submitted dependencies; an enclosing menu is not evidence. */
export const reviewInspectionIds = (
  value: Record<string, unknown>
): string[] => {
  if (
    (Array.isArray(value.inspections) && value.inspections.length) ||
    (Array.isArray(value.deferredChecks) && value.deferredChecks.length)
  )
    return strings(value.inspectionIds) ? [...value.inspectionIds] : []
  const selected = Array.isArray(value.bindChecks)
    ? value.bindChecks
    : value.checks
  return [
    ...new Set(
      (Array.isArray(selected) ? selected : []).flatMap((check) =>
        record(check) && strings(check.inspectionIds) ? check.inspectionIds : []
      )
    )
  ]
}

interface ReviewSelection {
  referenceUses?: ReferenceUseReceipt[]
  criterionId: string
  unitId?: string
  inspectionIds: string[]
  supersedes?: { revision: number; reason: string }
}

class ReviewScopeConflictError extends Error {
  constructor(
    readonly conflicts: { index: number; revision: number; message: string }[]
  ) {
    super(conflicts.map((conflict) => conflict.message).join(' '))
  }
}

interface DesignCriterion {
  requirement: string
  description: string
  verification: 'visual' | 'data'
  requiredUnits?: string[]
}

interface FactBinding {
  unitId?: string
  referenceUses?: ReferenceUseReceipt[]
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
const reviewSupersessionConstraint = {
  anyOf: [{ required: ['unitId'] }, { properties: { supersedes: false } }]
}
const validateSupersession = (check: {
  unitId?: unknown
  supersedes?: unknown
}) => {
  if (check.supersedes === undefined) return
  if (check.unitId === undefined)
    throw new Error(
      'Whole-criterion checks must omit supersedes. It replaces an existing regional unit scope only; do not invent unitId. Reuse current images and bind the same criterion without supersedes.'
    )
  if (
    !record(check.supersedes) ||
    !Number.isInteger(check.supersedes.revision) ||
    Number(check.supersedes.revision) < 1 ||
    !text(check.supersedes.reason) ||
    check.supersedes.reason.length > 1000 ||
    Object.keys(check.supersedes).some(
      (key) => !['revision', 'reason'].includes(key)
    )
  )
    throw new Error(
      'Unit supersession requires an exact revision and redesign reason.'
    )
}
/** Pure corrective input only; the next invocation still validates evidence and scope. */
export const reviewSupersessionRecovery = (value: unknown) => {
  if (!record(value)) return
  const next = structuredClone(value)
  let corrected = false
  const correct = (items: unknown) => {
    if (!Array.isArray(items)) return
    for (const check of items) {
      if (
        record(check) &&
        check.unitId === undefined &&
        check.supersedes !== undefined
      ) {
        delete check.supersedes
        corrected = true
      }
    }
  }
  if (Array.isArray(next.inspections))
    for (const target of next.inspections)
      if (record(target)) correct(target.checks)
  correct(next.bindChecks)
  correct(next.checks)
  if (!corrected) return
  if (Array.isArray(next.checks)) {
    next.bindChecks = next.checks.map((check) => {
      if (!record(check)) return check
      const {
        status: _status,
        evidence: _evidence,
        binding: _binding,
        ...selection
      } = check
      return selection
    })
    delete next.checks
  }
  const schema =
    next.phase === 'structure' ? designEvidenceSchema : reviewVisualSchema
  if (operationInputIssue(next, schema)) return
  return {
    next: {
      tool: AiDesignToolIds.REVIEW_DRAWING,
      arguments: next,
      requiredInputs: [],
      instruction:
        'Removed only whole-criterion supersedes. Keep criterion identities and current image assignments; call next.arguments for validation and binding, then explicitly judge the images. No judgments were recorded. Do not invent units, recapture retained images or replay edits.'
    }
  }
}
const checkIdentityProperties = {
  referenceUses: referenceUsesSchema,
  criterionId: { type: 'string', minLength: 1 },
  unitId: { type: 'string', minLength: 1, maxLength: 256 },
  supersedes: {
    description:
      'Only with declared unitId: replace its scope using exact prior revision and redesign reason. Omit for whole-criterion checks and unchanged-scope fresh images.',
    type: 'object',
    additionalProperties: false,
    required: ['revision', 'reason'],
    properties: {
      revision: { type: 'integer', minimum: 1 },
      reason: { type: 'string', minLength: 1, maxLength: 1000 }
    }
  }
}
const reviewSelectionSchema = {
  ...reviewSupersessionConstraint,
  type: 'object',
  additionalProperties: false,
  required: ['criterionId', 'inspectionIds'],
  properties: {
    ...checkIdentityProperties,
    inspectionIds: {
      type: 'array',
      minItems: 1,
      maxItems: 24,
      uniqueItems: true,
      items: { type: 'string', minLength: 1 }
    }
  }
}
const reviewBindingSchema = {
  'x-runtime-value': 'request',
  ...toolResultObject({
    requestId: toolResultString,
    requirementRevision: toolResultCount,
    checkRevision: toolResultCount,
    signature: toolResultString,
    dependencies: {
      type: 'array',
      minItems: 1,
      maxItems: 24,
      items: toolResultObject(
        {
          inspectionId: toolResultString,
          elementId: toolResultString,
          scope: toolResultString,
          source: inspectionEvidenceSchema
        },
        ['inspectionId', 'elementId', 'scope']
      )
    }
  })
}
const reviewSubmissionSchema = {
  ...reviewSelectionSchema,
  required: [...reviewSelectionSchema.required, 'binding'],
  properties: {
    ...reviewSelectionSchema.properties,
    binding: reviewBindingSchema
  }
}
const factBindingsSchema = {
  type: 'array',
  maxItems: 24,
  description:
    'Link source facts to exact criterion/unit/document IDs. Image facts need current fact-purpose referenceUses. Source facts remain unchanged.',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['factId', 'criterionId', 'elementIds'],
    properties: {
      unitId: { type: 'string', minLength: 1 },
      referenceUses: referenceUsesSchema,
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
      'Stable criterion IDs link requested requirements/checks. No added material/fidelity/detail demands or polish gate. visual=images; data=scale/editability/canonical properties; split mixed requirements. structureCriteria/factBindings/checks reuse IDs.',
    additionalProperties: {
      type: 'object',
      additionalProperties: false,
      required: ['requirement', 'description', 'verification'],
      oneOf: [
        {
          properties: { verification: { const: 'visual' } },
          required: ['requiredUnits']
        },
        {
          properties: { verification: { const: 'data' }, requiredUnits: false }
        }
      ],
      properties: {
        requirement: { type: 'string', minLength: 1, maxLength: 1000 },
        description: { type: 'string', minLength: 1, maxLength: 1000 },
        verification: { type: 'string', enum: ['visual', 'data'] },
        requiredUnits: {
          type: 'array',
          minItems: 0,
          maxItems: 24,
          uniqueItems: true,
          items: { type: 'string', minLength: 1, maxLength: 256 },
          description:
            'Visual: []=whole-view; stable unit IDs=independent regional/cross-region judgments. Editable regions need units; overall agreement needs a separate whole-view criterion. Omit only for data; no structure units.'
        }
      }
    }
  },
  structureCriteria: {
    type: 'array',
    description:
      'Optional whole-structure checkpoint IDs. Ready parts can use phase=visual, final=false while other criteria remain pending.',
    maxItems: 24,
    items: { type: 'string', minLength: 1, maxLength: 1000 }
  },
  deferredDetails: {
    type: 'array',
    maxItems: 24,
    examples: [
      [
        {
          id: 'rear-detail',
          description: 'Rear-facing trim',
          reason:
            'Likely occluded in the requested view; verify in final review.'
        }
      ]
    ],
    description:
      'Deferred descriptions, not geometry; add in plan or reviews. Final review resolves retained IDs. State the reason, such as uncertain visibility.',
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
    items: {
      ...inspectionInputSchema,
      required: [...inspectionInputSchema.required, 'checks'],
      properties: {
        ...inspectionInputSchema.properties,
        checks: {
          type: 'array',
          minItems: 1,
          maxItems: 24,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['criterionId'],
            ...reviewSupersessionConstraint,
            properties: checkIdentityProperties
          }
        }
      }
    }
  },
  checks: {
    type: 'array',
    minItems: 1,
    maxItems: 24,
    items: {
      type: 'object',
      additionalProperties: false,
      required: [
        'criterionId',
        'status',
        'evidence',
        'inspectionIds',
        'binding'
      ],
      ...reviewSupersessionConstraint,
      properties: {
        binding: reviewBindingSchema,
        referenceUses: referenceUsesSchema,
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
            'Required exact delivered inspection IDs used for this judgment; the enclosing list only declares available images. Include every image needed for cross-region judgments.'
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
    'Suitable comparison indexes: explicitly select imports; omission uses original user attachments only. Never select rejected research images.'
}

const reviewFactsSchema = {
  ...designFactsSchema,
  properties: {
    ...designFactsSchema.properties,
    factBindings: factBindingsSchema
  }
}
// Reuse the review owner's exact selection and editable judgment constraints.
export const reviewCaptureChecksSchema =
  designReviewProperties.inspections.items.properties.checks
export const reviewJudgmentFieldsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['status', 'evidence'],
  properties: {
    status: designReviewProperties.checks.items.properties.status,
    evidence: designReviewProperties.checks.items.properties.evidence
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
      verification: 'visual',
      requiredUnits: []
    }
  },
  detailRequired: false
}
export const reviewPlanGuidance =
  `Criteria are keyed by stable IDs. Plan fields: ${reviewPlanSchema.required.join(', ')}. Each criterion requires ${reviewPlanSchema.properties.criteria.additionalProperties.required.join(', ')}. verification is visual for appearance or data for canonical/numeric checks; split mixed requirements. Every visual criterion requires explicit requiredUnits: [] for deliberate whole-view checks or unique stable regional IDs (at most 24). Keep a separate unpartitioned visual whole-view criterion. Do not partition data or structure criteria. Once judged or changed, declared obligations cannot shrink; identical replay preserves results. ` +
  'Canonical input examples illustrate syntax; adapt criteria to the actual request.'

const reviewStructureSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['phase'],
  oneOf: [
    {
      'x-design-operation': 'record',
      required: ['inspectionIds', 'checks'],
      properties: { inspections: false, bindChecks: false }
    },
    {
      'x-design-operation': 'capture',
      required: ['inspections'],
      properties: { checks: false, bindChecks: false }
    },
    {
      'x-design-operation': 'bind',
      required: ['bindChecks'],
      properties: { checks: false, inspections: false }
    }
  ],
  properties: {
    phase: { type: 'string', const: 'structure' },
    inspectionIds: designReviewProperties.inspectionIds,
    inspections: designReviewProperties.inspections,
    checks: designReviewProperties.checks,
    bindChecks: {
      type: 'array',
      minItems: 1,
      maxItems: 24,
      items: reviewSelectionSchema
    },
    deferredDetails: designReviewProperties.deferredDetails
  }
}
export const reviewVisualSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['phase'],
  oneOf: [
    {
      'x-design-operation': 'record',
      required: ['inspectionIds', 'checks'],
      properties: { inspections: false, bindChecks: false }
    },
    {
      'x-design-operation': 'capture',
      required: ['inspections'],
      properties: { checks: false, bindChecks: false }
    },
    {
      'x-design-operation': 'bind',
      required: ['bindChecks'],
      properties: { checks: false, inspections: false }
    }
  ],
  properties: {
    phase: { type: 'string', const: 'visual' },
    inspectionIds: designReviewProperties.inspectionIds,
    inspections: designReviewProperties.inspections,
    checks: designReviewProperties.checks,
    bindChecks: {
      type: 'array',
      minItems: 1,
      maxItems: 24,
      items: reviewSelectionSchema
    },
    deferredDetails: designReviewProperties.deferredDetails,
    deferredChecks: designReviewProperties.deferredChecks,
    final: designReviewProperties.final
  }
}

const reviewUsage = {
  instructions:
    'Read-only review. phase=structure checks the declared structural subset; phase=visual judges current rendered evidence. Capture/bind do not record a verdict. Required criteria must exist before binding; first drawing needs no review. Select one operation for the current decision; never combine capture/bind with record. Each conclusion cites its exact necessary images, including overview plus detail when needed. Every image is an invalidation dependency; use only local images for independent local conclusions. Changed scopes require explicit supersession. Keep the separate whole-view criterion with its own whole image and canonical coverage; a regional overview cannot replace it. Required native detail and mechanical checks remain required. Do not omit obligations, resend unrelated passes or discard necessary evidence to recover a pass. factElementIds identify source associations, never edit targets.',
  operations: {
    capture:
      'Capture selected current targets with explicit criterionId/unitId checks. Use overview for composition and detail/region for native detail; workspace supports overview only. Follow next.requiredInputs when binding is still needed; otherwise view the images and add explicit judgments to next.arguments without recapturing.',
    bind: 'Reuse retained inspectionIds for exact criterion/unit checks, including necessary overview plus detail. Binding produces next.arguments without capturing or judging. Preserve current multiscale dependencies.',
    record:
      'Consume capture/bind next.arguments. Fill only observed status/evidence; retain exact image IDs and signed binding. There is no static record invocation: the executable example is the returned next invocation with its current binding. final=true attempts whole-request acceptance from current retained coverage.'
  },
  selection:
    'inputScope.operation: capture for new current images; bind to reuse retained images for chosen checks; record to submit observed judgments using capture/bind next.arguments. Selecting this contract needs no nodeTypes or planning call. Full and field queries remain available; known current contracts need no lookup.',
  results:
    'Read toolOutcome and reviewOperation. recordedChecks acknowledges exact local judgments; accepted is whole-request completion, never invocation success. Current local passes survive unrelated edits; missing, stale or failed obligations prevent acceptance. Capture/bind returns next with exact arguments; no judgment is inferred.',
  recovery:
    'Never replay writes or successful captures for a review failure. Retain successful inspectionIds; retry only failedInspections using their inspection input. Rebind retained current images for missing bindings; recapture only stale/failed targets. Cancellation does not certify a pass. Invalid or tampered signatures require current binding, not invented tokens.'
}
const reviewUsageExamples = [
  {
    phase: 'visual',
    final: false,
    inspections: [
      {
        elementId: 'current-target-id',
        checks: [{ criterionId: 'appearance' }]
      }
    ]
  },
  {
    phase: 'visual',
    final: false,
    bindChecks: [
      { criterionId: 'appearance', inspectionIds: ['retained-inspection-id'] }
    ]
  }
]

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
    revision: 5,
    name: AiDesignToolIds.DEFINE_DESIGN_CRITERIA,
    description:
      'Define request-linked criteria before review, after the first ready drawing if appropriate. Store requirements; this does not inspect or approve the drawing. phase is fixed by this tool and may be omitted. ' +
      reviewPlanGuidance,
    inputSchema: {
      ...optionalPhaseSchema(reviewPlanSchema),
      examples: [reviewPlanExample]
    }
  },
  {
    type: 'function',
    ...toolSemantics(
      toolResultObject({ phase: { const: 'facts' }, facts: { type: 'array' } }),
      'prepare',
      ['request-artifacts']
    ),
    revision: 2,
    name: AiDesignToolIds.RECORD_DESIGN_FACTS,
    description:
      'Record or retrieve verified source facts and their criterion/element bindings. A source fact requires id, statement, scope, sources, verification and dependencies:[{key,version}]. Preserve unchanged facts. Use dependencyChanges only for actual changed sources or contrary evidence, never to fix an arithmetic transcription. Use sourceCorrections:[{factId,sources,verification,reason}] to correct only a citation without changing its statement or dependency versions. Use retained referenceId or an existing attachment:N for image sources; source URLs remain attributed assertions. Use record_design_calculations for derived numbers. Bind with factId, exact criterionId/unitId, known elementIds and explicit fact-purpose referenceUses for cited images. Omit all fields to retrieve existing facts. A changed source returns the pending review scope; recording facts is not approval. Examples use placeholder identities; substitute real evidence and known IDs.\n' +
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
    revision: 3,
    name: AiDesignToolIds.SELECT_DESIGN_REFERENCES,
    description:
      'Select retained attachment indexes for primary-agent visual comparison. Use referenceId from attachment metadata or import; this call prepares pixel bounds for explicit uses, reusing admitted images. No prior validation call is required. Preparation failure leaves selection unchanged; retry failed sources only, never redraw. Identical selection preserves approval; changed uses reopen only their dependent checks. An empty selection clears it. Download success does not establish suitability. Record referenceDecisions with the current requirementRevision in this call; select candidates by index and declare exact uses with id, criterionId/unitId, purpose, original-pixel region (or whole) and limitations. Use returned receipts explicitly in downstream referenceUses; omitted receipts mean reference-free work. Rejected and undecided images are retained but excluded from comparison.',
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
          reviewOperation: {
            enum: ['capture', 'bind', 'record'],
            description:
              'Requested review operation; toolOutcome reports settlement. Capture and binding record no judgments.'
          },
          recordedChecks: {
            type: 'array',
            description:
              'Exact committed criterion/unit judgments from this call, including passes. Deferred-detail decisions retain their separate deferredChecks receipt. This acknowledgement is not whole-request acceptance.',
            items: toolResultObject(
              {
                id: toolResultString,
                criterionId: toolResultString,
                unitId: toolResultString,
                origin: { const: 'main-agent' },
                status: { enum: ['pass', 'fail', 'unverified', 'stale'] },
                revision: { type: 'integer', minimum: 1 }
              },
              ['id', 'criterionId', 'origin', 'status', 'revision']
            )
          },
          structureAccepted: toolResultBoolean,
          accepted: toolResultBoolean,
          inspectionIds: toolResultIds,
          results: designCheckDeliverySchema,
          correction: toolResultObject(
            {
              diagnosticOnly: { const: true },
              requiresFreshReview: toolResultBoolean,
              revision: toolResultCount,
              checks: {
                type: 'array',
                items: toolResultObject(
                  {
                    id: toolResultString,
                    criterionId: toolResultString,
                    unitId: toolResultString,
                    revision: { type: 'integer', minimum: 1 },
                    evidence: toolResultString,
                    reason: toolResultString,
                    status: {
                      enum: ['missing', 'unverified', 'stale', 'fail']
                    },
                    inspectionIds: toolResultIds,
                    factElementIds: toolResultIds
                  },
                  [
                    'id',
                    'criterionId',
                    'status',
                    'inspectionIds',
                    'factElementIds'
                  ]
                )
              },
              inspections: {
                type: 'array',
                items: toolResultObject(
                  {
                    inspectionId: toolResultString,
                    elementId: toolResultString,
                    region: { type: 'object' },
                    coordinateSpace: { const: 'element-local' },
                    overview: toolResultBoolean,
                    detail: toolResultBoolean
                  },
                  ['inspectionId', 'elementId', 'overview', 'detail']
                )
              },
              unavailableInspectionIds: toolResultIds,
              discovery: toolResultObject({
                tool: { const: AiDesignToolIds.DESCRIBE_DESIGN_APIS },
                arguments: toolResultObject({ view: { const: 'full' } }),
                requiredInputs: {
                  type: 'array',
                  items: { const: 'query' },
                  minItems: 1,
                  maxItems: 1
                },
                instruction: toolResultString
              })
            },
            [
              'diagnosticOnly',
              'requiresFreshReview',
              'revision',
              'checks',
              'inspections',
              'unavailableInspectionIds'
            ]
          ),
          acceptanceContext: toolResultObject({
            method: toolResultString,
            requirementRevision: toolResultCount,
            checks: {
              type: 'array',
              items: toolResultObject(
                {
                  criterionId: toolResultString,
                  unitId: toolResultString,
                  requirement: toolResultString,
                  description: toolResultString
                },
                ['criterionId', 'requirement', 'description']
              )
            }
          }),
          next: {
            oneOf: [
              toolResultObject({
                tool: { const: AiDesignToolIds.READ_DESIGN_CHECKS },
                arguments: toolResultObject({ ids: toolResultIds }),
                instruction: toolResultString
              }),
              toolResultObject({
                tool: { const: AiDesignToolIds.REVIEW_DRAWING },
                arguments: toolResultObject(
                  {
                    phase: { enum: ['structure', 'visual'] },
                    final: { const: false },
                    inspectionIds: { ...toolResultIds, minItems: 1 },
                    checks: { type: 'array', items: reviewSubmissionSchema },
                    bindChecks: {
                      type: 'array',
                      minItems: 1,
                      items: {
                        ...reviewSelectionSchema,
                        properties: {
                          ...reviewSelectionSchema.properties,
                          supersedes: {
                            ...checkIdentityProperties.supersedes,
                            required: ['revision']
                          }
                        }
                      }
                    }
                  },
                  ['phase', 'inspectionIds']
                ),
                requiredInputs: {
                  type: 'array',
                  items: {
                    anyOf: [
                      {
                        enum: [
                          'bindChecks',
                          'checks[].status',
                          'checks[].evidence'
                        ]
                      },
                      {
                        type: 'string',
                        pattern:
                          '^bindChecks\\[[0-9]+\\]\\.supersedes\\.reason$'
                      }
                    ]
                  },
                  minItems: 1
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
        [
          'phase',
          'reviewOperation',
          'recordedChecks',
          'accepted',
          'inspectionIds'
        ]
      ),
      'prepare',
      ['request-artifacts']
    ),
    revision: 15,
    name: AiDesignToolIds.REVIEW_DRAWING,
    description:
      'For current review use describe_design_apis with this exact name, view=usage and inputScope.operation=capture, bind or record; no nodeTypes. Review the current drawing against retained criteria and selected references. Execution success is not visual approval. reviewOperation identifies capture/bind/record; recordedChecks acknowledges exactly the committed judgments (including local passes), while accepted reports whole-request completion. Counts are labeled with their request or selected scope. phase=structure checks the optional structural subset; phase=visual records valid supplied judgments across calls. final=true (default) additionally attempts completion from all retained current passes; pending coverage returns accepted=false without discarding valid local work. Submit criterionId plus declared unitId and exact inspectionIds for each regional or cross-region check. A conclusion may cite necessary overview and detail images of the same target. Every cited image is a dependency: broad evidence carries broad invalidation. Cite only necessary local images for independent local conclusions; never inherit the enclosing image list. A regional overview does not replace the separate whole-view judgment. Do not discard necessary evidence merely to recover a pass. Additional distinct scopes require explicit supersession. Do not resend unrelated passed checks. Coverage reports required/passed counts and pending IDs; omission cannot remove an obligation. A whole-view criterion requires its own whole image and canonical coverage. Requested native detail and mechanical checks remain required. First request inspections [{elementId,view?,region?,checks:[{criterionId,unitId?,supersedes?}]}] with explicit intended checks to receive actual images and bound submission descriptors. To reuse existing images, supply bindChecks [{criterionId,unitId?,inspectionIds,supersedes?}] instead. Neither capture nor binding records a judgment. Read acceptanceContext for the current method and selected criterion meaning; it is informational and must not be copied into arguments. After viewing those images, use next.arguments and record observed passes and failures before editing; fill status/evidence in the returned bound checks; preserve their binding and exact dependencies with current inspectionIds and no new capture targets. Captures may reuse prior IDs (24 total). This tool never invokes a model. Current workspace overview captures all roots together without regrouping; use its actual ID. Workspace detail/region is unsupported: select a concrete child for native detail. Unavailable images never approve a check. Capture targets use the inspect_drawing schema; regions are target-local and at most 1024 per side. Any failed capture returns successful images/inspectionIds and failedInspections without recording judgments. Retry with the successful IDs and corrected failed targets. A rejected binding after successful capture returns partial with those images and bindChecks recovery; read the affected current revisions and rebind without recapturing or replaying edits. Use correction.checks for each unresolved identity, status and evidence, with linked inspections and explicit unavailableInspectionIds. factElementIds are source-fact associations, not edit targets. Follow optional correction.discovery only for a missing edit or target-query contract; known edits need no lookup. Source facts, criteria and calculations use their own tools. Optional polish is advisory; do not invent tighter precision than requested. The optional whole-structure checkpoint does not block ready parts. Record deferredDetails with id, description and reason; resolve them with deferredChecks (id, status and evidence). Valid sparse decisions are retained with their submitted image dependencies; omit unchanged decisions in later calls. Defer the whole-view judgment until a final candidate is ready, while recording local results as they become available.',
    inputSchema: {
      'x-design-input-scope': {
        operations: '/oneOf',
        operationGroups: '/oneOf',
        usage: reviewUsage,
        selection: reviewUsage.selection,
        queryExample: { operation: 'capture' }
      },
      examples: reviewUsageExamples,
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
    const affectedScopes = new Set<string>()
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
          (key) =>
            ![
              'factId',
              'criterionId',
              'unitId',
              'elementIds',
              'referenceUses'
            ].includes(key)
        )
      )
        throw new Error(
          'Fact bindings require a planned criterion and unique canonical element IDs.'
        )
      const declarations = (
        record(value.criteria) ? value.criteria : plan?.criteria
      ) as Record<string, DesignCriterion> | undefined
      const units = declarations?.[item.criterionId]?.requiredUnits ?? []
      if (
        (item.unitId !== undefined &&
          (!text(item.unitId) || !units.includes(item.unitId))) ||
        (units.length && item.unitId === undefined)
      )
        throw new Error(
          'Fact binding requires an exact declared criterion/unit.'
        )
      const key = JSON.stringify([item.factId, item.criterionId, item.unitId])
      if (keys.has(key)) throw new Error('Duplicate fact binding.')
      keys.add(key)
      if (!isDeepStrictEqual(factBindings.get(key), item)) {
        affectedCriteria.add(item.criterionId)
        affectedScopes.add(
          `check-scope:${visualCheckIdentity(item as unknown as FactBinding)}`
        )
      }
      nextBindings.set(key, {
        factId: item.factId,
        criterionId: item.criterionId,
        ...(item.unitId === undefined ? {} : { unitId: String(item.unitId) }),
        ...(item.referenceUses === undefined
          ? {}
          : {
              referenceUses: structuredClone(
                item.referenceUses as ReferenceUseReceipt[]
              )
            }),
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
          if (changed.has(binding.factId)) {
            affectedCriteria.add(binding.criterionId)
            affectedScopes.add(`check-scope:${visualCheckIdentity(binding)}`)
          }
        }
        const ids = new Set(retained.map((fact) => fact.id))
        for (const binding of nextBindings.values()) {
          for (const receipt of binding.referenceUses ?? [])
            resolveSelectedUse(receipt, 'fact', binding)
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
      affectedDependencies: [...affectedScopes],
      affectedCriterionIds: [...affectedCriteria],
      changedKnownFact,
      unknownImpact
    }
  }
  const bindingRequestId = randomUUID()
  const bindingSecret = randomUUID()
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
  const bindingSignature = (
    phase: string,
    check: Record<string, unknown>,
    binding: Record<string, unknown>
  ) =>
    createHmac('sha256', bindingSecret)
      .update(
        JSON.stringify({
          phase,
          criterionId: check.criterionId,
          unitId: check.unitId,
          inspectionIds: check.inspectionIds,
          supersedes: check.supersedes,
          referenceUses: check.referenceUses,
          requestId: binding.requestId,
          requirementRevision: binding.requirementRevision,
          checkRevision: binding.checkRevision,
          dependencies: bindingDependencies(check.inspectionIds as string[])
        })
      )
      .digest('hex')
  const bindingDependencies = (ids: string[]) =>
    ids.map((inspectionId) => {
      const image = inspections.get(inspectionId)
      if (!image)
        throw new Error(
          `Review binding evidence ${inspectionId} is unavailable.`
        )
      return {
        inspectionId,
        elementId: image.target,
        scope: image.scope,
        ...(image.source ? { source: structuredClone(image.source) } : {})
      }
    })
  const validateBindings = (value: unknown) => {
    if (!record(value) || !Array.isArray(value.checks) || !value.checks.length)
      throw new Error('Review submission requires exact check bindings.')
    for (const check of value.checks) {
      if (
        !record(check) ||
        !record(check.binding) ||
        !strings(check.inspectionIds)
      )
        throw new Error(
          'Review submission requires a current binding for every check.'
        )
      const binding = check.binding
      resolveCheckUses(check as unknown as ReviewSelection)
      if (
        binding.requestId !== bindingRequestId ||
        binding.requirementRevision !== references.revision() ||
        binding.signature !==
          bindingSignature(String(value.phase), check, binding) ||
        !isDeepStrictEqual(
          binding.dependencies,
          bindingDependencies(check.inspectionIds)
        )
      )
        throw new Error(
          'Review binding is foreign, modified or stale; bind current evidence again.'
        )
      const previous = results.read({
        ids: [
          visualCheckIdentity(check as { criterionId: string; unitId?: string })
        ],
        includePassed: true
      }).items[0]
      const replay =
        previous &&
        previous.status === check.status &&
        previous.evidence === check.evidence &&
        isDeepStrictEqual(previous.scope, check.inspectionIds) &&
        isDeepStrictEqual(previous.supersedes, check.supersedes)
      if (binding.checkRevision !== (previous?.revision ?? 0) && !replay)
        throw new Error(
          `Review binding for ${String(check.criterionId)} is stale; rebind only this check.`
        )
    }
  }
  const mechanicalIssue = () => {
    const pending = results.firstPending('tool')
    return pending
      ? `Mechanical check ${pending.id} remains ${pending.status}; resolve it without resubmitting unchanged visual judgments.`
      : undefined
  }
  const requiredChecks = () =>
    Object.entries(plan?.criteria ?? {}).flatMap(([criterionId, criterion]) =>
      (criterion.requiredUnits?.length
        ? criterion.requiredUnits
        : [undefined]
      ).map((unitId) => ({
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
  const resolveSelectedUse = (
    receipt: ReferenceUseReceipt,
    purpose: ReferencePurpose,
    scope?: { criterionId: string; unitId?: string }
  ) => {
    const entry = references
      .snapshot()
      .find(
        (item) =>
          item.referenceId === receipt.referenceId &&
          plan?.referenceImageIndexes?.includes(item.attachmentIndex)
      )
    if (!entry)
      throw new Error('Reference use is not selected for this request.')
    return references.resolve(receipt, purpose, scope)
  }
  const resolveCheckUses = (check: ReviewSelection) =>
    (check.referenceUses ?? []).map((receipt) =>
      resolveSelectedUse(receipt, 'visual', check)
    )
  const unsupportedFactSources = (sources: string[], binding: FactBinding) =>
    sources.filter((source) => {
      if (!source.startsWith('reference:')) return false
      try {
        return !(binding.referenceUses ?? []).some(
          (receipt) =>
            resolveSelectedUse(receipt, 'fact', binding).receipt.referenceId ===
            source
        )
      } catch {
        return true
      }
    })
  const factSnapshots = () =>
    facts.snapshot().map((fact) => {
      const bindings = [...factBindings.values()].filter(
        (binding) => binding.factId === fact.id
      )
      const imageSources = fact.sources.filter((source) =>
        source.startsWith('reference:')
      )
      const inapplicable = imageSources.filter(
        (source) =>
          !bindings.length ||
          bindings.some(
            (binding) => unsupportedFactSources([source], binding).length > 0
          )
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
  const reviewHandoff = (
    affectedCriterionIds: string[],
    dependencies = affectedCriterionIds.map((id) => `criterion:${id}`)
  ) => {
    results.invalidate(
      dependencies,
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
    const mechanical = results.firstPending('tool')
    const nextMechanical = {
      tool: AiDesignToolIds.READ_DESIGN_CHECKS,
      arguments: { ids: mechanical ? [mechanical.id] : [] },
      instruction:
        'Read the exact pending mechanical evidence and follow its supported repair or recheck contract. Preserve current visual passes; a mechanical blocker does not require a new visual judgment.'
    }
    let next:
      | typeof nextReferences
      | typeof nextReview
      | typeof nextFacts
      | typeof nextMechanical = mechanical ? nextMechanical : nextReview
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
      ...(!accepted || mechanical
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
    deliverChecks: results.deliver,
    resolveReferenceUse: resolveSelectedUse,
    validateCaptureChecks(
      phase: 'structure' | 'visual',
      targets: { checks: Omit<ReviewSelection, 'inspectionIds'>[] }[]
    ) {
      if (!plan)
        throw new Error('Define criteria before requesting review captures.')
      const allowed = new Set(
        (phase === 'structure'
          ? plan.structureCriteria.map((criterionId) => ({ criterionId }))
          : requiredChecks()
        ).map(visualCheckIdentity)
      )
      const intended = new Map<string, unknown>()
      for (const target of targets) {
        if (!Array.isArray(target.checks) || !target.checks.length)
          throw new Error(
            'Each review capture requires explicit check identities.'
          )
        for (const check of target.checks) {
          validateSupersession(check)
          if (!allowed.has(visualCheckIdentity(check)))
            throw new Error(
              'Review capture requires an exact declared criterion/unit identity.'
            )
          resolveCheckUses({ ...check, inspectionIds: [] })
          const key = visualCheckIdentity(check)
          if (intended.has(key) && !isDeepStrictEqual(intended.get(key), check))
            throw new Error(
              'Conflicting source uses or supersession for one capture check.'
            )
          intended.set(key, structuredClone(check))
        }
      }
    },
    bindReview(phase: 'structure' | 'visual', selections: ReviewSelection[]) {
      const inspectionIds = [
        ...new Set(selections.flatMap((check) => check.inspectionIds))
      ]
      // Use the existing domain preflight; binding never records a judgment.
      this.record(
        {
          phase,
          ...(phase === 'visual' ? { final: false } : {}),
          inspectionIds,
          checks: selections.map((check) => ({
            ...check,
            status: 'unverified',
            evidence: 'Pending primary-agent judgment.'
          }))
        },
        { validateOnly: true }
      )
      const checks = selections.map((check) => {
        resolveCheckUses(check)
        const previous = results.read({
          ids: [visualCheckIdentity(check)],
          includePassed: true
        }).items[0]
        const binding = {
          requestId: bindingRequestId,
          requirementRevision: references.revision(),
          checkRevision: previous?.revision ?? 0,
          dependencies: bindingDependencies(check.inspectionIds)
        }
        return {
          ...structuredClone(check),
          binding: {
            ...binding,
            signature: bindingSignature(phase, { ...check }, binding)
          }
        }
      })
      return {
        phase,
        ...(phase === 'visual' ? { final: false } : {}),
        inspectionIds,
        checks
      }
    },
    validateBoundReview(value: unknown) {
      validateBindings(value)
      return this.validateReview(value)
    },
    recordBoundReview(value: unknown) {
      validateBindings(value)
      return this.record(value)
    },
    coverage: () => reviewState().coverage,
    judgmentHandoff(
      inspectionIds: string[],
      phase: 'structure' | 'visual',
      selections?: ReviewSelection[]
    ) {
      if (!plan)
        return {
          coverage: reviewState().coverage,
          next: {
            tool: AiDesignToolIds.DEFINE_DESIGN_CRITERIA,
            arguments: { phase: 'plan' },
            requiredInputs: reviewPlanRequiredInputs,
            instruction:
              'Define request-linked criteria before binding image evidence.'
          }
        }
      const criteria = plan.criteria
      const acceptanceContext = {
        method: planDeclaration?.method,
        requirementRevision: references.revision(),
        checks: (selections ?? []).flatMap(({ criterionId, unitId }) =>
          criteria[criterionId]
            ? [
                {
                  criterionId,
                  ...(unitId === undefined ? {} : { unitId }),
                  requirement: criteria[criterionId].requirement,
                  description: criteria[criterionId].description
                }
              ]
            : []
        )
      }
      let boundArguments
      try {
        boundArguments = selections
          ? this.bindReview(phase, selections)
          : {
              phase,
              ...(phase === 'visual' ? { final: false } : {}),
              inspectionIds
            }
      } catch (error) {
        // Preserve admitted selections, never infer them from the enclosing images.
        const bindChecks: (Omit<ReviewSelection, 'supersedes'> & {
          supersedes?: { revision: number; reason?: string }
        })[] = structuredClone(selections ?? [])
        const requiredInputs: string[] = []
        if (error instanceof ReviewScopeConflictError) {
          for (const { index, revision } of error.conflicts) {
            bindChecks[index].supersedes = { revision }
            requiredInputs.push(`bindChecks[${index}].supersedes.reason`)
          }
        }
        if (!requiredInputs.length) requiredInputs.push('bindChecks')
        return {
          status: 'failed',
          settlement: 'not-started',
          coverage: reviewState().coverage,
          acceptanceContext,
          next: {
            tool: AiDesignToolIds.REVIEW_DRAWING,
            arguments: {
              phase,
              ...(phase === 'visual' ? { final: false } : {}),
              inspectionIds,
              bindChecks
            },
            requiredInputs,
            instruction:
              'Keep the returned check identities, image assignments and reference uses. Fill the named missing fields with your explicit redesign reasons, or correct the reported invalid selection, then call this tool with next.arguments. Revalidation is mandatory. Binding records no judgments. Do not recapture images, replay edits or resend unrelated passed checks.'
          },
          message:
            `Check binding failed: ${error instanceof Error ? error.message : 'Invalid check binding.'} ` +
            'No judgments were recorded. Successful images and selected checks are retained in next.arguments; complete requiredInputs before rebinding.'
        }
      }
      return {
        coverage: reviewState().coverage,
        acceptanceContext,
        ...(inspectionIds.length
          ? {
              next: {
                tool: AiDesignToolIds.REVIEW_DRAWING,
                arguments: boundArguments,
                requiredInputs: selections
                  ? ['checks[].status', 'checks[].evidence']
                  : ['bindChecks'],
                instruction: selections
                  ? 'Inspect the delivered images, fill status/evidence in each bound check, and submit next.arguments without capture targets. Preserve bindings exactly. Submit only observed checks; keep unrelated passes. Use final=true only to attempt completion from retained current results.'
                  : 'No complete check binding was issued. Explicitly supply bindChecks with criterionId, optional unitId/supersedes and every required delivered inspectionId for each check. Binding does not judge or record anything. Retry failed captures before binding an incomplete scope.'
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
    preparationContext(receipts: ReferenceUseReceipt[] = []) {
      if (!plan)
        throw new Error(
          'Define request-linked criteria before prepared review.'
        )
      const uses = receipts.map((receipt) =>
        resolveSelectedUse(receipt, 'preparation')
      )
      return {
        criteria: Object.fromEntries(
          Object.entries(plan.criteria).map(([id, item]) => [
            id,
            { requirement: item.requirement }
          ])
        ),
        requirementRevision: references.revision(),
        referenceUses: uses,
        sourceAssertions: []
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
      const nextDecisions = references.snapshot()
      const previousSelected = new Set(
        previousDecisions
          .filter((item) =>
            plan?.referenceImageIndexes?.includes(item.attachmentIndex)
          )
          .map((item) => item.referenceId)
      )
      const nextSelected = new Set(
        nextDecisions
          .filter((item) => selected.includes(item.attachmentIndex))
          .map((item) => item.referenceId)
      )
      const changedSelection = new Set(
        [...previousSelected, ...nextSelected].filter(
          (id) => previousSelected.has(id) !== nextSelected.has(id)
        )
      )
      const dependencies = [
        ...new Set([
          ...update.changedDependencies,
          ...[...previousDecisions, ...nextDecisions]
            .filter((item) => changedSelection.has(item.referenceId))
            .flatMap((item) =>
              item.uses.map((use) => referenceUseDependency(use.receipt))
            )
        ])
      ]
      const affected = [
        ...new Set(
          results
            .read({ includePassed: true })
            .items.filter((item) =>
              dependencies.some((key) => Object.hasOwn(item.dependencies, key))
            )
            .flatMap((item) => (item.criterionId ? [item.criterionId] : []))
        )
      ]
      const changed =
        !isDeepStrictEqual(
          [...(plan.referenceImageIndexes ?? [])].sort((a, b) => a - b),
          [...selected].sort((a, b) => a - b)
        ) || update.changedIds.length > 0
      plan.referenceImageIndexes = selected
      if (affected.length || referenceIssues().length) {
        accepted = false
        if (affected.some((id) => plan?.structureCriteria.includes(id)))
          structureAccepted = false
        issue =
          'Reference applicability changed; compare the affected criteria again.'
      }
      return {
        referenceImageIndexes: [...selected],
        changed,
        requirementRevision: references.revision(),
        referenceDecisions: references.snapshot(),
        review: reviewHandoff(affected, dependencies)
      }
    },
    recordCalculations: facts.recordCalculations,
    correctionContext() {
      const coverage = reviewState().coverage
      const pending = new Map(
        results
          .read()
          .items.filter(
            (item) =>
              item.origin === 'main-agent' && item.criterionId !== undefined
          )
          .map((item) => [item.id, item])
      )
      // Coverage can require re-review of a retained pass (for example missing whole-view evidence).
      const missing = coverage.pending.filter((item) => !pending.has(item.id))
      for (const item of results.read({
        ids: missing.map((item) => item.id),
        includePassed: true
      }).items)
        pending.set(item.id, item)
      const obligations = new Map(
        coverage.pending.map((item) => [item.id, item])
      )
      for (const item of pending.values())
        if (!obligations.has(item.id))
          obligations.set(item.id, {
            id: item.id,
            criterionId: item.criterionId as string,
            ...(item.unitId === undefined ? {} : { unitId: item.unitId }),
            status: item.status
          })
      const checks = [...obligations.values()].map((obligation) => {
        const item = pending.get(obligation.id)
        return {
          ...obligation,
          ...(item ? { revision: item.revision, evidence: item.evidence } : {}),
          ...(item?.reason ? { reason: item.reason } : {}),
          inspectionIds: [...(item?.scope ?? [])],
          factElementIds: [
            ...new Set(
              [...factBindings.values()]
                .filter(
                  (binding) =>
                    binding.criterionId === obligation.criterionId &&
                    binding.unitId === obligation.unitId
                )
                .flatMap((binding) => binding.elementIds)
            )
          ]
        }
      })
      const inspectionIds = [
        ...new Set(checks.flatMap((check) => check.inspectionIds))
      ]
      return {
        diagnosticOnly: true,
        coverage,
        referenceDecisions: references.snapshot(),
        requiresFreshReview: !accepted,
        revision,
        checks,
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
        }),
        unavailableInspectionIds: inspectionIds.filter(
          (id) => !inspections.has(id)
        ),
        ...(checks.length
          ? {
              discovery: {
                tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
                arguments: { view: 'full' },
                requiredInputs: ['query'],
                instruction:
                  'Use a known scoped edit directly. Only for a missing contract, fill query with your chosen correction capability or exact registered name and follow its execution route. Image targets/regions and factElementIds are evidence context, not inferred edit targets; target-local regions are not workspace query bounds. Resolve missing current targets through the existing query owner. Choose new values explicitly. Preserve actual partial receipts and retry only unfinished work; never replay completed edits. Reinspect affected evidence and submit only changed checks, retaining unrelated passes and whole-view obligations.'
              }
            }
          : {})
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
            ? {
                review: reviewHandoff(
                  update.affectedCriterionIds,
                  update.affectedDependencies
                )
              }
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
        const scoped = Object.entries(declared).filter(
          ([, item]) => item.requiredUnits !== undefined
        )
        if (
          Object.values(declared).some(
            (item) =>
              item.verification === 'visual' && item.requiredUnits === undefined
          )
        )
          throw new Error(
            'Every visual criterion requires explicit requiredUnits: [] for whole-view, or stable regional unit IDs. No plan was stored.'
          )
        const partitioned = scoped.filter(
          ([, item]) => item.requiredUnits?.length
        )
        if (
          scoped.some(
            ([id, item]) =>
              item.verification !== 'visual' ||
              (structureCriteria.includes(id) &&
                !!item.requiredUnits?.length) ||
              !strings(item.requiredUnits) ||
              item.requiredUnits.length > 24 ||
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
              item.verification === 'visual' && item.requiredUnits?.length === 0
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
        reviewInspectionIds(value).some((id) => !inspections.has(id))
      )
        throw new Error(
          'Use current inspection IDs for referenced evidence and an existing declared plan.'
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
        !reviewInspectionIds(value).some((id) => inspections.get(id)?.overview)
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
              .filter(
                (binding) =>
                  binding.criterionId === check.criterionId &&
                  binding.unitId === check.unitId
              )
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
      for (const check of checks) {
        resolveCheckUses(check)
        if (
          check.status === 'pass' &&
          [...factBindings.values()].some(
            (binding) =>
              binding.criterionId === check.criterionId &&
              binding.unitId === check.unitId &&
              facts
                .snapshot()
                .some(
                  (fact) =>
                    fact.id === binding.factId &&
                    unsupportedFactSources(fact.sources, binding).length > 0
                )
          )
        )
          throw new Error(
            'Current explicit fact-purpose reference uses are required before passing this check.'
          )
      }
      const submittedScopes = new Map<string, readonly string[]>()
      for (const check of value.checks) {
        const requiredUnits = plan.criteria[check.criterionId]?.requiredUnits
        if (
          check.unitId !== undefined &&
          !requiredUnits?.includes(check.unitId)
        )
          throw new Error(
            'Use an exact declared unit; whole-view criteria do not accept regional unit IDs.'
          )
        if (
          requiredUnits?.length &&
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
          !strings(check.inspectionIds) ||
          !check.inspectionIds.length ||
          new Set(check.inspectionIds).size !== check.inspectionIds.length ||
          check.inspectionIds.some(
            (id: string) => !(value.inspectionIds as string[]).includes(id)
          )
        )
          throw new Error(
            'Each check.inspectionIds must be a nonempty unique subset of the current review images.'
          )
      }
      const scopeConflicts: {
        index: number
        revision: number
        message: string
      }[] = []
      for (const [index, check] of value.checks.entries()) {
        validateSupersession(check)
        if (check.unitId === undefined) continue
        const key = visualCheckIdentity(check)
        const scope = [
          ...new Set<string>(
            check.inspectionIds.map((id: string) => {
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
              JSON.stringify(check.inspectionIds)
          if (!previous)
            throw new Error(
              'Unit supersession revision is stale or unavailable.'
            )
          if (previous.revision !== check.supersedes.revision && !exactReplay) {
            scopeConflicts.push({
              index,
              revision: previous.revision,
              message: 'Unit supersession revision is stale or unavailable.'
            })
            continue
          }
        }
        if (changedScope && !check.supersedes) {
          if (!previous)
            throw new Error('Unit scope has no current result revision.')
          scopeConflicts.push({
            index,
            revision: previous.revision,
            message: `Check unit scope changed for ${check.criterionId}/${check.unitId}; provide supersedes with the current result revision ${previous.revision} and redesign reason. No judgments were recorded.`
          })
          continue
        }
        submittedScopes.set(
          key,
          check.supersedes || !originalScope ? scope : originalScope
        )
      }
      if (scopeConflicts.length)
        throw new ReviewScopeConflictError(scopeConflicts)
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
          scope: check.inspectionIds
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
      const recordedChecks: Pick<
        DesignCheckResult,
        'id' | 'criterionId' | 'unitId' | 'origin' | 'status' | 'revision'
      >[] = []
      for (const check of checks) {
        if (!suppliedIds.has(visualCheckIdentity(check))) continue
        const supersedes =
          check.supersedes ??
          results.read({
            ids: [visualCheckIdentity(check)],
            includePassed: true
          }).items[0]?.supersedes
        const checkRevision = results.record({
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
          scope: [...check.inspectionIds],
          dependencies: {
            [`check-scope:${visualCheckIdentity(check)}`]: 'current',
            ...(check.unitId === undefined &&
            plan.criteria[check.criterionId].verification === 'visual'
              ? { [wholeViewCoverageDependency]: 'required' }
              : {}),
            ...Object.fromEntries(
              check.inspectionIds.map((id: string) => [
                `inspection:${id}`,
                String(inspections.get(id)?.source?.revision ?? revision)
              ])
            ),
            ...Object.fromEntries(
              [
                ...(check.referenceUses ?? []),
                ...[...factBindings.values()]
                  .filter(
                    (item) =>
                      item.criterionId === check.criterionId &&
                      item.unitId === check.unitId
                  )
                  .flatMap((item) => item.referenceUses ?? [])
              ].map((receipt: ReferenceUseReceipt) => [
                referenceUseDependency(receipt),
                String(receipt.revision)
              ])
            ),
            [`criterion:${check.criterionId}`]: String(references.revision())
          }
        })
        recordedChecks.push({
          id: visualCheckIdentity(check),
          criterionId: check.criterionId,
          ...(check.unitId === undefined ? {} : { unitId: check.unitId }),
          origin: 'main-agent',
          status: check.status as 'pass' | 'fail' | 'unverified',
          revision: checkRevision
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
          reviewOperation: 'record' as const,
          recordedChecks,
          results: results.deliver(),
          facts: factSnapshots(),
          deferredDetails: [...deferredDetails.values()],
          revision,
          accepted: this.isAccepted(),
          structureAccepted,
          checks,
          inspectionIds: value.inspectionIds,
          correction: this.correctionContext()
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
        reviewOperation: 'record' as const,
        recordedChecks,
        results: results.deliver(),
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
        correction: this.correctionContext()
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
