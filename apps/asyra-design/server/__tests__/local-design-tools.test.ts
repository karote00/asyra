import capacityFixture from './fixtures/recorded-101/pattern-budget-recovery-20261023.json'
import {
  nativeToolInputSchema,
  operationInputIssue
} from '../operation-input-schema'
import { inspectDesignBudget } from '../design-budget'
import { invokeLocalTool } from '../local-tool-invocation'
import { designPreparationExamples } from '../design-preparation-examples'
import { describe, expect, it, vi } from 'vitest'
import { admitPreparedDesign } from '../../src/ai/prepared-design-admission'
import { createLocalDesignTools as createOwner } from '../local-design-tools'
import { withToolContractAssertions } from './tool-contract-assertions'
const createLocalDesignTools = (...args: Parameters<typeof createOwner>) =>
  withToolContractAssertions(createOwner(...args))
import {
  createDesignPreparationSession,
  prepareDesign,
  prepareDesignAsync
} from '../design-preparation'
import { createLocalImageTools } from '../local-image-tools'
import { createLocalOperationTools } from '../local-operation-tools'
import { AiActionNames } from '../../src/constants/ai-actions'
import type { PreparedDesign } from '../../src/ai/prepared-design'
import type {
  AiActionBatch,
  AiBatchReceipt
} from '../../src/ai/action-batch-protocol'

const actions = [
  {
    name: AiActionNames.APPLY_PREPARED_DESIGN,
    description: 'Apply design',
    inputSchema: { type: 'object', properties: { design: {} } }
  }
]
const draft = () => ({
  type: 'frame',
  name: 'Mobile journal',
  width: 360,
  height: 640,
  padding: 24,
  layout: 'column',
  gap: 16,
  children: [
    {
      key: 'heading',
      name: 'Heading',
      type: 'text',
      width: 312,
      height: 80,
      text: 'Keep exploring',
      fontSize: 32,
      lineHeight: 40
    }
  ]
})
const signal = () => new AbortController().signal
const request = (artifactId: string) => ({
  batchId: 'apply',
  actions: [
    {
      id: 'a',
      name: AiActionNames.APPLY_PREPARED_DESIGN,
      arguments: { artifactId },
      summary: 'Create journal'
    }
  ]
})

