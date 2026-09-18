import type { AiActionBatch } from '../../src/ai/action-batch-protocol'
import { describe, expect, it, vi } from 'vitest'
import {
  createLocalOperationTools,
  localToolContent
} from '../local-operation-tools'
import { createLocalImageTools } from '../local-image-tools'
import { AiActionNames } from '../../src/constants/ai-actions'

describe('backend operation tools', () => {
  it('prepares a referenced drawing on the backend and returns the acknowledged canonical result', async () => {
    const images = createLocalImageTools(
      {
        metadata: {
          imageAttachments: [
            {
              mediaType: 'image/png',
              size: 1,
              dataUrl: 'data:image/png;base64,YQ=='
            }
          ]
        }
      },
      async () =>
        '<svg width="10" height="10"><path d="M0,0L10,0L10,10Z" fill="#000000"/></svg>'
    )
    const signal = new AbortController().signal
    const artifact = JSON.parse(
      await images.call('vtracer', { attachmentIndex: 0 }, signal)
    )
    const executeBatch = vi.fn(async (_batch: AiActionBatch) => ({
      actionResults: [
        {
          actionId: 'a',
          actionName: 'insert',
          result: { compositionId: 'actual-id' }
        }
      ],
      context: { selectedIds: ['actual-id'] }
    }))
    const operations = createLocalOperationTools(
      [
        {
          name: AiActionNames.INSERT_VECTOR_COMPOSITION,
          description: 'Insert',
          inputSchema: {}
        }
      ],
      images,
      executeBatch
    )
    const result = await operations.call(
      AiActionNames.INSERT_VECTOR_COMPOSITION,
      {
        arguments: {
          imageArtifactId: artifact.imageArtifactId,
          compositionRole: 'logo',
          bounds: { x: 0, y: 0, width: 240, height: 240 },
          excludePathIds: []
        },
        message: 'Tracing is complete. I am adding the editable drawing.'
      },
      signal
    )
    expect(JSON.parse(result).context.selectedIds).toEqual(['actual-id'])
    expect(executeBatch).toHaveBeenCalledOnce()
    const prepared = executeBatch.mock.calls[0]?.[0]
    if (!prepared) throw new Error('Missing prepared batch')
    expect(JSON.stringify(prepared)).not.toContain('imageArtifactId')
    expect(prepared.actions[0].summary).toBe(
      'Tracing is complete. I am adding the editable drawing.'
    )
    expect(prepared.actions[0].name).toBe(
      AiActionNames.INSERT_VECTOR_COMPOSITION
    )
  })

  it('executes routine operations with parameters only and supplies the App status', async () => {
    const executeBatch = vi.fn(async (_batch: AiActionBatch) => ({
      actionResults: [],
      context: {}
    }))
    const operations = createLocalOperationTools(
      [
        {
          name: AiActionNames.SELECT_ELEMENTS,
          description: 'Select',
          inputSchema: {}
        }
      ],
      createLocalImageTools({}),
      executeBatch
    )
    expect(operations.definitions[0].inputSchema.required).toEqual([
      'arguments'
    ])
    await operations.call(
      AiActionNames.SELECT_ELEMENTS,
      { arguments: { elementIds: ['a'] } },
      new AbortController().signal
    )
    expect(executeBatch).toHaveBeenCalledOnce()
    expect(executeBatch.mock.calls[0][0].actions[0].summary).toBe(
      'Updating the drawing'
    )
  })

  it.each([null, 1, '', '   ', 'x'.repeat(1001)])(
    'rejects malformed optional operation messages before execution: %s',
    async (message) => {
      const executeBatch = vi.fn(async (_batch: AiActionBatch) => ({
        actionResults: [],
        context: {}
      }))
      const operations = createLocalOperationTools(
        [
          {
            name: AiActionNames.SELECT_ELEMENTS,
            description: 'Select',
            inputSchema: {}
          }
        ],
        createLocalImageTools({}),
        executeBatch
      )
      await expect(
        operations.call(
          AiActionNames.SELECT_ELEMENTS,
          { arguments: {}, message },
          new AbortController().signal
        )
      ).rejects.toThrow('Invalid backend operation')
      expect(executeBatch).not.toHaveBeenCalled()
    }
  )

  it('does not expose or execute an unregistered capability', async () => {
    const executeBatch = vi.fn()
    const operations = createLocalOperationTools(
      [{ name: 'shell', description: 'No', inputSchema: {} }],
      createLocalImageTools({}),
      executeBatch
    )
    expect(operations.definitions).toEqual([])
    await expect(
      operations.call(
        'shell',
        { arguments: {}, message: 'Run' },
        new AbortController().signal
      )
    ).rejects.toThrow()
    expect(executeBatch).not.toHaveBeenCalled()
  })
})

