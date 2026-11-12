import { describe, expect, it, vi } from 'vitest'
import { createEvaluationReportSessions } from '../evaluation-report-sessions'

describe('evaluation report session ownership', () => {
  const setup = () => {
    const sessions = createEvaluationReportSessions()
    const owner = {
      nativeThreadId: 'original-thread',
      requestId: 'drawing-request',
      ask: vi.fn(async (question: string) => ({
        nativeThreadId: 'original-thread',
        nativeTurnId: question,
        messages: [{ phase: 'commentary', text: question }]
      })),
      close: vi.fn(async () => undefined),

      lost: () => false,

      record: vi.fn(async () => undefined)
    }
    const retained = sessions.retain(owner)

    return { sessions, owner, retained }
  }

  it('retains an idle owner without inference and serializes multiple questions', async () => {
    const { sessions, owner, retained } = setup()

    expect(sessions.status(retained.sessionId).status).toBe('waiting')
    expect(owner.ask).not.toHaveBeenCalled()
    let release!: () => void
    const wait = new Promise<void>((resolve) => {
      release = resolve
    })

    owner.ask.mockImplementationOnce(async (question) => {
      await wait

      return {
        nativeThreadId: 'original-thread',
        nativeTurnId: question,
        messages: []
      }
    })
    const first = sessions.ask(retained.sessionId, 'first')
    const second = sessions.ask(retained.sessionId, 'second')

    await vi.waitFor(() => expect(owner.ask).toHaveBeenCalledTimes(1))
    release()
    await Promise.all([first, second])
    expect(owner.ask.mock.calls).toEqual([['first'], ['second']])
    expect(owner.record).toHaveBeenCalledTimes(4)
    expect(sessions.status(retained.sessionId).status).toBe('waiting')
    await sessions.close(retained.sessionId)
    await sessions.close(retained.sessionId)
    expect(owner.close).toHaveBeenCalledTimes(1)
    await expect(sessions.ask(retained.sessionId, 'late')).rejects.toThrow(
      'closed'
    )
  })

  it('reports loss explicitly without replacing the native owner', async () => {
    const { sessions, owner, retained } = setup()

    owner.lost = () => true
    expect(sessions.status(retained.sessionId).status).toBe('lost')
    await expect(sessions.ask(retained.sessionId, 'recover')).rejects.toThrow(
      'lost'
    )
    expect(owner.ask).not.toHaveBeenCalled()
    await sessions.dispose()
    expect(owner.close).toHaveBeenCalledTimes(1)
  })

  it('does not infer when retaining the question evidence fails', async () => {
    const { sessions, owner, retained } = setup()

    owner.record.mockRejectedValueOnce(Error('disk unavailable'))
    await expect(sessions.ask(retained.sessionId, 'question')).rejects.toThrow(
      'disk unavailable'
    )
    expect(owner.ask).not.toHaveBeenCalled()
    await sessions.dispose()
  })

  it('closes active work and rejects queued questions without starting another turn', async () => {
    const { sessions, owner, retained } = setup()
    let reject!: (error: Error) => void

    owner.ask.mockImplementationOnce(
      () =>
        new Promise((_resolve, failure) => {
          reject = failure
        })
    )
    owner.close.mockImplementationOnce(async () => {
      reject(Error('cancelled'))
    })
    const first = sessions.ask(retained.sessionId, 'first')
    const second = sessions.ask(retained.sessionId, 'second')
    const results = Promise.allSettled([first, second])

    await vi.waitFor(() => expect(owner.ask).toHaveBeenCalledTimes(1))
    await sessions.close(retained.sessionId)
    expect(
      (await results).every((result) => result.status === 'rejected')
    ).toBe(true)
    expect(owner.ask).toHaveBeenCalledTimes(1)
    expect(owner.close).toHaveBeenCalledTimes(1)
  })
})
