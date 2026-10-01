import { describe, expect, it, vi } from 'vitest'
import {
  subscribeToUserActionCompleted,
  EventTypes,
  type AllEvent,
  type UpdateTransactionEvent
} from '@asyra/reactive-events'
import { SharedDataChannelNames } from '@asyra/utils'
import { Factory, LocalSharedDataChannel, type HistoryGroupStatus } from '..'

const setup = () => {
  const factory = new Factory()
  const values = new Map<string, number>()
  const replay: number[] = []
  const write = (
    id: string,
    after: number,
    options: UpdateTransactionEvent['options'] = {}
  ) => {
    const before = values.get(id) ?? 0
    values.set(id, after)
    factory.updateTransaction({
      type: EventTypes.UPDATE_TRANSACTION,
      eventName: EventTypes.UPDATE_PROPERTY,
      payload: { id, before, after },
      options
    })
  }
  const removeReplayHandler = factory.registerTransactionReplayHandler(
    EventTypes.UPDATE_PROPERTY,
    (event) => {
      const { id, after } = (
        event as AllEvent & { payload: { id: string; after: number } }
      ).payload
      values.set(id, after)
      replay.push(after)
      return true
    }
  )
  const commit = (callback: () => void) => {
    factory.startTransaction()
    callback()
    factory.endTransaction()
  }
  return { factory, values, write, commit, replay, removeReplayHandler }
}

