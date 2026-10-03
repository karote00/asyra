import { describe, expect, it, vi } from 'vitest'
import { Factory } from '@asyra/factory'
import { EventTypes, type AllEvent } from '@asyra/reactive-events'
import { AiTransactionSettlementError } from '@asyra/ai-agent-runtime'
import { createAiTransactionRunner } from '../transaction'
import { documentInteractionLock } from '../document-interaction-lock'

const setup = () => {
  const apis = new Factory()
  const values = new Map<string, number>()
  const write = (id: string, after: number) => {
    const before = values.get(id) ?? 0
    values.set(id, after)
    apis.updateTransaction({
      type: EventTypes.UPDATE_TRANSACTION,
      eventName: EventTypes.UPDATE_PROPERTY,
      payload: { id, before, after },
      options: {}
    })
  }
  apis.registerTransactionReplayHandler(EventTypes.UPDATE_PROPERTY, (event) => {
    const { id, after } = (
      event as AllEvent & { payload: { id: string; after: number } }
    ).payload
    values.set(id, after)
    return true
  })
  let actionId = 0
  apis.subscribeToCommitCapture(() => {
    actionId++
  })
  const history = {
    getCurrentActionId: () => actionId,
    correlateCommittedAction: vi.fn(() => true)
  }
  return {
    apis,
    values,
    write,
    history,
    runner: createAiTransactionRunner({ apis, history })
  }
}

describe('Design invocation history groups', () => {
  it('publishes each member and permits independent user Undo before sealing one AI entry', async () => {
    const { apis, values, write, runner } = setup()
    const captures = vi.fn()
    apis.subscribeToCommitCapture(captures)
    await runner.run('draw', async (mutate) => {
      if (!mutate) throw new Error('Expected grouped mutation executor')
      expect(documentInteractionLock.isActive()).toBe(false)
      await mutate(() => write('ai', 1))
      expect(values.get('ai')).toBe(1)
      expect(apis.isTransactionBoundaryIdle()).toBe(true)
      expect(apis.getUndoHistoryDepth()).toBe(0)
      expect(captures).toHaveBeenCalledOnce()
      apis.startTransaction()
      write('user', 10)
      apis.endTransaction()
      apis.undo()
      expect(values.get('user')).toBe(0)
      expect(values.get('ai')).toBe(1)
      await mutate(() => write('ai', 2))
    })
    expect(apis.getUndoHistoryDepth()).toBe(1)
    apis.undo()
    expect(values.get('ai')).toBe(0)
    apis.redo()
    expect(values.get('ai')).toBe(2)
  })

  it('retains successful members and rolls back only the member that throws', async () => {
    const { apis, values, write, runner } = setup()
    const failure = new Error('Bad later slice')
    const result = runner.run('draw', async (mutate) => {
      if (!mutate) throw new Error('Expected grouped mutation executor')
      await mutate(() => write('ai', 1))
      await mutate(() => {
        write('ai', 2)
        throw failure
      })
    })
    await expect(result).rejects.toMatchObject({
      cause: failure,
      status: 'committed'
    })
    expect(values.get('ai')).toBe(1)
    expect(apis.getUndoHistoryDepth()).toBe(1)
    apis.undo()
    expect(values.get('ai')).toBe(0)
  })

  it('waits for an open user interaction without enrolling it in AI history', async () => {
    const { apis, values, write, runner } = setup()
    apis.startTransaction()
    write('user', 10)
    const pending = runner.run('draw', async (mutate) => {
      if (!mutate) throw new Error('Expected grouped mutation executor')
      return mutate(() => write('ai', 1))
    })
    await Promise.resolve()
    expect(values.has('ai')).toBe(false)
    apis.endTransaction()
    await pending
    expect(apis.getUndoHistoryDepth()).toBe(2)
    apis.undo()
    expect(values.get('ai')).toBe(0)
    expect(values.get('user')).toBe(10)
  })

  it('cancels queued writes and still seals earlier successful work after the user interaction ends', async () => {
    const { apis, values, write, runner } = setup()
    const controller = new AbortController()
    let blocked!: () => void
    const started = new Promise<void>((resolve) => {
      blocked = resolve
    })
    const pending = runner.run(
      'draw',
      async (mutate) => {
        if (!mutate) throw new Error('Expected grouped mutation executor')
        await mutate(() => write('ai', 1))
        apis.startTransaction()
        write('user', 10)
        blocked()
        await mutate(() => write('ai', 2))
      },
      { signal: controller.signal }
    )
    await started
    controller.abort()
    await Promise.resolve()
    expect(values.get('ai')).toBe(1)
    apis.endTransaction()
    await expect(pending).rejects.toMatchObject({ status: 'committed' })
    expect(apis.getUndoHistoryDepth()).toBe(2)
    apis.undo()
    expect(values.get('user')).toBe(10)
    expect(values.get('ai')).toBe(0)
  })

  it('does not correlate unrelated user history during a read-only request', async () => {
    const { apis, write, runner, history } = setup()
    await runner.run('read', async () => {
      apis.startTransaction()
      write('user', 1)
      apis.endTransaction()
      return 'read answer'
    })
    expect(apis.getUndoHistoryDepth()).toBe(1)
    expect(history.correlateCommittedAction).not.toHaveBeenCalled()
  })

  it('reports unknown when sealing fails rather than claiming a rollback', async () => {
    const { apis, write, runner } = setup()
    const failure = new Error('Seal failed')
    apis.endHistoryGroup = vi.fn(() => {
      throw failure
    })
    await expect(
      runner.run('draw', async (mutate) => {
        if (!mutate) throw new Error('Expected grouped mutation executor')
        return mutate(() => write('ai', 1))
      })
    ).rejects.toBeInstanceOf(AiTransactionSettlementError)
    expect(apis.getUndoHistoryDepth()).toBe(0)
    expect(apis.isTransactionBoundaryIdle()).toBe(true)
  })
})
