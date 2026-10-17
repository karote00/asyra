import { expect, it } from 'vitest'
import type { AiToolStoreEntry } from '@asyra/ai-agent-runtime'
import { createLocalToolHost } from '../local-tool-host'
import { createLocalDesignTools } from '../local-design-tools'
import { createLocalDesignWorkflow } from '../local-design-workflow'
import { createLocalOperationTools } from '../local-operation-tools'
import { createDesignPreparationSession } from '../design-preparation'
import { AiActionNames } from '../../src/constants/ai-actions'
import { toolRequestReference, toolSemantics } from '../../src/ai/tool-contract'

const object = (properties: Record<string, unknown>) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false
})
const literal = (value: unknown) => ({ kind: 'literal', value })
const recipe = {
  format: 1,
  name: 'prepared-part',
  revision: 1,
  description: 'Prepare an editable part and retain its exact target set.',
  inputSchema: { type: 'number', minimum: 1, maximum: 100 },
  outputSchema: object({
    artifactId: toolRequestReference,
    targetSetId: toolRequestReference,
    count: { type: 'integer', minimum: 1 }
  }),
  steps: [
    {
      id: 'prepare',
      tool: 'design_preparation.prepare_design',
      revision: 2,
      input: {
        kind: 'object',
        fields: {
          draft: {
            kind: 'object',
            fields: {
              name: literal('Reusable part'),
              type: literal('frame'),
              width: literal(200),
              height: literal(200),
              children: {
                kind: 'array',
                items: [
                  {
                    kind: 'object',
                    fields: {
                      type: literal('rect'),
                      key: literal('part'),
                      name: literal('Part'),
                      width: { kind: 'input', path: '' },
                      height: literal(20)
                    }
                  }
                ]
              }
            }
          }
        }
      }
    },
    {
      id: 'targets',
      tool: 'design_preparation.retain_design_targets',
      revision: 2,
      input: {
        kind: 'object',
        fields: {
          targets: {
            kind: 'array',
            items: [
              {
                kind: 'object',
                fields: {
                  artifactId: {
                    kind: 'step',
                    step: 'prepare',
                    path: '/artifactId'
                  },
                  keys: literal(['part'])
                }
              }
            ]
          }
        }
      }
    }
  ],
  output: {
    kind: 'object',
    fields: Object.fromEntries(
      ['artifactId', 'targetSetId', 'count'].map((key) => [
        key,
        { kind: 'step', step: 'targets', path: '/targets/0/' + key }
      ])
    )
  }
}
const memory = () => {
  const entries = new Map<string, AiToolStoreEntry>()
  let revision = 0
  return {
    read: async (key: string) => entries.get(key),
    list: async () => [...entries.values()],
    write: async (input: {
      key: string
      expectedVersion?: string
      record: AiToolStoreEntry['record']
    }) => {
      if (entries.get(input.key)?.version !== input.expectedVersion)
        throw new Error('Conflict')
      const entry = {
        key: input.key,
        record: input.record,
        version: String(++revision)
      }
      entries.set(input.key, entry)
      return entry
    }
  }
}
const fixture = (store = memory(), requestId = 'first', workflow = false) => {
  let session: ReturnType<typeof createDesignPreparationSession>
  const host = createLocalToolHost({
    requestId,
    store,
    signal: new AbortController().signal,
    capacity: 32,
    receiptCapacity: 8,
    artifactCapacity: 64,
    limits: {
      steps: 16,
      bindings: 240,
      bindingDepth: 32,
      bytes: 24000,
      issues: 8
    },
    createGroups: (ownership) => {
      session = createDesignPreparationSession(undefined, undefined, ownership)
      const actions = [
        {
          name: AiActionNames.APPLY_PREPARED_DESIGN,
          description: 'Apply',
          inputSchema: {}
        }
      ]
      const designs = createLocalDesignTools(actions, session)
      const operations = createLocalOperationTools(
        actions,
        designs,
        async (batch) => ({
          context: {},
          actionResults: batch.actions.map((action) => ({
            actionId: action.id,
            actionName: action.name,
            result: { status: 'complete', compositionId: 'applied-root' }
          }))
        })
      )
      return [
        {
          name: 'design_preparation',
          description: 'Prepare editable geometry',
          owner: designs
        },
        ...(workflow
          ? [
              {
                name: 'design_workflow',
                description: 'Prepare and apply retained parts',
                owner: createLocalDesignWorkflow(designs, operations)
              }
            ]
          : [])
      ]
    }
  })
  let call = 0
  const invoke = async (name: string, input: unknown) =>
    JSON.parse(
      (await host.invoke({ name, input, callId: `native-${++call}` })).text
    )
  return { host, invoke, store, resolve: (id: string) => session.resolve(id) }
}