describe('local semantic design tools', () => {
  it('declares composable preparation with exact request reference lifetimes', () => {
    const tools = createLocalDesignTools(actions)
    const prepare = tools.definitions.find(
      (item) => item.name === 'prepare_design'
    )
    const retain = tools.definitions.find(
      (item) => item.name === 'retain_design_targets'
    )
    const release = tools.definitions.find(
      (item) => item.name === 'release_design_artifacts'
    )
    expect(prepare).toMatchObject({
      composition: 'allowed',
      outputSchema: {
        properties: { artifactId: { 'x-runtime-value': 'request-artifact' } }
      }
    })
    expect(retain).toMatchObject({
      composition: 'allowed',
      inputSchema: {
        properties: {
          targets: {
            items: {
              properties: {
                artifactId: { 'x-runtime-value': 'request-artifact' }
              }
            }
          }
        }
      }
    })
    expect(release).toMatchObject({ composition: 'control-plane' })
  })

  it('reports duplicate source paths and repairs retained source without resending it', async () => {
    const tools = createLocalDesignTools(actions)
    const source = {
      ...draft(),
      layout: 'absolute',
      children: ['same', 'same', 'other', 'other'].map((key) => ({
        key,
        type: 'rect',
        name: key,
        width: 10,
        height: 10
      }))
    }
    const rejected = JSON.parse(
      await tools.call('prepare_design', { draft: source }, signal())
    )
    expect(rejected.available).toBe(false)
    expect(rejected.conflicts).toEqual([
      { key: 'same', paths: ['/children/0/key', '/children/1/key'] },
      { key: 'other', paths: ['/children/2/key', '/children/3/key'] }
    ])
    expect(rejected.draftId).toEqual(expect.any(String))
    const repaired = JSON.parse(
      await tools.call(
        'prepare_design',
        {
          repair: {
            draftId: rejected.draftId,
            replacements: [
              { path: '/children/1/key', value: 'same-2' },
              { path: '/children/3/key', value: 'other-2' }
            ]
          }
        },
        signal()
      )
    )
    expect(repaired.available).toBe(true)
    expect(repaired.elementCount).toBe(5)
    expect(
      tools.resolveTargets({
        artifactId: repaired.artifactId,
        keys: ['same', 'same-2']
      })
    ).toHaveLength(2)
    const invalid = JSON.parse(
      await tools.call(
        'prepare_design',
        {
          repair: {
            draftId: rejected.draftId,
            replacements: [{ path: '/children/100/key', value: 'missing' }]
          }
        },
        signal()
      )
    )
    expect(invalid).toMatchObject({
      available: false,
      recovery: 'correct_input'
    })
    expect(source.children[1].key).toBe('same')
  })

  it('accepts a semantic root key without taking over canonical identity ownership', async () => {
    const tools = createLocalDesignTools(actions)
    const source = { ...draft(), key: 'page' }
    const prepared = JSON.parse(
      await tools.call('prepare_design', { draft: source }, signal())
    )
    expect(prepared.available).toBe(true)
    const batch = tools.resolveBatch(request(prepared.artifactId))
    const design = (batch.actions[0].arguments as { design: PreparedDesign })
      .design
    expect(design.keyToId.page).toBe(design.rootId)
    expect(design.rootId).not.toBe('page')
    const invalid = JSON.parse(
      await tools.call(
        'prepare_design',
        {
          draft: {
            ...source,
            children: [{ ...source.children[0], key: 'page' }]
          }
        },
        signal()
      )
    )
    expect(invalid.available).toBe(false)
    expect(invalid.message).toMatch(/duplicate/)
  })
  it('advertises semantic preparation only when editable application exists', () => {
    expect(createLocalDesignTools([]).definitions).toEqual([])
    const tools = createLocalDesignTools(actions)
    expect(tools.definitions.map((t) => t.name)).toEqual([
      'prepare_design',
      'retain_design_targets',
      'release_design_artifacts'
    ])
    const schema = tools.modelActions(actions)[0].inputSchema
    expect(schema).toMatchObject({
      required: ['artifactId'],
      additionalProperties: false
    })
    expect(JSON.stringify(schema)).not.toContain('"design"')
  })
  it('requires an explicit root choice and exposes both container types without promising unsupported features', () => {
    const definition = createLocalDesignTools(actions).definitions[0]
    const schema = definition.inputSchema
    if (!('draft' in schema.properties) || !('$defs' in schema))
      throw new Error('Expected preparation schema')
    expect(schema.properties.draft.required).toContain('type')
    expect(schema.properties.draft.properties.type.enum).toEqual([
      'group',
      'frame'
    ])
    expect(schema.$defs.node.anyOf[0]).toMatchObject({
      properties: {
        type: { enum: ['group', 'frame', 'rect', 'oval', 'text', 'vector'] }
      }
    })
    expect(definition.description).toContain('not live Auto Layout')
  })
  it('returns compact findings and resolves the same immutable artifact without recomputing', async () => {
    const compile = vi.fn(prepareDesignAsync),
      session = createDesignPreparationSession(prepareDesign, compile)
    const tools = createLocalDesignTools(actions, session)
    const reply = await tools.call(
      'prepare_design',
      { draft: draft() },
      signal()
    )
    const receipt = JSON.parse(reply)
    expect(receipt).toMatchObject({ available: true, elementCount: 2 })
    expect(reply).not.toMatch(/descriptor|props|points|fontFamily/)
    const first = tools.resolveBatch(request(receipt.artifactId))
    const second = tools.resolveBatch(request(receipt.artifactId))
    const firstDesign = (
      first.actions[0].arguments as { design: PreparedDesign }
    ).design
    const secondDesign = (
      second.actions[0].arguments as { design: PreparedDesign }
    ).design
    expect(firstDesign).toBe(secondDesign)
    expect(compile).toHaveBeenCalledTimes(1)
    expect(firstDesign.entries[1].descriptor.text).toBe('Keep exploring')
  })
  it('rejects raw descriptors, cross-request artifacts and absent capabilities', async () => {
    const a = createLocalDesignTools(actions),
      b = createLocalDesignTools(actions)
    const receipt = JSON.parse(
      await a.call('prepare_design', { draft: draft() }, signal())
    )
    expect(() => b.resolveBatch(request(receipt.artifactId))).toThrow()
    expect(() =>
      createLocalDesignTools([]).resolveBatch(request(receipt.artifactId))
    ).toThrow()
    const raw = request(receipt.artifactId)
    Object.assign(raw.actions[0].arguments, { design: prepareDesign(draft()) })
    expect(() => a.resolveBatch(raw)).toThrow()
  })
  it('allows a meaningful correction after more than eight attempts', async () => {
    const tools = createLocalDesignTools(actions)
    const bad = JSON.parse(
      await tools.call(
        'prepare_design',
        { draft: { ...draft(), width: -1 } },
        signal()
      )
    )
    expect(bad).toMatchObject({ available: false })
    expect(bad.message).toContain('width')
    expect(
      JSON.parse(
        await tools.call('prepare_design', { draft: draft() }, signal())
      )
    ).toMatchObject({ available: true })
    for (let i = 0; i < 6; i++)
      await tools.call('prepare_design', { draft: {} }, signal())
    expect(
      JSON.parse(
        await tools.call('prepare_design', { draft: draft() }, signal())
      )
    ).toMatchObject({ available: true })
  })
  it('does not prepare after cancellation', async () => {
    const compile = vi.fn(prepareDesignAsync),
      controller = new AbortController()
    controller.abort()
    await expect(
      createLocalDesignTools(
        actions,
        createDesignPreparationSession(prepareDesign, compile)
      ).call('prepare_design', { draft: draft() }, controller.signal)
    ).rejects.toThrow()
    expect(compile).not.toHaveBeenCalled()
  })
  it('resolves dynamic operation references before execution and reviews the returned root', async () => {
    const tools = createLocalDesignTools(actions),
      images = createLocalImageTools({})
    const receipt = JSON.parse(
      await tools.call('prepare_design', { draft: draft() }, signal())
    )
    const execute = vi.fn(
      async (batch: AiActionBatch): Promise<AiBatchReceipt> => ({
        actionResults: [
          {
            actionId: batch.actions[0].id,
            actionName: batch.actions[0].name,
            result: [
              AiActionNames.REVIEW_DESIGN,
              AiActionNames.INSPECT_DRAWING
            ].includes(batch.actions[0].name as never)
              ? {
                  available: true,
                  complete: true,
                  findings: [],
                  evidence: { sessionId: 'semantic-root', revision: 1 }
                }
              : { compositionId: 'actual-root' }
          }
        ],
        context: {}
      })
    )
    const operations = createLocalOperationTools(
      [
        ...actions,
        {
          name: AiActionNames.REVIEW_DESIGN,
          description: 'Measure',
          inputSchema: {}
        },
        {
          name: AiActionNames.INSPECT_DRAWING,
          description: 'Review',
          inputSchema: {}
        }
      ],
      {
        modelActions: (a) => tools.modelActions(images.modelActions(a)),
        resolveBatch: (b) => tools.resolveBatch(images.resolveBatch(b))
      },
      execute
    )
    await operations.call(
      AiActionNames.APPLY_PREPARED_DESIGN,
      {
        arguments: { artifactId: receipt.artifactId },
        message: 'Create journal'
      },
      signal()
    )
    expect(execute).toHaveBeenCalledTimes(3)
    expect(execute.mock.calls[0][0].actions[0].arguments).toMatchObject({
      design: { version: 1, entries: expect.any(Array) }
    })
    expect(execute.mock.calls[1][0].actions[0].name).toBe(
      AiActionNames.REVIEW_DESIGN
    )
    expect(execute.mock.calls[2][0].actions[0].arguments).toEqual({
      elementId: 'actual-root'
    })
  })
})

it('returns brief measurements and blocks an unmet requirement before canvas execution', async () => {
  const tools = createLocalDesignTools(actions)
  const source = {
    ...draft(),
    key: 'journal',
    brief: {
      intent: 'Journal',
      viewpoint: 'Flat',
      sources: [],
      assumptions: [],
      checks: [
        { key: 'journal', property: 'width', expected: 400, tolerance: 0 }
      ]
    }
  }
  const reply = JSON.parse(
    await tools.call('prepare_design', { draft: source }, signal())
  )
  expect(reply).toMatchObject({
    available: true,
    applicable: false,
    review: { checks: [{ actual: 360, expected: 400, passed: false }] }
  })
  expect(() => tools.resolveBatch(request(reply.artifactId))).toThrow(
    /requirements|findings/i
  )
  source.brief.checks[0].expected = 360
  const corrected = JSON.parse(
    await tools.call('prepare_design', { draft: source }, signal())
  )
  expect(corrected.applicable).toBe(true)
  expect(
    tools.resolveBatch(request(corrected.artifactId)).actions
  ).toHaveLength(1)
})

it('advertises structured construction and prevents overflow application', async () => {
  const tools = createLocalDesignTools(actions)
  const schema = JSON.stringify(tools.definitions[0].inputSchema)
  for (const field of [
    'brief',
    'relations',
    'targetAnchor',
    'projection',
    'projected-face',
    'tolerance'
  ])
    expect(schema).toContain(field)
  const receipt = JSON.parse(
    await tools.call(
      'prepare_design',
      { draft: { ...draft(), width: 200 } },
      signal()
    )
  )
  expect(receipt.applicable).toBe(false)
  expect(
    receipt.findings.some((f: { kind: string }) => f.kind === 'overflow')
  ).toBe(true)
  expect(() => tools.resolveBatch(request(receipt.artifactId))).toThrow(
    /findings/
  )
})

