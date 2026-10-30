// @vitest-environment jsdom
import { beforeAll, expect, it, vi } from 'vitest'
import { applyPreset, PresetDefaults, PresetProfiles } from '@asyra/preset'
import { Group } from '@asyra/scene-tree'
import factory from '@asyra/factory'
import fixture from './fixtures/recorded-101/workspace-inspection-20261024.json'
import core from '../../src/contexts'
import {
  createAiInspectionAction,
  createInspectionValidationAction
} from '../../src/ai/inspection'
import { createInspectionEvidence } from '../../src/common-apis/inspection-evidence'
import { observeAiAction } from '../../src/ai/runtime-input'
import { createLocalOperationTools } from '../local-operation-tools'
import { invokeLocalTool } from '../local-tool-invocation'

beforeAll(() => {
  applyPreset(core, {
    profile: PresetProfiles.CUSTOM,
    defaults: [
      PresetDefaults.BASIC_SHAPES,
      PresetDefaults.CONTAINERS,
      PresetDefaults.SELECTION,
      PresetDefaults.UI_CONTEXT
    ]
  })
})

it('uses actual inspection owners through native review and retries only failed captures', async () => {
  const original = {
    getElementData: core.getElementData,
    getElementMetadata: core.getElementMetadata,
    getCurrentWorkspaceId: core.getCurrentWorkspaceId,
    captureElementSnapshot: core.captureElementSnapshot
  }
  let changed: (() => void) | undefined
  const evidence = createInspectionEvidence((listener) => {
    changed = listener
    return () => undefined
  })
  const targets = new Map([
    [
      'sheet-a',
      {
        id: 'sheet-a',
        type: 'workspace',
        parentId: '',
        children: ['part-a', 'part-b']
      }
    ],
    [
      'part-a',
      { id: 'part-a', type: 'group', parentId: 'sheet-a', children: [] }
    ],
    [
      'part-b',
      { id: 'part-b', type: 'group', parentId: 'sheet-a', children: [] }
    ]
  ])
  core.getElementData = vi.fn((id) => targets.get(id) as never)
  core.getElementMetadata = vi.fn((id) => {
    const target = targets.get(id)
    return target
      ? {
          id: target.id,
          type: target.type,
          name: target.id,
          parentId: target.parentId,
          visible: true,
          lock: false,
          childCount: target.children.length
        }
      : undefined
  })
  core.getCurrentWorkspaceId = () => 'sheet-a'
  let failure = 'part-b'
  core.captureElementSnapshot = vi.fn((id) => {
    if (id === failure) {
      throw new Error('Injected renderer failure')
    }
    return {
      type: 'snapshot',
      width: 2,
      height: 2,
      bounds: { x: 0, y: 0, width: 2, height: 2 },
      dataUrl: 'data:image/png;base64,AA=='
    }
  })
  const actions = [
    createAiInspectionAction(undefined, evidence),
    createInspectionValidationAction(evidence)
  ].map((definition) => observeAiAction(definition))
  const signal = new AbortController().signal
  const dispatched: string[] = []
  const tools = createLocalOperationTools(
    actions,
    { modelActions: (value) => value, resolveBatch: (value) => value },
    async (batch) => ({
      context: {},
      actionResults: await Promise.all(
        batch.actions.map(async (action) => {
          dispatched.push(action.name)
          const definition = actions.find((entry) => entry.name === action.name)
          if (!definition) {
            throw new Error('Unexpected action: ' + action.name)
          }
          return {
            actionId: action.id,
            actionName: action.name,
            result: (await definition.execute(action.arguments, {
              signal
            } as never)) as never
          }
        })
      )
    }),
    {
      getNativeTools: () =>
        tools.definitions.map((definition) => ({
          ...definition,
          namespace: 'design'
        }))
    }
  )
  const call = async (name: string, input: unknown) => {
    const definition = tools.definitions.find((entry) => entry.name === name)
    if (!definition) {
      throw new Error('Missing tool ' + name)
    }
    const reply = await invokeLocalTool(tools, definition, input, signal)
    return JSON.parse(reply.text)
  }
  try {
    const guide = tools.definitions.find(
      (entry) => entry.name === 'review_drawing'
    )
    if (!guide) {
      throw new Error('Missing review tool')
    }
    expect(guide.description).toMatch(/workspace.*overview/i)
    const delivered = await call('describe_design_apis', {
      names: ['review_drawing'],
      schemaPaths: ['/properties/inspections/items/properties/elementId']
    })
    expect(JSON.stringify(delivered)).toContain('actual current workspace ID')
    await call('define_design_criteria', {
      method: 'Inspect independent roots',
      references: [],
      structureCriteria: [],
      detailRequired: false,
      criteria: {
        overall: {
          description: 'Whole scene',
          requirement: 'Whole scene',
          verification: 'visual',
          requiredUnits: []
        },
        detail: {
          description: 'Native detail',
          requirement: 'Native detail',
          verification: 'visual',
          requiredUnits: []
        }
      }
    })
    const input = structuredClone(fixture.input)
    input.inspections[0].elementId = 'sheet-a'
    const overview = await call('review_drawing', input)
    expect(overview).toMatchObject({
      accepted: false,
      reviewOperation: 'capture',
      toolOutcome: { status: 'success', settlement: 'completed' }
    })
    expect(overview.inspectionIds).toHaveLength(1)
    expect(core.captureElementSnapshot).toHaveBeenCalledTimes(1)
    const failed = await call('review_drawing', {
      phase: 'visual',
      final: false,
      inspections: [
        { elementId: 'part-b', checks: [{ criterionId: 'overall' }] }
      ]
    })
    expect(failed).toMatchObject({
      available: false,
      accepted: false,
      toolOutcome: { status: 'failed', settlement: 'completed' },
      failedInspections: [{ code: 'CAPTURE_UNAVAILABLE' }]
    })
    expect(JSON.stringify(failed)).not.toContain('"unknown"')
    const mixed = await call('review_drawing', {
      phase: 'visual',
      final: false,
      inspectionIds: overview.inspectionIds,
      inspections: failed.failedInspections.map(
        (entry: { inspection: unknown }) => entry.inspection
      )
    })
    expect(mixed.toolOutcome).toMatchObject({
      status: 'partial',
      settlement: 'completed'
    })
    expect(mixed.inspectionIds).toEqual(overview.inspectionIds)
    failure = ''
    const recovered = await call('review_drawing', {
      phase: 'visual',
      final: false,
      inspectionIds: mixed.inspectionIds,
      inspections: mixed.failedInspections.map(
        (entry: { inspection: unknown }) => entry.inspection
      )
    })
    expect(recovered.toolOutcome).toMatchObject({
      status: 'success',
      settlement: 'completed'
    })
    expect(recovered.inspectionIds).toHaveLength(2)
    expect(
      vi
        .mocked(core.captureElementSnapshot)
        .mock.calls.filter(([id]) => id === 'sheet-a')
    ).toHaveLength(1)
    expect(
      dispatched.every((name) =>
        ['inspect_drawing', 'validate_inspection_evidence'].includes(name)
      )
    ).toBe(true)
    const standalone = actions[0]
    expect(
      await standalone.execute({ elementId: 'missing' }, { signal } as never)
    ).toMatchObject({
      available: false,
      toolOutcome: { status: 'failed', settlement: 'completed' }
    })
    for (const inspection of [
      { elementId: 'missing' },
      { elementId: 'sheet-a', view: 'detail' },
      { elementId: 'sheet-a', region: { x: 0, y: 0, width: 1, height: 1 } }
    ]) {
      const unavailable = await call('review_drawing', {
        phase: 'visual',
        final: false,
        inspections: [{ ...inspection, checks: [{ criterionId: 'overall' }] }]
      })
      expect(unavailable).toMatchObject({
        available: false,
        accepted: false,
        toolOutcome: { status: 'failed', settlement: 'completed' }
      })
      expect(unavailable.failedInspections[0].code).toBeTruthy()
      expect(unavailable.inspectionIds).toEqual([])
    }
    const prior = overview.actionResults[0].result.evidence
    changed?.()
    expect(evidence.validate(prior).current).toBe(false)
    const controller = new AbortController()
    controller.abort()
    const before = vi.mocked(core.captureElementSnapshot).mock.calls.length
    await expect(
      standalone.execute({ elementId: 'sheet-a' }, {
        signal: controller.signal
      } as never)
    ).rejects.toThrow()
    expect(core.captureElementSnapshot).toHaveBeenCalledTimes(before)
  } finally {
    evidence.dispose()
    Object.assign(core, original)
  }
})

