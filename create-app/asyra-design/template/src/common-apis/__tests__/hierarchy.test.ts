import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const core = {
    getUIProperty: vi.fn(),
    removeSubtree: vi.fn(),
    sceneTreeSaveData: vi.fn(),
    getCurrentWorkspaceId: vi.fn(),
    getElementMetadata: vi.fn(),
    getElementChildren: vi.fn()
  }

  return {
    core,
    groupElements: vi.fn(),
    moveElementsWithGroupGeometry: vi.fn(),
    runTransaction: vi.fn((operation: () => unknown) => operation()),
    ungroupElement: vi.fn()
  }
})

vi.mock('../../contexts', () => ({
  default: mocks.core
}))

vi.mock('@asyra/core', () => ({
  runTransaction: mocks.runTransaction
}))

vi.mock('@asyra/preset', () => ({
  groupElements: mocks.groupElements,
  moveElementsWithGroupGeometry: mocks.moveElementsWithGroupGeometry,
  ungroupElement: mocks.ungroupElement
}))

import { hierarchyApis } from '../hierarchy'

describe('app hierarchy common APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('routes grouping and ungrouping through the official Preset adapters', () => {
    const options = { undoable: true }
    const grouped = {
      groupId: 'group-1',
      elementIds: ['first', 'last'],
      bounds: { x: 10, y: 20, width: 90, height: 60 }
    }
    const ungrouped = {
      groupId: 'group-1',
      elementIds: ['first', 'last'],
      removed: true
    }
    mocks.groupElements.mockReturnValue(grouped)
    mocks.ungroupElement.mockReturnValue(ungrouped)

    expect(hierarchyApis.groupElements(['last', 'first'], options)).toBe(
      grouped
    )
    expect(hierarchyApis.ungroupElement('group-1', options)).toBe(ungrouped)
    expect(mocks.groupElements).toHaveBeenCalledWith(
      mocks.core,
      ['last', 'first'],
      options
    )
    expect(mocks.ungroupElement).toHaveBeenCalledWith(
      mocks.core,
      'group-1',
      options
    )
  })

  it('reads the canonical hierarchy UI projection for app command eligibility', () => {
    const flattenedIds = ['group-1', 'child-1']
    const elementDataMap = {
      'group-1': {
        id: 'group-1',
        type: 'group',
        parentId: 'workspace'
      },
      'child-1': {
        id: 'child-1',
        type: 'element',
        parentId: 'group-1'
      }
    }
    mocks.core.getUIProperty.mockImplementation((key: string) =>
      key === 'flattenedElementIds' ? flattenedIds : elementDataMap
    )

    expect(hierarchyApis.getFlattenedElementIds()).toBe(flattenedIds)
    expect(hierarchyApis.getElementDataMap()).toBe(elementDataMap)
    expect(mocks.core.getUIProperty).toHaveBeenNthCalledWith(
      1,
      'flattenedElementIds'
    )
    expect(mocks.core.getUIProperty).toHaveBeenNthCalledWith(
      2,
      'elementDataMap'
    )
  })

  it('reads the canonical current workspace id from the Core facade', () => {
    mocks.core.getCurrentWorkspaceId.mockReturnValue('workspace')
    expect(hierarchyApis.getWorkspaceId()).toBe('workspace')
    expect(mocks.core.sceneTreeSaveData).not.toHaveBeenCalled()
    mocks.core.getCurrentWorkspaceId.mockReturnValue('')
    expect(hierarchyApis.getWorkspaceId()).toBeNull()
  })

  it.each(['before', 'after'] as const)(
    'resolves %s an anchor after excluding moved siblings',
    (placement) => {
      mocks.core.getElementMetadata.mockImplementation((id) =>
        id === 'anchor' ? { parentId: 'parent' } : { childCount: 4 }
      )
      mocks.core.getElementChildren.mockReturnValue({
        available: true,
        elementIds: ['moving', 'first', 'anchor', 'last'],
        total: 4
      })
      hierarchyApis.moveElementsRelative(
        { elementIds: ['moving'], anchorId: 'anchor', placement },
        { undoable: true }
      )
      expect(
        mocks.moveElementsWithGroupGeometry
      ).toHaveBeenCalledExactlyOnceWith(
        mocks.core,
        {
          elementIds: ['moving'],
          targetParentId: 'parent',
          targetIndex: placement === 'before' ? 1 : 2
        },
        { undoable: true }
      )
      expect(mocks.core.sceneTreeSaveData).not.toHaveBeenCalled()
    }
  )

  it('rejects missing or moving anchors before applying hierarchy mutations', () => {
    mocks.core.getElementMetadata.mockReturnValue(undefined)
    expect(() =>
      hierarchyApis.moveElementsRelative({
        elementIds: ['a'],
        anchorId: 'missing',
        placement: 'before'
      })
    ).toThrow()
    expect(() =>
      hierarchyApis.moveElementsRelative({
        elementIds: ['a'],
        anchorId: 'a',
        placement: 'after'
      })
    ).toThrow()
    expect(mocks.moveElementsWithGroupGeometry).not.toHaveBeenCalled()
  })

  it('routes reorder and reparent through Preset Group geometry normalization', () => {
    const request = {
      elementIds: ['first'],
      targetParentId: 'group-2',
      targetIndex: 1
    }
    const result = {
      elementIds: ['first'],
      moves: [
        {
          elementId: 'first',
          before: { parentId: 'group-1', index: 0 },
          after: { parentId: 'group-2', index: 1 }
        }
      ]
    }
    const options = { undoable: true }
    mocks.moveElementsWithGroupGeometry.mockReturnValue(result)

    expect(hierarchyApis.moveElements(request, options)).toBe(result)
    expect(mocks.moveElementsWithGroupGeometry).toHaveBeenCalledWith(
      mocks.core,
      request,
      options
    )
  })

  it('returns canonical no-op and rejection without app reinterpretation or retry', () => {
    const noOpRequest = {
      elementIds: ['second', 'first'],
      targetParentId: 'workspace',
      targetIndex: 0
    }
    const noOpResult = {
      elementIds: ['first', 'second'],
      moves: []
    }
    mocks.moveElementsWithGroupGeometry.mockReturnValueOnce(noOpResult)

    expect(hierarchyApis.moveElements(noOpRequest)).toBe(noOpResult)
    expect(mocks.moveElementsWithGroupGeometry).toHaveBeenNthCalledWith(
      1,
      mocks.core,
      noOpRequest,
      undefined
    )

    const rejectedRequest = {
      elementIds: ['group-1'],
      targetParentId: 'group-1',
      targetIndex: 0
    }
    const rejection = new Error('canonical self-parent rejection')
    mocks.moveElementsWithGroupGeometry.mockImplementationOnce(() => {
      throw rejection
    })

    expect(() => hierarchyApis.moveElements(rejectedRequest)).toThrow(rejection)
    expect(mocks.moveElementsWithGroupGeometry).toHaveBeenCalledTimes(2)
    expect(mocks.moveElementsWithGroupGeometry).toHaveBeenNthCalledWith(
      2,
      mocks.core,
      rejectedRequest,
      undefined
    )
  })

  it('settles subtree removal inside one app transaction', () => {
    const result = {
      rootId: 'group-1',
      parentId: 'workspace',
      index: 0,
      elements: {}
    }
    const options = { undoable: true }
    mocks.core.removeSubtree.mockReturnValue(result)

    expect(hierarchyApis.removeSubtree('group-1', options)).toBe(result)
    expect(mocks.runTransaction).toHaveBeenCalledTimes(1)
    expect(mocks.core.removeSubtree).toHaveBeenCalledWith('group-1', options)
  })
})
