// @vitest-environment jsdom
import { beforeAll, expect, it, vi } from 'vitest'
import { applyPreset, PresetDefaults, PresetProfiles } from '@asyra/preset'
import scene from '@asyra/scene-tree'
import factory from '@asyra/factory'
import {
  createAiAgentRuntime,
  createAiToolContract
} from '@asyra/ai-agent-runtime'
import core from '../../src/contexts'
import { elementApis } from '../../src/common-apis/element/apis'
import { transactionApis } from '../../src/common-apis/transaction'
import { createPreparedDesignAction } from '../../src/ai/design-actions'
import { createAiTransactionRunner } from '../../src/ai/transaction'
import { createLocalDesignTools } from '../local-design-tools'
import { createLocalOperationTools } from '../local-operation-tools'
import { createDesignPreparationSession } from '../design-preparation'
import { AiDesignToolIds } from '../../src/constants'
import type {
  AiActionBatch,
  AiBatchReceipt
} from '../../src/ai/action-batch-protocol'
import saved from './fixtures/recorded-101/vector-delivery-20261025.json'

beforeAll(() => {
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
})

const reset = () => {
  factory.transact.reset()
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
}

// Reuse the official preparation, dispatcher, Runtime and transaction owners.
const create = async (draft: unknown, response: 'compact' | 'full') => {
  const action = createPreparedDesignAction(undefined, async () => undefined)
  const definitions = [createAiToolContract(action)]
  const preparation = createDesignPreparationSession()
  const tools = createLocalDesignTools(definitions, preparation)
  let pending: AiActionBatch
  let receipt: AiBatchReceipt | undefined
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
  const operations = createLocalOperationTools(
    definitions,
    tools,
    async (batch) => {
      pending = batch
      receipt = undefined
      await runtime.run({
        intent: 'Create editable objects',
        signal: new AbortController().signal
      })
      if (!receipt) throw new Error('Missing creation receipt')
      return receipt
    }
  )
  try {
    const prepared = JSON.parse(
      await tools.call(
        'prepare_design',
        { draft },
        new AbortController().signal
      )
    )
    expect(prepared, JSON.stringify(prepared)).toHaveProperty('artifactId')
    const canonical = preparation.resolve(prepared.artifactId)
    await operations.call(
      AiDesignToolIds.EXECUTE_DESIGN_BATCH,
      {
        inspection: 'defer',
        operations: [
          {
            name: action.name,
            arguments: { artifactId: prepared.artifactId, response }
          }
        ]
      },
      new AbortController().signal
    )
    expect(receipt?.failure).toBeUndefined()
    expect(receipt?.actionResults[0].result).toMatchObject({
      status: 'complete'
    })
    return { canonical, result: receipt?.actionResults[0].result }
  } finally {
    await runtime.dispose()
  }
}

// Observe normalization before Scene Tree entry and result forwarding after return.
// Owner construction, UI snapshots and receipt aggregation are excluded from waste.
const observeResults = () => {
  const originalScene = scene.addNewElements
  const originalApp = elementApis.createElementsInParent
  const originalCore = core.createElementsInParent
  const originalMap = Array.prototype.map
  interface Normalization {
    source: Parameters<typeof originalCore>[0]
    delivered?: Parameters<typeof originalScene>[0]
    maps: { source: readonly unknown[]; result: unknown[]; visits: number }[]
  }
  let normalization: Normalization | undefined
  const normalizations: Normalization[] = []
  // Track only the caller batch and arrays derived from it, before Scene Tree
  // admission. All callbacks still run, including the actual normalization owner.
  const mapping = vi.spyOn(Array.prototype, 'map').mockImplementation(function (
    this: unknown[],
    callback,
    thisArg
  ) {
    const observation = normalization
    if (
      !observation ||
      (this !== observation.source &&
        !observation.maps.some(({ result }) => result === this))
    )
      return Reflect.apply(originalMap, this, [callback, thisArg])
    let visits = 0
    const result = Reflect.apply(originalMap, this, [
      (value: unknown, index: number, source: unknown[]) => {
        visits++
        return Reflect.apply(callback, thisArg, [value, index, source])
      }
    ])
    observation.maps.push({ source: this, result, visits })
    return result
  })
  const coreCreation = vi
    .spyOn(core, 'createElementsInParent')
    .mockImplementation(function (...args) {
      normalization = { source: args[0], maps: [] }
      try {
        return originalCore.apply(core, args)
      } finally {
        normalization = undefined
      }
    })
  const freeze = Object.freeze
  let insideApp = false
  let active: readonly string[] | undefined
  let arrays = 0,
    entries = 0
  const pairs: { owner: readonly string[]; app: readonly string[] | null }[] =
    []
  const owner = vi.spyOn(scene, 'addNewElements').mockImplementation(function (
    ...args
  ) {
    if (normalization) {
      normalization.delivered = args[0]
      normalizations.push(normalization)
      normalization = undefined
    }
    const result = originalScene.apply(scene, args)
    if (insideApp) active = result
    return result
  })
  const freezing = vi.spyOn(Object, 'freeze').mockImplementation(((
    value: unknown
  ) => {
    if (
      active &&
      value !== active &&
      Array.isArray(value) &&
      value.length === active.length &&
      value.every((id, i) => id === active?.[i])
    ) {
      arrays++
      entries += value.length
    }
    return freeze(value)
  }) as typeof Object.freeze)
  const app = vi
    .spyOn(elementApis, 'createElementsInParent')
    .mockImplementation(function (...args) {
      active = undefined
      insideApp = true
      try {
        const result = originalApp.apply(elementApis, args)
        if (active) pairs.push({ owner: active, app: result })
        return result
      } finally {
        insideApp = false
        active = undefined
      }
    })
  return {
    pairs,
    normalizations,
    inputCounts: () => {
      let envelopes = 0,
        intermediateArrays = 0,
        secondPassVisits = 0,
        normalizationVisits = 0
      for (const { source, delivered, maps } of normalizations) {
        for (const projection of maps) {
          if (projection.source === source)
            normalizationVisits += projection.visits
          else secondPassVisits += projection.visits
          if (projection.result !== delivered) {
            intermediateArrays++
            envelopes += projection.result.length
          }
        }
      }
      return {
        envelopes,
        intermediateArrays,
        secondPassVisits,
        normalizationVisits
      }
    },
    counts: () => ({ batches: pairs.length, arrays, entries }),
    restore: () => {
      app.mockRestore()
      freezing.mockRestore()
      owner.mockRestore()
      coreCreation.mockRestore()
      mapping.mockRestore()
    }
  }
}

