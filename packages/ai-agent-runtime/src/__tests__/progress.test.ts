import { describe, expect, it, vi } from 'vitest'
import {
  AI_REDACTED_VALUE,
  isExecutionActivity,
  AiProviderError,
  createAiAgentRuntime,
  type AiActionDefinition,
  type AiRuntimeProgressUpdate,
  type CreateAiAgentRuntimeInput
} from '..'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, reject, resolve }
}

const candidateActionBatch = () => ({
  actions: [
    {
      arguments: {
        elementId: 'shape-1',
        secretToken: 'provider-action-secret',
        visible: false
      },
      id: 'action-1',
      name: 'set_element_visibility',
      summary: {
        affectedCount: 1,
        actionKind: 'visibility'
      }
    }
  ],
  explanation: 'Create a visible result without private reasoning.',
  batchId: 'batch-1'
})

const visibilityAction = (
  execute = vi.fn(async () => ({
    apiKey: 'executor-secret',
    changed: true
  }))
): AiActionDefinition<{
  elementId: string
  secretToken: string
  visible: boolean
}> => ({
  description: 'Set element visibility.',
  execute,
  revision: 1,
  outputSchema: true,
  effect: 'mutation',
  resources: ['test-document'],
  lifecycle: {
    cancellation: 'before-dispatch',
    retry: 'never',
    output: 'value'
  },
  inputSchema: {
    additionalProperties: false,
    properties: {
      elementId: { type: 'string' },
      secretToken: { type: 'string' },
      visible: { type: 'boolean' }
    },
    required: ['elementId', 'secretToken', 'visible'],
    type: 'object'
  },
  name: 'set_element_visibility'
})

const runtimeInput = (
  overrides: Partial<CreateAiAgentRuntimeInput> = {}
): CreateAiAgentRuntimeInput => ({
  actionDefinitions: [visibilityAction()],
  confirmationHandler: {
    confirm: vi.fn(async () => true)
  },
  contextProvider: {
    getContext: vi.fn(async () => ({
      accessToken: 'context-secret',
      app: 'test'
    }))
  },
  permissionPolicy: {
    evaluate: vi.fn(async () => 'allow' as const)
  },
  provider: {
    requestActionBatch: vi.fn(async () => candidateActionBatch())
  },
  transactionRunner: {
    run: async <T>(_label: string, execute: () => Promise<T>) => execute()
  },
  ...overrides
})

const phases = (updates: readonly AiRuntimeProgressUpdate[]) =>
  updates.map((update) => update.phase)

