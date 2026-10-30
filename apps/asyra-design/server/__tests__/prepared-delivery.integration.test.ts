import { deepStrictEqual } from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'
import nonplanar from './fixtures/recorded-101/nonplanar-recovery-20261026.json'
import { createLocalDesignWorkflow } from '../local-design-workflow'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { beforeAll, describe, expect, it, vi } from 'vitest'
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
  // Only redundant identity fields are projected; retained geometry is not compiled.
  expect(delivered.entries[1].descriptor.points).not.toBe(
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
            ],
            [
              { x: 40, y: 60 },
              { x: 50, y: 80 },
              { x: 60, y: 60 }
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
  const unchanged = JSON.stringify(canonical)
  const wire = deliverPreparedDesign(canonical)
  expect(admitPreparedDesignDelivery(JSON.parse(JSON.stringify(wire)))).toEqual(
    canonical
  )
  const shape = canonical.entries[1].descriptor
  expect(canonical.entries[2].descriptor.fills).toEqual([
    (shape.fills[0] as { id: string }).id
  ])
  const curve = canonical.entries.at(-1)?.descriptor
  for (const field of ['points', 'segments', 'networks']) {
    const original = curve?.[field] as Record<string, Record<string, unknown>>
    const delivered = wire.entries.at(-1)?.descriptor[field] as Record<
      string,
      Record<string, unknown>
    >
    expect(Object.keys(delivered)).toEqual(Object.keys(original))
    for (const [key, value] of Object.entries(original)) {
      const { id, ...retained } = value
      expect(id).toBe(key)
      expect(delivered[key]).toEqual(retained)
      expect(delivered[key]).not.toHaveProperty('id')
      for (const name of Object.keys(retained)) {
        expect(delivered[key][name]).toBe(retained[name])
      }
    }
  }
  expect(JSON.stringify(canonical)).toBe(unchanged)
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
    'superseded compact wire',
    (wire: Record<string, unknown>) => {
      wire.version = 2
    }
  ],
  ...(['points', 'segments', 'networks'] as const).map(
    (field) =>
      [
        `redundant ${field} identity`,
        (wire: PreparedDesignDelivery) => {
          const records = wire.entries[1].descriptor[field] as Record<
            string,
            Record<string, unknown>
          >
          const [key, value] = Object.entries(records)[0]
          value.id = key
        }
      ] as const
  ),
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
  ...(['points', 'segments', 'networks'] as const).map(
    (field) =>
      [
        `missing ${field} record`,
        (wire: PreparedDesignDelivery) => {
          const records = wire.entries[1].descriptor[field] as Record<
            string,
            unknown
          >
          Reflect.deleteProperty(records, Object.keys(records)[0])
        }
      ] as const
  ),
  [
    'duplicate network reference',
    (wire: PreparedDesignDelivery) => {
      const records = wire.entries[1].descriptor.networks as Record<
        string,
        { pointIds: string[] }
      >
      const network = Object.values(records)[0]
      network.pointIds[1] = network.pointIds[0]
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
  let phaseStartedAt = performance.now()
  const recordPhase = (phase: string) => {
    const completedAt = performance.now()
    console.info(
      JSON.stringify({
        measurement: 'prepared-delivery-owner-phase',
        phase,
        durationMs: completedAt - phaseStartedAt
      })
    )
    phaseStartedAt = completedAt
  }
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
      if (ids.length) {
        uiSnapshots.push(ids)
      }
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
    if (!receipt) {
      throw new Error('Missing execution receipt')
    }
    return receipt
  })
  const operations = createLocalOperationTools(definitions, designs, dispatch)
  recordPhase('composition')
  try {
    const prepared = JSON.parse(
      await designs.call(
        'prepare_design',
        { draft: fixture.request.draft },
        new AbortController().signal
      )
    )
    recordPhase('preparation')
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
    recordPhase('dispatch')
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
    for (const [parent, ids] of children) {
      expect(created.sceneTree.elements[parent].children).toEqual(ids)
    }
    // Exercise the exact comparison used below on real persisted records.
    const root = created.sceneTree.elements[fixture.prepared.design.rootId]
    const reordered = { ...root, children: [...root.children].reverse() }
    expect(root.children.length).toBeGreaterThan(1)
    expect(isDeepStrictEqual(reordered, root)).toBe(false)
    for (const property of ['position', 'fills'] as const) {
      const id = root.props[property]
      expect(id).toBeDefined()
      const value = created.props[id]
      expect(value).toBeDefined()
      // Keep every other record identical while corrupting geometry/material.
      expect(
        isDeepStrictEqual({ ...created.props, [id]: null }, created.props)
      ).toBe(false)
    }
    const propertyId = Object.keys(created.props)[0]
    const omitted = Object.fromEntries(
      Object.entries(created.props).filter(([id]) => id !== propertyId)
    )
    expect(isDeepStrictEqual(omitted, created.props)).toBe(false)
    recordPhase('geometry-and-receipts')
    expect(factory.getUndoHistoryDepth()).toBe(1)
    factory.undo()
    deepStrictEqual((await core.save()).sceneTree, initial.sceneTree)
    factory.redo()
    const restored = await core.save()
    deepStrictEqual(restored.props, created.props)
    deepStrictEqual(restored.sceneTree, created.sceneTree)
    recordPhase('undo-redo')
    core.load(created)
    const reloaded = await core.save()
    deepStrictEqual(reloaded.props, created.props)
    deepStrictEqual(reloaded.sceneTree, created.sceneTree)
    expect(core.getUIProperty('flattenedElementIds')).toEqual(expectedIds)
    deepStrictEqual(uiSnapshots, savedSnapshots)
    recordPhase('reload')
    const recoveryDesigns = createLocalDesignTools(definitions)
    const recoveryOperations = createLocalOperationTools(
      definitions,
      recoveryDesigns,
      dispatch
    )
    const workflow = createLocalDesignWorkflow(
      recoveryDesigns,
      recoveryOperations
    )
    const signal = new AbortController().signal
    const rejected = JSON.parse(
      await workflow.call(
        AiDesignToolIds.PREPARE_AND_APPLY_DESIGN,
        {
          draft: {
            type: 'group',
            name: 'Additional fin',
            projection: nonplanar.projection,
            children: [nonplanar.face]
          },
          inspection: 'defer'
        },
        signal
      )
    )
    expect(rejected.settlement).toBe('not-started')
    expect(dispatch).toHaveBeenCalledTimes(1)
    deepStrictEqual(await core.save(), reloaded)
    recordPhase('rejected-recovery')
    const request = { ...rejected.repairGuide.arguments, inspection: 'defer' }
    request.repair.replacements[0].value = nonplanar.replacement
    const repaired = JSON.parse(
      await workflow.call(
        AiDesignToolIds.PREPARE_AND_APPLY_DESIGN,
        request,
        signal
      )
    )
    recordPhase('repair-dispatch')
    expect(repaired.failedStep).toBeUndefined()
    expect(dispatch).toHaveBeenCalledTimes(2)
    const withFin = await core.save()
    for (const id of expectedIds) {
      deepStrictEqual(
        withFin.sceneTree.elements[id],
        reloaded.sceneTree.elements[id]
      )
    }
    for (const [id, value] of Object.entries(reloaded.props)) {
      deepStrictEqual(withFin.props[id], value)
    }
    factory.undo()
    deepStrictEqual(await core.save(), reloaded)
    factory.redo()
    deepStrictEqual(await core.save(), withFin)
    core.load(withFin)
    deepStrictEqual(await core.save(), withFin)
    recordPhase('repaired-history-and-reload')
  } finally {
    uiSubscription?.unsubscribe()
    await runtime.dispose()
    vi.unstubAllGlobals()
  }
}, 30000)