it('keeps brief evidence on the server receipt and sends the existing canonical contract', async () => {
  const tools = createLocalDesignTools(actions)
  const receipt = JSON.parse(
    await tools.call(
      'prepare_design',
      {
        draft: {
          ...draft(),
          brief: {
            intent: 'Journal',
            viewpoint: 'Flat',
            sources: [],
            assumptions: [],
            checks: []
          }
        }
      },
      signal()
    )
  )
  const batch = tools.resolveBatch(request(receipt.artifactId))
  const design = (batch.actions[0].arguments as { design: PreparedDesign })
    .design
  expect(() => admitPreparedDesign(design)).not.toThrow()
  expect(design).not.toHaveProperty('review')
  expect(receipt.review.intent).toBe('Journal')
})

it('compiles a ready repeated stage while whole-structure review remains pending', async () => {
  const compile = vi.fn(prepareDesignAsync)
  const tools = createLocalDesignTools(
    actions,
    createDesignPreparationSession(prepareDesign, compile)
  )
  const stage = designPreparationExamples.find((example) =>
    example.draft.children.some((child) => child.type === 'pattern')
  )
  if (!stage) throw new Error('Missing pattern example')
  const result = JSON.parse(await tools.call('prepare_design', stage, signal()))
  expect(result.available).toBe(true)
  expect(result.applicable).toBe(true)
  expect(compile).toHaveBeenCalledOnce()
  const prepared = tools.resolveBatch(request(result.artifactId)).actions[0]
    .arguments as { design: PreparedDesign }
  expect(() => admitPreparedDesign(prepared.design)).not.toThrow()
})

it('releases only explicitly discarded preparation artifacts without affecting retained ones', async () => {
  const session = createDesignPreparationSession()
  const tools = createLocalDesignTools(actions, session)
  const a = session.prepare(draft()),
    b = session.prepare(draft())
  const retained = session.resolve(b.artifactId)
  const result = JSON.parse(
    await tools.call(
      'release_design_artifacts',
      { artifactIds: [a.artifactId] },
      signal()
    )
  )
  expect(result).toEqual({
    releasedArtifactIds: [a.artifactId],
    missingArtifactIds: []
  })
  expect(() => session.resolve(a.artifactId)).toThrow()
  expect(session.resolve(b.artifactId)).toBe(retained)
  expect(
    JSON.parse(
      await tools.call(
        'release_design_artifacts',
        { artifactIds: [a.artifactId] },
        signal()
      )
    )
  ).toEqual({ releasedArtifactIds: [], missingArtifactIds: [a.artifactId] })
  await expect(
    tools.call(
      'release_design_artifacts',
      { artifactIds: [b.artifactId, null] },
      signal()
    )
  ).rejects.toThrow()
  expect(session.resolve(b.artifactId)).toBe(retained)
})

it('resolves prepared keys without canvas reads and never retains references after release', async () => {
  const compile = vi.fn(prepareDesignAsync)
  const session = createDesignPreparationSession(prepareDesign, compile)
  const receipt = await session.prepareAsync(
    draft(),
    new AbortController().signal
  )
  const tools = createLocalDesignTools(actions, session)
  const ref = { artifactId: receipt.artifactId, keys: ['heading'] }
  expect(tools.resolveTargets(ref)).toEqual([
    session.resolve(receipt.artifactId).keyToId.heading
  ])
  expect(() => tools.resolveTargets({ ...ref, keys: ['missing'] })).toThrow()
  expect(
    tools.resolveTargets({ artifactId: receipt.artifactId, keyPrefix: 'head' })
  ).toEqual(tools.resolveTargets(ref))
  const retained = session.resolve(receipt.artifactId)
  const enumerate = vi.spyOn(Object, 'keys')
  try {
    for (let i = 0; i < 10; i++) {
      expect(tools.resolveTargets(ref)).toEqual([retained.keyToId.heading])
      expect(session.resolve(receipt.artifactId)).toBe(retained)
    }
    expect(
      enumerate.mock.calls.filter(([value]) => value === retained.keyToId)
    ).toHaveLength(0)
  } finally {
    enumerate.mockRestore()
  }
  expect(compile).toHaveBeenCalledOnce()
  session.release([receipt.artifactId])
  expect(() => tools.resolveTargets(ref)).toThrow()
  expect(compile).toHaveBeenCalledOnce()
})

it('reports all independent input mistakes with paths before compiling geometry', async () => {
  const compile = vi.fn(prepareDesignAsync)
  const tools = createLocalDesignTools(
    actions,
    createDesignPreparationSession(prepareDesign, compile)
  )
  const result = JSON.parse(
    await tools.call(
      'prepare_design',
      {
        draft: {
          type: 'frame',
          name: 'Artwork',
          width: 500,
          height: 500,
          children: [
            { type: 'vector', key: 'outline' },
            { type: 'rect', key: 'base', name: 'Base', width: -1 }
          ]
        }
      },
      signal()
    )
  )
  expect(result.available).toBe(false)
  for (const path of [
    'children[0].name',
    'children[0].rings',
    'children[1].height',
    'children[1].width'
  ])
    expect(result.message).toContain(path)
  expect(result.recovery).toBe('correct_input')
  expect(compile).not.toHaveBeenCalled()
})

it('identifies missing shared projection as a local input repair, not a reference search', async () => {
  const compile = vi.fn(prepareDesignAsync)
  const tools = createLocalDesignTools(
    actions,
    createDesignPreparationSession(prepareDesign, compile)
  )
  const result = JSON.parse(
    await tools.call(
      'prepare_design',
      {
        draft: {
          type: 'frame',
          name: 'Artwork',
          width: 500,
          height: 500,
          children: [
            {
              type: 'projected-face',
              key: 'face',
              name: 'Face',
              vertices: [
                { x: 0, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 },
                { x: 0, y: 0, z: 1 }
              ]
            }
          ]
        }
      },
      signal()
    )
  )
  expect(result.message).toContain('draft.projection')
  expect(result.recovery).toBe('correct_input')
  expect(compile).not.toHaveBeenCalled()
})

it('reports malformed repeated geometry as input recovery even while structure is pending', async () => {
  const compile = vi.fn(prepareDesignAsync)
  const tools = createLocalDesignTools(
    actions,
    createDesignPreparationSession(prepareDesign, compile)
  )
  const result = JSON.parse(
    await tools.call(
      'prepare_design',
      {
        draft: {
          type: 'frame',
          name: 'Artwork',
          width: 500,
          height: 500,
          children: [{ type: 'pattern' }]
        }
      },
      signal()
    )
  )
  expect(result.recovery).toBe('correct_input')
  expect(result.message).toContain('draft.children[0]')
  expect(compile).not.toHaveBeenCalled()
})

