import { AiToolContractError, embedAiToolSchema } from '@asyra/ai-agent-runtime'
import { AiActionNames } from '../constants/ai-actions'
import type {
  AiJsonValue,
  AiToolContractInput,
  AiToolOutcome
} from '@asyra/ai-agent-runtime'

export const toolResultString = { type: 'string', minLength: 1 }
export const toolRequestReference = {
  ...toolResultString,
  maxLength: 160,
  'x-runtime-value': 'request'
}
export const toolDocumentReference = {
  ...toolResultString,
  'x-runtime-value': 'document'
}
export const toolDocumentReferences = {
  type: 'array',
  items: toolDocumentReference
}
export const toolResultIds = { type: 'array', items: toolResultString }
export const toolResultCount = { type: 'integer', minimum: 0 }
export const toolResultBoolean = { type: 'boolean' }
export const toolResultStatus = {
  enum: ['complete', 'no-change', 'partial', 'failed']
}

/** Open domain receipts preserve owner extensions; declared fields remain required. */
export const toolResultObject = (
  properties: Record<string, unknown>,
  required = Object.keys(properties)
) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: true
})

/** Canonical write coverage, independent from product values or visual acceptance. */
export const toolMutationScope = toolResultObject({
  complete: { type: 'boolean' },
  elementIds: toolDocumentReferences,
  removedElementIds: toolDocumentReferences
})

/** Metadata belongs to the definition owner, never a parallel name-based catalog. */
export const toolSemantics = (
  outputSchema: unknown,
  effect: AiToolContractInput['effect'],
  resources: readonly string[],
  output: AiToolContractInput['lifecycle']['output'] = 'value'
): Pick<
  AiToolContractInput,
  | 'revision'
  | 'outputSchema'
  | 'partialOutputSchema'
  | 'effect'
  | 'resources'
  | 'lifecycle'
> => ({
  revision: 2,
  outputSchema,
  partialOutputSchema: {
    anyOf: [
      embedAiToolSchema(outputSchema as AiJsonValue, '#/anyOf/0'),
      toolResultObject({
        available: { const: false },
        recoverable: { const: true },
        code: toolResultString,
        message: toolResultString,
        settlement: {
          enum: ['not-started', 'completed', 'partial', 'unknown']
        },
        executionResult: {
          anyOf: [
            toolResultObject({ actionResults: { type: 'array', minItems: 1 } }),
            toolResultObject({ batches: { type: 'array', minItems: 1 } })
          ]
        }
      })
    ]
  },
  effect,
  resources,
  lifecycle: { cancellation: 'cooperative', retry: 'never', output }
})

/** Browser owners return declared receipts; this records execution, not visual quality. */
export const designActionOutcome = (value: unknown): AiToolOutcome => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new AiToolContractError(
      'output',
      'The browser action returned no structured receipt',
      {
        status: 'invalid',
        reportedStatus: 'unknown',
        settlement: 'unknown',
        issue: 'The browser action returned no structured receipt',
        value
      }
    )
  const result = value as Record<string, unknown>
  const reportedSettlement = [
    'not-started',
    'completed',
    'partial',
    'unknown'
  ].includes(String(result.settlement))
    ? (result.settlement as AiToolOutcome['settlement'])
    : undefined
  if (
    result.delivery &&
    typeof result.delivery === 'object' &&
    (result.delivery as Record<string, unknown>).status === 'unavailable'
  )
    return {
      status: 'partial',
      settlement: ['complete', 'no-change'].includes(String(result.status))
        ? 'completed'
        : (reportedSettlement ?? 'unknown')
    }
  if (result.status === 'unknown')
    return { status: 'unknown', settlement: reportedSettlement ?? 'unknown' }
  if (result.status === 'partial' || result.complete === false)
    return { status: 'partial', settlement: reportedSettlement ?? 'partial' }
  if (
    result.status === 'failed' ||
    result.available === false ||
    result.applicable === false
  )
    return {
      status: 'failed',
      settlement: reportedSettlement ?? 'unknown'
    }
  return { status: 'success', settlement: reportedSettlement ?? 'completed' }
}

/** Canonical effect metadata shared by browser definitions and native wrappers. */
const actionEffects: Record<
  string,
  Pick<AiToolContractInput, 'effect' | 'resources'>
> = {
  [AiActionNames.INSERT_VECTOR_COMPOSITION]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.UPDATE_COMPOSITION_ELEMENTS]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.REMOVE_AI_COMPOSITION]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.REPLACE_VECTOR_COMPOSITION]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE]: {
    effect: 'prepare',
    resources: ['request']
  },
  [AiActionNames.SET_ELEMENT_VISIBILITY]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.SELECT_ELEMENTS]: {
    effect: 'mutation',
    resources: ['selection']
  },
  [AiActionNames.REQUEST_CLARIFICATION]: {
    effect: 'prepare',
    resources: ['request']
  },
  [AiActionNames.REPORT_OUTCOME]: { effect: 'prepare', resources: ['request'] },
  [AiActionNames.ARRANGE_DESIGN]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.ORGANIZE_DESIGN]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.UPDATE_DESIGN_ELEMENT]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.REVIEW_DESIGN]: { effect: 'read', resources: ['document'] },
  [AiActionNames.READ_DESIGN_ATTACHMENT]: {
    effect: 'read',
    resources: ['document']
  },
  [AiActionNames.RESOLVE_DESIGN_TARGETS]: {
    effect: 'read',
    resources: ['document']
  },
  [AiActionNames.READ_DESIGN_CONTEXT]: {
    effect: 'read',
    resources: ['document']
  },
  [AiActionNames.APPLY_PREPARED_DESIGN]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.RELEASE_DESIGN_CONTEXT]: {
    effect: 'prepare',
    resources: ['request']
  },
  [AiActionNames.MAP_RETAINED_FILLS]: {
    effect: 'mutation',
    resources: ['document']
  },
  [AiActionNames.INSPECT_DRAWING]: { effect: 'read', resources: ['document'] },
  [AiActionNames.VALIDATE_INSPECTION_EVIDENCE]: {
    effect: 'read',
    resources: ['document']
  }
}
export const actionToolSemantics = (name: string, outputSchema: unknown) => {
  const metadata = actionEffects[name]
  if (!metadata) throw new Error(`No declared action effects: ${name}`)
  return toolSemantics(outputSchema, metadata.effect, metadata.resources)
}