it.each(saved.cases)(
  'forwards immutable owner results through the real saved creation flow: $name',
  async ({ input }) => {
    reset()
    const work = observeResults()
    try {
      const { canonical, result } = await create(input.draft, 'compact')
      const ids = canonical.entries.map((entry) => entry.descriptor.id)
      expect(result).toMatchObject({
        status: 'complete',
        appliedElementCount: ids.length
      })
      expect(result).not.toHaveProperty('appliedElementIds')
      expect(work.pairs.flatMap(({ owner }) => [...owner])).toEqual(ids)
      const document = await core.save()
      expect(
        Object.keys(document.sceneTree.elements)
          .filter((id) => id !== 'workspace')
          .sort()
      ).toEqual([...ids].sort())
      for (const { owner, app } of work.pairs) {
        expect(app).toEqual(owner)
        expect(Object.isFrozen(owner)).toBe(true)
        expect(Object.isFrozen(app)).toBe(true)
      }
      const counts = work.counts()
      for (const { source, delivered } of work.normalizations) {
        expect(delivered).toEqual(
          source.map((descriptor) => ({
            visible: true,
            lock: false,
            ...descriptor
          }))
        )
        expect(delivered).not.toBe(source)
        delivered?.forEach((descriptor, index) => {
          expect(descriptor).not.toBe(source[index])
        })
      }
      expect(work.normalizations).toHaveLength(counts.batches)
      const inputCounts = work.inputCounts()
      expect(inputCounts.normalizationVisits).toBe(ids.length)
      console.info(
        JSON.stringify({
          measurement: 'creation-result-copies',
          nodes: ids.length,
          ...counts,
          input: inputCounts
        })
      )
      expect(counts.arrays).toBe(0)
      expect(counts.entries).toBe(0)
      for (const { owner, app } of work.pairs) expect(app).toBe(owner)
      expect(inputCounts).toEqual({
        normalizationVisits: ids.length,
        envelopes: 0,
        intermediateArrays: 0,
        secondPassVisits: 0
      })
    } finally {
      work.restore()
      factory.transact.reset()
    }
  },
  60000
)

it.each(['compact', 'full'] as const)(
  'preserves %s receipts and old result snapshots across later creation, history and reload',
  async (response) => {
    reset()
    const work = observeResults()
    try {
      const draft = {
        type: 'group',
        name: 'Independent results',
        children: [
          { key: 'first', type: 'rect', name: 'First', width: 10, height: 20 },
          {
            key: 'second',
            type: 'oval',
            name: 'Second',
            x: 20,
            width: 10,
            height: 20
          }
        ]
      }
      const { canonical, result } = await create(draft, response)
      const expected = canonical.entries.map((entry) => entry.descriptor.id)
      if (response === 'full')
        expect(result).toMatchObject({ appliedElementIds: expected })
      else
        expect(result).toMatchObject({ appliedElementCount: expected.length })
      const savedPairs = work.pairs.slice()
      const snapshots = savedPairs.map(({ owner }) => [...owner])
      expect(new Set(savedPairs.map(({ owner }) => owner)).size).toBe(
        savedPairs.length
      )
      draft.children.reverse()
      const source = [{ id: 'later', type: 'rect', width: 2, height: 3 }]
      let later: readonly string[] = []
      transactionApis.runTransaction(() => {
        later = core.createElementsInParent(source, canonical.rootId)
      })
      source[0].id = 'changed-input'
      expect(later).toEqual(['later'])
      expect(Object.isFrozen(later)).toBe(true)
      expect(() => (later as string[]).push('forbidden')).toThrow()
      const document = await core.save()
      await factory.undo()
      expect(core.getElementMetadata('later')).toBeUndefined()
      await factory.redo()
      expect(core.getElementMetadata('later')).toBeDefined()
      core.load(document)
      expect((await core.save()).sceneTree).toEqual(document.sceneTree)
      expect(savedPairs.map(({ owner }) => [...owner])).toEqual(snapshots)
      expect(savedPairs.map(({ app }) => [...(app ?? [])])).toEqual(snapshots)
      expect(later).toEqual(['later'])
      expect(elementApis.createElementsInParent([], '')).toEqual([])
      expect(
        elementApis.createElementsInParent(
          [canonical.entries[0].descriptor],
          ''
        )
      ).toBeNull()
      expect(() =>
        core.createElementsInParent([{ type: 'rect' }], 'absent')
      ).toThrow()
      expect(await core.save()).toEqual(document)
      expect(work.counts().arrays).toBe(0)
      for (const { owner, app } of savedPairs) expect(app).toBe(owner)
    } finally {
      work.restore()
      factory.transact.reset()
    }
  }
)

