import propsManager from '../index.js'
import {
  EventTypes,
  publishEvent,
  runInTransactionReplayMode,
  runWithTransactionOwner,
  type UpdateTransactionEvent
} from '@asyra/reactive-events'
import type { UpdatePropertyChange } from '@asyra/utils'
import elementPropertyRegistry from '../registries/property-definition.js'
import { beforeEach, describe, expect, it } from 'vitest'
import { PropsManager } from '../manager/props-manager.js'
import { createPropertyComponentFromConfig } from '../registries/declarative-property-type.js'
import {
  propertyComponentRegistry,
  registerPropertyComponent
} from '../registries/property-component.js'
import {
  propertySchemaRegistry,
  registerPropertySchema
} from '../registries/property-schema.js'

const type = 'test-material-layer'
const collectionType = 'test-material-collection'
const source = () => ({
  id: 'source',
  type,
  color: '#112233',
  opacity: 0.8,
  sharedSource: true
})
const binding = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  type,
  inheritance: { sourceId: 'source', overrides, childBindings: {} }
})
const register = () => {
  elementPropertyRegistry.register({ name: 'material', type }, 'test-owner')
  elementPropertyRegistry.register(
    { name: 'materials', type: collectionType },
    'test-owner'
  )
  propertyComponentRegistry.clear()
  propertySchemaRegistry.clear()
  const definition = {
    type,
    defaults: { color: '#000000', opacity: 1 },
    persistKeys: ['color', 'opacity'],
    valueKeys: ['color', 'opacity']
  }
  registerPropertyComponent(
    type,
    createPropertyComponentFromConfig(definition),
    undefined,
    definition
  )
  registerPropertySchema({
    type,
    fields: [
      {
        key: 'color',
        kind: 'string',
        defaultValue: '#000000',
        validate: (value) =>
          typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
      },
      {
        key: 'opacity',
        kind: 'number',
        defaultValue: 1,
        validate: (value) =>
          typeof value === 'number' &&
          Number.isFinite(value) &&
          value >= 0 &&
          value <= 1
      }
    ]
  })
  const collection = {
    type: collectionType,
    defaults: { children: [] },
    persistKeys: ['children'],
    valueKeys: ['children'],
    children: {
      key: 'children',
      childType: type,
      mode: 'ids' as const,
      collection: 'array-or-record' as const
    }
  }
  registerPropertyComponent(
    collectionType,
    createPropertyComponentFromConfig(collection),
    undefined,
    collection
  )
  registerPropertySchema({
    type: collectionType,
    fields: [{ key: 'children', kind: 'array', defaultValue: [] }]
  })
}

