import { detachAiJsonValue } from './json-value.js'
import type {
  AiInvocationContext,
  AiInvocationMiddleware
} from './invocation.js'
import type { AiActionDescription, AiJsonValue } from './types.js'

export interface AiToolContractInput {
  name: string
  description: string
  revision: number
  inputSchema: unknown
  outputSchema: unknown
  /** A distinct partial receipt shape; omitted when both outcomes share a shape. */
  partialOutputSchema?: unknown
  /** Usable recovery data on failed/unknown outcomes; never a success fallback. */
  recoveryOutputSchema?: unknown
  /** Owner-produced external view; internal consumers retain the complete result. */
  delivery?: {
    path: string
    outputSchema: unknown
    receipt?: { path: string; owner: string }
  }
  /** Domain-owned mechanical verdict paths; not visual acceptance. */
  verification?: { statusPath: string; progressPath: string }
  effect: 'read' | 'prepare' | 'mutation' | 'external'
  resources: readonly string[]
  /** Only explicitly admitted data-plane tools can be recipe dependencies. */
  composition?: 'allowed' | 'control-plane'
  lifecycle: {
    cancellation: 'cooperative' | 'before-dispatch'
    retry: 'never' | 'read-only' | 'reconcile'
    output: 'value' | 'request-artifact' | 'document-artifact'
  }
}

export interface AiToolContract {
  readonly name: string
  readonly description: string
  readonly revision: number
  readonly inputSchema: AiJsonValue
  readonly outputSchema: AiJsonValue
  readonly partialOutputSchema?: AiJsonValue
  readonly recoveryOutputSchema?: AiJsonValue
  readonly delivery?: Readonly<{
    path: string
    outputSchema: AiJsonValue
    receipt?: Readonly<{ path: string; owner: string }>
  }>
  readonly verification?: Readonly<
    NonNullable<AiToolContractInput['verification']>
  >
  readonly effect: AiToolContractInput['effect']
  readonly resources: readonly string[]
  readonly composition?: 'allowed' | 'control-plane'
  readonly lifecycle: Readonly<AiToolContractInput['lifecycle']>
}

/** Invocation phase is supplied by the boundary, not inferred from the value. */
export type AiToolValidator = (
  value: unknown,
  schema: AiJsonValue,
  context?: { readonly stage: 'input' | 'output' }
) => string | undefined

export interface AiToolOutcome {
  readonly status: 'success' | 'partial' | 'failed' | 'unknown'
  readonly settlement: 'not-started' | 'completed' | 'partial' | 'unknown'
}

export type AiToolResultInspection =
  | (AiToolOutcome & { readonly value: unknown })
  | {
      readonly status: 'invalid'
      readonly settlement: AiToolOutcome['settlement']
      readonly reportedStatus: AiToolOutcome['status']
      readonly issue: string
      readonly value: unknown
    }

const nonempty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const registeredContracts = new WeakSet<object>()

