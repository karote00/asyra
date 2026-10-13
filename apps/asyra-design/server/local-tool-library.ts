import { randomUUID } from 'node:crypto'
import {
  AiToolContractError,
  createAiToolContract,
  createAiToolLibrary,
  createAiRecipeInvoker,
  createAiRecipeRecoverySchema,
  type AiToolContract,
  createAiToolPersistence,
  createAiToolStoreManagement,
  type AiInvocation,
  type AiRecipeExecutionResult,
  type AiRecipeInvokerOptions,
  type AiRecipeSubmission,
  type AiToolLibraryOptions,
  type AiToolPersistenceOptions,
  type AiToolSaveResult
} from '@asyra/ai-agent-runtime'

export interface LocalToolLibraryOptions
  extends
    Pick<
      AiRecipeInvokerOptions,
      'registry' | 'validate' | 'execute' | 'leases' | 'observe'
    >,
    Pick<AiToolLibraryOptions, 'limits' | 'capacity'>,
    Pick<AiToolPersistenceOptions, 'store' | 'check'> {
  readonly requestId: string
  readonly receiptCapacity: number
}

export interface LocalToolInvocationResult {
  readonly execution: AiRecipeExecutionResult
  readonly storage?: AiToolSaveResult
  readonly receiptId?: string
}

