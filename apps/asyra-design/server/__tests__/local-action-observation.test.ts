import { describe, expect, it, vi } from 'vitest'
import { BrowserBatchExecutionError } from '../batch-exchange'
import { observeActionBatch } from '../local-action-observation'
import type { AiBatchReceipt } from '../../src/ai/action-batch-protocol'

describe('canonical action observation', () => {
  const batch = {
    batchId: 'batch',
    actions: [
      {
        id: 'a',
        name: 'edit',
        arguments: { color: '#123456' },
        summary: 'Apply the chosen facade color'
      },
      {
        id: 'b',
        name: 'read',
        arguments: { elementId: 'tower' },
        summary: 'Check the updated size'
      }
    ]
  }
  const definitions = batch.actions.map((action) => ({
    name: action.name,
    description: `Contract for ${action.name}`,
    inputSchema: { type: 'object' }
  }))
  it('preserves completed actions and reports failed actions without discarding completed receipts', async () => {
    const receipt: AiBatchReceipt = {
      context: {},
      actionResults: [
        { actionId: 'a', actionName: 'edit', result: { status: 'complete' } }
      ],
      failure: {
        code: 'READ_FAILED',
        message: 'Read unavailable',
        stage: 'execution',
        actionName: 'read',
        actionId: 'b',
        actionExecutionMs: 7,
        settlement: 'unknown',
        contextFresh: true
      }
    }
    const events: { stage: string; value: unknown }[] = []
    await expect(
      observeActionBatch(
        batch,
        async () => receipt,
        definitions,
        'native',
        (stage, value) => events.push({ stage, value })
      )
    ).resolves.toEqual(receipt)
    expect(events.slice(2).map((event) => event.stage)).toEqual([
      'action_completed',
      'action_failed'
    ])
    expect(events[2].value).toMatchObject({ result: { status: 'complete' } })
  })
  it('retains every inner action and receipt before model-facing compaction', async () => {
    const receipt: AiBatchReceipt = {
      context: {},
      actionResults: batch.actions.map((action) => ({
        actionId: action.id,
        actionName: action.name,
        result: { status: 'complete', value: null }
      }))
    }
    const events: { stage: string; value: unknown }[] = []
    const execute = vi.fn(async () => receipt)
    expect(
      await observeActionBatch(
        batch,
        execute,
        definitions,
        'native-call',
        (stage, value) => events.push({ stage, value })
      )
    ).toBe(receipt)
    expect(execute).toHaveBeenCalledOnce()
    expect(events.map((item) => item.stage)).toEqual([
      'action_started',
      'action_started',
      'action_completed',
      'action_completed'
    ])
    expect(events[0].value).toMatchObject({
      parentCallId: 'native-call',
      actor: 'app-server',
      executor: 'app-browser',
      purpose: batch.actions[0].summary,
      expectedResult: 'Contract for edit',
      arguments: batch.actions[0].arguments,
      timingScope: 'batch-exchange'
    })
    expect(events[2].value).toMatchObject({
      result: receipt.actionResults[0].result
    })
  })
  it('records measured handler time but does not send diagnostics back to the model', async () => {
    const result = {
      status: 'complete',
      actionObservation: { handlerMs: 19, executor: 'app-browser' }
    }
    const events: unknown[] = []
    const output = await observeActionBatch(
      batch,
      async () => ({
        context: {},
        actionResults: [{ actionId: 'a', actionName: 'edit', result }]
      }),
      definitions,
      'native',
      (_, value) => events.push(value)
    )
    expect(events[2]).toMatchObject({ callId: 'action:batch:a', result })
    expect(output.actionResults[0].result).toEqual({ status: 'complete' })
    expect(result.actionObservation.handlerMs).toBe(19)
  })
  it('preserves exchange errors and records unknown settlement without retry', async () => {
    const error = new Error('transport lost')
    const execute = vi.fn(async () => {
      throw error
    })
    const events: unknown[] = []
    await expect(
      observeActionBatch(batch, execute, definitions, 'native', (_, value) =>
        events.push(value)
      )
    ).rejects.toBe(error)
    expect(execute).toHaveBeenCalledOnce()
    expect(events.slice(2)).toHaveLength(2)
    expect(events[2]).toMatchObject({
      code: 'ACTION_EXCHANGE_FAILED',
      reason: expect.stringContaining('unknown')
    })
  })
  it('marks missing acknowledgements unknown without inventing failure or replaying', async () => {
    const events: unknown[] = []
    await observeActionBatch(
      batch,
      async () => ({ context: {}, actionResults: [] }),
      definitions,
      'native',
      (_, value) => events.push(value)
    )
    expect(events[2]).toMatchObject({
      result: { status: 'unknown', code: 'ACTION_RECEIPT_MISSING' }
    })
  })
  it('cannot fail canonical execution when a diagnostic observer throws', async () => {
    const receipt = { context: {}, actionResults: [] }
    expect(
      await observeActionBatch(
        batch,
        async () => receipt,
        definitions,
        undefined,
        () => {
          throw new Error('sink')
        }
      )
    ).toBe(receipt)
  })
})

it('records a reported browser rejection with measured time and does not invent other settlements', async () => {
  const batch = {
    batchId: 'b',
    actions: [
      { id: 'first', name: 'edit', arguments: {}, summary: 'Edit' },
      { id: 'second', name: 'inspect', arguments: {}, summary: 'Inspect' }
    ]
  }
  const error = new BrowserBatchExecutionError({
    batchId: 'b',
    actionName: 'edit',
    code: 'BROWSER_BATCH_EXECUTION_FAILED',
    message: 'Prepared design is invalid.',
    handlerMs: 13,
    executionMs: 20
  })
  const events: Record<string, unknown>[] = []
  await expect(
    observeActionBatch(
      batch,
      async () => {
        throw error
      },
      [],
      'native',
      (_, value) => events.push(value)
    )
  ).rejects.toBe(error)
  expect(events[2]).toMatchObject({
    result: {
      status: 'failed',
      message: error.message,
      actionObservation: { handlerMs: 13 },
      settlement: 'unknown'
    }
  })
  expect(events[3]).toMatchObject({ result: { status: 'unknown' } })
  expect(events[3].result).not.toHaveProperty('actionObservation.handlerMs')
})