it.each(['compact', 'full'])(
  'exports a %s compound artifact to a later native consumer after call cleanup',
  async (response) => {
    const { host, invoke, resolve } = fixture(memory(), 'compound', true)
    try {
      const produced = await invoke(
        'design_workflow.prepare_and_apply_design',
        {
          draft: {
            type: 'group',
            name: 'Part',
            children: [
              { type: 'rect', key: 'face', name: 'Face', width: 17, height: 20 }
            ]
          },
          response,
          inspection: 'defer'
        }
      )
      expect(produced.toolOutcome.status).toBe('success')
      expect(produced.artifactId).toEqual(expect.any(String))
      const selected = await invoke(
        'design_preparation.retain_design_targets',
        {
          targets: [{ artifactId: produced.artifactId, keys: ['face'] }]
        }
      )
      expect(selected).toMatchObject({
        available: true,
        targets: [{ artifactId: produced.artifactId, count: 1 }]
      })
      expect(() => resolve(produced.artifactId)).not.toThrow()
      await invoke('design_preparation.release_design_artifacts', {
        artifactIds: [produced.artifactId]
      })
      expect(() => resolve(produced.artifactId)).toThrow()
    } finally {
      await host.dispose()
    }
  }
)

it.each([false, true])(
  'preserves typed ordered receipts after cleanup (stopped: %s)',
  async (stopped) => {
    const { host, invoke, resolve } = fixture(memory(), 'ordered', true)
    const draft = {
      type: 'group',
      name: 'Part',
      children: [
        { type: 'rect', key: 'face', name: 'Face', width: 17, height: 20 }
      ]
    }
    try {
      const result = await invoke('design_workflow.prepare_and_apply_design', {
        parts: [
          { key: 'first', draft },
          {
            key: 'second',
            draft: stopped
              ? { ...draft, type: 'frame', width: 5, height: 5 }
              : draft
          },
          { key: 'third', draft }
        ],
        inspection: 'defer'
      })
      expect(result.toolOutcome.status).toBe(stopped ? 'partial' : 'success')
      expect(result.parts).toHaveLength(stopped ? 2 : 3)
      for (const part of result.parts) {
        const selected = await invoke(
          'design_preparation.retain_design_targets',
          {
            targets: [{ artifactId: part.artifactId, keys: ['face'] }]
          }
        )
        expect(selected).toMatchObject({
          available: true,
          targets: [{ count: 1 }]
        })
      }
      await host.dispose()
      for (const part of result.parts)
        expect(() => resolve(part.artifactId)).toThrow()
    } finally {
      await host.dispose()
    }
  }
)

it.each([
  'design_workflow.prepare_and_apply_design',
  'design_preparation.prepare_design'
])(
  'retains a typed repair artifact from %s without reporting failed preparation as successful execution',
  async (tool) => {
    const { host, invoke } = fixture(memory(), 'repair', true)
    try {
      const result = await invoke(tool, {
        draft: {
          type: 'frame',
          name: 'Too small',
          width: 5,
          height: 5,
          children: [
            { type: 'rect', key: 'face', name: 'Face', width: 17, height: 20 }
          ]
        }
      })
      expect(result).toMatchObject({
        applicable: false,
        toolOutcome: { status: 'failed' }
      })
      const retained = await invoke(
        'design_preparation.retain_design_targets',
        {
          targets: [{ artifactId: result.artifactId, keys: ['face'] }]
        }
      )
      expect(retained).toMatchObject({
        available: true,
        targets: [{ count: 1 }]
      })
    } finally {
      await host.dispose()
    }
  }
)