it.each([2, 2310, 6163])(
  'preflights actual canonical targets without full snapshots for %i children',
  async (childCount) => {
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
    const { transactionApis } = await import('../../src/common-apis')
    const { rootId, childIds } = transactionApis.runTransaction(() => {
      const rootId = core.createElementInParent(
        { type: 'group', name: 'Inspection target' },
        'workspace'
      )
      const childIds = core.createElementsInParent(
        Array.from({ length: childCount }, (_, index) => ({
          type: 'rect',
          name: 'Member ' + index,
          x: index * 5,
          y: 0,
          width: 4,
          height: 5
        })),
        rootId
      )
      return { rootId, childIds }
    })
    const document = await core.save()
    const history = core.getUndoHistoryDepth()
    const selected = core.getSelectedElementIds()
    const published = vi.fn()
    const stop = core.subscribeToSharedPublication(published)
    const saved = vi.spyOn(Group.prototype, 'save')
    const full = vi.spyOn(core, 'getElementData')
    const metadata = vi.spyOn(core, 'getElementMetadata')
    const clone = vi.spyOn(globalThis, 'structuredClone')
    const image = {
      type: 'snapshot' as const,
      width: 2,
      height: 2,
      bounds: { x: 0, y: 0, width: 2, height: 2 },
      dataUrl: 'data:image/png;base64,AA=='
    }
    // Only the pixel boundary is substituted; browser cases exercise its real owner.
    const capture = vi
      .spyOn(core, 'captureElementSnapshot')
      .mockReturnValue(image)
    const measurements: {
      fullReads: number
      groupSaves: number
      metadataReads: number
      copiedChildIds: number
      copiedPropertyRecords: number
    }[] = []
    const region = { x: 1, y: 2, width: 4, height: 5 }
    const attempts = [
      { elementId: rootId },
      { elementId: rootId, view: 'detail' as const },
      { elementId: rootId, region },
      { elementId: 'workspace', view: 'overview' as const },
      { elementId: childIds[0] }
    ]
    try {
      const action = createAiInspectionAction()
      for (const args of attempts) {
        saved.mockClear()
        full.mockClear()
        metadata.mockClear()
        clone.mockClear()
        capture.mockClear()
        const result = await action.execute(args, {
          signal: new AbortController().signal
        } as never)
        expect(result).toMatchObject({
          available: true,
          settlement: 'completed',
          image,
          partial: !!('region' in args && args.region),
          imageScope: 'region' in args ? 'region' : (args.view ?? 'overview')
        })
        expect(capture).toHaveBeenCalledExactlyOnceWith(args.elementId, 1024, {
          nativeResolution:
            !!('region' in args && args.region) || args.view === 'detail',
          ...('region' in args ? { region: args.region } : {})
        })
        const copiedChildIds = clone.mock.calls.reduce(
          (count, [value]) =>
            count +
            (Array.isArray(value?.children) ? value.children.length : 0),
          0
        )
        measurements.push({
          fullReads: full.mock.calls.length,
          groupSaves: saved.mock.calls.length,
          metadataReads: metadata.mock.calls.length,
          copiedChildIds,
          copiedPropertyRecords: clone.mock.calls.reduce(
            (count, [value]) => count + Object.keys(value?.props ?? {}).length,
            0
          )
        })
      }
    } finally {
      capture.mockRestore()
      clone.mockRestore()
      metadata.mockRestore()
      full.mockRestore()
      saved.mockRestore()
      stop()
    }
    expect(await core.save()).toEqual(document)
    expect(core.getUndoHistoryDepth()).toBe(history)
    expect(core.getSelectedElementIds()).toEqual(selected)
    expect(published).not.toHaveBeenCalled()
    // Complete independent reads remain ordered and detached after inspection.
    const complete = core.getElementData(rootId) as { children: string[] }
    expect(complete.children).toEqual(childIds)
    complete.children.reverse()
    expect(core.getElementChildren(rootId, 0, childCount).elementIds).toEqual(
      childIds
    )
    factory.transact.reset()
    console.info(
      JSON.stringify({
        measurement: 'inspection-target-preflight',
        childCount,
        measurements
      })
    )
    expect(measurements).toEqual(
      attempts.map(() => ({
        fullReads: 0,
        groupSaves: 0,
        metadataReads: 1,
        copiedChildIds: 0,
        copiedPropertyRecords: 0
      }))
    )
  },
  60000
)

