import continuation from './fixtures/recorded-101/continuation-contracts-20261106.json'
// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { createAiToolContract } from '@asyra/ai-agent-runtime'
import { createLocalDesignTools } from '../local-design-tools'
import { createDesignPreparationSession } from '../design-preparation'
import { createLocalOperationTools } from '../local-operation-tools'
import { invokeLocalTool } from '../local-tool-invocation'
import { createRetainedDesignContext } from '../../src/common-apis/retained-design-context'
import {
  createDocumentContextAction,
  createDocumentContextReleaseAction
} from '../../src/ai/context-action'
import { createAiInspectionAction } from '../../src/ai/inspection'
import { AiActionNames } from '../../src/constants/ai-actions'

it.each(['ids', 'region', 'discovered-region'])(
  'reads requested canonical values through %s without an approval protocol or completion reread',
  async (route) => {
    let invalidate: () => void = () => undefined

    let reads = 0
    const known = new Set(['target'])
    let contextCalls = 0
    let width = 20
    const name = 'Rectangle'
    const exists = true
    const regionIds = ['target']
    const contexts = createRetainedDesignContext(
      {
        getCurrentWorkspaceId: () => 'workspace',

        getSelectedElementIds: () => ['target'],

        getElementChildren: () => ({
          available: true,
          elementIds: ['target'],
          total: 1,
          nextOffset: null
        }),

        getElementIdsInBounds: () => regionIds,

        getElementMetadata: (id) =>
          known.has(id) && exists
            ? { name, type: 'rect', parentId: 'workspace' }
            : undefined,

        getElementComputedData: () => {
          reads++

          return {
            width,
            fills: Array.from({ length: 9 }, () => ({
              type: 'solid',
              color: '#ffffff'
            }))
          }
        }
      },
      (listener) => {
        invalidate = listener

        return () => undefined
      }
    )
    const actions = [
      createDocumentContextAction(contexts.read),
      createDocumentContextReleaseAction(contexts.read),
      createAiInspectionAction(() => {
        throw new Error('Data review must not capture pixels')
      })
    ]
    const snapshots: string[] = []
    let captures = 0
    const signal = new AbortController().signal
    const session = createDesignPreparationSession()
    const preparation = createLocalDesignTools([], session)
    const tools = createLocalOperationTools(
      actions.map(createAiToolContract),
      {
        resolveTargets: preparation.resolveTargets,

        modelActions: (value) => value,

        resolveBatch: (value) => value
      },
      async (batch) => ({
        context: {},
        actionResults: await Promise.all(
          batch.actions.map(async (action) => {
            const owner = actions.find((entry) => entry.name === action.name)

            if (!owner) {
              throw new Error('Missing canonical owner')
            }

            if (owner.name === actions[0].name) {
              contextCalls++
            }

            if (owner.name === actions[2].name) {
              captures++
            }

            const result = (await owner.execute(
              action.arguments as never,
              { signal } as never
            )) as Record<string, unknown>

            if (typeof result.snapshotId === 'string' && 'leaseId' in result) {
              snapshots.push(result.snapshotId)
            }

            return {
              actionId: action.id,
              actionName: action.name,
              result: result as never
            }
          })
        )
      })
    )

    const call = async (name: string, input: unknown) => {
      const definition = tools.definitions.find((entry) => entry.name === name)

      if (!definition) {
        throw new Error('Missing tool definition')
      }

      const output = await invokeLocalTool(tools, definition, input, signal)

      return { value: JSON.parse(output.text), outcome: output.outcome }
    }

    const query =
      route === 'ids'
        ? {
            scope: 'ids',
            elementIds: ['target'],
            fields: ['width'],
            delivery: 'page'
          }
        : {
            scope: 'region',
            bounds:
              continuation.regionQueries.input.operations[0].arguments.bounds,
            filter: { type: 'rect' },
            fields: ['width'],
            delivery: 'page',
            ...(route === 'region' ? { expectedCount: 1 } : {})
          }

    try {
      const acquired = await call(AiActionNames.READ_DESIGN_CONTEXT, {
        arguments: query
      })

      expect(acquired.outcome.status, JSON.stringify(acquired)).toBe('success')
      const values = acquired.value.actionResults[0].result

      expect(values.elements[0].properties).toEqual({ width: 20 })
      expect(contextCalls).toBe(1)
      expect(reads).toBe(1)
      const completed = {
        batchId: 'completion',
        actions: [
          {
            id: 'done',
            name: AiActionNames.REPORT_OUTCOME,
            arguments: {
              outcome: 'completed',
              message: 'Requested width inspected'
            },
            summary: 'Complete'
          }
        ]
      }

      expect(tools.settleOutcome(completed)).toEqual(completed)
      expect(contextCalls).toBe(1)
      expect(captures).toBe(0)
      width = 21
      invalidate()
      const fresh = await call(AiActionNames.READ_DESIGN_CONTEXT, {
        arguments: query
      })

      expect(
        fresh.value.actionResults[0].result.elements[0].properties.width
      ).toBe(21)
      expect(contextCalls).toBe(2)
      const released = await call(AiActionNames.RELEASE_DESIGN_CONTEXT, {
        arguments: { snapshotId: values.snapshotId }
      })

      expect(released.outcome.status).toBe('success')
      expect(() => contexts.get(values.snapshotId)).toThrow()
      const cancelled = new AbortController()

      cancelled.abort()
      await expect(
        tools.call(
          AiActionNames.READ_DESIGN_CONTEXT,
          { arguments: query },
          cancelled.signal
        )
      ).rejects.toThrow()
      expect(contextCalls).toBe(2)
    } finally {
      contexts.dispose()
    }
  }
)
