import { describe, expect, it, vi } from 'vitest'
import recordedFacade from './fixtures/recorded-facade-grid.json'
import { inspectDesignBudget } from '../design-budget'
import * as vectorArtifact from '../local-vector-artifact'
import { constructDesign, constructDesignAsync } from '../design-construction'
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
  it.each(['sync', 'async'] as const)(
    'reads template vertices once instead of once per instance and reuses admitted artifacts (%s)',
    async (mode) => {
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
      const session = createDesignPreparationSession(
        compile,
        async (_signal, ...args) => compile(...args)
      )
      const receipt =
        mode === 'sync'
          ? session.prepare(input)
          : await session.prepareAsync(input, new AbortController().signal)
      expect(vertices).toHaveBeenCalledTimes(1)
      expect(Object.isFrozen(session.recipe(receipt.artifactId).recipe)).toBe(
        true
      )
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
    }
  )
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

describe('exact 2D vector patterns', () => {
  const template = () => ({
    width: 10,
    height: 10,
    fill: '#224466',
    rings: [
      [
        { x: 0, y: 0, outControl: { x: 4, y: 0 } },
        { x: 10, y: 10, inControl: { x: 10, y: 4 } },
        { x: 0, y: 10 }
      ]
    ]
  })
  const motif = () => ({
    type: 'vector-pattern',
    key: 'curves',
    name: 'Curves',
    template: template(),
    placements: [
      { x: 10, y: 10 },
      { x: 30, y: 20, fill: '#abcdef' }
    ]
  })
  it('matches explicit geometry and painter order and measures a template once per preparation', () => {
    const node = motif(),
      input = draft([node]),
      before = structuredClone(input)
    const measure = vi.spyOn(vectorArtifact, 'measureVectorPath')
    try {
      const actual = constructDesign(input).draft.children as Record<
        string,
        unknown
      >[]
      const expected = node.placements.map((position, i) => ({
        ...node.template,
        ...position,
        type: 'vector',
        key: `curves-${i}`,
        name: `Curves - ${i + 1}`
      }))
      expect(actual).toEqual(expected)
      expect(actual[0].rings).toBe(actual[1].rings)
      const prepared = prepareDesign(input, 'reused')
      expect(measure).toHaveBeenCalledTimes(1)
      expect(prepared.findings).toEqual([])
      const explicit = prepareDesign(draft(expected), 'reused')
      expect(prepared.entries).toEqual(explicit.entries)
      expect(input).toEqual(before)
      measure.mockClear()
      node.template.rings[0][0].outControl = { x: 3, y: 0 }
      prepareDesign(input, 'changed')
      expect(measure).toHaveBeenCalledTimes(1)
      expect(measure.mock.calls[0][0].rings[0][0].outControl).toEqual({
        x: 3,
        y: 0
      })
    } finally {
      measure.mockRestore()
    }
  })
  it('rejects overrides, unpaired controls and expanded budget overflow', () => {
    const node = motif()
    expect(() =>
      prepareDesign(
        draft([{ ...node, placements: [{ x: 1, y: 1, width: 20 }] }]),
        'bad'
      )
    ).toThrow()
    delete node.template.rings[0][0].outControl
    expect(() => prepareDesign(draft([node]), 'bad')).toThrow(/unpaired/)
    expect(() =>
      constructDesign(
        draft([
          {
            ...motif(),
            placements: Array.from({ length: 10000 }, () => ({ x: 1, y: 1 }))
          }
        ])
      )
    ).toThrow(/limit/)
  })
})

it('projects children of an explicitly keyed container using the same camera', () => {
  const unnamed = prepareDesign(draft([pattern()]), 'same')
  const named = prepareDesign({ ...draft([pattern()]), key: 'facade' }, 'same')
  expect(named.entries.slice(1)).toEqual(unnamed.entries.slice(1))
  expect(named.keyToId.facade).toBe(named.rootId)
})

