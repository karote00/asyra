import { describe, expect, it, vi } from 'vitest'
vi.mock('../../contexts', () => ({ default: {} }))
vi.mock('../hierarchy', () => ({ hierarchyApis: {} }))
import { createDesignOrganizer } from '../design-organization'

const fixture = () => {
  const records: Record<
    string,
    { type: string; parentId?: string; children?: string[]; lock?: boolean }
  > = {
    w: { type: 'workspace', children: ['frame'] },
    frame: { type: 'frame', parentId: 'w', children: ['a', 'b', 'c'] },
    a: { type: 'rect', parentId: 'frame' },
    b: { type: 'text', parentId: 'frame' },
    c: { type: 'oval', parentId: 'frame' }
  }
  const apis = {
    read: vi.fn((id: string) => records[id]),
    group: vi.fn((ids: readonly string[]) => ({
      groupId: 'g',
      elementIds: ids
    })),
    ungroup: vi.fn(() => ({
      groupId: 'g',
      elementIds: ['a', 'b'],
      removed: true
    })),
    move: vi.fn((request: { elementIds: readonly string[] }) => ({
      elementIds: request.elementIds,
      moves: [{}]
    })),
    rename: vi.fn()
  }
  return { organize: createDesignOrganizer(apis), apis, records }
}
describe('canonical design organization', () => {
  it('groups in canonical order and reads each shared ancestor only once', () => {
    const { organize, apis } = fixture()
    expect(
      organize({ operation: 'group', elementIds: ['b', 'a'], name: 'Heading' })
    ).toMatchObject({
      status: 'complete',
      groupId: 'g',
      elementIds: ['a', 'b']
    })
    expect(apis.group).toHaveBeenCalledExactlyOnceWith(['a', 'b'])
    expect(apis.rename).toHaveBeenCalledExactlyOnceWith('g', 'Heading')
    expect(apis.read).toHaveBeenCalledTimes(4)
    expect(new Set(apis.read.mock.calls.map(([id]) => id)).size).toBe(4)
  })
  it('reorders using the remaining-sibling insertion index without geometry writes', () => {
    const { organize, apis } = fixture()
    organize({ operation: 'reorder', elementIds: ['a'], index: 2 })
    expect(apis.move).toHaveBeenCalledExactlyOnceWith({
      elementIds: ['a'],
      targetParentId: 'frame',
      targetIndex: 2
    })
    expect(apis.group).not.toHaveBeenCalled()
    expect(apis.rename).not.toHaveBeenCalled()
  })
  it('ungroups only an official Group and checks child locks before the owner runs', () => {
    const { organize, records, apis } = fixture()
    records.g = { type: 'group', parentId: 'frame', children: ['a', 'b'] }
    records.frame.children = ['g', 'c']
    records.a.parentId = records.b.parentId = 'g'
    records.b.lock = true
    expect(() => organize({ operation: 'ungroup', elementIds: ['g'] })).toThrow(
      'locked'
    )
    expect(apis.ungroup).not.toHaveBeenCalled()
    records.b.lock = false
    expect(organize({ operation: 'ungroup', elementIds: ['g'] })).toMatchObject(
      { elementIds: ['a', 'b'], removed: true }
    )
    expect(apis.ungroup).toHaveBeenCalledExactlyOnceWith('g')
  })
  it.each([
    { operation: 'remove', elementIds: ['a'] },
    { operation: 'group', elementIds: ['a', 'a'] },
    { operation: 'group', elementIds: [] },
    {
      operation: 'group',
      elementIds: Array.from({ length: 201 }, (_, i) => `a${i}`)
    },
    { operation: 'group', elementIds: ['a'], name: '' },
    { operation: 'group', elementIds: ['a'], index: 0 },
    { operation: 'reorder', elementIds: ['a'], index: 3 },
    { operation: 'reorder', elementIds: ['a'], index: 0.5 },
    { operation: 'reorder', elementIds: ['a'] },
    { operation: 'ungroup', elementIds: ['a'] },
    { operation: 'group', elementIds: ['missing'] },
    { operation: 'group', elementIds: ['a'], extra: true }
  ])('rejects invalid operation without writes: %j', (request) => {
    const { organize, apis } = fixture()
    expect(() => organize(request as never)).toThrow()
    for (const fn of [apis.group, apis.ungroup, apis.move, apis.rename])
      expect(fn).not.toHaveBeenCalled()
  })
  it('rechecks locks on later calls and rejects inconsistent parent membership', () => {
    const { organize, records, apis } = fixture()
    organize({ operation: 'group', elementIds: ['a'] })
    apis.group.mockClear()
    records.frame.lock = true
    expect(() => organize({ operation: 'group', elementIds: ['a'] })).toThrow(
      'locked'
    )
    records.frame.lock = false
    records.frame.children = ['b', 'c']
    expect(() => organize({ operation: 'group', elementIds: ['a'] })).toThrow(
      'membership'
    )
    expect(apis.group).not.toHaveBeenCalled()
  })
})
