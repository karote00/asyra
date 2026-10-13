import { expect, it, vi } from 'vitest'
import {
  createAiToolContract,
  type AiToolStoreEntry
} from '@asyra/ai-agent-runtime'
vi.mock('../../src/contexts', () => ({ default: {} }))
vi.mock('../../src/common-apis', () => ({}))
import { createBasicApiActions } from '../../src/ai/basic-api-actions'
import { createLocalOperationTools } from '../local-operation-tools'
import { createLocalToolHost } from '../local-tool-host'

const literal = (value: unknown) => ({ kind: 'literal', value })
const inputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['width'],
  properties: { width: { type: 'number' } }
}
const proposal = {
  format: 1,
  name: 'create-selected-part',
  revision: 1,
  description:
    'Create a fresh editable part and select the acknowledged result.',
  inputSchema,
  outputSchema: { type: 'null' },
  steps: [
    {
      id: 'create',
      tool: 'design_operations.api_element_createElements',
      revision: 2,
      input: {
        kind: 'object',
        fields: {
          inspection: literal('defer'),
          arguments: {
            kind: 'object',
            fields: {
              createOptions: {
                kind: 'array',
                items: [
                  {
                    kind: 'object',
                    fields: {
                      type: literal('rect'),
                      width: { kind: 'input', path: '/width' },
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
      id: 'select',
      tool: 'design_operations.api_selection_selectElements',
      revision: 2,
      input: {
        kind: 'object',
        fields: {
          arguments: {
            kind: 'object',
            fields: {
              elementIds: {
                kind: 'step',
                step: 'create',
                path: '/actionResults/0/result/appliedElementIds'
              }
            }
          }
        }
      }
    }
  ],
  output: literal(null)
}

const fixture = () => {
  const create = vi.fn(() => ['created-id'] as (string | null)[])
  const select = vi.fn()
  const actions = createBasicApiActions(() => ({
    core: {},
    element: { createElements: create },
    selection: { selectElements: select },
    fill: {},
    stroke: {},
    hierarchy: {},
    viewport: {}
  }))
  const entries = new Map<string, AiToolStoreEntry>()
  const signal = new AbortController().signal
  const host = createLocalToolHost({
    requestId: 'request',
    signal,
    capacity: 10,
    receiptCapacity: 10,
    artifactCapacity: 10,
    limits: {
      bytes: 24000,
      steps: 10,
      bindings: 100,
      bindingDepth: 32,
      issues: 10
    },
    store: {
      read: async (key) => entries.get(key),
      list: async () => [...entries.values()],
      write: async (input) => {
        if (entries.get(input.key)?.version !== input.expectedVersion)
          throw new Error('Conflict')
        const entry = {
          key: input.key,
          record: input.record,
          version: crypto.randomUUID()
        }
        entries.set(input.key, entry)
        return entry
      }
    },
    createGroups: () => [
      {
        name: 'design_operations',
        description: 'Registered design operations',
        owner: createLocalOperationTools(
          actions.map(createAiToolContract),
          {
            modelActions: (value) => value,
            resolveBatch: (value) => value
          },
          async (batch) => ({
            context: null,
            actionResults: await Promise.all(
              batch.actions.map(async (call) => {
                const action = actions.find(
                  (action) => action.name === call.name
                )
                if (!action) throw new Error('Unknown action')
                return {
                  actionId: call.id,
                  actionName: call.name,
                  result: JSON.parse(
                    JSON.stringify(
                      await action.execute(call.arguments, {
                        signal,
                        runMutation: async (work) => work()
                      })
                    )
                  )
                }
              })
            )
          }),
          {
            getNativeTools: () => host.definitions(),
            getNativeToolsRevision: () => host.revision
          }
        )
      }
    ]
  })
  let id = 0
  const invoke = async (name: string, input: unknown) =>
    JSON.parse((await host.invoke({ name, input, callId: String(++id) })).text)
  return { host, invoke, create, select }
}

it('composes actual canonical basic operations and hands creation identities through secured browser dispatch', async () => {
  const app = fixture()
  try {
    const admitted = await app.invoke('tool_library.submit_tool', {
      submissionId: 'create-selected',
      proposal
    })
    expect(admitted, JSON.stringify(admitted)).toMatchObject({ ok: true })
    const result = await app.invoke('tool_library.invoke_tool', {
      name: proposal.name,
      revision: 1,
      input: { width: 17 }
    })
    expect(result, JSON.stringify(result)).toMatchObject({
      execution: { status: 'success', value: null },
      storage: { status: 'saved' }
    })
    expect(app.create).toHaveBeenCalledExactlyOnceWith([
      { type: 'rect', width: 17, height: 20 }
    ])
    expect(app.select).toHaveBeenCalledExactlyOnceWith(['created-id'])
    const semantic = await app.invoke(
      'design_operations.describe_design_apis',
      { operation: 'element.createElements' }
    )
    expect(semantic.apis[0].recipeDependency).toEqual({
      name: proposal.steps[0].tool,
      revision: 2,
      definition: {
        tool: 'describe_design_apis',
        arguments: { names: [proposal.steps[0].tool] }
      }
    })
    const lookup = await app.invoke('design_operations.describe_design_apis', {
      names: [proposal.steps[0].tool]
    })
    expect(lookup.tools[0]).toMatchObject({
      registeredName: proposal.steps[0].tool,
      revision: 2,
      composition: 'allowed',
      execution: {
        kind: 'registered-tool',
        namespace: 'tool_library',
        tool: 'invoke_tool'
      }
    })
    const definition = app.host
      .definitions()
      .find((item) => item.registeredName === proposal.steps[0].tool)
    expect(definition?.execution).toMatchObject({
      kind: 'registered-tool',
      namespace: 'tool_library',
      tool: 'invoke_tool',
      arguments: { name: proposal.steps[0].tool, revision: 2 }
    })
  } finally {
    await app.host.dispose()
  }
})

it('stops a composed successor when the canonical creation receipt reports unavailable items', async () => {
  const app = fixture()
  app.create.mockReturnValue([null])
  try {
    const admitted = await app.invoke('tool_library.submit_tool', {
      submissionId: 'failed-create',
      proposal
    })
    expect(admitted, JSON.stringify(admitted)).toMatchObject({ ok: true })
    const result = await app.invoke('tool_library.invoke_tool', {
      name: proposal.name,
      revision: 1,
      input: { width: 17 }
    })
    expect(result.execution.status).not.toBe('success')
    expect(app.select).not.toHaveBeenCalled()
    expect(app.create).toHaveBeenCalledTimes(1)
    expect(result.storage).toBeUndefined()
  } finally {
    await app.host.dispose()
  }
})
