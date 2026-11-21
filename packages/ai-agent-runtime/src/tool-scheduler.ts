export const AiToolAccess = Object.freeze({
  COORDINATOR: 'coordinator',
  ISOLATED: 'isolated',
  INDEPENDENT: 'independent',
  EXCLUSIVE: 'exclusive'
} as const)

export type AiToolAccess = (typeof AiToolAccess)[keyof typeof AiToolAccess]

/** One request lifetime: only owner-declared independent work shares a barrier. */
export const createAiToolScheduler = (signal: AbortSignal) => {
  let exclusive: Promise<unknown> = Promise.resolve()
  let readers: Promise<unknown>[] = []

  return <T>(
    access: AiToolAccess | undefined,
    work: () => Promise<T>
  ): Promise<T> => {
    // Host-declared orchestration never owns the barrier needed by its leaves.
    if (
      access === AiToolAccess.COORDINATOR ||
      access === AiToolAccess.ISOLATED
    ) {
      return Promise.resolve().then(() => {
        signal.throwIfAborted()

        return work()
      })
    }

    const independent = access === AiToolAccess.INDEPENDENT
    const before = independent
      ? exclusive
      : Promise.all([exclusive, ...readers])
    const task = before.then(() => {
      signal.throwIfAborted()

      return work()
    })
    // The caller owns error delivery. Only task cancellation or unusable transport
    // aborts the queue; tool rejection must not poison the next corrected call.
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
