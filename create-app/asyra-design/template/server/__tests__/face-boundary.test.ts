import { readCompleteInformation } from './tool-contract-assertions'
import { completeUsageBudget } from './tool-contract-assertions'
import { recordAcquisitionCost } from './tool-contract-assertions'
import collision from './fixtures/recorded-101/boundary-identity-20261026.json'
import { expect, it, vi } from 'vitest'
import fixture from './fixtures/recorded-101/face-boundary-20261025.json'
import { constructDesign } from '../design-construction'
import { resolveSurfaceBoundaries } from '../design-face'
import {
  prepareDesign,
  prepareDesignAsync,
  createDesignPreparationSession
} from '../design-preparation'
import {
  measureDesignBudget,
  partitionDesignBudget,
  selectDesignSource
} from '../design-budget'
import { createDesignDraftRepairStore } from '../design-draft-repair'
import { createLocalDesignTools } from '../local-design-tools'
import { createLocalOperationTools } from '../local-operation-tools'
import { createLocalDesignWorkflow } from '../local-design-workflow'
import { invokeLocalTool } from '../local-tool-invocation'
import { admitPreparedDesignDelivery } from '../../src/ai/prepared-design-admission'
import { AiActionNames } from '../../src/constants/ai-actions'

const compact = (index: number) => {
  const input = structuredClone(fixture.inputs[index])
  for (const [path, face] of fixture.pairs[index]) {
    const keys = path as (string | number)[]
    let owner = input.draft as unknown as Record<PropertyKey, unknown>
    for (const key of keys.slice(0, -1))
      owner = owner[key] as Record<PropertyKey, unknown>
    owner[keys[keys.length - 1]] = { face }
  }
  return input
}
const generic = (order = 'cell-major') => {
  const grid = {
    type: 'surface-grid',
    key: 'grid',
    name: 'Markers',
    boundary: { face: 'panel' },
    rows: 2,
    columns: 3,
    order,
    motifs: [
      {
        key: 'mark',
        name: 'Marker',
        fill: '#123456',
        fills: ['#123456', '#abcdef'],
        offset: { x: 0, y: 0.1, z: 0 },
        vertices: [
          { u: 0, v: 0 },
          { u: 0.2, v: 0 },
          { u: 0.2, v: 1 },
          { u: 0, v: 1 }
        ]
      }
    ]
  }
  const face = {
    type: 'projected-face',
    key: 'panel',
    name: 'Panel',
    fill: '#987654',
    vertices: [
      { x: 0, y: 0, z: 0 },
      { x: 12, y: 0, z: 0 },
      { x: 10, y: 0, z: 20 },
      { x: 2, y: 0, z: 20 }
    ]
  }
  return {
    type: 'group',
    key: 'root',
    name: 'Panel assembly',
    projection: {
      azimuth: 30,
      elevation: 25,
      scale: 1,
      originX: 0,
      originY: 0
    },
    children: [grid, face] as [typeof grid, typeof face]
  }
}
const inline = (source: unknown) => {
  const result = structuredClone(source) as {
    children: Record<string, unknown>[]
  }
  const scope = (members: Record<string, unknown>[]) => {
    for (const child of members) {
      if (child.type === 'surface-grid' && !Array.isArray(child.boundary)) {
        const reference = child.boundary as { face: string }
        child.boundary = members.find((n) => n.key === reference.face)?.vertices
      }
      if (child.type === 'pattern')
        scope(child.members as Record<string, unknown>[])
    }
  }
  scope(result.children)
  return result
}