describe('AI runtime operational progress', () => {
  it('reports the specific action summary when that action starts executing', async () => {
    const updates: AiRuntimeProgressUpdate[] = []
    const batch = candidateActionBatch()
    const runtime = createAiAgentRuntime(
      runtimeInput({
        provider: {
          requestActionBatch: async () => ({
            ...batch,
            actions: batch.actions.map((action) => ({
              ...action,
              summary: 'Smoothing the outlines'
            }))
          })
        }
      })
    )
    await runtime.run({
      intent: 'smooth',
      signal: new AbortController().signal,
      progressObserver: (update) => updates.push(update)
    })
    expect(
      updates.find((update) => update.phase === 'execution')
    ).toMatchObject({
      summary: 'Smoothing the outlines',
      tool: 'set_element_visibility'
    })
  })

  it('emits ordered frozen operational phases with only safe detached metadata', async () => {
    const updates: AiRuntimeProgressUpdate[] = []
    const runtime = createAiAgentRuntime(runtimeInput())

    const result = await runtime.run({
      intent: 'hide the selected shape',
      metadata: {
        authorization: 'Bearer request-secret'
      },
      progressObserver: (update) => updates.push(update),
      signal: new AbortController().signal
    })

    expect(result.status).toBe('executed')
    expect(phases(updates)).toEqual([
      'context',
      'provider',
      'resolution',
      'permission',
      'execution',
      'settled'
    ])
    expect(updates).toEqual([
      {
        attempt: 1,
        phase: 'context',
        summary: 'Understanding the request'
      },
      {
        attempt: 1,
        phase: 'provider',
        summary: 'Requesting an action batch'
      },
      {
        attempt: 1,
        phase: 'resolution',
        summary: 'Resolving app actions'
      },
      {
        actionCount: 1,
        attempt: 1,
        phase: 'permission',
        batchId: 'batch-1',
        summary: 'Checking action permissions'
      },
      {
        actionCount: 1,
        attempt: 1,
        phase: 'execution',
        batchId: 'batch-1',
        tool: 'set_element_visibility',
        summary: 'Preparing the drawing'
      },
      {
        actionCount: 1,
        attempt: 1,
        outcome: 'executed',
        phase: 'settled',
        batchId: 'batch-1',
        summary: 'Completed'
      }
    ])
    expect(updates.every(Object.isFrozen)).toBe(true)

    const serialized = JSON.stringify(updates)
    expect(serialized).not.toContain('provider-action-secret')
    expect(serialized).not.toContain('context-secret')
    expect(serialized).not.toContain('executor-secret')
    expect(serialized).not.toContain('request-secret')
    expect(serialized).not.toContain('arguments')
    expect(serialized).not.toContain('chain-of-thought')
  })

  it('emits confirmation only while a confirmation-required batch waits', async () => {
    const updates: AiRuntimeProgressUpdate[] = []
    const confirmation = deferred<boolean>()
    const runtime = createAiAgentRuntime(
      runtimeInput({
        confirmationHandler: {
          confirm: vi.fn(() => confirmation.promise)
        },
        permissionPolicy: {
          evaluate: vi.fn(async () => 'confirm' as const)
        }
      })
    )

    const settlement = runtime.run({
      intent: 'delete the selected shape',
      progressObserver: (update) => updates.push(update),
      signal: new AbortController().signal
    })

    await vi.waitFor(() => {
      expect(phases(updates)).toContain('confirmation')
    })
    expect(updates[updates.length - 1]).toEqual({
      actionCount: 1,
      attempt: 1,
      phase: 'confirmation',
      batchId: 'batch-1',
      summary: 'Waiting for confirmation'
    })

    confirmation.resolve(true)
    await expect(settlement).resolves.toMatchObject({
      status: 'executed'
    })
    expect(phases(updates)).toEqual([
      'context',
      'provider',
      'resolution',
      'permission',
      'confirmation',
      'execution',
      'settled'
    ])
  })

  it('redacts a secret-shaped provider batch identity before observation', async () => {
    const updates: AiRuntimeProgressUpdate[] = []
    const runtime = createAiAgentRuntime(
      runtimeInput({
        provider: {
          requestActionBatch: vi.fn(async () => ({
            ...candidateActionBatch(),
            batchId: 'Bearer provider-batch-secret'
          }))
        }
      })
    )

    await runtime.run({
      intent: 'hide the selected shape',
      progressObserver: (update) => updates.push(update),
      signal: new AbortController().signal
    })

    expect(
      updates
        .filter((update) => update.batchId !== undefined)
        .every((update) => update.batchId === AI_REDACTED_VALUE)
    ).toBe(true)
    expect(JSON.stringify(updates)).not.toContain('provider-batch-secret')
  })

  it('contains observer exceptions without changing execution or terminal output', async () => {
    const execute = vi.fn(async () => ({ changed: true }))
    const progressObserver = vi.fn(() => {
      throw new Error('observer failure')
    })
    const runtime = createAiAgentRuntime(
      runtimeInput({
        actionDefinitions: [visibilityAction(execute)]
      })
    )

    const result = await runtime.run({
      intent: 'hide the selected shape',
      progressObserver,
      signal: new AbortController().signal
    })

    expect(result.status).toBe('executed')
    expect(execute).toHaveBeenCalledOnce()
    expect(progressObserver).toHaveBeenCalledTimes(6)
  })

  it('emits retry attempts and one stable failed settlement', async () => {
    const updates: AiRuntimeProgressUpdate[] = []
    const runtime = createAiAgentRuntime(
      runtimeInput({
        options: {
          retryPolicy: {
            maxAttempts: 2,
            shouldRetry: () => true
          }
        },
        provider: {
          requestActionBatch: vi.fn(async () => {
            throw new AiProviderError({
              code: 'AI_PROVIDER_TRANSPORT_FAILED',
              message: 'Bearer provider-secret',
              retryable: true
            })
          })
        }
      })
    )

    const result = await runtime.run({
      intent: 'fail safely',
      progressObserver: (update) => updates.push(update),
      signal: new AbortController().signal
    })

    expect(result).toMatchObject({
      retryCount: 1,
      status: 'failed'
    })
    expect(phases(updates)).toEqual([
      'context',
      'provider',
      'provider',
      'settled'
    ])
    expect(updates[updates.length - 1]).toEqual({
      attempt: 2,
      outcome: 'failed',
      phase: 'settled',
      summary: 'Failed'
    })
    expect(JSON.stringify(updates)).not.toContain('provider-secret')
  })

  it('stops progress after caller abort while provider work is pending', async () => {
    const updates: AiRuntimeProgressUpdate[] = []
    const provider = deferred<ReturnType<typeof candidateActionBatch>>()
    const controller = new AbortController()
    const runtime = createAiAgentRuntime(
      runtimeInput({
        provider: {
          requestActionBatch: vi.fn(() => provider.promise)
        }
      })
    )

    const settlement = runtime.run({
      intent: 'wait for provider',
      progressObserver: (update) => updates.push(update),
      signal: controller.signal
    })
    await vi.waitFor(() => {
      expect(phases(updates)).toEqual(['context', 'provider'])
    })

    controller.abort('cancelled by user')
    await expect(settlement).resolves.toMatchObject({
      reason: 'aborted',
      status: 'cancelled'
    })
    const countAfterAbort = updates.length

    provider.resolve(candidateActionBatch())
    await Promise.resolve()
    expect(updates).toHaveLength(countAfterAbort)
    expect(phases(updates)).not.toContain('settled')
  })

  it('stops progress after runtime disposal and awaits the cancelled invocation', async () => {
    const updates: AiRuntimeProgressUpdate[] = []
    const provider = deferred<ReturnType<typeof candidateActionBatch>>()
    const runtime = createAiAgentRuntime(
      runtimeInput({
        provider: {
          requestActionBatch: vi.fn(() => provider.promise)
        }
      })
    )

    const settlement = runtime.run({
      intent: 'wait for disposal',
      progressObserver: (update) => updates.push(update),
      signal: new AbortController().signal
    })
    await vi.waitFor(() => {
      expect(phases(updates)).toEqual(['context', 'provider'])
    })

    await runtime.dispose()
    await expect(settlement).resolves.toMatchObject({
      reason: 'aborted',
      status: 'cancelled'
    })
    const countAfterDispose = updates.length

    provider.resolve(candidateActionBatch())
    await Promise.resolve()
    expect(updates).toHaveLength(countAfterDispose)
  })
})

