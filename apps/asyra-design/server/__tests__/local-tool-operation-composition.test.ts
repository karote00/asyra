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
import { createDesignCheckResults } from '../design-check-results'
import { AiActionNames } from '../../src/constants/ai-actions'
import { AiDesignToolIds } from '../../src/constants/ai-design'
import { createBatchExchange, requireBatchSuccess } from '../batch-exchange'
import { observeActionBatch } from '../local-action-observation'
import type { ExecuteAiBatch } from '../../src/ai/action-batch-protocol'

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
      revision: 3,
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
  let changed: ((change: { elementIds: string[] }) => void) | undefined
  const create = vi.fn(() => {
    changed?.({ elementIds: ['created-id'] })
    return ['created-id'] as (string | null)[]
  })
  const select = vi.fn()
  const actions = createBasicApiActions(
    () => ({
      core: {},
      element: { createElements: create },
      selection: { selectElements: select },
      fill: {},
      stroke: {},
      hierarchy: {},
      viewport: {}
    }),
    {
      observe: (listener) => {
        changed = listener
        return () => {
          changed = undefined
        }
      },
      resolve: () => 'live'
    }
  )
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
      revision: 3,
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
      revision: 3,
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
      arguments: { name: proposal.steps[0].tool, revision: 3 }
    })
  } finally {
    await app.host.dispose()
  }
})

it('rejects a saved dependency identity replaced by the canonical mutation scope contract', async () => {
  const app = fixture()
  try {
    const replaced = structuredClone(proposal)
    replaced.steps[0].revision = 2
    const result = await app.invoke('tool_library.submit_tool', {
      submissionId: 'replaced-mutation-contract',
      proposal: replaced
    })
    expect(result).toMatchObject({ ok: false, code: 'admission' })
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'dependency', path: '/steps/0' })
      ])
    )
    expect(app.create).not.toHaveBeenCalled()
    expect(app.select).not.toHaveBeenCalled()
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

