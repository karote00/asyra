import { beforeEach, describe, expect, it } from 'vitest'
import {
  EventTypes,
  applyEventToSynchronousOwners,
  type UpdateElementDataEvent,
  runWithTransactionOwner,
  runTransaction
} from '@asyra/reactive-events'
import { Factory } from '@asyra/factory'
import sceneTree from '@asyra/scene-tree'
import props from '@asyra/props-manager'
import { Core } from '../core.js'

const create = (factory: Factory) =>
  new Core({
    factory,
    sceneTree,
    props,
    inputSystem: {} as never,
    selection: {} as never,
    systemContext: {} as never,
    render: {
      getViewportPosition: () => ({ x: 0, y: 0 }),
      getViewportScale: () => 1
    } as never
  })

beforeEach(() => {
  sceneTree.reset()
  props.reset()
  sceneTree.init()
  sceneTree.cleanChanges()
})

describe('Core history group facade', () => {
  it('reads admission from the injected Factory rather than a global transaction', () => {
    const factory = new Factory()
    const core = create(factory)
    const other = create(new Factory())
    expect(core.isTransactionBoundaryIdle()).toBe(true)
    factory.startTransaction()
    expect(core.isTransactionBoundaryIdle()).toBe(false)
    expect(other.isTransactionBoundaryIdle()).toBe(true)
    factory.endTransaction()
    expect(core.isTransactionBoundaryIdle()).toBe(true)
    const group = core.startHistoryGroup()
    expect(core.isTransactionBoundaryIdle()).toBe(true)
    core.updateHistoryGroup(group, () =>
      expect(core.isTransactionBoundaryIdle()).toBe(false)
    )
    core.endHistoryGroup(group)
    expect(core.isTransactionBoundaryIdle()).toBe(true)
  })

  it('binds finite edits and group history to the injected Factory', () => {
    const factory = new Factory()
    const core = create(factory)
    const other = create(new Factory())
    const workspaceId = core.getCurrentWorkspaceId()
    if (!workspaceId) throw new Error('Missing workspace')
    const originalName = core.getElementData(workspaceId)?.name
    const group = core.startHistoryGroup()
    core.updateHistoryGroup(group, () =>
      core.updateElementData(workspaceId, { name: 'First' })
    )
    expect(core.getElementData(workspaceId)?.name).toBe('First')
    expect(core.getUndoHistoryDepth()).toBe(0)
    expect(() => other.updateHistoryGroup(group, () => undefined)).toThrow(
      /handle/
    )
    core.updateHistoryGroup(group, () =>
      core.updateElementData(workspaceId, { name: 'Second' })
    )
    expect(core.getHistoryGroupStatus(group).memberCount).toBe(2)
    core.endHistoryGroup(group)
    expect(core.getUndoHistoryDepth()).toBe(1)
    factory.undo()
    expect(core.getElementData(workspaceId)?.name).toBe(originalName)
    factory.redo()
    expect(core.getElementData(workspaceId)?.name).toBe('Second')
  })

  it('uses ordinary ordered Undo across a pending write to the same field', () => {
    const factory = new Factory()
    const core = create(factory)
    const id = core.getCurrentWorkspaceId()
    if (!id) throw new Error('Missing workspace')
    const original = core.getElementData(id)?.name
    runWithTransactionOwner(factory.getTransactionOwner(), () =>
      runTransaction(() => core.updateElementData(id, { name: 'User' }))
    )
    expect(core.getUndoHistoryDepth()).toBe(1)
    const group = core.startHistoryGroup()
    core.updateHistoryGroup(group, () =>
      core.updateElementData(id, { name: 'Producer' })
    )
    factory.undo()
    expect(core.getElementData(id)?.name).toBe(original)
    expect(core.getHistoryGroupStatus(group).state).toBe('open')
    core.updateHistoryGroup(group, () =>
      core.updateElementData(id, { name: 'Continued' })
    )
    core.endHistoryGroup(group)
    factory.undo()
    expect(core.getElementData(id)?.name).toBe('User')
    factory.redo()
    expect(core.getElementData(id)?.name).toBe('Continued')
  })

  it.each(['before', 'after'])(
    'restores live pre-Undo values when overlap fails %s the second apply',
    (failurePoint) => {
      const factory = new Factory()
      const core = create(factory)
      const id = core.getCurrentWorkspaceId()
      if (!id) throw new Error('Missing workspace')
      const original = core.getElementData(id)?.name
      runWithTransactionOwner(factory.getTransactionOwner(), () =>
        runTransaction(() => {
          core.updateElementData(id, { name: 'First' })
          core.updateElementData(id, { name: 'Second' })
        })
      )
      const group = core.startHistoryGroup()
      core.updateHistoryGroup(group, () =>
        core.updateElementData(id, { name: 'Producer' })
      )
      const dispose = factory.registerTransactionReplayHandler(
        EventTypes.UPDATE_ELEMENT_DATA,
        (event, mode) => {
          const change = (event as UpdateElementDataEvent).payload.changes[0]
          const fails = mode === 'undo' && change.after === original
          if (fails && failurePoint === 'before')
            throw new Error('Replay failure')
          const applied = applyEventToSynchronousOwners(event)
          if (fails) throw new Error('Replay failure')
          return applied
        }
      )
      try {
        expect(() => factory.undo()).toThrow()
        expect(core.getElementData(id)?.name).toBe('Producer')
        expect(core.getUndoHistoryDepth()).toBe(1)
        expect(core.getHistoryGroupStatus(group).state).toBe('open')
      } finally {
        dispose()
      }
    }
  )

  it('invalidates pending handles through the existing Factory runtime reset', () => {
    const factory = new Factory()
    const core = create(factory)
    const group = core.startHistoryGroup()
    factory.resetRuntime()
    expect(() => core.updateHistoryGroup(group, () => undefined)).toThrow(
      /retired/
    )
    expect(() => core.endHistoryGroup(group)).toThrow(/retired/)
  })
})