const vectorDeliveryFixture = JSON.parse(
  readFileSync(
    new URL(
      './fixtures/recorded-101/vector-delivery-20261025.json',
      import.meta.url
    ),
    'utf8'
  )
) as {
  cases: {
    name: string
    source: { identity: string; inputBytes: number; canonicalSha256: string }
    input: { draft: unknown }
  }[]
}
const canonicalValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(canonicalValue)
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [
          key,
          canonicalValue((value as Record<string, unknown>)[key])
        ])
    )
  }
  return value
}

// Historical wire baseline exists only in this cost/equality oracle. Production
// accepts the single current version; it never executes this projection.
const capturedVectorBaseline = (design: PreparedDesign) => {
  const { keyToId: _keyToId, entries, ...rest } = design
  return {
    ...rest,
    version: 2,
    entries: entries.map((entry) => ({
      ...entry,
      descriptor: {
        ...entry.descriptor,
        props: Object.keys(entry.descriptor.props)
      }
    }))
  }
}
const admitCapturedVectorBaseline = (
  input: ReturnType<typeof capturedVectorBaseline>
) =>
  admitPreparedDesign({
    ...input,
    version: 1,
    keyToId: Object.fromEntries(
      input.entries.map((entry) => [entry.key, entry.descriptor.id])
    ),
    entries: input.entries.map((entry) => ({
      ...entry,
      descriptor: {
        ...entry.descriptor,
        props: Object.fromEntries(
          entry.descriptor.props.map((name) => [
            name,
            `${entry.descriptor.id}-${name}`
          ])
        )
      }
    }))
  })
const measureVectorDelivery = <T>(
  project: () => T,
  admit: (wire: T) => unknown
) => {
  const rows: {
    packMs: number
    encodeMs: number
    parseMs: number
    restoreAndAdmissionMs: number
  }[] = []
  for (let iteration = 0; iteration < 4; iteration++) {
    const start = performance.now()
    const projected = project()
    const packed = performance.now()
    const encoded = JSON.stringify(projected)
    const serialized = performance.now()
    const parsed = JSON.parse(encoded)
    const decoded = performance.now()
    admit(parsed)
    const end = performance.now()
    if (iteration) {
      rows.push({
        packMs: packed - start,
        encodeMs: serialized - packed,
        parseMs: decoded - serialized,
        restoreAndAdmissionMs: end - decoded
      })
    }
  }
  return Object.fromEntries(
    Object.keys(rows[0]).map((key) => [
      key,
      rows.map((row) => row[key as keyof typeof row]).sort((a, b) => a - b)[1]
    ])
  )
}

