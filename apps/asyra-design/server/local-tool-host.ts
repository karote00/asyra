import { AiToolFailureCodes } from '../src/constants/ai-design'
import { requireSupportedToolSchemas } from '@asyra/ai-agent-runtime/schema'
import type { AiToolImage } from '@asyra/ai-agent-runtime'
import type { ExchangeConversationResults } from '@asyra/ai-agent-runtime'
import { readNamedFields, type DeliveryRequest } from '@asyra/ai-agent-runtime'
import {
  createDesignResultDelivery,
  resolveConversationInputs
} from './local-result-delivery'
import { runtimeOperationSchema } from './local-operation-batch'
import { AsyncLocalStorage } from 'node:async_hooks'
import {
  AiToolContractError,
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
  createAiToolLeases,
  aiToolReferences,
  aiToolSchemaIsPortable
} from '@asyra/ai-agent-runtime/schema'
import { createAiToolHostLibrary } from '@asyra/ai-agent-runtime/node'
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
import { createAiToolScheduler, AiToolAccess } from '@asyra/ai-agent-runtime'
import { AiToolInputError } from '@asyra/ai-agent-runtime'
import {
  invokeLocalTool,
  invocationRecoverySchema,
  localToolFailureReply,
  localToolFailureSchema,
  localToolFailureModelSchema,
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
} from '@asyra/ai-agent-runtime/schema'
import type { AiToolOwnership } from '@asyra/ai-agent-runtime/schema'
import {
  projectToolDelivery,
  toolDeliveryFailure,
  projectToolResultFields,
  modelToolDeliveryFailureSchema,
  modelToolResultSchemas
} from '@asyra/ai-agent-runtime/schema'
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
      readonly executionAccess?: AiToolAccess
    })[]
  }
}
type Reply = Awaited<ReturnType<typeof invokeLocalTool>> & {
  media?: AiToolImage[]
  executionContract?: AiToolContract
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
  createGroups: (ownership: AiToolOwnership) => readonly LocalToolGroup[]
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
  const selectedImages = new WeakMap<AiInvocationContext, AiToolImage[]>()
  // Invocation evidence lives only through one outer call's public delivery.
  // Inputs/contracts are shared references; no second saved-result store exists.
  const completedInvocations = new AsyncLocalStorage<
    Map<
      string,
      {
        input: unknown
        contract: LocalToolDefinition & AiToolContract
        inputIssue?: string
        modelContract: Reply['modelContract']
        projection?: ReturnType<typeof project>
      }
    >
  >()
  const registry = createAiActionRegistry()
  const leases = createAiToolLeases({
    requestId: options.requestId,
    capacity: options.artifactCapacity
  })
  const schedule = createAiToolScheduler(options.signal)
  const ownership: AiToolOwnership = {
    requestId: options.requestId,

    publish: (handle, release, validate, lifetime) => {
      const callId = context.getStore()?.callId

      leases.publish({
        handle,
        release,
        validate,
        callId: lifetime === 'request' ? undefined : callId
      })
      // Request lifetime and the creator's right to export are independent.
      if (lifetime === 'request' && callId !== undefined) {
        leases.borrow(handle, callId)
      }
    },

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
      access?: AiToolAccess
    }
  >()
  const active = new Set<Promise<unknown>>()
  let closing: Promise<void> | undefined
  let closed = false

  const selectInvocation = (call: AiInvocationContext) => {
    const retained = completedInvocations.getStore()?.get(call.callId)

    if (retained) {
      return retained
    }

    const binding = bindings.get(call.name)

    if (!binding) {
      throw new Error('Missing registered invocation owner')
    }

    const staticIssue = operationInputIssue(
      call.input,
      binding.definition.inputSchema
    )
    const admissionContract = staticIssue
      ? {
          inputSchema: binding.definition.inputSchema,
          outputSchema: false,
          partialOutputSchema: false,
          recoveryOutputSchema: localToolFailureSchema
        }
      : undefined
    const selected = staticIssue
      ? undefined
      : context.run(call, () =>
          binding.owner.invocationSchemas?.(
            binding.definition.name,
            call.input,
            'owner'
          )
        )
    const schemas =
      admissionContract ??
      selected ??
      invocationContract(call.name, binding.definition)
    const contract = {
      ...binding.definition,
      ...schemas,
      recoveryOutputSchema: invocationRecoverySchema(
        schemas.recoveryOutputSchema,
        localToolFailureSchema
      )
    } as LocalToolDefinition & AiToolContract

    requireSupportedToolSchemas(contract)
    const model =
      admissionContract ??
      context.run(call, () =>
        binding.owner.invocationSchemas?.(
          binding.definition.name,
          call.input,
          'model'
        )
      ) ??
      modelToolResultSchemas(binding.definition)
    const handoff = {
      input: call.input,
      contract,
      inputIssue:
        staticIssue ?? operationInputIssue(call.input, contract.inputSchema),
      modelContract: {
        ...model,
        recoveryOutputSchema: invocationRecoverySchema(
          model.recoveryOutputSchema,
          localToolFailureSchema
        )
      }
    }

    requireSupportedToolSchemas({ ...contract, ...handoff.modelContract })
    completedInvocations.getStore()?.set(call.callId, handoff)

    return handoff
  }

  const leaf = async (
    call: AiInvocationContext,
    selected?: LocalToolDefinition
  ): Promise<Reply> => {
    const binding = bindings.get(call.name)

    if (!binding) {
      throw new Error('No registered native owner for this invocation')
    }

    return schedule(
      binding.owner.canOverlapPreparation?.(binding.definition.name, call.input)
        ? AiToolAccess.ISOLATED
        : binding.access,
      () =>
        context.run(call, async () => {
          const work = () =>
            invokeLocalTool(
              binding.owner,
              selected ?? binding.definition,
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

      const ownerContract = createAiToolContract(source)
      const definition = createAiToolContract({
        ...ownerContract,
        recoveryOutputSchema: invocationRecoverySchema(
          ownerContract.recoveryOutputSchema,
          localToolFailureSchema
        )
      })

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
                  definition[key as keyof typeof definition]
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
  const library = createAiToolHostLibrary({
    saveInvocationName: 'tool_library.save_tool',
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

    resolveContract: (call) => {
      const { contract } = selectInvocation(call)

      return {
        inputSchema: runtimeOperationSchema(
          contract.inputSchema,
          true
        ) as AiJsonValue,
        outputSchema: runtimeOperationSchema(
          contract.outputSchema
        ) as AiJsonValue,
        partialOutputSchema: runtimeOperationSchema(
          contract.partialOutputSchema
        ) as AiJsonValue | undefined,
        recoveryOutputSchema: runtimeOperationSchema(
          contract.recoveryOutputSchema
        ) as AiJsonValue | undefined
      }
    },

    execute: async (call) => {
      const reply = await leaf(call, selectInvocation(call).contract)
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

  // Discovery, selected invocation and Runtime share the owner's contract and
  // the same canonical admission-failure alternative.
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
    (name, input, value, outcome, revision) => {
      const execution = outcome as AiToolOutcome & {
        callId?: string
        calls?: { name: string; revision: number; callId: string }[]
      }
      const receipt = execution.callId
        ? execution
        : execution.calls?.findLast(
            (c) => c.name === name && c.revision === revision
          )

      return projectCompleted(
        { name, revision, callId: receipt?.callId },
        input,
        value,
        outcome
      )
    },
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
      throw new AiToolInputError('Private dispatcher')
    }

    const names = operationNames.get(name)

    if (names && names.length > 1) {
      throw new AiToolInputError('Ambiguous operation: ' + name)
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
  ) => {
    const message = failure.issues
      .map((i) => i.path + ' ' + i.actual)
      .join('; ')
    const authoredInput =
      failure.omittedIssues === 0 &&
      failure.issues.length > 0 &&
      failure.issues.every(
        (issue) =>
          issue.code === 'value' ||
          issue.code === 'reference' ||
          (issue.code === 'binding' &&
            (issue.path === '/output' ||
              issue.path.startsWith('/output/') ||
              /^\/steps\/\d+\/input(?:\/|$)/.test(issue.path)))
      )

    return authoredInput
      ? new AiToolInputError(message)
      : new AiToolContractError(
          'registration',
          message || 'Host contract admission did not return complete issues'
        )
  }

  const prepare = (args: unknown) => {
    if ((args as DeliveryRequest).retain && !options.resultContext) {
      throw new AiToolContractError(
        'registration',
        'No active App conversation context'
      )
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
          throw error instanceof RecipeReferenceError
            ? new AiToolInputError(localToolErrorMessage(error))
            : new AiToolContractError(
                'registration',
                localToolErrorMessage(error)
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
          throw new AiToolInputError(
            'Selected result requires a step output',
            AiToolFailureCodes.INPUT_INVALID
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
                  !aiToolSchemaIsPortable(selectedSchema)
                ) {
                  throw error
                }
              }
            } catch (error) {
              const message =
                'delivery.fields.' +
                name +
                ' (step ' +
                source.step +
                ', path ' +
                source.path +
                '): ' +
                localToolErrorMessage(error)

              throw error instanceof RecipeReferenceError
                ? new AiToolInputError(message)
                : new AiToolContractError('registration', message)
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
      if (error instanceof AiToolInputError) {
        throw error
      }

      throw new AiToolContractError(
        'registration',
        localToolErrorMessage(error)
      )
    }

    if (call) {
      preparedCalls.set(call, plan)
    }

    return plan
  }

  function sequenceFinalStep(args: unknown) {
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

    return stepId
  }

  const sequenceOwner = {
    projectedResultPaths: ['/execution/value', '/execution/recovery/*/value'],
    definitions: [{ ...sequence, executionAccess: AiToolAccess.COORDINATOR }],

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
            inputSchema: sequence.inputSchema,
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
                  // Ready batch rows depend on the admitted query. Their owner
                  // validates the complete receipt; capture checks the actual
                  // selected path. They are not guaranteed named-step bindings.
                  const schema =
                    owner && !plan.batch
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
      const call = context.getStore()

      const deliverImages = (images: AiToolImage[], name: string) => {
        if (call) {
          const prefix =
            '/fields/' + name.replace(/~/g, '~0').replace(/\//g, '~1')
          const selected = (selectedImages.get(call) ?? []).filter(
            (image) =>
              image.path !== prefix && !image.path.startsWith(prefix + '/')
          )

          selected.push(...images)
          selectedImages.set(call, selected)
        }
      }

      if (
        !(args as Record<string, unknown>).operations &&
        !(args as Record<string, unknown>).stages
      ) {
        return JSON.stringify(
          await readNamedFields(args, options.resultContext, deliverImages)
        )
      }

      const plan = preparedFor(args)

      const request = args as DeliveryRequest
      const delivery =
        request.delivery ||
        request.retain ||
        (args as Record<string, unknown>).stages
          ? createDesignResultDelivery(
              request,
              options.resultContext,
              deliverImages
            )
          : undefined

      let finalSelectionData:
        | {
            projected: ReturnType<typeof project>
            input: { value: unknown; blocked: ReadonlySet<string> }
            blocked: ReadonlySet<string>
            name: string
          }
        | undefined

      const capture = async (
        step: string | undefined,
        name: string,
        input: unknown,
        value: unknown,
        receipt?: { callId: string; revision: number }
      ) => {
        const finalSelection = Boolean(
          delivery?.selects(undefined) &&
          step &&
          step === sequenceFinalStep(args)
        )

        if (!delivery || (!delivery.selects(step) && !finalSelection)) {
          return
        }

        try {
          const descriptor =
            bindings.get(name)?.definition ?? library.describe(name)

          if (!descriptor) {
            throw Error('Missing result owner')
          }

          const projected = projectCompleted(
            { name, ...receipt },
            input,
            value,
            {
              status: 'success',
              settlement: 'completed'
            }
          )

          const blocked = new Set<string>()
          const blockedInput = new Set<string>()

          if (
            delivery.retains(step) ||
            (finalSelection && delivery.retains(undefined))
          ) {
            aiToolReferences(projected.value, projected.schema, blocked)
            const inputPaths = new Set<string>()

            aiToolReferences(input, projected.inputSchema, inputPaths)
            const prefix = planSequence.publicInputSchemaPath(name, step)

            for (const path of inputPaths) {
              if (path === prefix || path.startsWith(prefix + '/')) {
                blockedInput.add(path.slice(prefix.length))
              } else if (prefix.startsWith(path + '/')) {
                blockedInput.add('')
              }
            }
          }

          const publicInput = {
            value: planSequence.publicInput(name, input, step),
            blocked: blockedInput
          }

          if (finalSelection) {
            finalSelectionData = {
              projected,
              input: publicInput,
              blocked,
              name
            }
          }

          if (!delivery.selects(step)) {
            return
          }

          await delivery.capture(
            step,
            projected.value,
            blocked,
            projected.outcome,
            publicInput,
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
        throw new Error('Missing sequence')
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
          ? (step, input, value, receipt) =>
              capture(step.id, step.tool, input, value, receipt)
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
          const selected = finalSelectionData

          if (!selected) {
            throw Error('Missing final result projection')
          }

          await delivery.capture(
            undefined,
            selected.projected.value,
            selected.blocked,
            selected.projected.outcome,
            selected.input,
            selected.name
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
        calls?: {
          name: string
          revision: number
          stepId?: string
          callId: string
        }[]
        value?: unknown
        recovery?: ({
          name: string
          callId: string
          revision: number
          value?: unknown
        } & AiToolOutcome)[]
      }
      const selectedCall = receipt.calls?.findLast(
        (call) => call.stepId === sequenceFinalStep(args)
      )
      const name = selectedCall?.name
      const projectFinal = name && receipt.value !== undefined
      const finalValue = projectFinal
        ? projectCompleted(
            {
              name,
              revision: selectedCall.revision,
              callId: selectedCall.callId
            },
            undefined,
            receipt.value,
            receipt
          )
        : undefined

      const incomplete = finalValue?.outcome

      return {
        ...value,
        ...(incomplete && incomplete.status !== 'success'
          ? {
              toolOutcome: {
                ...('toolOutcome' in value &&
                value.toolOutcome &&
                typeof value.toolOutcome === 'object'
                  ? value.toolOutcome
                  : {}),
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
                  value: projectCompleted(r, undefined, r.value, r).value
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

      let selection: ReturnType<typeof selectInvocation>

      try {
        selection = selectInvocation(call)
      } catch (error) {
        return localToolFailureReply(
          localToolErrorMessage(error),
          error instanceof AiToolInputError
            ? error.code
            : 'TOOL_CONTRACT_INVALID',
          { stage: 'admission', settlement: 'not-started' }
        )
      }

      const { inputIssue, contract, modelContract } = selection

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
        // Rejection diagnostics may publish repair resources. They still own a
        // call scope, but unadmitted arguments cannot borrow any input resource.
        await leases.open({
          requestId: options.requestId,
          callId: call.callId,
          input: inputIssue ? null : call.input,
          inputSchema: inputIssue
            ? { type: 'null' }
            : (contract.inputSchema as AiJsonValue)
        })
        opened = true

        reply = await leaf(call, contract)
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

        const validatedSchema = inputIssue
          ? undefined
          : localToolResultSchema(reply, contract, call)

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
          output = interrupted(
            error,
            !opened && error instanceof AiToolInputError
              ? error.code
              : 'TOOL_HANDOFF_FAILED'
          )
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
      output.executionContract = contract
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
    selectedRevision?: number,
    selectedExecutionContract?: AiToolContract
  ): {
    value: unknown
    outcome: AiToolOutcome
    schema?: unknown
    inputSchema?: unknown
  } {
    const candidate = bindings.get(name)
    const binding =
      selectedRevision === undefined ||
      candidate?.definition.revision === selectedRevision
        ? candidate
        : undefined
    const contract =
      binding?.definition ?? library.describe(name, selectedRevision)
    let deliveryContract: Reply['modelContract'] = selectedModelContract
    let deliveryValue: unknown

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
          const inspected = inspectAiToolResult(
            selectedExecutionContract ?? contract,
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
              selectedModelContract,
              selectedRevision,
              selectedExecutionContract
            ).value
          }
        } else if (binding?.owner.projectModelResult) {
          // The owner projects its complete failure envelope. Its executionResult
          // is evidence within that envelope, not another invocation result.
          view = binding.owner.projectModelResult(
            binding.definition.name,
            input,
            value
          )
        }

        const publicView = projectToolResultFields(view, localToolFailureSchema)
        const issue = localToolFailureIssue(publicView, outcome, 'model')

        if (issue) {
          throw new Error(issue)
        }

        return {
          value: publicView,
          schema: localToolFailureModelSchema,
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

      deliveryContract = schemas
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

      deliveryValue = view

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

      return {
        value: projected,
        outcome: deliveredOutcome,
        schema: selected,
        inputSchema: activeContract.inputSchema
      }
    } catch (error) {
      // Failure evidence uses the pinned public contract. Composite child slots
      // are public only after their owners projected them; raw opaque values
      // cannot substitute for a missing or invalid child projection.
      const failureContract = deliveryContract ?? { outputSchema: false }

      return {
        value: toolDeliveryFailure(
          binding?.owner.projectedResultPaths?.length ? deliveryValue : value,
          localToolErrorMessage(error),
          failureContract,
          outcome
        ),
        outcome: { status: 'partial', settlement: outcome.settlement },
        schema: modelToolDeliveryFailureSchema(failureContract)
      }
    }
  }

  function projectCompleted(
    receipt: { name: string; revision?: number; callId?: string },
    input: unknown,
    value: unknown,
    outcome: AiToolOutcome
  ) {
    const handoff = receipt.callId
      ? completedInvocations.getStore()?.get(receipt.callId)
      : undefined

    if (handoff?.projection) {
      return handoff.projection
    }

    const projected = project(
      receipt.name,
      handoff ? handoff.input : input,
      value,
      outcome,
      handoff?.modelContract,
      receipt.revision,
      handoff?.contract
    )

    if (handoff) {
      handoff.projection = projected
    }

    return projected
  }

  function invoke(call: AiInvocation, internal = false): Promise<Reply> {
    return track(() => {
      const invocations: NonNullable<
        ReturnType<typeof completedInvocations.getStore>
      > = new Map()

      return completedInvocations.run(invocations, async () => {
        try {
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
              definition &&
              operationInputIssue(call.input, definition.inputSchema)

            if (!definition || issue) {
              return localToolFailureReply(
                issue ?? 'Missing drawing owner',
                AiToolFailureCodes.INPUT_INVALID,
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
            call.name ===
              'design_operations.' + AiDesignToolIds.EXECUTE_DESIGN &&
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
                error instanceof AiToolContractError && error.stage === 'input'
                  ? AiToolFailureCodes.INPUT_INVALID
                  : 'RESULT_CONTEXT_UNAVAILABLE',
                { stage: 'admission', settlement: 'not-started' }
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
            reply.modelContract,
            undefined,
            reply.executionContract
          )

          return {
            ...reply,
            success: delivered.outcome.status === 'success',
            outcome: delivered.outcome,
            text: JSON.stringify(delivered.value)
          }
        } finally {
          invocations.clear()
        }
      })
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
