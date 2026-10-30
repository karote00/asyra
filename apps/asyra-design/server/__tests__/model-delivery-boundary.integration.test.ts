import { expect, it, vi } from 'vitest'
import { modelToolResultSchemas } from '../../src/ai/tool-contract'
import { createAiToolContract } from '@asyra/ai-agent-runtime'
import saved from './fixtures/recorded-101/model-delivery-boundary-20261029.json'
import { createLocalToolHost } from '../local-tool-host'
import { createLocalDesignTools } from '../local-design-tools'
import { createLocalOperationTools } from '../local-operation-tools'
import { operationContractIssue } from '../operation-input-schema'
vi.mock('../../src/contexts', () => ({ default: {} }))
vi.mock('../../src/common-apis/fills', () => ({ fillApis: {} }))
import { createDocumentContextAction } from '../../src/ai/context-action'
import { createPreparedMaterialApplication } from '../../src/ai/prepared-material-action'

it.each(['native', 'registered'])(
  'delivers saved selected reads and material acknowledgements through the %s boundary with no reacquisition',
  async (route) => {
    const calls = new Map<string, number>()
    const observations: unknown[] = []
    const actions = [
      createDocumentContextAction(),
      createPreparedMaterialApplication().action
    ].map(createAiToolContract)
    const host = createLocalToolHost({
      requestId: 'saved-delivery',
      signal: new AbortController().signal,
      store: {
        read: async () => undefined,
        list: async () => [],
        write: async () => {
          throw new Error('Unexpected persistence')
        }
      },
      capacity: 32,
      receiptCapacity: 8,
      artifactCapacity: 64,
      limits: {
        steps: 16,
        bindings: 240,
        bindingDepth: 32,
        bytes: 24000,
        issues: 8
      },
      observe: (event) => {
        observations.push(event)
      },
      createGroups: (ownership) => {
        const designs = createLocalDesignTools(actions)
        const operations = createLocalOperationTools(
          actions,
          designs,
          async () => {
            throw new Error('Unexpected recomputation')
          }
        )
        const material = saved.cases[0].input.arguments.materialRevisionId
        if (!material) throw new Error('Missing saved material identity')
        ownership.publish(
          material,
          () => undefined,
          () => undefined,
          'request'
        )
        return [
          {
            name: 'operations',
            description: 'Saved owner boundary',
            owner: {
              ...operations,
              callInternal: async (name: string) => {
                const source = saved.cases.find((entry) => entry.tool === name)
                if (!source) throw new Error('Missing saved tool receipt')
                calls.set(name, (calls.get(name) ?? 0) + 1)
                if (name === 'read_design_context') {
                  const result = source.output.actionResults[0].result
                  if (!result.snapshotId || !result.leaseId)
                    throw new Error('Missing saved read handles')
                  ownership.publish(
                    result.snapshotId,
                    () => undefined,
                    () => undefined
                  )
                  ownership.publish(
                    result.leaseId,
                    () => undefined,
                    () => undefined
                  )
                }
                return JSON.stringify(source.output)
              }
            }
          }
        ]
      }
    })
    let before = 0
    let after = 0
    try {
      for (const source of saved.cases) {
        const definition = host
          .definitions()
          .find((entry) => entry.name === source.tool)
        if (!definition?.registeredName)
          throw new Error('Missing registered definition')
        if (route === 'registered' && definition.composition !== 'allowed') {
          const refused = JSON.parse(
            (
              await host.invoke({
                name: 'tool_library.invoke_tool',
                input: {
                  name: definition.registeredName,
                  revision: definition.revision,
                  input: source.input
                }
              })
            ).text
          )
          expect(refused.execution.status).toBe('failed')
          expect(calls.get(source.tool)).toBeUndefined()
          continue
        }
        const invocation =
          route === 'native'
            ? { name: definition.registeredName, input: source.input }
            : {
                name: 'tool_library.invoke_tool',
                input: {
                  name: definition.registeredName,
                  revision: definition.revision,
                  input: source.input
                }
              }
        const result = await host.invoke(invocation)
        const envelope = JSON.parse(result.text)
        const value = route === 'native' ? envelope : envelope.execution.value
        expect(value, result.text).toBeDefined()
        expect(
          operationContractIssue(
            value,
            modelToolResultSchemas(definition, 'host').outputSchema,
            { stage: 'output' }
          )
        ).toBeUndefined()
        const receipt = value.actionResults[0].result
        if (source.tool === 'read_design_context') {
          expect(receipt.columns).toEqual(
            source.output.actionResults[0].result.columns
          )
          expect(receipt).toMatchObject({
            total: 2,
            delivery: 'columns',
            nextOffset: null,
            missingIds: []
          })
          expect(receipt).not.toHaveProperty('observation')
        } else {
          expect(receipt.appliedElementIds).toEqual(
            source.output.actionResults[0].result.appliedElementIds
          )
          expect(receipt.materialProvenance).toEqual(
            source.output.actionResults[0].result.materialProvenance
          )
          expect(value.checks.counts).toEqual(source.output.checks?.counts)
          expect(value.checks).not.toHaveProperty('visitedResults')
        }
        expect(value).not.toHaveProperty('context')
        expect(calls.get(source.tool)).toBe(1)
        const baselineEnvelope =
          route === 'native'
            ? source.output
            : {
                ...envelope,
                execution: { ...envelope.execution, value: source.output }
              }
        // Keep the same invocation and outer registry receipt on both sides.
        const requestBytes = Buffer.byteLength(JSON.stringify(invocation))
        before +=
          requestBytes + Buffer.byteLength(JSON.stringify(baselineEnvelope))
        after += requestBytes + Buffer.byteLength(result.text)
      }
      expect(after).toBeLessThan(before)
      process.stdout.write(
        JSON.stringify({
          measurement: 'saved-model-delivery',
          route,
          before,
          after,
          ownerCalls: Object.fromEntries(calls)
        }) + '\n'
      )
      expect(JSON.stringify(observations)).toContain('computedReadCount')
      if (route === 'native')
        expect(JSON.stringify(observations)).toContain('visitedResults')
    } finally {
      await host.dispose()
    }
  }
)

