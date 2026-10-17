import { recipeExecutionSteps } from './recipe-format.js'
import {
  createAiInvoker,
  type AiInvocation,
  type AiInvocationContext,
  type AiInvocationEvent
} from './invocation.js'
import {
  AiToolContractError,
  createAiToolContract,
  createAiToolMiddleware,
  embedAiToolSchema,
  selectAiToolResultSchema,
  type AiToolContract,
  type AiToolOutcome
} from './tool-contract.js'
import type {
  AiJsonValue,
  AiRegisteredActionDefinition,
  AiVersionedActionRegistry
} from './types.js'
import type {
  AdmittedAiRecipe,
  AiRecipeBinding,
  AiRecipeStep
} from './recipe-types.js'
import { recipeOwn, recipePointer, recipeRecord } from './recipe-schema.js'

export interface AiRecipeCallReceipt extends AiToolOutcome {
  readonly callId: string
  readonly name: string
  readonly revision: number
}
export interface AiRecipeExecutionResult extends AiToolOutcome {
  readonly value?: unknown
  readonly calls: readonly AiRecipeCallReceipt[]
  readonly issues: readonly string[]
  /** Validated stopped-work receipts, never successful successor bindings. */
  readonly recovery?: readonly AiRecipeRecovery[]
}
export interface AiRecipeRecovery extends AiRecipeCallReceipt {
  readonly value: unknown
}

/** Derive recovery transport from exact registered dependencies, not observed field names. */
export const createAiRecipeRecoverySchema = (
  contracts: readonly AiToolContract[]
): AiJsonValue => ({
  type: 'array',
  items: {
    anyOf: contracts
      .flatMap((contract) =>
        (['success', 'partial', 'failed', 'unknown'] as const).flatMap(
          (status) => {
            const schema = selectAiToolResultSchema(contract, status)
            return schema === undefined
              ? []
              : [
                  {
                    type: 'object',
                    required: [
                      'callId',
                      'name',
                      'revision',
                      'status',
                      'settlement',
                      'value'
                    ],
                    properties: {
                      callId: { type: 'string', minLength: 1 },
                      name: { const: contract.name },
                      revision: { const: contract.revision },
                      status: { const: status },
                      settlement: {
                        enum: ['not-started', 'completed', 'partial', 'unknown']
                      },
                      value: schema
                    }
                  }
                ]
          }
        )
      )
      .map((branch, index) => ({
        ...branch,
        properties: {
          ...branch.properties,
          value: embedAiToolSchema(
            branch.properties.value,
            `#/items/anyOf/${index}/properties/value`
          )
        }
      }))
  }
})
export interface AiRecipeLeaseAdapter {
  open(input: {
    requestId: string
    callId: string
    parentCallId?: string
    input: unknown
    inputSchema: AiJsonValue
  }): Promise<void>
  retain(input: {
    requestId: string
    fromCallId: string
    toCallId?: string
    value: unknown
    outputSchema: AiJsonValue
  }): Promise<void>
  release(input: { requestId: string; callId: string }): Promise<void>
}
export type AiRecipeInvocationEvent =
  AiInvocationEvent<AiRecipeExecutionResult> & {
    /** Actual pinned revision; unavailable before root admission is not fabricated. */
    readonly revision?: number
    /** Present only for a step actually dispatched by an admitted parent recipe. */
    readonly recipeStep?: {
      readonly name: string
      readonly revision: number
      readonly id: string
      readonly iteration?: number
    }
  }
export interface AiRecipeInvokerOptions {
  readonly registry: AiVersionedActionRegistry
  readonly recipe: (
    name: string,
    revision: number
  ) => AdmittedAiRecipe | undefined
  readonly validate: (value: unknown, schema: AiJsonValue) => string | undefined
  /** This is the host's existing permission, freshness and scheduler boundary. */
  readonly execute: (
    call: AiInvocationContext,
    definition: AiRegisteredActionDefinition
  ) => Promise<AiToolOutcome & { readonly value?: unknown }>
  readonly leases: AiRecipeLeaseAdapter
  readonly maxSteps: number
  readonly observe?: (event: AiRecipeInvocationEvent) => void | Promise<void>
}
interface RecipeExecutionEvidence {
  readonly recipe: AdmittedAiRecipe
  readonly requestId: string
  readonly callId: string
  readonly children: readonly AiRecipeExecutionResult[]
}
const executionEvidence = new WeakMap<object, RecipeExecutionEvidence>()
/** Internal evidence lookup; a caller-authored JSON receipt is not proof. */
export const getRecipeExecutionEvidence = (
  result: AiRecipeExecutionResult
): RecipeExecutionEvidence | undefined => executionEvidence.get(result)

