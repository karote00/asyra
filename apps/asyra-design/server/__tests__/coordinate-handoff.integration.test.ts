// @vitest-environment jsdom
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { applyPreset, PresetDefaults, PresetProfiles } from '@asyra/preset'
import {
  createAiAgentRuntime,
  type AiProvider,
  createAiToolContract
} from '@asyra/ai-agent-runtime'
import render from '@asyra/render'
import { createAiActions } from '../../src/ai/actions'
import { elementApis } from '../../src/common-apis'
import factory from '@asyra/factory'
import core from '../../src/contexts'
import { createInspectionEvidence } from '../../src/common-apis/inspection-evidence'
import { createDesignAttachmentAction } from '../../src/ai/inspection'
import { createBasicApiActions } from '../../src/ai/basic-api-actions'
import { createAiTransactionRunner } from '../../src/ai/transaction'
import { createRetainedDesignContext } from '../../src/common-apis/retained-design-context'
import { observeDesignChanges } from '../../src/common-apis/design-review'
import { createDocumentContextReleaseAction } from '../../src/ai/context-action'
import { createLocalToolHost } from '../local-tool-host'
import { createLocalOperationTools } from '../local-operation-tools'
import { createLocalDesignTools } from '../local-design-tools'
import { LocalToolLibraryLimits } from '../local-tool-library-limits'
import type { AiActionBatch, AiBatchReceipt } from '@asyra/ai-agent-runtime'

import recorded from '../../test-data/ai-drawing/fixtures/coordinate-continuity-20261112.json'

beforeAll(async () => {
  applyPreset(core, {
    profile: PresetProfiles.CUSTOM,
    defaults: [
      PresetDefaults.BASIC_SHAPES,
      PresetDefaults.CONTAINERS,
      PresetDefaults.SELECTION
    ]
  })
  await core.start(document.createElement('div'), { width: 128, height: 128 })
})
afterAll(() => core.destroy())

