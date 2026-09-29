import { describe, expect, it, vi } from 'vitest'
import type { AiActionBatchPreview } from '@asyra/ai-agent-runtime'
import {
  createAiConfirmationHandler,
  createAiConfirmationSummary
} from '../confirmation'

const preview: AiActionBatchPreview = Object.freeze({
  batchId: 'batch-1',
  actions: Object.freeze([])
})

describe('Asyra Design AI confirmation adapter', () => {
  it('defaults to safe cancellation when no UI callback is composed', async () => {
    const handler = createAiConfirmationHandler()

    await expect(
      handler.confirm(preview, {
        signal: new AbortController().signal
      })
    ).resolves.toBe(false)
  })

  it('forwards one immutable preview and Feature signal to the app callback', async () => {
    const requestConfirmation = vi.fn(async () => true)
    const handler = createAiConfirmationHandler(requestConfirmation)
    const signal = new AbortController().signal

    await expect(
      handler.confirm(preview, {
        signal
      })
    ).resolves.toBe(true)

    expect(requestConfirmation).toHaveBeenCalledOnce()
    expect(requestConfirmation).toHaveBeenCalledWith(preview, {
      signal
    })
  })
})

it('distinguishes replacing canvas objects from overwriting earlier Undo history', () => {
  const summary = createAiConfirmationSummary({
    batchId: 'replace',
    actions: [
      { id: 'replace', name: 'replace_vector_composition', summary: 'Replace' }
    ]
  } as AiActionBatchPreview)
  expect(summary.message).toContain(
    'Previous steps remain available through Undo.'
  )
  expect(summary.destructive).toBe(true)
})
