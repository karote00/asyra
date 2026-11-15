import { EntityTypes, type ElementRawData } from '@asyra/utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { elementApis, hierarchyApis, selectionApis } from '../../common-apis'
import core from '../../contexts'
import {
  resolveCreateElementParent,
  resolveContainerChildTarget,
  resolveContainerChildAtClientPos,
  resolveCanvasHierarchyTarget,
  resolveCanvasHierarchyTargetAtClientPos,
  resolveCurrentCanvasHierarchyTarget,
  resolveCreateElementParentAtClientPos
} from '../canvas-hierarchy-target'

type ProjectedElement = Partial<ElementRawData>

const element = (
  id: string,
  parentId: string,
  type: string = EntityTypes.ELEMENT
): ProjectedElement => ({
  id,
  name: id,
  type,
  parentId,
  lock: false,
  visible: true
})

const flattenedIds = [
  'group-1',
  'group-2',
  'rect-2a',
  'rect-2b',
  'nested',
  'nested-leaf',
  'group-3',
  'rect-3a',
  'rect-3b',
  'outside'
]

const elementDataMap: Record<string, ProjectedElement> = {
  'group-1': element('group-1', 'workspace', EntityTypes.GROUP),
  'group-2': element('group-2', 'group-1', EntityTypes.GROUP),
  'rect-2a': element('rect-2a', 'group-2'),
  'rect-2b': element('rect-2b', 'group-2'),
  nested: element('nested', 'group-2', EntityTypes.GROUP),
  'nested-leaf': element('nested-leaf', 'nested'),
  'group-3': element('group-3', 'group-1', EntityTypes.GROUP),
  'rect-3a': element('rect-3a', 'group-3'),
  'rect-3b': element('rect-3b', 'group-3'),
  outside: element('outside', 'workspace')
}

const resolve = (
  hitElementId: string | null,
  selectedElementIds: readonly string[] = [],
  bypassParentScope = false,
  overrides: {
    flattenedIds?: readonly string[]
    elementDataMap?: Record<string, ProjectedElement>
  } = {}
) =>
  resolveCanvasHierarchyTarget({
    hitElementId,
    selectedElementIds,
    bypassParentScope,
    flattenedIds: overrides.flattenedIds ?? flattenedIds,
    elementDataMap: overrides.elementDataMap ?? elementDataMap
  })

const resolveCreateParent = (
  hitElementId: string | null,
  selectedElementIds: readonly string[] = [],
  bypassParentScope = false,
  overrides: {
    flattenedIds?: readonly string[]
    elementDataMap?: Record<string, ProjectedElement>
  } = {}
) =>
  resolveCreateElementParent({
    hitElementId,
    selectedElementIds,
    bypassParentScope,
    workspaceId: 'workspace',
    flattenedIds: overrides.flattenedIds ?? flattenedIds,
    elementDataMap: overrides.elementDataMap ?? elementDataMap
  })

