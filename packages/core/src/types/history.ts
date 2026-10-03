import type { Factory } from '@asyra/factory'

/** Core binds these operations to its own Factory and document lifetime. */
export type HistoryGroupAPIs = Pick<
  Factory,
  | 'isTransactionBoundaryIdle'
  | 'startHistoryGroup'
  | 'updateHistoryGroup'
  | 'endHistoryGroup'
  | 'getHistoryGroupStatus'
>