it('preserves the six recorded face boundaries and every prepared object', () => {
  for (let i = 0; i < fixture.inputs.length; i++) {
    const source = compact(i).draft
    expect(prepareDesign(source, 'same')).toEqual(
      prepareDesign(fixture.inputs[i].draft, 'same')
    )
    expect(measureDesignBudget(source)).toEqual(
      measureDesignBudget(fixture.inputs[i].draft)
    )
  }
})
it.each(['cell-major', 'motif-major'])(
  'preserves forward references and %s root and pattern order',
  (order) => {
    const source = generic(order)
    const before = structuredClone(source)
    expect(prepareDesign(source, 'same')).toEqual(
      prepareDesign(inline(source), 'same')
    )
    const repeated = {
      ...source,
      children: [
        {
          type: 'pattern',
          key: 'repeat',
          name: 'Repeated panels',
          origin: { x: 1, y: 2, z: 3 },
          axes: [{ count: 3, step: { x: 20, y: 0, z: 0 } }],
          members: source.children
        }
      ]
    }
    expect(prepareDesign(repeated, 'same')).toEqual(
      prepareDesign(inline(repeated), 'same')
    )
    expect(repeated.children[0].members).toEqual(before.children)
  }
)
it.each([
  [
    'missing',
    (s: ReturnType<typeof generic>) => {
      s.children[0].boundary.face = 'absent'
    }
  ],
  [
    'ambiguous',
    (s: ReturnType<typeof generic>) => {
      s.children.push(structuredClone(s.children[1]))
    }
  ],
  [
    'extra fields',
    (s: ReturnType<typeof generic>) => {
      Object.assign(s.children[0].boundary, {
        vertices: s.children[1].vertices
      })
    }
  ],
  [
    'empty selector',
    (s: ReturnType<typeof generic>) => {
      s.children[0].boundary.face = ''
    }
  ],
  [
    'non-quadrilateral',
    (s: ReturnType<typeof generic>) => {
      s.children[1].vertices.pop()
    }
  ],
  [
    'ellipse',
    (s: ReturnType<typeof generic>) => {
      Object.assign(s.children[1], { ellipse: {} })
      Reflect.deleteProperty(s.children[1], 'vertices')
    }
  ],
  [
    'nonplanar',
    (s: ReturnType<typeof generic>) => {
      s.children[1].vertices[0].y = 3
    }
  ],
  [
    'degenerate',
    (s: ReturnType<typeof generic>) => {
      s.children[1].vertices.fill({ x: 0, y: 0, z: 0 })
    }
  ],
  [
    'nonfinite',
    (s: ReturnType<typeof generic>) => {
      s.children[1].vertices[0].x = Infinity
    }
  ],
  [
    'outer scope',
    (s: ReturnType<typeof generic>) => {
      Object.assign(s.children[0], {
        type: 'pattern',
        key: 'p',
        name: 'P',
        origin: { x: 0, y: 0, z: 0 },
        axes: [{ count: 1, step: { x: 1, y: 0, z: 0 } }],
        members: [{ ...s.children[0] }]
      })
    }
  ]
])('rejects %s without modifying the source', (_name, change) => {
  const source = generic()
  change(source)
  const before = structuredClone(source)
  expect(() => prepareDesign(source)).toThrow()
  expect(source).toEqual(before)
})
it('selects a grid without recreating a face from another retained part and re-resolves repairs', () => {
  const source = generic()
  source.children.reverse()
  const parts = partitionDesignBudget(source, 7).partitions
  expect(parts).toHaveLength(2)
  if (!parts) throw new Error('Missing partition plan')
  expect(parts).toEqual(partitionDesignBudget(inline(source), 7).partitions)
  const selected = selectDesignSource(source, parts[1].selections)
  expect(prepareDesign(selected, 'same')).toEqual(
    prepareDesign(
      selectDesignSource(inline(source), parts[1].selections),
      'same'
    )
  )
  expect(
    (selected as { children: { key: string }[] }).children.map((n) => n.key)
  ).toEqual(['grid'])
  const store = createDesignDraftRepairStore(7)
  const draftId = store.retain(source)
  expect(
    prepareDesign(store.repair({ draftId, partition: 1 }), 'same')
  ).toEqual(prepareDesign(selected, 'same'))
  const repaired = store.repair({
    draftId,
    replacements: [{ path: '/children/0/vertices/0/x', value: 1 }]
  }) as Record<string, unknown>
  expect(prepareDesign(repaired, 'same')).toEqual(
    prepareDesign(inline(repaired), 'same')
  )
  expect(
    prepareDesign(store.repair({ draftId, partition: 1 }), 'same')
  ).toEqual(prepareDesign(selected, 'same'))
  if (!draftId) throw new Error('Missing retained source')
  store.release(draftId)
  expect(() => store.repair({ draftId, partition: 1 })).toThrow(/unavailable/)
})

