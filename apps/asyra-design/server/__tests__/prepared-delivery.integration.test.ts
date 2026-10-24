import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { expect, it, vi } from 'vitest'
import { createLocalDesignTools } from '../local-design-tools'
import {
  createDesignPreparationSession,
  prepareDesign,
  prepareDesignAsync
} from '../design-preparation'
import { AiActionNames } from '../../src/constants/ai-actions'
import { AiDesignToolIds } from '../../src/constants/ai-design'
import { createHash } from 'node:crypto'
import {
  deliverPreparedDesign,
  type PreparedDesign,
  type PreparedDesignDelivery
} from '../../src/ai/prepared-design'
import {
  admitPreparedDesign,
  admitPreparedDesignDelivery
} from '../../src/ai/prepared-design-admission'
import { createLocalOperationTools } from '../local-operation-tools'
import type {
  AiActionBatch,
  AiBatchReceipt
} from '../../src/ai/action-batch-protocol'

const fixture = JSON.parse(
  gunzipSync(
    readFileSync(
      new URL(
        './fixtures/recorded-101/prepared-delivery-20261023.json.gz',
        import.meta.url
      )
    )
  ).toString()
)
const actions = [
  {
    name: AiActionNames.APPLY_PREPARED_DESIGN,
    description: 'Apply prepared artifact',
    inputSchema: { type: 'object', properties: { design: {} } }
  }
]

it('delivers the saved prepared input with at least fifteen percent fewer bytes and no repeated compilation', async () => {
  const compile = vi.fn<typeof prepareDesignAsync>(
    (signal, input, _identity, ...rest) =>
      prepareDesignAsync(signal, input, fixture.source.identity, ...rest)
  )
  const session = createDesignPreparationSession(prepareDesign, compile)
  const owner = createLocalDesignTools(actions, session)
  const receipt = JSON.parse(
    await owner.call(
      'prepare_design',
      { draft: fixture.request.draft },
      new AbortController().signal
    )
  )
  const batch = {
    batchId: 'apply',
    actions: [
      {
        id: 'apply',
        name: AiActionNames.APPLY_PREPARED_DESIGN,
        arguments: { artifactId: receipt.artifactId },
        summary: 'Apply saved drawing'
      }
    ]
  }
  const first = owner.resolveBatch(batch).actions[0].arguments
  const second = owner.resolveBatch(batch).actions[0].arguments
  expect(compile).toHaveBeenCalledTimes(1)
  expect(second).toEqual(first)
  const bytes = Buffer.byteLength(JSON.stringify(first))
  expect(bytes).toBeLessThanOrEqual(fixture.source.preparedBytes * 0.85)
  expect(first).not.toHaveProperty('design.keyToId')
  const delivered = (first as { design: PreparedDesignDelivery }).design
  expect(
    admitPreparedDesignDelivery(JSON.parse(JSON.stringify(delivered)))
  ).toEqual(fixture.prepared.design)
  expect(
    createHash('sha256').update(JSON.stringify(fixture.prepared)).digest('hex')
  ).toBe(fixture.source.preparedSha256)
  const canonical = session.resolve(receipt.artifactId)
  // Geometry is already compiled: delivery visits entries, never topology contents.
  expect(delivered.entries[1].descriptor.points).toBe(
    canonical.entries[1].descriptor.points
  )
  expect(delivered.entries[1].descriptor.fills).toBe(
    canonical.entries[1].descriptor.fills
  )
  const clone = vi.spyOn(globalThis, 'structuredClone')
  try {
    admitPreparedDesignDelivery(delivered)
    expect(clone).toHaveBeenCalledTimes(1)
  } finally {
    clone.mockRestore()
  }
  expect(compile).toHaveBeenCalledTimes(1)

  const timings: Record<string, number> = {}
  const measure = (name: string, action: () => unknown) => {
    const start = performance.now()
    const value = action()
    timings[name] = performance.now() - start
    return value
  }
  const baseline = measure('baselineEncodeMs', () =>
    JSON.stringify(fixture.prepared.design)
  ) as string
  measure('baselineParseAndAdmissionMs', () =>
    admitPreparedDesign(JSON.parse(baseline))
  )
  const compact = measure('projectionAndEncodeMs', () =>
    JSON.stringify(deliverPreparedDesign(canonical))
  ) as string
  measure('compactParseAndAdmissionMs', () =>
    admitPreparedDesignDelivery(JSON.parse(compact))
  )
  // Timing is diagnostic; exact bytes, topology identity and work counts are the oracles.
  console.info(
    JSON.stringify({
      measurement: 'prepared-delivery',
      baselineBytes: fixture.source.preparedBytes,
      deliveredBytes: bytes,
      compileCalls: compile.mock.calls.length,
      ...timings
    })
  )
})

