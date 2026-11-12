// @vitest-environment jsdom
import { beforeAll, expect, it, vi } from 'vitest'
import { applyPreset, PresetDefaults, PresetProfiles } from '@asyra/preset'
import {
  createAiAgentRuntime,
  createAiToolContract
} from '@asyra/ai-agent-runtime'
import render, { RenderContainer } from '@asyra/render'
import factory from '@asyra/factory'
import core from '../../src/contexts'
import { createBasicApiActions } from '../../src/ai/basic-api-actions'
import { createAiTransactionRunner } from '../../src/ai/transaction'
import { createRetainedDesignContext } from '../../src/common-apis/retained-design-context'
import { observeDesignChanges } from '../../src/common-apis/design-review'
import { createDocumentContextReleaseAction } from '../../src/ai/context-action'
import { createLocalToolHost } from '../local-tool-host'
import { createLocalOperationTools } from '../local-operation-tools'
import { createLocalDesignTools } from '../local-design-tools'
import { LocalToolLibraryLimits } from '../local-tool-library-limits'
import type {
  AiActionBatch,
  AiBatchReceipt
} from '../../src/ai/action-batch-protocol'
import recorded from '../../test-data/ai-drawing/fixtures/position-discovery-20261109.json'

beforeAll(() => {
  applyPreset(core, {
    profile: PresetProfiles.CUSTOM,
    defaults: [
      PresetDefaults.BASIC_SHAPES,
      PresetDefaults.CONTAINERS,
      PresetDefaults.SELECTION
    ]
  })
})

it.each([false, true])(
  'binds recorded coordinate conversion to a canonical update without a model handoff (missing transform: %s)',
  async (missing) => {
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
    const parent = new RenderContainer()

    parent.x = recorded.parentOrigin.x
    parent.y = recorded.parentOrigin.y
    render.viewport.view.addChild(parent)
    const lookup = vi
      .spyOn(render.viewport, 'getElementById')
      .mockImplementation((id) =>
        id === 'parent' && !missing ? parent : undefined
      )
    const queries = createRetainedDesignContext(core, observeDesignChanges)
    const definitions = [
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

    const runtime = createAiAgentRuntime({
      provider: {
        requestActionBatch: async (_input, options) => {
          if (!options.executeBatch) {
            throw Error('Missing canonical executor')
          }

          dispatch = options.executeBatch
          try {
            const reply = await host.invoke({
              name: 'design_operations.execute_design',
              input: {
                operations: [
                  {
                    id: 'convert',
                    name: 'api_core_workspaceToElementLocal',
                    arguments: {
                      elementId: 'parent',
                      workspacePosition: recorded.workspacePosition
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

          return { batchId: 'done', actions: [] }
        }
      },
      actionDefinitions: definitions,
      contextProvider: { getContext: async () => ({}) },
      permissionPolicy: { evaluate: () => 'allow' },
      confirmationHandler: { confirm: async () => true },
      transactionRunner: createAiTransactionRunner()
    })

    try {
      await runtime.run({
        intent: 'Convert and update the position',
        signal: new AbortController().signal
      })

      if (missing) {
        expect(outcome?.status).not.toBe('success')
        expect(calls).toEqual(['api_core_workspaceToElementLocal'])
        expect(core.getElementComputedData('target', ['x', 'y'])).toMatchObject(
          { x: 0, y: 0 }
        )
      } else {
        expect(outcome?.status, resultText).toBe('success')
        expect(calls).toEqual([
          'api_core_workspaceToElementLocal',
          'api_element_setElementPositions',
          'release_design_context'
        ])
        expect(core.getElementComputedData('target', ['x', 'y'])).toMatchObject(
          recorded.localPosition
        )
      }
    } finally {
      await host.dispose()
      await runtime.dispose()
      lookup.mockRestore()
      queries.dispose()
      render.viewport.view.removeChild(parent)
      factory.transact.reset()
    }
  }
)
