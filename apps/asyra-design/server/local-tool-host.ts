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
  LocalToolInputError,
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

/** Keep Runtime admission and model recovery projection on the same failure contract. */
const invocationRecoverySchema = (schema: unknown): AiJsonValue => ({
  anyOf: [schema, localToolFailureSchema]
    .filter((value) => value !== undefined)
    .map((value, index) =>
      embedAiToolSchema(value as AiJsonValue, `#/anyOf/${index}`)
    )
})

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
      definition: LocalToolDefinition
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
              (phase) => options.onPhase?.(call, phase)
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
          // Leaves validate the unchanged owner value before adding metadata.
          // Runtime consumes that complete value plus the host outcome.
          ...Object.fromEntries(
            ['outputSchema', 'partialOutputSchema', 'recoveryOutputSchema'].map(
              (key) => [
                key,
                runtimeOperationSchema(
                  hostToolResultSchema(
                    key === 'recoveryOutputSchema'
                      ? invocationRecoverySchema(
                          definition.recoveryOutputSchema
                        )
                      : definition[key as keyof typeof definition],
                    true
                  )
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

      return {
        ...value.toolOutcome,
        issues:
          value.toolOutcome.issues?.map(
            (issue: { message: string }) => issue.message
          ) ?? [],
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

                const schemas = modelToolResultSchemas(owner ?? contract)

                return createAiToolContract({
                  ...contract,
                  ...schemas,
                  recoveryOutputSchema: invocationRecoverySchema(
                    schemas.recoveryOutputSchema
                  )
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
            localToolReferences(
              value,
              hostToolResultSchema(descriptor.outputSchema),
              blocked
            )
          }

          const blockedInput = new Set<unknown>()

          localToolReferences(input, descriptor.inputSchema, blockedInput)
          await delivery.capture(
            step,
            project(name, input, value),
            blocked,
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

        if (value.toolOutcome.status === 'success') {
          await capture(undefined, operationGroupName, plan.batch, value)
        }

        return JSON.stringify({
          ...(request.delivery === undefined ? value : {}),
          ...(await delivery.finish(
            value.toolOutcome,
            (value.actionResults ?? []).map(
              (a: { actionName: string }) => a.actionName
            ),
            (value.toolOutcome.issues ?? []).map(
              (i: { message: string }) => i.message
            )
          )),
          ...(request.delivery !== undefined &&
          value.toolOutcome.status !== 'success'
            ? { failure: project(operationGroupName, plan.batch, value) }
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

          await delivery.capture(undefined, view.execution.value, blocked)
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
          const projected = project(operationGroupName, args, value)

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
        return project(operationGroupName, args, value)
      }

      const receipt = value.execution as {
        calls?: { name: string; stepId?: string }[]
        value?: unknown
        recovery?: { name: string; value?: unknown }[]
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
      const name = receipt.calls?.find((c) => c.stepId === stepId)?.name
      const projectFinal = name && receipt.value !== undefined
      const finalValue = projectFinal
        ? project(name, undefined, receipt.value)
        : receipt.value

      const incomplete =
        projectFinal &&
        finalValue &&
        typeof finalValue === 'object' &&
        'toolOutcome' in finalValue
          ? localToolOutcome(finalValue as Record<string, unknown>)
          : undefined

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
          ...(receipt.value !== undefined ? { value: finalValue } : {}),
          ...(receipt.recovery
            ? {
                recovery: receipt.recovery.map((r) => ({
                  ...r,
                  value: project(r.name, undefined, r.value)
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

      const issue = operationInputIssue(
        call.input,
        binding.definition.inputSchema
      )

      // The canonical boundary preserves owner-specific repair diagnostics.
      if (issue) {
        return leaf(call)
      }

      const projection = context.run(call, () =>
        binding.owner.invocationSchemas?.(binding.definition.name, call.input)
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

          if (outputIssue) {
            throw new Error(outputIssue)
          }

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
        } else {
          output = interrupted(error, 'TOOL_HANDOFF_FAILED')
        }
      }

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

      if (aborted) {
        throw abortError
      }

      if (!output) {
        throw new Error('Native invocation did not settle')
      }

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
      if (!contract) {
        throw new Error('Missing registered result contract')
      }

      // Save receipts and selected results use their invocation's public schema.
      // Retention metadata must not replace or hide the default final result.
      const invocation =
        input === undefined ||
        binding.owner !== sequenceOwner ||
        !value ||
        typeof value !== 'object' ||
        !('saved' in value) ||
        ((input as DeliveryRequest).delivery !== undefined &&
          !('failure' in value))
          ? undefined
          : binding.owner.invocationSchemas?.(
              binding.definition.name,
              input,
              'model'
            )
      const activeContract = invocation
        ? { ...contract, ...invocation }
        : contract
      const schemas = modelToolResultSchemas(activeContract)
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
          // Raw browser prefixes have no host acknowledgement yet and remain
          // with the operation failure projector, not this native egress boundary.
          if (
            'toolOutcome' in failure.executionResult &&
            !operationContractIssue(failure.executionResult, ownerResults, {
              stage: 'output'
            })
          ) {
            receipt = {
              ...failure,
              executionResult: project(name, input, failure.executionResult)
            }
          }
        }
      }

      let view = receipt

      if (binding.owner.projectModelResult) {
        view = binding.owner.projectModelResult(
          binding.definition.name,
          input,
          receipt
        )
      } else if (contract.delivery && !boundaryFailure) {
        view = projectToolDelivery(contract, receipt)
      }

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
        ) {
          return toolDeliveryFailure(
            value,
            'Model projection changed the acknowledged execution outcome.',
            contract
          )
        }

        view = { ...view, toolOutcome: report }
      }

      // Match validated owner fields before removing internal-only fields. A closed
      // model schema cannot match the complete owner value until those are removed.
      const selectionSchema = {
        anyOf: [
          projectionSchema,
          ...[
            activeContract.outputSchema,
            activeContract.partialOutputSchema,
            activeContract.recoveryOutputSchema
          ]
            .filter((schema) => schema !== undefined)
            .map((schema) => hostToolResultSchema(schema))
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

      const original = JSON.parse(reply.text)
      const value = project(call.name, call.input, original)

      if (value === original) {
        return reply
      }

      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { ...reply, text: JSON.stringify(value) }
      }

      const projected = value as Record<string, unknown>
      const outcome =
        projected.toolOutcome && typeof projected.toolOutcome === 'object'
          ? (projected.toolOutcome as { status: string })
          : localToolOutcome(projected)

      return {
        ...reply,
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
      return library
        .list()
        .filter((definition) => definition.name !== operationGroupName)
        .map((definition) => {
          const binding = bindings.get(definition.name)

          if (binding) {
            return {
              ...definition,
              inputSchema: runtimeOperationSchema(
                binding.definition.inputSchema
              ),
              ...Object.fromEntries(
                [
                  'outputSchema',
                  'partialOutputSchema',
                  'recoveryOutputSchema'
                ].map((key) => [
                  key,
                  hostToolResultSchema(
                    binding.definition[key as keyof typeof binding.definition],
                    true
                  )
                ])
              ),
              resultPaths: binding.definition.resultPaths,
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
