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
    expect(read({ scope: 'children', limit: 2 })).toMatchObject({
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
    const first = read({ scope: 'selection' })
    expect(first.elements.map((e) => e.id)).toEqual(['b', 'a'])
    computed.text = 'Changed'
    expect(read({ scope: 'selection' }).elements[0].properties.text).toBe(
      'Changed'
    )
    expect(first.elements[0].properties.text).toBe('Hello')
    expect(source.getElementData).toHaveBeenCalledTimes(4)
    expect(source.getElementComputedData).toHaveBeenCalledTimes(4)
  })
  it('reads native textColor using its canonical field name', () => {
    const { read, source, computed } = fixture()
    computed.textColor = '#123456'
    const result = read({ scope: 'selection', limit: 1 })
    expect(source.getElementComputedData.mock.calls[0][1]).toContain(
      'textColor'
    )
    expect(result.elements[0].properties.textColor).toBe('#123456')
  })
  it('reports preview truncation without claiming complete data', () => {
    const { read, computed } = fixture()
    computed.text = 'a'.repeat(2100)
    computed.fills = Array.from({ length: 10 }, () => ({ color: '#ffffff' }))
    const entry = read({ scope: 'selection', limit: 1 }).elements[0]
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
