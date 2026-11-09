import recorded from '../../test-data/ai-drawing/fixtures/selected-prefix-recovery-20261107.json'
import { expect, it } from 'vitest'
import { createLocalToolHost } from '../local-tool-host'
import { createLocalDesignTools } from '../local-design-tools'
import { createLocalDesignWorkflow } from '../local-design-workflow'
import { createLocalOperationTools } from '../local-operation-tools'
import { createDesignPreparationSession } from '../design-preparation'
import { AiActionNames } from '../../src/constants/ai-actions'
import type { AiBatchReceipt } from '../../src/ai/action-batch-protocol'
import { evaluationToolStop } from '../evaluation-control'
import { createConversationResults } from '../../src/ai/conversation-results'
import { LocalToolLibraryLimits } from '../local-tool-library-limits'
import {
  localToolFailureReply,
  localToolFailureSchema
} from '../local-tool-invocation'
import {
  toolSemantics,
  toolResultObject,
  toolInternalResult
} from '../../src/ai/tool-contract'

it.each(['status', 'selected'] as const)(
  'validates generic successful recovery before omitting internal fields with %s delivery',
  async (mode) => {
    let writes = 0
    const host = createLocalToolHost({
      requestId: 'generic-prefix-recovery',
      signal: new AbortController().signal,
      capacity: LocalToolLibraryLimits.entries,
      receiptCapacity: LocalToolLibraryLimits.receipts,
      artifactCapacity: LocalToolLibraryLimits.artifacts,
      limits: LocalToolLibraryLimits.recipe,
      store: {
        read: async () => undefined,

        list: async () => [],

        write: async () => {
          throw Error('Unexpected library save')
        }
      },

      createGroups: () => [
        {
          name: 'generic',
          description: 'Generic capabilities',
          owner: {
            definitions: ['create', 'reject'].map((name) => ({
              name,
              composition: 'allowed' as const,
              description: name,
              inputSchema: { type: 'object' },
              ...toolSemantics(
                toolResultObject({
                  id: { type: 'string' },
                  statistics: toolInternalResult(
                    toolResultObject({ inspected: { type: 'number' } })
                  )
                }),
                'mutation',
                ['document']
              ),
              partialOutputSchema: localToolFailureSchema,
              recoveryOutputSchema: localToolFailureSchema
            })),

            call: async (name) => {
              if (name === 'reject') {
                return localToolFailureReply(
                  'Correct the input',
                  'INPUT_REJECTED',
                  { settlement: 'not-started', recovery: 'correct_input' }
                ).text
              }

              writes++

              return JSON.stringify({
                id: 'created',
                statistics: { inspected: 1 }
              })
            }
          }
        }
      ]
    })

    try {
      const reply = await host.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: [
            { id: 'first', name: 'generic.create', arguments: {} },
            { id: 'second', name: 'generic.reject', arguments: {} }
          ],
          delivery:
            mode === 'status'
              ? 'status'
              : { fields: { created: { step: 'first', path: '/id' } } }
        }
      })
      const result = JSON.parse(reply.text)

      expect(writes, reply.text).toBe(1)
      expect(result.toolOutcome, reply.text).toMatchObject({
        status: 'failed',
        settlement: 'partial'
      })
      expect(result.failure.execution.recovery[0].value).toMatchObject({
        id: 'created'
      })
      expect(result.failure.execution.recovery[1], reply.text).toBeDefined()
      expect(result.failure.execution.recovery[1].value).toMatchObject({
        recovery: 'correct_input',
        settlement: 'not-started'
      })
      expect(evaluationToolStop(reply), reply.text).toBeUndefined()
      expect(reply.text).not.toContain('statistics')
    } finally {
      await host.dispose()
    }
  }
)