it.each([
  { missing: false, rotation: 0, attachment: false },
  { missing: true, rotation: 0, attachment: false },
  { missing: false, rotation: Math.PI / 2, attachment: false },
  { missing: false, rotation: 0, attachment: true },
  { missing: false, rotation: Math.PI / 2, attachment: true },
  {
    missing: false,
    rotation: 0,
    attachment: true,
    attachmentParent: 'workspace'
  },
  {
    missing: false,
    rotation: 0,
    attachment: true,
    attachmentParent: 'missing-parent'
  }
])(
  'binds coordinate handoffs through the published wrapper: %j',
  async ({ missing, rotation, attachment, attachmentParent }) => {
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
    core.createElementInParent(
      { id: 'target', type: 'rect', width: 20, height: 40, x: 0, y: 0 },
      'workspace'
    )
    core.createElementInParent(
      {
        id: 'parent',
        type: 'group',
        x: recorded.parentOrigin.x,
        y: recorded.parentOrigin.y,
        width: 20,
        height: 40,
        rotation
      },
      'workspace'
    )
    elementApis.updateElementProperties(['parent'], { rotation })
    expect(core.getElementComputedData('parent', ['rotation'])?.rotation).toBe(
      rotation
    )
    const evidence = createInspectionEvidence()

    if (missing) {
      render.removeElement('parent')
    }

    const queries = createRetainedDesignContext(core, observeDesignChanges)
    const definitions = [
      ...createAiActions().filter((action) => action.name === 'report_outcome'),
      createDesignAttachmentAction(evidence),
      ...createBasicApiActions(undefined, undefined, queries).filter((a) =>
        [
          'api_core_workspaceToElementLocal',
          'api_element_setElementPositions'
        ].includes(a.name)
      ),
      createDocumentContextReleaseAction(queries.read)
    ]
    const calls: string[] = []
    let dispatch: (batch: AiActionBatch) => Promise<AiBatchReceipt>
    let outcome: { status: string } | undefined
    let resultText = ''
    const host = createLocalToolHost({
      requestId: 'coordinate-handoff',
      signal: new AbortController().signal,
      capacity: 32,
      receiptCapacity: 8,
      artifactCapacity: 64,
      limits: LocalToolLibraryLimits.recipe,
      store: {
        read: async () => undefined,

        list: async () => [],

        write: async () => {
          throw Error('No persistence')
        }
      },

      createGroups: (ownership) => {
        const contracts = definitions.map(createAiToolContract)
        const designs = createLocalDesignTools(contracts)
        const operations = createLocalOperationTools(
          contracts,
          designs,
          async (batch) => {
            calls.push(...batch.actions.map((a) => a.name))

            return dispatch(batch)
          },
          { ownership }
        )

        return [
          {
            name: 'design_operations',
            description: 'Design operations',
            owner: operations
          }
        ]
      }
    })

    let advertised: Awaited<ReturnType<typeof host.invoke>> | undefined
    const runtime = createAiAgentRuntime({
      provider: {
        requestActionBatch: async (_input, options) => {
          if (!options.executeBatch) {
            throw Error('Missing canonical executor')
          }

          dispatch = options.executeBatch
          try {
            if (attachment) {
              advertised = await host.invoke({
                name: 'design_operations.read_design_resources',
                input: { names: ['read_design_attachment'], view: 'full' }
              })
            }

            const reply = await host.invoke({
              name: 'design_operations.execute_design',
              input: {
                operations: [
                  ...(attachment
                    ? [
                        {
                          id: 'attachment',
                          name: 'read_design_attachment',
                          arguments: { parentId: attachmentParent ?? 'parent' }
                        }
                      ]
                    : []),
                  {
                    id: 'convert',
                    name: 'api_core_workspaceToElementLocal',
                    arguments: {
                      elementId: 'parent',
                      workspacePosition: attachment
                        ? {
                            x: {
                              kind: 'step',
                              step: 'attachment',
                              path: '/actionResults/0/result/bounds/x'
                            },
                            y: {
                              kind: 'step',
                              step: 'attachment',
                              path: '/actionResults/0/result/bounds/y'
                            }
                          }
                        : recorded.workspacePosition
                    }
                  },
                  {
                    id: 'apply',
                    name: 'api_element_setElementPositions',
                    arguments: {
                      positionsById: {
                        target: {
                          x: {
                            kind: 'step',
                            step: 'convert',
                            path: '/actionResults/0/result/value/x'
                          },
                          y: {
                            kind: 'step',
                            step: 'convert',
                            path: '/actionResults/0/result/value/y'
                          }
                        }
                      }
                    }
                  }
                ],
                inspection: 'defer'
              }
            })

            resultText = reply.text
            outcome = reply.outcome
          } finally {
            await host.dispose()
          }

          return {
            batchId: 'done',
            actions: [
              {
                id: 'report',
                name: 'report_outcome',
                summary: 'Report coordinate outcome',
                arguments: {
                  outcome:
                    missing || attachmentParent ? 'unsupported' : 'completed',
                  message: 'Coordinate handoff settled'
                }
              }
            ]
          }
        }
      },
      actionDefinitions: definitions,
      contextProvider: { getContext: async () => ({}) },
      permissionPolicy: { evaluate: () => 'allow' },
      confirmationHandler: { confirm: async () => true },
      transactionRunner: createAiTransactionRunner()
    })

    try {
      const runtimeResult = await runtime.run({
        intent: 'Convert and update the position',
        signal: new AbortController().signal
      })

      expect(runtimeResult.status, JSON.stringify(runtimeResult)).toBe(
        'executed'
      )
      if (attachment) {
        expect(advertised?.outcome.status, advertised?.text).toBe('success')
        expect(advertised?.text).toContain('"bounds"')
        expect(advertised?.text).toContain('"composition":"request"')
        expect(advertised?.text).toContain('"x-runtime-value":"request"')
      }

      if (attachmentParent) {
        expect(outcome?.status, resultText).not.toBe('success')
        expect(calls).toEqual(['read_design_attachment'])
        expect(core.getElementComputedData('target', ['x', 'y'])).toMatchObject(
          { x: 0, y: 0 }
        )
      } else if (missing) {
        expect(outcome?.status).not.toBe('success')
        expect(calls).toEqual(['api_core_workspaceToElementLocal'])
        expect(core.getElementComputedData('target', ['x', 'y'])).toMatchObject(
          { x: 0, y: 0 }
        )
      } else {
        expect(outcome?.status, resultText).toBe('success')
        expect(calls).toEqual([
          ...(attachment ? ['read_design_attachment'] : []),
          'api_core_workspaceToElementLocal',
          'api_element_setElementPositions',
          'release_design_context'
        ])
        let expected = recorded.localPosition

        if (rotation) {
          expected = {
            x: recorded.localPosition.y,
            y: -recorded.localPosition.x
          }
        }

        if (attachment) {
          expected = { x: 0, y: 0 }
        }

        const position = core.getElementComputedData('target', ['x', 'y'])

        expect(position?.x).toBeCloseTo(expected.x, 8)
        expect(position?.y).toBeCloseTo(expected.y, 8)
      }
    } finally {
      await host.dispose()
      await runtime.dispose()
      evidence.dispose()
      queries.dispose()
      factory.transact.reset()
    }
  }
)

