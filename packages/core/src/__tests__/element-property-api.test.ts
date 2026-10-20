import { describe, expect, it, vi } from 'vitest'
import type {
  PreparedPropertyMutationBatch,
  PropertyMutationBatchResult
} from '@asyra/props-manager'
import type {
  ResolvedElementPropertyTargets,
  ElementPropertyTargetRequest
} from '@asyra/scene-tree'
import { createElementPropertyAPIs } from '../apis/element-properties.js'

const emptyPreparedProps: PreparedPropertyMutationBatch = Object.freeze({
  kind: 'prepared-property-mutation-batch',
  owners: Object.freeze([]),
  ownerRelations: Object.freeze([]),
  orderedPropertyIds: Object.freeze([])
})

const emptyPropsResult: PropertyMutationBatchResult = Object.freeze({
  owners: Object.freeze([]),
  ownerRelations: Object.freeze([]),
  orderedPropertyIds: Object.freeze([]),
  evidence: Object.freeze([])
})

const emptyPreparedIntent = {
  properties: emptyPreparedProps,
  rootBindings: [],
  releasedRootPropertyIds: [],
  retainedExistingPropertyIds: [],
  createdPropertyIds: []
}
const bindingRequests = () => ({
  resolveElementPropertyBindings: vi.fn(
    (
      targets: readonly {
        elementId: string
        propertyName: string
        expectedRootId?: string
      }[]
    ) =>
      targets.map((target) => ({
        relation: {
          ownerElementId: target.elementId,
          ownerElementType: 'test-element',
          ownerPropertyName: target.propertyName,
          componentId: target.expectedRootId ?? ''
        },
        shared: false
      }))
  ),
  prepareElementPropertyBindingMutation: vi.fn(),
  applyPreparedElementMutation: vi.fn(),
  preparePropertyMutationBatch: vi.fn()
})

describe('Core canonical element property APIs', () => {
  it('coordinates one complete target and Props prepared before applying replacements', () => {
    const sequence: string[] = []
    const resolvedTargets: ResolvedElementPropertyTargets = Object.freeze({
      kind: 'resolved-element-property-targets',
      orderedElementIds: Object.freeze(['element-a', 'element-b']),
      relations: Object.freeze(
        ['a', 'b'].map((id) => ({
          ownerElementId: `element-${id}`,
          ownerElementType: 'test-element',
          ownerPropertyName: 'position',
          componentId: `position-${id}`
        }))
      ),
      mutations: Object.freeze([
        Object.freeze({
          kind: 'values',
          propertyId: 'position-a',
          values: Object.freeze({ x: 10 }),
          owner: Object.freeze({
            ownerElementId: 'element-a',
            ownerPropertyName: 'position'
          })
        }),
        Object.freeze({
          kind: 'values',
          propertyId: 'position-b',
          values: Object.freeze({ x: 20 }),
          owner: Object.freeze({
            ownerElementId: 'element-b',
            ownerPropertyName: 'position'
          })
        })
      ])
    })
    const resolveElementPropertyTargets = vi.fn(
      (_requests: readonly ElementPropertyTargetRequest[]) => {
        sequence.push('target')
        return resolvedTargets
      }
    )
    const prepareOwnerPropertyMutations = vi.fn(() => {
      sequence.push('props-preflight')
      return emptyPreparedIntent
    })
    const applyPreparedPropertyMutationBatch = vi.fn(() => {
      sequence.push('props-apply')
      return emptyPropsResult
    })
    const apis = createElementPropertyAPIs({
      ...bindingRequests(),
      resolveElementPropertyTargets,
      prepareOwnerPropertyMutations,
      applyPreparedPropertyMutationBatch
    })

    const result = apis.updateElementProperties(
      [
        { elementId: 'element-a', values: { x: 10 } },
        { elementId: 'element-b', values: { x: 20 } }
      ],
      { shared: 'props' }
    )

    expect(sequence).toEqual(['target', 'props-preflight', 'props-apply'])
    expect(resolveElementPropertyTargets).toHaveBeenCalledWith([
      { kind: 'values', elementId: 'element-a', values: { x: 10 } },
      { kind: 'values', elementId: 'element-b', values: { x: 20 } }
    ])
    expect(prepareOwnerPropertyMutations).toHaveBeenCalledWith(
      resolvedTargets.mutations.map((mutation, index) => ({
        target: {
          root: resolvedTargets.relations[index],
          sharedRoot: false,
          path: []
        },
        mutation
      })),
      { shared: 'props' }
    )
    expect(applyPreparedPropertyMutationBatch).toHaveBeenCalledWith(
      emptyPreparedProps
    )
    expect(result).toEqual({
      acceptedIds: ['element-a', 'element-b'],
      changed: false
    })
    expect(Object.isFrozen(result)).toBe(true)
  })

  it('keeps value replacement and ordered record patch missions disjoint', () => {
    const resolveElementPropertyTargets = vi.fn(
      (requests: readonly ElementPropertyTargetRequest[]) =>
        Object.freeze({
          kind: 'resolved-element-property-targets' as const,
          orderedElementIds: Object.freeze(
            requests.map(({ elementId }) => elementId)
          ),
          relations: Object.freeze([]),
          mutations: Object.freeze([])
        })
    )
    const prepareOwnerPropertyMutations = vi.fn(() => emptyPreparedIntent)
    const applyPreparedPropertyMutationBatch = vi.fn(() => emptyPropsResult)
    const apis = createElementPropertyAPIs({
      ...bindingRequests(),
      resolveElementPropertyTargets,
      prepareOwnerPropertyMutations,
      applyPreparedPropertyMutationBatch
    })

    apis.updateElementProperties([
      { elementId: 'vector-a', values: { closed: true } }
    ])
    apis.patchElementProperties([
      {
        elementId: 'vector-a',
        values: { fillRule: 'evenodd' },
        records: [
          {
            key: 'points',
            set: {
              p2: { x: 20, y: 10 },
              p1: { x: 10, y: 10 }
            },
            remove: ['p0']
          }
        ]
      }
    ])

    expect(resolveElementPropertyTargets).toHaveBeenNthCalledWith(1, [
      {
        kind: 'values',
        elementId: 'vector-a',
        values: { closed: true }
      }
    ])
    expect(resolveElementPropertyTargets).toHaveBeenNthCalledWith(2, [
      {
        kind: 'records',
        elementId: 'vector-a',
        values: { fillRule: 'evenodd' },
        records: [
          {
            key: 'points',
            set: {
              p2: { x: 20, y: 10 },
              p1: { x: 10, y: 10 }
            },
            remove: ['p0']
          }
        ]
      }
    ])
  })

  it('keeps empty element property requests inert', () => {
    const requests = {
      ...bindingRequests(),
      resolveElementPropertyTargets: vi.fn(),
      prepareOwnerPropertyMutations: vi.fn(),
      applyPreparedPropertyMutationBatch: vi.fn()
    }
    const apis = createElementPropertyAPIs(requests)

    expect(apis.updateElementProperties([])).toEqual({
      acceptedIds: [],
      changed: false
    })
    expect(apis.patchElementProperties([])).toEqual({
      acceptedIds: [],
      changed: false
    })
    expect(requests.resolveElementPropertyTargets).not.toHaveBeenCalled()
    expect(requests.prepareOwnerPropertyMutations).not.toHaveBeenCalled()
    expect(requests.applyPreparedPropertyMutationBatch).not.toHaveBeenCalled()
  })
})

