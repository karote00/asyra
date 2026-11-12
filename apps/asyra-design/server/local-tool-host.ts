import { requireSupportedToolSchemas } from '../src/ai/tool-schema'
import type { LocalToolImage } from './local-tool-media'
import type { ExchangeConversationResults } from '../src/ai/conversation-results'
import {
  resultDelivery,
  readNamedFields,
  resolveConversationInputs,
  type DeliveryRequest
} from './local-result-delivery'
import { runtimeOperationSchema } from './local-operation-batch'
import { AsyncLocalStorage } from 'node:async_hooks'
import {
  createAiActionRegistry,
  createAiInvoker,
  createAiToolContract,
  inspectAiToolResult,
  selectAiToolResultSchema,
  registeredRecipeOutputAt,
  RecipeReferenceError,
  embedAiToolSchema,
  type AiInvocation,
  type AiInvocationContext,
  type AiInvocationEvent,
  type AiRecipeInvocationEvent,
  type AiRecipeLimits,
  type AiRecipeBinding,
  type AiToolStore,
  type AiJsonValue,
  type AiToolContract,
  type AiToolOutcome
} from '@asyra/ai-agent-runtime'
import {
  createLocalToolLeases,
  localToolReferences,
  localToolSchemaIsPortable
} from './local-tool-leases'
import { createLocalToolLibrary } from './local-tool-library'
import {
  operationGroupName,
  createDesignSequencePlanner,
  designStageOutcomes,
  sequenceDefinition,
  resultReceiptSchema
} from './local-design-sequence'
import {
  createLocalToolLibraryTools,
  registeredToolInvocationSchemas
} from './local-tool-library-tools'
import {
  createLocalToolScheduler,
  LocalToolAccess
} from './local-tool-scheduler'
import {
  invokeLocalTool,
  invocationRecoverySchema,
  LocalToolInputError,
  localToolFailureReply,
  localToolFailureSchema,
  localToolFailureIssue,
  localToolRecoveryModelContract,
  localToolErrorMessage,
  localToolResultSchema,
  localToolReplyOutcome,
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
  modelToolResultSchemas
} from '../src/ai/tool-contract'
import { AiDesignToolIds } from '../src/constants/ai-design'

export interface LocalToolGroup {
  readonly name: string
  readonly description: string
  readonly owner: LocalToolOwner & {
    bindScheduledArtifact?(
      name: string,
      args: Record<string, unknown>,
      target: unknown,
      index: number
    ): Record<string, unknown>
    validateScheduledOperations?(operations: unknown): void
    canOverlapPreparation?(name: string, input: unknown): boolean
    readonly definitions: readonly (LocalToolDefinition & {
      readonly executionAccess?: LocalToolAccess
    })[]
  }
}
type Reply = Awaited<ReturnType<typeof invokeLocalTool>> & {
  media?: LocalToolImage[]
}

