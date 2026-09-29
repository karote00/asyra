/** One request lifetime: only adjacent read-only analysis calls share a barrier. */
export const createLocalToolScheduler = (signal: AbortSignal) => {
  let exclusive: Promise<unknown> = Promise.resolve()
  let readers: Promise<unknown>[] = []
  return <T>(readOnly: boolean, work: () => Promise<T>): Promise<T> => {
    const before = readOnly ? exclusive : Promise.all([exclusive, ...readers])
    const task = before.then(() => {
      signal.throwIfAborted()
      return work()
    })
    // The caller owns error classification and aborts on fatal execution errors.
    // Recoverable input errors must not poison the next corrected tool call.
    const settled = task.catch(() => {
      // Error delivery belongs to the caller; keep the queue usable after rejection.
    })
    if (readOnly) {
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