it('delivers and executes the selected boundary example with lower total bytes and unchanged calls', async () => {
  const actions = [
    {
      name: AiActionNames.APPLY_PREPARED_DESIGN,
      description: 'Apply',
      inputSchema: {}
    },
    {
      name: AiActionNames.INSPECT_DRAWING,
      description: 'Inspect',
      inputSchema: {}
    }
  ]
  const designs = createLocalDesignTools(actions)
  const applied: import('../../src/ai/prepared-design').PreparedDesign[] = []
  const execute = vi.fn(
    async (
      batch: import('../../src/ai/action-batch-protocol').AiActionBatch
    ) => ({
      context: {},
      actionResults: batch.actions.map((a) => {
        const design = admitPreparedDesignDelivery(
          (a.arguments as { design: unknown }).design
        )
        applied.push(design)
        return {
          actionId: a.id,
          actionName: a.name,
          result: {
            status: 'complete',
            appliedElementCount: design.entries.length,
            compositionId: design.entries[0].descriptor.id
          }
        }
      })
    })
  )
  const operations = createLocalOperationTools(actions, designs, execute, {
    getNativeTools: () =>
      main.definitions.map((d) => ({ ...d, namespace: 'design' }))
  })
  const main = createLocalDesignWorkflow(designs, operations)
  const signal = new AbortController().signal
  const pages: number[] = []
  const raw = await readCompleteInformation(async (input) => {
    const text = await operations.call('describe_design_apis', input, signal)
    pages.push(Buffer.byteLength(text))
    return text
  }, fixture.query)
  process.stdout.write(
    JSON.stringify({
      measurement: 'face-boundary-guide',
      bytes: Buffer.byteLength(raw)
    }) + '\n'
  )
  recordAcquisitionCost(fixture.query, raw, pages)
  const tool = JSON.parse(raw).tools[0]
  expect(JSON.stringify(tool.usageGuide.parameters)).toContain('face')
  const example = tool.invocationExample.invocation.arguments
  expect(JSON.stringify(example)).toContain('"boundary":{"face":')
  const definition = main.definitions[0]
  expect(
    JSON.parse(
      (
        await invokeLocalTool(
          main,
          definition,
          { ...example, inspection: 'defer' },
          signal
        )
      ).text
    ).toolOutcome.settlement
  ).toBe('completed')
  let baselineBytes =
    fixture.baseline.guideBytes +
    Buffer.byteLength(JSON.stringify(fixture.query))
  let candidateBytes =
    Buffer.byteLength(raw) + Buffer.byteLength(JSON.stringify(fixture.query))
  for (let i = 0; i < fixture.inputs.length; i++) {
    const baselineInput = { ...fixture.inputs[i], inspection: 'defer' }
    const baselineReply = await invokeLocalTool(
      main,
      definition,
      baselineInput,
      signal
    )
    expect(JSON.parse(baselineReply.text).toolOutcome.settlement).toBe(
      'completed'
    )
    baselineBytes +=
      Buffer.byteLength(JSON.stringify(baselineInput)) +
      Buffer.byteLength(baselineReply.text)
    const input = { ...compact(i), inspection: 'defer' }
    const reply = await invokeLocalTool(main, definition, input, signal)
    candidateBytes +=
      Buffer.byteLength(JSON.stringify(input)) + Buffer.byteLength(reply.text)
    const output = JSON.parse(reply.text)
    expect(output.toolOutcome.settlement).toBe('completed')
    expect(applied.at(-1)?.entries).toEqual(
      prepareDesign(fixture.inputs[i].draft, output.artifactId).entries
    )
  }
  expect(execute).toHaveBeenCalledTimes(7)
  expect(candidateBytes).toBeLessThan(
    completeUsageBudget(baselineBytes, 'draft')
  )
  process.stdout.write(
    JSON.stringify({
      measurement: 'face-boundary-total',
      historicalBytes: baselineBytes,
      equivalentCompleteBudget: completeUsageBudget(baselineBytes, 'draft'),
      candidateBytes,
      callsPerSequence: 4
    }) + '\n'
  )
})

