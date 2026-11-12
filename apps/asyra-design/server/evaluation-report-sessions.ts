import { randomUUID } from 'node:crypto'

export const evaluationReportSessionEndpoint = '/api/ai/evaluation-report'

export interface EvaluationReportReply {
  readonly nativeThreadId: string
  readonly nativeTurnId: string
  readonly messages: readonly { phase: string; text: string }[]
}

export class EvaluationReportFailure extends Error {
  constructor(
    message: string,
    readonly partial: EvaluationReportReply
  ) {
    super(message)
  }
}

export interface EvaluationReportOwner {
  readonly requestId: string
  readonly nativeThreadId: string
  ask(question: string): Promise<EvaluationReportReply>
  close(): Promise<void>
  lost(): boolean
  record(
    callId: string,
    phase: 'input' | 'output',
    value: unknown
  ): Promise<void>
}

/** Service-owned evaluation sessions; never an ordinary conversation resume path. */
export const createEvaluationReportSessions = () => {
  const entries = new Map<
    string,
    {
      owner: EvaluationReportOwner
      sequence: number
      status: 'waiting' | 'reporting' | 'closed'
      tail: Promise<unknown>
      closing?: Promise<void>
    }
  >()
  let disposed = false

  const get = (id: string) => {
    const entry = entries.get(id)

    if (!entry) {
      throw Error('Evaluation report session lost or unknown')
    }

    return entry
  }

  const available = (entry: ReturnType<typeof get>) => {
    if (entry.status === 'closed') {
      throw Error('Evaluation report session closed')
    }

    if (entry.owner.lost()) {
      throw Error('Evaluation report session lost')
    }
  }

  const status = (id: string) => {
    const entry = get(id)

    return {
      sessionId: id,
      requestId: entry.owner.requestId,
      nativeThreadId: entry.owner.nativeThreadId,
      status:
        entry.status !== 'closed' && entry.owner.lost() ? 'lost' : entry.status,
      endpoint: evaluationReportSessionEndpoint
    }
  }

  const close = (id: string): Promise<void> => {
    const entry = get(id)

    if (!entry.closing) {
      entry.status = 'closed'
      entry.closing = (async () => {
        await entry.owner.close()
        await entry.tail.catch(() => undefined)
        entry.tail = Promise.resolve()
        // Keep only a small closed identity, not the native provider closure.
        const { requestId, nativeThreadId } = entry.owner

        entry.owner = {
          requestId,
          nativeThreadId,

          ask: async () => {
            throw Error('Evaluation report session closed')
          },

          close: async () => undefined,

          lost: () => true,

          record: async () => undefined
        }
      })()
    }

    return entry.closing
  }

  return {
    retain(owner: EvaluationReportOwner) {
      if (disposed) {
        throw Error('Evaluation report service closed')
      }

      const id = randomUUID()

      entries.set(id, {
        owner,
        status: 'waiting',
        sequence: 0,
        tail: Promise.resolve()
      })

      return status(id)
    },

    status,

    ask(id: string, question: string) {
      const entry = get(id)
      const next = entry.tail
        .catch(() => undefined)
        .then(async () => {
          available(entry)
          if (!question.trim()) {
            throw Error('A report question is required')
          }

          entry.status = 'reporting'
          const callId = `evaluation-followup-${++entry.sequence}`

          try {
            await entry.owner.record(callId, 'input', {
              nativeThreadId: entry.owner.nativeThreadId,
              question
            })
            available(entry)
            const reply = await entry.owner.ask(question)

            await entry.owner.record(callId, 'output', reply)

            return reply
          } catch (error) {
            await entry.owner.record(`${callId}-failure`, 'output', {
              nativeThreadId: entry.owner.nativeThreadId,
              ...(error instanceof EvaluationReportFailure
                ? error.partial
                : {}),
              status: 'failed',
              error: error instanceof Error ? error.message : String(error)
            })
            throw error
          } finally {
            if (!entry.closing) {
              entry.status = 'waiting'
            }
          }
        })

      entry.tail = next

      return next
    },

    close,

    async dispose() {
      disposed = true
      await Promise.all([...entries.keys()].map(close))
    }
  }
}

export type EvaluationReportSessions = ReturnType<
  typeof createEvaluationReportSessions
>
