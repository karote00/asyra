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
  type AiToolOutcome
} from './tool-contract.js'
import type {
  AiJsonValue,
  AiRegisteredActionDefinition,
  AiVersionedActionRegistry
} from './types.js'
import type { AdmittedAiRecipe, AiRecipeBinding } from './recipe-types.js'
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
}
export interface AiRecipeLeaseAdapter {
  open(input: {
    requestId: string
    callId: string
    parentCallId?: string
    input: unknown
  }): Promise<void>
  retain(input: {
    requestId: string
    fromCallId: string
    toCallId?: string
    value: unknown
  }): Promise<void>
  release(input: { requestId: string; callId: string }): Promise<void>
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
  readonly observe?: (
    event: AiInvocationEvent<AiRecipeExecutionResult>
  ) => void | Promise<void>
}
interface RecipeExecutionEvidence {
  readonly recipe: AdmittedAiRecipe
  readonly requestId: string
  readonly callId: string
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
  outputs: ReadonlyMap<string, unknown>
): unknown => {
  switch (binding.kind) {
    case 'input':
      return at(input, binding.path)
    case 'step':
      if (!outputs.has(binding.step))
        throw new Error('A required prior result is unavailable')
      return at(outputs.get(binding.step), binding.path)
    case 'literal':
      return binding.value
    case 'array':
      return binding.items.map((item) => bind(item, input, outputs))
    case 'object':
      return Object.fromEntries(
        Object.entries(binding.fields).map(([name, item]) => [
          name,
          bind(item, input, outputs)
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
      const signal = request.signal ?? new AbortController().signal
      let expanded = 0
      const pin = (
        name: string,
        revision: number | undefined,
        ancestors: ReadonlySet<string>
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
        const children = recipe.recipe.steps.map((step) => {
          if (++expanded > options.maxSteps)
            throw new Error('Expanded composition exceeds the execution budget')
          const child = pin(step.tool, step.revision, next)
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
        })
        return { definition: entry.definition, recipe, children }
      }
      const run = async (
        call: AiInvocation,
        supplied?: PinnedNode
      ): Promise<AiRecipeExecutionResult> => {
        let node = supplied
        let callId = call.callId ?? ''
        let opened = false
        let dispatched = false
        let observed: AiRecipeExecutionResult | undefined
        const start = records.length
        const issues: string[] = []
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
            issues
          }
        }
        const invoker = createAiInvoker<AiRecipeExecutionResult>({
          observe: (event) => {
            callId = event.call.callId
            return options.observe?.(event)
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
              try {
                value = await next()
                if (completed(value) || value.status === 'partial') {
                  await options.leases.retain({
                    requestId: request.requestId,
                    fromCallId: context.callId,
                    toCallId: context.parentCallId,
                    value: value.value
                  })
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
              input: context.input
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
            const outputs = new Map<string, unknown>()
            for (let i = 0; i < node.recipe.recipe.steps.length; i++) {
              const step = node.recipe.recipe.steps[i]
              const child = await run(
                {
                  name: step.tool,
                  input: bind(step.input, context.input, outputs),
                  parentCallId: context.callId,
                  actor: context.actor,
                  purpose: context.purpose,
                  purposeSource: context.purposeSource,
                  signal
                },
                node.children[i]
              )
              issues.push(...child.issues)
              if (!completed(child) || child.issues.length)
                return aggregateFailure(child.settlement)
              outputs.set(step.id, child.value)
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
          issues: Object.freeze([...new Set([...result.issues, ...issues])])
        })
        if (node?.recipe)
          executionEvidence.set(
            finalResult,
            Object.freeze({
              recipe: node.recipe,
              requestId: request.requestId,
              callId
            })
          )
        return finalResult
      }
      return run(request)
    }
  }
}