const mixedDraft = {
  type: 'group',
  name: 'Mixed content',
  sharedFills: { paint: '#123456' },
  children: [
    {
      type: 'rect',
      key: 'rectangle',
      name: 'Rectangle',
      width: 20,
      height: 30,
      fill: { shared: 'paint' }
    },
    {
      type: 'oval',
      key: 'oval',
      name: 'Oval',
      x: 30,
      width: 20,
      height: 30,
      fill: { shared: 'paint' }
    },
    {
      type: 'frame',
      key: 'frame',
      name: 'Frame',
      x: 60,
      width: 200,
      height: 200,
      children: [
        {
          type: 'text',
          key: 'text',
          name: 'Text',
          text: 'Editable text',
          width: 180,
          height: 30
        },
        {
          type: 'vector',
          key: 'curve',
          name: 'Curve',
          y: 40,
          width: 100,
          height: 100,
          fill: '#778899',
          rings: [
            [
              { x: 0, y: 50, outControl: { x: 0, y: 0 } },
              { x: 100, y: 50, inControl: { x: 100, y: 0 } },
              { x: 50, y: 100 }
            ]
          ]
        }
      ]
    }
  ]
}

it('preserves all supported descriptor kinds and shared references without recompiling topology', () => {
  const { sharedFillIds: _shared, ...canonical } = prepareDesign(
    mixedDraft,
    'mixed'
  )
  const wire = deliverPreparedDesign(canonical)
  expect(admitPreparedDesignDelivery(JSON.parse(JSON.stringify(wire)))).toEqual(
    canonical
  )
  const shape = canonical.entries[1].descriptor
  expect(canonical.entries[2].descriptor.fills).toEqual([
    (shape.fills[0] as { id: string }).id
  ])
  const curve = canonical.entries.at(-1)?.descriptor
  expect(wire.entries.at(-1)?.descriptor.points).toBe(curve?.points)
  expect(wire.entries.at(-1)?.descriptor.networks).toBe(curve?.networks)
})

it('rejects inconsistent canonical identity maps before projection can conceal them', () => {
  const source = structuredClone(fixture.prepared.design) as PreparedDesign
  const properties = source.entries[0].descriptor.props
  properties.position = 'foreign-property'
  expect(() => deliverPreparedDesign(source)).toThrow(/identity/)
  const invalid = { ...fixture.prepared.design, keyToId: {} }
  expect(() => deliverPreparedDesign(invalid)).toThrow(/identity/)
})

