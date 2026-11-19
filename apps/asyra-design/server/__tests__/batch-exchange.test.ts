import { describe, expect, it } from 'vitest'
import { AiActionExecutionError } from '@asyra/ai-agent-runtime'
import { describeBatchFailure } from '../../src/ai/action-failure'
import { summarizeAiTurn } from '../../src/ai/presentation'
import { createBatchExchange, type PreparedBatchFrame } from '../batch-exchange'

const batch = { batchId: 'one', actions: [] }
const receipt = { actionResults: [], context: {} }

describe('request-owned batch receipts', () => {
  it('waits for the matching one-use receipt and rejects foreign or duplicate receipts', async () => {
    const exchange = createBatchExchange()
    let frame: PreparedBatchFrame | undefined
    let settled = false
    const result = exchange
      .execute(batch, new AbortController().signal, (value) => {
        frame = value
      })
      .then((value) => {
        settled = true

        return value
      })

    await Promise.resolve()
    expect(settled).toBe(false)
    if (!frame) {
      throw new Error('Missing frame')
    }

    expect(exchange.accept('foreign', receipt)).toBe(false)
    expect(exchange.accept(frame.receiptToken, receipt)).toBe(true)
    expect(await result).toEqual(receipt)
    expect(exchange.accept(frame.receiptToken, receipt)).toBe(false)
  })
  it('retires pending receipts on request cancellation', async () => {
    const exchange = createBatchExchange()
    const controller = new AbortController()
    let frame: PreparedBatchFrame | undefined
    const result = exchange.execute(batch, controller.signal, (value) => {
      frame = value
    })

    if (!frame) {
      throw new Error('Missing frame')
    }

    controller.abort()
    await expect(result).rejects.toThrow()
    expect(exchange.accept(frame.receiptToken, receipt)).toBe(false)
  })
})

it('accepts an admitted large canonical ID receipt without a smaller hidden transport limit', async () => {
  const exchange = createBatchExchange()
  let frame: PreparedBatchFrame | undefined
  const pending = exchange.execute(
    batch,
    new AbortController().signal,
    (value) => {
      frame = value
    }
  )

  if (!frame) {
    throw new Error('Missing frame')
  }

  const admitted = {
    actionResults: [
      {
        actionId: 'a',
        actionName: 'insert',
        result: {
          appliedElementIds: Array.from(
            { length: 30000 },
            (_, index) => `element-${String(index).padStart(32, '0')}`
          )
        }
      }
    ],
    context: {}
  }

  expect(exchange.accept(frame.receiptToken, admitted)).toBe(true)
  expect(await pending).toBe(admitted)
})

it('accepts an exact browser failure and rejects the exchange without waiting for abort', async () => {
  const exchange = createBatchExchange()
  let frame!: PreparedBatchFrame
  const pending = exchange.execute(
    batch,
    new AbortController().signal,
    (value) => {
      frame = value
    }
  )
  const outcome = pending.catch((error) => error)
  const batchFailure = {
    batchId: batch.batchId,
    actionName: null,
    code: 'BROWSER_BATCH_EXECUTION_FAILED',
    message: 'Batch admission failed.',
    handlerMs: null,
    executionMs: 12
  }

  expect(
    exchange.accept(frame.receiptToken, {
      batchFailure: { ...batchFailure, batchId: 'foreign' }
    })
  ).toBe(false)
  expect(
    exchange.accept(frame.receiptToken, {
      batchFailure: { ...batchFailure, actionName: 'foreign' }
    })
  ).toBe(false)
  expect(
    exchange.accept(frame.receiptToken, {
      batchFailure: { ...batchFailure, handlerMs: -1 }
    })
  ).toBe(false)
  expect(exchange.accept(frame.receiptToken, { batchFailure })).toBe(true)
  expect(await outcome).toMatchObject({ failure: batchFailure })
  expect(exchange.accept(frame.receiptToken, { batchFailure })).toBe(false)
})

it.each(['a', '\u{2000B}', 'e\u0301'])(
  'admits the public error code-point boundary independently of its producer - %s',
  async (character) => {
    const message = character.repeat(character === 'e\u0301' ? 500 : 1000)
    const exchange = createBatchExchange()
    const controller = new AbortController()
    let token = ''
    const outcome = exchange
      .execute(batch, controller.signal, (frame) => {
        token = frame.receiptToken
      })
      .catch((error: unknown) => error)
    const batchFailure = {
      batchId: batch.batchId,
      actionName: null,
      code: 'BROWSER_BATCH_EXECUTION_FAILED',
      message,
      handlerMs: null,
      executionMs: 12
    }

    try {
      expect(
        exchange.accept(token, {
          batchFailure: { ...batchFailure, message: message + 'a' }
        })
      ).toBe(false)
      expect(
        exchange.accept(token, {
          batchFailure: { ...batchFailure, message: '' }
        })
      ).toBe(false)
      expect(exchange.accept(token, { batchFailure })).toBe(true)
      expect(await outcome).toMatchObject({ failure: batchFailure })
      expect(exchange.accept(token, { batchFailure })).toBe(false)
    } finally {
      controller.abort()
      await outcome
    }
  }
)

it.each([501, 1000, 1001])(
  'carries a public Unicode error through browser receipt settlement and presentation - %s',
  async (length) => {
    const message = '\u{2000B}'.repeat(length)
    const expected = length <= 1000 ? message : 'AI action execution failed.'
    const error = new AiActionExecutionError(message)
    const batchFailure = describeBatchFailure(error, batch.batchId, 12)
    const exchange = createBatchExchange()
    const controller = new AbortController()
    let token = ''
    const outcome = exchange
      .execute(batch, controller.signal, (frame) => {
        token = frame.receiptToken
      })
      .catch((failure: unknown) => failure)

    try {
      expect(batchFailure.message).toBe(expected)
      expect(
        exchange.accept(token, JSON.parse(JSON.stringify({ batchFailure })))
      ).toBe(true)
      const failure = await outcome

      expect(failure).toBeInstanceOf(Error)
      if (!(failure instanceof Error)) {
        throw new Error('Missing settled execution failure')
      }

      expect(failure.message).toBe(expected)
      const summary = summarizeAiTurn({
        attachments: [],
        conversationId: 'conversation-a',
        durationMs: 12,
        intent: 'revise',
        outcome: 'failed',
        progress: [],
        turnId: 'conversation-a:turn:1',
        result: {
          status: 'failed',
          stage: 'execution',
          code: error.code,
          message: failure.message,
          transaction: { status: 'rolled-back' }
        }
      })

      expect(summary.message).toContain('rolled back')
      if (length <= 1000) {
        expect(summary.message).toContain(message)
      } else {
        expect(summary.message).not.toContain(message)
        expect(summary.message).not.toContain('AI action execution failed.')
      }
    } finally {
      controller.abort()
      await outcome
    }
  }
)