describe('explicit history groups', () => {
  it('emits one history completion at seal while physical commits remain independent', () => {
    const factory = new Factory({ bridgeToReactiveEvents: true })
    const completed = vi.fn()
    const captures = vi.fn()
    const dispose = subscribeToUserActionCompleted(completed)
    factory.subscribeToCommitCapture(captures)
    try {
      const group = factory.startHistoryGroup()
      for (const after of [1, 2])
        factory.updateHistoryGroup(group, () =>
          factory.updateTransaction({
            type: EventTypes.UPDATE_TRANSACTION,
            eventName: EventTypes.UPDATE_PROPERTY,
            payload: { id: 'x', before: after - 1, after },
            options: {}
          })
        )
      expect(captures).toHaveBeenCalledTimes(2)
      expect(completed).not.toHaveBeenCalled()
      factory.endHistoryGroup(group)
      expect(captures).toHaveBeenCalledTimes(2)
      expect(completed).toHaveBeenCalledTimes(1)
    } finally {
      dispose.unsubscribe()
    }
  })

  it('restores the full group and its stack position after a later inverse fails', () => {
    const { factory, values, write, removeReplayHandler } = setup()
    removeReplayHandler()
    let reject = false
    factory.registerTransactionReplayHandler(
      EventTypes.UPDATE_PROPERTY,
      (event) => {
        const { id, after } = (
          event as AllEvent & { payload: { id: string; after: number } }
        ).payload
        if (reject && id === 'x' && after === 0)
          throw new Error('target unavailable')
        values.set(id, after)
        return true
      }
    )
    const group = factory.startHistoryGroup()
    factory.updateHistoryGroup(group, () => write('x', 1))
    factory.updateHistoryGroup(group, () => write('y', 2))
    factory.endHistoryGroup(group)
    reject = true
    expect(() => factory.undo()).toThrow()
    expect(Object.fromEntries(values)).toEqual({ x: 1, y: 2 })
    expect(factory.getUndoHistoryDepth()).toBe(1)
    expect(factory.getActiveStagedDeliveryController()).toBeNull()
    reject = false
    factory.undo()
    expect(Object.fromEntries(values)).toEqual({ x: 0, y: 0 })
    factory.redo()
    expect(Object.fromEntries(values)).toEqual({ x: 1, y: 2 })
  })

  it('does not enroll a member whose shared settlement fails and retains Redo', () => {
    const { factory, values, write, commit } = setup()
    commit(() => write('user', 1))
    factory.undo()
    const channel = SharedDataChannelNames.SCENE_TREE
    const sink = new LocalSharedDataChannel()
    sink.appendBatch = () => {
      throw new Error('delivery failed before apply')
    }
    factory.registerSharedDataChannel(channel, sink)
    const group = factory.startHistoryGroup()
    expect(() =>
      factory.updateHistoryGroup(group, () =>
        write('x', 2, { shared: channel })
      )
    ).toThrow('delivery failed before apply')
    expect(factory.getHistoryGroupStatus(group).memberCount).toBe(0)
    expect(values.get('x')).toBe(0)
    factory.redo()
    expect(values.get('user')).toBe(1)
  })

  it('keeps each user commit separate from multiple interleaved groups', () => {
    const { factory, write, values, commit } = setup()
    const first = factory.startHistoryGroup()
    const second = factory.startHistoryGroup()
    factory.updateHistoryGroup(first, () => write('a', 1))
    commit(() => write('user', 2))
    factory.updateHistoryGroup(second, () => write('b', 3))
    factory.updateHistoryGroup(first, () => write('a', 4))
    expect(factory.getUndoHistoryDepth()).toBe(1)
    factory.endHistoryGroup(second)
    factory.endHistoryGroup(first)
    expect(factory.getUndoHistoryDepth()).toBe(3)
    factory.undo()
    expect(values.get('a')).toBe(0)
    expect(values.get('b')).toBe(3)
    expect(values.get('user')).toBe(2)
    factory.undo()
    expect(values.get('b')).toBe(0)
    factory.undo()
    expect(values.get('user')).toBe(0)
    factory.redo()
    factory.redo()
    factory.redo()
    expect(Object.fromEntries(values)).toEqual({ a: 4, user: 2, b: 3 })
  })

  it('retains successful batches when a later member throws', () => {
    const { factory, write, values } = setup()
    const notices: HistoryGroupStatus[] = []
    const group = factory.startHistoryGroup({
      onChange: (status) => notices.push(status)
    })
    factory.updateHistoryGroup(group, () => write('x', 1))
    expect(() =>
      factory.updateHistoryGroup(group, () => {
        write('x', 2)
        throw new Error('member rejected')
      })
    ).toThrow('member rejected')
    expect(values.get('x')).toBe(1)
    expect(notices).toHaveLength(1)
    expect(factory.getHistoryGroupStatus(group).memberCount).toBe(1)
    factory.endHistoryGroup(group)
    factory.undo()
    expect(values.get('x')).toBe(0)
    factory.redo()
    expect(values.get('x')).toBe(1)
  })

  it('does not record validation-rejected members', () => {
    const { factory, write, values } = setup()
    const group = factory.startHistoryGroup()
    let reject = true
    factory.registerTransactionValidator('reject', () =>
      reject
        ? { valid: false, code: 'invalid', message: 'Invalid member' }
        : undefined
    )
    expect(() =>
      factory.updateHistoryGroup(group, () => write('x', 2))
    ).toThrow('Invalid member')
    expect(values.get('x')).toBe(0)
    expect(factory.getHistoryGroupStatus(group).changeCount).toBe(0)
    reject = false
    factory.updateHistoryGroup(group, () => write('x', 3))
    factory.endHistoryGroup(group)
    factory.undo()
    expect(values.get('x')).toBe(0)
  })

  it('preserves Redo for empty/non-undoable groups and clears it on an undoable member', () => {
    const { factory, commit, write, values } = setup()
    commit(() => write('user', 1))
    factory.undo()
    const group = factory.startHistoryGroup()
    factory.updateHistoryGroup(group, () => undefined)
    factory.updateHistoryGroup(group, () =>
      write('other', 5, { undoable: false })
    )
    expect(factory.endHistoryGroup(group)).toMatchObject({
      memberCount: 0,
      changeCount: 0
    })
    factory.redo()
    expect(values.get('user')).toBe(1)
    factory.undo()
    const next = factory.startHistoryGroup()
    factory.updateHistoryGroup(next, () => write('other', 6))
    factory.redo()
    expect(values.get('user')).toBe(0)
    factory.endHistoryGroup(next)
  })

  it('joins nested finite transactions and returns the callback result', () => {
    const { factory, write } = setup()
    const group = factory.startHistoryGroup()
    expect(
      factory.updateHistoryGroup(group, () => {
        factory.startTransaction()
        write('x', 1)
        factory.endTransaction()
        return 42
      })
    ).toBe(42)
    expect(factory.getHistoryGroupStatus(group)).toMatchObject({
      memberCount: 1,
      changeCount: 1
    })
    expect(factory.getActiveStagedDeliveryController()).toBeNull()
  })

  it('rejects foreign, sealed and reset handles before invoking mutation', () => {
    const { factory } = setup()
    const group = factory.startHistoryGroup()
    const callback = vi.fn()
    expect(() => new Factory().updateHistoryGroup(group, callback)).toThrow(
      /handle/
    )
    factory.endHistoryGroup(group)
    expect(() => factory.updateHistoryGroup(group, callback)).toThrow(/handle/)
    const retired = factory.startHistoryGroup()
    factory.resetRuntime()
    expect(() => factory.updateHistoryGroup(retired, callback)).toThrow(
      /handle/
    )
    expect(() => factory.getHistoryGroupStatus(retired)).toThrow(/handle/)
    expect(callback).not.toHaveBeenCalled()
  })

  it('rejects unrelated active boundaries and closing an active member', () => {
    const { factory, write } = setup()
    const group = factory.startHistoryGroup()
    factory.startTransaction()
    const callback = vi.fn()
    expect(() => factory.updateHistoryGroup(group, callback)).toThrow(/idle/)
    factory.endTransaction()
    factory.updateHistoryGroup(group, () => {
      write('x', 1)
      expect(() => factory.endHistoryGroup(group)).toThrow(/idle/)
      expect(() => factory.undo()).toThrow(/group member/)
      expect(() => factory.redo()).toThrow(/group member/)
    })
    expect(callback).not.toHaveBeenCalled()
    factory.endHistoryGroup(group)
  })

  it('rejects a thenable result and rolls back the synchronous work', () => {
    const { factory, values, write } = setup()
    const group = factory.startHistoryGroup()
    expect(() =>
      factory.updateHistoryGroup(group, () => {
        write('x', 1)
        return Promise.resolve(1)
      })
    ).toThrow(/synchronous/)
    expect(values.get('x')).toBe(0)
    expect(factory.getHistoryGroupStatus(group).memberCount).toBe(0)
    expect(factory.getActiveStagedDeliveryController()).toBeNull()
  })

  it('keeps remote changes out of a pending group', () => {
    const { factory, write } = setup()
    const group = factory.startHistoryGroup()
    factory.runRemoteTransaction(() => write('remote', 1))
    expect(factory.getHistoryGroupStatus(group).memberCount).toBe(0)
    factory.updateHistoryGroup(group, () => write('local', 1))
    expect(factory.getHistoryGroupStatus(group).changeCount).toBe(1)
  })

  it('reports incremental committed counts and an advisory warning without stopping', () => {
    const { factory, write } = setup()
    const notices: HistoryGroupStatus[] = []
    const group = factory.startHistoryGroup({
      warningChangeCount: 2,
      onChange: (status) => {
        notices.push(status)
        throw new Error('observer')
      }
    })
    for (let index = 1; index <= 3; index++)
      factory.updateHistoryGroup(group, () => write('x', index))
    expect(
      notices.map((notice) => [
        notice.memberCount,
        notice.changeCount,
        notice.warningReached
      ])
    ).toEqual([
      [1, 1, false],
      [2, 2, true],
      [3, 3, true]
    ])
    factory.endHistoryGroup(group)
    expect(notices[3]).toMatchObject({ state: 'closed', memberCount: 3 })
    expect(factory.getUndoHistoryDepth()).toBe(1)
  })

  it.each([0, -1, 1.5, Infinity, NaN])(
    'rejects invalid advisory threshold %s',
    (warningChangeCount) => {
      expect(() =>
        new Factory().startHistoryGroup({ warningChangeCount })
      ).toThrow(/positive safe integer/)
    }
  )

  it.each(['atomic', 'progressive'] as const)(
    'preserves each member slice order during %s replay even when slice names and target ids repeat',
    async (mode) => {
      const { factory } = setup()
      const channel = SharedDataChannelNames.SCENE_TREE
      factory.registerSharedDataChannel(channel, new LocalSharedDataChannel())
      const projected: string[] = []
      factory.observeSharedDataChannel<{ id: string }>(channel, ({ id }) =>
        projected.push(id)
      )
      const group = factory.startHistoryGroup()
      for (const after of [1, 2]) {
        factory.updateHistoryGroup(group, () => {
          factory.updateTransactionBatch(
            ['x', 'y'].map((id) => ({
              type: EventTypes.UPDATE_TRANSACTION,
              eventName: EventTypes.UPDATE_PROPERTY,
              payload: { id, before: after - 1, after },
              options: { shared: channel },
              canonicalEvidence: { orderedIds: [id] }
            }))
          )
          factory.getActiveStagedDeliveryController()?.setDeliverySequence({
            mode: 'progressive',
            batchPublications: false,
            slices: [
              { sliceId: 'second', orderedIds: ['y'] },
              { sliceId: 'first', orderedIds: ['x'] }
            ]
          })
        })
      }
      expect(projected).toEqual(['y', 'x', 'y', 'x'])
      factory.endHistoryGroup(group)
      projected.length = 0
      if (mode === 'atomic') factory.undo()
      else {
        factory.startTransaction()
        await factory
          .getTransactionOwner()
          .undoProgressively(async () => undefined)
        factory.endTransaction()
      }
      expect(projected).toEqual(['x', 'y', 'x', 'y'])
      projected.length = 0
      if (mode === 'atomic') factory.redo()
      else {
        factory.startTransaction()
        await factory
          .getTransactionOwner()
          .redoProgressively(async () => undefined)
        factory.endTransaction()
      }
      expect(projected).toEqual(['y', 'x', 'y', 'x'])
    }
  )

  it('replays shared publications from separate members without losing delivery evidence', () => {
    const { factory, write } = setup()
    const channel = SharedDataChannelNames.SCENE_TREE
    factory.registerSharedDataChannel(channel, new LocalSharedDataChannel())
    const projected: number[] = []
    factory.observeSharedDataChannel<{ after: number }>(channel, ({ after }) =>
      projected.push(after)
    )
    const group = factory.startHistoryGroup()
    factory.updateHistoryGroup(group, () => write('x', 1, { shared: channel }))
    factory.updateHistoryGroup(group, () => write('x', 2, { shared: channel }))
    factory.endHistoryGroup(group)
    factory.undo()
    factory.redo()
    expect(projected).toEqual([1, 2, 1, 0, 1, 2])
  })
})