it('indexes a source scope once rather than scanning its faces for each grid', () => {
  const source = generic()
  const target = source.children[1]
  const key = vi.fn(() => 'panel')
  Object.defineProperty(target, 'key', { get: key, enumerable: true })
  Object.assign(source, {
    children: [
      target,
      ...Array.from({ length: 100 }, (_, i) => ({
        ...source.children[0],
        key: `grid-${i}`
      }))
    ]
  })
  const resolved = resolveSurfaceBoundaries(source) as {
    children: Record<string, unknown>[]
  }
  expect(key).toHaveBeenCalledTimes(1)
  expect(
    resolved.children
      .slice(1)
      .every((n: Record<string, unknown>) => n.boundary === target.vertices)
  ).toBe(true)
  expect(constructDesign(resolved).draft).toEqual(constructDesign(source).draft)
})

it('continues only the failed retained part without resending geometry or recreating its face', async () => {
  const actions = [
    {
      name: AiActionNames.APPLY_PREPARED_DESIGN,
      description: 'Apply',
      inputSchema: {}
    },
    {
      name: AiActionNames.REVIEW_DESIGN,
      description: 'Measure',
      inputSchema: {}
    }
  ]
  let preparations = 0
  const session = createDesignPreparationSession(
    undefined,
    async (...args) => {
      if (++preparations === 2)
        throw new Error('Injected preparation interruption')
      return prepareDesignAsync(...args)
    },
    undefined,
    2000
  )
  const designs = createLocalDesignTools(actions, session)
  const applied: string[] = []
  let calls = 0
  const operations = createLocalOperationTools(
    actions,
    designs,
    async (
      batch: import('../../src/ai/action-batch-protocol').AiActionBatch
    ) => ({
      context: {},
      actionResults: batch.actions.map((a) => {
        if (a.name === AiActionNames.REVIEW_DESIGN)
          return {
            actionId: a.id,
            actionName: a.name,
            result: {
              complete: true,
              findings: [],
              measuredTextIds: [],
              evidence: { sessionId: 'test', revision: 1 }
            }
          }
        calls++
        const design = admitPreparedDesignDelivery(
          (a.arguments as { design: unknown }).design
        )
        applied.push(
          ...design.entries
            .slice(design.continuation ? 1 : 0)
            .map((e) => e.descriptor.id)
        )
        return {
          actionId: a.id,
          actionName: a.name,
          result: {
            status: 'complete',
            appliedElementCount: design.entries.length,
            compositionId: design.entries[0].descriptor.id
          }
        }
      })
    })
  )
  const main = createLocalDesignWorkflow(designs, operations)
  const invoke = async (
    input: unknown,
    signal = new AbortController().signal
  ) =>
    JSON.parse(
      (await invokeLocalTool(main, main.definitions[0], input, signal)).text
    )
  const first = await invoke({ ...compact(0), inspection: 'defer' })
  expect(first.toolOutcome.status).toBe('partial')
  const prefix = [...applied]
  expect(first.recoveryInvocation, JSON.stringify(first)).toBeDefined()
  const retry = first.recoveryInvocation.arguments
  expect(JSON.stringify(retry)).not.toContain('vertices')
  expect(JSON.stringify(retry)).not.toContain('boundary')
  await expect(invoke(retry, AbortSignal.abort())).rejects.toThrow()
  expect(applied).toEqual(prefix)
  const result = await invoke(retry)
  expect(result.toolOutcome.settlement).toBe('completed')
  expect(applied.slice(0, prefix.length)).toEqual(prefix)
  expect(new Set(applied).size).toBe(applied.length)
  expect(applied).toHaveLength(2311)
  expect(calls).toBe(2)
  expect(preparations).toBe(3)
})

it('bounds total source traversal across independent pattern scopes before compilation', () => {
  const source = generic()
  const grid = { ...source.children[0], boundary: source.children[1].vertices }
  const members = Array.from({ length: 6000 }, (_, i) => ({
    ...grid,
    key: `g-${i}`
  }))
  const oversized = {
    ...source,
    children: ['a', 'b'].map((key) => ({
      type: 'pattern',
      key,
      name: key,
      origin: { x: 0, y: 0, z: 0 },
      axes: [{ count: 1, step: { x: 1, y: 0, z: 0 } }],
      members
    }))
  }
  expect(() => resolveSurfaceBoundaries(oversized)).toThrow(/source.*limit/i)
})