describe.each(vectorDeliveryFixture.cases)(
  'recorded vector delivery - $name',
  (saved) => {
    let compile: ReturnType<typeof vi.fn<typeof prepareDesignAsync>>
    let owner: ReturnType<typeof createLocalDesignTools>
    let source: PreparedDesign
    let receipt: { artifactId: string }
    beforeAll(async () => {
      compile = vi.fn<typeof prepareDesignAsync>(
        (signal, input, _identity, ...rest) =>
          prepareDesignAsync(signal, input, saved.source.identity, ...rest)
      )
      const session = createDesignPreparationSession(prepareDesign, compile)
      owner = createLocalDesignTools(actions, session)
      receipt = JSON.parse(
        await owner.call(
          'prepare_design',
          { draft: saved.input.draft },
          new AbortController().signal
        )
      )
      source = session.resolve(receipt.artifactId)
    }, 5000)
    it('omits repeated vector IDs without changing canonical values or compile work', () => {
      expect(
        createHash('sha256')
          .update(JSON.stringify(canonicalValue(source)))
          .digest('hex')
      ).toBe(saved.source.canonicalSha256)
      const batch = {
        batchId: 'apply',
        actions: [
          {
            id: 'apply',
            name: AiActionNames.APPLY_PREPARED_DESIGN,
            arguments: { artifactId: receipt.artifactId },
            summary: 'Apply retained vectors'
          }
        ]
      }
      const delivered = owner.resolveBatch(batch).actions[0].arguments as {
        design: PreparedDesignDelivery
      }
      const encoded = JSON.stringify(delivered)
      expect(admitPreparedDesignDelivery(JSON.parse(encoded).design)).toEqual(
        JSON.parse(JSON.stringify(source))
      )
      expect(compile).toHaveBeenCalledTimes(1)
      expect(Buffer.byteLength(encoded)).toBeLessThanOrEqual(
        saved.source.inputBytes * 0.86
      )
      const baseline = { ...delivered, design: capturedVectorBaseline(source) }
      expect(Buffer.byteLength(JSON.stringify(baseline))).toBe(
        saved.source.inputBytes
      )
      expect(admitCapturedVectorBaseline(baseline.design)).toEqual(
        JSON.parse(JSON.stringify(source))
      )
    })
    it.each(['baseline', 'compact'] as const)(
      'measures unchanged pack, encode, parse and admission work - %s',
      (representation) => {
        const measurements =
          representation === 'baseline'
            ? measureVectorDelivery(
                () => capturedVectorBaseline(source),
                admitCapturedVectorBaseline
              )
            : measureVectorDelivery(
                () => deliverPreparedDesign(source),
                admitPreparedDesignDelivery
              )
        expect(compile).toHaveBeenCalledTimes(1)
        console.info(
          JSON.stringify({
            measurement: 'vector-delivery',
            case: saved.name,
            representation,
            ...measurements
          })
        )
      }
    )
  }
)

it.each(['points', 'segments', 'networks'])(
  'rejects conflicting %s identities before projection can conceal them',
  (field) => {
    const { sharedFillIds: _shared, ...source } = structuredClone(
      prepareDesign(mixedDraft, 'conflict')
    )
    const vector = source.entries.find((e) => e.descriptor.type === 'vector')
    if (!vector) {
      throw new Error('Missing vector fixture')
    }
    const records = vector.descriptor[field] as Record<string, { id: string }>
    Object.values(records)[0].id = 'foreign-identity'
    expect(() => deliverPreparedDesign(source)).toThrow(/identity/)
  }
)

it('visits each vector identity map once per projection and restoration without recompilation', () => {
  const { sharedFillIds: _shared, ...source } = structuredClone(
    prepareDesign(mixedDraft, 'visits')
  )
  const vector = source.entries.find(
    (entry) => entry.descriptor.type === 'vector'
  )
  if (!vector) {
    throw new Error('Missing vector fixture')
  }
  const projectVisits = vi.fn(Reflect.ownKeys)
  for (const field of ['points', 'segments', 'networks']) {
    vector.descriptor[field] = new Proxy(vector.descriptor[field] as object, {
      ownKeys: projectVisits
    })
  }
  const wire = deliverPreparedDesign(source)
  expect(projectVisits).toHaveBeenCalledTimes(3)
  const delivered = wire.entries.find(
    (entry) => entry.descriptor.type === 'vector'
  )
  if (!delivered) {
    throw new Error('Missing vector delivery')
  }
  const restoreVisits = vi.fn(Reflect.ownKeys)
  for (const field of ['points', 'segments', 'networks']) {
    delivered.descriptor[field] = new Proxy(
      delivered.descriptor[field] as object,
      { ownKeys: restoreVisits }
    )
  }
  admitPreparedDesignDelivery(wire)
  expect(restoreVisits).toHaveBeenCalledTimes(3)
  expect(projectVisits).toHaveBeenCalledTimes(3)
})