it('delivers real preparation recovery through nested recipes and native library cleanup', async () => {
  const { host, invoke } = fixture()
  try {
    const proposal = structuredClone(recipe)
    proposal.steps[0].input.fields.draft.fields.width.value = 5
    expect(
      await invoke('tool_library.submit_tool', {
        submissionId: 'repair',
        proposal
      })
    ).toMatchObject({ ok: true })
    const outer = {
      ...proposal,
      name: 'outer-repair',
      steps: [
        {
          id: 'part',
          tool: proposal.name,
          revision: 1,
          input: { kind: 'input', path: '' }
        }
      ],
      output: { kind: 'step', step: 'part', path: '' }
    }
    expect(
      await invoke('tool_library.submit_tool', {
        submissionId: 'outer',
        proposal: outer
      })
    ).toMatchObject({ ok: true })
    const result = await invoke('tool_library.invoke_tool', {
      name: outer.name,
      revision: 1,
      input: 17
    })
    // Preparation currently reports unknown settlement; ancestors must preserve it.
    expect(result.execution).toMatchObject({
      status: 'unknown',
      settlement: 'unknown',
      issues: []
    })
    expect(result.storage?.status).not.toBe('saved')
    expect(result.execution.recovery).toHaveLength(1)
    const failed = result.execution.recovery[0]
    expect(failed).toMatchObject({
      name: 'design_preparation.prepare_design',
      status: 'failed',
      value: { applicable: false }
    })
    expect(
      await invoke('design_preparation.retain_design_targets', {
        targets: [{ artifactId: failed.value.artifactId, keys: ['part'] }]
      })
    ).toMatchObject({ available: true, targets: [{ count: 1 }] })
  } finally {
    await host.dispose()
  }
})

it('uses actual preparation owners through native controls, saves and reloads a recipe with fresh artifacts', async () => {
  const first = fixture()
  const admitted = await first.invoke('tool_library.submit_tool', {
    submissionId: 'one',
    proposal: recipe
  })
  expect(admitted, JSON.stringify(admitted)).toMatchObject({ ok: true })
  const result = await first.invoke('tool_library.invoke_tool', {
    name: recipe.name,
    revision: 1,
    input: 17
  })
  expect(result).toMatchObject({
    execution: {
      status: 'success',
      settlement: 'completed',
      value: { count: 1 }
    },
    storage: { status: 'saved' }
  })
  const target = result.execution.value
  expect(
    first
      .resolve(target.artifactId)
      .entries.find((entry) => entry.key === 'part')?.descriptor.width
  ).toBe(17)
  const reused = await first.invoke(
    'design_preparation.retain_design_targets',
    { targets: [{ artifactId: target.artifactId, keys: ['part'] }] }
  )
  expect(reused).toMatchObject({ available: true })
  await first.host.dispose()
  expect(() => first.resolve(target.artifactId)).toThrow()
  const second = fixture(first.store, 'second')
  await second.host.load()
  const next = await second.invoke('tool_library.invoke_tool', {
    name: recipe.name,
    revision: 1,
    input: 31
  })
  expect(next.execution.status).toBe('success')
  expect(next.execution.value.artifactId).not.toBe(target.artifactId)
  expect(
    second
      .resolve(next.execution.value.artifactId)
      .entries.find((entry) => entry.key === 'part')?.descriptor.width
  ).toBe(31)
  const foreign = await second.invoke(
    'design_preparation.retain_design_targets',
    { targets: [{ artifactId: target.artifactId }] }
  )
  expect(foreign.toolOutcome).toMatchObject({
    status: 'failed',
    settlement: 'not-started'
  })
  await second.host.dispose()
})

it('keeps native artifacts usable by a composition and excludes resource controls from recipes', async () => {
  const { host, invoke, resolve } = fixture()
  const prepared = await invoke('design_preparation.prepare_design', {
    draft: {
      type: 'frame',
      name: 'Native',
      width: 100,
      height: 100,
      children: [
        { type: 'rect', key: 'part', name: 'Part', width: 10, height: 10 }
      ]
    }
  })
  const take = {
    ...recipe,
    name: 'take-targets',
    inputSchema: toolRequestReference,
    steps: [
      {
        ...recipe.steps[1],
        input: {
          kind: 'object',
          fields: {
            targets: {
              kind: 'array',
              items: [
                {
                  kind: 'object',
                  fields: {
                    artifactId: { kind: 'input', path: '' },
                    keys: literal(['part'])
                  }
                }
              ]
            }
          }
        }
      }
    ]
  }
  const admitted = await invoke('tool_library.submit_tool', {
    submissionId: 'take',
    proposal: take
  })
  expect(admitted, JSON.stringify(admitted)).toMatchObject({ ok: true })
  expect(
    await invoke('tool_library.invoke_tool', {
      name: take.name,
      revision: 1,
      input: prepared.artifactId
    })
  ).toMatchObject({ execution: { status: 'success' } })
  expect(resolve(prepared.artifactId).entries.length).toBe(2)
  const invalid = {
    ...take,
    name: 'release-targets',
    steps: [
      { ...take.steps[0], tool: 'design_preparation.release_design_artifacts' }
    ]
  }
  expect(
    await invoke('tool_library.submit_tool', {
      submissionId: 'release',
      proposal: invalid
    })
  ).toMatchObject({ ok: false })
  await host.dispose()
})

