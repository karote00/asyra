import type { AiActionBatch } from '../../src/ai/action-batch-protocol'
import { describe, expect, it, vi } from 'vitest'
import { createLocalOperationTools } from '../local-operation-tools'
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
    expect(prepared.actions[0].name).toBe(
      AiActionNames.INSERT_VECTOR_COMPOSITION
    )
  })

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