// Reproduces the error classes observed in live run 24, not its private input.
it('reports only the selected construction type when repairing a malformed projected face', async () => {
  const compile = vi.fn(prepareDesignAsync)
  const tools = createLocalDesignTools(
    actions,
    createDesignPreparationSession(prepareDesign, compile)
  )
  const result = JSON.parse(
    await tools.call(
      'prepare_design',
      {
        draft: {
          type: 'group',
          name: 'Visible facade',
          projection: {
            azimuth: 30,
            elevation: 10,
            scale: 1,
            originX: 100,
            originY: 100
          },
          children: [
            {
              type: 'projected-face',
              key: 'glass',
              name: 'Glass',
              vertices: [
                { x: 0, y: 0, z: 0 },
                { x: 10, y: 0, z: 0 },
                { x: 10, y: 0, z: 10 }
              ],
              fill: {
                gradientType: 'linear',
                gradientHandles: [
                  { x: 0, y: 0 },
                  { x: 1, y: 1 }
                ],
                gradientStops: [
                  { position: 0, color: '#123456' },
                  { position: 1, color: '#abcdef' }
                ]
              }
            }
          ]
        }
      },
      signal()
    )
  )
  expect(result.recovery).toBe('correct_input')
  expect(result.message).toContain('gradientStops[0].opacity')
  expect(result.message).toContain('gradientStops[1].opacity')
  expect(result.message).not.toMatch(/width|height|rings|unexpected constant/)
  expect(compile).not.toHaveBeenCalled()
})

it('advertises executable examples that prepare once and preserve their authored detail', async () => {
  for (const example of designPreparationExamples) {
    const compile = vi.fn(prepareDesignAsync)
    const tools = createLocalDesignTools(
      actions,
      createDesignPreparationSession(prepareDesign, compile)
    )
    expect(tools.definitions[0].inputSchema.examples).toContainEqual(example)
    expect(tools.definitions[0].description).not.toContain(
      JSON.stringify(example)
    )
    expect(
      operationInputIssue(
        example,
        nativeToolInputSchema(tools.definitions[0].inputSchema)
      )
    ).toBeUndefined()
    const before = structuredClone(example)
    const receipt = JSON.parse(
      await tools.call('prepare_design', example, signal())
    )
    expect(receipt.available).toBe(true)
    expect(receipt.applicable).toBe(true)
    expect(compile).toHaveBeenCalledTimes(1)
    expect(example).toEqual(before)
    expect(
      tools.resolveTargets({ artifactId: receipt.artifactId })
    ).toHaveLength(receipt.elementCount)
    expect(compile).toHaveBeenCalledTimes(1)
  }
  expect(designPreparationExamples[0].draft).not.toHaveProperty('projection')
})

it('keeps representation examples on their actual geometry and layout owners', async () => {
  const session = createDesignPreparationSession()
  const tools = createLocalDesignTools(actions, session)
  const prepareExample = async (type: string) => {
    const example = designPreparationExamples.find(
      (example) =>
        (type !== 'projected-face' || example.draft.children.length === 1) &&
        example.draft.children.some((child) => child.type === type)
    )
    if (!example) throw new Error(`Missing example for ${type}`)
    const receipt = JSON.parse(
      await tools.call('prepare_design', example, signal())
    )
    return session.resolve(receipt.artifactId)
  }
  const face = await prepareExample('projected-face')
  expect(face.entries[1].descriptor).toMatchObject({
    type: 'vector',
    width: 10,
    height: 20
  })
  const cards = await prepareExample('rect')
  expect(cards.entries.slice(1).map((entry) => entry.descriptor.x)).toEqual([
    0, 50
  ])
  expect(cards.entries.slice(1).map((entry) => entry.descriptor.width)).toEqual(
    [40, 40]
  )
  const curves = await prepareExample('vector-pattern')
  expect(curves.entries.slice(1).map((entry) => entry.descriptor.x)).toEqual([
    0, 20
  ])
  expect(
    curves.entries.slice(1).every((entry) => entry.descriptor.type === 'vector')
  ).toBe(true)
})

it('repairs representative live input failures without research, compilation retries or changed geometry', async () => {
  const valid = designPreparationExamples[0]
  const mutations: { path: string; value?: unknown }[] = [
    { path: 'draft.name' },
    { path: 'draft.brief.checks', value: ['width is 100'] },
    { path: 'draft.brief.checks', value: [{ requirement: 'width is 100' }] },
    { path: 'draft.children.0.fill.gradientStops.0.opacity' },
    { path: 'draft.children.0.rings' }
  ]
  for (const mutation of mutations) {
    const compile = vi.fn(prepareDesignAsync)
    const tools = createLocalDesignTools(
      actions,
      createDesignPreparationSession(prepareDesign, compile)
    )
    const invalid = structuredClone(valid)
    const keys = mutation.path.split('.')
    const field = keys.pop()
    if (!field) throw new Error('Expected test mutation field')
    let owner: unknown = invalid
    for (const key of keys) owner = (owner as Record<string, unknown>)[key]
    if ('value' in mutation)
      (owner as Record<string, unknown>)[field] = mutation.value
    else Reflect.deleteProperty(owner as object, field)
    const failure = JSON.parse(
      await tools.call('prepare_design', invalid, signal())
    )
    expect(failure).toMatchObject({
      available: false,
      recovery: 'correct_input'
    })
    expect(compile).not.toHaveBeenCalled()
    const repaired = JSON.parse(
      await tools.call('prepare_design', valid, signal())
    )
    expect(repaired).toMatchObject({
      available: true,
      applicable: true,
      elementCount: 2
    })
    expect(compile).toHaveBeenCalledExactlyOnceWith(
      expect.any(AbortSignal),
      valid.draft,
      expect.any(String),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function)
    )
  }
})
it('uses retained semantic identities for repeated edits without rebuilding or adding covering layers', async () => {
  const compile = vi.fn(prepareDesignAsync)
  const tools = createLocalDesignTools(
    actions,
    createDesignPreparationSession(prepareDesign, compile)
  )
  const receipt = JSON.parse(
    await tools.call('prepare_design', designPreparationExamples[0], signal())
  )
  const expected = tools.resolveTargets({
    artifactId: receipt.artifactId,
    keys: ['surface']
  })
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result: { elementId: expected[0] }
    }))
  }))
  const operations = createLocalOperationTools(
    [
      {
        name: AiActionNames.UPDATE_DESIGN_ELEMENT,
        description: 'Edit existing geometry',
        inputSchema: {
          type: 'object',
          required: ['elementId', 'properties'],
          properties: {
            elementId: { type: 'string', 'x-design-element-binding': 'each' },
            properties: { type: 'object' }
          }
        }
      }
    ],
    tools,
    execute
  )
  for (const x of [10, 20])
    await operations.call(
      'execute_design_batch',
      {
        inspection: 'defer',
        operations: [
          {
            name: AiActionNames.UPDATE_DESIGN_ELEMENT,
            arguments: { properties: { x } },
            target: {
              artifactId: receipt.artifactId,
              keys: ['surface'],
              field: 'elementId'
            }
          }
        ]
      },
      signal()
    )
  expect(compile).toHaveBeenCalledTimes(1)
  expect(execute).toHaveBeenCalledTimes(2)
  expect(
    execute.mock.calls.flatMap(([batch]) => batch.actions.map((a) => a.name))
  ).toEqual([
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    AiActionNames.UPDATE_DESIGN_ELEMENT
  ])
  for (const [batch] of execute.mock.calls)
    expect(batch.actions[0].arguments).toMatchObject({ elementId: expected[0] })
})

