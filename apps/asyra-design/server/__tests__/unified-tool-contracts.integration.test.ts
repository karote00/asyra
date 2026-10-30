import completeResultCost from './fixtures/recorded-101/complete-model-result-cost-20261029.json'
import { completeUsageBudget } from './tool-contract-assertions'
import { modelToolResultSchemas } from '../../src/ai/tool-contract'
import { expect, it, vi } from 'vitest'
import {
  createAiAgentRuntime,
  createAiToolContract
} from '@asyra/ai-agent-runtime'
import {
  projectWorkflowResult,
  workflowUsageParameters
} from '../design-workflow-discovery'
import { operationInputIssue } from '../operation-input-schema'
import { createLocalDesignTools } from '../local-design-tools'
import { invokeLocalTool } from '../local-tool-invocation'
import saved from './fixtures/recorded-101/missing-brief-checks-20261027.json'
import { designNodeInputFields } from '../design-preparation'
import { DesignNodeTypes } from '../../src/ai/prepared-design'
import { createLocalOperationTools } from '../local-operation-tools'
import { createLocalDesignWorkflow } from '../local-design-workflow'

const preparation = () => {
  const owner = createLocalDesignTools([
    { name: 'apply_prepared_design', description: 'Apply', inputSchema: {} }
  ])
  const definition = owner.definitions.find(
    (entry) => entry.name === 'prepare_design'
  )
  if (!definition) {
    throw new Error('Missing preparation definition')
  }
  return {
    owner,
    definition,
    call: async (input: unknown) =>
      JSON.parse(
        (
          await invokeLocalTool(
            owner,
            definition,
            input,
            new AbortController().signal
          )
        ).text
      )
  }
}

it('declares every supported native field from the preparation owner', () => {
  const schema = preparation().definition.inputSchema as {
    $defs: { node: { anyOf: { properties: Record<string, unknown> }[] } }
  }
  const node = schema.$defs.node.anyOf.find((entry) =>
    Array.isArray((entry.properties.type as { enum?: unknown[] })?.enum)
  )
  if (!node) {
    throw new Error('Missing native node schema')
  }
  for (const type of DesignNodeTypes) {
    for (const field of designNodeInputFields(type)) {
      expect(Object.hasOwn(node.properties, field), `${type}.${field}`).toBe(
        true
      )
    }
  }
})

it('prepares the saved brief without treating omitted advisory checks as a drawing prerequisite', async () => {
  const run = preparation()
  expect(saved.output.message).toContain('brief.checks')
  const reply = await run.call({ draft: saved.input.draft })
  expect(reply).toMatchObject({
    available: true,
    applicable: true,
    toolOutcome: { status: 'success', settlement: 'completed' }
  })
})

it.each([
  ['intent', '   '],
  ['checks', [{ key: 'body', property: 'width', expected: -1, tolerance: 0 }]],
  ['checks', [{ key: 'body', property: 'height', expected: -1, tolerance: 0 }]]
])(
  'rejects invalid brief %s at the declared input boundary',
  async (field, value) => {
    const run = preparation()
    const draft = {
      ...saved.input.draft,
      brief: {
        ...saved.input.draft.brief,
        checks: [],
        [field as string]: value
      }
    }
    expect(
      operationInputIssue({ draft }, run.definition.inputSchema)
    ).toBeDefined()
    expect(await run.call({ draft })).toMatchObject({
      available: false,
      stage: 'admission',
      settlement: 'not-started'
    })
  }
)

it('declares native oval rotation and rejects fields belonging to other node kinds before preparation', async () => {
  const run = preparation()
  const oval = {
    type: 'oval',
    key: 'ellipse',
    name: 'Ellipse',
    width: 24,
    height: 12,
    rotation: 30
  }
  const draft = { type: 'group', name: 'Shape', children: [oval] }
  expect(
    operationInputIssue({ draft }, run.definition.inputSchema)
  ).toBeUndefined()
  expect(await run.call({ draft })).toMatchObject({
    available: true,
    applicable: true
  })
  for (const node of [
    { ...oval, type: 'rect', rotation: undefined, text: 'ignored text' },
    {
      ...oval,
      type: 'vector',
      rotation: undefined,
      rings: [
        [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 }
        ]
      ],
      fontSize: 20
    },
    { type: 'group', key: 'nested', name: 'Nested', fontFamily: 'Example' }
  ]) {
    const input = JSON.parse(
      JSON.stringify({ draft: { ...draft, children: [node] } })
    )
    expect(operationInputIssue(input, run.definition.inputSchema)).toBeDefined()
    expect(await run.call(input)).toMatchObject({
      stage: 'admission',
      settlement: 'not-started'
    })
  }
})

