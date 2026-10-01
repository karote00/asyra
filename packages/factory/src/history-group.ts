declare const historyGroupHandle: unique symbol

/** Instance-local, lifetime-bound token. Never serialize or send to peers. */
export interface HistoryGroupHandle {
  readonly [historyGroupHandle]: true
}

export interface HistoryGroupStatus {
  readonly state: 'open' | 'closed'
  readonly memberCount: number
  readonly changeCount: number
  readonly warningReached: boolean
}

export interface HistoryGroupOptions {
  readonly warningChangeCount?: number
  readonly onChange?: (status: HistoryGroupStatus) => void
}
