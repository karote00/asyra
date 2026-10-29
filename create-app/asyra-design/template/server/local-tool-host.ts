import { runtimeOperationSchema } from './local-operation-batch'
import { AsyncLocalStorage } from 'node:async_hooks'
import {
  createAiActionRegistry,
  createAiInvoker,
  createAiToolContract,
  selectAiToolResultSchema,
  embedAiToolSchema,
  type AiInvocation,
  type AiInvocationContext,
  type AiInvocationEvent,
  type AiRecipeInvocationEvent,
  type AiRecipeLimits,
  type AiToolStore,
  type AiJsonValue,
  type AiToolOutcome
} from '@asyra/ai-agent-runtime'
import { createLocalToolLeases } from './local-tool-leases'
import { createLocalToolLibrary } from './local-tool-library'
import { createLocalToolLibraryTools } from './local-tool-library-tools'
import {
  createLocalToolScheduler,
  type LocalToolAccess
} from './local-tool-scheduler'
import {
  invokeLocalTool,
  localToolFailureReply,
  localToolFailureSchema,
  localToolErrorMessage,
  localToolResultSchema,
  localToolOutcome,
  type LocalToolOwner,
  type LocalToolDefinition
} from './local-tool-invocation'
import {
  operationContractIssue,
  operationInputIssue
} from './operation-input-schema'
import type { LocalToolOwnership } from './local-tool-leases'
import {
  projectToolDelivery,
  toolDeliveryFailure,
  projectToolResultFields,
  modelToolResultSchemas,
  hostToolResultSchema
} from '../src/ai/tool-contract'
import { AiDesignToolIds } from '../src/constants/ai-design'

export interface LocalToolGroup {
  readonly name: string
  readonly description: string
  readonly owner: LocalToolOwner & {
    readonly definitions: readonly (LocalToolDefinition & {
      readonly executionAccess?: LocalToolAccess
    })[]
  }
}
type Reply = Awaited<ReturnType<typeof invokeLocalTool>>

