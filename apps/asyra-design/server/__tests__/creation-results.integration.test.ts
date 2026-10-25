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

// Observe the actual synchronous return interval. Owner construction, UI snapshots
// and later tool-receipt aggregation are outside this interval, not counted as waste.
const observeResults = () => {
  const originalScene = scene.addNewElements
  const originalApp = elementApis.createElementsInParent
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
    counts: () => ({ batches: pairs.length, arrays, entries }),
    restore: () => {
      app.mockRestore()
      freezing.mockRestore()
      owner.mockRestore()
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
      console.info(
        JSON.stringify({
          measurement: 'creation-result-copies',
          nodes: ids.length,
          ...counts
        })
      )
      expect(counts.arrays).toBe(0)
      expect(counts.entries).toBe(0)
      for (const { owner, app } of work.pairs) expect(app).toBe(owner)
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