it('forwards bounded provider tool progress only during the owning request', async () => {
  const updates: AiRuntimeProgressUpdate[] = []
  let report:
    | ((event: { tool: string; status: 'running' | 'completed' }) => void)
    | undefined
  const runtime = createAiAgentRuntime(
    runtimeInput({
      provider: {
        requestActionBatch: async (_input, options) => {
          report = options.onProgress
          report?.({ tool: 'vectorizer', status: 'running' })
          return candidateActionBatch()
        }
      }
    })
  )
  await runtime.run({
    intent: 'draw',
    signal: new AbortController().signal,
    progressObserver: (update) => updates.push(update)
  })
  expect(updates).toContainEqual(
    expect.objectContaining({
      phase: 'provider',
      tool: 'vectorizer',
      toolStatus: 'running'
    })
  )
  const count = updates.length
  report?.({ tool: 'vectorizer', status: 'completed' })
  expect(updates).toHaveLength(count)
  await runtime.dispose()
})

it('retains activity identity while dropping duplicate and stale producer events', async () => {
  const updates: AiRuntimeProgressUpdate[] = []
  const runtime = createAiAgentRuntime(
    runtimeInput({
      provider: {
        requestActionBatch: async (_input, options) => {
          const event = {
            tool: 'execute_design_batch',
            status: 'running' as const,
            message: 'Adding windows',
            activity: {
              kind: 'work' as const,
              callId: 'draw',
              parentCallId: 'request',
              scope: 'call' as const,
              phase: 'applying' as const,
              sequence: 2
            }
          }
          options.onProgress?.(event)
          options.onProgress?.(event)
          options.onProgress?.({
            ...event,
            message: 'Old work',
            activity: { ...event.activity, sequence: 1 }
          })
          return candidateActionBatch()
        }
      }
    })
  )
  try {
    await runtime.run({
      intent: 'Draw',
      signal: new AbortController().signal,
      progressObserver: (event) => updates.push(event)
    })
    expect(updates.filter((event) => event.activity)).toEqual([
      expect.objectContaining({
        message: 'Adding windows',
        activity: {
          kind: 'work',
          callId: 'draw',
          parentCallId: 'request',
          scope: 'call',
          phase: 'applying',
          sequence: 1
        }
      })
    ])
  } finally {
    await runtime.dispose()
  }
})