it('corrects a missing declared field through the delivered retained repair without resending geometry', async () => {
  const run = preparation()
  const draft = {
    type: 'frame',
    name: 'Editable',
    height: 100,
    children: [
      { type: 'rect', key: 'body', name: 'Body', width: 10, height: 20 }
    ]
  }
  const failed = await run.call({ draft })
  expect(failed).toMatchObject({
    available: false,
    settlement: 'not-started',
    repairGuide: {
      tool: 'prepare_design',
      arguments: {
        repair: {
          draftId: failed.draftId,
          replacements: [{ path: '/width' }]
        }
      }
    }
  })
  const retry = structuredClone(failed.repairGuide.arguments)
  retry.repair.replacements[0].value = 100
  expect(retry).not.toHaveProperty('draft')
  expect(await run.call(retry)).toMatchObject({
    available: true,
    applicable: true,
    preparationInput: { kind: 'retained-repair', replacementCount: 1 }
  })
  expect(draft).not.toHaveProperty('width')
  for (const path of [
    '/unknown',
    '/__proto__',
    '/children/1',
    '/children/0/constructor'
  ]) {
    const rejected = await run.call({
      repair: { draftId: failed.draftId, replacements: [{ path, value: 1 }] }
    })
    expect(rejected).toMatchObject({
      available: false,
      settlement: 'not-started'
    })
  }
})

it('preserves the main invocation and workflow context in admission recovery', async () => {
  const actions = [
    { name: 'apply_prepared_design', description: 'Apply', inputSchema: {} }
  ]
  const designs = createLocalDesignTools(actions)
  const operations = createLocalOperationTools(actions, designs, async () => {
    throw new Error('Invalid admission must not dispatch')
  })
  const main = createLocalDesignWorkflow(designs, operations)
  const reply = JSON.parse(
    (
      await invokeLocalTool(
        main,
        main.definitions[0],
        {
          draft: { type: 'frame', name: 'Part', height: 100 },
          message: 'Create the current part',
          inspection: 'defer',
          parentId: 'parent'
        },
        new AbortController().signal
      )
    ).text
  )
  expect(reply.repairGuide).toMatchObject({
    tool: 'prepare_and_apply_design',
    arguments: {
      message: 'Create the current part',
      inspection: 'defer',
      parentId: 'parent',
      repair: { draftId: reply.draftId, replacements: [{ path: '/width' }] }
    }
  })
})

it('delivers a standard executable schema instead of a separate parameter language', () => {
  const value = {
    type: 'string',
    minLength: 1,
    description: 'Required identity.'
  }
  const schema = {
    type: 'object',
    required: ['first'],
    properties: { first: value, second: value },
    additionalProperties: false,
    not: { required: ['first', 'second'] }
  }
  const delivered = workflowUsageParameters(schema)
  expect(typeof delivered).toBe('object')
  for (const input of [
    { first: 'a' },
    { second: 'a' },
    { first: '' },
    { first: 'a', second: 'b' },
    { first: 'a', extra: true }
  ]) {
    expect(Boolean(operationInputIssue(input, delivered))).toBe(
      Boolean(operationInputIssue(input, schema))
    )
  }
  expect(schema.properties.first).toBe(value)
})

it('factors repeated scalar constraints using actual reference cost without weakening admission', () => {
  const scalar = { type: 'number', minimum: 0, maximum: 100000 }
  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: Object.fromEntries(
      Array.from({ length: 24 }, (_, i) => [`field${i}`, scalar])
    )
  }
  const result = workflowUsageParameters(schema)
  expect(Buffer.byteLength(JSON.stringify(result))).toBeLessThan(
    Buffer.byteLength(JSON.stringify(schema)) * 0.85
  )
  expect(operationInputIssue({ field0: -1 }, result)).toBeDefined()
  expect(operationInputIssue({ field23: 100000 }, result)).toBeUndefined()
})

it('shares repeated parents without retaining more costly child indirections', () => {
  const leaf = {
    type: 'number',
    minimum: -10000,
    maximum: 10000,
    description: 'Finite signed local coordinate.'
  }
  const branch = {
    type: 'object',
    additionalProperties: false,
    required: ['coordinate'],
    properties: { coordinate: leaf },
    description: 'One independent local point.'
  }
  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: Object.fromEntries(
      Array.from({ length: 20 }, (_, i) => [`point${i}`, branch])
    )
  }
  const delivered = workflowUsageParameters(schema)
  const definitions = delivered.$defs as Record<string, unknown>
  const references = new Map<string, number>()
  const walk = (value: unknown) => {
    if (Array.isArray(value)) {
      return value.forEach(walk)
    }
    if (!value || typeof value !== 'object') {
      return
    }
    const object = value as Record<string, unknown>
    if (typeof object.$ref === 'string') {
      references.set(object.$ref, (references.get(object.$ref) ?? 0) + 1)
    }
    Object.values(object).forEach(walk)
  }
  walk(delivered)
  for (const name of Object.keys(definitions)) {
    expect(references.get('#/$defs/' + name), name).toBeGreaterThan(1)
  }
  for (const input of [
    { point0: { coordinate: 1 } },
    { point3: { coordinate: 10001 } },
    { point5: { coordinate: 1, extra: 1 } }
  ]) {
    expect(Boolean(operationInputIssue(input, delivered))).toBe(
      Boolean(operationInputIssue(input, schema))
    )
  }
})