it('returns cleanup failure with execution evidence and retries actual cleanup at shutdown', async () => {
  let releaseCalls = 0
  const host = createLocalToolHost({
    requestId: 'cleanup',
    store: memory(),
    signal: new AbortController().signal,
    capacity: 16,
    receiptCapacity: 4,
    artifactCapacity: 8,
    limits: { steps: 8, bindings: 32, bindingDepth: 8, bytes: 4000, issues: 4 },
    createGroups: (ownership) => [
      {
        name: 'fixture',
        description: 'Cleanup owner',
        owner: {
          definitions: [
            {
              name: 'execute',
              description: 'Complete work with an unused intermediate.',
              inputSchema: object({}),
              ...toolSemantics(
                object({ status: { const: 'complete' } }),
                'prepare',
                ['request-artifacts']
              )
            }
          ],
          call: async () => {
            ownership.publish(
              'temporary',
              () => {
                if (++releaseCalls === 1)
                  throw new Error('Store temporarily unavailable')
              },
              () => undefined
            )
            return JSON.stringify({ status: 'complete' })
          }
        }
      }
    ]
  })
  const result = JSON.parse(
    (await host.invoke({ name: 'fixture.execute', input: {} })).text
  )
  expect(result).toMatchObject({
    code: 'TOOL_CLEANUP_FAILED',
    executionResult: { status: 'complete' }
  })
  await host.dispose()
  expect(releaseCalls).toBe(2)
})

it('retries failed terminal cleanup without reopening the host to new work', async () => {
  let releaseCalls = 0
  const host = createLocalToolHost({
    requestId: 'terminal',
    store: memory(),
    signal: new AbortController().signal,
    capacity: 16,
    receiptCapacity: 4,
    artifactCapacity: 8,
    limits: { steps: 8, bindings: 32, bindingDepth: 8, bytes: 4000, issues: 4 },
    createGroups: (ownership) => {
      ownership.publish(
        'diagnostic',
        () => {
          if (++releaseCalls === 1) throw new Error('Retry cleanup')
        },
        () => undefined,
        'request'
      )
      return []
    }
  })
  await expect(host.dispose()).rejects.toThrow('Retry cleanup')
  await expect(
    host.invoke({ name: 'tool_library.manage_tool', input: {} })
  ).rejects.toThrow('closing')
  await expect(host.dispose()).resolves.toBeUndefined()
  expect(releaseCalls).toBe(2)
})

it('waits for cancelled native work and releases its unpublished intermediate', async () => {
  const controller = new AbortController()
  let ready: () => void = () => undefined
  const started = new Promise<void>((resolve) => {
    ready = resolve
  })
  let releases = 0
  const host = createLocalToolHost({
    requestId: 'cancelled',
    store: memory(),
    signal: controller.signal,
    capacity: 16,
    receiptCapacity: 4,
    artifactCapacity: 8,
    limits: { steps: 8, bindings: 32, bindingDepth: 8, bytes: 4000, issues: 4 },
    createGroups: (ownership) => [
      {
        name: 'fixture',
        description: 'Cancellation owner',
        owner: {
          definitions: [
            {
              name: 'execute',
              description: 'Prepare a cancellable intermediate.',
              inputSchema: object({}),
              ...toolSemantics(
                object({ status: { const: 'complete' } }),
                'prepare',
                ['request-artifacts']
              )
            }
          ],
          call: async (_name, _input, signal) => {
            ownership.publish(
              'intermediate',
              () => {
                releases += 1
              },
              () => undefined
            )
            ready()
            return new Promise<string>((_resolve, reject) =>
              signal.addEventListener('abort', () => reject(signal.reason), {
                once: true
              })
            )
          }
        }
      }
    ]
  })
  const running = host.invoke({ name: 'fixture.execute', input: {} })
  await started
  const rejected = expect(running).rejects.toThrow('Cancelled')
  const closing = host.dispose()
  controller.abort(new Error('Cancelled'))
  await rejected
  await closing
  expect(releases).toBe(1)
})

