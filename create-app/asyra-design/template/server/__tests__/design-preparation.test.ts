import { DEFAULT_TEXT_DATA, TEXT_PROPERTY_SCHEMA } from '@asyra/preset'
import {
  DesignTextDefaults,
  DesignTextValidators
} from '../../src/ai/prepared-design'
import { describe, expect, it, vi } from 'vitest'
import * as vectorMeasurement from '../local-vector-artifact'
import type { VectorComputedSnapshot } from '../../src/common-apis/element/types'
import {
  prepareDesign,
  createDesignPreparationSession
} from '../design-preparation'

const draft = () => ({
  name: 'Product overview',
  width: 800,
  height: 600,
  padding: 24,
  gap: 16,
  layout: 'column',
  children: [
    {
      key: 'title',
      name: 'Heading',
      type: 'text',
      width: 600,
      height: 60,
      text: 'Welcome 世界',
      fontSize: 40
    },
    {
      key: 'cards',
      name: 'Cards',
      type: 'frame',
      width: 700,
      height: 240,
      layout: 'row',
      gap: 20,
      children: [
        {
          key: 'first',
          name: 'First card',
          type: 'rect',
          width: 200,
          height: 200,
          fill: '#112233'
        },
        {
          key: 'second',
          name: 'Second card',
          type: 'oval',
          width: 160,
          height: 160,
          fill: '#aabbcc'
        }
      ]
    }
  ]
})

describe('semantic design preparation', () => {
  it('prepares native editable text and nested layout without choosing content', () => {
    const artifact = prepareDesign(draft(), 'test')
    expect(artifact.entries).toHaveLength(5)
    const title = artifact.entries.find((entry) => entry.key === 'title')
    expect(title?.descriptor).toMatchObject({
      type: 'text',
      text: 'Welcome 世界',
      fontSize: 40,
      x: 24,
      y: 24
    })
    const cards = artifact.entries.find((entry) => entry.key === 'cards')
    expect(cards?.descriptor).toMatchObject({ type: 'frame', x: 24, y: 100 })
    expect(
      artifact.entries.find((entry) => entry.key === 'second')
    ).toMatchObject({
      parentId: cards?.descriptor.id,
      descriptor: { type: 'oval', x: 220, y: 0 }
    })
    expect(
      artifact.findings.filter((finding) => finding.kind === 'overflow')
    ).toEqual([])
  })

  it('reports exact overflow and resolves grid rows using actual child dimensions', () => {
    const artifact = prepareDesign(
      {
        name: 'Mobile grid',
        width: 300,
        height: 300,
        layout: 'grid',
        columns: 2,
        gap: 10,
        children: [0, 1, 2].map((index) => ({
          key: `card-${index}`,
          name: `Card ${index}`,
          type: 'rect',
          width: 160,
          height: 50
        }))
      },
      'grid'
    )
    expect(artifact.entries[3].descriptor).toMatchObject({ x: 0, y: 60 })
    expect(artifact.findings).toContainEqual(
      expect.objectContaining({ kind: 'overflow', key: 'card-1', right: 30 })
    )
  })

  it.each([
    { ...draft(), width: Infinity },
    { ...draft(), children: [{ ...draft().children[0], fill: '#ff0000' }] },
    { ...draft(), unexpected: true },
    {
      ...draft(),
      children: [
        { key: 'bad', name: 'Bad', type: 'image', width: 10, height: 10 }
      ]
    },
    { ...draft(), children: [...draft().children, draft().children[0]] },
    { ...draft(), children: [{ ...draft().children[0], fontSize: -1 }] },
    { ...draft(), children: [{ ...draft().children[0], x: 2 }] }
  ])('rejects an invalid draft before producing an artifact', (input) => {
    expect(() => prepareDesign(input, 'invalid')).toThrow()
  })

  it('bounds the whole request, including nested nodes and combined text', () => {
    expect(() =>
      prepareDesign({
        name: 'Too many',
        width: 100,
        height: 100,
        children: Array.from({ length: 1000 }, (_, index) => ({
          key: `node-${index}`,
          name: 'Node',
          type: 'rect',
          width: 1,
          height: 1
        }))
      })
    ).toThrow()
    let child: Record<string, unknown> = {
      key: 'leaf',
      name: 'Leaf',
      type: 'rect',
      width: 1,
      height: 1
    }
    for (let depth = 0; depth < 12; depth++)
      child = {
        key: `level-${depth}`,
        name: 'Frame',
        type: 'frame',
        width: 10,
        height: 10,
        children: [child]
      }
    expect(() =>
      prepareDesign({
        name: 'Too deep',
        width: 100,
        height: 100,
        children: [child]
      })
    ).toThrow()
    expect(() =>
      prepareDesign({
        name: 'Too much text',
        width: 100,
        height: 100,
        children: [0, 1].map((index) => ({
          key: `text-${index}`,
          name: 'Text',
          type: 'text',
          width: 100,
          height: 100,
          text: 'x'.repeat(60000)
        }))
      })
    ).toThrow()
  })

  it('bounds retained artifacts and preserves earlier receipts', () => {
    const session = createDesignPreparationSession()
    const receipts = Array.from({ length: 8 }, () => session.prepare(draft()))
    expect(() => session.prepare(draft())).toThrow('limit')
    expect(session.resolve(receipts[0].artifactId).entries).toHaveLength(5)
  })

  it('reuses one immutable artifact on lookup and recomputes changed drafts', () => {
    const compile = vi.fn(prepareDesign)
    const session = createDesignPreparationSession(compile)
    const receipt = session.prepare(draft())
    const first = session.resolve(receipt.artifactId)
    expect(session.resolve(receipt.artifactId)).toBe(first)
    expect(compile).toHaveBeenCalledTimes(1)
    expect(Object.isFrozen(first)).toBe(true)
    session.prepare({ ...draft(), width: 1200 })
    expect(compile).toHaveBeenCalledTimes(2)
    expect(() => session.resolve('missing')).toThrow()
  })
})