it('keeps root conditions isolated from child-only field exclusions', () => {
  const schema = preparation().definition.inputSchema as {
    properties: {
      draft: {
        properties: Record<string, unknown>
        anyOf: { properties: Record<string, unknown> }[]
      }
    }
  }
  const root = schema.properties.draft
  for (const condition of root.anyOf) {
    for (const field of Object.keys(condition.properties)) {
      expect(Object.hasOwn(root.properties, field), field).toBe(true)
    }
  }
})

it('advertises fully validated missing-field repair through the actual preparation contract', () => {
  const schema = preparation().definition.inputSchema as {
    properties: { repair: { description: string } }
  }
  expect(schema.properties.repair.description).toContain(
    'missing allowed fields'
  )
  expect(schema.properties.repair.description).toContain('complete input')
})

it('preserves each face mode identity limits and geometry admission', async () => {
  const run = preparation()
  const projection = {
    azimuth: 30,
    elevation: 20,
    scale: 1,
    originX: 0,
    originY: 0
  }
  const geometry = {
    name: 'Panel',
    fill: '#112233',
    vertices: [
      { x: 0, y: 0, z: 0 },
      { x: 10, y: 0, z: 0 },
      { x: 0, y: 0, z: 10 }
    ]
  }
  const pattern = {
    type: 'pattern',
    key: 'repeat',
    name: 'Repeated',
    origin: { x: 0, y: 0, z: 0 },
    axes: [{ count: 2, step: { x: 12, y: 0, z: 0 } }]
  }
  for (const [child, allowed] of [
    [{ ...geometry, type: 'projected-face', key: 'a'.repeat(160) }, true],
    [{ ...geometry, type: 'projected-face', key: 'a'.repeat(161) }, false],
    [
      {
        ...pattern,
        members: [{ ...geometry, type: 'projected-face', key: 'a'.repeat(80) }]
      },
      true
    ],
    [
      {
        ...pattern,
        members: [{ ...geometry, type: 'projected-face', key: 'a'.repeat(81) }]
      },
      false
    ],
    [{ ...pattern, faces: [{ ...geometry, key: 'a'.repeat(40) }] }, true],
    [{ ...pattern, faces: [{ ...geometry, key: 'a'.repeat(41) }] }, false],
    [
      {
        ...pattern,
        faces: [{ ...geometry, type: 'projected-face', key: 'panel' }]
      },
      false
    ],
    [{ ...pattern, members: [{ ...geometry, key: 'panel' }] }, false]
  ] as const) {
    const input = {
      draft: {
        type: 'group',
        name: 'Geometry modes',
        projection,
        children: [child]
      }
    }
    expect(
      !operationInputIssue(input, run.definition.inputSchema),
      JSON.stringify(child)
    ).toBe(allowed)
    const reply = await run.call(input)
    expect(reply.available, JSON.stringify(reply)).toBe(allowed)
    if (!allowed) {
      expect(reply.toolOutcome.settlement).toBe('not-started')
    }
  }
})

let corePresetApplied = false