describe('hierarchy admission work and invalidation', () => {
  afterEach(() => vi.restoreAllMocks())

  const counted = () => {
    const ids = Array.from({ length: 10000 }, (_, index) => `rect-${index}`)
    const source = Object.fromEntries(
      ids.map((id) => [id, element(id, 'workspace')])
    )
    let reads = 0
    const map = new Proxy(source, {
      get(target, key, receiver) {
        reads++

        return Reflect.get(target, key, receiver)
      }
    })

    return {
      ids,
      source,
      map,

      reads: () => reads
    }
  }

  const snapshot = {
    keyMeta: false,
    keyCtrl: false,
    mousePosition: { x: 10, y: 20 }
  }

  it('admits unchanged normal pointer and create inputs once rather than rescanning every query', () => {
    const input = counted()
    const cleanup = vi.spyOn(core, 'registerRuntimeCleanup')

    vi.spyOn(hierarchyApis, 'getFlattenedElementIds').mockReturnValue(input.ids)
    vi.spyOn(hierarchyApis, 'getElementDataMap').mockReturnValue(input.map)
    vi.spyOn(hierarchyApis, 'getWorkspaceId').mockReturnValue('workspace')
    vi.spyOn(selectionApis, 'getSelectedIds').mockReturnValue([])
    vi.spyOn(elementApis, 'getRenderElementIdAtClientPos').mockReturnValue(
      'rect-0'
    )
    expect(resolveCurrentCanvasHierarchyTarget('rect-0', snapshot)).toBe(
      'rect-0'
    )
    const admittedReads = input.reads()

    expect(admittedReads).toBeGreaterThanOrEqual(input.ids.length)
    expect(resolveCurrentCanvasHierarchyTarget('rect-1', snapshot)).toBe(
      'rect-1'
    )
    expect(resolveCreateElementParentAtClientPos(snapshot)).toBe('workspace')
    expect(input.reads() - admittedReads).toBeLessThan(10)
    const registration = cleanup.mock.calls.find(
      ([key]) => key === 'canvas-hierarchy-target'
    )
    const unsubscribe = cleanup.mock.results[0]?.value

    expect(registration).toBeDefined()
    if (!registration || typeof unsubscribe !== 'function') {
      throw new Error('Missing lifetime-owned hierarchy admission cleanup')
    }

    unsubscribe()
    registration[1]()
    const releasedReads = input.reads()

    expect(resolveCurrentCanvasHierarchyTarget('rect-0', snapshot)).toBe(
      'rect-0'
    )
    expect(input.reads() - releasedReads).toBeGreaterThanOrEqual(
      input.ids.length
    )
  })

  it('validates explicit create input only once and never caches mutable caller input', () => {
    const input = counted()
    const request = {
      hitElementId: 'rect-0',
      selectedElementIds: [],
      bypassParentScope: false,
      workspaceId: 'workspace',
      flattenedIds: input.ids,
      elementDataMap: input.map
    }

    expect(resolveCreateElementParent(request)).toBe('workspace')
    expect(input.reads()).toBeLessThan(21000)
    input.source['rect-1'].parentId = 'rect-1'
    expect(resolveCreateElementParent(request)).toBeNull()
    expect(resolveCanvasHierarchyTarget(request)).toBeNull()
  })

  it('rejects replaced malformed projections and recovers only after a valid replacement', () => {
    const input = counted()

    vi.spyOn(hierarchyApis, 'getFlattenedElementIds').mockReturnValue(input.ids)
    const map = vi
      .spyOn(hierarchyApis, 'getElementDataMap')
      .mockReturnValue(input.map)

    vi.spyOn(hierarchyApis, 'getWorkspaceId').mockReturnValue('workspace')
    vi.spyOn(selectionApis, 'getSelectedIds').mockReturnValue([])
    expect(resolveCurrentCanvasHierarchyTarget('rect-0', snapshot)).toBe(
      'rect-0'
    )
    map.mockReturnValue({
      ...input.source,
      'rect-1': element('rect-1', 'rect-1')
    })
    expect(resolveCurrentCanvasHierarchyTarget('rect-0', snapshot)).toBeNull()
    map.mockReturnValue({ ...input.source })
    expect(resolveCurrentCanvasHierarchyTarget('rect-0', snapshot)).toBe(
      'rect-0'
    )
  })

  it('invalidates order and workspace independently while resolving live selection and modifiers', () => {
    const order = vi
      .spyOn(hierarchyApis, 'getFlattenedElementIds')
      .mockReturnValue(flattenedIds)
    const workspace = vi
      .spyOn(hierarchyApis, 'getWorkspaceId')
      .mockReturnValue('workspace')
    const selection = vi
      .spyOn(selectionApis, 'getSelectedIds')
      .mockReturnValue([])

    vi.spyOn(hierarchyApis, 'getElementDataMap').mockReturnValue(elementDataMap)
    expect(resolveCurrentCanvasHierarchyTarget('nested-leaf', snapshot)).toBe(
      'group-1'
    )
    selection.mockReturnValue(['rect-2a'])
    expect(resolveCurrentCanvasHierarchyTarget('nested-leaf', snapshot)).toBe(
      'nested'
    )
    expect(
      resolveCurrentCanvasHierarchyTarget('nested-leaf', {
        ...snapshot,
        keyMeta: true
      })
    ).toBe('nested-leaf')
    order.mockReturnValue([...flattenedIds].reverse())
    expect(
      resolveCurrentCanvasHierarchyTarget('nested-leaf', snapshot)
    ).toBeNull()
    order.mockReturnValue(flattenedIds)
    expect(resolveCurrentCanvasHierarchyTarget('nested-leaf', snapshot)).toBe(
      'nested'
    )
    workspace.mockReturnValue('different-workspace')
    expect(
      resolveCurrentCanvasHierarchyTarget('nested-leaf', snapshot)
    ).toBeNull()
    workspace.mockReturnValue('workspace')
    expect(resolveCurrentCanvasHierarchyTarget('nested-leaf', snapshot)).toBe(
      'nested'
    )
  })
})