it('defaults application to compact receipts while retaining all prepared identity references', async () => {
  const tools = createLocalDesignTools(actions)
  const prepared = JSON.parse(
    await tools.call('prepare_design', { draft: draft() }, signal())
  )
  const compact = tools.resolveBatch(request(prepared.artifactId))
  expect(compact.actions[0].arguments).toMatchObject({ response: 'compact' })
  const fullRequest = request(prepared.artifactId)
  Object.assign(fullRequest.actions[0].arguments, { response: 'full' })
  const full = tools.resolveBatch(fullRequest)
  expect(full.actions[0].arguments).toMatchObject({ response: 'full' })
  const design = (compact.actions[0].arguments as { design: PreparedDesign })
    .design
  expect(tools.resolveTargets({ artifactId: prepared.artifactId })).toEqual(
    Object.values(design.keyToId)
  )
})

it.each([false, true])(
  'compiles a ready vector repetition batch without waiting for global structure, nested=%s',
  async (nested) => {
    const compile = vi.fn(prepareDesignAsync)
    const tools = createLocalDesignTools(
      actions,
      createDesignPreparationSession(prepareDesign, compile)
    )
    const example = designPreparationExamples.find((item) =>
      item.draft.children.some((child) => child.type === 'vector-pattern')
    )
    if (!example || !('sharedFills' in example.draft))
      throw new Error('Missing shared-fill vector pattern example')
    const child = example.draft.children[0]
    const input = {
      draft: {
        type: 'group',
        name: 'Curve motif',
        sharedFills: example.draft.sharedFills,
        children: nested
          ? [
              {
                type: 'group',
                key: 'nested',
                name: 'Nested',
                children: [child]
              }
            ]
          : [child]
      }
    }
    expect(
      JSON.parse(await tools.call('prepare_design', input, signal()))
    ).toMatchObject({ available: true, applicable: true })
    expect(compile).toHaveBeenCalledOnce()
  }
)

it('admits signed cubic controls when the measured curve stays inside its declared bounds', async () => {
  const tools = createLocalDesignTools(actions)
  const input = {
    draft: {
      type: 'group',
      name: 'Curve',
      children: [
        {
          key: 'ornament',
          name: 'Ornament',
          type: 'vector',
          width: 100,
          height: 100,
          rings: [
            [
              { x: 20, y: 20, outControl: { x: -5, y: 40 } },
              { x: 80, y: 80, inControl: { x: 50, y: 60 } },
              { x: 80, y: 20 }
            ]
          ]
        }
      ]
    }
  }
  const result = JSON.parse(
    (await invokeLocalTool(tools, tools.definitions[0], input, signal())).text
  )
  expect(result).toMatchObject({ available: true, elementCount: 2 })
  const outside = structuredClone(input)
  outside.draft.children[0].rings[0][0].outControl = { x: -500, y: 40 }
  const rejected = JSON.parse(
    (await invokeLocalTool(tools, tools.definitions[0], outside, signal())).text
  )
  expect(rejected.available).toBe(false)
  expect(rejected.message).toContain('bounds')
})

it('prepares large source input through bounded work windows without changing hierarchy or IDs', async () => {
  const compile = vi.fn(prepareDesignAsync)
  const session = createDesignPreparationSession(prepareDesign, compile)
  const tools = createLocalDesignTools(actions, session)
  const source = {
    type: 'frame',
    name: 'many parts',
    key: 'page',
    width: 5000,
    height: 10,
    layout: 'row',
    gap: 1,
    children: Array.from({ length: 1172 }, (_, i) => ({
      key: `part-${i}`,
      name: 'part',
      type: 'rect',
      width: 1,
      height: 1
    }))
  }
  const result = await invokeLocalTool(
    tools,
    tools.definitions[0],
    { draft: source },
    signal()
  )
  const prepared = JSON.parse(result.text)
  expect(prepared.available).toBe(true)
  expect(prepared.sourceWork).toMatchObject({
    batches: 2,
    nodes: 1173,
    largestBatchNodes: 1000
  })
  expect(compile).toHaveBeenCalledOnce()
  const artifact = session.resolve(prepared.artifactId)
  expect(artifact.entries).toHaveLength(1173)
  expect(artifact.entries.map((entry) => entry.key)).toEqual([
    'page',
    ...source.children.map((child) => child.key)
  ])
  expect(artifact.entries[1001].descriptor.x).toBe(2000)
  expect(
    artifact.entries.every(
      (entry, index) => index === 0 || entry.parentId === artifact.rootId
    )
  ).toBe(true)
  expect(admitPreparedDesign(artifact).entries).toHaveLength(1173)
  expect(source.children[0]).not.toHaveProperty('x')
})

it('retains expanded geometry ceilings before compiling and rejects indivisible source geometry', async () => {
  const compile = vi.fn(prepareDesignAsync)
  const tools = createLocalDesignTools(
    actions,
    createDesignPreparationSession(prepareDesign, compile)
  )
  const source = {
    type: 'group',
    name: 'too many',
    children: Array.from({ length: 10000 }, (_, i) => ({
      key: `part-${i}`,
      name: 'part',
      type: 'rect',
      width: 1,
      height: 1
    }))
  }
  const result = JSON.parse(
    await tools.call('prepare_design', { draft: source }, signal())
  )
  expect(result).toMatchObject({
    available: false,
    code: 'DESIGN_BUDGET_EXCEEDED'
  })
  expect(result.message).toContain('sourceNodes=10001 > 10000')
  expect(compile).not.toHaveBeenCalled()
  const primitive = {
    type: 'group',
    name: 'large primitive',
    children: [
      {
        type: 'vector',
        key: 'path',
        name: 'path',
        width: 1,
        height: 1,
        rings: [Array(20001).fill({ x: 0, y: 0 })]
      }
    ]
  }
  expect(inspectDesignBudget(primitive)).toMatchObject({
    code: 'DESIGN_BUDGET_EXCEEDED'
  })
})

