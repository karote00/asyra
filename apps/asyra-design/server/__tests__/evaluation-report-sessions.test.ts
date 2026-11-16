import { describe, expect, it, vi } from 'vitest'
import {
  createEvaluationReportSessions,
  EvaluationReportFailure
} from '../evaluation-report-sessions'

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
    const replies = await Promise.all([first, second])

    expect(replies).toEqual([
      expect.objectContaining({ recording: { status: 'saved' } }),
      expect.objectContaining({ recording: { status: 'saved' } })
    ])
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

  it('delivers a completed answer when output recording fails and continues queued questions without replay', async () => {
    const { sessions, owner, retained } = setup()

    owner.record
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(Error('output storage unavailable'))
    try {
      const first = sessions.ask(retained.sessionId, 'first')
      const second = sessions.ask(retained.sessionId, 'second')
      const replies = await Promise.all([first, second])

      expect(replies[0]).toEqual({
        nativeThreadId: 'original-thread',
        nativeTurnId: 'first',
        messages: [{ phase: 'commentary', text: 'first' }],
        recording: { status: 'failed', message: 'output storage unavailable' }
      })
      expect(replies[1]).toMatchObject({
        nativeTurnId: 'second',
        recording: { status: 'saved' }
      })
      expect(owner.ask.mock.calls).toEqual([['first'], ['second']])
      expect(owner.record).toHaveBeenCalledTimes(4)
      expect(sessions.status(retained.sessionId).status).toBe('waiting')
    } finally {
      await sessions.dispose()
    }
  })

  it('preserves the original provider failure and partial answer when failure recording also fails', async () => {
    const { sessions, owner, retained } = setup()
    const partial = {
      nativeThreadId: 'original-thread',
      nativeTurnId: 'interrupted',
      messages: [{ phase: 'commentary', text: 'Partial answer' }]
    }
    const failure = new EvaluationReportFailure(
      'provider disconnected',
      partial
    )

    owner.ask.mockRejectedValueOnce(failure)
    owner.record
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(Error('failure storage unavailable'))
    try {
      await expect(sessions.ask(retained.sessionId, 'question')).rejects.toBe(
        failure
      )
      expect(failure.partial).toEqual(partial)
      expect(owner.ask).toHaveBeenCalledTimes(1)
      expect(owner.record).toHaveBeenLastCalledWith(
        'evaluation-followup-1-failure',
        'output',
        { ...partial, status: 'failed', error: 'provider disconnected' }
      )
    } finally {
      await sessions.dispose()
    }
  })

  it('delivers a valid failure receipt even when the recording exception has no message', async () => {
    const { sessions, owner, retained } = setup()

    owner.record
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(Error(''))
    try {
      const reply = await sessions.ask(retained.sessionId, 'question')

      expect(reply.messages).toEqual([
        { phase: 'commentary', text: 'question' }
      ])
      expect(reply.recording).toEqual({
        status: 'failed',
        message: 'Report output recording failed'
      })
      expect(owner.ask).toHaveBeenCalledTimes(1)
    } finally {
      await sessions.dispose()
    }
  })

  it('preserves input admission failure when its failure record is also unavailable', async () => {
    const { sessions, owner, retained } = setup()
    const failure = Error('input storage unavailable')

    owner.record
      .mockRejectedValueOnce(failure)
      .mockRejectedValueOnce(Error('failure storage unavailable'))
    try {
      await expect(sessions.ask(retained.sessionId, 'question')).rejects.toBe(
        failure
      )
      expect(owner.ask).not.toHaveBeenCalled()
    } finally {
      await sessions.dispose()
    }
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