// Cross-owner review: use the production API adapter rather than inventing its
// result envelope in the server fixture. Public owner methods are the only stub.
const inspectionHandoffFixture = () => {
  const checked: string[] = []
  const validated: string[] = []
  const values = new Map<string, unknown>()
  const changes = new Map<
    string,
    { elementIds: string[]; removed?: string[] }
  >()
  let changed: ((change: { elementIds: string[] }) => void) | undefined
  const removed = new Set<string>()
  const calls: string[] = []
  const state = {
    current: true,
    validationFailure: false,
    checkFailure: false,
    mismatchedReceipt: false,
    mismatchedMutation: false,
    missingMutationScope: false,
    incompleteMutationScope: false,
    unavailable: false,
    findings: [] as unknown[]
  }
  const methods = (owner: string) =>
    new Proxy(
      {},
      {
        get:
          (_target, key) =>
          (..._args: unknown[]) => {
            const name = `${owner}.${String(key)}`
            calls.push(name)
            const change = changes.get(name)
            if (change) {
              change.removed?.forEach((id) => removed.add(id))
              changed?.({
                elementIds: [...change.elementIds, ...(change.removed ?? [])]
              })
            }
            const value = values.get(name)
            if (value instanceof Error) throw value
            return value
          }
      }
    )
  const actions = createBasicApiActions(
    () => ({
      core: methods('core'),
      element: methods('element'),
      selection: methods('selection'),
      hierarchy: methods('hierarchy'),
      viewport: methods('viewport'),
      fill: methods('fill'),
      stroke: methods('stroke')
    }),
    {
      observe: (listener) => {
        changed = listener
        return () => {
          changed = undefined
        }
      },
      resolve: (id) => (removed.has(id) ? 'removed' : 'live')
    }
  )
  const signal = new AbortController().signal
  const checkResults = createDesignCheckResults()
  const definitions = [
    ...actions.map(createAiToolContract),
    ...[
      AiActionNames.REVIEW_DESIGN,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ].map((name) => ({ name, description: name, inputSchema: {} }))
  ]
  const dispatch: ExecuteAiBatch = async (batch) => ({
    context: {},
    actionResults: await Promise.all(
      batch.actions.map(async (call) => {
        let result: unknown
        if (call.name === AiActionNames.REVIEW_DESIGN) {
          const target = String(call.arguments.elementId)
          checked.push(target)
          if (state.checkFailure)
            throw new Error('Mechanical service unavailable')
          result = {
            available: !state.unavailable,
            complete: true,
            findings: state.findings,
            evidence: { sessionId: 'handoff', receiptId: target, revision: 1 }
          }
        } else if (call.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE) {
          const evidence = call.arguments.evidence as { receiptId: string }
          validated.push(evidence.receiptId)
          if (state.validationFailure)
            throw new Error('Validation transport unavailable')
          result = { current: state.current }
        } else {
          const action = actions.find((action) => action.name === call.name)
          if (!action) throw new Error('Unknown canonical action')
          result = await action.execute(call.arguments, {
            signal,
            runMutation: async (work) => work()
          })
        }
        if (state.missingMutationScope && result && typeof result === 'object')
          delete (result as Record<string, unknown>).mutationScope
        if (
          state.incompleteMutationScope &&
          call.name.startsWith('api_') &&
          result &&
          typeof result === 'object'
        ) {
          const scope = (result as { mutationScope?: { complete: boolean } })
            .mutationScope
          if (scope) scope.complete = false
        }
        let actionId = call.id
        if (state.mismatchedMutation && call.name.startsWith('api_'))
          actionId = 'wrong-write'
        else if (
          state.mismatchedReceipt &&
          call.name === AiActionNames.REVIEW_DESIGN
        )
          actionId = 'different-call'
        return {
          actionId,
          actionName: call.name,
          result: JSON.parse(JSON.stringify(result))
        }
      })
    )
  })
  const observation = vi.fn()
  const owner = createLocalOperationTools(
    definitions,
    {
      modelActions: (value) => value,
      resolveBatch: (value) => value,
      checkResults
    },
    async (batch) =>
      requireBatchSuccess(
        batch,
        await observeActionBatch(
          batch,
          async (submitted) => {
            const receipt = await dispatch(submitted)
            const exchange = createBatchExchange()
            return exchange.execute(submitted, signal, (frame) => {
              if (!exchange.accept(frame.receiptToken, receipt))
                throw new Error(
                  'Canonical receipt transport rejected the fixture'
                )
            })
          },
          definitions,
          'inspection-parent',
          observation
        ),
        0
      )
  )
  const api = (name: string) => `api_${name.replace('.', '_')}`
  const invoke = async (name: string, args: unknown) =>
    JSON.parse(await owner.call(name, args, signal))
  const write = (name: string, args: unknown) =>
    invoke(api(name), {
      arguments: args,
      inspection: 'defer'
    })
  const review = (elementId: string) =>
    invoke(AiActionNames.REVIEW_DESIGN, {
      arguments: { elementId }
    })
  const read = (ids?: string[]) =>
    invoke(AiDesignToolIds.READ_DESIGN_CHECKS, {
      includePassed: true,
      ...(ids ? { ids } : {})
    })
  const done = () =>
    owner.settleOutcome({
      batchId: 'done',
      actions: [
        {
          id: 'done',
          name: AiActionNames.REPORT_OUTCOME,
          arguments: { outcome: 'completed' },
          summary: 'Done'
        }
      ]
    }).actions[0].arguments.outcome
  return {
    owner,
    api,
    invoke,
    write,
    review,
    read,
    done,
    checked,
    validated,
    observation,
    values,
    changes,
    calls,
    state,
    signal,
    checkResults
  }
}

it.each([
  [
    'core.updateElementProperties',
    { updates: [{ elementId: 'a', values: { width: 20 } }] },
    undefined,
    ['a']
  ],
  [
    'element.updateElementProperties',
    { elementIds: ['a', 'b'], values: { width: 20 } },
    undefined,
    ['a', 'b']
  ],
  [
    'core.patchElementProperties',
    { patches: [{ elementId: 'a', values: { width: 20 } }] },
    undefined,
    ['a']
  ],
  [
    'element.patchElementProperties',
    { patches: [{ elementId: 'a', values: { width: 20 }, records: [] }] },
    undefined,
    ['a']
  ],
  [
    'core.updatePropertyComponents',
    { updates: [{ propertyId: 'shared-fill', values: { color: '#ffffff' } }] },
    undefined,
    ['a', 'b']
  ],
  [
    'fill.updatePrimaryFillColors',
    { updates: [{ elementId: 'a', color: '#ffffff' }] },
    [true],
    ['a']
  ],
  [
    'hierarchy.groupElements',
    { elementIds: ['a', 'b'] },
    { groupId: 'g', elementIds: ['a', 'b'] },
    ['g']
  ],
  [
    'hierarchy.ungroupElement',
    { groupId: 'g' },
    { groupId: 'g', elementIds: ['a', 'b'], removed: true },
    ['a', 'b']
  ],
  [
    'core.moveElements',
    { request: { elementIds: ['a'], targetParentId: 'p', targetIndex: 0 } },
    {
      moves: [
        {
          elementId: 'a',
          before: { parentId: 'old', index: 0 },
          after: { parentId: 'p', index: 0 }
        }
      ]
    },
    ['a']
  ],
  [
    'core.updateElementData',
    { elementId: 'a', values: { visible: false } },
    undefined,
    ['a']
  ],
  [
    'element.createElements',
    { createOptions: [{ type: 'rect', width: 10, height: 10 }] },
    ['a'],
    ['a']
  ]
] as const)(
  'checks actual canonical %s targets in a fresh request',
  async (name, args, value, targets) => {
    const f = inspectionHandoffFixture()
    f.values.set(name, value)
    f.changes.set(name, { elementIds: [...targets] })
    await f.write(name, args)
    expect(f.calls).toContain(name)
    expect(f.checked).toEqual(expect.arrayContaining([...targets]))
  }
)