it.each(['single', 'parts', 'parts-failure'])(
  'executes the delivered %s missing-field correction through the real main dispatcher and rejects foreign retained corrections without replay',
  async (mode) => {
    const hadWindow = 'window' in globalThis
    if (!hadWindow) {
      vi.stubGlobal('window', {})
    }
    const { default: core } = await import('../../src/contexts')
    const { applyPreset, PresetProfiles, PresetDefaults } =
      await import('@asyra/preset')
    const { default: factory } = await import('@asyra/factory')
    const { createPreparedDesignAction } =
      await import('../../src/ai/design-actions')
    const { observeAiAction } = await import('../../src/ai/runtime-input')
    const { createAiTransactionRunner } =
      await import('../../src/ai/transaction')
    if (!corePresetApplied) {
      applyPreset(core, {
        profile: PresetProfiles.CUSTOM,
        defaults: [
          PresetDefaults.BASIC_SHAPES,
          PresetDefaults.CONTAINERS,
          PresetDefaults.SELECTION,
          PresetDefaults.UI_CONTEXT
        ]
      })
      corePresetApplied = true
    }
    const initial = {
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
    }
    await core.load(initial)
    factory.transact.reset()
    const action = observeAiAction(
      createPreparedDesignAction(undefined, async () => undefined)
    )
    const contracts = [createAiToolContract(action)]
    const designs = createLocalDesignTools(contracts)
    let dispatches = 0
    const signal = new AbortController().signal
    const operations = createLocalOperationTools(
      contracts,
      designs,
      async (batch) => {
        dispatches++
        const runtime = createAiAgentRuntime({
          provider: { requestActionBatch: async () => batch },
          actionDefinitions: [action],
          contextProvider: { getContext: async () => ({}) },
          permissionPolicy: { evaluate: () => 'allow' },
          confirmationHandler: { confirm: async () => true },
          transactionRunner: createAiTransactionRunner()
        })
        try {
          const receipt = await runtime.run({
            intent: 'Create corrected frame',
            signal
          })
          expect(receipt.status, JSON.stringify(receipt)).toBe('executed')
          return { context: {}, actionResults: receipt.actionResults ?? [] }
        } finally {
          await runtime.dispose()
        }
      }
    )
    const main = createLocalDesignWorkflow(designs, operations)
    const call = async (input: unknown) =>
      JSON.parse(
        (await invokeLocalTool(main, main.definitions[0], input, signal)).text
      )
    try {
      const draft = {
        type: 'frame',
        key: 'frame',
        name: 'Frame',
        height: 100,
        children: [
          {
            type: 'rect',
            key: 'panel',
            name: 'Panel',
            width: 20,
            height: 30,
            fill: '#123456'
          }
        ]
      }
      if (mode === 'parts-failure') {
        draft.children.push({ ...draft.children[0] })
      }
      const request =
        mode === 'single'
          ? {
              draft,
              inspection: 'defer',
              message: 'Create corrected frame',
              parentId: 'workspace'
            }
          : {
              parts: [
                {
                  key: 'outer',
                  parentId: 'workspace',
                  draft: { type: 'group', name: 'Outer', key: 'outer' }
                },
                { key: 'inner', parentPart: 'outer', draft }
              ],
              inspection: 'defer',
              message: 'Create corrected frame'
            }
      const rejected = await call(request)
      expect(rejected.toolOutcome).toMatchObject({
        status: 'failed',
        settlement: 'not-started'
      })
      expect(dispatches).toBe(0)
      expect(await core.save()).toEqual(initial)
      expect(rejected.repairGuide, JSON.stringify(rejected)).toBeDefined()
      const correction = structuredClone(rejected.repairGuide.arguments)
      if (mode === 'single') {
        correction.repair.replacements[0].value = 100
      } else {
        expect(correction.parts).toHaveLength(2)
        expect(correction.parts[0]).toMatchObject({
          key: 'outer',
          parentId: 'workspace',
          repair: { replacements: [] }
        })
        expect(correction.parts[1]).toMatchObject({
          key: 'inner',
          parentPart: 'outer',
          repair: { replacements: [{ path: '/width' }] }
        })
        expect(
          correction.parts.every((part: object) => !('draft' in part))
        ).toBe(true)
        correction.parts[1].repair.replacements[0].value = 100
      }
      expect(correction).not.toHaveProperty('draft')
      expect(correction).toMatchObject({
        inspection: 'defer',
        message: 'Create corrected frame'
      })
      let reply = await call(correction)
      if (mode === 'parts-failure') {
        expect(reply.toolOutcome).toMatchObject({
          status: 'partial',
          settlement: 'partial'
        })
        expect(dispatches).toBe(1)
        const prefix = await core.save()
        const outerId = prefix.sceneTree.elements.workspace.children[0]
        expect(reply.recoveryInvocation, JSON.stringify(reply)).toBeDefined()
        const recovery = structuredClone(reply.recoveryInvocation.arguments)
        expect(recovery.parts).toHaveLength(1)
        expect(recovery.parts[0]).toMatchObject({
          key: 'inner',
          parentId: outerId
        })
        expect(recovery.parts[0]).not.toHaveProperty('parentPart')
        expect(recovery.parts[0]).not.toHaveProperty('draft')
        recovery.parts[0].repair.replacements = [
          { path: '/children/1/key', value: 'second-panel' }
        ]
        reply = await call(recovery)
        expect(
          (await core.save()).sceneTree.elements.workspace.children
        ).toEqual([outerId])
      }
      const receipt = mode === 'single' ? reply : reply.parts.at(-1)
      expect(receipt, JSON.stringify(reply)).toHaveProperty('actionResults')
      expect(receipt.actionResults[0].result).toMatchObject({
        status: 'complete',
        appliedElementCount: mode === 'parts-failure' ? 3 : 2
      })
      const expectedDispatches = mode === 'single' ? 1 : 2
      expect(dispatches).toBe(expectedDispatches)
      const saved = await core.save()
      const outer =
        saved.sceneTree.elements[saved.sceneTree.elements.workspace.children[0]]
      const root =
        mode === 'single' ? outer : saved.sceneTree.elements[outer.children[0]]
      expect(root).toMatchObject({
        type: 'frame',
        name: 'Frame',
        parentId: mode === 'single' ? 'workspace' : outer.id
      })
      expect(root.children).toHaveLength(mode === 'parts-failure' ? 2 : 1)
      expect(
        (await import('../../src/common-apis')).elementApis.getElementBounds(
          root.id
        )
      ).toMatchObject({ width: 100, height: 100 })
      expect(factory.getUndoHistoryDepth()).toBe(expectedDispatches)
      for (let index = 0; index < expectedDispatches; index++) {
        await factory.undo()
      }
      expect(await core.save()).toEqual(initial)
      for (let index = 0; index < expectedDispatches; index++) {
        await factory.redo()
      }
      expect(await core.save()).toEqual(saved)
      await core.load(saved)
      expect(await core.save()).toEqual(saved)
      expect(draft).not.toHaveProperty('width')
      // A new request cannot consume the previous request's retained correction.
      const freshDesigns = createLocalDesignTools(contracts)
      const freshOperations = createLocalOperationTools(
        contracts,
        freshDesigns,
        async () => {
          throw new Error('Foreign recovery must not dispatch')
        }
      )
      const freshMain = createLocalDesignWorkflow(freshDesigns, freshOperations)
      const foreign = JSON.parse(
        (
          await invokeLocalTool(
            freshMain,
            freshMain.definitions[0],
            correction,
            signal
          )
        ).text
      )
      expect(foreign.toolOutcome).toMatchObject({
        status: 'failed',
        settlement: 'not-started'
      })
      expect(dispatches).toBe(expectedDispatches)
      expect(await core.save()).toEqual(saved)
    } finally {
      await core.load(initial)
      factory.transact.reset()
      if (!hadWindow) {
        vi.unstubAllGlobals()
      }
    }
  }
)

