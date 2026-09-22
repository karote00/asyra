import { describe, expect, it, vi } from 'vitest'
vi.mock('../../contexts', () => ({ default: {} }))
vi.mock('../element', () => ({ elementApis: {} }))
vi.mock('../fills', () => ({ fillApis: {} }))
vi.mock('../strokes', () => ({ strokeApis: {} }))
import { createDesignElementEditor } from '../design-edit'

const fixture = () => {
  const records: Record<
    string,
    { type: string; parentId?: string; lock?: boolean; name?: string }
  > = {
    w: { type: 'workspace' },
    group: { type: 'group', parentId: 'w' },
    title: { type: 'text', parentId: 'group', name: 'Title' }
  }
  const computed = {
    x: 1,
    y: 2,
    width: 100,
    height: 30,
    rotation: 0,
    text: 'Before',
    fontSize: 16,
    textColor: '#000000',
    fills: [{ color: '#000000' }],
    strokes: []
  }
  const apis = {
    getData: vi.fn((id: string) => records[id]),
    getComputed: vi.fn(() => computed),
    properties: vi.fn(),
    rename: vi.fn(),
    fill: vi.fn(() => true),
    stroke: vi.fn(() => true)
  }
  return { edit: createDesignElementEditor(apis), apis, records, computed }
}
describe('targeted canonical design edits', () => {
  it('updates literal native text and geometry only on the requested object', () => {
    const { edit, apis } = fixture()
    expect(
      edit({
        elementId: 'title',
        properties: { text: '你好 World', x: 20, fontSize: 24 }
      })
    ).toMatchObject({
      status: 'complete',
      compositionId: 'title',
      appliedElementIds: ['title']
    })
    expect(apis.properties).toHaveBeenCalledExactlyOnceWith('title', {
      text: '你好 World',
      x: 20,
      fontSize: 24
    })
    expect(apis.rename).not.toHaveBeenCalled()
  })
  it('omits unchanged values and routes name and primary fill to canonical owners', () => {
    const { edit, apis } = fixture()
    edit({
      elementId: 'title',
      name: 'Heading',
      properties: { x: 1 },
      fillColor: '#ffffff'
    })
    expect(apis.properties).not.toHaveBeenCalled()
    expect(apis.rename).toHaveBeenCalledWith('title', 'Heading')
    expect(apis.fill).toHaveBeenCalledWith('title', '#ffffff')
  })
  it.each([
    { properties: { text: 9 } },
    { properties: { fontSize: -1 } },
    { properties: { width: 0 } },
    { properties: { rotation: NaN } },
    { properties: { points: {} } },
    { properties: { lineHeight: 32 } },
    { strokeColor: '#ffffff' },
    { fillColor: 'red' },
    { name: '' },
    { properties: {} },
    { unexpected: true }
  ])('rejects the complete invalid request before writing: %j', (patch) => {
    const { edit, apis } = fixture()
    expect(() => edit({ elementId: 'title', ...patch } as never)).toThrow()
    for (const fn of [apis.properties, apis.rename, apis.fill, apis.stroke])
      expect(fn).not.toHaveBeenCalled()
  })
  it('checks inherited locks and missing ancestors', () => {
    const { edit, records, apis } = fixture()
    records.group.lock = true
    expect(() => edit({ elementId: 'title', name: 'Changed' })).toThrow(
      'locked'
    )
    delete records.group
    expect(() => edit({ elementId: 'title', name: 'Changed' })).toThrow(
      'unavailable'
    )
    expect(apis.rename).not.toHaveBeenCalled()
  })
  it('does not claim an unsupported typography field on a shape', () => {
    const { edit, records, apis } = fixture()
    records.title.type = 'rect'
    expect(() =>
      edit({ elementId: 'title', properties: { text: 'No' } })
    ).toThrow()
    expect(apis.properties).not.toHaveBeenCalled()
  })
  it('preserves completed canonical writes when a later owner fails', () => {
    const { edit, apis } = fixture()
    apis.fill.mockImplementation(() => {
      throw new Error('style failed')
    })
    expect(() =>
      edit({ elementId: 'title', name: 'Heading', fillColor: '#ffffff' })
    ).toThrow('style failed')
    expect(apis.rename).toHaveBeenCalledExactlyOnceWith('title', 'Heading')
  })
})