describe('canvas hierarchy target resolution', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves a nested raw hit to the workspace direct child without selection', () => {
    expect(resolve('nested-leaf')).toBe('group-1')
    expect(resolve('outside')).toBe('outside')
  })

  it('resolves only within the exact selected parent scope', () => {
    expect(resolve('rect-2b', ['rect-2a'])).toBe('rect-2b')
    expect(resolve('nested-leaf', ['rect-2a'])).toBe('nested')
    expect(resolve('rect-3a', ['rect-2a'])).toBeNull()
  })

  it('rejects ancestors for both hover and ordinary selection after entering a child', () => {
    expect(resolve('group-1', ['group-2'])).toBeNull()
    expect(resolve('group-2', ['rect-2a'])).toBeNull()
    expect(resolve('group-1', ['rect-2a'])).toBeNull()
    expect(resolve('rect-2b', ['rect-2a'])).toBe('rect-2b')
    expect(resolve('rect-3a', ['group-2'])).toBe('group-3')
    expect(resolve('rect-2a', [])).toBe('group-1')
  })

  it('uses every selected parent scope and picks the nearest matching ancestor', () => {
    const selection = ['rect-2a', 'rect-3a']

    expect(resolve('nested-leaf', selection)).toBe('nested')
    expect(resolve('rect-3b', selection)).toBe('rect-3b')
  })

  it('bypasses parent scopes only for an existing non-Group raw hit', () => {
    expect(resolve('nested-leaf', ['rect-2a'], true)).toBe('nested-leaf')
    expect(resolve('group-2', ['rect-2a'], true)).toBeNull()
    expect(resolve('missing', ['rect-2a'], true)).toBeNull()
  })

  it('rejects duplicate or missing selected identities', () => {
    expect(resolve('rect-2b', ['rect-2a', 'rect-2a'])).toBeNull()
    expect(resolve('rect-2b', ['missing'])).toBeNull()
  })

  it('fails closed for a missing raw hit', () => {
    expect(resolve(null)).toBeNull()
    expect(resolve('missing')).toBeNull()
  })

  it('fails closed for duplicate, stale, cyclic, and invalid-root projections', () => {
    expect(
      resolve('nested-leaf', [], false, {
        flattenedIds: [...flattenedIds, 'nested-leaf']
      })
    ).toBeNull()

    expect(
      resolve('nested-leaf', [], false, {
        elementDataMap: {
          ...elementDataMap,
          stale: element('stale', 'workspace')
        }
      })
    ).toBeNull()

    expect(
      resolve('nested-leaf', [], false, {
        elementDataMap: {
          ...elementDataMap,
          'group-1': element('group-1', 'nested-leaf', EntityTypes.GROUP)
        }
      })
    ).toBeNull()

    expect(
      resolve('nested-leaf', [], false, {
        elementDataMap: {
          ...elementDataMap,
          outside: element('outside', 'other-workspace')
        }
      })
    ).toBeNull()
  })

  it('reads the current canonical projection and selection through app common APIs', () => {
    vi.spyOn(hierarchyApis, 'getFlattenedElementIds').mockReturnValue(
      flattenedIds
    )
    vi.spyOn(hierarchyApis, 'getElementDataMap').mockReturnValue(elementDataMap)
    vi.spyOn(selectionApis, 'getSelectedIds').mockReturnValue(['rect-2a'])

    expect(
      resolveCurrentCanvasHierarchyTarget('rect-2b', {
        keyMeta: false,
        keyCtrl: false
      } as never)
    ).toBe('rect-2b')
    expect(hierarchyApis.getFlattenedElementIds).toHaveBeenCalledOnce()
    expect(hierarchyApis.getElementDataMap).toHaveBeenCalledOnce()
    expect(selectionApis.getSelectedIds).toHaveBeenCalledOnce()
  })

  it('maps Ctrl to the same parent-scope bypass as Meta', () => {
    vi.spyOn(hierarchyApis, 'getFlattenedElementIds').mockReturnValue(
      flattenedIds
    )
    vi.spyOn(hierarchyApis, 'getElementDataMap').mockReturnValue(elementDataMap)
    vi.spyOn(selectionApis, 'getSelectedIds').mockReturnValue(['rect-2a'])

    expect(
      resolveCurrentCanvasHierarchyTarget('rect-3a', {
        keyMeta: false,
        keyCtrl: true
      } as never)
    ).toBe('rect-3a')
  })

  it('uses only the Render hit query for client-position resolution', () => {
    vi.spyOn(hierarchyApis, 'getFlattenedElementIds').mockReturnValue(
      flattenedIds
    )
    vi.spyOn(hierarchyApis, 'getElementDataMap').mockReturnValue(elementDataMap)
    vi.spyOn(selectionApis, 'getSelectedIds').mockReturnValue([])
    vi.spyOn(elementApis, 'getRenderElementIdAtClientPos').mockReturnValue(
      'nested-leaf'
    )
    vi.spyOn(elementApis, 'getElementIdAtClientPos')

    expect(
      resolveCanvasHierarchyTargetAtClientPos({
        mousePosition: { x: 10, y: 20 },
        keyMeta: false,
        keyCtrl: false
      } as never)
    ).toBe('group-1')
    expect(elementApis.getRenderElementIdAtClientPos).toHaveBeenCalledWith({
      x: 10,
      y: 20
    })
    expect(elementApis.getElementIdAtClientPos).not.toHaveBeenCalled()
  })

  it('derives one explicit Group or workspace create parent from the same target rules', () => {
    expect(resolveCreateParent('nested-leaf')).toBe('group-1')
    expect(resolveCreateParent('rect-2b', ['rect-2a'])).toBe('group-2')
    expect(resolveCreateParent('nested-leaf', ['rect-2a'])).toBe('nested')
    expect(resolveCreateParent('nested-leaf', ['rect-2a'], true)).toBe('nested')
    expect(resolveCreateParent('outside')).toBe('workspace')
    expect(resolveCreateParent(null, ['rect-2a'])).toBe('workspace')
    expect(
      resolveCreateParent(null, [], false, {
        flattenedIds: [],
        elementDataMap: {}
      })
    ).toBe('workspace')
  })

  it('does not produce a create parent from a rejected or malformed hierarchy target', () => {
    expect(resolveCreateParent('rect-3a', ['rect-2a'])).toBeNull()
    expect(resolveCreateParent('group-2', ['rect-2a'], true)).toBeNull()
    expect(
      resolveCreateParent('nested-leaf', [], false, {
        elementDataMap: {
          ...elementDataMap,
          'group-1': element('group-1', 'nested-leaf', EntityTypes.GROUP)
        }
      })
    ).toBeNull()
  })
})