it('counts pattern expansion and source points without generating or measuring geometry', () => {
  const anchor = { x: 0, y: 0 }
  const draft = {
    type: 'group',
    name: 'patterns',
    children: [
      {
        type: 'vector-pattern',
        key: 'repeated',
        name: 'repeated',
        template: { width: 1, height: 1, rings: [Array(21).fill(anchor)] },
        placements: Array(10000).fill({ x: 0, y: 0 })
      }
    ]
  }
  const result = inspectDesignBudget(draft)
  expect(result?.budget.observed).toEqual({
    sourceNodes: 2,
    expandedNodes: 10001,
    sourcePathCommands: 21,
    sourcePrimitivePathCommands: 21,
    expandedPathCommands: 210000,
    depth: 2
  })
  expect(result?.message).toContain('expandedNodes=10001 > 10000')
  expect(result?.message).toContain('expandedPathCommands=210000 > 200000')
  expect(draft.children[0].template.rings[0][0]).toBe(anchor)
  draft.children[0].placements.length = 10
  expect(inspectDesignBudget(draft)).toBeUndefined()
})

it('uses the same vector discriminator in reusable templates without changing expanded geometry', async () => {
  const compile = vi.fn(prepareDesignAsync)
  const tools = createLocalDesignTools(
    actions,
    createDesignPreparationSession(prepareDesign, compile)
  )
  const template = {
    type: 'vector',
    width: 1,
    height: 1,
    rings: [
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 }
      ]
    ]
  }
  const children = Array.from({ length: 224 }, (_, i) => ({
    type: 'vector-pattern',
    key: `motif-${i}`,
    name: 'Detail',
    template,
    placements: [
      { x: i * 2, y: 0 },
      { x: i * 2, y: 2 }
    ]
  }))
  const source = { draft: { type: 'group', name: 'Repeated detail', children } }
  const definition = tools.definitions.find(
    (item) => item.name === 'prepare_design'
  )
  if (!definition) throw new Error('Missing preparation definition')
  const result = await invokeLocalTool(tools, definition, source, signal())
  const receipt = JSON.parse(result.text)
  expect(receipt).toMatchObject({ available: true, elementCount: 449 })
  expect(compile).toHaveBeenCalledOnce()
  const explicit = tools.resolveBatch(request(receipt.artifactId))
  const design = (explicit.actions[0].arguments as { design: PreparedDesign })
    .design
  expect(
    design.entries.filter((entry) => entry.descriptor.type === 'vector')
  ).toHaveLength(448)
  expect(template.type).toBe('vector')
  for (const type of ['oval', 'group']) {
    const invalid = await invokeLocalTool(
      tools,
      definition,
      {
        draft: {
          type: 'group',
          name: 'Invalid',
          children: [{ ...children[0], template: { ...template, type } }]
        }
      },
      signal()
    )
    expect(invalid.success).toBe(false)
  }
  expect(compile).toHaveBeenCalledOnce()
})

it('admits shared definitions through the advertised preparation contract', async () => {
  const tools = createLocalDesignTools([
    {
      name: AiActionNames.APPLY_PREPARED_DESIGN,
      description: 'Apply',
      inputSchema: {}
    }
  ])
  const input = {
    draft: {
      type: 'group',
      name: 'Shared',
      sharedFills: { red: '#ff0000' },
      children: [
        {
          key: 'a',
          type: 'rect',
          name: 'A',
          width: 10,
          height: 10,
          fill: { shared: 'red' }
        },
        {
          key: 'b',
          type: 'oval',
          name: 'B',
          x: 12,
          width: 10,
          height: 10,
          fill: { shared: 'red' }
        }
      ]
    }
  }
  expect(
    operationInputIssue(input, tools.definitions[0].inputSchema)
  ).toBeUndefined()
  const receipt = JSON.parse(
    await tools.call('prepare_design', input, new AbortController().signal)
  )
  expect(receipt).toMatchObject({
    available: true,
    applicable: true,
    sharedFillIds: { red: expect.any(String) }
  })
})

it('admits a declarative surface grid through native and public schemas without expanding its input', async () => {
  const tools = createLocalDesignTools(actions)
  const definition = tools.definitions.find(
    (tool) => tool.name === 'prepare_design'
  )
  if (!definition) throw new Error('Preparation tool is not registered')
  const input = {
    draft: {
      type: 'group',
      name: 'Grid',
      projection: {
        azimuth: 25,
        elevation: 30,
        scale: 1,
        originX: 0,
        originY: 0
      },
      children: [
        {
          type: 'surface-grid',
          key: 'facade',
          name: 'Facade',
          rows: 50,
          columns: 60,
          order: 'cell-major',
          boundary: [
            { x: -100, y: 0, z: 0 },
            { x: 100, y: 0, z: 0 },
            { x: 80, y: 0, z: 300 },
            { x: -80, y: 0, z: 300 }
          ],
          motifs: [
            {
              key: 'pane',
              name: 'Pane',
              fill: '#224466',
              fills: ['#123456', '#654321'],
              offset: { x: 0, y: 2, z: 0 },
              vertices: [
                { u: 0.1, v: 0.1 },
                { u: 0.9, v: 0.1 },
                { u: 0.9, v: 0.9 },
                { u: 0.1, v: 0.9 }
              ]
            }
          ]
        }
      ]
    }
  }
  expect(
    operationInputIssue(input, nativeToolInputSchema(definition.inputSchema))
  ).toBeUndefined()
  const result = await invokeLocalTool(
    tools,
    definition,
    input,
    new AbortController().signal
  )
  expect(result.success).toBe(true)
  expect(JSON.parse(result.text)).toMatchObject({
    elementCount: 3001,
    sourceWork: {
      projectionCalls: 6,
      pathCommands: 8,
      expansionWork: { nodes: 3001, batches: 4 }
    }
  })
  const over = structuredClone(input)
  over.draft.children[0].rows = 1000
  const rejected = await invokeLocalTool(
    tools,
    definition,
    over,
    new AbortController().signal
  )
  expect(JSON.parse(rejected.text)).toMatchObject({
    available: false,
    code: 'DESIGN_BUDGET_EXCEEDED'
  })
  for (const issue of ['nonplanar', 'crossed', 'degenerate', 'uv'] as const) {
    const invalid = structuredClone(input)
    const grid = invalid.draft.children[0]
    if (issue === 'nonplanar') grid.boundary[2].y = 10
    if (issue === 'crossed')
      [grid.boundary[1], grid.boundary[2]] = [
        grid.boundary[2],
        grid.boundary[1]
      ]
    if (issue === 'degenerate') grid.boundary[1] = { ...grid.boundary[0] }
    if (issue === 'uv') grid.motifs[0].vertices[0].u = -0.1
    const response = await invokeLocalTool(
      tools,
      definition,
      invalid,
      new AbortController().signal
    )
    expect(response.success, issue).toBe(false)
    expect(JSON.parse(response.text), issue).not.toHaveProperty('artifactId')
  }
})

