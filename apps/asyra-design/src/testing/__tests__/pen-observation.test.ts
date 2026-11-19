import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { TransactionStatusPayload } from '@asyra/utils'

const state = vi.hoisted(() => ({
  read: vi.fn(),
  depth: vi.fn(() => 2),
  subscribe: vi.fn(),
  dispose: vi.fn()
}))

vi.mock('../../contexts', () => ({
  default: {
    getElementComputedData: state.read,
    getUndoHistoryDepth: state.depth,
    subscribeToTransactionStatus: state.subscribe
  }
}))

import {
  readPenVector,
  startPenHistoryObservation,
  finishPenHistoryObservation
} from '../pen-observation'

const data = () => ({
  x: 80,
  y: 90,
  width: 20,
  height: 30,
  closed: false,
  points: {
    a: {
      id: 'a',
      kind: 'anchor',
      x: 80,
      y: 90,
      anchorType: 'sharp',
      handleMode: 'none'
    }
  },
  segments: {},
  networks: { n: { id: 'n', closed: false, pointIds: ['a'], segmentIds: [] } }
})

beforeEach(() => {
  vi.clearAllMocks()
  state.read.mockReturnValue(data())
  state.subscribe.mockReturnValue(state.dispose)
})
afterEach(() => finishPenHistoryObservation())

const assertStoredObservation = (read = readPenVector) => {
  const original = data()
  const expected = structuredClone(original)

  state.read.mockReturnValue(original)
  const result = read('vector')

  expect(result).toMatchObject(expected)
  expect(result.points).toBe(original.points)
  expect(state.read).toHaveBeenCalledExactlyOnceWith('vector')
}

it('reads actual stored topology without converting source coordinates or fabricating bounds', () => {
  assertStoredObservation()
})

it('rejects in-place coordinate corruption even when result and source share points', () => {
  expect(() =>
    assertStoredObservation((id) => {
      const result = readPenVector(id)

      result.points.a.x = 0
      result.points.a.y = 0

      return result
    })
  ).toThrow()
})

it.each([
  null,
  {},
  { ...data(), points: null },
  { ...data(), width: NaN },
  {
    ...data(),
    segments: { bad: { id: 'bad', startId: 'missing', endId: 'a' } }
  }
])('rejects unavailable or invalid canonical observation %j', (invalid) => {
  state.read.mockReturnValue(invalid)
  expect(() => readPenVector('vector')).toThrow()
})

it('does not turn an absent editing target into an empty valid vector', () => {
  expect(() => readPenVector(null)).toThrow()
  expect(state.read).not.toHaveBeenCalled()
})

it('observes actual committed history counts and releases the subscription', () => {
  let observer: ((status: TransactionStatusPayload) => void) | undefined

  state.subscribe.mockImplementation(
    (callback: (status: TransactionStatusPayload) => void) => {
      observer = callback

      return state.dispose
    }
  )
  startPenHistoryObservation()
  const status: TransactionStatusPayload = {
    transactionId: 1,
    origin: 'action',
    status: 'committed',
    changeCount: 7,
    undoableChangeCount: 3,
    rollbackableChangeCount: 7,
    nonRollbackableChangeCount: 0,
    timestamp: 1
  }

  observer?.({ ...status, status: 'rolled-back' })
  observer?.({ ...status, undoableChangeCount: 0 })
  observer?.(status)
  expect(finishPenHistoryObservation()).toEqual({
    undoCount: 2,
    commitCount: 1,
    changeCount: 3
  })
  expect(state.dispose).toHaveBeenCalledOnce()
})
