import { designPreparationExamples } from '../design-preparation-examples'
import { describe, expect, it, vi } from 'vitest'
import { admitPreparedDesign } from '../../src/ai/prepared-design-admission'
import { createLocalDesignTools } from '../local-design-tools'
import {
  createDesignPreparationSession,
  prepareDesign
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
  it('advertises semantic preparation only when editable application exists', () => {
    expect(createLocalDesignTools([]).definitions).toEqual([])
    const tools = createLocalDesignTools(actions)
    expect(tools.definitions.map((t) => t.name)).toEqual([
      'prepare_design',
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
    const compile = vi.fn(prepareDesign),
      session = createDesignPreparationSession(compile)
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
    const compile = vi.fn(prepareDesign),
      controller = new AbortController()
    controller.abort()
    await expect(
      createLocalDesignTools(
        actions,
        createDesignPreparationSession(compile)
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
            result:
              batch.actions[0].name === AiActionNames.INSPECT_DRAWING
                ? { available: true }
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
    expect(execute).toHaveBeenCalledTimes(2)
    expect(execute.mock.calls[0][0].actions[0].arguments).toMatchObject({
      design: { version: 1, entries: expect.any(Array) }
    })
    expect(execute.mock.calls[1][0].actions[0].arguments).toEqual({
      elementId: 'actual-root'
    })
  })
})

it('returns brief measurements and blocks an unmet requirement before canvas execution', async () => {
  const tools = createLocalDesignTools(actions)
  const source = {
    ...draft(),
    brief: {
      intent: 'Journal',
      viewpoint: 'Flat',
      sources: [],
      assumptions: [],
      checks: [{ key: '$root', property: 'width', expected: 400, tolerance: 0 }]
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

it('does not compile repeated detail while a planned structure checkpoint is unresolved', async () => {
  const compile = vi.fn(prepareDesign)
  const tools = createLocalDesignTools(
    actions,
    createDesignPreparationSession(compile),
    () => 'Inspect and pass the planned structure first.'
  )
  const result = JSON.parse(
    await tools.call(
      'prepare_design',
      {
        draft: {
          type: 'group',
          name: 'Detail',
          children: [{ type: 'pattern' }]
        }
      },
      new AbortController().signal
    )
  )
  expect(result.available).toBe(false)
  expect(result.message).toContain('structure first')
  expect(compile).not.toHaveBeenCalled()
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

it('resolves prepared keys without canvas reads and never retains references after release', () => {
  const session = createDesignPreparationSession()
  const receipt = session.prepare(draft())
  const tools = createLocalDesignTools(actions, session)
  const ref = { artifactId: receipt.artifactId, keys: ['heading'] }
  expect(tools.resolveTargets(ref)).toEqual([
    session.resolve(receipt.artifactId).keyToId.heading
  ])
  expect(() => tools.resolveTargets({ ...ref, keys: ['missing'] })).toThrow()
  expect(
    tools.resolveTargets({ artifactId: receipt.artifactId, keyPrefix: 'head' })
  ).toEqual(tools.resolveTargets(ref))
  session.release([receipt.artifactId])
  expect(() => tools.resolveTargets(ref)).toThrow()
})

it('reports all independent input mistakes with paths before compiling geometry', async () => {
  const compile = vi.fn(prepareDesign)
  const tools = createLocalDesignTools(
    actions,
    createDesignPreparationSession(compile)
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
    'children[0].width',
    'children[0].height',
    'children[0].rings',
    'children[1].height',
    'children[1].width'
  ])
    expect(result.message).toContain(path)
  expect(result.recovery).toBe('correct_input')
  expect(compile).not.toHaveBeenCalled()
})

it('identifies missing shared projection as a local input repair, not a reference search', async () => {
  const compile = vi.fn(prepareDesign)
  const tools = createLocalDesignTools(
    actions,
    createDesignPreparationSession(compile)
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

it('returns a concrete structure checkpoint recovery without compiling repeated detail', async () => {
  const compile = vi.fn(prepareDesign)
  const tools = createLocalDesignTools(
    actions,
    createDesignPreparationSession(compile),
    () => 'Check structure first'
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
  expect(result.recovery).toBe('review_structure')
  expect(result.nextTool).toBe('record_design_review')
  expect(compile).not.toHaveBeenCalled()
})

// Reproduces the error classes observed in live run 24, not its private input.
it('reports only the selected construction type when repairing a malformed projected face', async () => {
  const compile = vi.fn(prepareDesign)
  const tools = createLocalDesignTools(
    actions,
    createDesignPreparationSession(compile)
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
    const compile = vi.fn(prepareDesign)
    const tools = createLocalDesignTools(
      actions,
      createDesignPreparationSession(compile)
    )
    expect(tools.definitions[0].description).toContain(JSON.stringify(example))
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
    const compile = vi.fn(prepareDesign)
    const tools = createLocalDesignTools(
      actions,
      createDesignPreparationSession(compile)
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
      valid.draft,
      expect.any(String)
    )
  }
})
it('uses retained semantic identities for repeated edits without rebuilding or adding covering layers', async () => {
  const compile = vi.fn(prepareDesign)
  const tools = createLocalDesignTools(
    actions,
    createDesignPreparationSession(compile)
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
            elementId: { type: 'string' },
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