it('keeps the request record open through final action and history settlement without waiting for diagnostic delivery', async () => {
  const records: { event: string; [key: string]: unknown }[] = []
  const action = deferred<unknown>()
  const history = deferred<undefined>()
  const upload = deferred<{ status: 'saved'; path: null }>()
  const write = (record: { event: string; [key: string]: unknown }) => {
    records.push(record)
  }
  const runtime = createAiAgentRuntime(
    runtimeInput({
      createRecordingSink: () => ({ write, flush: () => upload.promise }),
      actionDefinitions: [visibilityAction(vi.fn(() => action.promise))],
      transactionRunner: {
        run: async (_label, execute) => {
          const result = await execute()
          await history.promise
          return result
        }
      }
    })
  )
  try {
    const pending = runtime.run({
      intent: 'Draw',
      signal: new AbortController().signal
    })
    await vi.waitFor(() =>
      expect(records.some((record) => record.stage === 'action_started')).toBe(
        true
      )
    )
    expect(records.some((record) => record.event === 'ai_request_usage')).toBe(
      false
    )
    action.resolve({ saved: true })
    await vi.waitFor(() =>
      expect(
        records.some((record) => record.stage === 'action_completed')
      ).toBe(true)
    )
    expect(records.some((record) => record.event === 'ai_request_usage')).toBe(
      false
    )
    history.resolve(undefined)
    expect((await pending).status).toBe('executed')
    expect(
      records.filter((record) => record.event === 'ai_request_usage')
    ).toHaveLength(1)
    upload.resolve({ status: 'saved', path: null })
  } finally {
    action.resolve({})
    history.resolve(undefined)
    upload.resolve({ status: 'saved', path: null })
    await runtime.dispose()
  }
})

it('records domain waits and shows settlement progress after provider completion', async () => {
  const records: {
    stage?: unknown
    evidence?: { purpose?: unknown }
    [key: string]: unknown
  }[] = []
  const updates: AiRuntimeProgressUpdate[] = []
  const definition = visibilityAction()
  definition.execute = async (_args, context) => {
    context.reportProgress?.({
      phase: 'settlement',
      summary: 'Saving the drawing'
    })
    if (!context.observe)
      throw new Error('Missing Runtime observation boundary')
    return context.observe(
      'durability',
      'Confirm durable publication target',
      async () => ({ durableSequence: 7 })
    )
  }
  const runtime = createAiAgentRuntime(
    runtimeInput({
      actionDefinitions: [definition],
      createRecordingSink: () => ({
        write: (entry) => {
          records.push(entry)
        },
        flush: async () => ({ status: 'saved', path: null })
      })
    })
  )
  try {
    expect(
      (
        await runtime.run({
          intent: 'Draw',
          signal: new AbortController().signal,
          progressObserver: (event) => updates.push(event)
        })
      ).status
    ).toBe('executed')
    expect(updates).toContainEqual(
      expect.objectContaining({
        phase: 'settlement',
        summary: 'Saving the drawing'
      })
    )
    expect(
      records
        .filter(
          (entry) =>
            entry.evidence?.purpose === 'Confirm durable publication target'
        )
        .map((entry) => entry.stage)
    ).toEqual(['lifecycle_started', 'lifecycle_completed'])
  } finally {
    await runtime.dispose()
  }
})

it.each(['failed', 'cancelled'] as const)(
  'closes the request record once for %s execution and preserves product outcome on sink failure',
  async (outcome) => {
    const records: { event: string; [key: string]: unknown }[] = []
    const controller = new AbortController()
    const runtime = createAiAgentRuntime(
      runtimeInput({
        createRecordingSink: () => ({
          write: (record) => {
            records.push(record)
          },
          flush: async () => {
            throw new Error('diagnostics unavailable')
          }
        }),
        actionDefinitions: [
          visibilityAction(
            vi.fn(async () => {
              if (outcome === 'cancelled') controller.abort()
              throw new Error('action failed')
            })
          )
        ]
      })
    )
    try {
      const result = await runtime.run({
        intent: 'Draw',
        signal: controller.signal
      })
      expect(result.status).toBe(outcome)
      expect(
        records.filter((record) => record.event === 'ai_request_usage')
      ).toEqual([expect.objectContaining({ outcome })])
    } finally {
      await runtime.dispose()
    }
  }
)