describe('construction budget recovery diagnostics', () => {
  it('partitions source work across groups without changing the hierarchy', () => {
    const leaf = (key: string) => ({
      type: 'rect',
      key,
      name: key,
      width: 1,
      height: 1
    })
    const children = Array.from({ length: 2 }, (_, group) => ({
      type: 'group',
      key: `group-${group}`,
      name: 'Part',
      children: Array.from({ length: 500 }, (_, index) =>
        leaf(`${group}-${index}`)
      )
    }))
    const result = constructDesign(draft(children))
    expect(result.sourceWork).toMatchObject({
      batches: 2,
      nodes: 1003,
      largestBatchNodes: 1000
    })
    expect(result.draft.children).toHaveLength(2)
  })
  it('identifies depth separately from source count', () => {
    let child: Record<string, unknown> = {
      type: 'rect',
      key: 'leaf',
      name: 'Leaf',
      width: 1,
      height: 1
    }
    for (let level = 0; level < 11; level++)
      child = {
        type: 'group',
        key: `level-${level}`,
        name: 'Group',
        children: [child]
      }
    expect(() => constructDesign(draft([child]))).toThrow(
      'depth 13 exceeds 12 per artifact; reduce container nesting without changing visible geometry'
    )
  })
  it('does not mislabel a malformed node as a budget failure', () => {
    expect(() => constructDesign(draft([null]))).toThrow(
      'node must be an object'
    )
  })
})

it('expands explicitly typed and implicit vector templates to identical geometry and keys', () => {
  const template = {
    width: 3,
    height: 2,
    rings: [
      [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        { x: 3, y: 2 }
      ]
    ],
    fill: '#123456'
  }
  const source = (value: unknown) => ({
    type: 'group',
    key: 'drawing',
    name: 'Drawing',
    children: [
      {
        type: 'vector-pattern',
        key: 'windows',
        name: 'Windows',
        template: value,
        placements: [
          { x: 0, y: 0 },
          { x: 5, y: 8, fill: '#abcdef' }
        ]
      }
    ]
  })
  expect(constructDesign(source({ ...template, type: 'vector' }))).toEqual(
    constructDesign(source(template))
  )
  expect(() => constructDesign(source({ ...template, type: 'oval' }))).toThrow(
    /template type/
  )
})

it('retains one explicitly shared Fill across expanded faces', () => {
  const result = prepareDesign(
    {
      ...draft([{ ...pattern(), fills: [{ shared: 'glass' }] }]),
      sharedFills: { glass: '#224466' }
    },
    'shared-pattern'
  )
  const fills = result.entries
    .slice(1)
    .map(({ descriptor }) => descriptor.fills)
  expect(fills[0]).toEqual([expect.objectContaining({ color: '#224466' })])
  expect(fills.slice(1)).toEqual(
    Array.from({ length: 5 }, () => [result.sharedFillIds?.glass])
  )
})

describe('cooperative construction', () => {
  it('allows cancellation between real preparation windows without mutating input', async () => {
    const input = draft([
      { ...pattern(), axes: [{ count: 3000, step: { x: 1, y: 0, z: 0 } }] }
    ])
    const before = structuredClone(input)
    const controller = new AbortController()
    const pending = constructDesignAsync(
      input,
      'stable-root',
      controller.signal
    )
    setImmediate(() => controller.abort(new Error('Cancelled construction')))
    await expect(pending).rejects.toThrow('Cancelled construction')
    expect(input).toEqual(before)
  })
  it('preserves the exact synchronous geometry, global identities and painter order', async () => {
    const input = draft([
      { ...pattern(), axes: [{ count: 2200, step: { x: 1, y: 0, z: 0 } }] }
    ])
    expect(
      await constructDesignAsync(
        input,
        'stable-root',
        new AbortController().signal
      )
    ).toEqual(constructDesign(input, 'stable-root'))
  })
})

