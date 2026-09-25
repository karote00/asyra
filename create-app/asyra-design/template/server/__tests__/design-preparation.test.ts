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
  type: 'frame',
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
        type: 'frame',
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
        type: 'frame',
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
        type: 'frame',
        name: 'Too deep',
        width: 100,
        height: 100,
        children: [child]
      })
    ).toThrow()
    expect(() =>
      prepareDesign({
        type: 'frame',
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

  it('retains earlier receipts after more than eight preparations', () => {
    const session = createDesignPreparationSession()
    const receipts = Array.from({ length: 8 }, () => session.prepare(draft()))
    expect(session.prepare(draft()).artifactId).toBeTruthy()
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
    type: 'frame',
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
        type: 'frame',
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

describe('structured design construction', () => {
  const page = () => ({
    type: 'frame',
    name: 'Reading page',
    width: 800,
    height: 600,
    brief: {
      intent: 'A calm editorial page',
      viewpoint: 'Flat layout',
      sources: ['User brief'],
      assumptions: ['Use a light palette'],
      checks: [
        { key: 'card', property: 'width', expected: 360, tolerance: 0.01 }
      ]
    },
    children: [
      { key: 'card', name: 'Card', type: 'rect', width: 1, height: 120 },
      {
        key: 'caption',
        name: 'Caption',
        type: 'text',
        width: 200,
        height: 40,
        text: 'Read more'
      }
    ],
    relations: [
      {
        target: 'caption',
        property: 'x',
        source: 'card',
        sourceProperty: 'right',
        offset: 24
      },
      {
        target: 'card',
        property: 'width',
        source: '$parent',
        sourceProperty: 'width',
        factor: 0.5,
        offset: -40
      },
      {
        target: 'card',
        property: 'x',
        source: '$parent',
        sourceProperty: 'width',
        factor: 0.05
      }
    ]
  })
  it('resolves layout dependencies before checks without modifying the draft', () => {
    const source = page(),
      before = JSON.stringify(source)
    const result = prepareDesign(source, 'relations')
    expect(result.entries[1].descriptor).toMatchObject({ x: 40, width: 360 })
    expect(result.entries[2].descriptor).toMatchObject({ x: 424 })
    expect(
      result.findings.filter((f) => f.kind !== 'text-metrics-required')
    ).toEqual([])
    expect(result).toMatchObject({
      review: {
        checks: [{ key: 'card', expected: 360, actual: 360, passed: true }]
      }
    })
    expect(JSON.stringify(source)).toBe(before)
  })
  it('centers a proportionally sized child without model-computed offsets', () => {
    const source = page()
    const result = prepareDesign({
      ...source,
      relations: [
        source.relations[1],
        {
          target: 'card',
          property: 'x',
          source: '$parent',
          sourceProperty: 'centerX',
          targetAnchor: 0.5
        }
      ]
    })
    expect(result.entries[1].descriptor).toMatchObject({ width: 360, x: 220 })
  })
  it('reports unmet requirements with actual and expected final-pixel measurements', () => {
    const source = page()
    source.brief.checks[0].expected = 400
    expect(prepareDesign(source).findings).toContainEqual({
      kind: 'requirement',
      key: 'card',
      property: 'width',
      expected: 400,
      actual: 360,
      tolerance: 0.01
    })
  })
  it('rejects cyclic, multiply assigned, cross-parent and flow-controlled relations', () => {
    const source = page()
    for (const relations of [
      [
        {
          target: 'card',
          property: 'width',
          source: 'card',
          sourceProperty: 'width'
        }
      ],
      [...source.relations, source.relations[0]],
      [
        {
          target: 'card',
          property: 'x',
          source: 'missing',
          sourceProperty: 'x'
        }
      ]
    ])
      expect(() => prepareDesign({ ...source, relations })).toThrow(/relation/i)
    expect(() => prepareDesign({ ...source, layout: 'row' })).toThrow(
      /relation/i
    )
    expect(() =>
      prepareDesign({
        ...source,
        relations: [],
        brief: {
          ...source.brief,
          checks: [
            { key: 'absent', property: 'width', expected: 1, tolerance: 0 }
          ]
        }
      })
    ).toThrow(/check/i)
  })
  const scene = () => ({
    type: 'frame',
    name: 'Projected structure',
    width: 400,
    height: 400,
    projection: {
      azimuth: 0,
      elevation: 30,
      scale: 2,
      originX: 100,
      originY: 300
    },
    children: [
      {
        key: 'wall',
        name: 'Front wall',
        type: 'projected-face',
        fill: '#228899',
        vertices: [
          { x: 0, y: 0, z: 0 },
          { x: 100, y: 0, z: 0 },
          { x: 100, y: 0, z: 100 },
          { x: 0, y: 0, z: 100 }
        ]
      }
    ]
  })
  it('projects explicit geometry with one camera into ordinary editable straight vectors', () => {
    const source = scene(),
      result = prepareDesign(source, 'camera')
    const d = result.entries[1]
      .descriptor as unknown as VectorComputedSnapshot & { type: string }
    expect(d.type).toBe('vector')
    expect(d.x).toBeCloseTo(100)
    expect(d.y).toBeCloseTo(300 - 100 * Math.sqrt(3))
    expect(d.width).toBeCloseTo(200)
    expect(d.height).toBeCloseTo(100 * Math.sqrt(3))
    expect(Object.values(d.points)).toHaveLength(4)
    expect(
      Object.values(d.segments).every((s) => !s.inControlId && !s.outControlId)
    ).toBe(true)
    expect(source.children[0].type).toBe('projected-face')
  })
  it('rejects nonplanar, edge-on and unbounded projections', () => {
    const source = scene()
    expect(() => prepareDesign({ ...source, projection: undefined })).toThrow()
    expect(() =>
      prepareDesign({
        ...source,
        projection: { ...source.projection, scale: Infinity }
      })
    ).toThrow()
    expect(() =>
      prepareDesign({
        ...source,
        projection: { ...source.projection, elevation: 90 }
      })
    ).toThrow(/degenerate/i)
    const warped = scene()
    warped.children[0].vertices[2].y = 20
    expect(() => prepareDesign(warped)).toThrow(/planar/i)
  })
})

it('validates construction boundaries and isolates brief evidence from caller changes', () => {
  const base = {
    type: 'frame',
    name: 'Panel',
    width: 200,
    height: 200,
    children: [
      { key: 'a', type: 'rect', name: 'A', width: 40, height: 40 },
      { key: 'b', type: 'oval', name: 'B', width: 40, height: 40 }
    ]
  }
  const relation = {
    target: 'b',
    property: 'x',
    source: 'a',
    sourceProperty: 'right',
    offset: 8
  }
  for (const invalid of [
    { ...base, relations: Array.from({ length: 257 }, () => relation) },
    { ...base, relations: [{ ...relation, factor: Infinity }] },
    { ...base, relations: [{ ...relation, offset: -1000 }] },
    { ...base, relations: [{ ...relation, targetAnchor: 2 }] },
    {
      ...base,
      relations: [{ ...relation, property: 'width', targetAnchor: 0.5 }]
    },
    {
      ...base,
      relations: [{ ...relation, target: 'a', source: 'b' }, relation]
    },
    {
      ...base,
      children: [
        ...base.children,
        {
          key: 'box',
          name: 'Box',
          type: 'frame',
          width: 50,
          height: 50,
          children: [
            { key: 'inner', name: 'Inner', type: 'rect', width: 10, height: 10 }
          ]
        }
      ],
      relations: [{ ...relation, source: 'inner' }]
    },
    {
      ...base,
      brief: {
        intent: 'test',
        viewpoint: 'flat',
        sources: [],
        assumptions: [],
        checks: [{ key: 'a', property: 'width', expected: 40, tolerance: -1 }]
      }
    }
  ])
    expect(() => prepareDesign(invalid)).toThrow()
  const brief = {
    intent: 'test',
    viewpoint: 'flat',
    sources: ['User brief'],
    assumptions: ['Blue palette'],
    checks: [{ key: 'a', property: 'width', expected: 40, tolerance: 0 }]
  }
  const result = prepareDesign({ ...base, brief })
  brief.assumptions[0] = 'changed'
  brief.checks[0].expected = 100
  expect(result.review?.assumptions).toEqual(['Blue palette'])
  expect(result.review?.checks[0]).toMatchObject({
    expected: 40,
    actual: 40,
    passed: true
  })
})

it('uses the target parent local frame and resolves parent sizes before nested placement', () => {
  const result = prepareDesign({
    type: 'frame',
    name: 'Nested',
    x: 90,
    y: 70,
    width: 400,
    height: 300,
    children: [
      {
        key: 'box',
        name: 'Box',
        type: 'frame',
        x: 60,
        y: 30,
        width: 1,
        height: 100,
        children: [
          { key: 'label', name: 'Label', type: 'rect', width: 40, height: 20 }
        ]
      }
    ],
    relations: [
      {
        target: 'label',
        property: 'x',
        source: '$parent',
        sourceProperty: 'right',
        offset: -10,
        targetAnchor: 1
      },
      {
        target: 'box',
        property: 'width',
        source: '$parent',
        sourceProperty: 'width',
        factor: 0.5
      }
    ]
  })
  expect(result.entries[1].descriptor).toMatchObject({ x: 60, width: 200 })
  expect(result.entries[2].descriptor.x).toBe(150)
})

it('shares exact projected edges and reuses compiled camera geometry across receipt lookups', () => {
  const front = [
    { x: 0, y: 0, z: 0 },
    { x: 100, y: 0, z: 0 },
    { x: 100, y: 0, z: 100 },
    { x: 0, y: 0, z: 100 }
  ]
  const side = [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 80, z: 0 },
    { x: 0, y: 80, z: 100 },
    { x: 0, y: 0, z: 100 }
  ]
  const source = {
    type: 'frame',
    name: 'Two faces',
    width: 500,
    height: 500,
    projection: {
      azimuth: 30,
      elevation: 30,
      scale: 2,
      originX: 200,
      originY: 300
    },
    children: [front, side].map((vertices, i) => ({
      key: `face${i}`,
      name: `Face ${i}`,
      type: 'projected-face',
      vertices
    }))
  }
  const cosine = vi.spyOn(Math, 'cos'),
    compile = vi.fn(prepareDesign)
  try {
    const session = createDesignPreparationSession(compile)
    const receipt = session.prepare(source)
    const result = session.resolve(receipt.artifactId)
    const trigCount = cosine.mock.calls.length
    const points = result.entries
      .slice(1)
      .map((e) =>
        Object.values(
          (e.descriptor as unknown as VectorComputedSnapshot).points
        ).filter((p) => p.kind === 'anchor')
      )
    expect(points[0][0].x).toBe(points[1][0].x)
    expect(points[0][0].y).toBe(points[1][0].y)
    expect(points[0][3].x).toBe(points[1][3].x)
    expect(points[0][3].y).toBe(points[1][3].y)
    expect(session.resolve(receipt.artifactId)).toBe(result)
    expect(cosine).toHaveBeenCalledTimes(trigCount)
    expect(compile).toHaveBeenCalledTimes(1)
    const changed = session.prepare({
      ...source,
      projection: { ...source.projection, scale: 1 }
    })
    expect(compile).toHaveBeenCalledTimes(2)
    expect(
      session.resolve(changed.artifactId).entries[1].descriptor.width
    ).toBeCloseTo(Number(result.entries[1].descriptor.width) / 2)
    expect(session.resolve(receipt.artifactId)).toBe(result)
  } finally {
    cosine.mockRestore()
  }
})

describe('preparation text layout review', () => {
  const text = (key: string, y: number) => ({
    key,
    name: key,
    type: 'text',
    x: 88,
    y,
    width: 148,
    height: 44,
    text: key,
    fontSize: 17,
    lineHeight: 22
  })
  it('reports intersecting sibling text boxes before rendering without mistaking decorative shapes for text', () => {
    const session = createDesignPreparationSession()
    const receipt = session.prepare({
      type: 'frame',
      name: 'Layout',
      width: 720,
      height: 520,
      children: [
        text('title', 369),
        { ...text('body', 404), height: 38 },
        { ...text('touching', 442), height: 20 },
        {
          key: 'background',
          name: 'Background',
          type: 'rect',
          width: 720,
          height: 520
        }
      ]
    })
    expect(receipt.layoutReview).toEqual({
      textBoxOverlaps: [
        { firstKey: 'title', secondKey: 'body', width: 148, height: 9 }
      ],
      truncated: false
    })
    expect(session.resolve(receipt.artifactId)).not.toHaveProperty(
      'layoutReview'
    )
  })
  it('does not compare local coordinates belonging to different parents', () => {
    const receipt = createDesignPreparationSession().prepare({
      type: 'frame',
      name: 'Layout',
      width: 720,
      height: 520,
      children: [
        {
          key: 'a',
          name: 'A',
          type: 'frame',
          width: 300,
          height: 500,
          children: [text('one', 10)]
        },
        {
          key: 'b',
          name: 'B',
          type: 'frame',
          x: 350,
          width: 300,
          height: 500,
          children: [text('two', 10)]
        }
      ]
    })
    expect(receipt.layoutReview).toBeUndefined()
  })
  it('bounds warnings while identifying unreported intersections', () => {
    const receipt = createDesignPreparationSession().prepare({
      type: 'frame',
      name: 'Dense',
      width: 720,
      height: 520,
      children: Array.from({ length: 14 }, (_, i) => text(String(i), 10))
    })
    expect(receipt.layoutReview?.textBoxOverlaps).toHaveLength(64)
    expect(receipt.layoutReview?.truncated).toBe(true)
  })
})