interface PinnedNode {
  readonly definition: AiRegisteredActionDefinition
  readonly recipe?: AdmittedAiRecipe
  readonly children: readonly PinnedNode[]
}
const message = (error: unknown) =>
  (error instanceof Error ? error.message : String(error)).slice(0, 400)
const completed = (result: AiToolOutcome) =>
  result.status === 'success' &&
  (result.settlement === 'completed' || result.settlement === 'not-started')
const at = (value: unknown, pointer: string): unknown => {
  let current = value
  for (const key of recipePointer(pointer)) {
    if (
      (recipeRecord(current) || Array.isArray(current)) &&
      recipeOwn(current, key)
    )
      current = (current as Record<string, unknown>)[key]
    else throw new Error('An actual output is missing a validated binding path')
  }
  return current
}
const bind = (
  binding: AiRecipeBinding,
  input: unknown,
  outputs: ReadonlyMap<string, unknown>,
  state?: unknown
): unknown => {
  switch (binding.kind) {
    case 'state':
      return at(state, binding.path)
    case 'input':
      return at(input, binding.path)
    case 'step':
      if (!outputs.has(binding.step))
        throw new Error('A required prior result is unavailable')
      return at(outputs.get(binding.step), binding.path)
    case 'literal':
      return binding.value
    case 'array':
      return binding.items.map((item) => bind(item, input, outputs, state))
    case 'object':
      return Object.fromEntries(
        Object.entries(binding.fields).map(([name, item]) => [
          name,
          bind(item, input, outputs, state)
        ])
      )
  }
}

