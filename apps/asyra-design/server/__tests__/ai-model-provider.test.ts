import { captureAiSourceIdentity } from '@asyra/ai-agent-runtime/node'
import { requestLocalAiActionBatch } from '../local-ai-provider'
vi.mock('@asyra/ai-agent-runtime/node', async (original) => ({
  ...(await original<typeof import('@asyra/ai-agent-runtime/node')>()),
  captureAiSourceIdentity: vi.fn()
}))
vi.mock('../local-ai-provider', () => ({ requestLocalAiActionBatch: vi.fn() }))
import type { AiActionBatch, AiProviderInput } from '@asyra/ai-agent-runtime'
import { describe, expect, it, vi } from 'vitest'
import { requestConfiguredAiActionBatch } from '../ai-model-provider'

const input: AiProviderInput = {
  actions: [
    {
      description: 'Create one rectangle',
      inputSchema: {},
      name: 'create_rectangle'
    }
  ],
  attempt: 1,
  context: {
    elementCount: 0,
    workspaceId: 'workspace-1'
  },
  intent: 'Create a rectangle'
}

const batch: AiActionBatch = {
  actions: [
    {
      arguments: { height: 40, width: 80, x: 10, y: 20 },
      id: 'action-1',
      name: 'create_rectangle',
      summary: 'Create one rectangle'
    }
  ],
  batchId: 'batch-1'
}

describe('Asyra Design configured AI model backend', () => {
  it('rejects the removed HTTP batch source before network work', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => Response.json(batch))

    await expect(
      requestConfiguredAiActionBatch(input, {
        environment: {
          AI_PROVIDER_BACKEND: 'http',
          AI_PROVIDER_MODEL: 'fixture',
          AI_PROVIDER_ENDPOINT: 'https://old.example/actions',
          AI_PROVIDER_API_KEY: 'obsolete'
        },
        fetch: fetcher
      })
    ).rejects.toMatchObject({ code: 'AI_MODEL_BACKEND_INVALID_CONFIGURATION' })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('defaults to the registered native source without an HTTP batch route', async () => {
    vi.mocked(requestLocalAiActionBatch).mockResolvedValue(batch)
    expect(
      await requestConfiguredAiActionBatch(input, {
        environment: {
          AI_PROVIDER_MODEL: 'fixture',
          AI_EXECUTION_SOURCE_REVISION: 'fixture'
        }
      })
    ).toEqual(batch)
    expect(requestLocalAiActionBatch).toHaveBeenCalled()
  })
})

it('captures source once at local invocation entry and preserves execution when unavailable', async () => {
  vi.mocked(requestLocalAiActionBatch).mockResolvedValue(batch)
  const capture = vi.mocked(captureAiSourceIdentity)

  capture.mockClear()
  const identity = {
    sourceRevision: 'abc',
    sourceFingerprint: 'f'.repeat(64),
    sourceIdentityStatus: 'captured' as const
  }

  capture
    .mockResolvedValueOnce(identity)
    .mockResolvedValueOnce({ sourceIdentityStatus: 'unavailable' })
  const environment = {
    AI_PROVIDER_BACKEND: 'local-codex',
    AI_PROVIDER_MODEL: 'test-model'
  }

  expect(await requestConfiguredAiActionBatch(input, { environment })).toEqual(
    batch
  )
  expect(capture).toHaveBeenCalledTimes(1)
  expect(requestLocalAiActionBatch).toHaveBeenLastCalledWith(
    input,
    expect.objectContaining(identity)
  )
  expect(await requestConfiguredAiActionBatch(input, { environment })).toEqual(
    batch
  )
  expect(capture).toHaveBeenCalledTimes(2)
  expect(requestLocalAiActionBatch).toHaveBeenLastCalledWith(
    input,
    expect.objectContaining({ sourceIdentityStatus: 'unavailable' })
  )
  await requestConfiguredAiActionBatch(input, {
    environment: { ...environment, AI_EXECUTION_SOURCE_REVISION: 'build-42' }
  })
  expect(capture).toHaveBeenCalledTimes(2)
  expect(requestLocalAiActionBatch).toHaveBeenLastCalledWith(
    input,
    expect.objectContaining({
      sourceRevision: 'build-42',
      sourceIdentityStatus: 'configured'
    })
  )
})
