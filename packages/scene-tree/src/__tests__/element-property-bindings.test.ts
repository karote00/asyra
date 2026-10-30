import { beforeAll, describe, expect, it, vi } from 'vitest'
import {
  PropsManager,
  createPropertyComponentFromConfig,
  registerPropertyComponent,
  registerPropertySchema,
  elementPropertyRegistry
} from '@asyra/props-manager'
import {
  runWithTransactionOwner,
  type TransactionOwner,
  type UpdateTransactionEvent
} from '@asyra/reactive-events'
import {
  SCENE_TREE_ACTIONS,
  type UpdateElementPropertyBindingsChange
} from '@asyra/utils'
import { SceneTree } from '../sceneTree.js'
import componentRegistry from '../component-registry.js'
import { createDynamicComponent } from '../create-dynamic-component.js'

const materialType = 'binding-test-material'
const elementType = 'binding-test-element'
const definition = {
  type: materialType,
  defaults: { opacity: 1 },
  persistKeys: ['opacity'],
  valueKeys: ['opacity']
}
const properties = [{ name: 'material', type: materialType }]
const transactionOwner = (updateTransactionBatch = vi.fn()) =>
  ({
    startTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    updateTransactionBatch,
    endTransaction: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn()
  }) as unknown as TransactionOwner

const fixture = () => {
  const props = new PropsManager()
  props.load({
    source: {
      id: 'source',
      type: materialType,
      opacity: 1,
      sharedSource: true
    },
    local: {
      id: 'local',
      type: materialType,
      inheritance: {
        sourceId: 'source',
        overrides: { opacity: 0.4 },
        childBindings: {}
      }
    }
  })
  const scene = new SceneTree(props)
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
            type: elementType,
            name: id,
            parentId: 'workspace',
            visible: true,
            lock: false,
            props: { material: 'source' }
          }
        ])
      )
    }
  })
  const request = (elementId = 'a', before = 'source', after = 'local') => ({
    elementId,
    propertyName: 'material',
    before,
    after,
    propertyType: materialType
  })
  const apply = (requests = [request()], owner = transactionOwner()) => {
    const prepared = scene.prepareElementPropertyBindingMutation(requests)
    return runWithTransactionOwner(owner, () =>
      scene.applyPreparedElementMutation(prepared)
    )
  }
  return { props, scene, request, apply }
}

beforeAll(() => {
  elementPropertyRegistry.register(
    { name: 'material', type: materialType },
    elementType
  )
  registerPropertySchema({
    type: materialType,
    fields: [{ key: 'opacity', kind: 'number', defaultValue: 1 }]
  })
  registerPropertyComponent(
    materialType,
    createPropertyComponentFromConfig(definition),
    undefined,
    definition
  )
  componentRegistry.unregister(elementType)
  componentRegistry.register({
    type: elementType,
    idPrefix: elementType,
    namePrefix: 'Binding Element',
    properties,
    constructor: createDynamicComponent(
      elementType,
      elementType,
      'Binding Element',
      properties,
      {}
    ),
    defaults: {}
  })
})

