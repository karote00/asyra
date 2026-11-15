import core from '../contexts'
import { isRecord, type TransactionStatusPayload } from '@asyra/utils'
import { isVectorTopology } from '../common-apis/element/vector-topology'
import { assertVectorTopologyConsistency } from '../common-apis/element/vector-consistency'

export { core }
export { systemContextApis } from '../common-apis/system-context'
export { viewportApis } from '../common-apis/viewport'

/** Read stored coordinates; local/workspace conversion would change this oracle. */
export const readPenVector = (elementId: string | null) => {
  if (!elementId) {
    throw new Error('Missing Pen editing target')
  }

  const data = core.getElementComputedData(elementId)

  if (!isRecord(data)) {
    throw new Error('Missing canonical Vector data')
  }

  const { x, y, width, height, closed } = data

  if (!isVectorTopology(data)) {
    throw new Error('Missing canonical Vector topology')
  }

  assertVectorTopologyConsistency(data)

  if (
    typeof x !== 'number' ||
    !Number.isFinite(x) ||
    typeof y !== 'number' ||
    !Number.isFinite(y) ||
    typeof width !== 'number' ||
    !Number.isFinite(width) ||
    typeof height !== 'number' ||
    !Number.isFinite(height) ||
    typeof closed !== 'boolean'
  ) {
    throw new Error('Invalid canonical Vector bounds or closed state')
  }

  return {
    points: data.points,
    segments: data.segments,
    networks: data.networks,
    x,
    y,
    width,
    height,
    closed
  }
}

let disposeHistory: (() => void) | undefined
let committed: TransactionStatusPayload[] = []

export const startPenHistoryObservation = () => {
  disposeHistory?.()
  committed = []
  disposeHistory = core.subscribeToTransactionStatus((status) => {
    if (status.status === 'committed' && status.undoableChangeCount > 0) {
      committed.push(status)
    }
  })
}

export const finishPenHistoryObservation = () => {
  disposeHistory?.()
  disposeHistory = undefined

  return {
    undoCount: core.getUndoHistoryDepth(),
    commitCount: committed.length,
    changeCount: committed.reduce(
      (sum, status) => sum + status.undoableChangeCount,
      0
    )
  }
}
