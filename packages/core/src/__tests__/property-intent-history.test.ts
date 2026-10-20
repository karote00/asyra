import { beforeAll, describe, expect, it, vi } from 'vitest'
import {
  default as props,
  createPropertyComponentFromConfig,
  registerPropertyComponent,
  registerPropertySchema,
  elementPropertyRegistry
} from '@asyra/props-manager'
import {
  default as scene,
  componentRegistry,
  createDynamicComponent
} from '@asyra/scene-tree'
import { runWithTransactionOwner, runTransaction } from '@asyra/reactive-events'
import { Factory } from '@asyra/factory'
import { SCENE_TREE_ACTIONS } from '@asyra/utils'
import { Core } from '../core.js'

const type = 'intent-history-material'
const ownerType = 'intent-history-element'
const collectionType = 'intent-history-materials'
beforeAll(() => {
  const config = {
    type,
    defaults: { opacity: 1, color: '#112233' },
    persistKeys: ['opacity', 'color'],
    valueKeys: ['opacity', 'color']
  }
  registerPropertySchema({
    type,
    fields: [
      { key: 'opacity', kind: 'number', defaultValue: 1 },
      { key: 'color', kind: 'string', defaultValue: '#112233' }
    ]
  })
  registerPropertyComponent(
    type,
    createPropertyComponentFromConfig(config),
    undefined,
    config
  )
  const collection = {
    type: collectionType,
    defaults: { materials: [] },
    persistKeys: ['materials'],
    valueKeys: ['materials'],
    children: {
      key: 'materials',
      childType: type,
      mode: 'ids' as const,
      collection: 'array-or-record' as const,
      toValue: (child: { get: (key: string) => unknown }, childId: string) => ({
        id: childId,
        color: child.get('color'),
        opacity: child.get('opacity')
      })
    }
  }
  registerPropertySchema({
    type: collectionType,
    fields: [{ key: 'materials', kind: 'array', defaultValue: [] }]
  })
  registerPropertyComponent(
    collectionType,
    createPropertyComponentFromConfig(collection),
    undefined,
    collection
  )
  const properties = [
    { name: 'material', type, alias: ['opacity', 'color'] },
    { name: 'materials', type: collectionType }
  ]
  properties.forEach((property) =>
    elementPropertyRegistry.register(property, ownerType)
  )
  componentRegistry.register({
    type: ownerType,
    idPrefix: ownerType,
    namePrefix: 'Intent Element',
    properties,
    constructor: createDynamicComponent(
      ownerType,
      ownerType,
      'Intent Element',
      properties,
      {}
    ),
    defaults: {}
  })
})
const setup = () => {
  props.reset()
  scene.reset()
  props.load({
    materials: {
      id: 'materials',
      type: collectionType,
      materials: ['source'],
      sharedSource: true
    },
    source: {
      id: 'source',
      type,
      opacity: 1,
      color: '#112233',
      sharedSource: true
    }
  })
  scene.load({
    workspace: 'workspace',
    workspaceList: ['workspace'],
    elements: {
      workspace: {
        id: 'workspace',
        type: 'workspace',
        name: 'Workspace',
        parentId: '',
        visible: true,
        lock: false,
        children: ['a', 'b']
      },
      ...Object.fromEntries(
        ['a', 'b'].map((id) => [
          id,
          {
            id,
            type: ownerType,
            name: id,
            parentId: 'workspace',
            visible: true,
            lock: false,
            props: { material: 'source', materials: 'materials' }
          }
        ])
      )
    }
  })
  const factory = new Factory()
  const api = new Core({
    inputSystem: {} as never,
    factory,
    props,
    sceneTree: scene,
    render: {
      getViewportPosition: () => ({ x: 0, y: 0 }),
      getViewportScale: () => 1
    } as never,
    selection: {} as never,
    systemContext: {} as never
  })
  const run = <T>(fn: () => T): T =>
    runWithTransactionOwner(factory.getTransactionOwner(), () =>
      runTransaction(fn)
    )
  const target = (elementId = 'a') => ({
    elementId,
    propertyName: 'material',
    path: []
  })
  return { props, scene, api, factory, run, target }
}
describe('Property intentions through real Factory owner replay', () => {
  it('publishes the new child identity immediately on detach and keeps it on replay', () => {
    const { props, scene, api, factory, run } = setup()
    const target = {
      elementId: 'a',
      propertyName: 'materials',
      path: [{ key: 'materials', childId: 'source' }]
    }
    const verify = () => {
      const canonical = api.readElementPropertyTargets([target])[0]
      expect(scene.getElementById('a')?.getAllComputedData().materials).toEqual(
        [
          {
            id: canonical.propertyId,
            color: canonical.effective.color,
            opacity: canonical.effective.opacity
          }
        ]
      )
    }
    try {
      run(() =>
        api.updateElementPropertyTargets([
          { target, values: { color: '#abcdef' } }
        ])
      )
      verify()
      run(() =>
        api.resetElementPropertyOverrides([{ target, keys: ['color'] }])
      )
      verify()
      run(() => api.detachElementPropertyTargets([target]))
      verify()
      const detached = props.save()
      factory.undo()
      verify()
      factory.redo()
      expect(props.save()).toEqual(detached)
      verify()
    } finally {
      factory.transact.reset()
    }
  })

  it('replays local override, source edit, reset, detach and sharing as exact single actions', () => {
    const { props, scene, api, factory, run, target } = setup()
    const save = () => ({ props: props.save(), scene: scene.save() })
    const actions = [
      () =>
        api.updateElementPropertyTargets([
          { target: target(), values: { opacity: 0.2 } },
          { target: target('b'), values: { opacity: 0.6 } }
        ]),
      () =>
        api.updateSharedPropertySources([
          { propertyId: 'source', values: { color: '#abcdef', opacity: 0.9 } }
        ]),
      () =>
        api.resetElementPropertyOverrides([
          { target: target(), keys: ['opacity'] }
        ]),
      () => api.detachElementPropertyTargets([target()]),
      () =>
        api.shareElementPropertyTargets([
          { target: target(), sourceId: 'source' }
        ])
    ]
    try {
      for (const action of actions) {
        const before = save(),
          depth = factory.getUndoHistoryDepth()
        run(action)
        const after = save()
        expect(factory.getUndoHistoryDepth()).toBe(depth + 1)
        factory.undo()
        expect(save()).toEqual(before)
        factory.redo()
        expect(save()).toEqual(after)
      }
      const saved = save()
      props.reset()
      scene.reset()
      props.load(saved.props)
      scene.load(saved.scene)
      expect(save()).toEqual(saved)
      run(() =>
        api.updateElementPropertyTargets([
          { target: target('b'), values: { opacity: 0.7 } }
        ])
      )
      expect(
        api.readElementPropertyTargets([target('b')])[0].effective.opacity
      ).toBe(0.7)
    } finally {
      factory.transact.reset()
    }
  })
  it('keeps existing element convenience edits local and replays exact owner bindings', () => {
    const { props, scene, api, factory, run, target } = setup()
    const before = { props: props.save(), scene: scene.save() }
    try {
      run(() =>
        api.updateElementProperties([
          { elementId: 'a', values: { opacity: 0.2 } },
          { elementId: 'b', values: { opacity: 0.6 } }
        ])
      )
      expect(
        api
          .readElementPropertyTargets([target(), target('b')])
          .map((view) => view.effective.opacity)
      ).toEqual([0.2, 0.6])
      expect(props.save().source).toMatchObject({ opacity: 1 })
      const after = { props: props.save(), scene: scene.save() }
      expect(factory.getUndoHistoryDepth()).toBe(1)
      factory.undo()
      expect({ props: props.save(), scene: scene.save() }).toEqual(before)
      factory.redo()
      expect({ props: props.save(), scene: scene.save() }).toEqual(after)
      run(() =>
        api.updateSharedPropertySources([
          { propertyId: 'source', values: { color: '#fedcba' } }
        ])
      )
      expect(
        api
          .readElementPropertyTargets([target(), target('b')])
          .map((view) => view.effective.color)
      ).toEqual(['#fedcba', '#fedcba'])
    } finally {
      factory.transact.reset()
    }
  })
  it('patches shared child records, membership and reload through the existing public API', () => {
    const { props, scene, api, factory, run } = setup()
    const target = (elementId = 'a') => ({
      elementId,
      propertyName: 'materials',
      path: []
    })
    const childTarget = {
      ...target(),
      path: [{ key: 'materials', childId: 'source' }]
    }
    const snapshot = () => ({ props: props.save(), scene: scene.save() })
    const replay = (action: () => void) => {
      const before = snapshot(),
        depth = factory.getUndoHistoryDepth()
      run(action)
      const after = snapshot()
      expect(factory.getUndoHistoryDepth()).toBe(depth + 1)
      try {
        factory.undo()
      } catch (error) {
        throw new Error(
          JSON.stringify(
            (error as { failures?: unknown }).failures,
            (_key, value) =>
              value instanceof Error
                ? { message: value.message, stack: value.stack }
                : value
          )
        )
      }
      expect(snapshot()).toEqual(before)
      factory.redo()
      expect(snapshot()).toEqual(after)
    }
    try {
      replay(() =>
        api.patchElementProperties([
          {
            elementId: 'a',
            records: [{ key: 'materials', set: { source: { opacity: 0.3 } } }]
          }
        ])
      )
      const local = api.readElementPropertyTargets([childTarget])[0]
      expect(local.effective.opacity).toBe(0.3)
      expect(props.save().source).toMatchObject({ opacity: 1 })
      expect(
        api.readElementPropertyTargets([target('b')])[0].effective.materials
      ).toEqual(['source'])
      replay(() =>
        api.patchElementProperties([
          {
            elementId: 'a',
            records: [
              { key: 'materials', set: { 'new-material': { opacity: 0.7 } } }
            ]
          }
        ])
      )
      expect(
        api.readElementPropertyTargets([target()])[0].effective.materials
      ).toEqual([local.propertyId, 'new-material'])
      replay(() =>
        api.patchElementProperties([
          {
            elementId: 'a',
            records: [{ key: 'materials', remove: [local.propertyId] }]
          }
        ])
      )
      expect(
        api.readElementPropertyTargets([target()])[0].effective.materials
      ).toEqual(['new-material'])
      expect(props.save().source).toBeDefined()
      const saved = snapshot()
      props.reset()
      scene.reset()
      props.load(saved.props)
      scene.load(saved.scene)
      expect(snapshot()).toEqual(saved)
      replay(() =>
        api.patchElementProperties([
          {
            elementId: 'a',
            records: [
              {
                key: 'materials',
                set: { 'new-material': { color: '#abcdef' } }
              }
            ]
          }
        ])
      )
      const beforeInvalid = snapshot()
      expect(() =>
        run(() =>
          api.patchElementProperties([
            {
              elementId: 'a',
              records: [
                { key: 'materials', set: { 'new-material': { opacity: 0.5 } } }
              ]
            },
            {
              elementId: 'b',
              records: [
                { key: 'materials', set: { source: { unavailable: 1 } } }
              ]
            }
          ])
        )
      ).toThrow()
      expect(snapshot()).toEqual(beforeInvalid)
    } finally {
      factory.transact.reset()
    }
  })
  it('applies canonical layer and binding evidence without reallocating local intent', () => {
    const { props, scene, api, factory, run, target } = setup()
    try {
      run(() =>
        api.updateElementPropertyTargets([
          { target: target(), values: { opacity: 0.2 } }
        ])
      )
      const local = api.readElementPropertyTargets([target()])[0]
      run(() =>
        api.applyCanonicalChanges([
          {
            kind: 'property-components',
            updates: [],
            layers: [
              {
                propertyId: local.propertyId,
                changes: [
                  {
                    layer: 'overrides',
                    key: 'opacity',
                    state: { present: false }
                  }
                ]
              }
            ]
          }
        ])
      )
      expect(api.readElementPropertyTargets([target()])[0]).toMatchObject({
        propertyId: local.propertyId,
        effective: { opacity: 1 }
      })
      factory.undo()
      expect(
        api.readElementPropertyTargets([target()])[0].effective.opacity
      ).toBe(0.2)
      factory.redo()
      expect(
        api.readElementPropertyTargets([target()])[0].effective.opacity
      ).toBe(1)
      const before = { props: props.save(), scene: scene.save() }
      run(() =>
        api.applyCanonicalChanges([
          {
            kind: 'element-property-bindings',
            changes: [
              {
                action:
                  SCENE_TREE_ACTIONS.UPDATE_ELEMENT_PROPERTY_BINDINGS as const,
                eventName: 'updateElementPropertyBindings',
                id: 'b',
                changes: [
                  { key: 'material', before: 'source', after: local.propertyId }
                ]
              }
            ]
          }
        ])
      )
      expect(api.readElementPropertyTargets([target('b')])[0].propertyId).toBe(
        local.propertyId
      )
      factory.undo()
      expect({ props: props.save(), scene: scene.save() }).toEqual(before)
    } finally {
      factory.transact.reset()
    }
  })

  it('accepts exact graph retirement through the real remote Undo transaction with child-first inputs', async () => {
    const { api, props, scene, factory } = setup()
    const before = { props: props.save(), scene: scene.save() }
    try {
      await api.applyRemoteCanonicalChangeSlices({
        origin: 'undo',
        slices: [
          [
            {
              kind: 'element-removal',
              removals: [
                {
                  data: before.scene.elements.b,
                  parentId: 'workspace',
                  index: 1
                },
                {
                  data: before.scene.elements.a,
                  parentId: 'workspace',
                  index: 0
                }
              ]
            },
            {
              kind: 'property-components',
              updates: [],
              removals: [before.props.source, before.props.materials]
            }
          ]
        ]
      })
      expect(props.save()).toEqual({})
      expect(Object.keys(scene.save().elements)).toEqual(['workspace'])
      expect(factory.transact.undoStack).toHaveLength(0)
    } finally {
      factory.transact.reset()
    }
  })

  it('applies remote element removal and exact local-property retirement with reversible shared ownership', () => {
    const { api, props, scene, factory, run, target } = setup()
    const snapshot = () => ({ props: props.save(), scene: scene.save() })
    try {
      run(() =>
        api.updateElementPropertyTargets([
          { target: target(), values: { opacity: 0.3 } }
        ])
      )
      const before = snapshot()
      const localId = api.readElementPropertyTargets([target()])[0].propertyId
      const record = props.save()[localId]
      const removal = {
        data: before.scene.elements.a,
        parentId: 'workspace',
        index: 0
      }
      run(() =>
        api.applyCanonicalChanges([
          { kind: 'element-removal', removals: [removal] },
          { kind: 'property-components', updates: [], removals: [record] }
        ])
      )
      const after = snapshot()
      expect(after.props[localId]).toBeUndefined()
      expect(after.props.source).toEqual(before.props.source)
      expect(after.scene.elements.b).toEqual(before.scene.elements.b)
      factory.undo()
      expect(snapshot()).toEqual(before)
      factory.redo()
      expect(snapshot()).toEqual(after)
    } finally {
      factory.transact.reset()
    }
  })

  it('does not infer property retirement from a remote membership unlink', () => {
    const { api, props, factory, run } = setup()
    try {
      run(() =>
        api.applyCanonicalChanges([
          {
            kind: 'property-components',
            updates: [],
            creations: [
              { id: 'remote-member', type, opacity: 0.3, color: '#334455' }
            ],
            removals: []
          },
          {
            kind: 'property-components',
            updates: [
              {
                propertyId: 'materials',
                values: { materials: ['remote-member'] }
              }
            ]
          }
        ])
      )
      run(() =>
        api.applyCanonicalChanges([
          {
            kind: 'property-components',
            updates: [{ propertyId: 'materials', values: { materials: [] } }]
          }
        ])
      )
      expect(props.save()['remote-member']).toBeDefined()
      expect(props.save().materials).toMatchObject({ materials: [] })
      factory.undo()
      expect(props.save().materials).toMatchObject({
        materials: ['remote-member']
      })
    } finally {
      factory.transact.reset()
    }
  })

  it('replays exact canonical lifecycle without changing identities or retiring live roots', () => {
    const { props, scene, api, factory, run } = setup()
    const snapshot = () => ({ props: props.save(), scene: scene.save() })
    const before = snapshot()
    const record = {
      id: 'remote-local',
      type,
      inheritance: {
        sourceId: 'source',
        overrides: { opacity: 0.25 },
        childBindings: {}
      }
    }
    const bind = (from: string, to: string) => ({
      kind: 'element-property-bindings' as const,
      changes: [
        {
          action: SCENE_TREE_ACTIONS.UPDATE_ELEMENT_PROPERTY_BINDINGS as const,
          eventName: 'updateElementPropertyBindings' as const,
          id: 'a',
          changes: [{ key: 'material', before: from, after: to }]
        }
      ]
    })
    try {
      run(() =>
        api.applyCanonicalChanges([
          {
            kind: 'property-components',
            updates: [],
            creations: [record],
            removals: []
          },
          bind('source', record.id)
        ])
      )
      const after = snapshot()
      expect(props.save()[record.id]).toEqual(record)
      factory.undo()
      expect(snapshot()).toEqual(before)
      factory.redo()
      expect(snapshot()).toEqual(after)
      expect(() =>
        run(() =>
          api.applyCanonicalChanges([
            { kind: 'property-components', updates: [], removals: [record] }
          ])
        )
      ).toThrow()
      expect(snapshot()).toEqual(after)
      expect(() =>
        run(() =>
          api.applyCanonicalChanges([
            bind(record.id, 'source'),
            {
              kind: 'property-components',
              updates: [],
              removals: [
                {
                  ...record,
                  inheritance: {
                    ...record.inheritance,
                    overrides: { opacity: 0.8 }
                  }
                }
              ]
            }
          ])
        )
      ).toThrow()
      expect(snapshot()).toEqual(after)
      run(() =>
        api.applyCanonicalChanges([
          bind(record.id, 'source'),
          { kind: 'property-components', updates: [], removals: [record] }
        ])
      )
      expect(snapshot()).toEqual(before)
      factory.undo()
      expect(snapshot()).toEqual(after)
      factory.redo()
      expect(snapshot()).toEqual(before)
      factory.undo()
      props.reset()
      scene.reset()
      props.load(after.props)
      scene.load(after.scene)
      expect(snapshot()).toEqual(after)
    } finally {
      factory.transact.reset()
    }
  })

  it.each(['before-binding', 'after-binding'] as const)(
    'compensates %s failure without losing the existing document',
    (when) => {
      const { props, scene, api, factory, run, target } = setup()
      const before = { props: props.save(), scene: scene.save() }
      const apply = scene.applyPreparedElementMutation.bind(scene)
      const spy = vi
        .spyOn(scene, 'applyPreparedElementMutation')
        .mockImplementationOnce((prepared, options) => {
          if (when === 'after-binding') apply(prepared, options)
          throw new Error('binding handoff failure')
        })
      try {
        expect(() =>
          run(() =>
            api.updateElementPropertyTargets([
              { target: target(), values: { opacity: 0.2 } }
            ])
          )
        ).toThrow('binding handoff failure')
        expect({ props: props.save(), scene: scene.save() }).toEqual(before)
        expect(factory.getUndoHistoryDepth()).toBe(0)
        spy.mockRestore()
        run(() =>
          api.updateElementPropertyTargets([
            { target: target(), values: { opacity: 0.4 } }
          ])
        )
        expect(
          api.readElementPropertyTargets([target()])[0].effective.opacity
        ).toBe(0.4)
        factory.undo()
        expect({ props: props.save(), scene: scene.save() }).toEqual(before)
      } finally {
        spy.mockRestore()
        factory.transact.reset()
      }
    }
  )
})