it('delivers the operation-owned capture identity through the real host for reuse without recapture', async () => {
  const { createAiInspectionAction } = await import('../../src/ai/inspection')
  const action = createAiToolContract(createAiInspectionAction())
  const image = { dataUrl: 'data:image/png;base64,aW1hZ2U=' }
  const dispatch = vi.fn(async (batch) => ({
    context: {},
    actionResults: batch.actions.map((entry: { id: string; name: string }) => ({
      actionId: entry.id,
      actionName: entry.name,
      result: {
        available: true,
        image,
        evidence: { sessionId: 'capture', revision: 0, receiptId: 'first' }
      }
    }))
  }))
  const host = createLocalToolHost({
    requestId: 'capture-delivery',
    signal: new AbortController().signal,
    store: {
      read: async () => undefined,
      list: async () => [],
      write: async () => {
        throw new Error('Unexpected persistence')
      }
    },
    capacity: 32,
    receiptCapacity: 8,
    artifactCapacity: 64,
    limits: {
      steps: 16,
      bindings: 240,
      bindingDepth: 32,
      bytes: 24000,
      issues: 8
    },
    createGroups: () => [
      {
        name: 'operations',
        description: 'Actual capture owner',
        owner: createLocalOperationTools(
          [action],
          {
            modelActions: (value) => value,
            resolveBatch: (value) => value
          },
          dispatch
        )
      }
    ]
  })
  try {
    const definition = host
      .definitions()
      .find((entry) => entry.name === action.name)
    if (!definition) throw new Error('Missing actual capture definition')
    const result = await host.invoke({
      name: definition.registeredName,
      input: { arguments: { elementId: 'panel' } }
    })
    const value = JSON.parse(result.text)
    expect(value, result.text).toMatchObject({
      actionResults: [
        {
          result: {
            available: true,
            image,
            inspectionId: expect.any(String),
            revision: 0
          }
        }
      ]
    })
    expect(
      operationContractIssue(
        value,
        modelToolResultSchemas(definition, 'host').outputSchema,
        { stage: 'output' }
      )
    ).toBeUndefined()
    const binding = value.actionResults[0].result.inspectionId
    const read = await host.invoke({
      name: 'operations.read_design_checks',
      input: {
        ids: [`inspection:${binding}`],
        includePassed: true
      }
    })
    expect(JSON.parse(read.text).toolOutcome.status).toBe('success')
    expect(dispatch).toHaveBeenCalledTimes(1)
  } finally {
    await host.dispose()
  }
})