describe('Canonical element property binding mutation', () => {
  it('resolves exact roots without collapsing shared owners and prepares last-owner retirement', () => {
    const { scene, request } = fixture()
    const targets = scene.resolveElementPropertyBindings([
      { elementId: 'a', propertyName: 'material' },
      { elementId: 'b', propertyName: 'material', expectedRootId: 'source' }
    ])
    expect(
      targets.map((target) => [
        target.relation.ownerElementId,
        target.relation.componentId,
        target.shared
      ])
    ).toEqual([
      ['a', 'source', true],
      ['b', 'source', true]
    ])
    const first = scene.prepareElementPropertyBindingMutation([request()])
    expect(first.orphanRootPropertyIds).toEqual([])
    expect(first.retainedRootPropertyIds).toEqual(
      expect.arrayContaining(['source', 'local'])
    )
    const both = scene.prepareElementPropertyBindingMutation([
      request(),
      request('b')
    ])
    expect(both.orphanRootPropertyIds).toEqual(['source'])
    expect(both.retainedRootPropertyIds).toEqual(['local'])
    const before = scene.save()
    expect(() =>
      scene.resolveElementPropertyBindings([
        { elementId: 'a', propertyName: 'material' },
        { elementId: 'b', propertyName: 'material', expectedRootId: 'local' }
      ])
    ).toThrow(/stale/i)
    expect(() =>
      scene.resolveElementPropertyBindings([
        { elementId: 'a', propertyName: 'missing' }
      ])
    ).toThrow()
    expect(scene.save()).toEqual(before)
  })

  it('rebinds one owner, preserves another owner and publishes exact field evidence', () => {
    const { scene, apply } = fixture()
    const publish = vi.fn()
    const result = apply(undefined, transactionOwner(publish))
    expect(scene.getElementById('a')?.props.getPropId('material')).toBe('local')
    expect(scene.getElementById('b')?.props.getPropId('material')).toBe(
      'source'
    )
    expect(scene.getElementById('a')?.getAllComputedData()).toMatchObject({
      opacity: 0.4
    })
    expect(scene.getElementById('b')?.getAllComputedData()).toMatchObject({
      opacity: 1
    })
    expect(
      scene.getElementPropertyRelations('source').map((r) => r.ownerElementId)
    ).toEqual(['b'])
    expect(
      scene.getElementPropertyRelations('local').map((r) => r.ownerElementId)
    ).toEqual(['a'])
    expect(result.evidence).toMatchObject([
      {
        id: 'a',
        changes: [{ key: 'material', before: 'source', after: 'local' }]
      }
    ])
    expect(publish).toHaveBeenCalledOnce()
    const events = publish.mock.calls[0][0] as UpdateTransactionEvent[]
    expect(events[0].canonicalEvidence?.orderedIds).toEqual(['a'])
  })

  it('replicates the published binding evidence and restores the same sparse graph after reload', () => {
    const local = fixture()
    const remote = fixture()
    const result = local.apply()
    const evidence = result.evidence.filter(
      (change): change is UpdateElementPropertyBindingsChange =>
        change.action === SCENE_TREE_ACTIONS.UPDATE_ELEMENT_PROPERTY_BINDINGS
    )
    const prepared =
      remote.scene.prepareCanonicalElementPropertyBindingMutation(evidence)
    runWithTransactionOwner(transactionOwner(), () =>
      remote.scene.applyPreparedElementMutation(prepared)
    )
    expect(remote.scene.save()).toEqual(local.scene.save())
    expect(
      remote.scene.getElementById('a')?.getAllComputedData()
    ).toMatchObject({ opacity: 0.4 })
    const propsSnapshot = remote.props.save()
    const sceneSnapshot = remote.scene.save()
    remote.props.load(propsSnapshot)
    remote.scene.load(sceneSnapshot)
    expect(remote.scene.save()).toEqual(sceneSnapshot)
    expect(remote.props.save()).toEqual(propsSnapshot)
    const inverse = evidence.map((change) => ({
      ...change,
      changes: change.changes.map(({ key, before, after }) => ({
        key,
        before: after,
        after: before
      }))
    }))
    runWithTransactionOwner(transactionOwner(), () =>
      remote.scene.applyPreparedElementMutation(
        remote.scene.prepareCanonicalElementPropertyBindingMutation(inverse)
      )
    )
    expect(remote.scene.getElementById('a')?.props.getPropId('material')).toBe(
      'source'
    )
    expect(
      remote.scene.getElementById('a')?.getAllComputedData()
    ).toMatchObject({ opacity: 1 })
    expect(remote.scene.getElementPropertyRelations('local')).toEqual([])
  })

  it('allows allocation between preparation and apply, and rejects retirement before apply', () => {
    const { scene, props, request } = fixture()
    const prepared = scene.prepareElementPropertyBindingMutation([
      request('a', 'source', 'allocated')
    ])
    props.addProperty([
      props.createProperty({
        id: 'allocated',
        type: materialType,
        opacity: 0.2
      })
    ])
    runWithTransactionOwner(transactionOwner(), () =>
      scene.applyPreparedElementMutation(prepared)
    )
    expect(scene.getElementById('a')?.getAllComputedData()).toMatchObject({
      opacity: 0.2
    })
    const stale = scene.prepareElementPropertyBindingMutation([
      request('a', 'allocated', 'local')
    ])
    props.removeProperty(['local'])
    expect(() =>
      runWithTransactionOwner(transactionOwner(), () =>
        scene.applyPreparedElementMutation(stale)
      )
    ).toThrow(/stale/)
    expect(scene.getElementById('a')?.props.getPropId('material')).toBe(
      'allocated'
    )
  })

  it('rejects a complete invalid batch and stale preparation without changing bindings', () => {
    const { scene, request, apply } = fixture()
    for (const invalid of [
      request('missing'),
      request('b', 'wrong'),
      { ...request('b'), propertyName: 'missing' },
      { ...request('b'), propertyType: 'wrong' },
      request('b', 'source', 'missing')
    ]) {
      expect(() => apply([request(), invalid])).toThrow()
      expect(scene.getElementById('a')?.props.getPropId('material')).toBe(
        'source'
      )
    }
    expect(() => apply([request(), request()])).toThrow()
    const prepared = scene.prepareElementPropertyBindingMutation([request()])
    apply()
    expect(() =>
      runWithTransactionOwner(transactionOwner(), () =>
        scene.applyPreparedElementMutation(prepared)
      )
    ).toThrow(/stale/)
  })

  it('restores bindings and reverse relations after a rejected handoff, then permits retry and exact inverse', () => {
    const { scene, request, apply } = fixture()
    const before = scene.save()
    expect(() =>
      apply(
        undefined,
        transactionOwner(
          vi.fn(() => {
            throw new Error('handoff rejected')
          })
        )
      )
    ).toThrow('handoff rejected')
    expect(scene.save()).toEqual(before)
    expect(
      scene.getElementPropertyRelations('source').map((r) => r.ownerElementId)
    ).toEqual(['a', 'b'])
    expect(scene.getElementPropertyRelations('local')).toEqual([])
    apply()
    apply([request('a', 'local', 'source')])
    expect(scene.save()).toEqual(before)
  })
})
