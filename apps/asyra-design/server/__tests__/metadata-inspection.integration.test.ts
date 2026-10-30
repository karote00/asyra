import { readFileSync } from 'node:fs'
import { beforeAll, afterAll, expect, it, vi } from 'vitest'
import core from '@asyra/core'
import factory from '@asyra/factory'
import { applyPreset, PresetDefaults, PresetProfiles } from '@asyra/preset'
import {
  createAiAgentRuntime,
  createAiToolContract
} from '@asyra/ai-agent-runtime'
import { createLocalDesignTools } from '../local-design-tools'
import { createDesignPreparationSession } from '../design-preparation'
import { createLocalOperationTools } from '../local-operation-tools'
import { AiDesignToolIds } from '../../src/constants/ai-design'
import type {
  AiActionBatch,
  AiBatchReceipt
} from '../../src/ai/action-batch-protocol'

const saved = JSON.parse(
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
    source: { providerSequence: number }
    input: { draft: unknown }
  }[]
}
let createAction: typeof import('../../src/ai/design-actions').createPreparedDesignAction
let createRunner: typeof import('../../src/ai/transaction').createAiTransactionRunner
let createEvidence: typeof import('../../src/common-apis/inspection-evidence').createInspectionEvidence
beforeAll(async () => {
  vi.stubGlobal('window', {})
  createAction = (await import('../../src/ai/design-actions'))
    .createPreparedDesignAction
  createRunner = (await import('../../src/ai/transaction'))
    .createAiTransactionRunner
  createEvidence = (await import('../../src/common-apis/inspection-evidence'))
    .createInspectionEvidence
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
afterAll(() => vi.unstubAllGlobals())

it.each(
  saved.cases.filter((entry) =>
    [483, 546].includes(entry.source.providerSequence)
  )
)(
  'keeps live inspection dependencies without copying child lists while applying $name',
  async (input) => {
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
    const action = createAction(undefined, async () => undefined)
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
      transactionRunner: createRunner()
    })
    const dispatch = vi.fn(async (batch: AiActionBatch) => {
      pending = JSON.parse(JSON.stringify(batch))
      receipt = undefined
      await runtime.run({
        intent: 'Create editable objects',
        signal: new AbortController().signal
      })
      if (!receipt) {
        throw new Error('Missing canonical receipt')
      }
      return receipt
    })
    const operations = createLocalOperationTools(definitions, tools, dispatch)
    const run = async (draft: unknown, parentId?: string) => {
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
              arguments: {
                artifactId: prepared.artifactId,
                response: 'full',
                ...(parentId ? { parentId } : {})
              }
            }
          ]
        },
        new AbortController().signal
      )
      expect(receipt?.failure).toBeUndefined()
      expect(receipt?.actionResults[0].result).toMatchObject({
        status: 'complete',
        compositionId: canonical.rootId
      })
      return {
        canonical,
        result: receipt?.actionResults[0].result as {
          appliedElementIds: string[]
          timing: {
            sliceCount: number
            totalMs: number
            canonicalWork: { counters: Record<string, number> }
          }
        }
      }
    }
    const evidence = createEvidence()
    try {
      const seed = await run({
        type: 'group',
        key: 'inspected',
        name: 'Inspected sibling',
        children: [
          {
            type: 'rect',
            key: 'detail',
            name: 'Detail',
            width: 20,
            height: 30,
            fill: '#123456'
          }
        ]
      })
      const captured = await evidence.capture(() => ({ available: true }), {
        elementId: seed.canonical.rootId
      })
      expect(evidence.isCurrent(captured.evidence)).toBe(true)
      const before = await core.save()
      const applied = await run(input.input.draft)
      const counters = applied.result.timing.canonicalWork.counters
      const copies = counters['scene-tree:membership:snapshot-items'] ?? 0
      console.info(
        JSON.stringify({
          measurement: 'metadata-inspection',
          case: input.name,
          elements: applied.canonical.entries.length,
          slices: applied.result.timing.sliceCount,
          copiedChildIds: copies,
          ownerMs: applied.result.timing.totalMs
        })
      )
      expect(evidence.isCurrent(captured.evidence)).toBe(true)
      expect(dispatch).toHaveBeenCalledTimes(2)
      expect(applied.result.appliedElementIds).toEqual(
        applied.canonical.entries.map((entry) => entry.descriptor.id)
      )
      expect(
        core.getElementMetadata(applied.canonical.rootId)?.childCount
      ).toBe(applied.canonical.entries.length - 1)
      const created = await core.save()
      expect(
        created.sceneTree.elements[applied.canonical.rootId].children
      ).toEqual(
        applied.canonical.entries.slice(1).map((entry) => entry.descriptor.id)
      )
      expect(core.getElementMetadata('workspace')?.childCount).toBe(2)
      expect(
        core.getElementMetadata(seed.canonical.entries[1].descriptor.id)
          ?.childCount
      ).toBe(0)
      factory.undo()
      expect((await core.save()).sceneTree).toEqual(before.sceneTree)
      expect(core.getElementMetadata(applied.canonical.rootId)).toBeUndefined()
      expect(core.getElementMetadata('workspace')?.childCount).toBe(1)
      expect(evidence.isCurrent(captured.evidence)).toBe(true)
      factory.redo()
      expect((await core.save()).sceneTree).toEqual(created.sceneTree)
      expect(core.getElementMetadata('workspace')?.childCount).toBe(2)
      const siblingCapture = await evidence.capture(
        () => ({ available: true }),
        { elementId: applied.canonical.rootId }
      )
      await run(
        {
          type: 'group',
          name: 'New inspected member',
          children: [
            { type: 'rect', key: 'detail', name: 'Detail', width: 4, height: 5 }
          ]
        },
        seed.canonical.rootId
      )
      expect(evidence.isCurrent(captured.evidence)).toBe(false)
      expect(evidence.isCurrent(siblingCapture.evidence)).toBe(true)
      core.load(created)
      expect(evidence.isCurrent(siblingCapture.evidence)).toBe(false)
      expect((await core.save()).sceneTree).toEqual(created.sceneTree)
      expect(
        core.getElementMetadata(applied.canonical.rootId)?.childCount
      ).toBe(applied.canonical.entries.length - 1)
      // Assert after semantic checks so the red run also establishes preservation.
      expect(copies).toBe(0)
    } finally {
      evidence.dispose()
      factory.transact.reset()
    }
  },
  60000
)