it('retains inline gradients and both reference forms in the canonical composed Fill schema', async () => {
  const { designFillSchema, designInlineFillSchema } =
    await import('../../src/ai/design-fill')
  const gradient = {
    gradientType: 'linear',
    gradientHandles: [
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ],
    gradientStops: [
      { position: 0, color: '#123456', opacity: 1 },
      { position: 1, color: '#abcdef', opacity: 1 }
    ]
  }
  for (const value of ['#123456', gradient]) {
    expect(operationInputIssue(value, designFillSchema)).toBeUndefined()
    expect(operationInputIssue(value, designInlineFillSchema)).toBeUndefined()
  }
  for (const value of [{ shared: 'paint' }, { template: 'paint' }]) {
    expect(operationInputIssue(value, designFillSchema)).toBeUndefined()
    expect(operationInputIssue(value, designInlineFillSchema)).toBeDefined()
  }
  for (const value of [
    { shared: 'paint', template: 'paint' },
    { shared: '' },
    { ...gradient, extra: true },
    { ...gradient, gradientStops: [] }
  ]) {
    expect(operationInputIssue(value, designFillSchema)).toBeDefined()
  }
})

it.each(['capacity', 'outer-field', 'parent-order'])(
  'does not advertise complete parts recovery for %s failure',
  async (failure) => {
    const actions = [
      { name: 'apply_prepared_design', description: 'Apply', inputSchema: {} }
    ]
    const designs = createLocalDesignTools(actions)
    const execute = vi.fn(async () => {
      throw new Error('Admission must not dispatch')
    })
    const operations = createLocalOperationTools(actions, designs, execute)
    const main = createLocalDesignWorkflow(designs, operations)
    if (failure === 'capacity') {
      const { DesignPreparationLimits } =
        await import('../../src/ai/prepared-design')
      for (let i = 0; i < DesignPreparationLimits.retainedDrafts; i++) {
        designs.rejectInput('prepare_design', {
          draft: { type: 'group', name: 'Retained' }
        })
      }
    }
    const input = {
      parts: [
        { key: 'first', draft: { type: 'group', name: 'Kept' } },
        {
          key: 'next',
          draft: { type: 'frame', name: 'Missing', height: 20 },
          ...(failure === 'parent-order' ? { parentPart: 'absent' } : {})
        }
      ],
      ...(failure === 'outer-field' ? { unknown: true } : {})
    }
    const reply = JSON.parse(
      (
        await invokeLocalTool(
          main,
          main.definitions[0],
          input,
          new AbortController().signal
        )
      ).text
    )
    expect(reply.toolOutcome).toMatchObject({
      status: 'failed',
      settlement: 'not-started'
    })
    expect(reply.repairGuide).toBeUndefined()
    if (failure === 'capacity') {
      expect(reply.rejectedParts[0].retention).toBe('unavailable')
    }
    expect(execute).not.toHaveBeenCalled()
  }
)

it('keeps the canonical and delivered recursive contracts executable at the owner depth boundary', async () => {
  const { DesignPreparationLimits } =
    await import('../../src/ai/prepared-design')
  const { prepareDesign } = await import('../design-preparation')
  for (const depth of [
    1,
    DesignPreparationLimits.depth - 2,
    DesignPreparationLimits.depth - 1,
    DesignPreparationLimits.depth
  ]) {
    let draft: Record<string, unknown> = {
      type: 'rect',
      key: 'shape',
      name: 'Shape',
      width: 10,
      height: 10
    }
    for (let index = 0; index < depth; index++) {
      draft = {
        type: 'group',
        key: `level-${index}`,
        name: `Level ${index}`,
        children: [draft]
      }
    }
    const run = preparation()
    // The owner counts the root and the leaf, not only container edges.
    if (depth === DesignPreparationLimits.depth) {
      expect(() => prepareDesign(draft)).toThrow(
        `depth ${depth + 1} exceeds ${DesignPreparationLimits.depth}`
      )
      expect(await run.call({ draft })).toMatchObject({
        available: false,
        settlement: 'not-started'
      })
      continue
    }
    const direct = prepareDesign(draft)
    const delivered = workflowUsageParameters(run.definition.inputSchema)
    expect(
      operationInputIssue({ draft }, run.definition.inputSchema),
      `canonical depth ${depth}`
    ).toBeUndefined()
    expect(
      operationInputIssue({ draft }, delivered),
      `delivered depth ${depth}`
    ).toBeUndefined()
    const reply = await run.call({ draft })
    expect(reply, JSON.stringify(reply)).toMatchObject({
      available: true,
      elementCount: direct.entries.length
    })
  }
})

