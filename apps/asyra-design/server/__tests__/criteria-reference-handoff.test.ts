import { expect, it, vi } from 'vitest'
import recorded from '../../test-data/ai-drawing/fixtures/criteria-reference-handoff-20261107.json'
import { createLocalToolHost } from '../local-tool-host'
import { createLocalOperationTools } from '../local-operation-tools'
import { LocalToolLibraryLimits } from '../local-tool-library-limits'

it('hands recorded reference purpose and standalone values through the host without approval prerequisites', async () => {
  const source = recorded.input.operations[1].arguments
  const references = source.referenceDecisions.map((decision) => ({
    referenceId: decision.referenceId,
    purpose: decision.reason,
    region: 'whole',
    limitations: decision.uses.flatMap((use) => use.limitations)
  }))
  const identities = references.map((reference, attachmentIndex) => ({
    attachmentIndex,
    referenceId: reference.referenceId,
    validation: { width: 100, height: 200 }
  }))
  const dispatch = vi.fn(async () => {
    throw Error('No canvas work expected')
  })
  const owner = createLocalOperationTools(
    [],
    {
      modelActions: (value) => value,

      resolveBatch: (value) => value
    },
    dispatch,
    { validateReferences: () => identities }
  )
  const host = createLocalToolHost({
    requestId: 'reference-context-handoff',
    signal: new AbortController().signal,
    capacity: 32,
    receiptCapacity: 8,
    artifactCapacity: 64,
    limits: LocalToolLibraryLimits.recipe,
    store: {
      read: async () => undefined,

      list: async () => [],

      write: async () => {
        throw Error('No library write')
      }
    },

    createGroups: () => [
      { name: 'design_operations', description: 'Context', owner }
    ]
  })

  try {
    const reply = await host.invoke({
      name: 'design_operations.execute_design',
      input: {
        operations: [
          {
            id: 'references',
            name: 'design_operations.select_design_references',
            arguments: {
              referenceImageIndexes: source.referenceImageIndexes,
              references
            }
          },
          {
            id: 'spacing',
            name: 'design_operations.record_design_calculations',
            arguments: {
              calculations: [{ id: 'pitch', value: 60, unit: 'px' }]
            }
          },
          {
            name: 'design_operations.record_design_calculations',
            arguments: {
              calculations: [
                {
                  id: 'continued-pitch',
                  value: {
                    kind: 'step',
                    step: 'spacing',
                    path: '/calculations/0/value'
                  },
                  unit: 'px'
                }
              ]
            }
          }
        ]
      }
    })

    expect(reply.success, reply.text).toBe(true)
    const selected = JSON.parse(
      await owner.call(
        'select_design_references',
        {
          referenceImageIndexes: source.referenceImageIndexes
        },
        new AbortController().signal
      )
    )

    expect(selected.references).toEqual(references)
    const values = JSON.parse(
      await owner.call(
        'record_design_calculations',
        {},
        new AbortController().signal
      )
    )

    expect(values.calculations).toContainEqual({
      id: 'continued-pitch',
      value: 60,
      unit: 'px'
    })
    expect(dispatch).not.toHaveBeenCalled()
  } finally {
    await host.dispose()
  }
})
