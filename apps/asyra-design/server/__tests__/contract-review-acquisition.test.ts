import { expect, it, vi } from 'vitest'
vi.mock('../../src/contexts', () => ({ default: {} }))
import recorded from '../../test-data/ai-drawing/fixtures/contract-review-20261107.json'
import { createBasicApiActions } from '../../src/ai/basic-api-actions'
import { createAiToolContract } from '@asyra/ai-agent-runtime'
import { createLocalOperationTools } from '../local-operation-tools'
import { operationInputIssue } from '../operation-input-schema'
import { readCompleteInformation } from './tool-contract-assertions'

it('delivers recorded action arguments without repeating the host schema', async () => {
  const tools = createLocalOperationTools(
    createBasicApiActions().map(createAiToolContract),
    {
      modelActions: (value) => value,

      resolveBatch: (value) => value
    },
    vi.fn(),
    {
      getNativeTools: () =>
        tools.definitions.map((definition) => ({
          ...definition,
          namespace: 'design_operations',
          registeredName: `design_operations.${definition.name}`
        }))
    }
  )

  const read = async (args: unknown) =>
    JSON.parse(
      await readCompleteInformation(
        (input) =>
          tools.call(
            'describe_design_apis',
            input,
            new AbortController().signal
          ),
        args
      )
    )

  for (const index of [4, 8]) {
    const result = await read(recorded.discovery[index])
    const entry = result.apis[0]
    const guide = entry.usageGuide

    expect(guide.operationParameters).toBeDefined()
    expect(guide).not.toHaveProperty('parameters')
    expect(guide.hostContract).toMatchObject({
      tool: 'describe_design_apis',
      arguments: { names: ['design_operations.execute_design'], view: 'usage' }
    })
    if (index === 8) {
      expect(entry.artifactKeyExamples).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            arguments: {
              operations: [
                expect.objectContaining({
                  target: expect.objectContaining({
                    field: 'elementIds',
                    path: ['request', 'elementIds']
                  }),
                  arguments: {
                    request: expect.objectContaining({
                      anchorId: expect.any(String)
                    })
                  }
                })
              ]
            }
          })
        ])
      )
    }

    const argumentsValue =
      index === 4
        ? { elementIds: ['part'] }
        : {
            request: {
              elementIds: ['reflection'],
              anchorId: 'frame',
              placement: 'before'
            }
          }

    expect(
      operationInputIssue(argumentsValue, guide.operationParameters)
    ).toBeUndefined()
    const host = await read(guide.hostContract.arguments)

    expect(host.tools[0].name).toBe('execute_design')
    const refreshed = await read(entry.definition.refresh.arguments)

    expect(refreshed.apis[0].usageGuide).toEqual(guide)
    const bytes = Buffer.byteLength(JSON.stringify(result))

    process.stdout.write(
      JSON.stringify({
        measurement: 'recorded-action-usage',
        operation: entry.operation,
        bytes
      }) + '\n'
    )
    expect(bytes).toBeLessThan(7500)
  }

  const menu = await read(recorded.discovery[3])

  expect(
    menu.apis.some(
      (entry: { operation: string }) =>
        entry.operation === 'hierarchy.groupElements'
    )
  ).toBe(true)
  for (const entry of [...menu.apis, ...menu.tools]) {
    expect(entry).not.toHaveProperty('recipeDependency')
    expect(entry).not.toHaveProperty('inputSchema')
  }
})