it('retains a large exact target subset once and reuses opaque handles in source order', async () => {
  const keys = Array.from({ length: 17004 }, (_, index) => `window-${index}`)
  const keyToId = Object.fromEntries(keys.map((key) => [key, `id-${key}`]))
  const compile = () => ({ ...prepareDesign(draft()), keyToId })
  const session = createDesignPreparationSession(compile)
  const artifact = session.prepare({})
  const tools = createLocalDesignTools(actions, session)
  const retained = JSON.parse(
    await tools.call(
      'retain_design_targets',
      { targets: [{ artifactId: artifact.artifactId, keys }] },
      signal()
    )
  )
  expect(retained.targets[0].count).toBe(17004)
  const reference = {
    artifactId: artifact.artifactId,
    targetSetId: retained.targets[0].targetSetId
  }
  expect(JSON.stringify(reference).length).toBeLessThan(200)
  for (let i = 0; i < 3; i++)
    expect(tools.resolveTargets(reference)).toEqual(
      keys.map((key) => keyToId[key])
    )
  tools.resolveTargets(reference).pop()
  expect(tools.resolveTargets(reference)).toHaveLength(17004)
  expect(() =>
    tools.resolveTargets({ ...reference, keys: [keys[0]] })
  ).toThrow()
  session.release([artifact.artifactId])
  expect(() => tools.resolveTargets(reference)).toThrow()
})

it('blocks a contradicted reviewed artifact through both native and batch apply routes without writes', async () => {
  const registered = [
    ...actions,
    ...[
      AiActionNames.READ_DESIGN_ATTACHMENT,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    {
      name: AiActionNames.INSPECT_DRAWING,
      description: 'Inspect',
      inputSchema: { type: 'object' }
    }
  ]
  const session = createDesignPreparationSession()
  const tools = createLocalDesignTools(registered, session)
  const input = draft()
  const prepared = session.prepare({
    ...input,
    brief: {
      intent: 'Exact width',
      viewpoint: 'Front',
      sources: ['User'],
      assumptions: [],
      checks: [
        { key: 'heading', property: 'width', expected: 999, tolerance: 0 }
      ]
    }
  })
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    batchId: batch.batchId,
    context: {},
    actionResults: batch.actions.map(
      (action): AiBatchReceipt['actionResults'][number] => ({
        actionId: action.id,
        actionName: action.name,
        result:
          action.name === AiActionNames.READ_DESIGN_ATTACHMENT
            ? {
                available: true,
                parentId: 'workspace',
                workspaceId: 'workspace',
                evidence: { sessionId: 'scene', revision: 0 },
                basis: [
                  { x: 0, y: 0 },
                  { x: 1, y: 0 },
                  { x: 0, y: 1 }
                ]
              }
            : {
                current: true,
                validatedAt: { sessionId: 'consumer-validation', revision: 1 }
              }
      })
    )
  }))
  const operations = createLocalOperationTools(registered, tools, execute)
  const signal = new AbortController().signal
  await operations.call(
    'define_design_criteria',
    {
      method: 'Create the requested journal',
      detailRequired: false,
      references: [],
      criteria: {
        subject: {
          requirement: 'Only a journal title',
          description: 'Only a journal title',
          verification: 'visual',
          requiredUnits: []
        }
      }
    },
    signal
  )
  const reviewed = JSON.parse(
    await operations.call(
      'review_prepared_design',
      { artifactId: prepared.artifactId },
      signal
    )
  )
  expect(reviewed).toMatchObject({ status: 'fail', appearance: 'unverified' })
  await expect(
    operations.call(
      AiActionNames.APPLY_PREPARED_DESIGN,
      { arguments: { artifactId: prepared.artifactId }, inspection: 'defer' },
      signal
    )
  ).rejects.toThrow(/correction/i)
  await expect(
    operations.call(
      'execute_design_batch',
      {
        operations: [
          {
            name: AiActionNames.APPLY_PREPARED_DESIGN,
            arguments: { artifactId: prepared.artifactId }
          }
        ],
        inspection: 'defer'
      },
      signal
    )
  ).rejects.toThrow(/correction/i)
  expect(
    execute.mock.calls.flatMap(([batch]) =>
      batch.actions.map((action) => action.name)
    )
  ).toEqual([
    AiActionNames.READ_DESIGN_ATTACHMENT,
    AiActionNames.VALIDATE_INSPECTION_EVIDENCE
  ])
})

it('discovers and invokes world material preparation through current schemas and retained recovery', async () => {
  const tools = createLocalDesignTools(actions)
  const source = designPreparationExamples.find(
    (e) => 'linearFields' in e.draft && 'glass' in e.draft.linearFields
  )
  expect(source).toBeDefined()
  if (
    !source ||
    !('linearFields' in source.draft) ||
    !('glass' in source.draft.linearFields)
  )
    throw new Error('Missing field example')
  const definition = tools.definitions.find((d) => d.name === 'prepare_design')
  if (!definition) throw new Error('Missing prepare definition')
  expect(operationInputIssue(source, definition.inputSchema)).toBeUndefined()
  expect(
    operationInputIssue(source, nativeToolInputSchema(definition.inputSchema))
  ).toBeUndefined()
  const success = JSON.parse(
    await tools.call('prepare_design', source, signal())
  )
  expect(success).toMatchObject({ available: true, applicable: true })
  const batch = tools.resolveBatch(request(success.artifactId))
  const design = (batch.actions[0].arguments as { design: PreparedDesign })
    .design
  expect(admitPreparedDesign(JSON.parse(JSON.stringify(design)))).toEqual(
    JSON.parse(JSON.stringify(design))
  )
  const invalid = { draft: structuredClone(source.draft) }
  if (!('glass' in invalid.draft.linearFields))
    throw new Error('Missing cloned field')
  Object.assign(invalid.draft.linearFields.glass, {
    end: invalid.draft.linearFields.glass.start
  })
  const rejected = JSON.parse(
    await tools.call('prepare_design', invalid, signal())
  )
  expect(rejected).toMatchObject({ available: false })
  expect(tools.resolveBatch(request(success.artifactId))).toEqual(batch)
  const cancelled = new AbortController()
  cancelled.abort()
  await expect(
    tools.call('prepare_design', source, cancelled.signal)
  ).rejects.toThrow()
  expect(tools.resolveBatch(request(success.artifactId))).toEqual(batch)
})