describe('container double-click hierarchy target', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reads one hit and one canonical projection per gesture without a second selection lookup', () => {
    vi.spyOn(elementApis, 'getRenderElementIdAtClientPos').mockReturnValue(
      'nested-leaf'
    )
    vi.spyOn(hierarchyApis, 'getFlattenedElementIds').mockReturnValue(
      flattenedIds
    )
    vi.spyOn(hierarchyApis, 'getElementDataMap').mockReturnValue(elementDataMap)
    vi.spyOn(selectionApis, 'getSelectedIds')
    expect(resolveContainerChildAtClientPos('group-1', { x: 10, y: 20 })).toBe(
      'group-2'
    )
    expect(
      elementApis.getRenderElementIdAtClientPos
    ).toHaveBeenCalledExactlyOnceWith({ x: 10, y: 20 })
    expect(hierarchyApis.getFlattenedElementIds).toHaveBeenCalledOnce()
    expect(hierarchyApis.getElementDataMap).toHaveBeenCalledOnce()
    expect(selectionApis.getSelectedIds).not.toHaveBeenCalled()
  })

  const childTarget = (
    hitElementId: string | null,
    containerId = 'group-1',
    map = elementDataMap
  ) =>
    resolveContainerChildTarget({
      hitElementId,
      containerId,
      flattenedIds,
      elementDataMap: map
    })

  it('enters only one level along the actual hit chain', () => {
    expect(childTarget('nested-leaf')).toBe('group-2')
    expect(childTarget('nested-leaf', 'group-2')).toBe('nested')
    expect(childTarget('nested-leaf', 'nested')).toBe('nested-leaf')
    expect(childTarget('rect-3b')).toBe('group-3')
  })

  it.each([null, 'missing', 'outside', 'group-1'])(
    'rejects a non-descendant hit %s',
    (hit) => {
      expect(childTarget(hit)).toBeNull()
    }
  )

  it.each(['group-1', 'group-2', 'nested', 'nested-leaf'])(
    'rejects locked or hidden ancestry at %s',
    (id) => {
      expect(
        childTarget('nested-leaf', 'group-1', {
          ...elementDataMap,
          [id]: { ...elementDataMap[id], lock: true }
        })
      ).toBeNull()
      expect(
        childTarget('nested-leaf', 'group-1', {
          ...elementDataMap,
          [id]: { ...elementDataMap[id], visible: false }
        })
      ).toBeNull()
    }
  )

  it('rejects invalid projections rather than falling back to the raw leaf', () => {
    expect(childTarget('nested-leaf', 'missing')).toBeNull()
    expect(
      childTarget('nested-leaf', 'group-1', {
        ...elementDataMap,
        nested: { ...elementDataMap.nested, parentId: 'nested-leaf' }
      })
    ).toBeNull()
    expect(
      resolveContainerChildTarget({
        hitElementId: 'nested-leaf',
        containerId: 'group-1',
        flattenedIds: [],
        elementDataMap
      })
    ).toBeNull()
  })

  it('does not depend on container type names', () => {
    const map = {
      ...elementDataMap,
      'group-1': { ...elementDataMap['group-1'], type: 'custom-group' }
    }

    expect(childTarget('nested-leaf', 'group-1', map)).toBe('group-2')
  })
})