it('links host publication observations without appending after the request terminal marker', async () => {
  const streams: { event: string; [key: string]: unknown }[][] = []
  const runtime = createAiAgentRuntime(
    runtimeInput({
      createRecordingSink: () => {
        const records: { event: string; [key: string]: unknown }[] = []
        streams.push(records)
        return {
          write: (record) => {
            records.push(record)
          },
          flush: async () => ({ status: 'saved', path: null })
        }
      }
    })
  )
  try {
    const result = await runtime.run({
      intent: 'Draw',
      signal: new AbortController().signal
    })
    if (!result.recordingId) throw new Error('Missing request recording ID')
    runtime.observe?.({
      sourceRequestId: result.recordingId,
      purpose: 'conversation-publication',
      evidence: { outcome: 'success' }
    })
    expect(streams).toHaveLength(2)
    expect(streams[0][streams[0].length - 1]?.event).toBe('ai_request_usage')
    expect(streams[1][0]).toMatchObject({
      sourceRequestId: result.recordingId,
      purpose: 'conversation-publication'
    })
  } finally {
    await runtime.dispose()
  }
})

it('separates mutation admission from canonical work and gives repeated domain spans distinct identities', async () => {
  const records: {
    stage?: unknown
    evidence?: { purpose?: unknown }
    [key: string]: unknown
  }[] = []
  const definition = visibilityAction()
  definition.execute = async (_args, context) => {
    await context.runMutation?.(() => 'written')
    await context.observe?.('verify', 'Check result', async () => true)
    await context.observe?.('verify', 'Check result', async () => true)
  }
  const runtime = createAiAgentRuntime(
    runtimeInput({
      actionDefinitions: [definition],
      transactionRunner: {
        run: async (_label, execute) => execute(async (write) => write())
      },
      createRecordingSink: () => ({
        write: (entry) => {
          records.push(entry)
        },
        flush: async () => ({ status: 'saved', path: null })
      })
    })
  )
  try {
    expect(
      (
        await runtime.run({
          intent: 'Draw',
          signal: new AbortController().signal
        })
      ).status
    ).toBe('executed')
    const started = records.filter(
      (entry) => entry.stage === 'lifecycle_started'
    )
    expect(started.map((entry) => entry.evidence?.purpose)).toContain(
      'Await mutation admission'
    )
    expect(started.map((entry) => entry.evidence?.purpose)).toContain(
      'Apply canonical mutation'
    )
    const checks = started.filter(
      (entry) => entry.evidence?.purpose === 'Check result'
    )
    expect(new Set(checks.map((entry) => entry.callId)).size).toBe(2)
  } finally {
    await runtime.dispose()
  }
})

it('rejects invalid activity parent and phase contracts at the shared transport owner', () => {
  const value = {
    kind: 'work',
    callId: 'prepare',
    parentCallId: 'workflow',
    phase: 'preparing',
    scope: 'call',
    sequence: 1
  }
  expect(isExecutionActivity(value)).toBe(true)
  expect(isExecutionActivity({ ...value, parentCallId: 'prepare' })).toBe(false)
  expect(isExecutionActivity({ ...value, phase: 'imaginary' })).toBe(false)
  expect(isExecutionActivity({ ...value, sequence: 0 })).toBe(false)
})