it.each([
  ['single', 'unknown'],
  ['parts', 'unknown'],
  ['single', 'outer'],
  ['parts', 'outer'],
  ['single', 'truncated'],
  ['parts', 'truncated'],
  ['single', 'reserved'],
  ['parts', 'reserved']
])(
  'does not advertise an incomplete retained correction through %s for %s admission errors',
  async (route, failure) => {
    const actions = [
      { name: 'apply_prepared_design', description: 'Apply', inputSchema: {} }
    ]
    const designs = createLocalDesignTools(actions)
    const execute = vi.fn(async () => {
      throw new Error('Admission must not dispatch')
    })
    const operations = createLocalOperationTools(actions, designs, execute)
    const main = createLocalDesignWorkflow(designs, operations)
    const draft = {
      type: 'frame',
      name: 'Missing width',
      height: 20,
      ...(failure === 'unknown' ? { extra: true } : {}),
      ...(failure === 'reserved'
        ? { motifTemplates: { constructor: [] } }
        : {}),
      ...(failure === 'truncated'
        ? {
            children: Array.from({ length: 20 }, (_, i) => ({
              type: 'rect',
              key: `child${i}`,
              name: 'Missing size'
            }))
          }
        : {})
    }
    const before = structuredClone(draft)
    const input = {
      ...(route === 'single' ? { draft } : { parts: [{ key: 'part', draft }] }),
      ...(failure === 'outer' ? { inspection: 'invalid' } : {})
    }
    const reply = JSON.parse(
      (
        await invokeLocalTool(
          main,
          main.definitions[0],
          input,
          new AbortController().signal
        )
      ).text
    )
    expect(reply.toolOutcome).toMatchObject({
      status: 'failed',
      settlement: 'not-started'
    })
    expect(reply.message).toEqual(expect.any(String))
    expect(reply.repairGuide).toBeUndefined()
    const retained = route === 'single' ? reply : reply.rejectedParts[0]
    expect(retained.draftId).toEqual(expect.any(String))
    if (route === 'parts' && failure === 'outer') {
      // A part-local preparation correction stays valid; it cannot authorize
      // replaying the invalid main envelope or applying document changes.
      const corrected = structuredClone(retained.repairGuide.arguments)
      corrected.repair.replacements[0].value = 20
      const definition = designs.definitions.find(
        (entry) => entry.name === retained.repairGuide.tool
      )
      if (!definition) {
        throw new Error('Missing preparation recovery owner')
      }
      const prepared = JSON.parse(
        (
          await invokeLocalTool(
            designs,
            definition,
            corrected,
            new AbortController().signal
          )
        ).text
      )
      expect(prepared).toMatchObject({ available: true, applicable: true })
    } else {
      expect(retained.repairGuide).toBeUndefined()
    }
    expect(execute).not.toHaveBeenCalled()
    expect(draft).toEqual(before)
  }
)

it.each(['definition', 'property'])(
  'preserves descendant %s reference addresses when sharing repeated schema parents',
  (location) => {
    const branch = {
      type: 'object',
      required: ['value'],
      additionalProperties: false,
      properties: { value: { type: 'string', minLength: 2, maxLength: 8 } },
      description: 'An independently validated value holder.'
    }
    const target =
      location === 'definition'
        ? '#/$defs/holder/properties/value'
        : '#/properties/holder/properties/value'
    const schema = {
      type: 'object',
      additionalProperties: false,
      properties: {
        holder: branch,
        ...Object.fromEntries(
          Array.from({ length: 12 }, (_, i) => [`copy${i}`, branch])
        ),
        value: { $ref: target }
      },
      ...(location === 'definition' ? { $defs: { holder: branch } } : {})
    }
    const before = JSON.stringify(schema)
    const delivered = workflowUsageParameters(schema)
    for (const value of ['ok', '', 'too-long-value', 4]) {
      const input = { holder: { value: 'ok' }, copy0: { value: 'ok' }, value }
      const expected = operationInputIssue(input, schema)
      expect(
        operationInputIssue(input, delivered),
        `${location}: ${JSON.stringify(value)}`
      ).toBe(expected)
    }
    expect(JSON.stringify(schema)).toBe(before)
    expect(Buffer.byteLength(JSON.stringify(delivered))).toBeLessThan(
      Buffer.byteLength(JSON.stringify(schema))
    )
  }
)

it('omits only default open-object keywords while retaining closed nested constraints', () => {
  const canonical = {
    type: 'object',
    additionalProperties: true,
    properties: {
      open: { type: 'object', additionalProperties: true },
      closed: {
        type: 'object',
        additionalProperties: false,
        properties: { count: { type: 'integer', minimum: 0 } },
        required: ['count']
      }
    },
    required: ['closed']
  }
  const compact = workflowUsageParameters(canonical)
  expect(JSON.stringify(compact)).not.toContain('"additionalProperties":true')
  for (const value of [
    { closed: { count: 0 }, extra: true },
    { closed: { count: 0, extra: true } },
    { closed: { count: -1 } },
    {},
    { closed: { count: 1 }, open: { extra: true } }
  ]) {
    expect(operationInputIssue(value, compact) === undefined).toBe(
      operationInputIssue(value, canonical) === undefined
    )
  }
})