/** One request host: registered metadata, guarded leaves and actual store ownership. */
export const createLocalToolHost = (options: {
  requestId: string
  signal: AbortSignal
  store: AiToolStore
  capacity: number
  receiptCapacity: number
  artifactCapacity: number
  limits: AiRecipeLimits
  createGroups: (ownership: LocalToolOwnership) => readonly LocalToolGroup[]
  execute?: (
    call: AiInvocationContext,
    work: () => Promise<Reply>
  ) => Promise<Reply>
  executionEvidence?: () => unknown
  onPhase?: (
    call: AiInvocationContext,
    phase: 'admission' | 'execution' | 'decoding'
  ) => void
  observe?: (
    event: AiInvocationEvent<unknown> &
      Pick<AiRecipeInvocationEvent, 'revision' | 'recipeStep'>
  ) => void | Promise<void>
}) => {
  const context = new AsyncLocalStorage<AiInvocationContext>()
  const registry = createAiActionRegistry()
  const leases = createLocalToolLeases({
    requestId: options.requestId,
    capacity: options.artifactCapacity
  })
  const schedule = createLocalToolScheduler(options.signal)
  const ownership: LocalToolOwnership = {
    requestId: options.requestId,
    publish: (handle, release, validate, lifetime) =>
      leases.publish({
        handle,
        release,
        validate,
        callId: lifetime === 'request' ? undefined : context.getStore()?.callId
      }),
    publishAliases: leases.publishAliases,
    assertOwned: (handle) =>
      leases.assertOwned(handle, context.getStore()?.callId),
    borrow: (handle) => leases.borrow(handle, context.getStore()?.callId),
    assertRelease: (handle) =>
      leases.assertRelease(handle, context.getStore()?.callId),
    retire: (handle) => leases.retire(handle, context.getStore()?.callId)
  }
  const groups = [...options.createGroups(ownership)]
  const bindings = new Map<
    string,
    {
      owner: LocalToolGroup['owner']
      definition: LocalToolDefinition
      access?: LocalToolAccess
    }
  >()
  const active = new Set<Promise<unknown>>()
  let closing: Promise<void> | undefined
  let closed = false
  const leaf = async (call: AiInvocationContext): Promise<Reply> => {
    const binding = bindings.get(call.name)
    if (!binding)
      throw new Error('No registered native owner for this invocation')
    return schedule(binding.access, () =>
      context.run(call, async () => {
        const work = () =>
          invokeLocalTool(
            binding.owner,
            binding.definition,
            call.input,
            call.signal ?? options.signal,
            options.executionEvidence,
            (phase) => options.onPhase?.(call, phase)
          )
        return options.execute ? options.execute(call, work) : work()
      })
    )
  }
  const register = (group: LocalToolGroup) => {
    for (const source of group.owner.definitions) {
      const name = `${group.name}.${source.name}`
      if (bindings.has(name)) throw new Error('Duplicate native tool identity')
      const definition = createAiToolContract(source)
      bindings.set(name, {
        owner: group.owner,
        definition: {
          ...definition,
          providerExposure: source.providerExposure
        },
        access: source.executionAccess
      })
      registry.register({
        ...createAiToolContract({
          ...definition,
          // Leaves validate the unchanged owner value before adding metadata.
          // Runtime consumes that complete value plus the host outcome.
          ...Object.fromEntries(
            ['outputSchema', 'partialOutputSchema', 'recoveryOutputSchema'].map(
              (key) => [
                key,
                runtimeOperationSchema(
                  hostToolResultSchema(
                    definition[key as keyof typeof definition]
                  )
                )
              ]
            )
          )
        }),
        inputSchema: runtimeOperationSchema(definition.inputSchema),
        name,
        composition: source.composition ?? 'control-plane',
        execute: async (input, execution) => {
          const reply = await invoke(
            { name, input, signal: execution.signal },
            true
          )
          if (!reply.success)
            throw new Error(
              'Use host invocation to retain the full failure receipt'
            )
          return JSON.parse(reply.text)
        }
      })
    }
  }
  groups.forEach(register)
  const library = createLocalToolLibrary({
    requestId: options.requestId,
    registry,
    store: options.store,
    capacity: options.capacity,
    receiptCapacity: options.receiptCapacity,
    limits: options.limits,
    validate: operationContractIssue,
    leases,
    execute: async (call) => {
      const reply = await leaf(call)
      const value = JSON.parse(reply.text)
      return { ...value.toolOutcome, value }
    },
    observe: options.observe,
    onPhase: options.onPhase,
    check: async () => ({
      ok: true,
      scope:
        'Canonical owner admission, outcome, schemas and artifact handoff only; no visual certification.'
    })
  })
  const controls = createLocalToolLibraryTools(
    () => library,
    () => ({
      parentCallId: context.getStore()?.callId,
      actor: context.getStore()?.actor,
      purpose: context.getStore()?.purpose,
      purposeSource: context.getStore()?.purposeSource
    }),
    (name, input, value) => project(name, input, value)
  )
  const controlGroup = {
    name: 'tool_library',
    description: 'Author, invoke and manage registered reusable tools.',
    owner: controls
  }
  groups.push(controlGroup)
  register(controlGroup)
  const native = createAiInvoker<Reply>({
    observe: options.observe,
    execute: async (call) => {
      const binding = bindings.get(call.name)
      if (!binding)
        return localToolFailureReply(
          'Unknown registered tool.',
          'UNKNOWN_TOOL',
          { settlement: 'not-started' }
        )
      const issue = operationInputIssue(
        call.input,
        binding.definition.inputSchema
      )
      // The canonical boundary preserves owner-specific repair diagnostics.
      if (issue) return leaf(call)
      const projection = binding.owner.invocationSchemas?.(
        binding.definition.name,
        call.input
      )
      const schemas = projection ?? binding.definition
      let opened = false
      let reply: Reply | undefined
      let output: Reply | undefined
      let abortError: unknown
      let aborted = false
      const interrupted = (error: unknown, code: string) =>
        localToolFailureReply(localToolErrorMessage(error), code, {
          settlement: reply ? 'unknown' : 'not-started',
          ...(reply ? { executionResult: JSON.parse(reply.text) } : {})
        })
      try {
        await leases.open({
          requestId: options.requestId,
          callId: call.callId,
          input: call.input,
          inputSchema: schemas.inputSchema as AiJsonValue
        })
        opened = true
        reply = await leaf(call)
        const value = JSON.parse(reply.text)
        const validatedSchema = projection
          ? undefined
          : localToolResultSchema(reply)
        const outputSchema =
          validatedSchema ??
          selectAiToolResultSchema(
            {
              outputSchema: schemas.outputSchema as AiJsonValue,
              partialOutputSchema: schemas.partialOutputSchema as
                AiJsonValue | undefined,
              recoveryOutputSchema: schemas.recoveryOutputSchema as
                AiJsonValue | undefined
            },
            value.toolOutcome.status
          )
        if (outputSchema !== undefined) {
          const outputIssue =
            validatedSchema === undefined
              ? operationContractIssue(value, outputSchema, { stage: 'output' })
              : undefined
          if (outputIssue) throw new Error(outputIssue)
          await leases.retain({
            requestId: options.requestId,
            fromCallId: call.callId,
            value,
            outputSchema
          })
        }
        output = reply
      } catch (error) {
        if (options.signal.aborted || call.signal?.aborted) {
          abortError = error
          aborted = true
        } else output = interrupted(error, 'TOOL_HANDOFF_FAILED')
      }
      if (opened) {
        try {
          await leases.release({
            requestId: options.requestId,
            callId: call.callId
          })
        } catch (error) {
          if (!aborted) output = interrupted(error, 'TOOL_CLEANUP_FAILED')
        }
      }
      if (aborted) throw abortError
      if (!output) throw new Error('Native invocation did not settle')
      return output
    }
  })
  const track = <T>(work: () => Promise<T>): Promise<T> => {
    if (closed) return Promise.reject(new Error('Tool host is closing'))
    const task = Promise.resolve().then(work)
    active.add(task)
    void task.finally(() => active.delete(task)).catch(() => undefined)
    return task
  }
  function project(name: string, input: unknown, value: unknown): unknown {
    const binding = bindings.get(name)
    const contract = binding?.definition ?? library.describe(name)
    try {
      if (!binding) {
        return contract ? projectToolDelivery(contract, value) : value
      }
      // Owners project resource-backed values first. Every external exit then selects
      // the same declared envelope, including failures and custom owner projectors.
      // Selected leaves are projected by their owner before an invocation envelope.
      // The envelope's declared value slot preserves that already projected result.
      if (!contract) throw new Error('Missing registered result contract')
      const schemas = modelToolResultSchemas(contract)
      const projectionSchema = {
        anyOf: [
          schemas.outputSchema,
          schemas.partialOutputSchema,
          schemas.recoveryOutputSchema,
          localToolFailureSchema
        ]
          .filter((schema) => schema !== undefined)
          .map((schema, index) =>
            embedAiToolSchema(schema as AiJsonValue, `#/anyOf/${index}`)
          )
      }
      const boundaryFailure = !operationContractIssue(
        value,
        localToolFailureSchema,
        { stage: 'output' }
      )
      let receipt = value
      if (boundaryFailure && value && typeof value === 'object') {
        const failure = value as Record<string, unknown>
        if (
          failure.executionResult &&
          typeof failure.executionResult === 'object'
        ) {
          const ownerResults = {
            anyOf: [
              contract.outputSchema,
              contract.partialOutputSchema,
              contract.recoveryOutputSchema
            ]
              .filter((schema) => schema !== undefined)
              .map((schema, index) =>
                embedAiToolSchema(
                  hostToolResultSchema(schema) as AiJsonValue,
                  `#/anyOf/${index}`
                )
              )
          }
          // Cleanup can fail after a valid owner result was retained. Project that
          // result through its own contract, preserving the cleanup failure outside.
          // Invalid/transport evidence remains with its existing failure owner.
          if (
            !operationContractIssue(failure.executionResult, ownerResults, {
              stage: 'output'
            })
          )
            receipt = {
              ...failure,
              executionResult: project(name, input, failure.executionResult)
            }
        }
      }
      let view = receipt
      if (binding.owner.projectModelResult)
        view = binding.owner.projectModelResult(
          binding.definition.name,
          input,
          receipt
        )
      else if (contract.delivery && !boundaryFailure)
        view = projectToolDelivery(contract, receipt)
      const acknowledged =
        value && typeof value === 'object' && 'toolOutcome' in value
          ? (value.toolOutcome as AiToolOutcome)
          : undefined
      if (
        acknowledged &&
        view &&
        typeof view === 'object' &&
        !Array.isArray(view)
      ) {
        const report =
          'toolOutcome' in view
            ? (view.toolOutcome as AiToolOutcome)
            : acknowledged
        if (
          report.settlement !== acknowledged.settlement ||
          (acknowledged.status !== 'success' && report.status === 'success')
        )
          return toolDeliveryFailure(
            value,
            'Model projection changed the acknowledged execution outcome.',
            contract
          )
        view = { ...view, toolOutcome: report }
      }
      // Match validated owner fields before removing internal-only fields. A closed
      // model schema cannot match the complete owner value until those are removed.
      const selectionSchema = {
        anyOf: [
          projectionSchema,
          ...[
            contract.outputSchema,
            contract.partialOutputSchema,
            contract.recoveryOutputSchema
          ]
            .filter((schema) => schema !== undefined)
            .map(hostToolResultSchema)
        ].map((schema, index) =>
          embedAiToolSchema(schema as AiJsonValue, `#/anyOf/${index}`)
        )
      }
      const projected = projectToolResultFields(view, selectionSchema)
      const deliveredStatus =
        projected && typeof projected === 'object' && 'toolOutcome' in projected
          ? (projected.toolOutcome as AiToolOutcome).status
          : acknowledged?.status
      const applicableSchema =
        deliveredStatus === 'success' ? schemas.outputSchema : projectionSchema
      const issue = operationContractIssue(projected, applicableSchema, {
        stage: 'output'
      })
      return issue ? toolDeliveryFailure(value, issue, contract) : projected
    } catch (error) {
      return toolDeliveryFailure(
        value,
        localToolErrorMessage(error),
        contract ?? {}
      )
    }
  }

  function invoke(call: AiInvocation, internal = false): Promise<Reply> {
    return track(async () => {
      const reply = await native.invoke({
        ...call,
        signal: call.signal ?? options.signal
      })
      if (internal) return reply
      const original = JSON.parse(reply.text)
      const value = project(call.name, call.input, original)
      if (value === original) return reply
      if (!value || typeof value !== 'object' || Array.isArray(value))
        return { ...reply, text: JSON.stringify(value) }
      const projected = value as Record<string, unknown>
      const outcome =
        projected.toolOutcome && typeof projected.toolOutcome === 'object'
          ? (projected.toolOutcome as { status: string })
          : localToolOutcome(projected)
      return {
        success: reply.success && outcome.status === 'success',
        text: JSON.stringify(projected)
      }
    })
  }
  return {
    groups,
    get revision() {
      return library.revision
    },
    definitions() {
      return library.list().map((definition) => {
        const binding = bindings.get(definition.name)
        if (binding)
          return {
            ...definition,
            ...Object.fromEntries(
              [
                'outputSchema',
                'partialOutputSchema',
                'recoveryOutputSchema'
              ].map((key) => [
                key,
                hostToolResultSchema(
                  binding.definition[key as keyof typeof binding.definition]
                )
              ])
            ),
            resultStage: 'host' as const,
            name: binding.definition.name,
            registeredName: definition.name,
            namespace: definition.name.slice(
              0,
              -(binding.definition.name.length + 1)
            ),
            ...(binding.definition.providerExposure === 'registry'
              ? {
                  execution: {
                    kind: 'registered-tool' as const,
                    namespace: 'tool_library',
                    tool: AiDesignToolIds.INVOKE_TOOL,
                    arguments: {
                      name: definition.name,
                      revision: definition.revision
                    }
                  }
                }
              : {})
          }
        return {
          ...definition,
          registeredName: definition.name,
          namespace: 'tool_library',
          execution: {
            kind: 'registered-tool' as const,
            namespace: 'tool_library',
            tool: AiDesignToolIds.INVOKE_TOOL,
            arguments: { name: definition.name, revision: definition.revision }
          }
        }
      })
    },
    load: () => track(library.load),
    invoke,
    dispose() {
      closed = true
      closing ??= Promise.allSettled([...active]).then(async () => {
        await library.dispose()
        await leases.dispose()
      })
      void closing.catch(() => {
        closing = undefined
      })
      return closing
    }
  }
}