it('keeps an independent inline boundary unchanged when a nearby face is repaired', () => {
  const source = generic()
  const grid = {
    ...source.children[0],
    boundary: source.children[1].vertices.map((p) => ({ ...p, x: p.x + 2 }))
  }
  const draft = { ...source, children: [grid, source.children[1]] }
  const before = prepareDesign(draft, 'independent')
  const changed = structuredClone(draft)
  const face = changed.children[1] as (typeof source.children)[1]
  face.vertices = face.vertices.map((p) => ({ ...p, x: p.x + 5 }))
  const after = prepareDesign(changed, 'independent')
  const grids = (design: typeof before) =>
    design.entries.filter((e) => e.key.startsWith('grid-'))
  for (const [index, entry] of grids(after).entries()) {
    const previous = grids(before)[index]
    const { x, y, ...descriptor } = entry.descriptor
    const { x: px, y: py, ...previousDescriptor } = previous.descriptor
    expect(descriptor).toEqual(previousDescriptor)
    // Group normalization changes local origins, not world-space geometry.
    expect(x + after.entries[0].descriptor.x).toBeCloseTo(
      px + before.entries[0].descriptor.x,
      12
    )
    expect(y + after.entries[0].descriptor.y).toBeCloseTo(
      py + before.entries[0].descriptor.y,
      12
    )
    expect(entry.parentId).toBe(previous.parentId)
  }
  expect(after.entries.find((e) => e.key === 'panel')).not.toEqual(
    before.entries.find((e) => e.key === 'panel')
  )
  expect(resolveSurfaceBoundaries(draft)).toBe(draft)
})

it('recovers recorded ambiguous face keys through returned field repair without resending geometry', async () => {
  const applied: import('../../src/ai/prepared-design').PreparedDesign[] = []
  const actions = [
    AiActionNames.APPLY_PREPARED_DESIGN,
    AiActionNames.INSPECT_DRAWING
  ].map((name) => ({ name, description: name, inputSchema: {} }))
  const designs = createLocalDesignTools(actions)
  const execute = vi.fn(
    async (
      batch: import('../../src/ai/action-batch-protocol').AiActionBatch
    ) => ({
      context: {},
      actionResults: batch.actions.map((a) => {
        const design = admitPreparedDesignDelivery(
          (a.arguments as { design: unknown }).design
        )
        applied.push(design)
        return {
          actionId: a.id,
          actionName: a.name,
          result: {
            status: 'complete',
            appliedElementCount: design.entries.length,
            compositionId: design.entries[0].descriptor.id
          }
        }
      })
    })
  )
  const operations = createLocalOperationTools(actions, designs, execute)
  const main = createLocalDesignWorkflow(designs, operations)
  const signal = new AbortController().signal
  const call = async (input: unknown) =>
    JSON.parse(
      (await invokeLocalTool(main, main.definitions[0], input, signal)).text
    )
  const input = { ...collision.input, inspection: 'defer' }
  const failure = await call(input)
  expect(failure.toolOutcome.settlement).toBe('not-started')
  expect(execute).not.toHaveBeenCalled()
  expect(failure.conflicts, JSON.stringify(failure)).toEqual([
    { key: 'podium-x', paths: ['/children/0/key', '/children/3/key'] },
    { key: 'podium-y', paths: ['/children/1/key', '/children/4/key'] }
  ])
  expect(failure.repairGuide.tool).toBe(main.definitions[0].name)
  expect(failure.repairGuide.arguments.draft).toBeUndefined()
  const repair = failure.repairGuide.arguments
  // Preserve the referenced face key; replace only the colliding grid key.
  repair.repair.replacements = failure.conflicts.map(
    (item: { key: string; paths: string[] }) => ({
      path: item.paths[1],
      value: `${item.key}-grid`
    })
  )
  const result = await call(repair)
  expect(result.toolOutcome.settlement).toBe('completed')
  expect(execute).toHaveBeenCalledTimes(1)
  const expected = structuredClone(collision.input.draft)
  for (const node of expected.children)
    if (
      node.type === 'surface-grid' &&
      ['podium-x', 'podium-y'].includes(node.key)
    )
      node.key += '-grid'
  expect(applied[0].entries).toEqual(
    prepareDesign(expected, result.artifactId).entries
  )
})
