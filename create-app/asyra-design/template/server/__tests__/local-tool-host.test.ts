import { expect, it } from 'vitest'
import { readCompleteInformation } from './tool-contract-assertions'
import { operationContractIssue } from '../operation-input-schema'
import { BrowserBatchExecutionError } from '../batch-exchange'
import type { AiToolStoreEntry } from '@asyra/ai-agent-runtime'
import { createLocalToolHost } from '../local-tool-host'
import { createLocalDesignTools } from '../local-design-tools'
import { createLocalDesignWorkflow } from '../local-design-workflow'
import { createLocalOperationTools } from '../local-operation-tools'
import { createDesignPreparationSession } from '../design-preparation'
import { AiActionNames } from '../../src/constants/ai-actions'
import {
  toolRequestReference,
  toolSemantics,
  toolResultObject,
  toolInternalResult
} from '../../src/ai/tool-contract'

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
        },
        {
          name: AiActionNames.APPLY_PREPARED_MATERIAL,
          description: 'Apply material',
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
      expect(produced.toolOutcome).toMatchObject({
        status: 'partial',
        settlement: 'completed'
      })
      expect(produced.measurementIssues).toHaveLength(1)
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
      expect(result.toolOutcome.status).toBe('partial')
      if (!stopped) expect(result.toolOutcome.settlement).toBe('completed')
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
                object({
                  status: { const: 'complete' },
                  work: toolInternalResult({ type: 'integer' })
                }),
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
            return JSON.stringify({ status: 'complete', work: 17 })
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
  expect(result.executionResult).not.toHaveProperty('work')
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
                object({ status: { type: 'string', enum: ['complete'] } }),
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

it('retains a material revision across native call cleanup and retires its source metadata with its lease', async () => {
  const { host, invoke } = fixture()
  const field = {
    frame: 'world',
    start: { x: 0, y: 0, z: 0 },
    end: { x: 0, y: 0, z: 100 },
    gradientStops: [
      { position: 0, color: '#112233', opacity: 1 },
      { position: 1, color: '#eeeeee', opacity: 1 }
    ]
  }
  const draft = {
    type: 'group',
    name: 'Facades',
    projection: {
      azimuth: 30,
      elevation: 20,
      scale: 1,
      originX: 0,
      originY: 0
    },
    linearFields: { glass: field },
    children: [
      {
        type: 'projected-face',
        key: 'face',
        name: 'Face',
        materialField: 'glass',
        vertices: [
          { x: 0, y: 0, z: 0 },
          { x: 20, y: 0, z: 0 },
          { x: 20, y: 0, z: 30 },
          { x: 0, y: 0, z: 30 }
        ]
      }
    ]
  }
  try {
    const original = await invoke('design_preparation.prepare_design', {
      draft
    })
    const revised = await invoke(
      'design_preparation.prepare_material_revision',
      {
        artifactId: original.artifactId,
        field: 'glass',
        definition: {
          ...field,
          gradientStops: field.gradientStops.map((stop) => ({
            ...stop,
            color: '#336688'
          }))
        }
      }
    )
    expect(revised).toMatchObject({
      available: true,
      applied: false,
      elementCount: 1
    })
    await invoke('design_preparation.release_design_artifacts', {
      artifactIds: [original.artifactId]
    })
    const { linearFields: _fields, ...extension } = draft
    const next = await invoke('design_preparation.prepare_design', {
      draft: extension,
      materialSourceId: revised.materialRevisionId
    })
    expect(next).toMatchObject({ available: true, applicable: true })
    await invoke('design_preparation.release_design_artifacts', {
      artifactIds: [revised.materialRevisionId]
    })
    const refused = await invoke('design_preparation.prepare_design', {
      draft: extension,
      materialSourceId: revised.materialRevisionId
    })
    expect(refused.available).not.toBe(true)
  } finally {
    await host.dispose()
  }
})

it('preserves acknowledged cancellation evidence through the actual native host without replay', async () => {
  const controller = new AbortController()
  let calls = 0
  const receipts = {
    batches: [
      {
        actionResults: [
          {
            actionId: 'apply',
            actionName: 'draw',
            result: {
              status: 'partial',
              compositionId: 'root',
              appliedElementCount: 33
            }
          }
        ],
        failure: { settlement: 'partial', code: 'AI_EXECUTION_FAILED' }
      }
    ]
  }
  const host = createLocalToolHost({
    requestId: 'interrupted-owner',
    signal: controller.signal,
    store: memory(),
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
    executionEvidence: () => receipts,
    createGroups: () => [
      {
        name: 'drawing',
        description: 'Drawing',
        owner: {
          definitions: [
            {
              name: 'draw',
              description: 'Draw',
              inputSchema: { type: 'object' },
              ...toolSemantics({ type: 'object' }, 'mutation', ['document'])
            }
          ],
          call: async () => {
            calls++
            controller.abort()
            throw new Error('Interrupted')
          }
        }
      }
    ]
  })
  try {
    await expect(
      host.invoke({ name: 'drawing.draw', input: {} })
    ).rejects.toMatchObject({
      receipt: { settlement: 'partial', result: receipts }
    })
    expect(calls).toBe(1)
    await expect(
      host.invoke({ name: 'drawing.draw', input: {} })
    ).rejects.toThrow()
    expect(calls).toBe(1)
  } finally {
    await host.dispose()
  }
})

it.each(['direct', 'registered', 'direct-projector', 'registered-projector'])(
  'projects only declared model fields through the %s host exit without repeating owner work',
  async (route) => {
    let calls = 0
    const observed: unknown[] = []
    const value = {
      status: 'complete',
      handle: 'retained-result',
      values: { timing: 7, context: 'User-authored domain values' },
      actionObservation: { handlerMs: 30, executor: 'app-browser' },
      extraOwnerField: 'diagnostic-only'
    }
    const host = createLocalToolHost({
      requestId: 'model-boundary',
      signal: new AbortController().signal,
      store: memory(),
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
      observe: (event) => {
        observed.push(event)
      },
      createGroups: () => [
        {
          name: 'example',
          description: 'Model boundary',
          owner: {
            definitions: [
              {
                name: 'read',
                description: 'Read one retained value',
                composition: 'allowed',
                inputSchema: object({}),
                ...toolSemantics(
                  {
                    type: 'object',
                    properties: {
                      status: { const: 'complete' },
                      handle: { type: 'string' },
                      values: {
                        type: 'object',
                        additionalProperties: {
                          anyOf: [{ type: 'string' }, { type: 'number' }]
                        }
                      }
                    },
                    required: ['status', 'handle', 'values'],
                    additionalProperties: true
                  },
                  'read',
                  []
                )
              }
            ],
            ...(route.endsWith('-projector')
              ? {
                  projectModelResult: (
                    _name: string,
                    _args: unknown,
                    output: unknown
                  ) => output
                }
              : {}),
            call: async () => {
              calls += 1
              return JSON.stringify(value)
            }
          }
        }
      ]
    })
    try {
      const definition = host
        .definitions()
        .find((item) => item.registeredName === 'example.read')
      if (!definition?.registeredName)
        throw new Error('Missing registered definition')
      const reply = await host.invoke({
        name: route.startsWith('direct')
          ? 'example.read'
          : 'tool_library.invoke_tool',
        input: route.startsWith('direct')
          ? {}
          : { name: 'example.read', revision: definition.revision, input: {} },
        callId: 'read-once'
      })
      const output = JSON.parse(reply.text)
      const delivered = route.startsWith('direct')
        ? output
        : output.execution.value
      expect(delivered).toMatchObject({
        status: 'complete',
        handle: value.handle,
        values: value.values
      })
      expect(delivered).not.toHaveProperty('actionObservation')
      expect(delivered).not.toHaveProperty('extraOwnerField')
      expect(calls).toBe(1)
      expect(JSON.stringify(observed)).toContain('extraOwnerField')
      expect(value.actionObservation.handlerMs).toBe(30)
      expect(JSON.stringify(delivered).length).toBeLessThan(
        JSON.stringify(value).length
      )
    } finally {
      await host.dispose()
    }
  }
)

it.each(['partial', 'failed'])(
  'projects a declared %s owner result without discarding recovery or replaying',
  async (status) => {
    let calls = 0
    const value = {
      status,
      settlement: 'partial',
      completed: ['one'],
      code: 'TARGET_UNAVAILABLE',
      message:
        'The second target is no longer available; continue with its replacement only.',
      recovery: {
        remaining: ['two'],
        instruction: 'Continue only remaining targets'
      },
      actionObservation: { handlerMs: 8 },
      extraOwnerField: 'private'
    }
    const resultSchema = {
      type: 'object',
      properties: {
        status: { enum: ['partial', 'failed'] },
        settlement: { const: 'partial' },
        completed: { type: 'array', items: { type: 'string' } },
        recovery: object({
          remaining: { type: 'array', items: { type: 'string' } },
          instruction: { type: 'string' }
        })
      },
      required: ['status', 'settlement', 'completed', 'recovery'],
      additionalProperties: true
    }
    const host = createLocalToolHost({
      requestId: 'partial-delivery',
      signal: new AbortController().signal,
      store: memory(),
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
      createGroups: () => [
        {
          name: 'example',
          description: 'Recoverable owner',
          owner: {
            definitions: [
              {
                name: 'apply',
                description: 'Apply',
                inputSchema: object({}),
                ...toolSemantics(resultSchema, 'mutation', []),
                partialOutputSchema: resultSchema,
                recoveryOutputSchema: resultSchema
              }
            ],
            call: async () => {
              calls += 1
              return JSON.stringify(value)
            }
          }
        }
      ]
    })
    try {
      const reply = JSON.parse(
        (
          await host.invoke({
            name: 'example.apply',
            input: {},
            callId: 'once'
          })
        ).text
      )
      expect(reply).toMatchObject({
        status,
        settlement: 'partial',
        completed: ['one'],
        recovery: value.recovery
      })
      expect(reply.toolOutcome.issues).toContainEqual({
        code: value.code,
        message: value.message
      })
      expect(reply).not.toHaveProperty('actionObservation')
      expect(reply).not.toHaveProperty('extraOwnerField')
      expect(calls).toBe(1)
    } finally {
      await host.dispose()
    }
  }
)

it.each(['direct', 'registered'])(
  'projects nested workflow receipts through the %s boundary while retaining full evidence',
  async (route) => {
    let writes = 0
    const observed: unknown[] = []
    const host = createLocalToolHost({
      requestId: 'nested-delivery',
      signal: new AbortController().signal,
      store: memory(),
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
      observe: (event) => {
        observed.push(event)
      },
      createGroups: (ownership) => {
        const actions = [
          {
            name: AiActionNames.APPLY_PREPARED_DESIGN,
            description: 'Apply',
            inputSchema: {},
            ...toolSemantics(
              toolResultObject({
                status: { const: 'complete' },
                compositionId: { type: 'string' },
                appliedElementIds: { type: 'array', items: { type: 'string' } },
                timing: toolInternalResult({ type: 'object' })
              }),
              'mutation',
              ['document']
            )
          }
        ]
        const designs = createLocalDesignTools(
          actions,
          createDesignPreparationSession(undefined, undefined, ownership)
        )
        const operations = createLocalOperationTools(
          actions,
          designs,
          async (batch) => ({
            context: { elementCount: 5, selection: ['root'] },
            actionResults: batch.actions.map((action) => ({
              actionId: action.id,
              actionName: action.name,
              result: {
                status: 'complete',
                compositionId: 'root',
                appliedElementIds: ['root'],
                timing: { ownerMs: 17 }
              }
            }))
          })
        )
        const original = operations.callInternal
        operations.callInternal = (...args) => {
          writes++
          return original(...args)
        }
        return [
          {
            name: 'design',
            description: 'Workflow',
            owner: createLocalDesignWorkflow(designs, operations)
          }
        ]
      }
    })
    try {
      const definition = host
        .definitions()
        .find((entry) => entry.name === 'prepare_and_apply_design')
      if (!definition?.registeredName)
        throw new Error('Missing registered definition')
      const input = {
        parts: [
          {
            key: 'one',
            draft: {
              type: 'group',
              name: 'Part',
              children: [
                {
                  type: 'rect',
                  key: 'face',
                  name: 'Face',
                  width: 10,
                  height: 10
                }
              ]
            }
          },
          {
            key: 'two',
            draft: {
              type: 'group',
              name: 'Part',
              children: [
                {
                  type: 'rect',
                  key: 'face',
                  name: 'Face',
                  width: 10,
                  height: 10
                }
              ]
            }
          }
        ],
        response: 'full',
        inspection: 'defer'
      }
      const reply = JSON.parse(
        (
          await host.invoke(
            route === 'direct'
              ? { name: definition.registeredName, input }
              : {
                  name: 'tool_library.invoke_tool',
                  input: {
                    name: definition.registeredName,
                    revision: definition.revision,
                    input
                  }
                }
          )
        ).text
      )
      const result = route === 'direct' ? reply : reply.execution?.value
      expect(result?.status, JSON.stringify(reply)).toBe('partial')
      expect(result.measurementIssues[0].recovery).toContain(
        'Do not replay writes'
      )
      expect(result.parts).toHaveLength(2)
      for (const part of result.parts) {
        expect(part.actionResults[0].result).toMatchObject({
          compositionId: 'root',
          appliedElementIds: ['root']
        })
        expect(part.actionResults[0].result).not.toHaveProperty('timing')
        expect(part).not.toHaveProperty('context')
      }
      expect(JSON.stringify(observed)).toContain('ownerMs')
      expect(writes).toBe(2)
    } finally {
      await host.dispose()
    }
  }
)

it.each(['direct', 'registered'])(
  'keeps a failed browser prefix and recovery through %s without forwarding receipt diagnostics',
  async (route) => {
    let calls = 0
    const evidence: unknown[] = []
    const action = {
      name: AiActionNames.READ_DESIGN_CONTEXT,
      description: 'Read selected values',
      composition: 'allowed' as const,
      inputSchema: object({}),
      ...toolSemantics(
        toolResultObject({
          available: { const: true },
          values: { type: 'object' }
        }),
        'read',
        []
      )
    }
    const host = createLocalToolHost({
      requestId: 'failed-prefix',
      signal: new AbortController().signal,
      store: memory(),
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
      observe: (event) => {
        evidence.push(event)
      },
      createGroups: () => [
        {
          name: 'design',
          description: 'Operations',
          owner: createLocalOperationTools(
            [action],
            {
              modelActions: (actions) => actions,
              resolveBatch: (batch) => batch
            },
            async (batch) => {
              calls++
              const receipt = {
                context: { elementCount: 4 },
                actionResults: [
                  {
                    actionId: batch.actions[0].id,
                    actionName: action.name,
                    result: {
                      available: true,
                      values: { context: 'user value' },
                      actionObservation: { ownerMs: 4 }
                    }
                  }
                ],
                failure: {
                  code: 'AI_EXECUTION_FAILED',
                  message: 'Transport failed after receipt',
                  stage: 'execution',
                  actionName: action.name,
                  actionId: batch.actions[0].id,
                  actionExecutionMs: 12,
                  settlement: 'completed' as const,
                  contextFresh: true
                }
              }
              throw new BrowserBatchExecutionError(
                {
                  batchId: batch.batchId,
                  actionName: action.name,
                  code: 'BROWSER_BATCH_EXECUTION_FAILED',
                  message: 'Transport failed after receipt',
                  handlerMs: 10,
                  executionMs: 12
                },
                receipt
              )
            }
          )
        }
      ]
    })
    try {
      const definition = host
        .definitions()
        .find((entry) => entry.name === action.name)
      if (!definition?.registeredName)
        throw new Error('Missing registered definition')
      const input = { arguments: {} }
      const raw = JSON.parse(
        (
          await host.invoke(
            route === 'direct'
              ? { name: definition.registeredName, input }
              : {
                  name: 'tool_library.invoke_tool',
                  input: {
                    name: definition.registeredName,
                    revision: definition.revision,
                    input
                  }
                }
          )
        ).text
      )
      const result =
        route === 'direct'
          ? raw
          : (raw.execution.value ?? raw.execution.recovery?.[0]?.value)
      expect(result?.toolOutcome.status, JSON.stringify(raw)).toBe('partial')
      expect(result.recovery, JSON.stringify(raw)).toContain(
        'Do not automatically replay mutations'
      )
      expect(result.executionResult.actionResults[0].result).toEqual({
        available: true,
        values: { context: 'user value' }
      })
      expect(result.executionResult.failure).toMatchObject({
        code: 'AI_EXECUTION_FAILED',
        settlement: 'completed'
      })
      expect(result.executionResult).not.toHaveProperty('context')
      expect(result.executionResult.failure).not.toHaveProperty(
        'actionExecutionMs'
      )
      expect(result.batchFailure).not.toHaveProperty('executionMs')
      expect(JSON.stringify(evidence)).toContain('actionExecutionMs')
      expect(calls).toBe(1)
    } finally {
      await host.dispose()
    }
  }
)

it('keeps internal schema fields available to admitted recipe bindings before external projection', async () => {
  let calls = 0
  const host = createLocalToolHost({
    requestId: 'internal-binding',
    signal: new AbortController().signal,
    store: memory(),
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
    createGroups: () => [
      {
        name: 'owned',
        description: 'Internal results',
        owner: {
          definitions: [
            {
              name: 'compute',
              description: 'Compute once',
              composition: 'allowed',
              inputSchema: object({}),
              ...toolSemantics(
                toolResultObject({
                  status: { const: 'complete' },
                  internal: toolInternalResult({ type: 'integer' })
                }),
                'read',
                []
              )
            }
          ],
          call: async () => {
            calls++
            return JSON.stringify({ status: 'complete', internal: 17 })
          }
        }
      }
    ]
  })
  try {
    const proposal = {
      format: 1,
      name: 'consume-internal',
      revision: 1,
      description: 'Consume canonical owner data',
      inputSchema: object({}),
      outputSchema: { type: 'integer' },
      steps: [
        { id: 'read', tool: 'owned.compute', revision: 2, input: literal({}) }
      ],
      output: { kind: 'step', step: 'read', path: '/internal' }
    }
    const submitted = JSON.parse(
      (
        await host.invoke({
          name: 'tool_library.submit_tool',
          input: { submissionId: 'internal', proposal }
        })
      ).text
    )
    expect(submitted, JSON.stringify(submitted)).toMatchObject({ ok: true })
    const invoked = JSON.parse(
      (
        await host.invoke({
          name: 'tool_library.invoke_tool',
          input: { name: proposal.name, revision: 1, input: {} }
        })
      ).text
    )
    expect(invoked.execution.value).toBe(17)
    expect(calls).toBe(1)
    const direct = JSON.parse(
      (await host.invoke({ name: 'owned.compute', input: {} })).text
    )
    expect(direct).not.toHaveProperty('internal')
  } finally {
    await host.dispose()
  }
})

it.each([
  ['native', 'invalid'],
  ['native', 'throws'],
  ['registered', 'invalid'],
  ['registered', 'throws']
])(
  'preserves completed work when %s model delivery %s',
  async (route, mode) => {
    let calls = 0
    const evidence: unknown[] = []
    const host = createLocalToolHost({
      requestId: 'invalid-view',
      observe: (event) => {
        evidence.push(event)
      },
      signal: new AbortController().signal,
      store: memory(),
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
      createGroups: () => [
        {
          name: 'owned',
          description: 'Output owner',
          owner: {
            definitions: [
              {
                name: 'write',
                composition: 'allowed',
                description: 'Write',
                inputSchema: object({}),
                ...toolSemantics(
                  toolResultObject({
                    status: { const: 'complete' },
                    identity: { type: 'string' }
                  }),
                  'mutation',
                  ['document']
                )
              }
            ],
            call: async () => {
              calls++
              return JSON.stringify({ status: 'complete', identity: 'created' })
            },
            projectModelResult: () => {
              if (mode === 'throws')
                throw new Error('Projection unavailable after execution')
              return { status: 'complete' }
            }
          }
        }
      ]
    })
    try {
      const reply = await host.invoke(
        route === 'native'
          ? { name: 'owned.write', input: {} }
          : {
              name: 'tool_library.invoke_tool',
              input: { name: 'owned.write', revision: 2, input: {} }
            }
      )
      const envelope = JSON.parse(reply.text)
      const value = route === 'native' ? envelope : envelope.execution.value
      expect(reply.success).toBe(false)
      expect(value).toMatchObject({
        code: 'TOOL_DELIVERY_INVALID',
        toolOutcome: { status: 'partial', settlement: 'completed' }
      })
      expect(value.executionResult).toMatchObject({
        status: 'complete',
        identity: 'created'
      })
      expect(value.message).toContain('must not be replayed')
      expect(calls).toBe(1)
      const recorded = (evidence as { output?: { text?: string } }[]).flatMap(
        ({ output }) => (output?.text ? [JSON.parse(output.text)] : [])
      )
      expect(
        recorded.some(
          (output) => (output.execution?.value ?? output).identity === 'created'
        )
      ).toBe(true)
    } finally {
      await host.dispose()
    }
  }
)

it.each(['native', 'registered', 'batch'])(
  'reports a child delivery failure through the %s envelope without losing acknowledged work',
  async (route) => {
    let calls = 0
    const action = {
      name: AiActionNames.READ_DESIGN_CONTEXT,
      description: 'Read selected context',
      composition: 'allowed' as const,
      inputSchema: object({}),
      ...toolSemantics(
        toolResultObject({
          available: { const: true },
          identity: { type: 'string' },
          view: { type: 'object' }
        }),
        'read',
        []
      ),
      delivery: {
        path: '/view',
        outputSchema: object({ identity: { type: 'string' } })
      }
    }
    const host = createLocalToolHost({
      requestId: 'child-delivery',
      signal: new AbortController().signal,
      store: memory(),
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
      createGroups: () => [
        {
          name: 'design',
          description: 'Operations',
          owner: createLocalOperationTools(
            [action],
            {
              modelActions: (actions) => actions,
              resolveBatch: (batch) => batch
            },
            async (batch) => {
              calls++
              return {
                context: {},
                actionResults: batch.actions.map((entry, index) => ({
                  actionId: entry.id,
                  actionName: entry.name,
                  result: {
                    available: true,
                    identity: `read-${index}`,
                    view: index ? { identity: `read-${index}` } : {}
                  }
                }))
              }
            },
            { getNativeTools: () => host.definitions() }
          )
        }
      ]
    })
    try {
      const definition = host
        .definitions()
        .find(
          (entry) =>
            entry.name ===
            (route === 'batch' ? 'execute_design_batch' : action.name)
        )
      if (!definition?.registeredName)
        throw new Error('Missing operation route')
      const input =
        route === 'batch'
          ? {
              operations: [
                { name: action.name, arguments: {} },
                { name: action.name, arguments: {} }
              ],
              inspection: 'defer'
            }
          : { arguments: {} }
      const reply = await host.invoke(
        route === 'registered'
          ? {
              name: 'tool_library.invoke_tool',
              input: {
                name: definition.registeredName,
                revision: definition.revision,
                input
              }
            }
          : { name: definition.registeredName, input }
      )
      const envelope = JSON.parse(reply.text)
      const result =
        route === 'registered' ? envelope.execution.value : envelope
      expect(result?.actionResults, JSON.stringify(envelope)).toBeDefined()
      expect(reply.success).toBe(false)
      expect(result.toolOutcome).toMatchObject({
        status: 'partial',
        settlement: 'completed'
      })
      expect(result.actionResults[0].result).toMatchObject({
        code: 'TOOL_DELIVERY_INVALID',
        executionResult: { identity: 'read-0' }
      })
      if (route === 'batch')
        expect(result.actionResults[1].result).toEqual({ identity: 'read-1' })
      if (route === 'registered') {
        const discovery = host
          .definitions()
          .find((entry) => entry.name === 'describe_design_apis')
        if (!discovery?.registeredName)
          throw new Error('Missing discovery route')
        const guide = JSON.parse(
          await readCompleteInformation(
            async (args) =>
              (
                await host.invoke({
                  name: discovery.registeredName,
                  input: args
                })
              ).text,
            { names: [definition.registeredName], view: 'usage' }
          )
        )
        const selected = [...(guide.apis ?? []), ...(guide.tools ?? [])][0]
        expect(selected.execution).toEqual({
          kind: 'native-tool',
          namespace: definition.namespace,
          tool: definition.name
        })
        expect(
          operationContractIssue(result, selected.usageGuide.results, {
            stage: 'output'
          })
        ).toBeUndefined()
      }
      expect(calls).toBe(1)
    } finally {
      await host.dispose()
    }
  }
)

it('rejects a conflicting recipe revision without changing the first revision result', async () => {
  const host = createLocalToolHost({
    requestId: 'pinned-delivery',
    signal: new AbortController().signal,
    store: memory(),
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
    createGroups: () => [
      {
        name: 'owned',
        description: 'Read',
        owner: {
          definitions: [
            {
              name: 'read',
              description: 'Read',
              composition: 'allowed',
              inputSchema: object({}),
              ...toolSemantics(
                object({ status: { type: 'string', enum: ['complete'] } }),
                'read',
                []
              )
            }
          ],
          call: async () => JSON.stringify({ status: 'complete' })
        }
      }
    ]
  })
  try {
    for (const revision of [1, 2]) {
      const field = revision === 1 ? 'firstResult' : 'secondResult'
      const proposal = {
        format: 1,
        name: 'revision-result',
        revision,
        description: 'Pinned result',
        inputSchema: object({}),
        outputSchema: object({
          status: { type: 'string', enum: ['complete'] },
          [field]: { type: 'string' }
        }),
        steps: [
          { id: 'read', tool: 'owned.read', revision: 2, input: literal({}) }
        ],
        output: literal({ status: 'complete', [field]: 'retained' })
      }
      const submitted = await host.invoke({
        name: 'tool_library.submit_tool',
        input: { submissionId: `revision-${revision}`, proposal }
      })
      expect(JSON.parse(submitted.text), submitted.text).toMatchObject(
        revision === 1 ? { ok: true } : { ok: false, code: 'registration' }
      )
    }
    const reply = await host.invoke({
      name: 'tool_library.invoke_tool',
      input: { name: 'revision-result', revision: 1, input: {} }
    })
    expect(reply.success, reply.text).toBe(true)
    expect(JSON.parse(reply.text).execution.value).toEqual({
      status: 'complete',
      firstResult: 'retained'
    })
  } finally {
    await host.dispose()
  }
})

it('propagates a nested workflow part delivery failure while retaining the execution settlement', () => {
  const action = {
    name: AiActionNames.APPLY_PREPARED_DESIGN,
    description: 'Apply',
    inputSchema: {},
    ...toolSemantics(
      object({ identity: { type: 'string' }, view: { type: 'object' } }),
      'mutation',
      ['document']
    ),
    delivery: {
      path: '/view',
      outputSchema: object({ identity: { type: 'string' } })
    }
  }
  const designs = createLocalDesignTools([action])
  const operations = createLocalOperationTools([action], designs, async () => {
    throw new Error('Projection cannot execute')
  })
  const workflow = createLocalDesignWorkflow(designs, operations)
  const original = {
    status: 'complete',
    toolOutcome: { status: 'success', settlement: 'completed' },
    parts: [
      {
        completedSteps: ['prepare', 'apply'],
        actionResults: [
          {
            actionId: 'one',
            actionName: action.name,
            result: { identity: 'root', view: {} }
          }
        ]
      }
    ]
  }
  const projected = workflow.projectModelResult(
    'prepare_and_apply_design',
    {},
    original
  ) as typeof original
  expect(projected.toolOutcome).toMatchObject({
    status: 'partial',
    settlement: 'completed'
  })
  expect(projected.parts[0].actionResults[0].result).toMatchObject({
    code: 'TOOL_DELIVERY_INVALID',
    executionResult: { identity: 'root' }
  })
  expect(original.toolOutcome.status).toBe('success')
})

it.each(['native', 'registered'])(
  'rejects a %s projector that promotes acknowledged partial work',
  async (route) => {
    let calls = 0
    const partial = {
      status: 'partial',
      settlement: 'partial',
      completed: ['one'],
      remaining: ['two']
    }
    const host = createLocalToolHost({
      requestId: 'partial-promotion',
      signal: new AbortController().signal,
      store: memory(),
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
      createGroups: () => [
        {
          name: 'owned',
          description: 'Partial owner',
          owner: {
            definitions: [
              {
                name: 'write',
                description: 'Write',
                composition: 'allowed',
                inputSchema: object({}),
                ...toolSemantics(
                  object({
                    status: { const: 'complete' },
                    identity: { type: 'string' }
                  }),
                  'mutation',
                  ['document']
                ),
                partialOutputSchema: object({
                  status: { const: 'partial' },
                  settlement: { const: 'partial' },
                  completed: { type: 'array', items: { type: 'string' } },
                  remaining: { type: 'array', items: { type: 'string' } }
                })
              }
            ],
            call: async () => {
              calls++
              return JSON.stringify(partial)
            },
            projectModelResult: () => ({
              status: 'complete',
              identity: 'one',
              toolOutcome: { status: 'success', settlement: 'completed' }
            })
          }
        }
      ]
    })
    try {
      const reply = await host.invoke(
        route === 'native'
          ? { name: 'owned.write', input: {} }
          : {
              name: 'tool_library.invoke_tool',
              input: { name: 'owned.write', revision: 2, input: {} }
            }
      )
      const envelope = JSON.parse(reply.text)
      const value =
        route === 'native'
          ? envelope
          : (envelope.execution.value ??
            envelope.execution.recovery?.[0]?.value)
      expect(reply.success).toBe(false)
      expect(value).toMatchObject({
        code: 'TOOL_DELIVERY_INVALID',
        settlement: 'partial',
        executionResult: partial
      })
      expect(calls).toBe(1)
    } finally {
      await host.dispose()
    }
  }
)