it('does not turn a read result field into a mutation inspection target', async () => {
  const f = inspectionHandoffFixture()
  f.values.set('element.createElements', ['a'])
  f.changes.set('element.createElements', { elementIds: ['a'] })
  f.values.set('core.getElementData', {
    id: 'a',
    compositionId: 'unrelated-payload'
  })
  await f.invoke('execute_design_batch', {
    inspection: 'defer',
    operations: [
      {
        name: f.api('element.createElements'),
        arguments: { createOptions: [{ type: 'rect' }] }
      },
      { name: f.api('core.getElementData'), arguments: { elementId: 'a' } }
    ]
  })
  expect(f.checked).toEqual(['a'])
})

it('retires an already measured failure when its target is confirmed removed', async () => {
  const f = inspectionHandoffFixture()
  f.state.findings = [{ kind: 'text-overflow', elementId: 'a' }]
  await f.review('a')
  f.values.set('element.deleteElements', {
    removed: [{ elementId: 'a', parentId: 'root' }]
  })
  f.changes.set('element.deleteElements', { elementIds: [], removed: ['a'] })
  await f.write('element.deleteElements', { elementIds: ['a'] })
  expect(f.checkResults.read().items).toEqual([])
})

it('keeps a failed currency read from leaving a prior pass current', async () => {
  const f = inspectionHandoffFixture()
  await f.review('a')
  f.state.validationFailure = true
  await f.read(['measurement:a']).catch(() => undefined)
  expect(
    f.checkResults.read({ ids: ['measurement:a'], includePassed: true })
      .items[0].status
  ).not.toBe('pass')
})

it('returns existing unresolved findings when a current measurement is reused', async () => {
  const f = inspectionHandoffFixture()
  f.state.findings = [{ kind: 'text-overflow', elementId: 'a' }]
  await f.review('a')
  f.checked.length = 0
  const result = await f.owner.finishInspection(
    new Set(['a']),
    undefined,
    true,
    f.signal
  )
  expect(f.checked).toEqual([])
  expect(JSON.stringify(result)).toMatch(/text-overflow|measurement:a/)
})

it('preserves known evidence as unresolved when a subsequent check is unavailable', async () => {
  const f = inspectionHandoffFixture()
  f.state.findings = [{ kind: 'text-overflow', elementId: 'a' }]
  await f.review('a')
  f.state.current = false
  f.state.checkFailure = true
  await f.owner.finishInspection(new Set(['a']), undefined, true, f.signal)
  const result = f.checkResults.read({
    ids: ['measurement:a'],
    includePassed: true
  }).items[0]
  expect(result.status).not.toBe('pass')
  expect(result.evidence).toContain('text-overflow')
})

it('validates only requested measurement dependencies for an explicit check read', async () => {
  const f = inspectionHandoffFixture()
  for (const id of ['a', 'b', 'c']) await f.review(id)
  f.validated.length = 0
  await f.read(['measurement:b'])
  expect(f.validated).toEqual(['b'])
})

it.each(['mismatchedReceipt', 'unavailable'] as const)(
  'does not certify a %s mechanical receipt',
  async (mode) => {
    const f = inspectionHandoffFixture()
    f.state[mode] = true
    await f.review('a')
    expect(
      f.checkResults.read({ includePassed: true }).items[0].status
    ).not.toBe('pass')
  }
)

it('does not block completion after a canonical empty creation receipt', async () => {
  const f = inspectionHandoffFixture()
  f.values.set('element.createElements', [])
  await f.write('element.createElements', { createOptions: [] })
  expect(f.checked).toEqual([])
  expect(f.done()).toBe('completed')
})