const png =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGioAAAAASUVORK5CYII='

it('returns native image content without placing image bytes in text', () => {
  const receipt = {
    actionResults: [
      {
        actionName: AiActionNames.INSPECT_DRAWING,
        result: {
          available: true,
          image: { dataUrl: png, width: 1, height: 1 }
        }
      }
    ]
  }
  const content = localToolContent(JSON.stringify(receipt))
  expect(content).toContainEqual({ type: 'inputImage', imageUrl: png })
  expect(
    JSON.stringify(content.filter((item) => item.type === 'inputText'))
  ).not.toContain('base64')
  expect(() =>
    localToolContent(
      JSON.stringify({
        actionResults: [
          {
            actionName: AiActionNames.INSPECT_DRAWING,
            result: {
              available: true,
              image: {
                dataUrl: 'https://example.com/image.png',
                width: 1,
                height: 1
              }
            }
          }
        ]
      })
    )
  ).toThrow()
})

it('captures fresh evidence after each mutation using the acknowledged composition ID', async () => {
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result:
        action.name === AiActionNames.INSPECT_DRAWING
          ? { available: true, image: { dataUrl: png, width: 1, height: 1 } }
          : { compositionId: 'actual-composition', status: 'complete' }
    })),
    context: {}
  }))
  const tools = createLocalOperationTools(
    [AiActionNames.INSPECT_DRAWING, AiActionNames.SET_ELEMENT_VISIBILITY].map(
      (name) => ({ name, description: name, inputSchema: {} })
    ),
    createLocalImageTools({}),
    execute
  )
  for (const visible of [true, false]) {
    const receipt = await tools.call(
      AiActionNames.SET_ELEMENT_VISIBILITY,
      {
        arguments: { elementIds: ['shape'], visible },
        message: 'Adjusting the drawing'
      },
      new AbortController().signal
    )
    expect(localToolContent(receipt)).toContainEqual({
      type: 'inputImage',
      imageUrl: png
    })
  }
  expect(execute).toHaveBeenCalledTimes(4)
  expect(execute.mock.calls[1][0].actions[0]).toMatchObject({
    name: AiActionNames.INSPECT_DRAWING,
    arguments: { elementId: 'actual-composition' }
  })
})

it('stops mutations at the review budget and never certifies unavailable evidence', async () => {
  let available = false
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result:
        action.name === AiActionNames.INSPECT_DRAWING
          ? { available }
          : { compositionId: 'drawing' }
    })),
    context: {}
  }))
  const tools = createLocalOperationTools(
    [AiActionNames.INSPECT_DRAWING, AiActionNames.SET_ELEMENT_VISIBILITY].map(
      (name) => ({ name, description: name, inputSchema: {} })
    ),
    createLocalImageTools({}),
    execute
  )
  const completed: AiActionBatch = {
    batchId: 'done',
    actions: [
      {
        id: 'report',
        name: AiActionNames.REPORT_OUTCOME,
        arguments: { outcome: 'completed', message: 'Done' },
        summary: 'Done'
      }
    ]
  }
  const change = () =>
    tools.call(
      AiActionNames.SET_ELEMENT_VISIBILITY,
      {
        arguments: { elementIds: ['shape'], visible: true },
        message: 'Adjusting'
      },
      new AbortController().signal
    )
  await change()
  expect(tools.settleOutcome(completed).actions[0].arguments).toMatchObject({
    outcome: 'unsupported',
    message: 'This app could not complete visual review of the drawing.'
  })
  available = true
  await change()
  expect(tools.settleOutcome(completed)).toBe(completed)
  for (let index = 2; index < 6; index++) await change()
  expect(execute).toHaveBeenCalledTimes(12)
  expect(await change()).toContain('No further changes were applied')
  expect(execute).toHaveBeenCalledTimes(12)
})

it('does not admit unreviewed mutations in the final response', () => {
  const execute = vi.fn()
  const tools = createLocalOperationTools(
    [AiActionNames.INSPECT_DRAWING, AiActionNames.SET_ELEMENT_VISIBILITY].map(
      (name) => ({ name, description: name, inputSchema: {} })
    ),
    createLocalImageTools({}),
    execute
  )
  expect(() =>
    tools.settleOutcome({
      batchId: 'late',
      actions: [
        {
          id: 'late-edit',
          name: AiActionNames.SET_ELEMENT_VISIBILITY,
          arguments: { elementId: 'shape', visible: false },
          summary: 'Late edit'
        }
      ]
    })
  ).toThrow('Final response cannot contain unreviewed drawing operations')
  expect(execute).not.toHaveBeenCalled()
})
