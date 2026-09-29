import { describe, expect, it, vi } from 'vitest'
vi.mock('../../contexts', () => ({ default: {} }))
import { createDesignContextReader } from '../design-context'

const fixture = () => {
  const records: Record<string, Record<string, unknown>> = {
    workspace: {
      id: 'workspace',
      type: 'workspace',
      children: ['a', 'gone', 'b']
    },
    a: { id: 'a', type: 'text', name: 'Heading', parentId: 'workspace' },
    b: { id: 'b', type: 'vector', parentId: 'workspace', children: [] }
  }
  const computed: Record<string, unknown> = {
    x: 10,
    text: 'Hello',
    fills: [{ color: '#ffffff' }]
  }
  const source = {
    getCurrentWorkspaceId: vi.fn(() => 'workspace'),
    getSelectedElementIds: vi.fn(() => ['b', 'a']),
    getElementData: vi.fn((id: string) => records[id]),
    getElementComputedData: vi.fn((_id: string, fields: readonly string[]) => {
      expect(fields).not.toContain('points')
      expect(fields).not.toContain('segments')
      return structuredClone(computed)
    })
  }
  return { read: createDesignContextReader(source), source, records, computed }
}
describe('bounded document context', () => {
  it('reads a page only and advances across missing IDs', () => {
    const { read, source } = fixture()
    expect(
      read({ scope: 'children', limit: 2, fields: ['text'] })
    ).toMatchObject({
      available: true,
      total: 3,
      nextOffset: 2,
      missingIds: ['gone'],
      elements: [
        {
          id: 'a',
          name: 'Heading',
          parentId: 'workspace',
          properties: { text: 'Hello' }
        }
      ]
    })
    expect(source.getElementData.mock.calls).toEqual([
      ['workspace'],
      ['a'],
      ['gone']
    ])
    expect(source.getElementComputedData).toHaveBeenCalledTimes(1)
    expect(read({ scope: 'children', offset: 2 }).nextOffset).toBeNull()
  })
  it('keeps selection order and observes fresh detached values', () => {
    const { read, source, computed } = fixture()
    const first = read({ scope: 'selection', fields: ['text'] })
    expect(first.elements.map((e) => e.id)).toEqual(['b', 'a'])
    computed.text = 'Changed'
    expect(
      read({ scope: 'selection', fields: ['text'] }).elements[0].properties.text
    ).toBe('Changed')
    expect(first.elements[0].properties.text).toBe('Hello')
    expect(source.getElementData).toHaveBeenCalledTimes(4)
    expect(source.getElementComputedData).toHaveBeenCalledTimes(4)
  })
  it('reads native textColor using its canonical field name', () => {
    const { read, source, computed } = fixture()
    computed.textColor = '#123456'
    const result = read({
      scope: 'selection',
      limit: 1,
      fields: ['text', 'textColor', 'fills']
    })
    expect(source.getElementComputedData.mock.calls[0][1]).toContain(
      'textColor'
    )
    expect(result.elements[0].properties.textColor).toBe('#123456')
  })
  it('reports preview truncation without claiming complete data', () => {
    const { read, computed } = fixture()
    computed.text = 'a'.repeat(2100)
    computed.fills = Array.from({ length: 10 }, () => ({ color: '#ffffff' }))
    const entry = read({
      scope: 'selection',
      limit: 1,
      fields: ['text', 'textColor', 'fills']
    }).elements[0]
    expect(entry.properties.text).toHaveLength(2000)
    expect(entry.properties.fills).toHaveLength(8)
    expect(entry.truncatedFields).toEqual(['text', 'fills'])
  })
  it.each([
    { scope: 'all' },
    { scope: 'children', limit: null },
    { scope: 'children', offset: null },
    { scope: 'children', limit: 201 },
    { scope: 'children', limit: 0 },
    { scope: 'children', offset: -1 },
    { scope: 'children', offset: 0.5 },
    { scope: 'children', parentId: '' },
    { scope: 'selection', parentId: 'a' },
    { scope: 'selection', extra: true }
  ])('rejects invalid query before reading: %j', (query) => {
    const { read, source } = fixture()
    expect(() => read(query as never)).toThrow()
    expect(source.getCurrentWorkspaceId).not.toHaveBeenCalled()
    expect(source.getElementData).not.toHaveBeenCalled()
  })
  it('reports unavailable parent without a fallback document scan', () => {
    const { read, source } = fixture()
    expect(read({ scope: 'children', parentId: 'missing' })).toMatchObject({
      available: false,
      elements: [],
      nextOffset: null
    })
    expect(source.getElementData.mock.calls).toEqual([['missing']])
    expect(source.getElementComputedData).not.toHaveBeenCalled()
  })
})

it('reads explicit identities without traversing parents or calculating unused properties', () => {
  const { read, source, records } = fixture()
  const query = { scope: 'ids', elementIds: ['b', 'a'], fields: [] } as never
  expect(read(query).elements.map((e) => e.id)).toEqual(['b', 'a'])
  expect(source.getElementData.mock.calls).toEqual([['b'], ['a']])
  expect(source.getElementComputedData).not.toHaveBeenCalled()
  expect(source.getCurrentWorkspaceId).not.toHaveBeenCalled()
  delete records.b
  records.a.name = 'Renamed'
  expect(read(query)).toMatchObject({
    missingIds: ['b'],
    elements: [{ name: 'Renamed', properties: {} }]
  })
})
it('computes only requested fields and does not split a known identity set into pages', () => {
  const { read, source, records } = fixture()
  const ids = Array.from({ length: 250 }, (_, i) => `known-${i}`)
  for (const id of ids) records[id] = { name: id }
  const result = read({ scope: 'ids', elementIds: ids, fields: ['x'] } as never)
  expect(result.elements).toHaveLength(250)
  expect(result.nextOffset).toBeNull()
  expect(source.getElementData).toHaveBeenCalledTimes(250)
  expect(source.getElementComputedData).toHaveBeenCalledTimes(250)
  expect(
    source.getElementComputedData.mock.calls.every(
      ([, fields]) => fields.length === 1 && fields[0] === 'x'
    )
  ).toBe(true)
  expect(result.elements[0].properties).toEqual({ x: 10 })
})
it.each([
  { scope: 'ids', elementIds: [] },
  { scope: 'ids', elementIds: ['a', 'a'] },
  { scope: 'selection', fields: ['points'] }
])('rejects invalid narrow queries before reads: %j', (query) => {
  const { read, source } = fixture()
  expect(() => read(query as never)).toThrow()
  expect(source.getElementData).not.toHaveBeenCalled()
})

it('defaults to identity metadata without unused computed data', () => {
  const { read, source } = fixture()
  expect(
    read({ scope: 'selection' }).elements.every(
      (e) => Object.keys(e.properties).length === 0
    )
  ).toBe(true)
  expect(source.getElementComputedData).not.toHaveBeenCalled()
})
