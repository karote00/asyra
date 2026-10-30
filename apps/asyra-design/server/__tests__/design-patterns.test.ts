import assert from 'node:assert/strict'
import compositionMaterials from './fixtures/recorded-101/composition-materials-20261022.json'
import componentSelection from './fixtures/recorded-101/component-selection-20261022.json'
import translatedComponent from './fixtures/recorded-101/translated-component-20261022.json'
import { describe, expect, it, vi } from 'vitest'
import recordedFacade from './fixtures/recorded-facade-grid.json'
import { inspectDesignBudget, measureDesignBudget } from '../design-budget'
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
    'separates admission snapshot projection and artifact reuse (%s)',
    async (mode) => {
      for (const count of [1, 100, 1000]) {
        const reads: string[] = []
        const coordinates = face().vertices
        const input = draft([
          {
            ...pattern(),
            faces: [
              {
                ...face(),
                get vertices() {
                  reads.push('vertices')
                  return coordinates
                }
              }
            ],
            axes: [{ count, step: { x: 1, y: 0, z: 0 } }]
          }
        ])
        Object.defineProperty(input, 'name', {
          enumerable: true,
          get() {
            reads.push('snapshot')
            return 'Facade'
          }
        })
        const original = structuredClone(input)
        reads.length = 0
        expect(measureDesignBudget(input).observed).toMatchObject({
          sourceNodes: 2,
          expandedNodes: count + 1,
          sourcePathCommands: 4,
          sourcePrimitivePathCommands: 4,
          expandedPathCommands: count * 4
        })
        expect(reads).toEqual(['vertices'])
        reads.length = 0
        const compile = vi.fn(prepareDesign)
        const session = createDesignPreparationSession(
          compile,
          async (_signal, ...args) => compile(...args)
        )
        const receipt =
          mode === 'sync'
            ? session.prepare(input)
            : await session.prepareAsync(input, new AbortController().signal)
        // Admission reads once before the snapshot reads each caller property once.
        expect(reads).toEqual(['vertices', 'snapshot', 'vertices'])
        // Four template vertices, one shared zero, then one offset per instance.
        expect(receipt.sourceWork?.projectionCalls).toBe(4 + 1 + count)
        expect(receipt.sourceWork).toMatchObject({ nodes: 2, pathCommands: 4 })
        const recipe = session.recipe(receipt.artifactId).recipe
        expect(Object.isFrozen(recipe)).toBe(true)
        expect(recipe).toEqual(original)
        const artifact = session.resolve(receipt.artifactId)
        expect(artifact).toEqual(prepareDesign(original, receipt.artifactId))
        expect(artifact.entries).toHaveLength(count + 1)
        expect(compile).toHaveBeenCalledOnce()
        coordinates[0].x = 2
        for (let i = 0; i < 3; i++) {
          expect(session.resolve(receipt.artifactId)).toBe(artifact)
          expect(session.recipe(receipt.artifactId).recipe).toBe(recipe)
        }
        expect(reads).toEqual(['vertices', 'snapshot', 'vertices'])
        expect(recipe).toEqual(original)
        const next =
          mode === 'sync'
            ? session.prepare(input)
            : await session.prepareAsync(input, new AbortController().signal)
        expect(compile).toHaveBeenCalledTimes(2)
        expect(reads).toEqual([
          'vertices',
          'snapshot',
          'vertices',
          'vertices',
          'snapshot',
          'vertices'
        ])
        expect(session.resolve(receipt.artifactId)).toBe(artifact)
        expect(session.recipe(next.artifactId).recipe).not.toEqual(original)
        expect(session.resolve(next.artifactId)).toEqual(
          prepareDesign(session.recipe(next.artifactId).recipe, next.artifactId)
        )
        expect(() =>
          createDesignPreparationSession().resolve(receipt.artifactId)
        ).toThrow()
        session.release([receipt.artifactId])
        expect(() => session.resolve(receipt.artifactId)).toThrow()
        expect(compile).toHaveBeenCalledTimes(2)
      }
    }
  )
  it.each(['sync', 'async'] as const)(
    'rejects excess before snapshot or compilation and preserves valid artifacts (%s)',
    async (mode) => {
      const reads: string[] = []
      const compile = vi.fn(prepareDesign)
      const session = createDesignPreparationSession(
        compile,
        async (_signal, ...args) => compile(...args)
      )
      const good = session.prepare(draft([pattern()]))
      const retained = session.resolve(good.artifactId)
      const input = draft([
        {
          ...pattern(),
          axes: [{ count: 10000, step: { x: 1, y: 0, z: 0 } }],
          faces: [
            {
              ...face(),
              get vertices() {
                reads.push('vertices')
                return face().vertices
              }
            }
          ]
        }
      ])
      Object.defineProperty(input, 'name', {
        enumerable: true,
        get() {
          reads.push('snapshot')
          return 'Rejected'
        }
      })
      if (mode === 'sync') expect(() => session.prepare(input)).toThrow()
      else
        await expect(
          session.prepareAsync(input, new AbortController().signal)
        ).rejects.toThrow()
      expect(reads).toEqual(['vertices'])
      expect(compile).toHaveBeenCalledOnce()
      expect(session.resolve(good.artifactId)).toBe(retained)
      reads.length = 0
      const cancelled = new AbortController()
      cancelled.abort(new Error('Cancelled before admission'))
      await expect(
        session.prepareAsync(input, cancelled.signal)
      ).rejects.toThrow('Cancelled before admission')
      expect(reads).toEqual([])
      expect(compile).toHaveBeenCalledOnce()
    }
  )
  it('measures unequal and malformed face collections without expanding or losing primitive limits', () => {
    const vertices = [face().vertices, face().vertices.slice(0, 3)]
    const reads = [vi.fn(() => vertices[0]), vi.fn(() => vertices[1])]
    const input = draft([
      {
        ...pattern(),
        faces: reads.map((read) => ({
          get vertices() {
            return read()
          }
        }))
      }
    ])
    expect(measureDesignBudget(input).observed).toMatchObject({
      sourceNodes: 3,
      sourcePathCommands: 7,
      sourcePrimitivePathCommands: 4,
      expandedNodes: 13,
      expandedPathCommands: 42
    })
    reads.forEach((read) => expect(read).toHaveBeenCalledOnce())
    for (const faces of [
      [],
      [null, {}, { vertices: null }, { vertices: 'invalid' }]
    ]) {
      const result = measureDesignBudget(draft([{ ...pattern(), faces }]))
      expect(result.observed).toMatchObject({
        expandedNodes: 1 + faces.length * 6,
        sourcePathCommands: 0,
        sourcePrimitivePathCommands: 0,
        expandedPathCommands: 0
      })
      expect(() => prepareDesign(draft([{ ...pattern(), faces }]))).toThrow()
    }
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

it('preserves every saved ornament contour, material and painter position with explicit compact correspondence', async (context) => {
  const { recordedOrnaments } = await import('./recorded-ornaments')
  const { admitPreparedDesign } =
    await import('../../src/ai/prepared-design-admission')
  const { input, output, compact, correspondence, inputBytes } =
    recordedOrnaments()
  const original = structuredClone(input)
  const before = constructDesign(input.draft),
    after = constructDesign(compact)
  const expected = before.draft.children as Record<string, unknown>[]
  const actual = after.draft.children as Record<string, unknown>[]
  const budget = 64 * Number.EPSILON * 100000
  // The coordinate contract bounds both world/projected values to 100,000.
  const close = (a: unknown, b: unknown): void => {
    if (typeof a === 'number' && typeof b === 'number')
      assert.ok(Math.abs(a - b) <= budget)
    else if (Array.isArray(a) && Array.isArray(b)) {
      assert.equal(a.length, b.length)
      a.forEach((v, i) => close(v, b[i]))
    } else if (a && b && typeof a === 'object' && typeof b === 'object') {
      assert.deepEqual(Object.keys(a), Object.keys(b))
      for (const k of Object.keys(a))
        close(
          (a as Record<string, unknown>)[k],
          (b as Record<string, unknown>)[k]
        )
    } else assert.deepEqual(a, b)
  }
  expect(actual).toHaveLength(output.elementCount - 1)
  expect(before.sourceWork.projectionCalls).toBe(
    output.sourceWork.projectionCalls
  )
  expect(before.sourceWork.expansionWork.pathCommands).toBe(
    output.sourceWork.pathCommands
  )
  input.draft.children.forEach((face, index) => {
    const prototype = compact.children[0].faces[index % 44]
    expect(face.key).toBe(correspondence[index].original)
    expect(face.fill).toEqual(prototype.fill)
    expect(face.vertices).toHaveLength(prototype.vertices.length)
    face.vertices.forEach((v, j) =>
      close(v, {
        ...prototype.vertices[j],
        z: prototype.vertices[j].z + Math.floor(index / 44) * 3500
      })
    )
    expect(actual[index].key).toBe(correspondence[index].compact)
    for (const k of ['type', 'x', 'y', 'width', 'height', 'rings', 'fill'])
      close(actual[index][k], expected[index][k])
  })
  const canonical = prepareDesign(compact)
  const explicit = prepareDesign(input.draft)
  expect(admitPreparedDesign(JSON.parse(JSON.stringify(canonical)))).toEqual(
    canonical
  )
  expect(canonical.entries).toHaveLength(explicit.entries.length)
  for (let i = 0; i < canonical.entries.length; i++) {
    const a = canonical.entries[i].descriptor,
      b = explicit.entries[i].descriptor
    for (const k of ['x', 'y', 'width', 'height']) close(a[k], b[k])
    if (i) {
      const { id: _a, ...fill } = (a.fills as { id: string }[])[0]
      const { id: _b, ...other } = (b.fills as { id: string }[])[0]
      close(fill, other)
    }
  }
  const ids = canonical.entries
    .slice(1)
    .map((e) => (e.descriptor.fills as { id: string }[])[0].id)
  expect(new Set(ids).size).toBe(352)
  expect(input).toEqual(original)
  expect(after.sourceWork.projectionCalls).toBeLessThan(
    before.sourceWork.projectionCalls
  )
  expect(after.sourceWork.expansionWork.pathCommands).toBe(
    before.sourceWork.expansionWork.pathCommands
  )
  const compactBytes = Buffer.byteLength(
    JSON.stringify({ ...input, draft: compact })
  )
  expect(compactBytes).toBeLessThan(inputBytes / 4)
  context.task.meta.representationWork = {
    inputBytes,
    compactBytes,
    originalProjections: before.sourceWork.projectionCalls,
    compactProjections: after.sourceWork.projectionCalls,
    expandedPoints: after.sourceWork.expansionWork.pathCommands,
    originalDraftBytes: Buffer.byteLength(JSON.stringify(input.draft)),
    compactDraftBytes: Buffer.byteLength(JSON.stringify(compact)),
    originalNativeBytes: Buffer.byteLength(JSON.stringify(explicit)),
    compactNativeBytes: Buffer.byteLength(JSON.stringify(canonical))
  }
})

const compactComponent = (count = 2) => ({
  ...translatedComponent.draft,
  children: [
    {
      type: 'pattern',
      key: 'component',
      name: 'Repeated component',
      origin: { x: 0, y: 0, z: 0 },
      axes: [{ count, step: { x: 0, y: 0, z: 3900 } }],
      members: translatedComponent.draft.children.slice(0, 15)
    }
  ]
})

// Numeric comparison includes every coordinate/control/fill component, not only bounds.
const equivalentValue = (actual: unknown, expected: unknown) => {
  if (typeof expected === 'number') {
    assert.equal(typeof actual, 'number')
    assert.ok(Math.abs((actual as number) - expected) < 0.5 * 10 ** -7)
  } else if (Array.isArray(expected)) {
    assert.ok(Array.isArray(actual))
    assert.equal(actual.length, expected.length)
    expected.forEach((value, index) =>
      equivalentValue((actual as unknown[])[index], value)
    )
  } else if (expected && typeof expected === 'object') {
    assert.deepEqual(
      Object.keys(actual as object).sort(),
      Object.keys(expected).sort()
    )
    for (const [key, value] of Object.entries(expected))
      equivalentValue((actual as Record<string, unknown>)[key], value)
  } else assert.deepEqual(actual, expected)
}

it('expands the recorded mixed component once per template with equivalent geometry and fewer input bytes', () => {
  const input = compactComponent()
  const before = structuredClone(input)
  expect(Buffer.byteLength(JSON.stringify(input))).toBeLessThan(
    Buffer.byteLength(JSON.stringify(translatedComponent.draft)) * 0.65
  )
  const actual = constructDesign(input, 'root')
  const explicit = constructDesign(translatedComponent.draft, 'root')
  const nodes = actual.draft.children as Record<string, unknown>[]
  const originals = explicit.draft.children as Record<string, unknown>[]
  expect(nodes).toHaveLength(1778)
  nodes.forEach(({ key, name, ...node }, index) => {
    const { key: _key, name: _name, ...expected } = originals[index]
    equivalentValue(node, expected)
    expect(key).toMatch(/^component-[01]-/)
    expect(name).toContain('Repeated component')
  })
  expect(new Set(nodes.map((node) => node.key)).size).toBe(nodes.length)
  expect(input).toEqual(before)
  const one = constructDesign(compactComponent(1), 'root')
  expect(actual.sourceWork.nodes).toBe(one.sourceWork.nodes)
  expect(actual.sourceWork.pathCommands).toBe(one.sourceWork.pathCommands)
  expect(actual.sourceWork.projectionCalls).toBe(
    one.sourceWork.projectionCalls + 1
  )
  expect(actual.sourceWork.projectionCalls).toBeLessThan(
    explicit.sourceWork.projectionCalls
  )
  const prepared = prepareDesign(input, 'mixed')
  expect(prepared.entries).toHaveLength(1779)
  expect(
    prepared.entries
      .slice(1)
      .every((entry) => entry.parentId === prepared.rootId)
  ).toBe(true)
})

it('budgets selected mixed components before compilation without treating them as one node', () => {
  const issue = inspectDesignBudget(compactComponent(20))
  expect(issue?.budget.observed.expandedNodes).toBe(17781)
  expect(issue?.budget.observed.expandedPathCommands).toBe(71120)
  expect(issue?.budget.lowerBound).toBe(false)
  const input = {
    ...compactComponent(20),
    children: [
      {
        ...compactComponent(20).children[0],
        instanceRanges: [{ start: 3, end: 5 }]
      }
    ]
  }
  expect(inspectDesignBudget(input)).toBeUndefined()
  const output = constructDesign(input, 'root').draft.children as {
    key: string
  }[]
  expect(output).toHaveLength(1778)
  expect(output[0].key).toContain('component-3-')
  expect(output.at(-1)?.key).toContain('component-4-')
})

const mixedGrid = (order: string) => ({
  type: 'surface-grid',
  key: 'grid',
  name: 'Grid',
  rows: 2,
  columns: 2,
  order,
  boundary: face().vertices,
  motifs: [
    {
      key: 'pane',
      name: 'Pane',
      fills: ['#224466', '#446688'],
      vertices: [
        { u: 0, v: 0 },
        { u: 1, v: 0 },
        { u: 1, v: 1 },
        { u: 0, v: 1 }
      ]
    },
    {
      key: 'trim',
      name: 'Trim',
      fill: '#aabbcc',
      offset: { x: 0, y: 1, z: 0 },
      vertices: [
        { u: 0, v: 0.8 },
        { u: 1, v: 0.8 },
        { u: 1, v: 1 },
        { u: 0, v: 1 }
      ]
    }
  ]
})

it.each(['cell-major', 'motif-major'])(
  'preserves mixed %s order, palette, offsets and translated world material with two axes and ranges',
  (order) => {
    const linearFields = {
      glass: {
        frame: 'world',
        start: { x: 0, y: 0, z: 0 },
        end: { x: 0, y: 0, z: 80 },
        gradientStops: [
          { position: 0, color: '#224466', opacity: 1 },
          { position: 1, color: '#aaccee', opacity: 1 }
        ]
      }
    }
    const { fill: _fill, ...worldFace } = face()
    const members = [
      { ...worldFace, type: 'projected-face', materialField: 'glass' },
      mixedGrid(order)
    ]
    const { faces: _faces, ...base } = pattern()
    const source = {
      ...base,
      origin: { x: 2, y: 3, z: 4 },
      members,
      instanceRanges: [{ start: 1, end: 4 }]
    }
    const input = { ...draft([source]), linearFields }
    const explicit = [1, 2, 3].flatMap((index) => {
      const offset = {
        x: 2 + Math.floor(index / 2) * 12,
        y: 3,
        z: 4 + (index % 2) * 12
      }
      const move = (p: { x: number; y: number; z: number }) => ({
        x: p.x + offset.x,
        y: p.y + offset.y,
        z: p.z + offset.z
      })
      return [
        {
          ...members[0],
          key: `face${index}`,
          vertices: worldFace.vertices.map(move)
        },
        {
          ...mixedGrid(order),
          key: `grid${index}`,
          boundary: face().vertices.map(move)
        }
      ]
    })
    const actual = constructDesign(input, 'root')
    const expected = constructDesign(
      { ...draft(explicit), linearFields },
      'root'
    )
    const a = actual.draft.children as Record<string, unknown>[]
    const b = expected.draft.children as Record<string, unknown>[]
    expect(a).toHaveLength(27)
    a.forEach(({ key, name: _name, ...node }, i) => {
      const { key: _key, name: _other, ...other } = b[i]
      equivalentValue(node, other)
      expect(key).toMatch(new RegExp(`^windows-${1 + Math.floor(i / 9)}-`))
    })
    expect(a[0].fill).not.toEqual(a[9].fill)
    expect(actual.sourceWork.nodes).toBeLessThan(expected.sourceWork.nodes)
  }
)

it.each([
  { faces: [face()] },
  { fills: ['#123456'] },
  { members: [] },
  { members: [pattern()] },
  { members: [{ type: 'group', key: 'g', name: 'Group', children: [] }] },
  { rotation: 20 },
  {
    members: [
      { ...face(), type: 'projected-face' },
      { ...face(), type: 'projected-face' }
    ]
  },
  {
    members: [
      { ...face(), key: 'grid-0-pane', type: 'projected-face' },
      mixedGrid('cell-major')
    ]
  }
])(
  'rejects ambiguous, nested, transformed or colliding mixed components %j',
  (patch) => {
    const input = compactComponent(1)
    expect(() =>
      constructDesign({
        ...input,
        children: [{ ...input.children[0], ...patch }]
      })
    ).toThrow()
  }
)

it('does not traverse unsupported recursive members in structural admission', () => {
  let member: unknown = pattern()
  for (let i = 0; i < 20000; i++)
    member = { ...pattern(), faces: undefined, members: [member] }
  expect(() => inspectDesignBudget(draft([member]))).not.toThrow()
  expect(() => constructDesign(draft([member]))).toThrow(/members support/)
})

it('preserves exact mixed object capacity, rejects excess and translated extent, and cancels without changing source', async () => {
  const input = compactComponent(2)
  const { faces: _faces, ...base } = pattern()
  const single = {
    ...base,
    axes: [{ count: 9999, step: { x: 0, y: 0, z: 0 } }],
    members: [{ ...face(), type: 'projected-face' }]
  }
  expect(inspectDesignBudget(draft([single]))).toBeUndefined()
  expect(constructDesign(draft([single])).draft.children).toHaveLength(9999)
  expect(
    inspectDesignBudget(
      draft([
        { ...single, axes: [{ count: 10000, step: { x: 0, y: 0, z: 0 } }] }
      ])
    )
  ).toMatchObject({ code: 'DESIGN_BUDGET_EXCEEDED' })
  expect(() =>
    constructDesign({
      ...input,
      children: [{ ...input.children[0], origin: { x: 100000, y: 0, z: 0 } }]
    })
  ).toThrow(/extent/)
  const before = structuredClone(input)
  const controller = new AbortController()
  const pending = constructDesignAsync(input, 'root', controller.signal)
  controller.abort(new Error('Cancelled mixed component'))
  await expect(pending).rejects.toThrow('Cancelled mixed component')
  expect(input).toEqual(before)
})

it('does not charge mixed grid templates twice against the expanded artifact budget', () => {
  const { faces: _faces, ...base } = pattern()
  const input = draft([
    {
      ...base,
      axes: [{ count: 2, step: { x: 20, y: 0, z: 0 } }],
      members: [
        { ...face(), type: 'projected-face' },
        {
          ...mixedGrid('cell-major'),
          rows: 1,
          columns: 4998,
          motifs: [mixedGrid('cell-major').motifs[0]]
        }
      ]
    },
    { type: 'rect', key: 'extra', name: 'Extra', width: 1, height: 1 }
  ])
  expect(inspectDesignBudget(input)).toBeUndefined()
  const result = constructDesign(input)
  expect(result.draft.children).toHaveLength(9999)
  expect(result.sourceWork.expansionWork.nodes).toBe(10000)
})

it('validates grid projected extent after component translation, like face templates', () => {
  const { faces: _faces, ...base } = pattern()
  const grid = mixedGrid('cell-major')
  const projection = {
    azimuth: 0,
    elevation: 0,
    scale: 1,
    originX: 50000,
    originY: 0
  }
  const source = {
    ...draft([
      {
        ...base,
        origin: { x: -80000, y: 0, z: 0 },
        axes: [{ count: 1, step: { x: 0, y: 0, z: 0 } }],
        members: [
          {
            ...grid,
            boundary: grid.boundary.map((p) => ({ ...p, x: p.x + 80000 }))
          }
        ]
      }
    ]),
    projection
  }
  const actual = constructDesign(source, 'root').draft.children as Record<
    string,
    unknown
  >[]
  const expected = constructDesign({ ...draft([grid]), projection }, 'root')
    .draft.children as Record<string, unknown>[]
  actual.forEach(({ key: _key, name: _name, ...node }, index) => {
    const { key: _other, name: _otherName, ...other } = expected[index]
    equivalentValue(node, other)
  })
})

it('preserves saved component layers, independent exceptions and bounded grid ranges', () => {
  const source = componentSelection.massing
  const compact = componentSelection.compactMassing
  const compare = (
    actual: ReturnType<typeof constructDesign>,
    expected: ReturnType<typeof constructDesign>
  ) => {
    const nodes = actual.draft.children as Record<string, unknown>[]
    const originals = expected.draft.children as Record<string, unknown>[]
    expect(nodes).toHaveLength(originals.length)
    nodes.forEach(({ key: _key, name: _name, ...node }, index) => {
      const {
        key: _originalKey,
        name: _originalName,
        ...original
      } = originals[index]
      equivalentValue(node, original)
    })
    expect(new Set(nodes.map((node) => node.key)).size).toBe(nodes.length)
  }
  const before = structuredClone(componentSelection)
  compare(constructDesign(compact, 'root'), constructDesign(source, 'root'))
  expect(compact.children.slice(0, 6)).toEqual(source.children.slice(0, 6))
  expect(compact.children.slice(7)).toEqual(source.children.slice(78))
  expect(Buffer.byteLength(JSON.stringify(compact))).toBeLessThan(
    Buffer.byteLength(JSON.stringify(source)) * 0.5
  )
  const grids = componentSelection.compactGrids
  const expanded = {
    ...componentSelection.grids,
    children: componentSelection.grids.children.slice(2, 18)
  }
  expect(inspectDesignBudget(grids)?.budget.observed.expandedNodes).toBe(12801)
  expect(() => constructDesign(grids)).toThrow()
  expect(Buffer.byteLength(JSON.stringify(grids))).toBeLessThan(
    Buffer.byteLength(JSON.stringify(expanded)) * 0.3
  )
  for (const start of [0, 4]) {
    const bounded = {
      ...grids,
      children: [
        { ...grids.children[0], instanceRanges: [{ start, end: start + 4 }] }
      ]
    }
    expect(inspectDesignBudget(bounded)).toBeUndefined()
    compare(
      constructDesign(bounded, 'root'),
      constructDesign(
        {
          ...expanded,
          children: expanded.children.slice(start * 2, (start + 4) * 2)
        },
        'root'
      )
    )
  }
  expect(componentSelection).toEqual(before)
})

it('preserves recorded root materials and independent siblings around translated mixed members', () => {
  const original = compositionMaterials.draft
  const repeated = compositionMaterials.pattern
  const compact = {
    ...original,
    children: [
      ...original.children.slice(0, 7),
      repeated,
      ...original.children.slice(63)
    ]
  }
  const before = structuredClone(compositionMaterials)
  expect(inspectDesignBudget(original)?.budget.observed.expandedNodes).toBe(
    13117
  )
  expect(inspectDesignBudget(compact)?.budget.observed.expandedNodes).toBe(
    13117
  )
  expect(() => constructDesign(compact)).toThrow()
  expect(compact.children.slice(0, 7)).toEqual(original.children.slice(0, 7))
  expect(compact.children.slice(8)).toEqual(original.children.slice(63))
  expect(Buffer.byteLength(JSON.stringify(compact))).toBeLessThan(
    Buffer.byteLength(JSON.stringify(original)) * 0.5
  )
  const pairs = [
    {
      expected: original.children.slice(0, 35),
      actual: [
        ...original.children.slice(0, 7),
        { ...repeated, instanceRanges: [{ start: 0, end: 4 }] }
      ],
      count: 7033
    },
    {
      expected: original.children.slice(35),
      actual: [
        { ...repeated, instanceRanges: [{ start: 4, end: 8 }] },
        ...original.children.slice(63)
      ],
      count: 6083
    }
  ]
  for (const pair of pairs) {
    const source = { ...original, children: pair.actual }
    expect(inspectDesignBudget(source)).toBeUndefined()
    const actual = constructDesign(source, 'root').draft.children as Record<
      string,
      unknown
    >[]
    const expected = constructDesign(
      { ...original, children: pair.expected },
      'root'
    ).draft.children as Record<string, unknown>[]
    expect(actual).toHaveLength(pair.count)
    expect(actual).toHaveLength(expected.length)
    actual.forEach(({ key: _key, name: _name, ...node }, index) => {
      const { key: _oldKey, name: _oldName, ...other } = expected[index]
      equivalentValue(node, other)
    })
    expect(new Set(actual.map((node) => node.key)).size).toBe(actual.length)
  }
  expect(compositionMaterials).toEqual(before)
  process.stdout.write(
    JSON.stringify({
      measurement: 'recorded-composition',
      originalBytes: Buffer.byteLength(JSON.stringify(original)),
      compactBytes: Buffer.byteLength(JSON.stringify(compact)),
      expandedNodes: 13117
    }) + '\n'
  )
})