it('keeps unrelated passed checks intact after invalidating another target', async () => {
  const f = inspectionHandoffFixture()
  for (const id of ['a', 'b']) await f.review(id)
  f.checkResults.invalidate(['measurement:a'], 'Only a changed')
  expect(
    f.checkResults.read({ ids: ['measurement:b'], includePassed: true })
      .items[0].status
  ).toBe('pass')
})

it('stops before new checks when the invocation is already cancelled', async () => {
  const f = inspectionHandoffFixture()
  const controller = new AbortController()
  controller.abort()
  await expect(
    f.owner.finishInspection(new Set(['a']), undefined, true, controller.signal)
  ).rejects.toThrow()
  expect(f.checked).toEqual([])
})

it.each([
  ['core.getElementData', { elementId: 'a' }],
  ['selection.selectElements', { elementIds: ['a'] }],
  ['core.getViewportScale', {}]
] as const)('does not scan drawing geometry for %s', async (name, args) => {
  const f = inspectionHandoffFixture()
  await f.write(name, args)
  expect(f.checked).toEqual([])
  expect(f.done()).toBe('completed')
})

it('surfaces a missing mechanical service without replaying the acknowledged write', async () => {
  const f = inspectionHandoffFixture()
  f.state.checkFailure = true
  f.values.set('element.createElements', ['a'])
  f.changes.set('element.createElements', { elementIds: ['a'] })
  const result = await f.write('element.createElements', {
    createOptions: [{ type: 'rect' }]
  })
  expect(f.calls).toEqual(['element.createElements'])
  expect(result.measurementIssues).toEqual([
    expect.objectContaining({ elementId: 'a' })
  ])
  expect(f.done()).toBe('unsupported')
})

it('reuses a current passing measurement without recomputation', async () => {
  const f = inspectionHandoffFixture()
  await f.review('a')
  f.checked.length = 0
  await f.owner.finishInspection(new Set(['a']), undefined, true, f.signal)
  expect(f.checked).toEqual([])
  expect(f.validated).toEqual(['a'])
})

it('invalidates prior success when an explicit mechanical recheck fails', async () => {
  const f = inspectionHandoffFixture()
  await f.review('a')
  f.state.checkFailure = true
  await expect(f.review('a')).rejects.toThrow('Mechanical service unavailable')
  expect(
    f.checkResults.read({ ids: ['measurement:a'], includePassed: true })
      .items[0].status
  ).not.toBe('pass')
})

it('can recover a stale measurement at the next coherent boundary', async () => {
  const f = inspectionHandoffFixture()
  await f.review('a')
  f.state.validationFailure = true
  await f.read(['measurement:a'])
  f.state.validationFailure = false
  f.checked.length = 0
  await f.owner.finishInspection(new Set(['a']), undefined, true, f.signal)
  expect(
    f.checkResults.read({ ids: ['measurement:a'], includePassed: true })
      .items[0].status
  ).toBe('pass')
})

it.each(['missingMutationScope', 'mismatchedMutation'] as const)(
  'retains unresolved mutation scope for %s without pretending checks passed',
  async (mode) => {
    const f = inspectionHandoffFixture()
    f.state[mode] = true
    f.values.set('element.createElements', ['a'])
    f.changes.set('element.createElements', { elementIds: ['a'] })
    const result = await f.write('element.createElements', {
      createOptions: [{ type: 'rect' }]
    })
    expect(f.checked).toEqual([])
    expect(result.checks.firstPendingId).toMatch(/^mutation-scope:/)
    expect(f.done()).toBe('unsupported')
    expect(f.calls).toEqual(['element.createElements'])
  }
)

it('does not claim completion after a mutation transport failure with no acknowledgement', async () => {
  const f = inspectionHandoffFixture()
  f.values.set('element.createElements', new Error('Transport disconnected'))
  const lost = await f.write('element.createElements', {
    createOptions: [{ type: 'rect' }]
  })
  expect(lost).toMatchObject({
    message: 'Transport disconnected',
    recoverable: false,
    toolOutcome: { settlement: 'unknown' }
  })
  expect(f.done()).toBe('unsupported')
  expect(f.calls).toEqual(['element.createElements'])
})

