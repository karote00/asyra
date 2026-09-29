import { describe, expect, it, vi } from 'vitest'
import * as vectorArtifact from '../local-vector-artifact'
import { constructDesign } from '../design-construction'
import {
  prepareDesign,
  createDesignPreparationSession
} from '../design-preparation'

const face = () => ({
  key: 'pane',
  name: 'Glass',
  fill: '#224466',
  vertices: [
    { x: 0, y: 0, z: 0 },
    { x: 8, y: 0, z: 0 },
    { x: 8, y: 0, z: 8 },
    { x: 0, y: 0, z: 8 }
  ]
})
const pattern = () => ({
  key: 'windows',
  name: 'Windows',
  type: 'pattern',
  origin: { x: 0, y: 0, z: 0 },
  axes: [
    { count: 3, step: { x: 12, y: 0, z: 0 } },
    { count: 2, step: { x: 0, y: 0, z: 12 } }
  ],
  faces: [face()]
})
const draft = (children: unknown[]) => ({
  type: 'frame',
  name: 'Facade',
  width: 500,
  height: 500,
  projection: {
    azimuth: 30,
    elevation: 30,
    scale: 1,
    originX: 100,
    originY: 200
  },
  children
})

describe('compact planar patterns', () => {
  it('matches explicit projected faces, preserves order and leaves input untouched', () => {
    const input = draft([pattern()])
    const before = structuredClone(input)
    const explicit = []
    for (let x = 0; x < 3; x++)
      for (let z = 0; z < 2; z++)
        explicit.push({
          ...face(),
          key: `e${x}${z}`,
          type: 'projected-face',
          vertices: face().vertices.map((p) => ({
            ...p,
            x: p.x + x * 12,
            z: p.z + z * 12
          }))
        })
    const actual = constructDesign(input).draft.children as Record<
      string,
      unknown
    >[]
    const expected = constructDesign(draft(explicit)).draft.children as Record<
      string,
      unknown
    >[]
    expect(actual).toHaveLength(6)
    actual.forEach((node, i) => {
      expect(node.type).toBe('vector')
      for (const k of ['x', 'y', 'width', 'height'])
        expect(node[k]).toBeCloseTo(expected[i][k] as number, 8)
      expect(node.fill).toBe(expected[i].fill)
    })
    expect(new Set(actual.map((n) => n.key)).size).toBe(6)
    expect(input).toEqual(before)
    expect(prepareDesign(input, 'p').findings).toEqual([])
  })
  it('reads template vertices once instead of once per instance and reuses admitted artifacts', () => {
    const vertices = vi.fn(() => face().vertices)
    const f = {
      ...face(),
      get vertices() {
        return vertices()
      }
    }
    const input = draft([
      {
        ...pattern(),
        faces: [f],
        axes: [{ count: 100, step: { x: 1, y: 0, z: 0 } }]
      }
    ])
    const compile = vi.fn(prepareDesign)
    const session = createDesignPreparationSession(compile)
    const receipt = session.prepare(input)
    expect(vertices).toHaveBeenCalledTimes(1)
    const a = session.resolve(receipt.artifactId)
    expect(a.entries).toHaveLength(101)
    expect(session.resolve(receipt.artifactId)).toBe(a)
    expect(compile).toHaveBeenCalledTimes(1)
    session.prepare(draft([{ ...pattern(), origin: { x: 2, y: 0, z: 0 } }]))
    expect(compile).toHaveBeenCalledTimes(2)
    expect(session.resolve(receipt.artifactId)).toBe(a)
    expect(() =>
      createDesignPreparationSession().resolve(receipt.artifactId)
    ).toThrow()
  })
  it('expands a whole detail stage beyond one thousand objects without model-side splitting', () => {
    const vertices = vi.fn(() => face().vertices)
    const input = draft([
      {
        ...pattern(),
        axes: [
          { count: 80, step: { x: 9, y: 0, z: 0 } },
          { count: 80, step: { x: 0, y: 0, z: 9 } }
        ],
        faces: [
          {
            ...face(),
            get vertices() {
              return vertices()
            }
          }
        ],
        fills: ['#112233', '#445566']
      }
    ])
    input.width = 2000
    input.height = 2000
    input.projection.originY = 1000
    const artifact = prepareDesign(input, 'whole-stage')
    expect(artifact.entries).toHaveLength(6401)
    expect(vertices).toHaveBeenCalledTimes(1)
    expect(artifact.entries[6400].key).toBe('windows-6399-pane')
    expect(
      artifact.entries.slice(1).every((e) => e.parentId === artifact.rootId)
    ).toBe(true)
    expect(artifact.findings).toEqual([])
  })
  it('keeps template planarity work constant as instance count grows', () => {
    const work = vi.spyOn(Math, 'hypot')
    try {
      constructDesign(
        draft([
          { ...pattern(), axes: [{ count: 1, step: { x: 1, y: 0, z: 0 } }] }
        ])
      )
      const once = work.mock.calls.length
      work.mockClear()
      constructDesign(
        draft([
          { ...pattern(), axes: [{ count: 100, step: { x: 1, y: 0, z: 0 } }] }
        ])
      )
      expect(once).toBeGreaterThan(0)
      expect(work).toHaveBeenCalledTimes(once)
    } finally {
      work.mockRestore()
    }
  })
  it.each([
    { ...pattern(), axes: [{ count: 10000, step: { x: 1, y: 0, z: 0 } }] },
    { ...pattern(), axes: [{ count: 1.5, step: { x: 1, y: 0, z: 0 } }] },
    { ...pattern(), origin: { x: Infinity, y: 0, z: 0 } },
    {
      ...pattern(),
      faces: [
        {
          ...face(),
          vertices: [
            { x: 0, y: 0, z: 0 },
            { x: 8, y: 0, z: 0 },
            { x: 8, y: 1, z: 8 },
            { x: 0, y: 0, z: 8 }
          ]
        }
      ]
    },
    { ...pattern(), axes: [] },
    { ...pattern(), fills: [] }
  ])(
    'rejects invalid and excessive expansion before returning an artifact',
    (p) => {
      expect(() => prepareDesign(draft([p]), 'bad')).toThrow()
    }
  )
  it('cycles explicit colors by instance without altering template material', () => {
    const nodes = constructDesign(
      draft([{ ...pattern(), fills: ['#112233', '#445566'] }])
    ).draft.children as Record<string, unknown>[]
    expect(nodes.map((n) => n.fill)).toEqual([
      '#112233',
      '#445566',
      '#112233',
      '#445566',
      '#112233',
      '#445566'
    ])
  })
})

