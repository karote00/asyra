// @vitest-environment jsdom
import { beforeAll, expect, it, vi } from 'vitest'
import { applyPreset, PresetDefaults, PresetProfiles } from '@asyra/preset'
import { Group } from '@asyra/scene-tree'
import factory from '@asyra/factory'
import {
  createAiAgentRuntime,
  createAiToolContract
} from '@asyra/ai-agent-runtime'
import core from '../../src/contexts'
import { transactionApis } from '../../src/common-apis/transaction'
import { createPreparedDesignAction } from '../../src/ai/design-actions'
import { createAiTransactionRunner } from '../../src/ai/transaction'
import { createDesignReviewAction } from '../../src/ai/review-action'
import { createInspectionValidationAction } from '../../src/ai/inspection'
import {
  createInspectionEvidence,
  observeInspectionChanges
} from '../../src/common-apis/inspection-evidence'
import { createDesignReviewer } from '../../src/common-apis/design-review'
import { observeAiAction } from '../../src/ai/runtime-input'
import { createLocalDesignTools } from '../local-design-tools'
import { createLocalOperationTools } from '../local-operation-tools'
import { createDesignPreparationSession } from '../design-preparation'
import { createDesignCheckResults } from '../design-check-results'
import { AiActionNames, AiDesignToolIds } from '../../src/constants'
import type {
  AiActionBatch,
  AiBatchReceipt
} from '../../src/ai/action-batch-protocol'
import saved from './fixtures/recorded-101/vector-delivery-20261025.json'
import type { InspectionEvidenceStamp } from '../../src/ai/inspection-evidence'

const evidenceOf = (result: { evidence?: InspectionEvidenceStamp }) => {
  if (!result.evidence) throw new Error('Missing coherent mechanical evidence')
  return result.evidence
}

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
const create = async (draft: unknown) => {
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
  const prepared = JSON.parse(
    await tools.call('prepare_design', { draft }, new AbortController().signal)
  )
  expect(prepared, JSON.stringify(prepared)).toHaveProperty('artifactId')
  const canonical = preparation.resolve(prepared.artifactId)
  await operations.call(
    AiDesignToolIds.EXECUTE_DESIGN_BATCH,
    {
      inspection: 'defer',
      operations: [
        { name: action.name, arguments: { artifactId: prepared.artifactId } }
      ]
    },
    new AbortController().signal
  )
  expect(receipt?.failure).toBeUndefined()
  expect(receipt?.actionResults[0].result).toMatchObject({ status: 'complete' })
  return canonical
}

const observeReads = () => {
  // Group directly extends the shared Element save owner. Spy without replacing
  // its implementation; both leaf saves and super.save calls remain real.
  const element = vi.spyOn(Object.getPrototypeOf(Group.prototype), 'save')
  const full = vi.spyOn(core, 'getElementData')
  const metadata = vi.spyOn(core, 'getElementMetadata')
  const children = vi.spyOn(core, 'getElementChildren')
  const clone = vi.spyOn(globalThis, 'structuredClone')
  return {
    targets: () =>
      [...full.mock.calls, ...metadata.mock.calls].map(([id]) => id),
    counts: () => ({
      fullReads: full.mock.calls.length,
      elementSaves: element.mock.calls.length,
      metadataReads: metadata.mock.calls.length,
      childQueries: children.mock.calls.map(([id]) => id),
      copiedPropertyReferences: clone.mock.calls.reduce(
        (n, [value]) =>
          n + (value?.props ? Object.keys(value.props).length : 0),
        0
      )
    }),
    restore: () =>
      [element, full, metadata, children, clone].forEach((spy) =>
        spy.mockRestore()
      )
  }
}

