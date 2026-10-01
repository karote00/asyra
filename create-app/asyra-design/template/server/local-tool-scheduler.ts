export const LocalToolAccess = Object.freeze({
  INDEPENDENT: 'independent',
  EXCLUSIVE: 'exclusive'
} as const)
export type LocalToolAccess =
  (typeof LocalToolAccess)[keyof typeof LocalToolAccess]

/** One request lifetime: only owner-declared independent work shares a barrier. */
export const createLocalToolScheduler = (signal: AbortSignal) => {
  let exclusive: Promise<unknown> = Promise.resolve()
  let readers: Promise<unknown>[] = []
  return <T>(
    access: LocalToolAccess | undefined,
    work: () => Promise<T>
  ): Promise<T> => {
    const independent = access === LocalToolAccess.INDEPENDENT
    const before = independent
      ? exclusive
      : Promise.all([exclusive, ...readers])
    const task = before.then(() => {
      signal.throwIfAborted()
      return work()
    })
    // The caller owns error classification and aborts on fatal execution errors.
    // Recoverable input errors must not poison the next corrected tool call.
    const settled = task.catch(() => {
      // Error delivery belongs to the caller; keep the queue usable after rejection.
    })
    if (independent) {
      readers.push(settled)
      void settled.then(() => {
        readers = readers.filter((item) => item !== settled)
      })
    } else {
      exclusive = settled
      readers = []
    }
    return task
  }
}