describe('editable illustration preparation', () => {
  const vector = () => ({
    key: 'petal',
    name: 'Petal',
    type: 'vector',
    width: 100,
    height: 100,
    fill: '#ff8800',
    rings: [
      [
        { x: 0, y: 50, outControl: { x: 0, y: 0 } },
        { x: 100, y: 50, inControl: { x: 100, y: 0 } },
        { x: 50, y: 100 }
      ]
    ]
  })
  const illustration = (node: unknown) => ({
    name: 'Illustration',
    x: 30,
    y: 40,
    width: 300,
    height: 300,
    children: [
      {
        key: 'inset',
        name: 'Inset',
        type: 'frame',
        x: 10,
        y: 20,
        width: 200,
        height: 200,
        children: [node]
      }
    ]
  })
  it('preserves cubic controls, straight edges and nested workspace coordinates', () => {
    const result = prepareDesign(illustration(vector()), 'curves')
    const d = result.entries[2]
      .descriptor as unknown as VectorComputedSnapshot & { type: string }
    expect(d.type).toBe('vector')
    expect(d.pointCoordinateSpace).toBe('workspace')
    expect(d.x).toBe(0)
    expect(d.y).toBeCloseTo(12.5)
    expect(d.height).toBeCloseTo(87.5)
    const points = Object.values(d.points)
    expect(
      points.filter((p) => p.kind === 'anchor').map((p) => [p.x, p.y])
    ).toEqual([
      [40, 110],
      [140, 110],
      [90, 160]
    ])
    expect(
      points.filter((p) => p.kind === 'control').map((p) => [p.x, p.y])
    ).toEqual([
      [40, 60],
      [140, 60]
    ])
    const segments = Object.values(d.segments)
    expect(
      segments.filter((s) => s.outControlId && s.inControlId)
    ).toHaveLength(1)
    expect(
      segments.filter((s) => !s.outControlId && !s.inControlId)
    ).toHaveLength(2)
    expect(Object.isFrozen(d.points)).toBe(true)
  })
  it('accepts a closed two-anchor cubic shape without inventing extra vertices', () => {
    const result = prepareDesign(
      illustration({
        ...vector(),
        rings: [
          [
            { x: 0, y: 50, outControl: { x: 0, y: 0 } },
            { x: 100, y: 50, inControl: { x: 100, y: 0 } }
          ]
        ]
      })
    )
    const d = result.entries[2].descriptor as unknown as VectorComputedSnapshot
    expect(
      Object.values(d.points).filter((p) => p.kind === 'anchor')
    ).toHaveLength(2)
    expect(Object.values(d.segments)).toHaveLength(2)
  })
  it('measures once per prepared vector, reuses receipts and isolates source mutations', () => {
    const measurement = vi.spyOn(vectorMeasurement, 'measureVectorPath')
    try {
      const session = createDesignPreparationSession()
      const source = vector()
      const receipt = session.prepare(illustration(source))
      const before = JSON.stringify(session.resolve(receipt.artifactId))
      session.resolve(receipt.artifactId)
      expect(measurement).toHaveBeenCalledTimes(1)
      source.rings[0][0].x = 10
      expect(JSON.stringify(session.resolve(receipt.artifactId))).toBe(before)
      session.prepare(illustration(source))
      expect(measurement).toHaveBeenCalledTimes(2)
    } finally {
      measurement.mockRestore()
    }
  })
  it('preserves compound rings and enforces the combined point budget', () => {
    const shape = vector()
    const result = prepareDesign(
      illustration({
        ...shape,
        rings: [
          [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 }
          ],
          [
            { x: 20, y: 20 },
            { x: 20, y: 80 },
            { x: 80, y: 80 },
            { x: 80, y: 20 }
          ]
        ]
      })
    )
    const d = result.entries[2].descriptor as unknown as VectorComputedSnapshot
    expect(Object.values(d.networks)).toHaveLength(2)
    expect(d.fillRule).toBe('nonzero')
    const rings = [
      Array.from({ length: 10001 }, (_, i) => ({ x: i % 100, y: i % 90 }))
    ]
    expect(() =>
      prepareDesign({
        name: 'Over budget',
        width: 300,
        height: 300,
        children: [
          { ...shape, rings },
          { ...shape, key: 'other', rings }
        ]
      })
    ).toThrow('vector point limit')
  })
  it('rejects malformed rings, unpaired controls and excess whole-request points', () => {
    for (const rings of [
      [],
      [[]],
      [[{ x: 0, y: 0 }]],
      [
        [
          { x: 0, y: 0, outControl: { x: 1, y: 1 } },
          { x: 100, y: 0 },
          { x: 50, y: 100 }
        ]
      ],
      [
        [
          { x: 0, y: 0, extra: true },
          { x: 100, y: 0 },
          { x: 50, y: 100 }
        ]
      ],
      [
        [
          { x: NaN, y: 0 },
          { x: 100, y: 0 },
          { x: 50, y: 100 }
        ]
      ],
      [Array.from({ length: 20001 }, (_, i) => ({ x: i % 100, y: i % 90 }))]
    ])
      expect(() =>
        prepareDesign(illustration({ ...vector(), rings }))
      ).toThrow()
  })
})

it('keeps the inert semantic typography protocol compatible with canonical field admission', () => {
  expect(DesignTextDefaults).toEqual(DEFAULT_TEXT_DATA)
  expect(Object.keys(DesignTextValidators).sort()).toEqual(
    TEXT_PROPERTY_SCHEMA.fields.map((f) => f.key).sort()
  )
  const values: unknown[] = [
    null,
    undefined,
    {},
    [],
    true,
    '',
    ' ',
    'sans-serif',
    'normal',
    'bold',
    'italic',
    'left',
    'right',
    'center',
    '#112233',
    'red',
    -101,
    -100,
    -1,
    0,
    Number.MIN_VALUE,
    16,
    100,
    128,
    4096,
    4097,
    8192,
    8193,
    NaN,
    Infinity,
    'x'.repeat(129),
    'x'.repeat(100001)
  ]
  for (const field of TEXT_PROPERTY_SCHEMA.fields) {
    const validator =
      DesignTextValidators[field.key as keyof typeof DesignTextValidators]
    for (const value of values)
      expect(validator(value), field.key).toBe(field.validate?.(value))
  }
})