/** One request host: registered metadata, guarded leaves and actual store ownership. */
export const createLocalToolHost = (options: {
  requestId: string
  resultContext?: ExchangeConversationResults
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
  const selectedImages = new WeakMap<AiInvocationContext, LocalToolImage[]>()
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
      definition: AiToolContract &
        Pick<LocalToolDefinition, 'providerExposure' | 'resultPaths'>
      access?: LocalToolAccess
    }
  >()
  const active = new Set<Promise<unknown>>()
  let closing: Promise<void> | undefined
  let closed = false

  const leaf = async (call: AiInvocationContext): Promise<Reply> => {
    const binding = bindings.get(call.name)

    if (!binding) {
      throw new Error('No registered native owner for this invocation')
    }

    return schedule(
      binding.owner.canOverlapPreparation?.(binding.definition.name, call.input)
        ? LocalToolAccess.ISOLATED
        : binding.access,
      () =>
        context.run(call, async () => {
          const work = () =>
            invokeLocalTool(
              binding.owner,
              binding.definition,
              call.input,
              call.signal ?? options.signal,
              options.executionEvidence,
              (phase) => options.onPhase?.(call, phase),
              call
            )

          return options.execute ? options.execute(call, work) : work()
        })
    )
  }

  const register = (group: LocalToolGroup) => {
    for (const source of group.owner.definitions) {
      const name = `${group.name}.${source.name}`

      if (bindings.has(name)) {
        throw new Error('Duplicate native tool identity')
      }

      const definition = createAiToolContract(source)

      requireSupportedToolSchemas(definition)
      modelToolResultSchemas(definition)

      bindings.set(name, {
        owner: group.owner,
        definition: {
          ...definition,
          providerExposure: source.providerExposure,
          resultPaths: source.resultPaths
        },
        access: source.executionAccess
      })
      registry.register({
        ...createAiToolContract({
          ...definition,
          // Runtime consumes unchanged owner data alongside explicit execution state.
          ...Object.fromEntries(
            ['outputSchema', 'partialOutputSchema', 'recoveryOutputSchema'].map(
              (key) => [
                key,
                runtimeOperationSchema(
                  key === 'recoveryOutputSchema'
                    ? invocationRecoverySchema(
                        definition.recoveryOutputSchema,
                        localToolFailureSchema
                      )
                    : definition[key as keyof typeof definition]
                )
              ]
            )
          )
        }),
        inputSchema: runtimeOperationSchema(definition.inputSchema, true),
        name,
        composition: source.composition ?? 'control-plane',

        execute: async (input, execution) => {
          const reply = await invoke(
            { name, input, signal: execution.signal },
            true
          )

          if (!reply.success) {
            throw new Error(
              'Use host invocation to retain the full failure receipt'
            )
          }

          return JSON.parse(reply.text)
        }
      })
    }
  }

  const operationGroup = groups.find(
    (group) => group.name === 'design_operations'
  )
  const operationOwner = operationGroup?.owner
  const batch = operationOwner?.definitions.find(
    (d) => d.name === AiDesignToolIds.EXECUTE_DESIGN
  )

  if (batch && operationOwner && operationGroup) {
    register({
      name: 'host_operations',
      description: 'Internal canvas dispatcher',
      owner: {
        ...operationOwner,
        definitions: [{ ...batch, composition: 'allowed' }]
      }
    })
    groups[groups.indexOf(operationGroup)] = {
      ...operationGroup,
      owner: {
        ...operationOwner,
        definitions: operationOwner.definitions.filter((d) => d !== batch)
      }
    }
  }

  groups.forEach(register)
  const library = createLocalToolLibrary({
    privateDependency: operationGroupName,

    canOverlapPreparation: (definition, input) => {
      const binding = bindings.get(definition.name)

      return (
        binding?.owner.canOverlapPreparation?.(
          binding.definition.name,
          input
        ) === true
      )
    },

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

      const outcome = localToolReplyOutcome(reply)

      return {
        ...outcome,
        issues:
          outcome.issues?.map((issue: { message: string }) => issue.message) ??
          [],
        value
      }
    },

    observe: options.observe,
    onPhase: options.onPhase,

    check: async () => ({
      ok: true,
      scope:
        'Canonical owner admission, outcome, schemas and artifact handoff only; no visual certification.'
    })
  })

  // Discovery and selected invocation consume owner contracts, not Runtime's
  // additional generic diagnostic alternatives registered for leaf failures.
  const invocationContract = <T extends LocalToolDefinition>(
    name: string,
    contract: T
  ) => {
    const binding = bindings.get(name)

    if (!binding || binding.definition.revision !== contract.revision) {
      return contract
    }

    return {
      ...contract,
      inputSchema: runtimeOperationSchema(binding.definition.inputSchema),
      ...Object.fromEntries(
        ['outputSchema', 'partialOutputSchema', 'recoveryOutputSchema'].map(
          (key) => [
            key,
            binding.definition[key as keyof typeof binding.definition]
          ]
        )
      )
    }
  }

  const controls = createLocalToolLibraryTools(
    () => library,
    () => ({
      parentCallId: context.getStore()?.callId,
      actor: context.getStore()?.actor,
      purpose: context.getStore()?.purpose,
      purposeSource: context.getStore()?.purposeSource
    }),
    (name, input, value, outcome, revision) =>
      project(name, input, value, outcome, undefined, revision),
    invocationContract
  )
  const operationNames = new Map<string, string[]>()

  for (const name of bindings.keys()) {
    if (name === operationGroupName) {
      continue
    }

    const short = name.slice(name.lastIndexOf('.') + 1)

    operationNames.set(short, [...(operationNames.get(short) ?? []), name])
  }

  const resolveStep = (name: string) => {
    if (name === operationGroupName) {
      throw new LocalToolInputError('Private dispatcher')
    }

    const names = operationNames.get(name)

    if (names && names.length > 1) {
      throw new LocalToolInputError('Ambiguous operation: ' + name)
    }

    return library.describe(names?.[0] ?? name)
  }

  const sequence = sequenceDefinition(batch)

  const planSequence = createDesignSequencePlanner(
    batch,
    resolveStep,
    () => library.describe(operationGroupName),
    operationOwner?.validateScheduledOperations,
    operationOwner?.bindScheduledArtifact
  )

  const admissionError = (
    failure: Extract<ReturnType<typeof library.admitInline>, { ok: false }>
  ) =>
    new LocalToolInputError(
      failure.issues.map((i) => i.path + ' ' + i.actual).join('; '),
      'PREPARATION_REJECTED',
      failure.omittedIssues === 0 &&
        failure.issues.length > 0 &&
        failure.issues.every(
          (issue) =>
            issue.code === 'value' ||
            issue.code === 'reference' ||
            (issue.code === 'binding' &&
              (issue.path === '/output' || issue.path.startsWith('/output/')))
        )
        ? 'correct_input'
        : undefined
    )

  const prepare = (args: unknown) => {
    if ((args as DeliveryRequest).retain && !options.resultContext) {
      throw new LocalToolInputError('No active App conversation context')
    }

    const prepared = planSequence(args as Record<string, unknown>)

    if (prepared.batch) {
      return { batch: prepared.batch }
    }

    const admitted = library.admitInline(prepared.proposal, 'sequence')

    if (!admitted.ok) {
      throw admissionError(admitted)
    }

    const recipe = admitted.value.recipe

    if (recipe.output.kind === 'step' && recipe.output.path) {
      const output = recipe.output
      const loop = recipe.iteration
      const checked =
        loop?.id === output.step &&
        (output.path === '/result' || output.path.startsWith('/result/'))
      const step = checked
        ? loop?.check
        : recipe.steps.find((s) => s.id === output.step)
      const leaf = step && bindings.get(step.tool)

      if (leaf) {
        const path = checked ? output.path.slice('/result'.length) : output.path

        const schema = modelToolResultSchemas(leaf.definition).outputSchema

        try {
          registeredRecipeOutputAt(runtimeOperationSchema(schema), path, true)
        } catch (error) {
          throw new LocalToolInputError(
            localToolErrorMessage(error),
            error instanceof RecipeReferenceError
              ? 'PREPARATION_REJECTED'
              : 'TOOL_CONTRACT_INVALID',
            error instanceof RecipeReferenceError ? 'correct_input' : undefined
          )
        }
      }
    }

    const requested = (args as DeliveryRequest).delivery

    if (typeof requested === 'object') {
      const resourceExports: Record<string, AiRecipeBinding> = {}

      for (const [name, selector] of Object.entries(requested.fields)) {
        if (selector.source === 'input') {
          continue
        }

        let source: AiRecipeBinding | undefined

        if (selector.step) {
          source = { kind: 'step', step: selector.step, path: selector.path }
        } else if (recipe.output.kind === 'step') {
          source = {
            ...recipe.output,
            path: recipe.output.path + selector.path
          }
        }

        if (!source) {
          throw new LocalToolInputError(
            'Selected result requires a step output',
            'PREPARATION_REJECTED',
            'correct_input'
          )
        }

        if (source.kind === 'step') {
          const step = recipe.steps.find((entry) => entry.id === source.step)
          const owner =
            step &&
            (bindings.get(step.tool)?.definition ?? library.describe(step.tool))

          if (owner && step) {
            const schema = modelToolResultSchemas(owner).outputSchema

            try {
              const selectedSchema = registeredRecipeOutputAt(
                runtimeOperationSchema(schema),
                source.path,
                true
              )
              // Export declared execution fields to preserve their resource leases.
              // A portable model-only field needs no Runtime output binding.
              const executionOwner =
                bindings.get(step.tool)?.definition ??
                library.describe(step.tool)

              try {
                registeredRecipeOutputAt(
                  runtimeOperationSchema(executionOwner?.outputSchema),
                  source.path,
                  true
                )
                resourceExports[name] = source
              } catch (error) {
                if (
                  !(error instanceof RecipeReferenceError) ||
                  !localToolSchemaIsPortable(selectedSchema)
                ) {
                  throw error
                }
              }
            } catch (error) {
              throw new LocalToolInputError(
                'delivery.fields.' +
                  name +
                  ' (step ' +
                  source.step +
                  ', path ' +
                  source.path +
                  '): ' +
                  localToolErrorMessage(error),
                error instanceof RecipeReferenceError
                  ? 'PREPARATION_REJECTED'
                  : 'TOOL_CONTRACT_INVALID',
                error instanceof RecipeReferenceError
                  ? 'correct_input'
                  : undefined
              )
            }
          }
        }
      }

      if (Object.keys(resourceExports).length) {
        const exported = library.admitInline(
          {
            ...prepared.proposal,
            output: {
              kind: 'object',
              fields: {
                value: recipe.output,
                resources: { kind: 'object', fields: resourceExports }
              }
            }
          },
          'sequence'
        )

        if (!exported.ok) {
          throw admissionError(exported)
        }

        return { recipe: exported.value, deliveryEnvelope: true }
      }
    }

    return { recipe: admitted.value }
  }

  const preparedCalls = new WeakMap<object, ReturnType<typeof prepare>>()

  const preparedFor = (args: unknown) => {
    const call = context.getStore()
    const previous = call && preparedCalls.get(call)

    if (previous) {
      return previous
    }

    let plan: ReturnType<typeof prepare>

    try {
      plan = prepare(args)
    } catch (error) {
      if (error instanceof LocalToolInputError) {
        throw error
      }

      throw new LocalToolInputError(
        localToolErrorMessage(error),
        'TOOL_CONTRACT_INVALID'
      )
    }

    if (call) {
      preparedCalls.set(call, plan)
    }

    return plan
  }

  const sequenceOwner = {
    definitions: [
      { ...sequence, executionAccess: LocalToolAccess.COORDINATOR }
    ],

    invocationSchemas(
      _name: string,
      args: unknown,
      stage: 'owner' | 'model' = 'owner'
    ) {
      try {
        const recoveryContract =
          stage === 'model'
            ? (contract: ReturnType<typeof createAiToolContract>) => {
                const owner = bindings.get(contract.name)?.definition

                if (owner && owner.revision !== contract.revision) {
                  throw new Error('Recovery owner revision changed')
                }

                return localToolRecoveryModelContract({
                  ...contract,
                  ...(owner ?? {}),
                  name: contract.name
                })
              }
            : undefined

        if (
          !(args as Record<string, unknown>)?.operations &&
          !(args as Record<string, unknown>)?.stages
        ) {
          return {
            inputSchema: sequence.inputSchema,
            outputSchema: resultReceiptSchema
          }
        }

        const plan = preparedFor(args)

        if ((args as DeliveryRequest).delivery === undefined) {
          // The final leaf is projected and validated by its own owner below.
          // The model envelope must not revalidate that public value as a raw
          // execution value (for example, retained structural receipts).
          let schemas:
            | {
                inputSchema?: unknown
                outputSchema?: unknown
                partialOutputSchema?: unknown
                recoveryOutputSchema?: unknown
              }
            | undefined = batch

          if (plan.recipe) {
            schemas =
              stage === 'model'
                ? registeredToolInvocationSchemas({})
                : registeredToolInvocationSchemas(
                    plan.recipe.contract,
                    plan.recipe.contract,
                    library.describeRecovery(
                      plan.recipe.contract.name,
                      plan.recipe.contract.revision,
                      plan.recipe.dependencies,
                      recoveryContract
                    )
                  )
          }

          const metadata = Boolean(
            (args as DeliveryRequest).retain ||
            (args as Record<string, unknown>).stages
          )

          const withMetadata = (schema: unknown) => {
            if (!metadata || !schema || typeof schema !== 'object') {
              return schema
            }

            const value = schema as Record<string, unknown>

            return {
              ...value,
              properties: {
                ...(value.properties as Record<string, unknown>),
                ...resultReceiptSchema.properties
              }
            }
          }

          return {
            ...schemas,
            inputSchema: sequence.inputSchema,
            outputSchema: withMetadata(schemas?.outputSchema),
            partialOutputSchema: withMetadata(schemas?.partialOutputSchema),
            recoveryOutputSchema: withMetadata(schemas?.recoveryOutputSchema)
          }
        }

        {
          return {
            inputSchema:
              plan.batch && batch ? batch.inputSchema : sequence.inputSchema,
            ...(() => {
              const selected =
                typeof (args as DeliveryRequest).delivery === 'object'
                  ? (
                      (args as DeliveryRequest).delivery as {
                        fields: Record<string, unknown>
                      }
                    ).fields
                  : undefined
              const output = plan.recipe?.recipe.output
              const fallback =
                plan.deliveryEnvelope && output?.kind === 'object'
                  ? output.fields.value
                  : output
              const properties = Object.fromEntries(
                Object.entries(selected ?? {}).map(([name, raw]) => {
                  const selector = raw as {
                    path: string
                    step?: string
                    source?: string
                  }
                  const selectedStep =
                    selector.step ??
                    (fallback?.kind === 'step' ? fallback.step : undefined)
                  const step = plan.recipe?.recipe.steps.find(
                    (s) => s.id === selectedStep
                  )
                  let owner = plan.batch ? batch : undefined

                  if (step) {
                    owner =
                      bindings.get(step.tool)?.definition ??
                      library.describe(step.tool)
                  }

                  const basePath =
                    !selector.step && fallback?.kind === 'step'
                      ? fallback.path
                      : ''
                  const path = basePath + selector.path
                  const schema = owner
                    ? registeredRecipeOutputAt(
                        selector.source === 'input'
                          ? registeredRecipeOutputAt(
                              runtimeOperationSchema(owner.inputSchema),
                              planSequence.publicInputSchemaPath(
                                step?.tool ?? operationGroupName,
                                selectedStep
                              )
                            )
                          : runtimeOperationSchema(
                              modelToolResultSchemas(owner).outputSchema
                            ),
                        path,
                        true
                      )
                    : {}

                  return [
                    name,
                    embedAiToolSchema(
                      schema as AiJsonValue,
                      '#/properties/fields/properties/' +
                        name.replace(/~/g, '~0').replace(/\//g, '~1')
                    )
                  ]
                })
              )
              const publicFields = selected
                ? { type: 'object', properties, additionalProperties: false }
                : undefined
              const failures = plan.recipe
                ? registeredToolInvocationSchemas(
                    plan.recipe.contract,
                    plan.recipe.contract,
                    library.describeRecovery(
                      plan.recipe.contract.name,
                      plan.recipe.contract.revision,
                      plan.recipe.dependencies,
                      recoveryContract
                    )
                  )
                : batch && modelToolResultSchemas(batch)
              const schema = {
                ...resultReceiptSchema,
                properties: {
                  ...resultReceiptSchema.properties,
                  ...(publicFields ? { fields: publicFields } : {}),
                  failure: {
                    anyOf: [
                      failures?.partialOutputSchema,
                      failures?.recoveryOutputSchema,
                      localToolFailureSchema
                    ]
                      .filter((value) => value !== undefined)
                      .map((value, index) =>
                        embedAiToolSchema(
                          value as AiJsonValue,
                          '#/properties/failure/anyOf/' + index
                        )
                      )
                  }
                }
              }

              return {
                outputSchema: schema,
                partialOutputSchema: schema,
                recoveryOutputSchema: schema
              }
            })()
          }
        }
      } catch (error) {
        if (stage === 'model') {
          throw error
        }

        return undefined
      }
    },

    async call(_name: string, args: unknown, signal: AbortSignal) {
      if (
        !(args as Record<string, unknown>).operations &&
        !(args as Record<string, unknown>).stages
      ) {
        try {
          return JSON.stringify(
            await readNamedFields(args, options.resultContext)
          )
        } catch (error) {
          throw new LocalToolInputError(localToolErrorMessage(error))
        }
      }

      const plan = preparedFor(args)
      const call = context.getStore()

      const request = args as DeliveryRequest
      const delivery =
        request.delivery ||
        request.retain ||
        (args as Record<string, unknown>).stages
          ? resultDelivery(request, options.resultContext, (images, name) => {
              if (call) {
                const prefix =
                  '/fields/' + name.replace(/~/g, '~0').replace(/\//g, '~1')
                const selected = (selectedImages.get(call) ?? []).filter(
                  (image) =>
                    image.path !== prefix &&
                    !image.path.startsWith(prefix + '/')
                )

                selected.push(...images)
                selectedImages.set(call, selected)
              }
            })
          : undefined

      const capture = async (
        step: string | undefined,
        name: string,
        input: unknown,
        value: unknown
      ) => {
        if (!delivery?.selects(step)) {
          return
        }

        try {
          const descriptor =
            bindings.get(name)?.definition ?? library.describe(name)

          if (!descriptor) {
            throw Error('Missing result owner')
          }

          const blocked = new Set<unknown>()

          if (delivery.retains(step)) {
            localToolReferences(value, descriptor.outputSchema, blocked)
          }

          const blockedInput = new Set<unknown>()

          localToolReferences(input, descriptor.inputSchema, blockedInput)
          const projected = project(name, input, value, {
            status: 'success',
            settlement: 'completed'
          })

          await delivery.capture(
            step,
            projected.value,
            blocked,
            projected.outcome,
            {
              value: planSequence.publicInput(name, input, step),
              blocked: blockedInput
            },
            name
          )
        } catch (error) {
          delivery.failed(localToolErrorMessage(error))
        }
      }

      if (plan.batch && batch && operationOwner) {
        const reply = await schedule(batch.executionAccess, () =>
          invokeLocalTool(
            operationOwner,
            batch,
            plan.batch,
            signal,
            options.executionEvidence
          )
        )

        if (!delivery) {
          return reply.text
        }

        const value = JSON.parse(reply.text)

        if (reply.outcome.status === 'success') {
          await capture(undefined, operationGroupName, plan.batch, value)
        }

        return JSON.stringify({
          ...(request.delivery === undefined ? value : {}),
          ...(await delivery.finish(
            reply.outcome,
            (value.actionResults ?? []).map(
              (a: { actionName: string }) => a.actionName
            ),
            (reply.outcome.issues ?? []).map(
              (i: { message: string }) => i.message
            )
          )),
          ...(request.delivery !== undefined &&
          reply.outcome.status !== 'success'
            ? {
                failure: project(
                  operationGroupName,
                  plan.batch,
                  value,
                  reply.outcome
                ).value
              }
            : {})
        })
      }

      if (!plan.recipe) {
        throw new LocalToolInputError('Missing sequence')
      }

      let report = await library.runInline(
        plan.recipe,
        {
          input: null,
          parentCallId: call?.callId,
          signal,
          actor: call?.actor,
          purpose: call?.purpose,
          purposeSource: call?.purposeSource
        },
        delivery
          ? (step, input, value) => capture(step.id, step.tool, input, value)
          : undefined
      )

      if (!delivery) {
        return JSON.stringify(report)
      }

      if (plan.deliveryEnvelope && report.execution.status === 'success') {
        report = {
          ...report,
          execution: {
            ...report.execution,
            value: (report.execution.value as { value: AiJsonValue }).value
          }
        }
      }

      if (
        report.execution.status === 'success' &&
        delivery.selects(undefined)
      ) {
        try {
          const view = sequenceOwner.projectModelResult(
            '',
            args,
            report
          ) as typeof report
          const blocked = new Set<unknown>()

          if (delivery.retains(undefined)) {
            localToolReferences(
              report.execution.value,
              plan.deliveryEnvelope
                ? registeredRecipeOutputAt(
                    plan.recipe.contract.outputSchema,
                    '/value'
                  )
                : plan.recipe.contract.outputSchema,
              blocked
            )
          }

          await delivery.capture(
            undefined,
            view.execution.value,
            blocked,
            sequenceOwner.resultOutcome('', view)
          )
        } catch (error) {
          delivery.failed(localToolErrorMessage(error))
        }
      }

      return JSON.stringify({
        ...(request.delivery === undefined ? report : {}),
        ...(await delivery.finish(
          report.execution,
          report.execution.calls
            .filter((c) => c.status === 'success')
            .map((c) => ('stepId' in c ? String(c.stepId) : c.name)),
          [...report.execution.issues],
          report.execution.calls
            .filter((c) => c.status !== 'success' && 'stepId' in c)
            .map((c) => String((c as { stepId?: string }).stepId))
        )),
        ...(request.delivery !== undefined &&
        report.execution.status !== 'success'
          ? { failure: report }
          : {}),
        ...((args as Record<string, unknown>).stages
          ? {
              stages: designStageOutcomes(
                args as Record<string, unknown>,
                report.execution.calls
              )
            }
          : {})
      })
    },

    resultOutcome(_name: string, value: unknown) {
      if (
        value &&
        typeof value === 'object' &&
        'saved' in value &&
        'toolOutcome' in value
      ) {
        return value.toolOutcome as ReturnType<typeof localToolOutcome>
      }

      if (value && typeof value === 'object' && 'execution' in value) {
        return controls.resultOutcome('', value)
      }

      return localToolOutcome(value as Record<string, unknown>)
    },

    projectModelResult(_name: string, args: unknown, value: unknown): unknown {
      if (
        value &&
        typeof value === 'object' &&
        'saved' in value &&
        !('execution' in value)
      ) {
        if ((args as DeliveryRequest).delivery === undefined) {
          const projected = project(
            operationGroupName,
            args,
            value,
            localToolOutcome(value as Record<string, unknown>)
          ).value

          return {
            ...(projected as Record<string, unknown>),
            saved: value.saved
          }
        }

        // Canonical validation and lease handoff must see complete owner values.
        // Project nested recovery only at the same model boundary as other results.
        return 'failure' in value
          ? {
              ...value,
              failure: sequenceOwner.projectModelResult('', args, value.failure)
            }
          : value
      }

      if (!value || typeof value !== 'object' || !('execution' in value)) {
        return project(
          operationGroupName,
          args,
          value,
          localToolOutcome(value as Record<string, unknown>)
        ).value
      }

      const receipt = value.execution as {
        status: AiToolOutcome['status']
        settlement: AiToolOutcome['settlement']
        calls?: { name: string; revision: number; stepId?: string }[]
        value?: unknown
        recovery?: ({
          name: string
          revision: number
          value?: unknown
        } & AiToolOutcome)[]
      }
      const request = args as {
        operations?: { name: string; id?: string }[]
        iteration?: { id: string; check?: { id?: string } }
        stages?: {
          id: string
          apply: { id?: string }[]
          iteration?: { id: string; check?: { id?: string } }
        }[]
      }
      const lastStage = request.stages?.at(-1)
      const loop = request?.iteration
      const stepId = loop
        ? (loop.check?.id ?? loop.id + '-check')
        : ((lastStage
            ? (lastStage.apply.at(-1)?.id ??
              lastStage.id + '-apply-' + lastStage.apply.length)
            : undefined) ??
          request.operations?.at(-1)?.id ??
          'step-' + request.operations?.length)
      const selectedCall = receipt.calls?.find((c) => c.stepId === stepId)
      const name = selectedCall?.name
      const projectFinal = name && receipt.value !== undefined
      const finalValue = projectFinal
        ? project(
            name,
            undefined,
            receipt.value,
            receipt,
            undefined,
            selectedCall?.revision
          )
        : undefined

      const incomplete = finalValue?.outcome

      return {
        ...value,
        ...(incomplete && incomplete.status !== 'success'
          ? {
              toolOutcome: {
                ...incomplete,
                settlement: (value.execution as { settlement: string })
                  .settlement
              }
            }
          : {}),
        execution: {
          ...receipt,
          ...(receipt.value !== undefined
            ? { value: finalValue ? finalValue.value : receipt.value }
            : {}),
          ...(receipt.recovery
            ? {
                recovery: receipt.recovery.map((r) => ({
                  ...r,
                  value: project(
                    r.name,
                    undefined,
                    r.value,
                    r,
                    undefined,
                    r.revision
                  ).value
                }))
              }
            : {})
        }
      }
    }
  }
  const publicGroup = {
    name: 'design_operations',
    description: 'Execute decided operations in one host call.',
    owner: sequenceOwner
  }

  register(publicGroup)
  // Provider groups dispatch through host.invoke; retain the public namespace only once.
  const groupIndex = groups.findIndex((g) => g.name === publicGroup.name)

  if (groupIndex < 0) {
    groups.push(publicGroup)
  } else {
    const group = groups[groupIndex]

    groups[groupIndex] = {
      ...group,
      owner: {
        ...group.owner,
        definitions: [...group.owner.definitions, ...sequenceOwner.definitions]
      }
    }
  }

  const controlGroup = {
    name: 'tool_library',
    description: 'Author, invoke and manage reusable tools.',
    owner: controls
  }

  groups.push(controlGroup)
  register(controlGroup)
  const native = createAiInvoker<Reply>({
    observe: options.observe,

    execute: async (call) => {
      const binding = bindings.get(call.name)

      if (!binding) {
        return localToolFailureReply(
          'Unknown registered tool.',
          'UNKNOWN_TOOL',
          { settlement: 'not-started' }
        )
      }

      const inputIssue = operationInputIssue(
        call.input,
        binding.definition.inputSchema
      )

      const admissionContract = inputIssue
        ? {
            inputSchema: binding.definition.inputSchema,
            outputSchema: false,
            partialOutputSchema: false,
            recoveryOutputSchema: localToolFailureSchema
          }
        : undefined
      const projection = inputIssue
        ? undefined
        : context.run(call, () =>
            binding.owner.invocationSchemas?.(
              binding.definition.name,
              call.input
            )
          )
      const schemas =
        admissionContract ??
        projection ??
        invocationContract(call.name, binding.definition)
      let modelContract: Reply['modelContract']

      try {
        modelContract =
          admissionContract ??
          (projection
            ? binding.owner.invocationSchemas?.(
                binding.definition.name,
                call.input,
                'model'
              )
            : undefined) ??
          modelToolResultSchemas(binding.definition)
      } catch (error) {
        return localToolFailureReply(
          localToolErrorMessage(error),
          'TOOL_CONTRACT_INVALID',
          { stage: 'admission', settlement: 'not-started' }
        )
      }

      let opened = false
      let reply: Reply | undefined
      let output: Reply | undefined
      let abortError: unknown
      let aborted = false
      let decodedResult: unknown
      let decoded = false
      let acknowledged: AiToolOutcome | undefined

      const interrupted = (error: unknown, code: string) =>
        localToolFailureReply(localToolErrorMessage(error), code, {
          settlement:
            acknowledged?.settlement ??
            (inputIssue || !reply ? 'not-started' : 'unknown'),
          ...(decoded && !inputIssue
            ? {
                executionResult: decodedResult,
                ...(acknowledged ? { executionOutcome: acknowledged } : {})
              }
            : {})
        })

      try {
        if (!inputIssue) {
          await leases.open({
            requestId: options.requestId,
            callId: call.callId,
            input: call.input,
            inputSchema: schemas.inputSchema as AiJsonValue
          })
          opened = true
        }

        reply = await leaf(call)
        const value = JSON.parse(reply.text)

        decodedResult = value
        decoded = true
        const outcome = localToolReplyOutcome(reply)

        if (inputIssue) {
          const failureIssue = localToolFailureIssue(value, outcome)

          if (
            failureIssue ||
            outcome.status !== 'failed' ||
            outcome.settlement !== 'not-started'
          ) {
            throw new Error(
              failureIssue ??
                'Rejected input must remain failed and not-started'
            )
          }
        }

        const validatedSchema =
          projection || inputIssue
            ? undefined
            : localToolResultSchema(reply, binding.definition, call)
        const contract = {
          ...binding.definition,
          inputSchema: schemas.inputSchema as AiJsonValue,
          outputSchema: schemas.outputSchema as AiJsonValue,
          partialOutputSchema: schemas.partialOutputSchema as
            AiJsonValue | undefined,
          recoveryOutputSchema: schemas.recoveryOutputSchema as
            AiJsonValue | undefined
        }

        if (validatedSchema === undefined) {
          const inspected = inspectAiToolResult(contract, value, {
            outcome,
            validate: operationContractIssue
          })

          if (inspected.status === 'invalid') {
            throw new Error(inspected.issue)
          }
        }

        acknowledged = outcome
        const outputSchema =
          validatedSchema ?? selectAiToolResultSchema(contract, outcome.status)

        if (!inputIssue && outputSchema !== undefined) {
          await leases.retain({
            requestId: options.requestId,
            fromCallId: call.callId,
            value,
            outputSchema
          })
        }

        // Transport acknowledges the validated outcome, not instrumentation flags.
        reply.success = outcome.status === 'success'
        output = reply
      } catch (error) {
        if (options.signal.aborted || call.signal?.aborted) {
          abortError = error
          aborted = true
        } else {
          output = interrupted(error, 'TOOL_HANDOFF_FAILED')
        }
      } finally {
        if (opened) {
          try {
            await leases.release({
              requestId: options.requestId,
              callId: call.callId
            })
          } catch (error) {
            if (!aborted) {
              output = interrupted(error, 'TOOL_CLEANUP_FAILED')
            }
          }
        }
      }

      if (aborted) {
        throw abortError
      }

      if (!output) {
        throw new Error('Native invocation did not settle')
      }

      output.modelContract = modelContract
      const media = selectedImages.get(call)

      if (media?.length) {
        if (output === reply) {
          return { ...output, media }
        }

        const failure = JSON.parse(output.text)

        if (failure.executionResult) {
          return {
            ...output,
            media: media.map((image) => ({
              ...image,
              path: '/executionResult' + image.path
            }))
          }
        }
      }

      return output
    }
  })

  const track = <T>(work: () => Promise<T>): Promise<T> => {
    if (closed) {
      return Promise.reject(new Error('Tool host is closing'))
    }

    const task = Promise.resolve().then(work)

    active.add(task)
    void task.finally(() => active.delete(task)).catch(() => undefined)

    return task
  }

  function project(
    name: string,
    input: unknown,
    value: unknown,
    outcome: AiToolOutcome,
    selectedModelContract?: Reply['modelContract'],
    selectedRevision?: number
  ): { value: unknown; outcome: AiToolOutcome } {
    const candidate = bindings.get(name)
    const binding =
      selectedRevision === undefined ||
      candidate?.definition.revision === selectedRevision
        ? candidate
        : undefined
    const contract =
      binding?.definition ?? library.describe(name, selectedRevision)

    try {
      const boundaryFailure = !operationContractIssue(
        value,
        localToolFailureSchema,
        { stage: 'output' }
      )

      if (boundaryFailure) {
        const boundaryIssue = localToolFailureIssue(value, outcome)

        if (boundaryIssue) {
          throw new Error(boundaryIssue)
        }

        const failure = value as Record<string, unknown>
        let view = value

        if (
          failure.executionOutcome &&
          Object.hasOwn(failure, 'executionResult')
        ) {
          if (!contract) {
            throw new Error('Missing execution evidence owner')
          }

          const execution = failure.executionOutcome as AiToolOutcome
          const schemas = binding?.owner.invocationSchemas?.(
            binding.definition.name,
            input,
            'owner'
          )
          const inspected = inspectAiToolResult(
            { ...contract, ...schemas } as AiToolContract,
            failure.executionResult,
            {
              outcome: execution,
              validate: operationContractIssue
            }
          )

          if (inspected.status === 'invalid') {
            throw new Error(inspected.issue)
          }

          view = {
            ...failure,
            executionResult: project(
              name,
              input,
              failure.executionResult,
              execution,
              undefined,
              selectedRevision
            ).value
          }
        } else if (
          binding?.owner.projectModelResult &&
          failure.executionResult &&
          typeof failure.executionResult === 'object' &&
          !Array.isArray(failure.executionResult)
        ) {
          view = {
            ...failure,
            executionResult: binding.owner.projectModelResult(
              binding.definition.name,
              input,
              failure.executionResult
            )
          }
        }

        const issue = operationContractIssue(view, localToolFailureSchema, {
          stage: 'output'
        })

        if (issue) {
          throw new Error(issue)
        }

        return {
          value: projectToolResultFields(view, localToolFailureSchema),
          outcome
        }
      }

      if (!contract) {
        throw new Error('Missing registered result contract')
      }

      const invocation =
        selectedModelContract ??
        (input === undefined
          ? undefined
          : binding?.owner.invocationSchemas?.(
              binding.definition.name,
              input,
              'model'
            ))
      const activeContract = invocation
        ? { ...contract, ...invocation }
        : contract
      const schemas = invocation ?? modelToolResultSchemas(activeContract)
      let delivered: { value: unknown; outcome: AiToolOutcome }

      if (binding?.owner.projectModelResult) {
        const valueView = binding.owner.projectModelResult(
          binding.definition.name,
          input,
          value
        )

        delivered = {
          value: valueView,
          outcome:
            binding.owner.resultOutcome?.(binding.definition.name, valueView) ??
            outcome
        }
      } else {
        delivered = projectToolDelivery(contract, value, outcome)
      }

      const { value: view, outcome: deliveredOutcome } = delivered

      if (
        deliveredOutcome.settlement !== outcome.settlement ||
        (outcome.status !== 'success' && deliveredOutcome.status === 'success')
      ) {
        throw new Error(
          'Model projection changed the acknowledged execution outcome.'
        )
      }

      const selected = selectAiToolResultSchema(
        { ...activeContract, ...schemas } as AiToolContract,
        deliveredOutcome.status
      )
      const projected = projectToolResultFields(
        view,
        {
          anyOf: [
            selected,
            activeContract.outputSchema,
            activeContract.partialOutputSchema,
            activeContract.recoveryOutputSchema
          ]
            .filter((s) => s !== undefined)
            .map((s, index) =>
              embedAiToolSchema(s as AiJsonValue, `#/anyOf/${index}`)
            )
        },
        binding?.owner.projectedResultPaths
      )
      const inspected = inspectAiToolResult(
        { ...activeContract, ...schemas } as AiToolContract,
        projected,
        {
          outcome: deliveredOutcome,
          validate: operationContractIssue
        }
      )

      if (inspected.status === 'invalid') {
        throw new Error(inspected.issue)
      }

      return { value: projected, outcome: deliveredOutcome }
    } catch (error) {
      return {
        value: toolDeliveryFailure(
          value,
          localToolErrorMessage(error),
          contract ?? {},
          outcome
        ),
        outcome: { status: 'partial', settlement: outcome.settlement }
      }
    }
  }

  function invoke(call: AiInvocation, internal = false): Promise<Reply> {
    return track(async () => {
      if (!internal && call.name === operationGroupName) {
        return localToolFailureReply(
          'Private dispatch is unavailable.',
          'UNKNOWN_TOOL',
          { settlement: 'not-started' }
        )
      }

      if (
        !internal &&
        call.name ===
          'design_workflow.' + AiDesignToolIds.PREPARE_AND_APPLY_DESIGN &&
        call.input &&
        typeof call.input === 'object' &&
        ('retain' in call.input || 'delivery' in call.input)
      ) {
        const definition = bindings.get(call.name)?.definition
        const issue =
          definition && operationInputIssue(call.input, definition.inputSchema)

        if (!definition || issue) {
          return localToolFailureReply(
            issue ?? 'Missing drawing owner',
            'PREPARATION_REJECTED',
            { settlement: 'not-started' }
          )
        }

        const { retain, delivery, ...arguments_ } = call.input as Record<
          string,
          unknown
        > &
          DeliveryRequest

        const selections = (value: DeliveryRequest['retain']) =>
          value &&
          Object.fromEntries(
            Object.entries(value).map(([key, selector]) => [
              key,
              { ...selector, step: 'draw' }
            ])
          )

        call = {
          ...call,
          name: 'design_operations.' + AiDesignToolIds.EXECUTE_DESIGN,
          input: {
            operations: [
              { id: 'draw', name: call.name, arguments: arguments_ }
            ],
            ...(retain ? { retain: selections(retain) } : {}),
            ...(delivery
              ? {
                  delivery:
                    typeof delivery === 'object'
                      ? { fields: selections(delivery.fields) }
                      : delivery
                }
              : {})
          }
        }
      }

      if (
        call.name === 'design_operations.' + AiDesignToolIds.EXECUTE_DESIGN &&
        call.input &&
        typeof call.input === 'object'
      ) {
        try {
          call = {
            ...call,
            input: await resolveConversationInputs(
              call.input as Record<string, unknown>,
              options.resultContext,
              planSequence.authoredInput
            )
          }
        } catch (error) {
          return localToolFailureReply(
            localToolErrorMessage(error),
            'RESULT_CONTEXT_UNAVAILABLE',
            { settlement: 'not-started' }
          )
        }
      }

      const reply = await native.invoke({
        ...call,
        signal: call.signal ?? options.signal
      })

      if (internal) {
        return reply
      }

      const delivered = project(
        call.name,
        call.input,
        JSON.parse(reply.text),
        reply.outcome,
        reply.modelContract
      )

      return {
        ...reply,
        success: delivered.outcome.status === 'success',
        outcome: delivered.outcome,
        text: JSON.stringify(delivered.value)
      }
    })
  }

  return {
    groups,

    get revision() {
      return library.revision
    },

    definitions() {
      return library
        .list()
        .filter((definition) => definition.name !== operationGroupName)
        .map((definition) => {
          const binding = bindings.get(definition.name)

          if (binding) {
            return {
              ...invocationContract(definition.name, definition),
              resultPaths: binding.definition.resultPaths,
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
          }

          return {
            ...definition,
            registeredName: definition.name,
            namespace: 'tool_library',
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
