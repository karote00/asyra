// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
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
    if (id === failure) throw new Error('Injected renderer failure')
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
          if (!definition) throw new Error('Unexpected action: ' + action.name)
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
    if (!definition) throw new Error('Missing tool ' + name)
    const reply = await invokeLocalTool(tools, definition, input, signal)
    return JSON.parse(reply.text)
  }
  try {
    const guide = tools.definitions.find(
      (entry) => entry.name === 'review_drawing'
    )
    if (!guide) throw new Error('Missing review tool')
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