it('measures shared repeated geometry once per preparation, without cross-call reuse', () => {
  const measure = vi.spyOn(vectorArtifact, 'measureVectorPath')
  try {
    const input = draft([
      { ...pattern(), axes: [{ count: 100, step: { x: 1, y: 0, z: 0 } }] }
    ])
    const result = prepareDesign(input, 'shared-bounds')
    expect(result.entries).toHaveLength(101)
    expect(measure).toHaveBeenCalledTimes(1)
    const changed = pattern()
    changed.faces[0].vertices[1].x = 9
    input.children = [changed]
    prepareDesign(input, 'changed-bounds')
    expect(measure).toHaveBeenCalledTimes(2)
  } finally {
    measure.mockRestore()
  }
})

it('expands only selected ranges and preserves original indices, fills and geometry when deferred ranges are restored', () => {
  const full = { ...pattern(), fills: ['#112233', '#445566'] }
  const all = constructDesign(draft([full])).draft.children as Record<
    string,
    unknown
  >[]
  const selected = constructDesign(
    draft([
      {
        ...full,
        instanceRanges: [
          { start: 1, end: 3 },
          { start: 5, end: 6 }
        ]
      }
    ])
  ).draft.children
  expect(selected).toEqual([all[1], all[2], all[5]])
  const restored = constructDesign(
    draft([
      {
        ...full,
        instanceRanges: [
          { start: 0, end: 1 },
          { start: 3, end: 5 }
        ]
      }
    ])
  ).draft.children as Record<string, unknown>[]
  expect(restored).toEqual([all[0], all[3], all[4]])
})

it('does not expand unselected instances or charge their output against artifact limits', () => {
  // 100 million potential instances; only two are generated, without scanning the product.
  const input = draft([
    {
      ...pattern(),
      axes: [
        { count: 10000, step: { x: 0.001, y: 0, z: 0 } },
        { count: 10000, step: { x: 0, y: 0, z: 0.001 } }
      ],
      instanceRanges: [{ start: 99999998, end: 100000000 }]
    }
  ])
  const work = vi.spyOn(Math, 'floor')
  try {
    const output = constructDesign(input).draft.children as Record<
      string,
      unknown
    >[]
    expect(output).toHaveLength(2)
    expect(output[0].key).toBe('windows-99999998-pane')
    expect(work.mock.calls.length).toBeLessThan(20)
  } finally {
    work.mockRestore()
  }
})

it.each(
  [
    [],
    [{ start: -1, end: 1 }],
    [{ start: 0, end: 7 }],
    [{ start: 1, end: 1 }],
    [{ start: 0.5, end: 2 }],
    [
      { start: 2, end: 4 },
      { start: 3, end: 5 }
    ],
    [
      { start: 3, end: 4 },
      { start: 0, end: 1 }
    ]
  ].map((instanceRanges) => ({ instanceRanges }))
)(
  'rejects malformed or overlapping instance ranges $instanceRanges',
  ({ instanceRanges }) => {
    expect(() =>
      constructDesign(draft([{ ...pattern(), instanceRanges }]))
    ).toThrow()
  }
)

it('rejects null ranges instead of silently expanding the full pattern', () => {
  expect(() =>
    constructDesign(draft([{ ...pattern(), instanceRanges: null }]))
  ).toThrow()
})