it('executes the multi-face representation example with common material, native exceptions and exact retained targets', async () => {
  const example = designPreparationExamples.find(
    (e) => e.draft.name === 'Repeated visible detail'
  )
  if (!example) throw new Error('Missing multi-face example')
  const draft = example.draft as unknown as {
    children: { type: string; faces?: unknown[] }[]
  }
  expect(draft.children[0].faces).toHaveLength(2)
  expect(draft.children[1].type).toBe('projected-face')
  const session = createDesignPreparationSession()
  const tools = createLocalDesignTools(actions, session)
  const receipt = JSON.parse(
    await tools.call('prepare_design', example, signal())
  )
  expect(receipt).toMatchObject({
    available: true,
    applicable: true,
    elementCount: 14
  })
  const retained = JSON.parse(
    await tools.call(
      'retain_design_targets',
      { targets: [{ artifactId: receipt.artifactId, keyPrefix: 'panes-2-' }] },
      signal()
    )
  )
  expect(retained.targets[0].count).toBe(2)
  const { artifactId, targetSetId } = retained.targets[0]
  const ids = tools.resolveTargets({ artifactId, targetSetId })
  const design = session.resolve(receipt.artifactId)
  expect(ids).toEqual([
    design.keyToId['panes-2-glass'],
    design.keyToId['panes-2-rim']
  ])
  expect(design.keyToId.exception).toBeDefined()
  const glass = design.entries.filter((e) => e.key?.endsWith('-glass'))
  expect(glass).toHaveLength(6)
  expect(glass[0].descriptor.fills).not.toEqual(glass[1].descriptor.fills)
  session.release([receipt.artifactId])
  expect(() => tools.resolveTargets({ artifactId, targetSetId })).toThrow()
})

it('hands a material revision to its material-only consumer and reuses the same fields for extension', async () => {
  const owner = createLocalDesignTools([
    ...actions,
    {
      name: 'apply_prepared_material',
      description: 'Apply compiled material',
      inputSchema: { type: 'object' }
    }
  ])
  const materialDefinition = owner.definitions.find(
    (tool) => tool.name === 'prepare_material_revision'
  )
  if (!materialDefinition) throw new Error('Missing material definition')
  const example = (materialDefinition.inputSchema as { examples: unknown[] })
    .examples[0]
  expect(
    operationInputIssue(example, materialDefinition.inputSchema)
  ).toBeUndefined()
  const field = {
    frame: 'world',
    start: { x: 0, y: 0, z: 0 },
    end: { x: 0, y: 0, z: 100 },
    gradientStops: [
      { position: 0, color: '#112233', opacity: 1 },
      { position: 1, color: '#eeeeee', opacity: 1 }
    ]
  }
  const source = {
    type: 'group',
    name: 'Surfaces',
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
        key: 'wall',
        name: 'Wall',
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
  const first = JSON.parse(
    await owner.call('prepare_design', { draft: source }, signal())
  )
  const revision = JSON.parse(
    await owner.call(
      'prepare_material_revision',
      {
        artifactId: first.artifactId,
        field: 'glass',
        definition: {
          ...field,
          gradientStops: field.gradientStops.map((stop) => ({
            ...stop,
            color: '#336688'
          }))
        }
      },
      signal()
    )
  )
  expect(revision).toMatchObject({
    available: true,
    applied: false,
    elementCount: 1
  })
  const packet = owner.resolveBatch({
    batchId: 'revise',
    actions: [
      {
        id: 'material',
        name: 'apply_prepared_material',
        arguments: { materialRevisionId: revision.materialRevisionId },
        summary: 'Correct continuous material'
      }
    ]
  })
  expect(packet.actions[0].arguments).toMatchObject({
    rootId: expect.any(String),
    updates: [{ elementId: expect.any(String), gradient: expect.any(Object) }]
  })
  expect(() =>
    owner.resolveBatch(request(revision.materialRevisionId))
  ).toThrow(/material|creation/i)
  const { linearFields: _fields, ...next } = source
  const extension = JSON.parse(
    await owner.call(
      'prepare_design',
      { draft: next, materialSourceId: revision.materialRevisionId },
      signal()
    )
  )
  expect(extension).toMatchObject({ available: true, applicable: true })
  expect(owner.resolveRecipe(extension.artifactId).recipe).toMatchObject({
    linearFields: {
      glass: { gradientStops: [{ color: '#336688' }, { color: '#336688' }] }
    }
  })
})

it.each([10000, 2000])(
  'prepares safe capacity as an owned partition plan without compilation at %i',
  async (limit) => {
    const compile = vi.fn(prepareDesignAsync)
    const session = createDesignPreparationSession(
      prepareDesign,
      compile,
      undefined,
      limit
    )
    const tools = createOwner(actions, session)
    const definition = tools.definitions.find(
      (tool) => tool.name === 'prepare_design'
    )
    if (!definition) throw new Error('Missing preparation definition')
    const reply = await invokeLocalTool(
      {
        ...tools,
        call: (name, args, signal) => tools.call(name, args, signal, true)
      },
      { ...definition, outputSchema: tools.capacityOutputSchema },
      { draft: capacityFixture.input.draft },
      signal()
    )
    const value = JSON.parse(reply.text)
    expect(reply.success).toBe(true)
    expect(value).toMatchObject({
      available: true,
      toolOutcome: { status: 'success', settlement: 'completed' }
    })
    expect(value.artifactId).toBeUndefined()
    expect(value.applicable).toBeUndefined()
    expect(value.code).toBeUndefined()
    expect(value.budget.observed.expandedNodes).toBe(13095)
    expect(value.budget.allowed.expandedNodes).toBe(limit)
    expect(value.retainedDraft.partitions.length).toBeGreaterThan(1)
    expect(session.describeRejectedDraft(value.draftId)).toEqual(
      value.retainedDraft
    )
    expect(compile).not.toHaveBeenCalled()
    const forged = createOwner(actions)
    expect(forged.resultIssue('prepare_design', value)).toMatch(
      /unavailable|owned/i
    )
  }
)

it('keeps exhausted source retention a genuine no-write failure', async () => {
  const compile = vi.fn(prepareDesignAsync)
  const session = createDesignPreparationSession(prepareDesign, compile)
  const tools = createOwner(actions, session)
  const definition = tools.definitions.find(
    (tool) => tool.name === 'prepare_design'
  )
  if (!definition) throw new Error('Missing preparation definition')
  for (let index = 0; index < 4; index++) {
    const plan = await invokeLocalTool(
      {
        ...tools,
        call: (name, args, signal) => tools.call(name, args, signal, true)
      },
      { ...definition, outputSchema: tools.capacityOutputSchema },
      { draft: capacityFixture.input.draft },
      signal()
    )
    expect(plan.success).toBe(true)
  }
  const rejected = JSON.parse(
    (
      await invokeLocalTool(
        {
          ...tools,
          call: (name, args, signal) => tools.call(name, args, signal, true)
        },
        { ...definition, outputSchema: tools.capacityOutputSchema },
        { draft: capacityFixture.input.draft },
        signal()
      )
    ).text
  )
  expect(rejected).toMatchObject({
    available: false,
    retention: 'unavailable',
    toolOutcome: { status: 'failed', settlement: 'not-started' }
  })
  expect(rejected.draftId).toBeUndefined()
  expect(compile).not.toHaveBeenCalled()
})