it.each([
  'missingMutationScope',
  'mismatchedMutation',
  'incompleteMutationScope'
] as const)(
  'stops later writes after %s while preserving reads and an honest terminal outcome',
  async (mode) => {
    const f = inspectionHandoffFixture()
    f.state[mode] = true
    f.values.set('element.createElements', ['a'])
    f.changes.set('element.createElements', { elementIds: ['a'] })
    const first = await f.write('element.createElements', {
      createOptions: [{ type: 'rect' }]
    })
    expect(first.measurementIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recovery: expect.stringMatching(/Stop this request/)
        })
      ])
    )
    f.state[mode] = false
    await f.review('a')
    const retained = await f.read([first.checks.firstPendingId])
    expect(retained.items[0]).toMatchObject({
      origin: 'tool',
      status: 'unverified'
    })
    const blocked = await f.write('element.createElements', {
      createOptions: [{ type: 'rect' }]
    })
    expect(blocked).toMatchObject({
      code: 'MUTATION_SCOPE_UNAVAILABLE',
      recoverable: false,
      toolOutcome: { status: 'failed', settlement: 'not-started' }
    })
    expect(f.calls).toEqual(['element.createElements'])
    expect(f.done()).toBe('unsupported')
    expect(retained.items[0].evidence).toContain('Stop this request')
  }
)

it.each([false, true])(
  'keeps large automatic mechanical results retained with compact delivery, findings=%s',
  async (findings) => {
    const f = inspectionHandoffFixture()
    f.values.set('element.createElements', ['a', 'b'])
    f.changes.set('element.createElements', { elementIds: ['a', 'b'] })
    f.state.findings = findings
      ? Array.from({ length: 1000 }, (_, i) => ({
          kind: 'container-overflow',
          elementId: `child-${i}`,
          detail: 'retained-evidence-'.repeat(30)
        }))
      : []
    const result = await f.write('element.createElements', {
      createOptions: [{ type: 'rect' }]
    })
    expect(
      result.actionResults.map(
        (entry: { actionName: string }) => entry.actionName
      )
    ).toEqual([f.api('element.createElements')])
    expect(result.checks.counts[findings ? 'fail' : 'pass']).toBe(2)
    expect(JSON.stringify(result).length).toBeLessThan(3000)
    expect(f.checked).toEqual(['a', 'b'])
    const read = await f.read(['measurement:a'])
    expect(JSON.parse(read.items[0].evidence).findings).toEqual(
      f.state.findings
    )
    expect(f.checked).toEqual(['a', 'b'])
    const explicit = await f.review('a')
    expect(explicit.actionResults[0].result.findings).toEqual(f.state.findings)
    f.state.current = false
    const full = await f.invoke('execute_design_batch', {
      operations: [
        {
          name: f.api('element.createElements'),
          arguments: { createOptions: [{ type: 'rect' }] }
        }
      ],
      inspection: 'defer',
      response: 'full'
    })
    expect(full.actionResults[0].result.appliedElementIds).toEqual(['a', 'b'])
    expect(
      full.actionResults
        .filter(
          (entry: { actionName: string }) =>
            entry.actionName === AiActionNames.REVIEW_DESIGN
        )
        .map(
          (entry: { result: { findings: unknown[] } }) => entry.result.findings
        )
    ).toEqual([f.state.findings, f.state.findings])
  }
)

it('does not clear unacknowledged write settlement with a later geometry pass or leak it into a fresh request', async () => {
  const f = inspectionHandoffFixture()
  f.values.set('element.createElements', new Error('Transport disconnected'))
  const lost = await f.write('element.createElements', {
    createOptions: [{ type: 'rect' }]
  })
  expect(lost).toMatchObject({
    message: 'Transport disconnected',
    recoverable: false,
    toolOutcome: { settlement: 'unknown' }
  })
  await f.review('a')
  const blocked = await f.write('element.createElements', {
    createOptions: [{ type: 'rect' }]
  })
  expect(blocked).toMatchObject({
    recoverable: false,
    code: 'MUTATION_SCOPE_UNAVAILABLE'
  })
  expect(f.calls).toHaveLength(1)
  const next = inspectionHandoffFixture()
  next.values.set('element.createElements', ['next'])
  next.changes.set('element.createElements', { elementIds: ['next'] })
  const result = await next.write('element.createElements', {
    createOptions: [{ type: 'rect' }]
  })
  expect(result.checks.counts.pass).toBe(1)
  expect(next.calls).toHaveLength(1)
})

it('delivers terminal scope recovery on the first lost mutation acknowledgement', async () => {
  const f = inspectionHandoffFixture()
  f.values.set('element.createElements', new Error('Transport disconnected'))
  const result = await f.write('element.createElements', {
    createOptions: [{ type: 'rect' }]
  })
  expect(result).toMatchObject({
    recoverable: false,
    message: 'Transport disconnected',
    recovery: expect.stringContaining('Stop this request'),
    toolOutcome: { status: 'failed', settlement: 'unknown' }
  })
  expect(f.calls).toHaveLength(1)
})