it('counts independent faces separately while preserving expanded and primitive safety limits', () => {
  const input = draft([
    {
      ...pattern(),
      axes: [{ count: 1, step: { x: 0, y: 0, z: 0 } }],
      faces: Array.from({ length: 5001 }, (_, i) => ({
        ...face(),
        key: `f${i}`
      }))
    }
  ])
  expect(inspectDesignBudget(input)).toBeUndefined()
  const result = constructDesign(input)
  expect(result.sourceWork).toMatchObject({
    nodes: 5002,
    pathCommands: 20004,
    batches: 6,
    largestBatchNodes: 1000
  })
  expect(result.draft.children).toHaveLength(5001)
  expect(
    inspectDesignBudget(
      draft([
        { ...pattern(), axes: [{ count: 10000, step: { x: 1, y: 0, z: 0 } }] }
      ])
    )
  ).toMatchObject({ code: 'DESIGN_BUDGET_EXCEEDED' })
  expect(
    inspectDesignBudget(
      draft([
        {
          ...pattern(),
          axes: [{ count: 1, step: { x: 0, y: 0, z: 0 } }],
          faces: [
            {
              ...face(),
              vertices: Array.from({ length: 20001 }, () => ({
                x: 0,
                y: 0,
                z: 0
              }))
            }
          ]
        }
      ])
    )
  ).toMatchObject({ code: 'DESIGN_BUDGET_EXCEEDED' })
})

it('preserves sparse instance indices and palette phase beyond one work window', () => {
  const motif = {
    ...pattern(),
    axes: [{ count: 2200, step: { x: 1, y: 0, z: 0 } }],
    instanceRanges: Array.from({ length: 1100 }, (_, i) => ({
      start: i * 2,
      end: i * 2 + 1
    })),
    fills: Array.from({ length: 1100 }, (_, i) =>
      i % 3 ? '#224466' : '#667788'
    )
  }
  const result = constructDesign(draft([motif])).draft.children as Record<
    string,
    unknown
  >[]
  expect(result).toHaveLength(1100)
  expect(result[1099]).toMatchObject({
    key: 'windows-2198-pane',
    fill: motif.fills[2198 % 1100]
  })
})

it.each(['cell-major', 'motif-major'])(
  'expands 3000 surface motifs with explicit geometry equivalence and %s order',
  (order) => {
    const boundary = [
      { x: -50, y: 0, z: 0 },
      { x: 50, y: 0, z: 0 },
      { x: 40, y: 0, z: 300 },
      { x: -40, y: 0, z: 300 }
    ]
    const motifs = Array.from({ length: 4 }, (_, index) => ({
      key: `m${index}`,
      name: `Motif ${index}`,
      fill: index % 2 ? '#123456' : '#654321',
      vertices: [
        { u: 0.1 + index * 0.02, v: 0.1 },
        { u: 0.8, v: 0.1 },
        { u: 0.8, v: 0.8 },
        { u: 0.1 + index * 0.02, v: 0.8 }
      ]
    }))
    const grid = {
      type: 'surface-grid',
      key: 'facade',
      name: 'Facade',
      boundary,
      rows: 30,
      columns: 25,
      motifs,
      order
    }
    const map = (u: number, v: number) => ({
      x: -50 + 10 * v + (100 - 20 * v) * u,
      y: 0,
      z: 300 * v
    })
    const cells = Array.from({ length: 750 }, (_, i) => i)
    const pairs =
      order === 'cell-major'
        ? cells.flatMap((cell) => motifs.map((motif) => ({ cell, motif })))
        : motifs.flatMap((motif) => cells.map((cell) => ({ cell, motif })))
    const explicit = pairs.map(({ cell, motif }) => ({
      type: 'projected-face',
      key: `facade-${cell}-${motif.key}`,
      name: `Facade - ${cell + 1} - ${motif.name}`,
      fill: motif.fill,
      vertices: motif.vertices.map(({ u, v }) =>
        map(((cell % 25) + u) / 25, (Math.floor(cell / 25) + v) / 30)
      )
    }))
    const make = (children: unknown[]) => ({
      ...draft(children),
      type: 'group',
      width: undefined,
      height: undefined
    })
    const actual = constructDesign(make([grid]), 'stable')
    const expected = constructDesign(make(explicit), 'stable')
    const a = actual.draft.children as {
      key: string
      name: string
      fill: unknown
      x: number
      y: number
      width: number
      height: number
      rings: { x: number; y: number }[][]
    }[]
    const b = expected.draft.children as {
      key: string
      name: string
      fill: unknown
      x: number
      y: number
      width: number
      height: number
      rings: { x: number; y: number }[][]
    }[]
    expect(a).toHaveLength(3000)
    for (let i = 0; i < a.length; i++) {
      expect({ key: a[i].key, name: a[i].name, fill: a[i].fill }).toEqual({
        key: b[i].key,
        name: b[i].name,
        fill: b[i].fill
      })
      for (const field of ['x', 'y', 'width', 'height'] as const)
        expect(a[i][field]).toBeCloseTo(b[i][field], 9)
      for (let j = 0; j < 4; j++) {
        expect(a[i].rings[0][j].x).toBeCloseTo(b[i].rings[0][j].x, 9)
        expect(a[i].rings[0][j].y).toBeCloseTo(b[i].rings[0][j].y, 9)
      }
    }
    expect(actual.sourceWork.projectionCalls).toBe(4)
    expect(actual.sourceWork.pathCommands).toBe(20)
    expect(JSON.stringify(grid).length).toBeLessThan(
      JSON.stringify(explicit).length / 100
    )
  }
)