it('compacts repeated result alternatives without changing constraints or addressed branches', () => {
  const complete = {
    type: 'object',
    properties: { count: { type: 'integer', minimum: 0 } },
    required: ['count'],
    additionalProperties: false
  }
  const failed = {
    type: 'object',
    properties: { code: { const: 'FAILED' } },
    required: ['code'],
    additionalProperties: false
  }
  const schema = {
    anyOf: [
      complete,
      { anyOf: [complete, { anyOf: [failed, complete] }] },
      failed
    ]
  }
  const compact = workflowUsageParameters(schema)
  expect(Buffer.byteLength(JSON.stringify(compact))).toBeLessThan(
    Buffer.byteLength(
      JSON.stringify(workflowUsageParameters({ anyOf: [complete, failed] }))
    ) + 1
  )
  for (const value of [
    { count: 0 },
    { count: -1 },
    { code: 'FAILED' },
    {},
    { count: 1, extra: 2 },
    null
  ]) {
    expect(Boolean(operationInputIssue(value, compact))).toBe(
      Boolean(operationInputIssue(value, schema))
    )
  }
  // Identical oneOf branches intentionally reject a value matching twice.
  const exclusive = { oneOf: [complete, complete] }
  expect(
    operationInputIssue({ count: 0 }, workflowUsageParameters(exclusive))
  ).toBeDefined()
  // A local pointer into a nested alternative must retain the exact target.
  const addressed = {
    $defs: { branches: { anyOf: [failed, { anyOf: [complete] }] } },
    $ref: '#/$defs/branches/anyOf/1/anyOf/0'
  }
  const retained = workflowUsageParameters(addressed)
  expect(operationInputIssue({ count: 0 }, retained)).toBeUndefined()
  expect(operationInputIssue({ code: 'FAILED' }, retained)).toBeDefined()
  const annotated = {
    anyOf: [{ anyOf: [complete], description: 'Keep this decision guidance.' }]
  }
  expect(JSON.stringify(workflowUsageParameters(annotated))).toContain(
    'Keep this decision guidance.'
  )
})

it('declares common host outcome constraints once across open result alternatives', () => {
  const schema = {
    anyOf: [
      {
        type: 'object',
        properties: {
          kind: { const: 'count' },
          count: { type: 'integer', minimum: 0 }
        },
        required: ['kind', 'count']
      },
      {
        type: 'object',
        properties: {
          kind: { const: 'ids' },
          ids: { type: 'array', items: { type: 'string' } }
        },
        required: ['kind', 'ids']
      }
    ]
  }
  const projected = modelToolResultSchemas({
    outputSchema: schema
  }).outputSchema
  let annotations = 0
  const visit = (value: unknown): void => {
    if (!value || typeof value !== 'object') {
      return
    }
    if (
      'properties' in value &&
      value.properties &&
      typeof value.properties === 'object' &&
      'toolOutcome' in value.properties
    ) {
      annotations++
    }
    Object.values(value).forEach(visit)
  }
  visit(projected)
  expect(annotations).toBe(1)
  for (const value of [
    { kind: 'count', count: 1 },
    { kind: 'ids', ids: ['a'] }
  ]) {
    expect(
      operationInputIssue(
        {
          ...value,
          toolOutcome: { status: 'success', settlement: 'completed' }
        },
        projected
      )
    ).toBeUndefined()
    expect(
      operationInputIssue(
        {
          ...value,
          toolOutcome: { status: 'invented', settlement: 'completed' }
        },
        projected
      )
    ).toBeDefined()
  }
  expect(
    operationInputIssue(
      {
        kind: 'count',
        count: -1,
        toolOutcome: { status: 'success', settlement: 'completed' }
      },
      projected
    )
  ).toBeDefined()
})

it('preserves closed forbidden fields, singleton constraints and indexed references', () => {
  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: { value: { type: 'string', enum: ['ready'] }, unused: false },
    oneOf: [{ required: ['value'] }]
  }
  const compact = workflowUsageParameters(schema)
  expect(JSON.stringify(compact).length).toBeLessThanOrEqual(
    JSON.stringify(schema).length
  )
  for (const value of [
    { value: 'ready' },
    { value: 'wrong' },
    { value: 'ready', unused: 0 },
    {},
    null,
    []
  ]) {
    expect(Boolean(operationInputIssue(value, compact))).toBe(
      Boolean(operationInputIssue(value, schema))
    )
  }
  const contradiction = {
    type: 'object',
    additionalProperties: false,
    properties: { blocked: false },
    required: ['blocked']
  }
  expect(
    operationInputIssue({}, workflowUsageParameters(contradiction))
  ).toBeDefined()
  expect(
    operationInputIssue({ blocked: 1 }, workflowUsageParameters(contradiction))
  ).toBeDefined()
  const indexed = {
    $defs: { choice: { oneOf: [{ const: 'value' }] } },
    $ref: '#/$defs/choice/oneOf/0'
  }
  expect(
    operationInputIssue('value', workflowUsageParameters(indexed))
  ).toBeUndefined()
})

