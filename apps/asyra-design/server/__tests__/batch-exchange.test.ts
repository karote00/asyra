import { describe, expect, it } from 'vitest'
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
    if (!frame) throw new Error('Missing frame')
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
    if (!frame) throw new Error('Missing frame')
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
  if (!frame) throw new Error('Missing frame')
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
