import { beforeAll, describe, expect, it } from 'vitest'
import {
  PropsManager,
  createPropertyComponentFromConfig,
  registerPropertyComponent,
  registerPropertySchema,
  elementPropertyRegistry
} from '@asyra/props-manager'
import {
  SceneTree,
  componentRegistry,
  createDynamicComponent
} from '@asyra/scene-tree'
import {
  runWithTransactionOwner,
  type TransactionOwner,
  type UpdateTransactionEvent
} from '@asyra/reactive-events'
import { createElementPropertyIntentAPIs } from '../apis/property-intents.js'

const type = 'intent-coordination-material'
const ownerType = 'intent-coordination-element'
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
  const properties = [{ name: 'material', type }]
  elementPropertyRegistry.register(properties[0], ownerType)
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
  const props = new PropsManager()
  props.load({
    source: {
      id: 'source',
      type,
      opacity: 1,
      color: '#112233',
      sharedSource: true
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
            type: ownerType,
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
  const api = createElementPropertyIntentAPIs({
    resolveElementPropertyBindings:
      scene.resolveElementPropertyBindings.bind(scene),
    readPropertyTargets: props.readPropertyTargets.bind(props),
    preparePropertyIntentBatch: props.preparePropertyIntentBatch.bind(props),
    prepareSharedPropertySourceBatch:
      props.prepareSharedPropertySourceBatch.bind(props),
    preparePropertyMutationBatch:
      props.preparePropertyMutationBatch.bind(props),
    applyPreparedPropertyMutationBatch:
      props.applyPreparedPropertyMutationBatch.bind(props),
    prepareElementPropertyBindingMutation:
      scene.prepareElementPropertyBindingMutation.bind(scene),
    applyPreparedElementMutation: scene.applyPreparedElementMutation.bind(scene)
  })
  const evidence: UpdateTransactionEvent[] = []
  const owner: TransactionOwner = {
    startTransaction: () => undefined,
    endTransaction: () => undefined,
    undo: () => undefined,
    redo: () => undefined,
    updateTransactionBatch: (events) => {
      evidence.push(...events)
    }
  }
  const run = <T>(fn: () => T): T => runWithTransactionOwner(owner, fn)
  const target = (elementId = 'a') => ({
    elementId,
    propertyName: 'material',
    path: []
  })
  return { props, scene, api, evidence, run, target }
}
describe('Canonical property intention coordination', () => {
  it('preserves isolated masks through source edits, reset, detach, sharing and reload', () => {
    const { props, scene, api, run, target } = setup()
    run(() =>
      api.updateElementPropertyTargets([
        { target: target(), values: { opacity: 0.2 } },
        { target: target('b'), values: { opacity: 0.6 } }
      ])
    )
    const read = () => api.readElementPropertyTargets([target(), target('b')])
    expect(read().map((r) => r.effective.opacity)).toEqual([0.2, 0.6])
    run(() =>
      api.updateSharedPropertySources([
        { propertyId: 'source', values: { opacity: 0.9, color: '#abcdef' } }
      ])
    )
    expect(read().map((r) => r.effective.color)).toEqual(['#abcdef', '#abcdef'])
    run(() =>
      api.resetElementPropertyOverrides([
        { target: target(), keys: ['opacity'] }
      ])
    )
    expect(read()[0].effective.opacity).toBe(0.9)
    const oldRoot = scene.getElementById('a')?.props.getPropId('material')
    if (!oldRoot) {
      throw new Error('Missing canonical root')
    }
    run(() => api.detachElementPropertyTargets([target()]))
    expect(props.getPropertyById(oldRoot)).toBeUndefined()
    expect(read()[0].mode).toBe('independent')
    run(() =>
      api.updateSharedPropertySources([
        { propertyId: 'source', values: { color: '#445566' } }
      ])
    )
    expect(read().map((r) => r.effective.color)).toEqual(['#abcdef', '#445566'])
    run(() =>
      api.shareElementPropertyTargets([
        { target: target(), sourceId: 'source' }
      ])
    )
    expect(read()[0].effective.color).toBe('#445566')
    const reloadedProps = new PropsManager()
    reloadedProps.load(props.save())
    const reloadedScene = new SceneTree(reloadedProps)
    reloadedScene.load(scene.save())
    expect(reloadedScene.save()).toEqual(scene.save())
    expect(reloadedProps.save()).toEqual(props.save())
  })
  it('rejects stale or later-invalid targets without a canonical or journal prefix', () => {
    const { props, scene, api, run, target, evidence } = setup()
    const before = { props: props.save(), scene: scene.save() }
    expect(() =>
      run(() =>
        api.updateElementPropertyTargets([
          { target: target(), values: { opacity: 0.2 } },
          { target: target('b'), values: { unknown: 1 } }
        ])
      )
    ).toThrow()
    expect(() =>
      run(() =>
        api.detachElementPropertyTargets([
          { ...target(), expectedPropertyId: 'missing' }
        ])
      )
    ).toThrow(/stale/i)
    expect({ props: props.save(), scene: scene.save() }).toEqual(before)
    expect(evidence).toEqual([])
  })
})