describe('canonical property inheritance', () => {
  beforeEach(register)

  it('resolves two bindings against one source without flattening canonical state', () => {
    const manager = new PropsManager()
    manager.load({
      source: source(),
      a: binding('a', { opacity: 0 }),
      b: binding('b')
    })
    expect(manager.getPropertyById('a')?.getValue()).toEqual({
      color: '#112233',
      opacity: 0
    })
    expect(manager.getPropertyById('b')?.getValue()).toEqual({
      color: '#112233',
      opacity: 0.8
    })
    manager.updatePropertyById('source', 'color', '#abcdef')
    manager.updatePropertyById('source', 'opacity', 0.4)
    expect(manager.getPropertyById('a')?.getValue()).toEqual({
      color: '#abcdef',
      opacity: 0
    })
    expect(manager.getPropertyById('b')?.getValue()).toEqual({
      color: '#abcdef',
      opacity: 0.4
    })
    expect(manager.save().a).toEqual(binding('a', { opacity: 0 }))
    expect(manager.save().source).toEqual({
      ...source(),
      color: '#abcdef',
      opacity: 0.4
    })
    const restored = new PropsManager()
    restored.load(manager.save())
    restored.updatePropertyById('source', 'color', '#334455')
    expect(restored.getPropertyById('a')?.getValue()).toEqual({
      color: '#334455',
      opacity: 0
    })
    expect(manager.getPropertyById('a')?.getValue()).toEqual({
      color: '#abcdef',
      opacity: 0
    })
  })

  it('rejects a missing or recursive source before replacing a usable document', () => {
    const manager = new PropsManager()
    manager.load({ source: source() })
    const before = manager.save()
    expect(() => manager.load({ a: binding('a') })).toThrow(/source/i)
    expect(manager.save()).toEqual(before)
    expect(() =>
      manager.load({ source: binding('source'), a: binding('a') })
    ).toThrow(/source|inheritance/i)
    expect(manager.save()).toEqual(before)
  })

  it('preserves source membership ordering and a local child binding through reload', () => {
    const manager = new PropsManager()
    const root = {
      id: 'root',
      type: collectionType,
      children: ['source', 'other'],
      sharedSource: true
    }
    const local = {
      id: 'local',
      type: collectionType,
      inheritance: {
        sourceId: 'root',
        overrides: {},
        childBindings: { source: 'a' }
      }
    }
    manager.load({
      source: source(),
      other: { ...source(), id: 'other', color: '#445566' },
      root,
      a: binding('a', { opacity: 0.2 }),
      local
    })
    expect(manager.getPropertyById('local')?.get('children' as never)).toEqual([
      'a',
      'other'
    ])
    manager.updatePropertyById('root', 'children', ['other', 'source'])
    expect(manager.getPropertyById('local')?.get('children' as never)).toEqual([
      'other',
      'a'
    ])
    expect(manager.resolvePropertyAncestorIds(['source'])).toEqual(
      expect.arrayContaining(['source', 'root', 'a', 'local'])
    )
    const restored = new PropsManager()
    restored.load(manager.save())
    expect(restored.getPropertyById('local')?.get('children' as never)).toEqual(
      ['other', 'a']
    )
    expect(restored.save().local).toEqual(local)
  })
  it('records equal-valued override presence and resets only that local field', () => {
    const manager = new PropsManager()
    manager.load({ source: source(), a: binding('a'), b: binding('b') })
    const apply = (state: unknown) =>
      manager.applyPreparedPropertyMutationBatch(
        manager.preparePropertyMutationBatch({
          operations: [
            {
              kind: 'layers',
              propertyId: 'a',
              changes: [{ layer: 'overrides', key: 'opacity', state }]
            }
          ]
        })
      )
    const first = apply({ present: true, value: 0.8 })
    expect(first.evidence).toEqual([
      expect.objectContaining({
        id: 'a',
        layer: 'overrides',
        key: 'opacity',
        before: { present: false },
        after: { present: true, value: 0.8 }
      })
    ])
    expect(apply({ present: true, value: 0.8 }).evidence).toEqual([])
    manager.updatePropertyById('source', 'opacity', 0.3)
    manager.cleanChanges()
    expect(manager.getPropertyById('a')?.get('opacity' as never)).toBe(0.8)
    expect(manager.getPropertyById('b')?.get('opacity' as never)).toBe(0.3)
    const reset = apply({ present: false })
    expect(reset.evidence).toEqual([
      expect.objectContaining({
        before: { present: true, value: 0.8 },
        after: { present: false }
      })
    ])
    expect(manager.getPropertyById('a')?.get('opacity' as never)).toBe(0.3)
    expect(manager.save().a).toEqual(binding('a'))
  })

  it('rejects invalid layers and source retirement without changing either consumer', () => {
    const manager = new PropsManager()
    manager.load({ source: source(), a: binding('a'), b: binding('b') })
    const before = manager.save()
    for (const change of [
      {
        layer: 'overrides',
        key: 'opacity',
        state: { present: true, value: 2 }
      },
      { layer: 'overrides', key: 'absent', state: { present: true, value: 1 } },
      { layer: 'overrides', key: 'absent', state: { present: false } },
      {
        layer: 'overrides',
        key: 'opacity',
        state: { present: false, value: 1 }
      },
      {
        layer: 'childBindings',
        key: 'source',
        state: { present: true, value: 'b' }
      }
    ]) {
      expect(() =>
        manager.preparePropertyMutationBatch({
          operations: [{ kind: 'layers', propertyId: 'a', changes: [change] }]
        })
      ).toThrow()
      expect(manager.save()).toEqual(before)
    }
    expect(() =>
      manager.preparePropertyMutationBatch({
        operations: [
          {
            kind: 'layers',
            propertyId: 'source',
            changes: [
              {
                layer: 'sharedSource',
                key: 'sharedSource',
                state: { present: false }
              }
            ]
          }
        ]
      })
    ).toThrow(/source/i)
    expect(manager.save()).toEqual(before)
  })

  it('rejects direct field replacement on inherited data instead of flattening it', () => {
    const manager = new PropsManager()
    manager.load({ source: source(), a: binding('a') })
    expect(() =>
      manager.updateProperties({
        operations: [
          { kind: 'values', propertyId: 'a', values: { opacity: 0.1 } }
        ]
      })
    ).toThrow(/inherit|layer/i)
    expect(manager.save().a).toEqual(binding('a'))
  })
  it('creates a source-backed collection and child through the existing exact batch owner', () => {
    const manager = new PropsManager()
    manager.load({
      source: source(),
      root: {
        id: 'root',
        type: collectionType,
        children: ['source'],
        sharedSource: true
      }
    })
    manager.updateProperties({
      operations: [
        {
          kind: 'create-exact-property-graph',
          ownerRelations: [
            {
              ownerElementId: 'element',
              ownerElementType: 'test-owner',
              ownerPropertyName: 'materials',
              componentId: 'local'
            }
          ],
          components: [
            binding('a', { opacity: 0.2 }),
            {
              id: 'local',
              type: collectionType,
              inheritance: {
                sourceId: 'root',
                overrides: {},
                childBindings: { source: 'a' }
              }
            }
          ]
        }
      ]
    })
    expect(manager.getPropertyById('local')?.get('children' as never)).toEqual([
      'a'
    ])
    expect(manager.getPropertyById('a')?.getValue()).toEqual({
      color: '#112233',
      opacity: 0.2
    })
    const saved = manager.save()
    const restored = new PropsManager()
    restored.load(saved)
    expect(restored.save()).toEqual(saved)
  })

  it('does not remove the shared source when the last inherited binding is removed', () => {
    const manager = new PropsManager()
    manager.load({ source: source(), a: binding('a') })
    manager.updateProperties({
      operations: [
        {
          kind: 'remove-exact-orphan-property-graphs',
          orphanRootPropertyIds: ['a'],
          retainedRootPropertyIds: []
        }
      ]
    })
    expect(manager.getPropertyById('a')).toBeUndefined()
    expect(manager.save().source).toEqual(source())
  })

  it('rejects removal of a source still used by a binding without partially removing any record', () => {
    const manager = new PropsManager()
    manager.load({ source: source(), a: binding('a') })
    const before = manager.save()
    expect(() => manager.removeProperty(['source'])).toThrow(/source|inherit/i)
    expect(manager.save()).toEqual(before)
  })

  it('rejects source membership removal under a local child override and keeps other consumers', () => {
    const manager = new PropsManager()
    manager.load({
      source: source(),
      root: {
        id: 'root',
        type: collectionType,
        children: ['source'],
        sharedSource: true
      },
      a: binding('a', { opacity: 0.2 }),
      local: {
        id: 'local',
        type: collectionType,
        inheritance: {
          sourceId: 'root',
          overrides: {},
          childBindings: { source: 'a' }
        }
      }
    })
    const before = manager.save()
    expect(() =>
      manager.updateProperties({
        operations: [
          { kind: 'values', propertyId: 'root', values: { children: [] } }
        ]
      })
    ).toThrow(/child binding/i)
    expect(manager.save()).toEqual(before)
  })

  it('rejects direct mutations that would sever a dependent child override', () => {
    const manager = new PropsManager()
    manager.load({
      source: source(),
      root: {
        id: 'root',
        type: collectionType,
        children: ['source'],
        sharedSource: true
      },
      a: binding('a'),
      local: {
        id: 'local',
        type: collectionType,
        inheritance: {
          sourceId: 'root',
          overrides: {},
          childBindings: { source: 'a' }
        }
      }
    })
    const before = manager.save()
    expect(() =>
      manager.getPropertyById('root')?.set('children' as never, [] as never)
    ).toThrow(/child binding/i)
    expect(manager.save()).toEqual(before)
    expect(() =>
      manager.getPropertyById('a')?.set('opacity' as never, 0.2 as never)
    ).toThrow(/layer/i)
    expect(() =>
      manager
        .getPropertyById('source')
        ?.set('sharedSource' as never, false as never)
    ).toThrow(/canonical|layer/i)
    expect(manager.save()).toEqual(before)
  })
  it('replays layer presence through the registered event owner and preserves a sibling override', () => {
    propsManager.load({
      source: source(),
      a: binding('a', { color: '#abcdef' }),
      b: binding('b')
    })
    const result = propsManager.applyPreparedPropertyMutationBatch(
      propsManager.preparePropertyMutationBatch({
        operations: [
          {
            kind: 'layers',
            propertyId: 'a',
            changes: [
              {
                layer: 'overrides',
                key: 'opacity',
                state: { present: true, value: 0.2 }
              }
            ]
          }
        ]
      })
    )
    const change = result.evidence[0] as UpdatePropertyChange
    runInTransactionReplayMode('undo', () =>
      publishEvent({
        type: EventTypes.UPDATE_PROPERTY,
        payload: { ...change, before: change.after, after: change.before }
      })
    )
    expect(propsManager.save().a).toEqual(binding('a', { color: '#abcdef' }))
    runInTransactionReplayMode('redo', () =>
      publishEvent({ type: EventTypes.UPDATE_PROPERTY, payload: change })
    )
    expect(propsManager.save().a).toEqual(
      binding('a', { color: '#abcdef', opacity: 0.2 })
    )
    const restored = new PropsManager()
    restored.load(propsManager.save())
    expect(restored.getPropertyById('a')?.getValue()).toEqual({
      color: '#abcdef',
      opacity: 0.2
    })
    expect(restored.getPropertyById('b')?.getValue()).toEqual({
      color: '#112233',
      opacity: 0.8
    })
  })

  it('rejects a dependency cycle before replacing a document', () => {
    const recursive = 'test-recursive-layer'
    const config = {
      type: recursive,
      defaults: { children: [] },
      persistKeys: ['children'],
      valueKeys: ['children'],
      children: { key: 'children', childType: recursive, mode: 'ids' as const }
    }
    registerPropertyComponent(
      recursive,
      createPropertyComponentFromConfig(config),
      undefined,
      config
    )
    registerPropertySchema({
      type: recursive,
      fields: [{ key: 'children', kind: 'array', defaultValue: [] }]
    })
    const manager = new PropsManager()
    manager.load({ source: source() })
    const before = manager.save()
    expect(() =>
      manager.load({
        root: {
          id: 'root',
          type: recursive,
          children: ['local'],
          sharedSource: true
        },
        local: {
          id: 'local',
          type: recursive,
          inheritance: { sourceId: 'root', overrides: {}, childBindings: {} }
        }
      })
    ).toThrow(/cycle/i)
    expect(manager.save()).toEqual(before)
  })

  it('rejects stale source preparation and performs no writes to unrelated properties', () => {
    const manager = new PropsManager()
    manager.load({
      source: source(),
      a: binding('a'),
      unrelated: { ...source(), id: 'unrelated' }
    })
    const prepared = manager.preparePropertyMutationBatch({
      operations: [
        {
          kind: 'layers',
          propertyId: 'a',
          changes: [
            {
              layer: 'overrides',
              key: 'opacity',
              state: { present: true, value: 0.2 }
            }
          ]
        }
      ]
    })
    manager.updatePropertyById('source', 'opacity', 0.4)
    manager.cleanChanges()
    expect(() => manager.applyPreparedPropertyMutationBatch(prepared)).toThrow(
      /no longer matches/i
    )
    expect(manager.save().a).toEqual(binding('a'))
    expect(manager.save().unrelated).toEqual({ ...source(), id: 'unrelated' })
  })

  it('admits remote creation and exact restore of the same sparse collection graph', () => {
    const manager = new PropsManager()
    manager.load({
      source: source(),
      root: {
        id: 'root',
        type: collectionType,
        children: ['source'],
        sharedSource: true
      }
    })
    const components = [
      binding('a', { opacity: 0.2 }),
      {
        id: 'local',
        type: collectionType,
        inheritance: {
          sourceId: 'root',
          overrides: {},
          childBindings: { source: 'a' }
        }
      }
    ]
    const prepared = manager.preflightNormalizedPropertyCreationBatch(
      components,
      ['local']
    )
    const creation = manager.runInPropertyCreationBatch(() =>
      manager.applyPropertyCreationBatch(prepared)
    )
    creation.complete()
    manager.cleanChanges()
    expect(manager.save().local).toEqual(components[1])
    manager.removeProperty(['local', 'a'])
    manager.cleanChanges()
    const restore = manager.preflightRestoreProperties({ components }, [
      {
        ownerElementId: 'element',
        ownerElementType: 'test-owner',
        ownerPropertyName: 'materials',
        componentId: 'local'
      }
    ])
    manager.applyRestoreProperties(restore)
    manager.cleanChanges()
    expect(manager.getPropertyById('local')?.get('children' as never)).toEqual([
      'a'
    ])
    expect(manager.save().a).toEqual(components[0])
    expect(manager.save().local).toEqual(components[1])
  })

  it('rolls back every local layer when a later component apply fails and permits a fresh retry', () => {
    const manager = new PropsManager()
    manager.load({
      source: source(),
      a: binding('a'),
      b: binding('b'),
      unrelated: { ...source(), id: 'unrelated' }
    })
    const before = manager.save()
    const b = manager.getPropertyById('b')
    if (!b) throw new Error('Missing test binding')
    const load = b.load.bind(b)
    let fail = true
    b.load = (data) => {
      if (fail && data.inheritance?.overrides.opacity === 0.3) {
        fail = false
        throw new Error('component apply failed')
      }
      return load(data)
    }
    const request = {
      operations: [
        {
          kind: 'layers',
          propertyId: 'a',
          changes: [
            {
              layer: 'overrides',
              key: 'opacity',
              state: { present: true, value: 0.2 }
            }
          ]
        },
        {
          kind: 'layers',
          propertyId: 'b',
          changes: [
            {
              layer: 'overrides',
              key: 'opacity',
              state: { present: true, value: 0.3 }
            }
          ]
        }
      ]
    }
    expect(() =>
      manager.applyPreparedPropertyMutationBatch(
        manager.preparePropertyMutationBatch(request)
      )
    ).toThrow('component apply failed')
    expect(manager.save()).toEqual(before)
    expect(manager.changes).toEqual([])
    const unrelated = manager.getPropertyById('unrelated')
    if (!unrelated) throw new Error('Missing unrelated test property')
    const originalSave = unrelated.save.bind(unrelated)
    unrelated.save = () => {
      throw new Error('unrelated property was inspected')
    }
    manager.applyPreparedPropertyMutationBatch(
      manager.preparePropertyMutationBatch(request)
    )
    unrelated.save = originalSave
    expect(manager.save().a).toEqual(binding('a', { opacity: 0.2 }))
    expect(manager.save().b).toEqual(binding('b', { opacity: 0.3 }))
    expect(manager.save().unrelated).toEqual(before.unrelated)
  })

  it('publishes source promotion before the new binding so the exact delta stream replays', () => {
    const manager = new PropsManager()
    const independent = { id: 'source', type, color: '#112233', opacity: 0.8 }
    manager.load({ source: independent })
    const result = manager.applyPreparedPropertyMutationBatch(
      manager.preparePropertyMutationBatch({
        operations: [
          {
            kind: 'layers',
            propertyId: 'source',
            changes: [
              {
                layer: 'sharedSource',
                key: 'sharedSource',
                state: { present: true, value: true }
              }
            ]
          },
          {
            kind: 'create-exact-property-graph',
            ownerRelations: [
              {
                ownerElementId: 'element',
                ownerElementType: 'test-owner',
                ownerPropertyName: 'material',
                componentId: 'a'
              }
            ],
            components: [binding('a')]
          }
        ]
      })
    )
    expect(result.evidence[0]).toMatchObject({
      id: 'source',
      layer: 'sharedSource'
    })
    propsManager.load({ source: independent })
    for (const change of result.evidence)
      publishEvent({ type: change.eventName, payload: change } as never)
    expect(propsManager.save()).toEqual(manager.save())
  })
  it('removes an inherited slot after explicit child detachment without deleting its shared source', () => {
    const manager = new PropsManager()
    manager.load({
      source: source(),
      root: {
        id: 'root',
        type: collectionType,
        children: ['source'],
        sharedSource: true
      },
      detached: { id: 'detached', type, color: '#abcdef', opacity: 0.2 },
      local: {
        id: 'local',
        type: collectionType,
        inheritance: {
          sourceId: 'root',
          overrides: {},
          childBindings: { source: 'detached' }
        }
      }
    })
    const before = manager.save()
    const result = manager.updateProperties({
      operations: [
        { kind: 'values', propertyId: 'root', values: { children: [] } }
      ]
    })
    expect(manager.getPropertyById('local')?.get('children' as never)).toEqual(
      []
    )
    expect(manager.save().local.inheritance?.childBindings).toEqual({})
    expect(manager.save().source).toEqual(before.source)
    expect(manager.getRestoreComponentById('detached')?.save()).toEqual(
      before.detached
    )
    expect(result.evidence[0]).toMatchObject({
      id: 'local',
      layer: 'childBindings',
      key: 'source',
      after: { present: false }
    })
    propsManager.load(before)
    for (const change of result.evidence)
      publishEvent({ type: change.eventName, payload: change } as never)
    expect(propsManager.save()).toEqual(manager.save())
  })
})