it.each([
  { rotation: 0, outOfRange: false },
  { rotation: Math.PI / 2, outOfRange: false },
  { rotation: 0, outOfRange: true },
  { rotation: Math.PI / 2, outOfRange: false, nested: true },
  { rotation: Math.PI / 2, outOfRange: false, nested: true, local: true }
])(
  'creates a canonical parent then validates conversion, attachment and capture in one host request: %j',
  async ({ rotation, outOfRange, nested = false, local = false }) => {
    const { createPreparedDesignAction } =
      await import('../../src/ai/design-actions')
    const { createAiInspectionAction } = await import('../../src/ai/inspection')
    const { createLocalDesignWorkflow } =
      await import('../local-design-workflow')
    const { createDesignPreparationSession } =
      await import('../design-preparation')

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
    const ancestor = { x: 100, y: -200, rotation: Math.PI / 4 }

    if (nested) {
      core.createElementInParent(
        {
          id: 'ancestor',
          type: 'frame',
          ...ancestor,
          width: 100000,
          height: 100000
        },
        'workspace'
      )
    }

    const angle = nested ? ancestor.rotation : 0
    const c = Math.cos(angle),
      sn = Math.sin(angle)
    const origin = nested
      ? {
          x:
            ancestor.x +
            c * recorded.parentOrigin.x -
            sn * recorded.parentOrigin.y,
          y:
            ancestor.y +
            sn * recorded.parentOrigin.x +
            c * recorded.parentOrigin.y
        }
      : recorded.parentOrigin
    const dx = recorded.workspacePosition.x - origin.x
    const dy = recorded.workspacePosition.y - origin.y
    const total = angle + rotation
    const expected = {
      x: Math.cos(total) * dx + Math.sin(total) * dy,
      y: -Math.sin(total) * dx + Math.cos(total) * dy
    }
    const captures: string[] = []
    const evidence = createInspectionEvidence()
    const definitions = [
      ...createAiActions().filter((action) => action.name === 'report_outcome'),
      createPreparedDesignAction(undefined, async () => undefined),
      createDesignAttachmentAction(evidence),
      ...createBasicApiActions().filter((action) =>
        [
          'api_core_workspaceToElementLocal',
          'api_element_updateElementProperties'
        ].includes(action.name)
      ),
      createAiInspectionAction((id) => {
        captures.push(id)

        return {
          available: true,
          image: {
            dataUrl:
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+cZ1sAAAAASUVORK5CYII=',
            width: 1,
            height: 1
          }
        }
      })
    ]
    let dispatch: (batch: AiActionBatch) => Promise<AiBatchReceipt>
    const calls: string[] = []
    const host = createLocalToolHost({
      requestId: 'prepared-coordinate-continuity',
      signal: new AbortController().signal,
      capacity: 32,
      receiptCapacity: 8,
      artifactCapacity: 64,
      limits: LocalToolLibraryLimits.recipe,
      store: {
        read: async () => undefined,

        list: async () => [],

        write: async () => {
          throw Error('No library writes')
        }
      },

      createGroups: (ownership) => {
        const contracts = definitions.map(createAiToolContract)
        const designs = createLocalDesignTools(
          contracts,
          createDesignPreparationSession(undefined, undefined, ownership)
        )
        const operations = createLocalOperationTools(
          contracts,
          designs,
          async (batch) => {
            calls.push(...batch.actions.map((action) => action.name))

            // The browser returns detached JSON receipts across the HTTP boundary.
            return JSON.parse(JSON.stringify(await dispatch(batch)))
          },
          { ownership }
        )

        return [
          {
            name: 'design_operations',
            description: 'Operations',
            owner: operations
          },
          {
            name: 'design_workflow',
            description: 'Preparation and application',
            owner: createLocalDesignWorkflow(designs, operations)
          }
        ]
      }
    })
    let reply: Awaited<ReturnType<typeof host.invoke>> | undefined
    const requestActionBatch = vi.fn<AiProvider['requestActionBatch']>(
      async (_input, options) => {
        if (!options.executeBatch) {
          throw Error('Missing canonical executor')
        }

        dispatch = options.executeBatch
        const parent = {
          kind: 'step',
          step: 'parent',
          path: '/compositionIds/0'
        }

        reply = await host.invoke({
          name: 'design_operations.execute_design',
          input: {
            operations: [
              {
                id: 'parent',
                name: 'prepare_and_apply_design',
                arguments: {
                  ...(nested ? { parentId: 'ancestor' } : {}),
                  draft: {
                    type: 'group',
                    name: 'Parent',
                    key: 'parent',
                    children: [
                      {
                        type: 'rect',
                        key: 'base',
                        name: 'Base',
                        ...recorded.parentOrigin,
                        width: 20,
                        height: 40
                      }
                    ]
                  },
                  inspection: 'defer'
                }
              },
              {
                id: 'rotate',
                name: 'element.updateElementProperties',
                arguments: {
                  elementIds: {
                    kind: 'step',
                    step: 'parent',
                    path: '/compositionIds'
                  },
                  values: { rotation }
                }
              },
              {
                id: 'attachment',
                name: 'read_design_attachment',
                arguments: { parentId: parent }
              },
              ...(local
                ? []
                : [
                    {
                      id: 'convert',
                      name: 'core.workspaceToElementLocal',
                      arguments: {
                        elementId: {
                          kind: 'step',
                          step: 'attachment',
                          path: '/actionResults/0/result/parentId'
                        },
                        workspacePosition: outOfRange
                          ? { x: 1e15, y: 1e15 }
                          : recorded.workspacePosition
                      }
                    }
                  ]),
              {
                id: 'child',
                name: 'prepare_and_apply_design',
                arguments: {
                  parentId: parent,
                  inspection: 'defer',
                  draft: {
                    type: 'group',
                    name: 'Child',
                    key: 'child',
                    children: [
                      {
                        type: 'rect',
                        key: 'part',
                        name: 'Part',
                        width: 10,
                        height: 10,
                        x: local
                          ? expected.x
                          : {
                              kind: 'step',
                              step: 'convert',
                              path: '/actionResults/0/result/value/x'
                            },
                        y: local
                          ? expected.y
                          : {
                              kind: 'step',
                              step: 'convert',
                              path: '/actionResults/0/result/value/y'
                            }
                      }
                    ]
                  }
                }
              },
              {
                id: 'capture',
                name: 'inspect_drawing',
                arguments: { arguments: { elementId: parent } }
              }
            ],
            inspection: 'defer',
            delivery: {
              fields: {
                parent: { step: 'parent', path: '/compositionIds/0' },
                child: { step: 'child', path: '/compositionIds/0' }
              }
            }
          }
        })

        return {
          batchId: 'done',
          actions: [
            {
              id: 'report',
              name: 'report_outcome',
              summary: 'Report coordinate outcome',
              arguments: {
                outcome: outOfRange ? 'unsupported' : 'completed',
                message: 'Coordinate handoff settled'
              }
            }
          ]
        }
      }
    )
    const runtime = createAiAgentRuntime({
      provider: { requestActionBatch },
      actionDefinitions: definitions,
      contextProvider: { getContext: async () => ({}) },
      permissionPolicy: { evaluate: () => 'allow' },
      confirmationHandler: { confirm: async () => true },
      transactionRunner: createAiTransactionRunner()
    })

    try {
      const result = await runtime.run({
        intent: 'Attach a decided child in the existing world position',
        signal: new AbortController().signal
      })

      expect(result.status, JSON.stringify(result)).toBe('executed')
      if (!reply) {
        throw Error('Missing host reply')
      }

      if (outOfRange) {
        expect(reply.outcome, reply.text).toMatchObject({
          status: 'failed',
          settlement: 'partial'
        })
        const rejected = JSON.parse(reply.text)

        expect(rejected.completed).toEqual([
          'parent',
          'rotate',
          'attachment',
          'convert'
        ])
        expect(rejected.stopped).toEqual(['child'])
        expect(rejected.failure.execution.calls).toContainEqual(
          expect.objectContaining({
            stepId: 'child',
            status: 'failed',
            settlement: 'not-started',
            failure: expect.objectContaining({ stage: 'input' })
          })
        )

        expect(calls).toEqual([
          'apply_prepared_design',
          'api_element_updateElementProperties',
          'read_design_attachment',
          'api_core_workspaceToElementLocal'
        ])
        expect(captures).toEqual([])
        expect(core.getElementChildren('workspace', 0, 10).total).toBe(1)

        return
      }

      expect(reply?.outcome.status, reply?.text ?? JSON.stringify(result)).toBe(
        'success'
      )
      const fields = JSON.parse(reply.text).fields

      expect(
        core.getElementComputedData(fields.parent, ['rotation'])?.rotation
      ).toBeCloseTo(rotation, 8)

      expect(
        core.getElementComputedData(fields.parent, ['x', 'y'])
      ).toMatchObject(recorded.parentOrigin)
      expect(core.getElementMetadata(fields.child)?.parentId).toBe(
        fields.parent
      )
      const child = core.getElementComputedData(fields.child, ['x', 'y'])

      expect(child?.x).toBeCloseTo(expected.x, 8)
      expect(child?.y).toBeCloseTo(expected.y, 8)
      expect(captures).toEqual([fields.parent])
      expect(calls).toEqual([
        'apply_prepared_design',
        'api_element_updateElementProperties',
        'read_design_attachment',
        ...(local ? [] : ['api_core_workspaceToElementLocal']),
        'apply_prepared_design',
        'inspect_drawing'
      ])
      const parentView = render.viewport.getElementById(fields.parent)
      const childView = render.viewport.getElementById(fields.child)

      expect(childView?.parent).toBe(parentView)
      expect(parentView?.parent?.label).toBe(nested ? 'ancestor' : 'workspace')
      const world = core.elementLocalToWorkspace(fields.child, { x: 0, y: 0 })

      expect(world?.x).toBeCloseTo(recorded.workspacePosition.x, 7)
      expect(world?.y).toBeCloseTo(recorded.workspacePosition.y, 7)
      // Real property update, reload and query use the same canonical transform.
      elementApis.updateElementProperties([fields.parent], {
        rotation: rotation + 0.25
      })
      const updated = await evidence.attachment(fields.parent)
      const basis = updated.basis

      if (!Array.isArray(basis)) {
        throw Error('Current parent omitted its attachment basis')
      }

      expect(basis).toHaveLength(3)

      expect(basis[1].x - basis[0].x).toBeCloseTo(Math.cos(total + 0.25), 7)
      expect(basis[1].y - basis[0].y).toBeCloseTo(Math.sin(total + 0.25), 7)
      const saved = await core.save()

      core.load(saved)
      const reloaded = await evidence.attachment(fields.parent)

      expect(reloaded.basis).toEqual(updated.basis)
      expect(requestActionBatch).toHaveBeenCalledOnce()
    } finally {
      await host.dispose()
      await runtime.dispose()
      evidence.dispose()
      factory.transact.reset()
    }
  }
)