it.each([false, true])(
  'settles actual workspace overview with unavailable child=%s without replay or recapture',
  async (unavailable) => {
    const { createDesignReviewer } =
      await import('../../src/common-apis/design-review')
    const { createDesignReviewAction } =
      await import('../../src/ai/review-action')
    const { transactionApis } = await import('../../src/common-apis')
    factory.transact.reset()
    core.load({
      version: '1.0.0',
      props: {},
      sceneTree: {
        workspace: 'scene',
        workspaceList: ['scene'],
        elements: {
          scene: {
            id: 'scene',
            type: 'workspace',
            name: 'Scene',
            parentId: '',
            children: [],
            visible: true,
            lock: false
          }
        }
      }
    })
    const children = transactionApis.runTransaction(() =>
      core.createElementsInParent(
        [
          { type: 'rect', x: -50, y: 0, width: 20, height: 30 },
          { type: 'rect', x: 100, y: 60, width: 40, height: 50 }
        ],
        'scene'
      )
    )
    expect(core.getElementComputedData('scene')).toEqual({})
    const computed = core.getElementComputedData.bind(core)
    const geometry = vi
      .spyOn(core, 'getElementComputedData')
      .mockImplementation((id, fields) =>
        unavailable && id === children[0] ? {} : computed(id, fields)
      )
    const document = await core.save()
    const history = core.getUndoHistoryDepth()
    const published = vi.fn()
    const stop = core.subscribeToSharedPublication(published)
    const evidence = createInspectionEvidence()
    const reviewer = createDesignReviewer(
      undefined,
      async () => undefined,
      true
    )
    // Rendering is covered by the existing browser snapshot cases. All scene,
    // evidence, mechanical, action and final-review owners below are real.
    const snapshot = vi.spyOn(core, 'captureElementSnapshot').mockReturnValue({
      type: 'snapshot',
      width: 2,
      height: 2,
      bounds: { x: -50, y: 0, width: 190, height: 110 },
      dataUrl: 'data:image/png;base64,AA=='
    })
    const actions = [
      createAiInspectionAction(undefined, evidence),
      createDesignReviewAction(reviewer.capture, reviewer.isCurrent),
      createInspectionValidationAction(evidence, reviewer)
    ].map((action) => observeAiAction(action))
    const signal = new AbortController().signal
    const dispatched: string[] = []
    const owner = createLocalOperationTools(
      actions,
      { modelActions: (a) => a, resolveBatch: (a) => a },
      async (batch) => {
        const actionResults = []
        for (const request of batch.actions) {
          dispatched.push(request.name)
          const action = actions.find((a) => a.name === request.name)
          if (!action) {
            throw new Error('Unexpected action')
          }
          actionResults.push({
            actionId: request.id,
            actionName: request.name,
            result: await action.execute(request.arguments, { signal } as never)
          })
        }
        return { context: {}, actionResults } as never
      }
    )
    const call = async (name: string, input: unknown) => {
      const definition = owner.definitions.find((a) => a.name === name)
      if (!definition) {
        throw new Error('Missing tool')
      }
      return JSON.parse(
        (await invokeLocalTool(owner, definition, input, signal)).text
      )
    }
    try {
      await call('define_design_criteria', {
        method: 'Check complete scene',
        references: [],
        structureCriteria: [],
        detailRequired: false,
        criteria: {
          overall: {
            requirement: 'Complete scene',
            description: 'Visible roots',
            verification: 'visual',
            requiredUnits: []
          }
        }
      })
      const capture = await call('review_drawing', {
        phase: 'visual',
        final: false,
        inspections: [
          { elementId: 'scene', checks: [{ criterionId: 'overall' }] }
        ]
      })
      expect(capture, JSON.stringify(capture)).toHaveProperty('next')
      expect(capture.next.arguments.checks).toHaveLength(1)
      const record = {
        ...capture.next.arguments,
        final: true,
        checks: capture.next.arguments.checks.map((check: object) => ({
          ...check,
          status: 'pass',
          evidence: 'Both roots visible in delivered overview'
        }))
      }
      const result = await call('review_drawing', record)
      if (unavailable) {
        expect(result).toMatchObject({
          accepted: false,
          status: 'partial',
          next: {
            tool: 'read_design_checks',
            arguments: { ids: ['measurement:scene'] }
          }
        })
        const pending = await call(result.next.tool, result.next.arguments)
        expect(pending.items).toHaveLength(1)
        expect(JSON.parse(pending.items[0].evidence).findings).toEqual([
          { kind: 'geometry-unavailable', elementId: children[0] }
        ])
      } else {
        expect(result).toMatchObject({
          accepted: true,
          coverage: { required: 1, passed: 1 }
        })
      }
      expect(
        dispatched.filter((name) => name === 'review_design')
      ).toHaveLength(1)
      if (unavailable) {
        geometry.mockImplementation(computed)
        const retained = await call(result.next.tool, result.next.arguments)
        const retry = await call('review_design', {
          arguments: { elementId: retained.items[0].scope[0] }
        })
        expect(retry.actionResults[0].result.verification.status).toBe('pass')
        expect(await call('review_drawing', record)).toMatchObject({
          accepted: true
        })
        expect(
          dispatched.filter((name) => name === 'review_design')
        ).toHaveLength(2)
      }
      expect(snapshot).toHaveBeenCalledTimes(1)
      if (!unavailable) {
        expect(
          (
            await call('read_design_checks', {
              view: 'details',
              includePassed: true
            })
          ).items
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: 'measurement:scene', status: 'pass' })
          ])
        )
      }
      expect(await core.save()).toEqual(document)
      expect(core.getUndoHistoryDepth()).toBe(history)
      expect(published).not.toHaveBeenCalled()
      const stamp = (await reviewer.capture('scene')).evidence
      if (!stamp) {
        throw new Error('Missing workspace receipt')
      }
      core.load(document)
      expect((await reviewer.validate(stamp)).current).toBe(false)
      expect(await core.save()).toEqual(document)
    } finally {
      snapshot.mockRestore()
      geometry.mockRestore()
      reviewer.dispose()
      evidence.dispose()
      stop()
    }
  }
)