it.each(saved.cases)(
  'reviews $name through real owners without full snapshot copies',
  async ({ input }) => {
    reset()
    const canonical = await create(input.draft)
    const document = await core.save()
    const history = core.getUndoHistoryDepth()
    const selection = core.getSelectedElementIds()
    const publish = vi.fn()
    const stop = core.subscribeToSharedPublication(publish)
    const reviewer = createDesignReviewer(
      undefined,
      async () => undefined,
      true
    )
    // A full-read reference checks semantic equivalence, outside work measurement.
    const reference = createDesignReviewer(
      {
        read: (id) => core.getElementData(id),
        computed: (id, fields) => core.getElementComputedData(id, fields),
        measure: (ids) => core.measureElementContentBounds(ids),
        observeChanges: observeInspectionChanges
      },
      async () => undefined,
      true
    )
    const action = createDesignReviewAction(
      reviewer.capture,
      reviewer.isCurrent
    )
    let work: ReturnType<typeof observeReads> | undefined
    try {
      const expected = await createDesignReviewAction(
        reference.capture,
        reference.isCurrent
      ).execute({ elementId: canonical.rootId }, {
        signal: new AbortController().signal
      } as never)
      work = observeReads()
      const result = await action.execute({ elementId: canonical.rootId }, {
        signal: new AbortController().signal
      } as never)
      const counts = work.counts()
      work.restore()
      work = undefined
      const { evidence: _expectedEvidence, ...expectedFields } = expected
      const { evidence, ...actualFields } = result
      expect(actualFields).toEqual(expectedFields)
      expect(result).toMatchObject({
        complete: true,
        checkedElements: canonical.entries.length,
        verification: { status: 'pass' }
      })
      expect(evidence).toBeDefined()
      const coverage = await reviewer.coverage(evidenceOf(result))
      expect(coverage?.checks.map((check) => check.elementId)).toEqual(
        canonical.entries.map((entry) => entry.descriptor.id)
      )
      const repeated = await action.execute({ elementId: canonical.rootId }, {
        signal: new AbortController().signal
      } as never)
      expect(repeated.evidence).toEqual(evidence)
      expect(repeated.observation).toMatchObject({
        evaluatedNodes: 0,
        metadataReads: 0,
        computedReads: 0,
        reusedNodes: canonical.entries.length
      })
      expect(await core.save()).toEqual(document)
      expect(core.getUndoHistoryDepth()).toBe(history)
      expect(core.getSelectedElementIds()).toEqual(selection)
      expect(publish).not.toHaveBeenCalled()
      // Full-data reads and detached child observations remain independently valid.
      const full = core.getElementData(canonical.rootId)
      if (!full) throw new Error('Missing canonical root')
      expect(full.children).toEqual(
        document.sceneTree.elements[canonical.rootId].children
      )
      ;(full.children as string[]).reverse()
      expect(
        core.getElementChildren(canonical.rootId, 0, canonical.entries.length)
          .elementIds
      ).toEqual(document.sceneTree.elements[canonical.rootId].children)
      console.info(
        JSON.stringify({
          measurement: 'mechanical-structural-reads',
          nodes: canonical.entries.length,
          ...counts
        })
      )
      expect(counts).toEqual({
        fullReads: 0,
        elementSaves: 0,
        metadataReads: canonical.entries.length,
        childQueries: [canonical.rootId],
        copiedPropertyReferences: 0
      })
    } finally {
      work?.restore()
      reference.dispose()
      reviewer.dispose()
      stop()
      factory.transact.reset()
    }
  },
  60000
)

it('preserves complete membership, local validity and read-only state through undo, redo and reload', async () => {
  reset()
  const root = await create({
    type: 'frame',
    key: 'frame',
    name: 'Frame',
    width: 1000,
    height: 1000,
    children: [
      {
        type: 'group',
        key: 'group',
        name: 'Group',
        children: Array.from({ length: 65 }, (_, i) => ({
          type: 'rect',
          key: `leaf-${i}`,
          name: `Leaf ${i}`,
          width: 4,
          height: 5,
          x: i * 5
        }))
      },
      {
        type: 'oval',
        key: 'oval',
        name: 'Oval',
        x: 400,
        y: 400,
        width: 40,
        height: 20
      }
    ]
  })
  const ids = root.entries.map((entry) => entry.descriptor.id)
  const group = ids[1],
    leaf = ids[2],
    oval = ids[ids.length - 1]
  transactionApis.runTransaction(() =>
    core.updateElementProperties([
      { elementId: oval, values: { rotation: 0.4 } }
    ])
  )
  const reviewer = createDesignReviewer(undefined, async () => undefined, true)
  try {
    const initial = await reviewer.capture(root.rootId)
    expect(initial).toMatchObject({
      complete: true,
      findings: [],
      checkedElements: ids.length
    })
    expect(
      new Set(
        (await reviewer.coverage(evidenceOf(initial)))?.checks.map(
          (c) => c.elementId
        )
      )
    ).toEqual(new Set(ids))
    const independent = await reviewer.capture(oval)
    const beforeEdit = await core.save()
    transactionApis.runTransaction(() =>
      core.updateElementData(leaf, { visible: false })
    )
    const changed = await core.save()
    const history = core.getUndoHistoryDepth()
    const publish = vi.fn()
    const stop = core.subscribeToSharedPublication(publish)
    try {
      expect((await reviewer.validate(evidenceOf(independent))).current).toBe(
        true
      )
      const validationReads = observeReads()
      let readTargets: string[] = []
      const invalid = await reviewer
        .validate(evidenceOf(initial))
        .finally(() => {
          readTargets = validationReads.targets()
          validationReads.restore()
        })
      expect(new Set(readTargets)).toEqual(
        new Set([root.rootId, group, leaf, oval])
      )
      expect(invalid.current).toBe(false)
      expect(invalid.observation).toMatchObject({
        // The standalone oval receipt changed its traversal context: entering
        // the Frame again must also restore its containment verdict.
        evaluatedNodes: 4,
        reusedNodes: ids.length - 4
      })
      const refreshed = await reviewer.capture(root.rootId)
      expect(refreshed).toMatchObject({ complete: true, findings: [] })
      expect(await core.save()).toEqual(changed)
      expect(core.getUndoHistoryDepth()).toBe(history)
      expect(publish).not.toHaveBeenCalled()
    } finally {
      stop()
    }
    factory.undo()
    expect((await core.save()).sceneTree).toEqual(beforeEdit.sceneTree)
    factory.redo()
    expect((await core.save()).sceneTree).toEqual(changed.sceneTree)
    const old = await reviewer.capture(root.rootId)
    transactionApis.runTransaction(() =>
      core.createElementInParent({ type: 'rect', width: 3, height: 4 }, group)
    )
    expect((await reviewer.validate(evidenceOf(old))).current).toBe(false)
    expect((await reviewer.capture(root.rootId)).checkedElements).toBe(
      ids.length + 1
    )
    core.load(changed)
    expect((await reviewer.validate(evidenceOf(old))).current).toBe(false)
    expect((await core.save()).sceneTree).toEqual(changed.sceneTree)
    expect((await reviewer.capture(root.rootId)).checkedElements).toBe(
      ids.length
    )
  } finally {
    reviewer.dispose()
    factory.transact.reset()
  }
})