it.each(['status', 'selected'] as const)(
  'preserves the recorded successful prefix and repairable crown with %s delivery',
  async (mode) => {
    const applied: string[] = []
    const results = createConversationResults(() => 'document').open(
      'conversation'
    )
    const host = createLocalToolHost({
      requestId: 'selected-prefix-recovery',
      signal: new AbortController().signal,
      capacity: LocalToolLibraryLimits.entries,
      receiptCapacity: LocalToolLibraryLimits.receipts,
      artifactCapacity: LocalToolLibraryLimits.artifacts,
      limits: LocalToolLibraryLimits.recipe,

      resultContext: async (request) => results.exchange(request),

      store: {
        read: async () => undefined,

        list: async () => [],

        write: async () => {
          throw Error('Unexpected library save')
        }
      },

      createGroups: (ownership) => {
        const actions = [
          AiActionNames.APPLY_PREPARED_DESIGN,
          AiActionNames.REVIEW_DESIGN
        ].map((name) => ({
          name,
          composition: 'allowed' as const,
          description: name,
          inputSchema: {}
        }))
        const designs = createLocalDesignTools(
          actions,
          createDesignPreparationSession(undefined, undefined, ownership)
        )
        const operations = createLocalOperationTools(
          actions,
          designs,
          async (batch) => ({
            context: {},
            actionResults: batch.actions.map(
              (action): AiBatchReceipt['actionResults'][number] => {
                if (action.name === AiActionNames.REVIEW_DESIGN) {
                  return {
                    actionId: action.id,
                    actionName: action.name,
                    result: {
                      complete: true,
                      findings: [],
                      measuredTextIds: [],
                      evidence: { sessionId: 'prefix', revision: 1 }
                    }
                  }
                }

                const id = 'applied-' + applied.length

                applied.push(id)

                return {
                  actionId: action.id,
                  actionName: action.name,
                  result: {
                    status: 'complete',
                    compositionId: id,
                    appliedElementIds: [id]
                  }
                }
              }
            )
          })
        )

        return [
          {
            name: 'design_preparation',
            description: 'Preparation',
            owner: designs
          },
          {
            name: 'design_workflow',
            description: 'Workflow',
            owner: createLocalDesignWorkflow(designs, operations)
          }
        ]
      }
    })

    try {
      const reply = await host.invoke({
        name: 'design_operations.execute_design',
        input: {
          ...recorded.input,
          delivery: mode === 'status' ? 'status' : recorded.input.delivery
        }
      })
      const result = JSON.parse(reply.text)

      expect(applied).toEqual(['applied-0', 'applied-1'])
      expect(result.toolOutcome, reply.text).toMatchObject({
        status: 'failed',
        settlement: 'partial'
      })
      expect(evaluationToolStop(reply), reply.text).toBeUndefined()
      expect(result.saved.map(({ name }: { name: string }) => name)).toEqual([
        'taipeiBase',
        'taipeiBaseSource',
        'taipeiTiers',
        'taipeiTierSource'
      ])
      expect(results.names()).toEqual(
        result.saved.map(({ name }: { name: string }) => name)
      )
      expect(
        results.exchange({
          read: { source: { name: 'taipeiBaseSource', path: '' } }
        }).source
      ).toEqual(recorded.input.operations[0].arguments.draft)
      expect(result.completed).toEqual(['base', 'tiers'])
      expect(result.stopped).toEqual(['crown'])
      expect(
        result.failure.execution.recovery
          .slice(0, 2)
          .map(
            (entry: { value: { compositionIds: string[] } }) =>
              entry.value.compositionIds
          )
      ).toEqual([['applied-0'], ['applied-1']])
      expect(result.failure.execution.recovery[2].value).toMatchObject({
        recovery: 'correct_input',
        settlement: 'not-started',
        geometryIssue: { code: 'NONPLANAR_FACE', key: 'needle-f' },
        repairGuide: {
          arguments: {
            repair: { replacements: [{ path: '/children/23/vertices' }] }
          }
        }
      })
      // Recovery exports must survive outer-call cleanup for later review.
      for (const entry of result.failure.execution.recovery.slice(0, 2)) {
        const templates = await host.invoke({
          name: 'design_preparation.read_design_templates',
          input: { artifactId: entry.value.artifactId }
        })

        expect(JSON.parse(templates.text), templates.text).toHaveProperty(
          'motifTemplates'
        )
        expect(templates.text).not.toContain('TOOL_HANDOFF_FAILED')
      }

      expect(reply.text).not.toContain('visitedResults')
      expect(reply.text).not.toContain('TOOL_DELIVERY_INVALID')
      expect(reply.text).not.toContain('TOOL_HANDOFF_FAILED')
    } finally {
      await host.dispose()
    }
  }
)