it('delivers a registered model view after canonical validation while recipe successors consume full values', async () => {
  const seen: string[][] = []
  let calls = 0
  const source = {
    name: 'source',
    description: 'Produce identities.',
    revision: 1,
    inputSchema: object({}),
    outputSchema: {
      ...object({
        ids: { type: 'array', items: { type: 'string' } },
        modelResult: object({ count: { type: 'integer' } })
      }),
      additionalProperties: true
    },
    delivery: {
      path: '/modelResult',
      outputSchema: object({ count: { type: 'integer' } })
    },
    effect: 'read' as const,
    resources: [],
    composition: 'allowed' as const,
    lifecycle: {
      cancellation: 'cooperative' as const,
      retry: 'never' as const,
      output: 'value' as const
    }
  }
  const consume = {
    ...source,
    name: 'consume',
    delivery: undefined,
    inputSchema: object({ ids: { type: 'array', items: { type: 'string' } } }),
    outputSchema: {
      ...object({ count: { type: 'integer' } }),
      additionalProperties: true
    }
  }
  const host = createLocalToolHost({
    requestId: 'model-boundary',
    signal: new AbortController().signal,
    store: memory(),
    capacity: 16,
    receiptCapacity: 8,
    artifactCapacity: 16,
    limits: {
      steps: 8,
      bindings: 32,
      bindingDepth: 8,
      bytes: 12000,
      issues: 8
    },
    createGroups: () => [
      {
        name: 'fixture',
        description: 'Full typed result owner',
        owner: {
          definitions: [source, consume],
          call: async (name, input) => {
            calls++
            if (name === 'source')
              return JSON.stringify({
                ids: ['a', 'b', 'c'],
                modelResult: { count: 3 }
              })
            const ids = (input as { ids: string[] }).ids
            seen.push(ids)
            return JSON.stringify({ count: ids.length })
          }
        }
      }
    ]
  })
  try {
    const direct = await host.invoke({ name: 'fixture.source', input: {} })
    expect(JSON.parse(direct.text)).toMatchObject({ count: 3 })
    expect(JSON.parse(direct.text).ids).toBeUndefined()
    const proposal = {
      format: 1,
      name: 'count-source',
      revision: 1,
      description: 'Consume complete identities.',
      inputSchema: object({}),
      outputSchema: object({ count: { type: 'integer' } }),
      steps: [
        {
          id: 'source',
          tool: 'fixture.source',
          revision: 1,
          input: literal({})
        },
        {
          id: 'consume',
          tool: 'fixture.consume',
          revision: 1,
          input: {
            kind: 'object',
            fields: { ids: { kind: 'step', step: 'source', path: '/ids' } }
          }
        }
      ],
      output: {
        kind: 'object',
        fields: { count: { kind: 'step', step: 'consume', path: '/count' } }
      }
    }
    const admission = await host.invoke({
      name: 'tool_library.submit_tool',
      input: { submissionId: 'full-handoff', proposal }
    })
    expect(admission.success, admission.text).toBe(true)
    const invoked = await host.invoke({
      name: 'tool_library.invoke_tool',
      input: { name: 'count-source', revision: 1, input: {} }
    })
    expect(invoked.success, invoked.text).toBe(true)
    expect(seen).toEqual([['a', 'b', 'c']])
    expect(calls).toBe(3)
  } finally {
    await host.dispose()
  }
})

it('reports failed model delivery without replaying a successful library execution', async () => {
  let calls = 0
  const source = {
    name: 'source',
    description: 'Produce a settled value.',
    revision: 1,
    inputSchema: object({}),
    outputSchema: { type: 'object' },
    delivery: {
      path: '/modelResult',
      outputSchema: object({ count: { type: 'integer' } })
    },
    effect: 'mutation' as const,
    resources: ['document'],
    composition: 'allowed' as const,
    lifecycle: {
      cancellation: 'cooperative' as const,
      retry: 'never' as const,
      output: 'value' as const
    }
  }
  const host = createLocalToolHost({
    requestId: 'failed-model-delivery',
    signal: new AbortController().signal,
    store: memory(),
    capacity: 16,
    receiptCapacity: 8,
    artifactCapacity: 16,
    limits: {
      steps: 8,
      bindings: 32,
      bindingDepth: 8,
      bytes: 12000,
      issues: 8
    },
    createGroups: () => [
      {
        name: 'fixture',
        description: 'Settled owner',
        owner: {
          definitions: [source],
          call: async () => {
            calls++
            return JSON.stringify({ applied: true })
          }
        }
      }
    ]
  })
  try {
    const reply = await host.invoke({
      name: 'tool_library.invoke_tool',
      input: { name: 'fixture.source', revision: 1, input: {} }
    })
    expect(reply.success, reply.text).toBe(false)
    expect(JSON.parse(reply.text)).toMatchObject({
      execution: {
        status: 'success',
        settlement: 'completed',
        value: { code: 'TOOL_DELIVERY_INVALID' }
      },
      toolOutcome: { status: 'partial', settlement: 'completed' }
    })
    expect(calls).toBe(1)
  } finally {
    await host.dispose()
  }
})