it('executes the delivered small-part example without criteria or research and permits later adjustment', async () => {
  reset()
  const { createLocalDesignWorkflow } = await import('../local-design-workflow')
  const { invokeLocalTool } = await import('../local-tool-invocation')
  const { createBasicApiActions } =
    await import('../../src/ai/basic-api-actions')
  const { observeAiAction } = await import('../../src/ai/runtime-input')
  const creation = createPreparedDesignAction(undefined, async () => undefined)
  const { createDesignReviewer } =
    await import('../../src/common-apis/design-review')
  const { createDesignReviewAction } =
    await import('../../src/ai/review-action')
  const reviewer = createDesignReviewer()
  try {
    const actions = [
      creation,
      createDesignReviewAction(reviewer.capture, reviewer.isCurrent),
      ...createBasicApiActions()
    ].map((action) => observeAiAction(action))
    const descriptions = actions.map(createAiToolContract)
    const source = createLocalDesignTools(descriptions)
    const operations = createLocalOperationTools(
      descriptions,
      source,
      async (batch) => ({
        context: {},
        actionResults: await Promise.all(
          batch.actions.map(async (a) => ({
            actionId: a.id,
            actionName: a.name,
            result: (await (() => {
              const owner = actions.find((d) => d.name === a.name)
              if (!owner) throw new Error('Missing action owner')
              return owner.execute(a.arguments, { signal })
            })()) as never
          }))
        )
      }),
      {
        getNativeTools: () =>
          main.definitions.map((d) => ({ ...d, namespace: 'design' }))
      }
    )
    const main = createLocalDesignWorkflow(source, operations)
    const signal = new AbortController().signal
    const discovery = operations.definitions.find(
      (d) => d.name === 'describe_design_apis'
    )
    if (!discovery) throw new Error('Missing discovery')
    let page = JSON.parse(
      (
        await invokeLocalTool(
          operations,
          discovery,
          {
            names: ['prepare_and_apply_design'],
            view: 'usage',
            inputScope: { operation: 'draft', nodeTypes: ['vector'] }
          },
          signal
        )
      ).text
    )
    let text = ''
    while (page.contentDelivery) {
      text += page.contentDelivery.text
      const next = page.contentDelivery.next
      if (!next) break
      page = JSON.parse(
        (await invokeLocalTool(operations, discovery, next.arguments, signal))
          .text
      )
    }
    const example = (text ? JSON.parse(text) : page).tools[0].invocationExample
      .invocation
    expect(example.arguments.plan).toBeUndefined()
    const created = JSON.parse(
      (
        await invokeLocalTool(
          main,
          main.definitions[0],
          { ...example.arguments, inspection: 'defer' },
          signal
        )
      ).text
    )
    // A headless owner fixture has no pixel projection; follow-up review may be
    // partial, but it cannot gate or undo the acknowledged visible creation.
    expect(created.toolOutcome.settlement, JSON.stringify(created)).toBe(
      'completed'
    )
    expect(created.actionResults[0].result.status).toBe('complete')
    const child = core.getElementChildren(
      created.actionResults[0].result.compositionId
    ).elementIds[0]
    expect(core.getElementComputedData(child)?.width).toBeGreaterThan(0)
    const before = await core.save()
    const edit = actions.find(
      (d) => d.name === 'api_element_patchElementProperties'
    )
    if (!edit) throw new Error('Missing edit owner')
    const changed = (await edit.execute(
      {
        patches: [{ elementId: child, values: { x: 40, y: 50 }, records: [] }]
      },
      { signal }
    )) as { toolOutcome: { status: string } }
    expect(changed.toolOutcome.status).toBe('success')
    expect(core.getElementComputedData(child)?.x).toBe(40)
    expect((await core.save()).sceneTree.elements[child].id).toBe(
      before.sceneTree.elements[child].id
    )
  } finally {
    reviewer.dispose()
  }
})
