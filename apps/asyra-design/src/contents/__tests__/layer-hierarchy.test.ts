import { describe, expect, it, vi } from 'vitest'
import { EntityTypes, type ElementRawData } from '@asyra/utils'
import {
  projectExpandedLayerRow,
  projectVisibleLayerRows
} from '../layer-hierarchy'

vi.mock('../../common-apis/element', () => ({
  elementApis: {
    isContainerType: (type: string) =>
      ['group', 'frame', 'workspace', 'custom-container'].includes(type)
  }
}))

const element = (
  id: string,
  parentId: string,
  type: string = EntityTypes.ELEMENT
): Partial<ElementRawData> => ({
  id,
  name: id,
  parentId,
  type,
  lock: false,
  visible: true
})

const elementDataMap = {
  root: element('root', 'workspace', EntityTypes.GROUP),
  child: element('child', 'root'),
  nested: element('nested', 'root', EntityTypes.GROUP),
  leaf: element('leaf', 'nested'),
  sibling: element('sibling', 'workspace')
}
const flattenedIds = ['root', 'child', 'nested', 'leaf', 'sibling']

describe('canonical Layers hierarchy projection', () => {
  it('uses registered container capability for custom types in both projection paths', () => {
    const data = {
      root: element('root', 'workspace', 'custom-container'),
      leaf: element('leaf', 'root', 'custom-leaf')
    }
    expect(projectExpandedLayerRow('root', data)).toMatchObject({
      canExpand: true
    })
    expect(projectExpandedLayerRow('leaf', data)).toMatchObject({
      canExpand: false
    })
    expect(
      projectVisibleLayerRows(['root', 'leaf'], data, new Set()).rows
    ).toEqual([
      { id: 'root', depth: 0, canExpand: true, isExpanded: true },
      { id: 'leaf', depth: 1, canExpand: false, isExpanded: false }
    ])
    expect(
      projectVisibleLayerRows(['root', 'leaf'], data, new Set(['root'])).rows
    ).toEqual([{ id: 'root', depth: 0, canExpand: true, isExpanded: false }])
  })

  it('preserves parent-before-descendant order and derives exact depth', () => {
    expect(
      projectVisibleLayerRows(flattenedIds, elementDataMap, new Set())
    ).toEqual({
      rows: [
        { id: 'root', depth: 0, canExpand: true, isExpanded: true },
        { id: 'child', depth: 1, canExpand: false, isExpanded: false },
        { id: 'nested', depth: 1, canExpand: true, isExpanded: true },
        { id: 'leaf', depth: 2, canExpand: false, isExpanded: false },
        { id: 'sibling', depth: 0, canExpand: false, isExpanded: false }
      ],
      error: null
    })
  })

  it('hides descendants of collapsed Groups without changing canonical order', () => {
    expect(
      projectVisibleLayerRows(flattenedIds, elementDataMap, new Set(['nested']))
    ).toEqual({
      rows: [
        { id: 'root', depth: 0, canExpand: true, isExpanded: true },
        { id: 'child', depth: 1, canExpand: false, isExpanded: false },
        { id: 'nested', depth: 1, canExpand: true, isExpanded: false },
        { id: 'sibling', depth: 0, canExpand: false, isExpanded: false }
      ],
      error: null
    })

    expect(
      projectVisibleLayerRows(
        flattenedIds,
        elementDataMap,
        new Set(['root'])
      ).rows.map((row) => row.id)
    ).toEqual(['root', 'sibling'])
  })

  it('projects restored normal and empty Groups from canonical stable identities', () => {
    const restoredMap = {
      restored: element('restored', 'workspace', EntityTypes.GROUP),
      child: element('child', 'restored'),
      empty: element('empty', 'workspace', EntityTypes.GROUP)
    }

    expect(
      projectVisibleLayerRows(
        ['restored', 'child', 'empty'],
        restoredMap,
        new Set()
      )
    ).toEqual({
      rows: [
        { id: 'restored', depth: 0, canExpand: true, isExpanded: true },
        { id: 'child', depth: 1, canExpand: false, isExpanded: false },
        { id: 'empty', depth: 0, canExpand: true, isExpanded: true }
      ],
      error: null
    })
  })

  it('derives a wide valid hierarchy without rereading each ancestor per child', () => {
    let rootParentReadCount = 0
    const root = element('root', 'workspace', EntityTypes.GROUP)
    Object.defineProperty(root, 'parentId', {
      enumerable: true,
      get: () => {
        rootParentReadCount += 1
        return 'workspace'
      }
    })
    const children = Array.from({ length: 64 }, (_, index) =>
      element(`child-${index}`, 'root')
    )
    const wideElementDataMap: Record<string, Partial<ElementRawData>> = {
      root,
      ...Object.fromEntries(children.map((child) => [child.id, child]))
    }
    const wideFlattenedIds = [
      'root',
      ...children.map((child) => child.id as string)
    ]

    expect(
      projectVisibleLayerRows(wideFlattenedIds, wideElementDataMap, new Set())
    ).toMatchObject({
      rows: expect.arrayContaining([
        { id: 'root', depth: 0, canExpand: true, isExpanded: true },
        { id: 'child-63', depth: 1, canExpand: false, isExpanded: false }
      ]),
      error: null
    })
    expect(rootParentReadCount).toBe(1)
  })

  it('rejects duplicate, missing, misordered, and cyclic projections', () => {
    expect(
      projectVisibleLayerRows(['root', 'root'], elementDataMap, new Set())
    ).toMatchObject({ rows: [], error: expect.stringMatching(/duplicate/i) })
    expect(
      projectVisibleLayerRows(['root', 'missing'], elementDataMap, new Set())
    ).toMatchObject({ rows: [], error: expect.stringMatching(/missing/i) })
    expect(
      projectVisibleLayerRows(['child', 'root'], elementDataMap, new Set())
    ).toMatchObject({ rows: [], error: expect.stringMatching(/before/i) })

    const cyclicMap = {
      root: element('root', 'child', EntityTypes.GROUP),
      child: element('child', 'root', EntityTypes.GROUP)
    }
    expect(
      projectVisibleLayerRows(['root', 'child'], cyclicMap, new Set())
    ).toMatchObject({ rows: [], error: expect.stringMatching(/cycle/i) })
  })
})

it('exposes nested frame disclosure in both expanded and collapsed projections', () => {
  const data = {
    ...elementDataMap,
    nested: element('nested', 'root', EntityTypes.FRAME)
  }
  expect(projectExpandedLayerRow('nested', data)).toMatchObject({
    canExpand: true,
    isExpanded: true
  })
  expect(
    projectVisibleLayerRows(flattenedIds, data, new Set()).rows.find(
      (row) => row.id === 'nested'
    )
  ).toMatchObject({ canExpand: true, isExpanded: true })
  const collapsed = projectVisibleLayerRows(
    flattenedIds,
    data,
    new Set(['nested'])
  )
  expect(collapsed.rows.map((row) => row.id)).toEqual([
    'root',
    'child',
    'nested',
    'sibling'
  ])
  expect(collapsed.rows.find((row) => row.id === 'nested')?.isExpanded).toBe(
    false
  )
  expect(
    projectVisibleLayerRows(flattenedIds, data, new Set()).rows.map(
      (row) => row.id
    )
  ).toEqual(flattenedIds)
})
