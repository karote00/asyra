import { describe, expect, it, vi } from 'vitest'
import {
  EventTypes,
  runTransaction,
  runWithTransactionOwner,
  subscribeToAppliedEventBatches,
  subscribeToEventBatches
} from '@asyra/reactive-events'
import { SCENE_TREE_ACTIONS } from '@asyra/utils'
import sceneTree from '../sceneTree.js'

describe('canonical Scene Tree projection boundary', () => {
  it('projects each completed raw mutation before the next API while UI waits for the outer end', () => {
    sceneTree.reset()
    sceneTree.init()
    sceneTree.cleanChanges()
    const workspace = sceneTree.currentWorkspace
    if (!workspace) throw new Error('Missing workspace')
    const id = workspace.get('id')
    const applied: unknown[] = []
    const committed: unknown[] = []
    const immediate = subscribeToAppliedEventBatches((events) => {
      for (const event of events)
        if (event.type === EventTypes.SCENE_TREE_CHANGED) applied.push(event)
    })
    const deferred = subscribeToEventBatches((events) => {
      for (const event of events)
        if (event.type === EventTypes.SCENE_TREE_CHANGED) committed.push(event)
    })
    const owner = {
      startTransaction: vi.fn(),
      endTransaction: vi.fn(),
      updateTransactionBatch: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn()
    }
    const rename = (name: string) =>
      sceneTree.applyPreparedElementMutation(
        sceneTree.prepareElementDataMutation([
          { elementId: id, values: { name } }
        ])
      )
    try {
      runWithTransactionOwner(owner, () =>
        runTransaction(() => {
          rename('First name')
          expect(applied).toHaveLength(1)
          expect(committed).toHaveLength(0)
          rename('Second name')
          expect(applied).toHaveLength(2)
          expect(committed).toHaveLength(0)
        })
      )
      expect(applied).toHaveLength(2)
      expect(committed).toHaveLength(2)
      expect(applied[0]).toMatchObject({
        payload: {
          changes: [{ action: SCENE_TREE_ACTIONS.UPDATE_ELEMENT_DATA }]
        }
      })
    } finally {
      immediate.unsubscribe()
      deferred.unsubscribe()
    }
  })
  it('uses effective transaction delivery options when the change payload has no options', () => {
    sceneTree.reset()
    sceneTree.init()
    sceneTree.cleanChanges()
    const workspace = sceneTree.currentWorkspace
    if (!workspace) throw new Error('Missing workspace')
    const seen: unknown[] = []
    const subscription = subscribeToEventBatches((events) => {
      seen.push(
        ...events.filter(
          (event) => event.type === EventTypes.SCENE_TREE_CHANGED
        )
      )
    })
    const owner = {
      startTransaction: vi.fn(),
      endTransaction: vi.fn(),
      updateTransactionBatch: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn()
    }
    try {
      runWithTransactionOwner(owner, () =>
        runTransaction(() => {
          sceneTree.changes.push({
            action: SCENE_TREE_ACTIONS.UPDATE_ELEMENT_DATA,
            eventName: EventTypes.UPDATE_ELEMENT_DATA,
            id: workspace.get('id'),
            changes: [{ key: 'name', before: 'Before', after: 'After' }]
          })
          sceneTree.commitSceneTreeTransaction({ sharedDelivery: 'immediate' })
          expect(seen).toHaveLength(1)
        })
      )
      expect(seen).toHaveLength(1)
    } finally {
      subscription.unsubscribe()
    }
  })

  it('never projects rejected raw preparations and projects accepted failure once', () => {
    sceneTree.reset()
    sceneTree.init()
    sceneTree.cleanChanges()
    const workspace = sceneTree.currentWorkspace
    if (!workspace) throw new Error('Missing workspace')
    const originalName = workspace.get('name')
    const applied: unknown[] = []
    const subscription = subscribeToAppliedEventBatches((events) => {
      for (const event of events)
        if (event.type === EventTypes.SCENE_TREE_CHANGED) applied.push(event)
    })
    const owner = {
      startTransaction: vi.fn(),
      endTransaction: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      updateTransactionBatch: vi.fn(() => {
        throw new Error('Rejected before admission')
      })
    }
    const rename = () =>
      sceneTree.applyPreparedElementMutation(
        sceneTree.prepareElementDataMutation([
          { elementId: workspace.get('id'), values: { name: 'Accepted' } }
        ])
      )
    try {
      expect(() =>
        runWithTransactionOwner(owner, () => runTransaction(rename))
      ).toThrow('Rejected before admission')
      expect(workspace.get('name')).toBe(originalName)
      expect(applied).toHaveLength(0)
      owner.updateTransactionBatch = vi.fn(() => {
        throw Object.assign(new Error('Accepted but delivery failed'), {
          batchAccepted: true
        })
      })
      expect(() =>
        runWithTransactionOwner(owner, () => runTransaction(rename))
      ).toThrow('Accepted but delivery failed')
      expect(workspace.get('name')).toBe('Accepted')
      expect(applied).toHaveLength(1)
    } finally {
      subscription.unsubscribe()
    }
  })
})