it('preserves all 3000 recorded facade faces, per-cell materials and interleaved offset trims', () => {
  const grids = [0, 1].map((side) => {
    const orient = (x: number, y: number, z: number) =>
      side === 0 ? { x, y, z } : { x: y, y: x, z }
    return {
      type: 'surface-grid',
      key: `side${side}`,
      name: 'Facade',
      rows: 25,
      columns: 30,
      order: 'cell-major',
      boundary: [
        orient(3178, -2915, 0),
        orient(3178, 2915, 0),
        orient(2403, 2140, 11000),
        orient(2403, -2140, 11000)
      ],
      motifs: [
        {
          key: 'glass',
          name: 'Glass',
          fills: recordedFacade.faces
            .filter((f) => f.key.startsWith(`basefineg${side}-`))
            .map((f) => f.fill),
          vertices: [
            { u: 0.055, v: 65 / 440 },
            { u: 0.945, v: 65 / 440 },
            { u: 0.945, v: 385 / 440 },
            { u: 0.055, v: 385 / 440 }
          ]
        },
        {
          key: 'trim',
          name: 'Trim',
          fill: { template: 'edge' },
          offset: orient(2, 0, 0),
          vertices: [
            { u: 0.055, v: 378 / 440 },
            { u: 0.945, v: 378 / 440 },
            { u: 0.945, v: 385 / 440 },
            { u: 0.055, v: 385 / 440 }
          ]
        }
      ]
    }
  })
  const envelope = (children: unknown[]) => ({
    type: 'group',
    name: 'Recorded facade',
    projection: recordedFacade.projection,
    fillTemplates: recordedFacade.fillTemplates,
    children
  })
  const source = envelope(recordedFacade.faces)
  const compact = envelope(grids)
  const actual = constructDesign(compact, 'root')
  const expected = constructDesign(source, 'root')
  interface Vector {
    key: string
    fill: unknown
    x: number
    y: number
    width: number
    height: number
    rings: { x: number; y: number }[][]
  }
  const vectors = actual.draft.children as Vector[]
  const originals = expected.draft.children as Vector[]
  expect(vectors).toHaveLength(3000)
  for (let i = 0; i < vectors.length; i++) {
    const sourceKey = /^basefine(g|tr)([01])-(\d+)-(\d+)$/.exec(
      originals[i].key
    )
    if (!sourceKey) throw new Error('Recorded face key is invalid')
    const [, motif, side, row, column] = sourceKey
    expect(vectors[i].key).toBe(
      `side${side}-${Number(row) * 30 + Number(column)}-${motif === 'g' ? 'glass' : 'trim'}`
    )
    expect(vectors[i].fill).toEqual(originals[i].fill)
    for (const field of ['x', 'y', 'width', 'height'] as const)
      expect(vectors[i][field]).toBeCloseTo(originals[i][field], 8)
    for (let j = 0; j < 4; j++) {
      expect(vectors[i].rings[0][j].x).toBeCloseTo(
        originals[i].rings[0][j].x,
        8
      )
      expect(vectors[i].rings[0][j].y).toBeCloseTo(
        originals[i].rings[0][j].y,
        8
      )
    }
  }
  expect(actual.sourceWork.projectionCalls).toBe(12)
  expect(expected.sourceWork.projectionCalls).toBe(12000)
  expect(JSON.stringify(compact).length).toBeLessThan(
    JSON.stringify(source).length / 10
  )
})