describe('Owner-local property intentions', () => {
  beforeEach(register)

  const target = (elementId: string, componentId = 'root') => ({
    root: {
      ownerElementId: elementId,
      ownerElementType: 'test-owner',
      ownerPropertyName: 'materials',
      componentId
    },
    sharedRoot: componentId === 'root',
    path: [{ key: 'children', childId: 'source' }]
  })
  const setup = () => {
    const manager = new PropsManager()
    manager.load({
      source: source(),
      other: { id: 'other', type, color: '#ffffff', opacity: 1 },
      root: {
        id: 'root',
        type: collectionType,
        children: ['source', 'other'],
        sharedSource: true
      }
    })
    return manager
  }

  it('prepares different local overrides under a shared collection without freezing membership', () => {
    const manager = setup()
    const prepared = manager.preparePropertyIntentBatch([
      { kind: 'override', target: target('a'), values: { opacity: 0.2 } },
      { kind: 'override', target: target('b'), values: { opacity: 0.6 } }
    ])
    expect(manager.save().root).not.toHaveProperty('inheritance')
    expect(prepared.rootBindings).toHaveLength(2)
    manager.applyPreparedPropertyMutationBatch(prepared.properties)
    const a = target('a', prepared.rootBindings[0].after)
    const b = target('b', prepared.rootBindings[1].after)
    expect(
      manager.readPropertyTargets([a, b]).map((item) => item.effective.opacity)
    ).toEqual([0.2, 0.6])
    manager.updateProperties({
      operations: [
        {
          kind: 'values',
          propertyId: 'source',
          values: { color: '#aabbcc', opacity: 0.9 }
        }
      ]
    })
    expect(
      manager.readPropertyTargets([a, b]).map((item) => item.effective)
    ).toEqual([
      expect.objectContaining({ color: '#aabbcc', opacity: 0.2 }),
      expect.objectContaining({ color: '#aabbcc', opacity: 0.6 })
    ])
    const reset = manager.preparePropertyIntentBatch([
      { kind: 'reset', target: a, keys: ['opacity'] }
    ])
    manager.applyPreparedPropertyMutationBatch(reset.properties)
    expect(manager.readPropertyTargets([a])[0]).toMatchObject({
      effective: { opacity: 0.9 },
      overrides: {}
    })
    manager.updateProperties({
      operations: [
        {
          kind: 'values',
          propertyId: 'root',
          values: { children: ['other', 'source'] }
        }
      ]
    })
    expect(
      manager.getPropertyById(a.root.componentId)?.get('children' as never)
    ).toHaveLength(2)
    expect(manager.readPropertyTargets([a])[0].effective.opacity).toBe(0.9)
  })

  it('detaches only the selected child and preserves the logical source slot', () => {
    const manager = setup()
    const prepared = manager.preparePropertyIntentBatch([
      { kind: 'detach', target: target('a') }
    ])
    manager.applyPreparedPropertyMutationBatch(prepared.properties)
    const a = target('a', prepared.rootBindings[0].after)
    const read = manager.readPropertyTargets([a])[0]
    expect(read.mode).toBe('independent')
    expect(read.propertyId).not.toBe('source')
    manager.updateProperties({
      operations: [
        { kind: 'values', propertyId: 'source', values: { opacity: 0.1 } }
      ]
    })
    expect(manager.readPropertyTargets([a])[0].effective.opacity).toBe(0.8)
    expect(
      manager.readPropertyTargets([target('b')])[0].effective.opacity
    ).toBe(0.1)
  })

  it('rejects a later invalid path or conflicting local write before creating any prefix', () => {
    const manager = setup()
    const before = manager.save()
    expect(() =>
      manager.preparePropertyIntentBatch([
        { kind: 'override', target: target('a'), values: { opacity: 0.2 } },
        {
          kind: 'override',
          target: {
            ...target('b'),
            path: [{ key: 'children', childId: 'absent' }]
          },
          values: { opacity: 0.2 }
        }
      ])
    ).toThrow(/child|path/i)
    expect(() =>
      manager.preparePropertyIntentBatch([
        { kind: 'override', target: target('a'), values: { opacity: 0.2 } },
        { kind: 'override', target: target('a'), values: { opacity: 0.7 } }
      ])
    ).toThrow(/conflict/i)
    expect(manager.save()).toEqual(before)
  })

  it('rejects a stale retained property identity instead of editing a newly bound child', () => {
    const manager = setup()
    const read = manager.readPropertyTargets([target('a')])[0]
    const prepared = manager.preparePropertyIntentBatch([
      { kind: 'override', target: target('a'), values: { opacity: 0.2 } }
    ])
    manager.applyPreparedPropertyMutationBatch(prepared.properties)
    const a = {
      ...target('a', prepared.rootBindings[0].after),
      expectedPropertyId: read.propertyId
    }
    expect(() =>
      manager.preparePropertyIntentBatch([
        { kind: 'override', target: a, values: { opacity: 0.5 } }
      ])
    ).toThrow(/stale/i)
  })
  it('reports logical child slots separately from effective bindings after override and re-share', () => {
    const manager = setup()
    const root = { ...target('a'), path: [] }
    expect(manager.readPropertyTargets([root])[0].children).toEqual([
      { key: 'children', childId: 'source', propertyId: 'source' },
      { key: 'children', childId: 'other', propertyId: 'other' }
    ])
    const prepared = manager.preparePropertyIntentBatch([
      { kind: 'override', target: target('a'), values: { opacity: 0.2 } }
    ])
    manager.applyPreparedPropertyMutationBatch(prepared.properties)
    const updatedRoot = {
      ...target('a', prepared.rootBindings[0].after),
      path: []
    }
    const local = manager.readPropertyTargets([
      target('a', prepared.rootBindings[0].after)
    ])[0]
    expect(manager.readPropertyTargets([updatedRoot])[0].children[0]).toEqual({
      key: 'children',
      childId: 'source',
      propertyId: local.propertyId
    })
    manager.applyPreparedPropertyMutationBatch(
      manager.preparePropertyIntentBatch([
        {
          kind: 'reset',
          target: target('a', prepared.rootBindings[0].after),
          keys: ['opacity']
        }
      ]).properties
    )
    const share = manager.preparePropertyIntentBatch([
      {
        kind: 'share',
        target: target('a', prepared.rootBindings[0].after),
        sourceId: 'other'
      }
    ])
    manager.applyPreparedPropertyMutationBatch(share.properties)
    const view = manager.readPropertyTargets([updatedRoot])[0]
    expect(view.children[0].childId).toBe('source')
    expect(
      manager.readPropertyTargets([
        {
          ...updatedRoot,
          path: [
            { key: view.children[0].key, childId: view.children[0].childId }
          ]
        }
      ])[0].sourceId
    ).toBe('other')
  })

  it('adds another local child under an existing owner binding and detaches without affecting its sibling', () => {
    const manager = setup()
    const first = manager.preparePropertyIntentBatch([
      { kind: 'override', target: target('a'), values: { opacity: 0.2 } }
    ])
    manager.applyPreparedPropertyMutationBatch(first.properties)
    const a = target('a', first.rootBindings[0].after)
    const other = { ...a, path: [{ key: 'children', childId: 'other' }] }
    const next = manager.preparePropertyIntentBatch([
      { kind: 'override', target: other, values: { color: '#ff0000' } }
    ])
    expect(next.rootBindings).toEqual([])
    manager.applyPreparedPropertyMutationBatch(next.properties)
    expect(
      manager.readPropertyTargets([a, other]).map((v) => v.effective)
    ).toEqual([
      expect.objectContaining({ opacity: 0.2 }),
      expect.objectContaining({ color: '#ff0000' })
    ])
    const oldChildId = manager.readPropertyTargets([other])[0].propertyId
    const detach = manager.preparePropertyIntentBatch([
      { kind: 'detach', target: other }
    ])
    manager.applyPreparedPropertyMutationBatch(detach.properties)
    expect(manager.readPropertyTargets([other])[0].mode).toBe('independent')
    expect(manager.getPropertyById(oldChildId)).toBeUndefined()
    expect(manager.getRestoreComponentById(oldChildId)).toBeDefined()
    expect(manager.readPropertyTargets([a])[0].effective.opacity).toBe(0.2)
  })

  it('rejects conflicting identity and field intentions rather than leaking unowned allocations', () => {
    const manager = setup()
    const before = manager.save()
    expect(() =>
      manager.preparePropertyIntentBatch([
        { kind: 'override', target: target('a'), values: { opacity: 0.2 } },
        { kind: 'detach', target: target('a') }
      ])
    ).toThrow(/conflict/i)
    expect(manager.save()).toEqual(before)
  })
  it('keeps an empty local edit inert and rejects metadata writes and invalid reset fields', () => {
    const manager = setup()
    const before = manager.save()
    const empty = manager.preparePropertyIntentBatch([
      { kind: 'override', target: target('a'), values: {} }
    ])
    expect(empty.rootBindings).toEqual([])
    manager.applyPreparedPropertyMutationBatch(empty.properties)
    expect(manager.save()).toEqual(before)
    expect(() =>
      manager.preparePropertyIntentBatch([
        { kind: 'override', target: target('a'), values: { id: 'other' } }
      ])
    ).toThrow()
    expect(() =>
      manager.preparePropertyIntentBatch([
        { kind: 'reset', target: target('a'), keys: ['unknown'] }
      ])
    ).toThrow()
    expect(manager.save()).toEqual(before)
  })
  it('requires explicit source identity and preserves a local mask during source edits', () => {
    const manager = setup()
    const prepared = manager.preparePropertyIntentBatch([
      { kind: 'override', target: target('a'), values: { opacity: 0.2 } }
    ])
    manager.applyPreparedPropertyMutationBatch(prepared.properties)
    const a = target('a', prepared.rootBindings[0].after)
    const local = manager.readPropertyTargets([a])[0]
    expect(() =>
      manager.prepareSharedPropertySourceBatch([
        { propertyId: local.propertyId, values: { opacity: 0.9 } }
      ])
    ).toThrow(/source/i)
    const sourceEdit = manager.prepareSharedPropertySourceBatch([
      { propertyId: 'source', values: { opacity: 0.9, color: '#aabbcc' } }
    ])
    manager.applyPreparedPropertyMutationBatch(sourceEdit)
    expect(manager.readPropertyTargets([a])[0].effective).toMatchObject({
      opacity: 0.2,
      color: '#aabbcc'
    })
    expect(
      manager.readPropertyTargets([target('b')])[0].effective.opacity
    ).toBe(0.9)
  })
  it('isolates an already inherited root and its child for local reset', () => {
    const manager = setup()
    const first = manager.preparePropertyIntentBatch([
      { kind: 'override', target: target('a'), values: { opacity: 0.2 } }
    ])
    manager.applyPreparedPropertyMutationBatch(first.properties)
    const shared = {
      ...target('a', first.rootBindings[0].after),
      sharedRoot: true
    }
    const reset = manager.preparePropertyIntentBatch([
      { kind: 'reset', target: shared, keys: ['opacity'] }
    ])
    manager.applyPreparedPropertyMutationBatch(reset.properties)
    expect(reset.rootBindings).toHaveLength(1)
    const local = {
      ...shared,
      root: { ...shared.root, componentId: reset.rootBindings[0].after },
      sharedRoot: false
    }
    expect(manager.readPropertyTargets([local])[0].effective.opacity).toBe(0.8)
    expect(manager.readPropertyTargets([shared])[0].effective.opacity).toBe(0.2)
  })

  it('edits an explicitly detached child without recreating a source binding', () => {
    const manager = setup()
    const detached = manager.preparePropertyIntentBatch([
      { kind: 'detach', target: target('a') }
    ])
    manager.applyPreparedPropertyMutationBatch(detached.properties)
    const local = target('a', detached.rootBindings[0].after)
    const before = manager.readPropertyTargets([local])[0]
    const edit = manager.preparePropertyIntentBatch([
      { kind: 'override', target: local, values: { opacity: 0.3 } }
    ])
    manager.applyPreparedPropertyMutationBatch(edit.properties)
    expect(manager.readPropertyTargets([local])[0]).toMatchObject({
      propertyId: before.propertyId,
      mode: 'independent',
      effective: { opacity: 0.3 }
    })
  })

  it('rejects rebinding local overrides until explicitly reset without discarding any state', () => {
    const manager = setup()
    const first = manager.preparePropertyIntentBatch([
      { kind: 'override', target: target('a'), values: { opacity: 0.2 } }
    ])
    manager.applyPreparedPropertyMutationBatch(first.properties)
    const local = target('a', first.rootBindings[0].after)
    const before = manager.readPropertyTargets([local, target('b')])
    expect(() =>
      manager.preparePropertyIntentBatch([
        { kind: 'share', target: local, sourceId: 'other' }
      ])
    ).toThrow(/reset or detach/i)
    expect(manager.readPropertyTargets([local, target('b')])).toEqual(before)
    const reset = manager.preparePropertyIntentBatch([
      { kind: 'reset', target: local, keys: ['opacity'] }
    ])
    manager.applyPreparedPropertyMutationBatch(reset.properties)
    const share = manager.preparePropertyIntentBatch([
      { kind: 'share', target: local, sourceId: 'other' }
    ])
    manager.applyPreparedPropertyMutationBatch(share.properties)
    expect(manager.readPropertyTargets([local])[0]).toMatchObject({
      sourceId: 'other',
      overrides: {},
      effective: { color: '#ffffff' }
    })
    expect(manager.readPropertyTargets([target('b')])[0]).toEqual(before[1])
  })

  it('shares a local child with another same-type source while preserving its logical slot', () => {
    const manager = setup()
    const share = manager.preparePropertyIntentBatch([
      { kind: 'share', target: target('a'), sourceId: 'other' }
    ])
    manager.applyPreparedPropertyMutationBatch(share.properties)
    const local = target('a', share.rootBindings[0].after)
    expect(manager.readPropertyTargets([local])[0]).toMatchObject({
      mode: 'source-backed',
      sourceId: 'other',
      effective: { color: '#ffffff' }
    })
    manager.applyPreparedPropertyMutationBatch(
      manager.prepareSharedPropertySourceBatch([
        { propertyId: 'other', values: { color: '#abcdef' } }
      ])
    )
    expect(manager.readPropertyTargets([local])[0].effective.color).toBe(
      '#abcdef'
    )
    expect(manager.readPropertyTargets([target('b')])[0].effective.color).toBe(
      '#112233'
    )
  })

  it('attaches new members through a pending override on an existing inherited collection', () => {
    const manager = setup()
    const first = manager.preparePropertyIntentBatch([
      { kind: 'override', target: target('a'), values: { opacity: 0.2 } }
    ])
    manager.applyPreparedPropertyMutationBatch(first.properties)
    const local = {
      ...target('a', first.rootBindings[0].after),
      path: [],
      sharedRoot: false
    }
    const next = manager.preparePropertyIntentBatch([
      {
        kind: 'records',
        target: local,
        key: 'children',
        set: { added: { opacity: 0.5 } }
      }
    ])
    manager.applyPreparedPropertyMutationBatch(next.properties)
    expect(
      manager.readPropertyTargets([local])[0].effective.children
    ).toContain('added')
    const reloaded = new PropsManager()
    reloaded.load(manager.save())
    expect(reloaded.save()).toEqual(manager.save())
  })

  it('preserves canonical record creation, exact retirement and resurrection identities', () => {
    const manager = setup()
    const records = [binding('canonical-local', { opacity: 0.4 })]
    const create = () =>
      manager.preparePropertyMutationBatch({
        operations: [
          { kind: 'create-exact-property-records', components: records }
        ]
      })
    manager.applyPreparedPropertyMutationBatch(create())
    expect(manager.getPropertyById('canonical-local')?.save()).toEqual(
      records[0]
    )
    const before = manager.save()
    expect(() =>
      manager.preparePropertyMutationBatch({
        operations: [
          { kind: 'remove-exact-property-records', components: [source()] }
        ]
      })
    ).toThrow()
    expect(manager.save()).toEqual(before)
    manager.applyPreparedPropertyMutationBatch(
      manager.preparePropertyMutationBatch({
        operations: [
          { kind: 'remove-exact-property-records', components: records }
        ]
      })
    )
    expect(manager.getPropertyById('canonical-local')).toBeUndefined()
    expect(manager.getPropertyById('source')).toBeDefined()
    manager.applyPreparedPropertyMutationBatch(create())
    expect(manager.save()).toEqual(before)
    expect(() => create()).toThrow()
  })

  it('does not infer record retirement from canonical link changes and rejects stale exact records', () => {
    const manager = setup()
    const first = manager.preparePropertyIntentBatch([
      { kind: 'override', target: target('a'), values: { opacity: 0.2 } }
    ])
    manager.applyPreparedPropertyMutationBatch(first.properties)
    const local = target('a', first.rootBindings[0].after)
    const child = manager.readPropertyTargets([local])[0].propertyId
    const raw = manager.getPropertyById(child)?.save()
    manager.applyPreparedPropertyMutationBatch(
      manager.preparePropertyMutationBatch({
        operations: [
          {
            kind: 'layers',
            propertyId: local.root.componentId,
            changes: [
              {
                layer: 'childBindings',
                key: 'source',
                state: { present: false }
              }
            ]
          },
          { kind: 'remove-exact-property-records', components: [] }
        ]
      })
    )
    expect(manager.getPropertyById(child)?.save()).toEqual(raw)
    const before = manager.save()
    expect(() =>
      manager.preparePropertyMutationBatch({
        operations: [
          {
            kind: 'remove-exact-property-records',
            components: [
              {
                ...raw,
                inheritance: {
                  sourceId: 'source',
                  overrides: { opacity: 0.9 },
                  childBindings: {}
                }
              }
            ]
          }
        ]
      })
    ).toThrow(/stale/)
    expect(manager.save()).toEqual(before)
    manager.applyPreparedPropertyMutationBatch(
      manager.preparePropertyMutationBatch({
        operations: [
          { kind: 'remove-exact-property-records', components: [raw] }
        ]
      })
    )
    expect(manager.getPropertyById(child)).toBeUndefined()
    expect(manager.getPropertyById('source')).toBeDefined()
  })

  it('creates canonical source and sparse binding together and rejects an invalid later record atomically', () => {
    const manager = setup()
    const records = [
      { ...source(), id: 'new-source' },
      {
        id: 'new-binding',
        type,
        inheritance: {
          sourceId: 'new-source',
          overrides: { opacity: 0.5 },
          childBindings: {}
        }
      }
    ]
    const before = manager.save()
    expect(() =>
      manager.preparePropertyMutationBatch({
        operations: [
          {
            kind: 'create-exact-property-records',
            components: [
              ...records,
              {
                id: 'bad',
                type,
                inheritance: {
                  sourceId: 'missing',
                  overrides: {},
                  childBindings: {}
                }
              }
            ]
          }
        ]
      })
    ).toThrow()
    expect(manager.save()).toEqual(before)
    manager.applyPreparedPropertyMutationBatch(
      manager.preparePropertyMutationBatch({
        operations: [
          { kind: 'create-exact-property-records', components: records }
        ]
      })
    )
    expect(manager.getPropertyById('new-binding')?.save()).toEqual(records[1])
    manager.applyPreparedPropertyMutationBatch(
      manager.preparePropertyMutationBatch({
        operations: [
          { kind: 'remove-exact-property-records', components: records }
        ]
      })
    )
    expect(manager.save()).toEqual(before)
  })

  it('patches local collection records across override, add and remove without mutating the source', () => {
    const manager = setup()
    const rootTarget = { ...target('a'), path: [] }
    const patch = manager.preparePropertyIntentBatch([
      {
        kind: 'records',
        target: rootTarget,
        key: 'children',
        set: {
          source: { opacity: 0.2 },
          added: { color: '#aabbcc', opacity: 0.5 }
        },
        remove: ['other']
      }
    ])
    manager.applyPreparedPropertyMutationBatch(patch.properties)
    const localRoot = {
      ...rootTarget,
      root: { ...rootTarget.root, componentId: patch.rootBindings[0].after },
      sharedRoot: false
    }
    expect(
      manager.readPropertyTargets([localRoot])[0].effective.children
    ).toHaveLength(2)
    const child = {
      ...localRoot,
      path: [{ key: 'children', childId: 'source' }]
    }
    expect(manager.readPropertyTargets([child])[0].effective.opacity).toBe(0.2)
    expect(
      manager.readPropertyTargets([target('b')])[0].effective.opacity
    ).toBe(0.8)
    const actualId = manager.readPropertyTargets([child])[0].propertyId
    const next = manager.preparePropertyIntentBatch([
      {
        kind: 'records',
        target: localRoot,
        key: 'children',
        set: { [actualId]: { opacity: 0.4 } },
        remove: ['added']
      }
    ])
    manager.applyPreparedPropertyMutationBatch(next.properties)
    expect(manager.readPropertyTargets([child])[0].effective.opacity).toBe(0.4)
    expect(
      manager.readPropertyTargets([localRoot])[0].effective.children
    ).toHaveLength(1)
    expect(manager.getPropertyById('added')).toBeUndefined()
    const replacement = manager.prepareOwnerPropertyMutations([
      {
        target: localRoot,
        mutation: {
          kind: 'values',
          propertyId: localRoot.root.componentId,
          values: { children: [actualId] }
        }
      }
    ])
    manager.applyPreparedPropertyMutationBatch(replacement.properties)
    expect(manager.readPropertyTargets([child])[0].effective.opacity).toBe(0.4)
    const clear = manager.preparePropertyIntentBatch([
      {
        kind: 'records',
        target: localRoot,
        key: 'children',
        remove: [actualId]
      }
    ])
    manager.applyPreparedPropertyMutationBatch(clear.properties)
    expect(
      manager.readPropertyTargets([localRoot])[0].effective.children
    ).toEqual([])
    const reset = manager.preparePropertyIntentBatch([
      { kind: 'reset', target: localRoot, keys: ['children'] }
    ])
    manager.applyPreparedPropertyMutationBatch(reset.properties)
    expect(
      manager.readPropertyTargets([localRoot])[0].effective.children
    ).toEqual(['source', 'other'])
    const reloaded = new PropsManager()
    reloaded.load(manager.save())
    expect(reloaded.save()).toEqual(manager.save())
  })

  it('prepares root detachment and orphan cleanup before creation without losing retained children', () => {
    const manager = setup()
    const local = manager.preparePropertyIntentBatch([
      { kind: 'override', target: target('a'), values: { opacity: 0.2 } }
    ])
    manager.applyPreparedPropertyMutationBatch(local.properties)
    const oldRootId = local.rootBindings[0].after
    const rootTarget = { ...target('a', oldRootId), path: [] }
    const detach = manager.preparePropertyIntentBatch([
      { kind: 'detach', target: rootTarget }
    ])
    const cleanup = manager.preparePropertyMutationBatch({
      operations: [
        {
          kind: 'remove-exact-orphan-property-graphs',
          orphanRootPropertyIds: [oldRootId],
          retainedRootPropertyIds: [
            ...new Set(['root', ...detach.retainedExistingPropertyIds])
          ]
        }
      ]
    })
    manager.applyPreparedPropertyMutationBatch(detach.properties)
    manager.applyPreparedPropertyMutationBatch(cleanup)
    expect(manager.getPropertyById(oldRootId)).toBeUndefined()
    const newRoot = manager.readPropertyTargets([
      {
        ...rootTarget,
        root: { ...rootTarget.root, componentId: detach.rootBindings[0].after }
      }
    ])[0]
    expect(newRoot.mode).toBe('independent')
    expect(newRoot.effective.children).toHaveLength(2)
    const reloaded = new PropsManager()
    reloaded.load(manager.save())
    expect(reloaded.save()).toEqual(manager.save())
  })

  it('keeps field masks and child links distinct in replace-latest history evidence', () => {
    const manager = new PropsManager()
    manager.load({
      children: { ...source(), id: 'children' },
      local: {
        id: 'local',
        type,
        inheritance: {
          sourceId: 'children',
          overrides: { opacity: 0.2 },
          childBindings: {}
        }
      },
      root: {
        id: 'root',
        type: collectionType,
        children: ['children'],
        sharedSource: true
      },
      owner: {
        id: 'owner',
        type: collectionType,
        inheritance: { sourceId: 'root', overrides: {}, childBindings: {} }
      }
    })
    const events: UpdateTransactionEvent[] = []
    runWithTransactionOwner(
      {
        startTransaction: () => undefined,
        endTransaction: () => undefined,
        undo: () => undefined,
        redo: () => undefined,
        updateTransactionBatch: (batch) => {
          events.push(...batch)
        }
      },
      () =>
        manager.updateProperties({
          operations: [
            {
              kind: 'layers',
              propertyId: 'owner',
              changes: [
                {
                  layer: 'overrides',
                  key: 'children',
                  state: { present: true, value: ['children'] }
                },
                {
                  layer: 'childBindings',
                  key: 'children',
                  state: { present: true, value: 'local' }
                }
              ]
            }
          ],
          options: {
            history: { mode: 'replace-latest', key: 'local-gesture' },
            sharedDelivery: 'immediate'
          }
        })
    )
    expect(events[0].historyCandidate?.events).toHaveLength(2)
    expect(new Set(events[0].historyCandidate?.eventKeys).size).toBe(2)
  })
})