it('resolves nested shared property owners through canonical indexes without scanning elements', async () => {
  const { Core } = await import('../core.js')
  const resolvePropertyAncestorIds = vi.fn(() => ['color', 'fill', 'fills'])
  const getElementPropertyRelations = vi.fn((id: string) => {
    if (id === 'fills')
      return [{ ownerElementId: 'tier-3' }, { ownerElementId: 'tier-5' }]
    if (id === 'fill') return [{ ownerElementId: 'tier-3' }]
    return []
  })
  const host = {
    deps: {
      props: { resolvePropertyAncestorIds, getPropertyById: () => ({}) },
      sceneTree: { getElementPropertyRelations }
    }
  }
  expect(
    Core.prototype.getPropertyOwnerElementIds.call(host as never, ['color'])
  ).toEqual(['tier-3', 'tier-5'])
  expect(resolvePropertyAncestorIds).toHaveBeenCalledExactlyOnceWith(['color'])
  expect(getElementPropertyRelations.mock.calls.map(([id]) => id)).toEqual([
    'color',
    'fill',
    'fills'
  ])
})

it('does not treat retired property cleanup as an unknown document mutation', async () => {
  const { Core } = await import('../core.js')
  const resolvePropertyAncestorIds = vi.fn((ids: readonly string[]) => {
    if (ids.includes('retired')) throw new Error('Property is retired')
    return ids
  })
  const getElementPropertyRelations = vi.fn((id: string) =>
    id === 'active' ? [{ ownerElementId: 'tier-3' }] : []
  )
  const host = {
    deps: {
      props: {
        getPropertyById: (id: string) => (id === 'active' ? {} : undefined),
        resolvePropertyAncestorIds
      },
      sceneTree: { getElementPropertyRelations }
    }
  }
  expect(
    Core.prototype.getPropertyOwnerElementIds.call(
      host as never,
      ['retired', 'active'],
      { includeRetired: true }
    )
  ).toEqual(['tier-3'])
  expect(resolvePropertyAncestorIds).toHaveBeenCalledExactlyOnceWith(['active'])
  expect(() =>
    Core.prototype.getPropertyOwnerElementIds.call(host as never, ['retired'])
  ).toThrow('Property is retired')
})