it.each(['success', 'failure', 'cancelled'] as const)(
  'settles authored action activity before the next owner on %s',
  async (outcome) => {
    const updates: AiRuntimeProgressUpdate[] = []
    const controller = new AbortController()
    let executions = 0
    const batch = candidateActionBatch()
    const actions = [0, 1].map((index) => ({
      ...batch.actions[0],
      id: `action-${index}`,
      summary: { kind: 'work', text: `Refine part ${index}` }
    }))
    const runtime = createAiAgentRuntime(
      runtimeInput({
        provider: { requestActionBatch: async () => ({ ...batch, actions }) },
        actionDefinitions: [
          visibilityAction(
            vi.fn(async () => {
              if (executions++ === 0 && outcome !== 'success') {
                if (outcome === 'cancelled') controller.abort()
                throw new Error('Action did not complete')
              }
              return { apiKey: 'executor-secret', changed: true }
            })
          )
        ]
      })
    )
    try {
      const result = await runtime.run({
        intent: 'Refine both parts',
        signal: controller.signal,
        progressObserver: (update) => updates.push(update)
      })
      const scoped = updates.filter((update) => update.activity)
      const expected = ['running']
      if (outcome !== 'cancelled') expected.push('completed')
      if (outcome === 'success') expected.push('running', 'completed')
      expect(scoped.map((update) => update.toolStatus)).toEqual(expected)
      if (outcome !== 'cancelled')
        expect(scoped[0].activity?.callId).toBe(scoped[1].activity?.callId)
      if (outcome === 'success') {
        expect(scoped[2].activity?.callId).toBe(scoped[3].activity?.callId)
        expect(scoped[0].activity?.callId).not.toBe(scoped[2].activity?.callId)
      }
      const expectedStatus = {
        success: 'executed',
        failure: 'failed',
        cancelled: 'cancelled'
      }
      expect(result.status).toBe(expectedStatus[outcome])
      if (outcome === 'cancelled') {
        // Abort suppresses further observer notifications; the returned outcome
        // is the authoritative signal for the App's settled projection.
        expect(executions).toBe(1)
        return
      }
      const completion = scoped[1]
      expect(completion.activity?.kind).toBe('system')
      expect(completion.tool).toBe('set_element_visibility')
      if (!completion.activity || !scoped[0].activity)
        throw new Error('Expected paired scoped activity')
      expect(completion.activity.sequence).toBeGreaterThan(
        scoped[0].activity.sequence
      )
    } finally {
      await runtime.dispose()
    }
  }
)

it('keeps authored action activity identities distinct across batches reusing action IDs', async () => {
  const updates: AiRuntimeProgressUpdate[] = []
  const records: {
    event: string
    stage?: string
    callId?: unknown
    evidence?: unknown
  }[] = []
  const makeBatch = (batchId: string) => ({
    ...candidateActionBatch(),
    batchId,
    actions: candidateActionBatch().actions.map((action) => ({
      ...action,
      summary: { kind: 'work', text: `Refine ${batchId}` }
    }))
  })
  const runtime = createAiAgentRuntime(
    runtimeInput({
      createRecordingSink: () => ({
        write: (entry) => {
          records.push(entry)
        },
        flush: async () => ({ status: 'saved', path: null })
      }),
      provider: {
        requestActionBatch: async (_input, options) => {
          if (!options.executeBatch) throw new Error('Expected batch executor')
          await options.executeBatch(makeBatch('first'))
          return makeBatch('second')
        }
      }
    })
  )
  try {
    const result = await runtime.run({
      intent: 'Refine twice',
      signal: new AbortController().signal,
      progressObserver: (update) => updates.push(update)
    })
    expect(result.status).toBe('executed')
    const scoped = updates.filter((update) => update.activity)
    expect(scoped.map((update) => update.toolStatus)).toEqual([
      'running',
      'completed',
      'running',
      'completed'
    ])
    expect(
      new Set(
        scoped
          .filter((update) => update.toolStatus === 'running')
          .map((update) => update.activity?.callId)
      ).size
    ).toBe(2)
    expect(records.filter((entry) => entry.stage === 'action_started')).toEqual(
      [
        expect.objectContaining({
          callId: scoped[0].activity?.callId,
          evidence: expect.objectContaining({
            actionId: 'action-1',
            batchId: 'first'
          })
        }),
        expect.objectContaining({
          callId: scoped[2].activity?.callId,
          evidence: expect.objectContaining({
            actionId: 'action-1',
            batchId: 'second'
          })
        })
      ]
    )
    expect(scoped[0].activity?.callId).toBe(scoped[1].activity?.callId)
    expect(scoped[2].activity?.callId).toBe(scoped[3].activity?.callId)
  } finally {
    await runtime.dispose()
  }
})

it('admits only declared actual dispatch effects on activity transport', () => {
  const activity = {
    kind: 'system',
    callId: 'batch',
    sequence: 1,
    phase: 'executing'
  }
  for (const effect of ['read', 'prepare', 'mutation', 'external', 'mixed'])
    expect(isExecutionActivity({ ...activity, effect })).toBe(true)
  expect(isExecutionActivity({ ...activity, effect: 'draw-anything' })).toBe(
    false
  )
})