/** A request coordinator, not a second registry, interpreter or leaf scheduler. */
export const createLocalToolLibrary = (options: LocalToolLibraryOptions) => {
  if (!options.requestId.trim())
    throw new TypeError('A request identity is required')
  if (
    !Number.isSafeInteger(options.receiptCapacity) ||
    options.receiptCapacity < 1
  )
    throw new TypeError('Receipt capacity must be a positive safe integer')
  const pending = new Map<
    string,
    {
      name: string
      revision: number
      receipt?: AiRecipeExecutionResult
    }
  >()
  const active = new Set<Promise<unknown>>()
  let generation = 0
  let closing: Promise<void> | undefined
  const track = <T>(work: () => Promise<T>): Promise<T> => {
    if (closing) return Promise.reject(new Error('Tool library is closing'))
    const running = Promise.resolve().then(work)
    active.add(running)
    void running.finally(() => active.delete(running)).catch(() => undefined)
    return running
  }
  const changing = <T>(work: () => Promise<T>): Promise<T> =>
    track(async () => {
      try {
        return await work()
      } finally {
        generation++
      }
    })
  const library = createAiToolLibrary({
    registry: options.registry,
    capacity: options.capacity,
    limits: options.limits,
    validate: options.validate,
    createExecutor: (recipe) => async (input, context) => {
      const { execution } = await invoke({
        name: recipe.contract.name,
        revision: recipe.contract.revision,
        input,
        signal: context.signal
      })
      if (execution.status !== 'success')
        throw new AiToolContractError('output', execution.issues.join('; '), {
          status: execution.status,
          settlement: execution.settlement,
          value: execution.value
        })
      return execution.value
    }
  })
  const invoker = createAiRecipeInvoker({
    registry: options.registry,
    recipe: library.recipe,
    validate: options.validate,
    execute: options.execute,
    leases: options.leases,
    maxSteps: options.limits.steps,
    observe: options.observe
  })
  const persistence = createAiToolPersistence({
    registry: options.registry,
    library,
    store: options.store,
    capacity: options.capacity,
    check: options.check
  })
  const management = createAiToolStoreManagement(options)
  const savedIdentities = new Set<string>()
  const identity = (name: string, revision: number) =>
    JSON.stringify([name, revision])
  const save = async (input: Parameters<typeof persistence.save>[0]) => {
    const result = await persistence.save(input)
    if (result.status === 'saved')
      savedIdentities.add(identity(input.name, input.revision))
    return result
  }
  const rejected = (issue: string): LocalToolInvocationResult => ({
    execution: {
      status: 'failed',
      settlement: 'not-started',
      calls: [],
      issues: [issue]
    }
  })
  const invoke = (
    input: AiInvocation & { revision?: number }
  ): Promise<LocalToolInvocationResult> =>
    track(async () => {
      const registered = options.registry.registration(input.name, {
        requestId: options.requestId,
        revision: input.revision
      })
      if (!registered || registered.definition.composition !== 'allowed')
        return rejected(
          'Use an available data-plane tool; library controls cannot be invoked as recipes.'
        )
      const callId = input.callId ?? randomUUID()
      const composed = registered.kind === 'composition'
      const revision = registered.definition.revision
      if (composed) {
        const requiresSaved =
          registered.availability === 'eligible' ||
          savedIdentities.has(identity(input.name, revision))
        try {
          const current = await management.read(input.name, revision)
          if (
            (!current && requiresSaved) ||
            (current &&
              current.availability !== 'eligible' &&
              current.availability !== 'candidate')
          )
            return rejected(
              'Saved tool is unavailable; refresh discovery before invoking.'
            )
        } catch {
          if (requiresSaved)
            return rejected(
              'Saved tool state could not be verified; retry admission without replaying work.'
            )
        }
        if (pending.has(callId))
          return rejected(
            'An active or unsaved invocation already owns this call identity.'
          )
        if (pending.size >= options.receiptCapacity)
          return rejected(
            'Save outstanding receipts before starting another composition.'
          )
        pending.set(callId, { name: input.name, revision })
      }
      try {
        const execution = await invoker.invoke({
          ...input,
          callId,
          revision,
          requestId: options.requestId
        })
        if (!composed) return { execution }
        if (
          execution.status !== 'success' ||
          execution.settlement !== 'completed' ||
          execution.issues.length
        ) {
          pending.delete(callId)
          return { execution }
        }
        pending.set(callId, { name: input.name, revision, receipt: execution })
        const storage = await save({
          name: input.name,
          revision,
          requestId: options.requestId,
          receipt: execution
        })
        generation++
        if (storage.status === 'saved') pending.delete(callId)
        return {
          execution,
          storage,
          ...(storage.status === 'unsaved' ? { receiptId: callId } : {})
        }
      } catch (error) {
        if (composed) pending.delete(callId)
        throw error
      }
    })

  return {
    invoke,
    get revision() {
      return generation
    },
    list() {
      return options.registry
        .list({ requestId: options.requestId })
        .map((item) => {
          const registered = options.registry.registration(item.name, {
            requestId: options.requestId
          })
          if (!registered)
            throw new Error('Registered tool changed during discovery')
          return {
            ...createAiToolContract(registered.definition),
            kind: registered.kind,
            availability: registered.availability
          }
        })
    },
    describe(name: string, revision?: number) {
      const definition = options.registry.get(name, {
        requestId: options.requestId,
        revision
      })
      return definition ? createAiToolContract(definition) : undefined
    },
    describeRecovery(name: string, revision: number) {
      const contracts = new Map<string, AiToolContract>()
      const collect = (name: string, revision: number) => {
        const key = identity(name, revision)
        if (contracts.has(key)) return
        const definition = options.registry.get(name, {
          requestId: options.requestId,
          revision
        })
        if (!definition) return
        contracts.set(key, createAiToolContract(definition))
        for (const dependency of library.recipe(name, revision)?.dependencies ??
          []) {
          collect(dependency.name, dependency.revision)
        }
      }
      collect(name, revision)
      return createAiRecipeRecoverySchema([...contracts.values()])
    },
    submit: (input: Omit<AiRecipeSubmission, 'requestId'>) =>
      changing(async () => {
        const result = library.submit({
          ...input,
          requestId: options.requestId
        })
        if (!result.ok) return result
        const storage = await save({
          ...result,
          requestId: options.requestId
        })
        return { ...result, storage }
      }),
    save: (input: {
      name: string
      revision: number
      receiptId?: string
    }): Promise<AiToolSaveResult> =>
      changing(async () => {
        const retained =
          input.receiptId === undefined
            ? undefined
            : pending.get(input.receiptId)
        if (
          input.receiptId !== undefined &&
          (!retained?.receipt ||
            retained.name !== input.name ||
            retained.revision !== input.revision)
        )
          return {
            status: 'unsaved',
            issue:
              'A genuine completed receipt for this request and exact revision is required.'
          }
        const result = await save({
          name: input.name,
          revision: input.revision,
          requestId: options.requestId,
          ...(retained?.receipt ? { receipt: retained.receipt } : {})
        })
        if (result.status === 'saved' && input.receiptId !== undefined)
          pending.delete(input.receiptId)
        return result
      }),
    load: () => changing(() => persistence.load(options.requestId)),
    resume: (name: string, revision: number) =>
      changing(async () => {
        const result = await persistence.resume({
          name,
          revision,
          requestId: options.requestId
        })
        if (result.ok) savedIdentities.add(identity(name, revision))
        return result
      }),
    setState: (
      name: string,
      revision: number,
      state: 'suspended' | 'retired'
    ) => changing(() => persistence.setState(name, revision, state)),
    dispose(): Promise<void> {
      closing ??= Promise.allSettled([...active]).then(() => {
        library.releaseRequest(options.requestId)
        pending.clear()
        savedIdentities.clear()
      })
      return closing
    }
  }
}