it('shares identical union context while retaining independent alternatives and annotations', () => {
  const common = {
    description: 'Every result preserves this guidance.',
    properties: { status: { enum: ['success', 'partial'] } }
  }
  const a = {
    type: 'object',
    required: ['count'],
    properties: { count: { type: 'integer', minimum: 0 } }
  }
  const b = {
    type: 'object',
    required: ['ids'],
    properties: { ids: { type: 'array', minItems: 1 } }
  }
  const schema = {
    anyOf: [
      { ...common, anyOf: [a] },
      { ...common, anyOf: [a, b] }
    ]
  }
  const compact = workflowUsageParameters(schema)
  expect(JSON.stringify(compact).length).toBeLessThan(
    JSON.stringify(schema).length
  )
  for (const value of [
    { count: 1 },
    { ids: ['a'], status: 'partial' },
    { count: -1 },
    { ids: [] },
    { count: 1, status: 'invalid' },
    null
  ]) {
    expect(Boolean(operationInputIssue(value, compact))).toBe(
      Boolean(operationInputIssue(value, schema))
    )
  }
})

it.each(['draft', 'capture'] as const)(
  'freezes the complete acquisition reference for %s independently of candidate growth',
  (reference) => {
    const { resultSchema: results, cost } =
      completeResultCost.entries[reference]
    const instructions = 'Use the actual route.'
    const prose =
      'Acknowledgement is not visual approval; retain "partial" results.'
    for (const fragmented of [false, true]) {
      const size = (value: unknown) => {
        const text = JSON.stringify(value)
        return Buffer.byteLength(fragmented ? JSON.stringify(text) : text)
      }
      const before = { instructions, results: prose }
      const after = { instructions: instructions + ' ' + prose, results }
      expect(cost[fragmented ? 'fragmented' : 'plain']).toBe(
        fragmented
          ? Buffer.byteLength(JSON.stringify(JSON.stringify(results))) - 2
          : Buffer.byteLength(JSON.stringify(results))
      )
      const budget = completeUsageBudget(size(before), reference, fragmented)
      expect(size(after)).toBeLessThanOrEqual(budget)
      const expanded = {
        ...after,
        results: { ...results, description: 'Unnecessary repeated context.' }
      }
      expect(size(expanded)).toBeGreaterThan(budget)
      expect(completeUsageBudget(size(before), reference, fragmented)).toBe(
        budget
      )
    }
  }
)

it('scopes only declared result alternatives and keeps shared references, independent failures and the owner immutable', () => {
  const input = {
    'x-design-input-scope': {
      operations: '/oneOf',
      resultOperations: {
        outputSchema: '/anyOf',
        partialOutputSchema: '/anyOf/0/anyOf'
      }
    },
    oneOf: [{ required: ['capture'] }, { required: ['record'] }],
    properties: { capture: {}, record: {} }
  }
  const output = {
    $defs: { count: { type: 'integer', minimum: 0 } },
    anyOf: ['capture', 'record'].map((name) => ({
      'x-design-operation': name,
      type: 'object',
      required: [name],
      properties: { [name]: { $ref: '#/$defs/count' } }
    }))
  }
  const before = structuredClone(output)
  const selected = projectWorkflowResult(
    input,
    output,
    { operation: 'record' },
    'outputSchema'
  )
  expect(operationInputIssue({ record: 1 }, selected)).toBeUndefined()
  expect(operationInputIssue({ record: -1 }, selected)).toBeDefined()
  expect(operationInputIssue({ capture: 1 }, selected)).toBeDefined()
  expect(output).toEqual(before)
  const failure = {
    type: 'object',
    required: ['failure'],
    properties: { failure: { const: true } }
  }
  const partial = {
    anyOf: [{ anyOf: output.anyOf }, failure],
    $defs: output.$defs
  }
  const scopedPartial = projectWorkflowResult(
    input,
    partial,
    { operation: 'record' },
    'partialOutputSchema'
  )
  expect(operationInputIssue({ failure: true }, scopedPartial)).toBeUndefined()
  expect(operationInputIssue({ capture: 1 }, scopedPartial)).toBeDefined()
  expect(
    projectWorkflowResult(
      input,
      output,
      { operation: 'invalid' },
      'outputSchema'
    )
  ).toBe(output)
  expect(() =>
    projectWorkflowResult(
      input,
      { anyOf: [output.anyOf[0], output.anyOf[0]] },
      { operation: 'record' },
      'outputSchema'
    )
  ).toThrow('Invalid owner')
  expect(() =>
    projectWorkflowResult(
      input,
      { anyOf: [output.anyOf[0]] },
      { operation: 'record' },
      'outputSchema'
    )
  ).toThrow('Missing owner')
})
