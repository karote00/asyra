/**
 * Transaction APIs - for data modifications
 * Used in: create-element, selection, and many future features
 */

import {
  type FactoryMutationDeliverySequence,
  startTransaction,
  endTransaction,
  rollbackTransaction,
  runTransaction,
  updateTransaction
} from '@asyra/core'
import core from '../contexts'

const configureSharedDeliverySequence = (
  sequence: FactoryMutationDeliverySequence
): void => {
  core.configureSharedDeliverySequence(sequence)
}

export const transactionApis = {
  startTransaction,
  endTransaction,
  rollbackTransaction,
  runTransaction,
  updateTransaction,
  configureSharedDeliverySequence,
  isTransactionBoundaryIdle: () => core.isTransactionBoundaryIdle(),
  startHistoryGroup: (...args: Parameters<typeof core.startHistoryGroup>) =>
    core.startHistoryGroup(...args),
  updateHistoryGroup: <T>(
    handle: Parameters<typeof core.updateHistoryGroup>[0],
    mutate: () => T
  ): T => core.updateHistoryGroup(handle, mutate),
  endHistoryGroup: (...args: Parameters<typeof core.endHistoryGroup>) =>
    core.endHistoryGroup(...args),
  subscribeToTransactionStatus: (
    ...args: Parameters<typeof core.subscribeToTransactionStatus>
  ) => core.subscribeToTransactionStatus(...args)
}
