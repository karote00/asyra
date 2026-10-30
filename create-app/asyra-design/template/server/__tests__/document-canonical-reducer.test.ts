import { describe, expect, it } from 'vitest'
import type {
  CanonicalChange,
  AppDocumentData
} from '../../src/collaboration/app-protocol-types'
import { resolve } from 'node:path'
import { createFormalInitialDocument } from '../../src/collaboration/initial-document'
import { createFileDocumentMaterializationStore } from '../document-backend-store'
import { applyCanonicalChangesToDocument } from '../document-canonical-reducer'

const initialDocument = (): AppDocumentData => ({
  version: '1.0.0',
  sceneTree: {
    workspace: 'workspace',
    workspaceList: ['workspace'],
    elements: {
      workspace: {
        id: 'workspace',
        name: 'Workspace',
        type: 'workspace' as never,
        parentId: '',
        visible: true,
        lock: false,
        children: []
      }
    }
  },
  props: {}
})

const apply = (
  document: AppDocumentData,
  changes: readonly CanonicalChange[]
): AppDocumentData => applyCanonicalChangesToDocument(document, changes)

describe('backend canonical document reducer', () => {
  it.each([16, 1024])(
    'validates local layer changes without reading %i unrelated property graphs',
    (count) => {
      const document = initialDocument()
      document.props.source = {
        id: 'source',
        type: 'fill',
        sharedSource: true,
        opacity: 1
      }
      document.props.local = {
        id: 'local',
        type: 'fill',
        inheritance: { sourceId: 'source', overrides: {}, childBindings: {} }
      }
      let reads = 0
      for (let i = 0; i < count; i++)
        document.props[`unrelated-${i}`] = {
          id: `unrelated-${i}`,
          type: 'fill',
          opacity: 1,
          get inheritance() {
            reads += 1
            return undefined
          }
        }
      const next = apply(document, [
        {
          kind: 'property-components',
          updates: [],
          layers: [
            {
              propertyId: 'local',
              changes: [
                {
                  layer: 'overrides',
                  key: 'opacity',
                  state: { present: true, value: 0.5 }
                }
              ]
            }
          ]
        }
      ])
      expect(next.props.local.inheritance).toMatchObject({
        overrides: { opacity: 0.5 }
      })
      expect(reads).toBe(0)
    }
  )

  it('validates surviving links independently of a binding and removal sharing a persistence window', () => {
    const document = initialDocument()
    document.props.source = {
      id: 'source',
      type: 'fill',
      sharedSource: true,
      opacity: 1
    }
    document.props.local = {
      id: 'local',
      type: 'fill',
      inheritance: {
        sourceId: 'source',
        overrides: { opacity: 0.4 },
        childBindings: {}
      }
    }
    const element = {
      id: 'a',
      name: 'a',
      type: 'rect',
      visible: true,
      lock: false,
      parentId: 'workspace',
      props: { fill: 'source' }
    }
    document.sceneTree.elements.a = element
    Object.assign(document.sceneTree.elements.workspace, { children: ['a'] })
    const binding: CanonicalChange = {
      kind: 'element-property-bindings',
      changes: [
        {
          action: 'updateElementPropertyBindings',
          eventName: 'updateElementPropertyBindings',
          id: 'a',
          changes: [{ key: 'fill', before: 'source', after: 'local' }]
        }
      ]
    }
    const removal: CanonicalChange = {
      kind: 'element-removal',
      removals: [
        {
          data: { ...element, props: { fill: 'local' } },
          parentId: 'workspace',
          index: 0
        }
      ]
    }
    const retired: CanonicalChange = {
      kind: 'property-components',
      updates: [],
      removals: [document.props.local]
    }
    const separated = [binding, removal, retired].reduce(
      (current, change) => apply(current, [change]),
      document
    )
    expect(apply(document, [binding, removal, retired])).toEqual(separated)
    expect(separated.sceneTree.elements.a).toBeUndefined()
    expect(separated.props.source).toEqual(document.props.source)
    expect(() => apply(separated, [binding])).toThrow(/element "a" is missing/)
    expect(() => apply(document, [binding, retired])).toThrow(
      /references missing property/
    )
    expect(document.sceneTree.elements.a).toEqual(element)
  })

  it('persists exact local overrides and source edits without flattening or changing unrelated owners', () => {
    const document = initialDocument()
    const source = {
      id: 'source',
      type: 'fill',
      sharedSource: true,
      opacity: 1,
      color: '#112233'
    }
    document.props.source = source
    for (const id of ['a', 'b'])
      document.sceneTree.elements[id] = {
        id,
        type: 'rectangle',
        name: id,
        visible: true,
        lock: false,
        parentId: 'workspace',
        props: { fill: 'source' }
      }
    const local = {
      id: 'local',
      type: 'fill',
      inheritance: {
        sourceId: 'source',
        overrides: { opacity: 0.4 },
        childBindings: {}
      }
    }
    const binding = (from: string, to: string): CanonicalChange => ({
      kind: 'element-property-bindings',
      changes: [
        {
          action: 'updateElementPropertyBindings',
          eventName: 'updateElementPropertyBindings',
          id: 'a',
          changes: [{ key: 'fill', before: from, after: to }]
        }
      ]
    })
    const next = apply(document, [
      {
        kind: 'property-components',
        updates: [],
        creations: [local],
        removals: []
      },
      binding('source', 'local'),
      {
        kind: 'property-components',
        updates: [{ propertyId: 'source', values: { color: '#abcdef' } }]
      }
    ])
    expect(next.props.local).toEqual(local)
    expect(next.sceneTree.elements.b.props).toEqual({ fill: 'source' })
    expect(document.props).toEqual({ source })
    const reset = apply(next, [
      {
        kind: 'property-components',
        updates: [],
        layers: [
          {
            propertyId: 'local',
            changes: [
              { layer: 'overrides', key: 'opacity', state: { present: false } }
            ]
          }
        ]
      }
    ])
    expect(reset.props.local.inheritance).toEqual({
      sourceId: 'source',
      overrides: {},
      childBindings: {}
    })
    expect(() =>
      apply(reset, [
        {
          kind: 'property-components',
          updates: [],
          removals: [reset.props.local]
        }
      ])
    ).toThrow()
    expect(() =>
      apply(reset, [
        binding('local', 'source'),
        { kind: 'property-components', updates: [], removals: [local] }
      ])
    ).toThrow()
    expect(reset.sceneTree.elements.a.props).toEqual({ fill: 'local' })
    const detached = apply(reset, [
      binding('local', 'source'),
      {
        kind: 'property-components',
        updates: [],
        removals: [reset.props.local]
      }
    ])
    expect(detached.props.local).toBeUndefined()
    expect(detached.props.source).toEqual({ ...source, color: '#abcdef' })
    expect(() =>
      apply(detached, [
        { kind: 'property-components', updates: [], creations: [source] }
      ])
    ).toThrow()
    expect(() =>
      apply(detached, [
        {
          kind: 'property-components',
          updates: [],
          creations: [
            {
              ...local,
              inheritance: { ...local.inheritance, sourceId: 'missing' }
            }
          ]
        }
      ])
    ).toThrow()
  })

  it('uses the formal sequence-zero document for a new backend checkpoint', async () => {
    const store = createFileDocumentMaterializationStore(
      resolve(
        process.cwd(),
        'server/__tests__/.nonexistent-formal-document-store'
      )
    )

    await expect(
      store.readCheckpoint('formal-initial-document')
    ).resolves.toEqual({
      document: createFormalInitialDocument(),
      documentGeneration: 0,
      durableSequence: 0,
      publicationSequences: {},
      batches: {}
    })
  })

  it('applies property relationship records, values, and element data without mutating the checkpoint input', () => {
    const document = initialDocument()
    document.sceneTree.elements.element = {
      id: 'element',
      name: 'Before',
      type: 'rectangle' as never,
      parentId: 'workspace',
      visible: true,
      lock: false,
      props: {
        position: 'position'
      }
    }
    ;(
      document.sceneTree.elements
        .workspace as typeof document.sceneTree.elements.workspace & {
        children: string[]
      }
    ).children.push('element')
    document.props.position = {
      id: 'position',
      type: 'position' as never,
      x: 0,
      y: 0,
      records: ['stale']
    }
    document.props.stale = {
      id: 'stale',
      type: 'record' as never,
      value: 1
    }

    const next = apply(document, [
      {
        kind: 'property-components',
        creations: [{ id: 'fresh', type: 'record', value: 2 }],
        removals: [document.props.stale],
        updates: [
          {
            propertyId: 'position',
            values: { x: 25, records: ['fresh'] }
          }
        ]
      },
      {
        kind: 'element-data',
        changes: [
          {
            action: 'update-element-data' as never,
            eventName: 'update-element-data',
            id: 'element',
            changes: [
              {
                key: 'name',
                before: 'Before',
                after: 'After'
              }
            ]
          }
        ]
      }
    ])

    expect(next.props.position).toMatchObject({
      x: 25,
      records: ['fresh']
    })
    expect(next.props.fresh).toEqual({
      id: 'fresh',
      type: 'record',
      value: 2
    })
    expect(next.props.stale).toBeUndefined()
    expect(next.sceneTree.elements.element.name).toBe('After')
    expect(document.props.position).toMatchObject({
      x: 0,
      records: ['stale']
    })
    expect(document.props.stale).toEqual({
      id: 'stale',
      type: 'record',
      value: 1
    })
    expect(document.sceneTree.elements.element.name).toBe('Before')
  })

  it('restores exact nonadjacent slots across parents independently of replay order', () => {
    const document = initialDocument()
    const element = (id: string, parentId: string) => ({
      id,
      name: id,
      type: 'rectangle' as never,
      parentId,
      visible: true,
      lock: false
    })
    document.sceneTree.elements.workspace.children = ['kept', 'other']
    document.sceneTree.elements.kept = element('kept', 'workspace')
    document.sceneTree.elements.other = {
      ...element('other', 'workspace'),
      type: 'group' as never,
      children: []
    }
    const entries = [
      { data: element('right', 'workspace'), parentId: 'workspace', index: 2 },
      { data: element('nested', 'other'), parentId: 'other', index: 0 },
      { data: element('left', 'workspace'), parentId: 'workspace', index: 0 }
    ]
    const [right, , left] = entries
    if (!right || !left) throw new Error('Missing exact insertion fixture')
    const restored = apply(document, [
      { kind: 'element-creation', entries, properties: [] }
    ])
    expect(restored.sceneTree.elements.workspace.children).toEqual([
      'left',
      'kept',
      'right',
      'other'
    ])
    expect(restored.sceneTree.elements.other.children).toEqual(['nested'])
    expect(document.sceneTree.elements.workspace.children).toEqual([
      'kept',
      'other'
    ])
    for (const index of [-1, 0.5, 99]) {
      expect(() =>
        apply(document, [
          {
            kind: 'element-creation',
            entries: [{ ...right, index }],
            properties: []
          }
        ])
      ).toThrow(/index/)
    }
    expect(() =>
      apply(document, [
        {
          kind: 'element-creation',
          entries: [{ ...right, index: 0 }, left],
          properties: []
        }
      ])
    ).toThrow(/index/)
  })

  it('creates, moves, and removes exact canonical elements with their owned properties', () => {
    const document = initialDocument()
    const created = apply(document, [
      {
        kind: 'element-creation',
        entries: [
          {
            id: 'group',
            name: 'Group',
            type: 'group' as never,
            parentId: 'workspace',
            visible: true,
            lock: false,
            children: []
          },
          {
            id: 'element',
            name: 'Element',
            type: 'rectangle' as never,
            parentId: 'workspace',
            visible: true,
            lock: false,
            props: { position: 'position' }
          }
        ].map((data, index) => ({ data, parentId: 'workspace', index })),
        properties: [
          {
            id: 'position',
            type: 'position' as never,
            x: 1,
            y: 2
          }
        ]
      }
    ])

    const moved = apply(created, [
      {
        kind: 'hierarchy-moves',
        moves: [
          {
            elementId: 'element',
            before: { parentId: 'workspace', index: 1 },
            after: { parentId: 'group', index: 0 }
          }
        ]
      }
    ])
    expect(
      (
        moved.sceneTree.elements
          .group as typeof moved.sceneTree.elements.group & {
          children: string[]
        }
      ).children
    ).toEqual(['element'])
    expect(moved.sceneTree.elements.element.parentId).toBe('group')

    const removed = apply(moved, [
      {
        kind: 'element-removal',
        removals: [
          {
            data: moved.sceneTree.elements.element,
            parentId: 'group',
            index: 0
          }
        ]
      },
      {
        kind: 'property-components',
        updates: [],
        removals: [moved.props.position]
      }
    ])
    expect(removed.sceneTree.elements.element).toBeUndefined()
    expect(removed.props.position).toBeUndefined()
  })

  it('retires only explicitly declared records without interpreting arbitrary string fields', () => {
    const document = initialDocument()
    const element = {
      id: 'element',
      name: 'Element',
      type: 'rectangle' as never,
      parentId: 'workspace',
      visible: true,
      lock: false,
      props: { root: 'property-root' }
    }
    document.sceneTree.elements.element = element
    ;(
      document.sceneTree.elements
        .workspace as typeof document.sceneTree.elements.workspace & {
        children: string[]
      }
    ).children.push('element')
    document.props['property-root'] = {
      id: 'property-root',
      type: 'root' as never,
      children: ['property-left', 'property-right']
    }
    document.props['property-left'] = {
      id: 'property-left',
      type: 'branch' as never,
      child: 'property-leaf'
    }
    document.props['property-right'] = {
      id: 'property-right',
      type: 'branch' as never,
      child: 'property-leaf'
    }
    document.props['property-leaf'] = {
      id: 'property-leaf',
      type: 'leaf' as never,
      owner: 'property-root'
    }
    document.props.unrelated = {
      id: 'unrelated',
      type: 'unrelated' as never,
      value: 1
    }

    const removed = apply(document, [
      {
        kind: 'element-removal',
        removals: [
          {
            data: element,
            parentId: 'workspace',
            index: 0
          }
        ]
      },
      {
        kind: 'property-components',
        updates: [],
        removals: [
          'property-root',
          'property-left',
          'property-right',
          'property-leaf'
        ].map((id) => document.props[id])
      }
    ])

    expect(removed.props).toEqual({
      unrelated: document.props.unrelated
    })
    expect(document.props).toHaveProperty('property-root')
    expect(document.props).toHaveProperty('property-leaf')
  })

  it('removes and restores one exact subtree checkpoint including property components', () => {
    const document = initialDocument()
    const group = {
      id: 'group',
      name: 'Group',
      type: 'group' as never,
      parentId: 'workspace',
      visible: true,
      lock: false,
      children: ['element']
    }
    const element = {
      id: 'element',
      name: 'Element',
      type: 'rectangle' as never,
      parentId: 'group',
      visible: true,
      lock: false,
      props: { position: 'position' }
    }
    document.sceneTree.elements.group = group
    document.sceneTree.elements.element = element
    ;(
      document.sceneTree.elements
        .workspace as typeof document.sceneTree.elements.workspace & {
        children: string[]
      }
    ).children.push('group')
    const position = {
      id: 'position',
      type: 'position' as never,
      x: 1,
      y: 2
    }
    document.props.position = position
    const sceneSnapshot = {
      elementId: 'group',
      removed: [
        { elementId: 'element', parentId: 'group', index: 0, data: element },
        {
          elementId: 'group',
          parentId: 'workspace',
          index: 0,
          data: group
        }
      ],
      rootParentChildrenAfter: []
    }

    const removed = apply(document, [
      {
        kind: 'subtree-removal',
        change: {
          action: 'remove-subtree' as never,
          undoAction: 'restore-subtree' as never,
          eventName: 'remove-subtree',
          ...sceneSnapshot
        }
      },
      { kind: 'property-components', updates: [], removals: [position] }
    ])
    expect(removed.sceneTree.elements.group).toBeUndefined()
    expect(removed.sceneTree.elements.element).toBeUndefined()
    expect(removed.props.position).toBeUndefined()

    const restored = apply(removed, [
      {
        kind: 'subtree-restore',
        sceneSnapshot,
        propsSnapshot: { components: [position] }
      }
    ])
    expect(restored.sceneTree.elements.group).toEqual(group)
    expect(restored.sceneTree.elements.element).toEqual(element)
    expect(restored.props.position).toEqual(position)
    expect(
      (
        restored.sceneTree.elements
          .workspace as typeof restored.sceneTree.elements.workspace & {
          children: string[]
        }
      ).children
    ).toEqual(['group'])
  })
})