it('keeps successful mechanical results while retrying an interrupted read without replaying writes', async () => {
  reset()
  const root = await create({
    type: 'group',
    name: 'Read recovery',
    children: Array.from({ length: 205 }, (_, i) => ({
      type: 'rect',
      key: `member-${i}`,
      name: `Member ${i}`,
      x: i * 5,
      width: 4,
      height: 5
    }))
  })
  let abort: AbortController | undefined
  let mutate = false
  const reviewer = createDesignReviewer(
    undefined,
    async () => {
      abort?.abort()
      if (mutate) {
        mutate = false
        transactionApis.runTransaction(() =>
          core.updateElementData(root.entries[1].descriptor.id, {
            visible: false
          })
        )
      }
    },
    true
  )
  const visual = createInspectionEvidence()
  const actions = [
    createDesignReviewAction(reviewer.capture, reviewer.isCurrent),
    createInspectionValidationAction(visual, reviewer)
  ].map((action) => observeAiAction(action))
  const checks = createDesignCheckResults()
  const dispatched: string[] = []
  const owner = createLocalOperationTools(
    actions,
    {
      modelActions: (a) => a,
      resolveBatch: (a) => a,
      checkResults: checks
    },
    async (batch) => {
      const actionResults = []
      for (const item of batch.actions) {
        dispatched.push(item.name)
        const action = actions.find((a) => a.name === item.name)
        if (!action) throw new Error('Unexpected dispatched action')
        actionResults.push({
          actionId: item.id,
          actionName: item.name,
          result: await action.execute(
            item.arguments as never,
            { signal: new AbortController().signal } as never
          )
        })
      }
      return { context: {}, actionResults } as never
    }
  )
  const call = async (name: string, args: unknown = {}) =>
    JSON.parse(await owner.call(name, args, new AbortController().signal))
  try {
    const leaf = root.entries[1].descriptor.id
    await call(AiActionNames.REVIEW_DESIGN, { arguments: { elementId: leaf } })
    expect((await call('read_design_checks')).counts.pass).toBe(1)
    const document = await core.save()
    const history = core.getUndoHistoryDepth()
    abort = new AbortController()
    await expect(
      actions[0].execute(
        { elementId: root.rootId } as never,
        { signal: abort.signal } as never
      )
    ).rejects.toThrow()
    abort = undefined
    expect((await call('read_design_checks')).counts.pass).toBe(1)
    const completed = await call(AiActionNames.REVIEW_DESIGN, {
      arguments: { elementId: root.rootId }
    })
    expect(completed.mechanicalSelection).toBeDefined()
    expect(
      (await call('verify_design_checks', completed.mechanicalSelection))
        .verification.status
    ).toBe('pass')
    expect(await core.save()).toEqual(document)
    expect(core.getUndoHistoryDepth()).toBe(history)
    expect(
      dispatched.every((name) =>
        [
          AiActionNames.REVIEW_DESIGN,
          AiActionNames.VALIDATE_INSPECTION_EVIDENCE
        ].includes(name as never)
      )
    ).toBe(true)
    mutate = true
    const mixed = await reviewer.capture(root.rootId)
    expect(mixed).toMatchObject({ available: false, complete: false })
    expect(mixed.evidence).toBeUndefined()
    expect((await reviewer.capture(root.rootId)).complete).toBe(true)
    expect((await reviewer.capture('missing-target')).complete).toBe(false)
  } finally {
    visual.dispose()
    reviewer.dispose()
    factory.transact.reset()
  }
})