/** One registry and invoker for both variants; only leaves reach the host scheduler. */
export const createAiRecipeInvoker = (options: AiRecipeInvokerOptions) => {
  if (!Number.isSafeInteger(options.maxSteps) || options.maxSteps < 1)
    throw new TypeError('Execution needs a finite step budget')
  return {
    async invoke(
      request: AiInvocation & { requestId: string; revision?: number }
    ): Promise<AiRecipeExecutionResult> {
      const records: AiRecipeCallReceipt[] = []
      const exportedSchemas = new WeakMap<
        AiRecipeExecutionResult,
        AiJsonValue
      >()
      const recoverySchemas = new WeakMap<AiRecipeRecovery, AiJsonValue>()
      const signal = request.signal ?? new AbortController().signal
      let expanded = 0
      const pin = (
        name: string,
        revision: number | undefined,
        ancestors: ReadonlySet<string>,
        multiplier = 1
      ): PinnedNode => {
        signal.throwIfAborted()
        const entry = options.registry.registration(name, {
          revision,
          requestId: request.requestId
        })
        if (!entry)
          throw new AiToolContractError(
            'registration',
            'An exact registered tool is unavailable for this request'
          )
        const identity = JSON.stringify([name, entry.definition.revision])
        if (ancestors.has(identity))
          throw new Error('Composition dependency cycle')
        if (entry.kind === 'primitive')
          return { definition: entry.definition, children: [] }
        const recipe = options.recipe(name, entry.definition.revision)
        if (
          !recipe ||
          JSON.stringify(createAiToolContract(entry.definition)) !==
            JSON.stringify(recipe.contract)
        )
          throw new Error(
            'Registered composition contract does not match its admitted recipe'
          )
        const next = new Set([...ancestors, identity])
        const pinStep = (step: AiRecipeStep, weight: number) => {
          expanded += weight
          if (!Number.isSafeInteger(expanded) || expanded > options.maxSteps)
            throw new Error('Expanded composition exceeds the execution budget')
          const child = pin(step.tool, step.revision, next, weight)
          const expected = recipe.dependencies.find(
            (item) => item.name === step.tool && item.revision === step.revision
          )
          if (
            !expected ||
            JSON.stringify(createAiToolContract(child.definition)) !==
              JSON.stringify(expected)
          )
            throw new Error('Dependency contract changed since admission')
          return child
        }
        const children = recipeExecutionSteps(recipe.recipe).map(
          ({ step, weight }) => pinStep(step, multiplier * weight)
        )
        return { definition: entry.definition, recipe, children }
      }
      const run = async (
        call: AiInvocation,
        supplied?: PinnedNode,
        recipeStep?: AiRecipeInvocationEvent['recipeStep']
      ): Promise<AiRecipeExecutionResult> => {
        let node = supplied
        let callId = call.callId ?? ''
        let opened = false
        let dispatched = false
        let observed: AiRecipeExecutionResult | undefined
        const start = records.length
        const issues: string[] = []
        const children: AiRecipeExecutionResult[] = []
        const recovery: AiRecipeRecovery[] = []
        const transferredRecovery = new Set<AiRecipeRecovery>()
        let exportedSchema: AiJsonValue | undefined
        const aggregateFailure = (
          settlement: AiToolOutcome['settlement']
        ): AiRecipeExecutionResult => {
          const descendants = records.slice(start)
          let combined = settlement
          if (
            descendants.some((item) => item.settlement === 'unknown') ||
            settlement === 'unknown'
          )
            combined = 'unknown'
          else if (
            descendants.some((item) => item.settlement !== 'not-started')
          )
            combined = 'partial'
          return {
            status: combined === 'unknown' ? 'unknown' : 'failed',
            settlement: combined,
            calls: descendants,
            ...(recovery.length ? { recovery: [...recovery] } : {}),
            issues
          }
        }
        const invoker = createAiInvoker<AiRecipeExecutionResult>({
          observe: (event) => {
            callId = event.call.callId
            return options.observe?.({
              ...event,
              ...(node ? { revision: node.definition.revision } : {}),
              ...(recipeStep ? { recipeStep } : {})
            })
          },
          middleware: [
            async (context, next) => {
              callId = context.callId
              if (!request.requestId?.trim())
                throw new AiToolContractError(
                  'registration',
                  'A current request identity is required'
                )
              node ??= pin(context.name, request.revision, new Set())
              let value: AiRecipeExecutionResult
              let validatedValue = false
              try {
                try {
                  value = await next()
                  validatedValue = true
                } catch (error) {
                  issues.push(message(error))
                  let settlement =
                    observed?.settlement ??
                    (dispatched ? 'unknown' : 'not-started')
                  if (error instanceof AiToolContractError && error.inspection)
                    settlement = error.inspection.settlement
                  value = aggregateFailure(settlement)
                }
                const outputSchema = validatedValue
                  ? selectAiToolResultSchema(node.definition, value.status)
                  : undefined
                if (outputSchema !== undefined) {
                  await options.leases.retain({
                    requestId: request.requestId,
                    fromCallId: context.callId,
                    toCallId: context.parentCallId,
                    value: value.value,
                    outputSchema
                  })
                  exportedSchema = outputSchema
                }
                for (const item of value.recovery ?? []) {
                  const schema = recoverySchemas.get(item)
                  if (schema === undefined)
                    throw new Error(
                      'Recovery receipt lacks validated pinned provenance'
                    )
                  await options.leases.retain({
                    requestId: request.requestId,
                    fromCallId: context.callId,
                    toCallId: context.parentCallId,
                    value: item.value,
                    outputSchema: schema
                  })
                  transferredRecovery.add(item)
                }
              } finally {
                if (opened) {
                  try {
                    await options.leases.release({
                      requestId: request.requestId,
                      callId: context.callId
                    })
                  } catch (error) {
                    issues.push(`Artifact cleanup: ${message(error)}`)
                  }
                }
              }
              return {
                ...value,
                issues: [...new Set([...value.issues, ...issues])]
              }
            },
            createAiToolMiddleware({
              resolve: () => node?.definition,
              validate: options.validate,
              classify: (result) => result,
              selectValue: (result) => result.value
            })
          ],
          execute: async (context) => {
            if (!node) throw new Error('Missing pinned tool')
            opened = true
            await options.leases.open({
              requestId: request.requestId,
              callId: context.callId,
              parentCallId: context.parentCallId,
              input: context.input,
              inputSchema: node.definition.inputSchema
            })
            if (!node.recipe) {
              dispatched = true
              const result = await options.execute(context, node.definition)
              observed = {
                status: result.status,
                settlement: result.settlement,
                value: result.value,
                calls: [],
                issues: []
              }
              return observed
            }
            const parentDefinition = node.definition
            const outputs = new Map<string, unknown>()
            const executeStep = async (
              step: AiRecipeStep,
              pinned: PinnedNode,
              state?: unknown,
              iteration?: number
            ) => {
              signal.throwIfAborted()
              const child = await run(
                {
                  name: step.tool,
                  input: bind(step.input, context.input, outputs, state),
                  parentCallId: context.callId,
                  actor: context.actor,
                  purpose: context.purpose,
                  purposeSource: context.purposeSource,
                  signal
                },
                pinned,
                Object.freeze({
                  name: parentDefinition.name,
                  revision: parentDefinition.revision,
                  id: step.id,
                  ...(iteration === undefined ? {} : { iteration })
                })
              )
              if (pinned.recipe) children.push(child)
              issues.push(...child.issues)
              recovery.push(...(child.recovery ?? []))
              const schema = exportedSchemas.get(child)
              if (schema !== undefined) {
                const receipt = child.calls[child.calls.length - 1]
                if (!receipt)
                  throw new Error(
                    'Validated child omitted its invocation receipt'
                  )
                const item = Object.freeze({ ...receipt, value: child.value })
                recoverySchemas.set(item, schema)
                recovery.push(item)
              }
              if (completed(child) && !child.issues.length)
                outputs.set(step.id, child.value)
              return child
            }
            for (let i = 0; i < node.recipe.recipe.steps.length; i++) {
              const child = await executeStep(
                node.recipe.recipe.steps[i],
                node.children[i]
              )
              if (!completed(child) || child.issues.length)
                return aggregateFailure(child.settlement)
            }
            const iteration = node.recipe.recipe.iteration
            if (iteration) {
              const checkNode = node.children[node.recipe.recipe.steps.length]
              const verification = checkNode.definition.verification
              if (!verification)
                throw new Error('Pinned checker lacks verification contract')
              let state = bind(iteration.state, context.input, outputs)
              const seen = new Set<string>()
              for (let round = 0; ; round++) {
                signal.throwIfAborted()
                const invalidState = options.validate(
                  state,
                  iteration.stateSchema
                )
                if (invalidState !== undefined)
                  throw new Error(`Invalid iteration state: ${invalidState}`)
                // Each round has only initial outputs and its own newly acknowledged results.
                outputs.delete(iteration.check.id)
                for (const step of iteration.repairs) outputs.delete(step.id)
                const check = await executeStep(
                  iteration.check,
                  checkNode,
                  state,
                  round
                )
                if (!completed(check) || check.issues.length)
                  return aggregateFailure(check.settlement)
                signal.throwIfAborted()
                const status = at(check.value, verification.statusPath)
                const progress = at(check.value, verification.progressPath)
                if (
                  !['pass', 'repairable', 'decision-required'].includes(
                    String(status)
                  ) ||
                  typeof progress !== 'string' ||
                  progress.length === 0
                )
                  throw new Error('Invalid verification outcome')
                if (status === 'pass') {
                  outputs.set(iteration.id, {
                    state,
                    result: check.value,
                    iterations: round
                  })
                  break
                }
                if (status === 'decision-required')
                  throw new Error('Primary-agent decision required')
                if (seen.has(progress))
                  throw new Error('Repeated verification progress')
                if (round >= iteration.maxIterations)
                  throw new Error('Repair iteration budget exhausted')
                seen.add(progress)
                for (let index = 0; index < iteration.repairs.length; index++) {
                  const child = await executeStep(
                    iteration.repairs[index],
                    node.children[node.recipe.recipe.steps.length + 1 + index],
                    state,
                    round + 1
                  )
                  if (!completed(child) || child.issues.length)
                    return aggregateFailure(child.settlement)
                }
                state = bind(iteration.next, context.input, outputs, state)
              }
            }
            observed = {
              status: 'success',
              settlement: 'completed',
              value: bind(node.recipe.recipe.output, context.input, outputs),
              calls: records.slice(start),
              issues: []
            }
            return observed
          }
        })
        let result: AiRecipeExecutionResult
        try {
          result = await invoker.invoke({ ...call, signal })
        } catch (error) {
          issues.push(message(error))
          let settlement =
            observed?.settlement ?? (dispatched ? 'unknown' : 'not-started')
          if (error instanceof AiToolContractError && error.inspection)
            settlement = error.inspection.settlement
          result = aggregateFailure(settlement)
        }
        const receipt = Object.freeze({
          callId,
          name: call.name,
          revision: node?.definition.revision ?? request.revision ?? 0,
          status: result.status,
          settlement: result.settlement
        })
        records.push(receipt)
        const finalResult = Object.freeze({
          ...result,
          calls: Object.freeze(records.slice(start)),
          ...(result.recovery
            ? {
                recovery: Object.freeze(
                  result.recovery.filter((item) =>
                    transferredRecovery.has(item)
                  )
                )
              }
            : {}),
          issues: Object.freeze([...new Set([...result.issues, ...issues])])
        })
        if (exportedSchema !== undefined)
          exportedSchemas.set(finalResult, exportedSchema)
        if (node?.recipe)
          executionEvidence.set(
            finalResult,
            Object.freeze({
              recipe: node.recipe,
              requestId: request.requestId,
              callId,
              children: Object.freeze(children)
            })
          )
        return finalResult
      }
      return run(request)
    }
  }
}