/** One portable descriptor; host validators retain authority over schema semantics. */
export const createAiToolContract = (
  input: AiToolContractInput
): AiToolContract => {
  if (registeredContracts.has(input)) {
    return input as AiToolContract
  }
  if (
    !nonempty(input.name) ||
    !nonempty(input.description) ||
    !Number.isSafeInteger(input.revision) ||
    input.revision < 1
  ) {
    throw new TypeError(
      'Tool identity, description and positive contract revision are required'
    )
  }
  if (!['read', 'prepare', 'mutation', 'external'].includes(input.effect)) {
    throw new TypeError('Unknown tool effect')
  }
  if (
    input.delivery !== undefined &&
    (!input.delivery ||
      !['outputSchema,path', 'outputSchema,path,receipt'].includes(
        Object.keys(input.delivery).sort().join(',')
      ) ||
      typeof input.delivery.path !== 'string' ||
      !/^(?:\/(?:[^~]|~[01])*)+$/.test(input.delivery.path))
  ) {
    throw new TypeError(
      'Delivery requires an exact JSON Pointer and output schema'
    )
  }
  if (
    !Array.isArray(input.resources) ||
    !input.resources.every(nonempty) ||
    new Set(input.resources).size !== input.resources.length
  ) {
    throw new TypeError('Tool resources must be unique non-empty names')
  }
  if (
    input.composition !== undefined &&
    !['allowed', 'control-plane'].includes(input.composition)
  ) {
    throw new TypeError('Invalid composition eligibility')
  }
  if (
    input.verification !== undefined &&
    (!input.verification ||
      !['read', 'prepare'].includes(input.effect) ||
      Object.keys(input.verification).length !== 2 ||
      !['statusPath', 'progressPath'].every((key) => {
        const path = input.verification?.[key as 'statusPath' | 'progressPath']
        return typeof path === 'string' && /^(?:\/(?:[^~]|~[01])*)+$/.test(path)
      }) ||
      input.verification.statusPath === input.verification.progressPath)
  ) {
    throw new TypeError(
      'Verification requires distinct JSON Pointer paths on a read or prepare tool'
    )
  }
  if (
    input.delivery?.receipt !== undefined &&
    (!input.delivery.receipt ||
      Object.keys(input.delivery.receipt).sort().join(',') !== 'owner,path' ||
      !nonempty(input.delivery.receipt.owner) ||
      typeof input.delivery.receipt.path !== 'string' ||
      !/^(?:\/(?:[^~]|~[01])*)+$/.test(input.delivery.receipt.path))
  ) {
    throw new TypeError(
      'Delivery receipt requires an exact path and owning adapter'
    )
  }
  const lifecycle = input.lifecycle
  if (
    !lifecycle ||
    !['cooperative', 'before-dispatch'].includes(lifecycle.cancellation) ||
    !['never', 'read-only', 'reconcile'].includes(lifecycle.retry) ||
    !['value', 'request-artifact', 'document-artifact'].includes(
      lifecycle.output
    )
  ) {
    throw new TypeError('Invalid tool lifecycle')
  }
  if (lifecycle.retry === 'read-only' && input.effect !== 'read') {
    throw new TypeError('Only read tools can declare read-only retry')
  }
  const contract = Object.freeze({
    name: input.name,
    description: input.description,
    revision: input.revision,
    inputSchema: detachAiJsonValue(input.inputSchema),
    outputSchema: detachAiJsonValue(input.outputSchema),
    ...(input.delivery === undefined
      ? {}
      : {
          delivery: Object.freeze({
            path: input.delivery.path,
            outputSchema: detachAiJsonValue(input.delivery.outputSchema),
            ...(input.delivery.receipt
              ? { receipt: Object.freeze({ ...input.delivery.receipt }) }
              : {})
          })
        }),
    ...(input.partialOutputSchema === undefined
      ? {}
      : { partialOutputSchema: detachAiJsonValue(input.partialOutputSchema) }),
    ...(input.recoveryOutputSchema === undefined
      ? {}
      : {
          recoveryOutputSchema: detachAiJsonValue(input.recoveryOutputSchema)
        }),
    ...(input.verification
      ? { verification: Object.freeze({ ...input.verification }) }
      : {}),
    effect: input.effect,
    resources: Object.freeze([...input.resources]),
    lifecycle: Object.freeze({ ...lifecycle }),
    ...(input.composition === undefined
      ? {}
      : { composition: input.composition })
  })
  registeredContracts.add(contract)
  return contract
}

/** Provider wire formats need not receive host-only lifecycle or output metadata. */
export const describeAiTool = (contract: AiToolContract): AiActionDescription =>
  Object.freeze({
    name: contract.name,
    description: contract.description,
    inputSchema: contract.inputSchema
  })

/** Select one outcome's declared value shape for validation and resource export. */
export const selectAiToolResultSchema = (
  contract: Pick<
    AiToolContract,
    'outputSchema' | 'partialOutputSchema' | 'recoveryOutputSchema'
  >,
  status: AiToolOutcome['status']
): AiJsonValue | undefined => {
  if (status === 'success') {
    return contract.outputSchema
  }
  if (status === 'partial') {
    return contract.partialOutputSchema ?? contract.outputSchema
  }
  return contract.recoveryOutputSchema
}