it.each([
  [
    'old wire',
    (wire: Record<string, unknown>) =>
      Object.assign(wire, fixture.prepared.design)
  ],
  [
    'missing property',
    (wire: PreparedDesignDelivery) =>
      (wire.entries[0].descriptor.props as string[]).pop()
  ],
  [
    'duplicate property',
    (wire: PreparedDesignDelivery) =>
      (wire.entries[0].descriptor.props as string[]).push('position')
  ],
  [
    'foreign property',
    (wire: PreparedDesignDelivery) =>
      (wire.entries[0].descriptor.props as string[]).push('foreign')
  ],
  [
    'duplicate key',
    (wire: PreparedDesignDelivery) =>
      Object.assign(wire.entries[1], { key: wire.entries[0].key })
  ],
  [
    'duplicate ID',
    (wire: PreparedDesignDelivery) =>
      Object.assign(wire.entries[1].descriptor, { id: wire.rootId })
  ],
  [
    'foreign parent',
    (wire: PreparedDesignDelivery) =>
      Object.assign(wire.entries[1], { parentId: 'foreign' })
  ],
  [
    'foreign fill',
    (wire: PreparedDesignDelivery) =>
      Object.assign(wire.entries[1].descriptor, { fills: ['foreign'] })
  ],
  [
    'foreign topology',
    (wire: PreparedDesignDelivery) => {
      const segments = wire.entries[1].descriptor.segments as Record<
        string,
        { startId: string }
      >
      Object.values(segments)[0].startId = 'foreign'
    }
  ],
  [
    'injected key map',
    (wire: Record<string, unknown>) => {
      wire.keyToId = {}
    }
  ]
] as const)(
  'rejects %s at browser admission before any mutation',
  async (_name, corrupt) => {
    vi.stubGlobal('window', {})
    try {
      const { createPreparedDesignAction } =
        await import('../../src/ai/design-actions')
      const create = vi.fn()
      const action = createPreparedDesignAction({
        getWorkspaceId: () => 'workspace',
        getElementType: () => undefined,
        getElementMetadata: () => undefined,
        isContainerType: () => true,
        isLocked: () => false,
        create,
        select: vi.fn()
      })
      const wire = JSON.parse(
        JSON.stringify(deliverPreparedDesign(fixture.prepared.design))
      )
      corrupt(wire)
      await expect(
        action.execute({ design: wire }, {
          signal: new AbortController().signal
        } as never)
      ).rejects.toThrow()
      expect(create).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  }
)

it('executes resolver delivery through the dispatcher and real Core with full receipts and durable history', async () => {
  vi.stubGlobal('window', {})
  const { default: core } = await import('@asyra/core')
  const { default: factory } = await import('@asyra/factory')
  const { applyPreset, PresetDefaults, PresetProfiles } =
    await import('@asyra/preset')
  const { createPreparedDesignAction } =
    await import('../../src/ai/design-actions')
  const { createAiTransactionRunner } = await import('../../src/ai/transaction')
  const { createAiAgentRuntime, createAiToolContract } =
    await import('@asyra/ai-agent-runtime')
  applyPreset(core, {
    profile: PresetProfiles.CUSTOM,
    defaults: [
      PresetDefaults.BASIC_SHAPES,
      PresetDefaults.CONTAINERS,
      PresetDefaults.VECTOR,
      PresetDefaults.SELECTION,
      PresetDefaults.UI_CONTEXT
    ]
  })
  core.load({
    version: '1.0.0',
    props: {},
    sceneTree: {
      workspace: 'workspace',
      workspaceList: ['workspace'],
      elements: {
        workspace: {
          id: 'workspace',
          type: 'workspace',
          name: 'Workspace',
          parentId: '',
          children: [],
          visible: true,
          lock: false
        }
      }
    }
  })
  const initial = await core.save()
  const uiSnapshots: string[][] = []
  const uiSubscription = core
    .getUIPropertySubject<string[]>('flattenedElementIds')
    ?.subscribe((ids) => {
      if (ids.length) uiSnapshots.push(ids)
    })
  const action = createPreparedDesignAction(undefined, async () => undefined)
  const definitions = [createAiToolContract(action)]
  const compile = vi.fn<typeof prepareDesignAsync>(
    (signal, input, _identity, ...rest) =>
      prepareDesignAsync(signal, input, fixture.source.identity, ...rest)
  )
  const designs = createLocalDesignTools(
    definitions,
    createDesignPreparationSession(prepareDesign, compile)
  )
  let receipt: AiBatchReceipt | undefined
  let pending: AiActionBatch
  const runtime = createAiAgentRuntime({
    provider: {
      requestActionBatch: async (_input, options) => {
        receipt = await options.executeBatch?.(pending)
        return { batchId: 'report', actions: [] }
      }
    },
    actionDefinitions: [action],
    contextProvider: { getContext: async () => ({}) },
    permissionPolicy: { evaluate: () => 'allow' },
    confirmationHandler: { confirm: async () => true },
    transactionRunner: createAiTransactionRunner()
  })
  const dispatch = vi.fn(async (batch: AiActionBatch) => {
    pending = JSON.parse(JSON.stringify(batch))
    await runtime.run({
      intent: 'Apply prepared drawing',
      signal: new AbortController().signal
    })
    if (!receipt) throw new Error('Missing execution receipt')
    return receipt
  })
  const operations = createLocalOperationTools(definitions, designs, dispatch)
  try {
    const prepared = JSON.parse(
      await designs.call(
        'prepare_design',
        { draft: fixture.request.draft },
        new AbortController().signal
      )
    )
    await operations.call(
      AiDesignToolIds.EXECUTE_DESIGN_BATCH,
      {
        inspection: 'defer',
        operations: [
          {
            name: action.name,
            arguments: { artifactId: prepared.artifactId, response: 'full' }
          }
        ]
      },
      new AbortController().signal
    )
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(compile).toHaveBeenCalledTimes(1)
    expect(receipt?.failure).toBeUndefined()
    expect(receipt?.actionResults[0].result).toMatchObject({
      status: 'complete',
      compositionId: fixture.prepared.design.rootId,
      keyToId: fixture.prepared.design.keyToId
    })
    const created = await core.save()
    const expectedIds = fixture.prepared.design.entries.map(
      (entry: { descriptor: { id: string } }) => entry.descriptor.id
    )
    const ownerResult = receipt?.actionResults[0].result as {
      timing: {
        sliceCount: number
        canonicalWork: { counters: Record<string, number> }
      }
    }
    const counters = ownerResult.timing.canonicalWork.counters
    expect(uiSnapshots).toHaveLength(ownerResult.timing.sliceCount)
    uiSnapshots.forEach((ids) =>
      expect(ids).toEqual(expectedIds.slice(0, ids.length))
    )
    expect(uiSnapshots.at(-1)).toEqual(expectedIds)
    expect(counters['ui-context-hierarchy-node-visit']).toBe(1)
    expect(counters['ui-context-hierarchy-append-entry']).toBe(
      expectedIds.length - 1
    )
    expect(counters['ui-context-sync-flattened-ids']).toBe(uiSnapshots.length)
    expect(counters['ui-context-flattened-identity-output']).toBe(
      uiSnapshots.reduce((sum, ids) => sum + ids.length, 0)
    )
    expect(counters['ui-context-flattened-identity-copy']).toBe(
      uiSnapshots.slice(0, -1).reduce((sum, ids) => sum + ids.length, 0)
    )
    console.info(
      JSON.stringify({
        measurement: 'ui-hierarchy-projection',
        entries: expectedIds.length,
        publications: uiSnapshots.length,
        rootCandidates: counters['ui-context-hierarchy-root-candidate'],
        fullTreeVisits: counters['ui-context-hierarchy-node-visit'],
        tailVisits: counters['ui-context-hierarchy-tail-visit'],
        appendEntries: counters['ui-context-hierarchy-append-entry'],
        immutableIdCopies: counters['ui-context-flattened-identity-copy'],
        publishedIds: counters['ui-context-flattened-identity-output']
      })
    )
    // Every published array remains a point-in-time value after later mutations.
    const savedSnapshots = uiSnapshots.map((ids) => [...ids])
    uiSubscription?.unsubscribe()
    expect(Object.keys(created.sceneTree.elements)).toHaveLength(
      fixture.prepared.design.entries.length + 1
    )
    expect(receipt?.actionResults[0].result).toMatchObject({
      appliedElementIds: fixture.prepared.design.entries.map(
        (entry: { descriptor: { id: string } }) => entry.descriptor.id
      ),
      roleToElementIds: Object.fromEntries(
        Object.entries(fixture.prepared.design.keyToId).map(([key, id]) => [
          key,
          [id]
        ])
      )
    })
    const children = new Map<string, string[]>()
    for (const entry of fixture.prepared.design.entries) {
      const parent = entry.parentId ?? 'workspace'
      const ids = children.get(parent) ?? []
      ids.push(entry.descriptor.id)
      children.set(parent, ids)
      expect(created.sceneTree.elements[entry.descriptor.id].parentId).toBe(
        parent
      )
    }
    for (const [parent, ids] of children)
      expect(created.sceneTree.elements[parent].children).toEqual(ids)
    expect(factory.getUndoHistoryDepth()).toBe(1)
    factory.undo()
    expect((await core.save()).sceneTree).toEqual(initial.sceneTree)
    factory.redo()
    const restored = await core.save()
    expect(restored.props).toEqual(created.props)
    expect(restored.sceneTree).toEqual(created.sceneTree)
    core.load(created)
    const reloaded = await core.save()
    expect(reloaded.props).toEqual(created.props)
    expect(reloaded.sceneTree).toEqual(created.sceneTree)
    expect(core.getUIProperty('flattenedElementIds')).toEqual(expectedIds)
    expect(uiSnapshots).toEqual(savedSnapshots)
  } finally {
    uiSubscription?.unsubscribe()
    await runtime.dispose()
    vi.unstubAllGlobals()
  }
}, 30000)