/** Preserve local reference scope when a canonical schema enters a receipt envelope. */
export const embedAiToolSchema = (
  schema: AiJsonValue,
  pointer: string
): AiJsonValue => {
  if (!pointer.startsWith('#/')) {
    throw new TypeError('Schema embedding requires a local destination pointer')
  }
  const visit = (value: AiJsonValue): AiJsonValue => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return value
    }
    const result: Record<string, AiJsonValue> = {
      ...(value as Readonly<Record<string, AiJsonValue>>)
    }
    if (
      typeof result.$ref === 'string' &&
      (result.$ref === '#' || result.$ref.startsWith('#/'))
    ) {
      result.$ref = pointer + result.$ref.slice(1)
    }
    for (const key of [
      '$defs',
      'definitions',
      'properties',
      'patternProperties',
      'dependentSchemas',
      'dependencies'
    ]) {
      const map = result[key]
      if (map && typeof map === 'object' && !Array.isArray(map)) {
        result[key] = Object.fromEntries(
          Object.entries(map).map(([name, child]) => [name, visit(child)])
        )
      }
    }
    for (const key of [
      'allOf',
      'anyOf',
      'oneOf',
      'prefixItems',
      'items',
      'additionalItems',
      'additionalProperties',
      'unevaluatedProperties',
      'unevaluatedItems',
      'contains',
      'propertyNames',
      'not',
      'if',
      'then',
      'else'
    ]) {
      const child = result[key]
      if (child !== undefined) {
        result[key] = Array.isArray(child) ? child.map(visit) : visit(child)
      }
    }
    return result
  }
  return visit(schema)
}

/** Inspects evidence only. It cannot execute, retry, roll back or grant authority. */
export const inspectAiToolResult = (
  contract: AiToolContract,
  value: unknown,
  options: {
    outcome: AiToolOutcome
    validate: AiToolValidator
  }
): AiToolResultInspection => {
  const { outcome } = options
  const validStatus =
    outcome &&
    ['success', 'partial', 'failed', 'unknown'].includes(outcome.status)
  const validSettlement =
    outcome &&
    ['not-started', 'completed', 'partial', 'unknown'].includes(
      outcome.settlement
    )
  if (!validStatus || !validSettlement) {
    return {
      status: 'invalid',
      settlement: validSettlement ? outcome.settlement : 'unknown',
      reportedStatus: validStatus ? outcome.status : 'unknown',
      issue: 'Host returned an invalid tool outcome or settlement',
      value
    }
  }
  const schema = selectAiToolResultSchema(contract, outcome.status)
  if (schema === undefined) {
    return { ...outcome, value }
  }
  let issue: string | undefined
  try {
    issue = options.validate(value, schema, { stage: 'output' })
  } catch (error) {
    issue = error instanceof Error ? error.message : String(error)
    if (!issue) {
      issue = 'Tool result validation failed'
    }
  }
  return issue
    ? {
        status: 'invalid',
        settlement: outcome.settlement,
        reportedStatus: outcome.status,
        issue,
        value
      }
    : { ...outcome, value }
}

export class AiToolContractError extends Error {
  constructor(
    readonly stage: 'registration' | 'input' | 'output',
    message: string,
    readonly inspection?: AiToolResultInspection
  ) {
    super(message)
    this.name = 'AiToolContractError'
  }
}

/** Uses the host's registry and schema authority at the existing invocation boundary. */
export const createAiToolMiddleware =
  <T>(options: {
    resolve: (name: string) => AiToolContract | undefined
    validate: AiToolValidator
    classify: (value: T, call: AiInvocationContext) => AiToolOutcome
    selectValue?: (value: T) => unknown
  }): AiInvocationMiddleware<T> =>
  async (call, next) => {
    const contract = options.resolve(call.name)
    if (!contract) {
      throw new AiToolContractError(
        'registration',
        `Tool contract unavailable: ${call.name}`
      )
    }
    let issue: string | undefined
    try {
      issue = options.validate(call.input, contract.inputSchema, {
        stage: 'input'
      })
    } catch (error) {
      issue = error instanceof Error ? error.message : String(error)
      if (!issue) {
        issue = 'Tool input validation failed'
      }
    }
    if (issue) {
      throw new AiToolContractError('input', issue)
    }
    const value = await next()
    let outcome: AiToolOutcome
    let selectedValue: unknown
    try {
      outcome = options.classify(value, call)
      selectedValue = options.selectValue ? options.selectValue(value) : value
    } catch (error) {
      if (error instanceof AiToolContractError && error.stage === 'output') {
        throw error
      }
      throw new AiToolContractError(
        'output',
        error instanceof Error
          ? error.message
          : 'Tool outcome classification failed',
        { status: 'unknown', settlement: 'unknown', value }
      )
    }
    const inspection = inspectAiToolResult(contract, selectedValue, {
      outcome,
      validate: options.validate
    })
    if (inspection.status === 'invalid') {
      throw new AiToolContractError('output', inspection.issue, inspection)
    }
    return value
  }
