import { describe, expect, it } from 'vitest'
import recorded from './fixtures/recorded-101/material-field-20261019.json'
import {
  createDesignPreparationSession,
  prepareDesign
} from '../design-preparation'
import { admitPreparedDesign } from '../../src/ai/prepared-design-admission'
import type { DesignGradientData } from '../../src/ai/design-fill'

const stops = recorded.draft.fillTemplates.glassL.gradientStops
const field = {
  frame: 'world',
  start: { x: 0, y: 0, z: 0 },
  end: { x: 0, y: 0, z: 50800 },
  gradientStops: stops
}
const source = () => ({
  ...structuredClone(recorded.draft),
  linearFields: { glass: structuredClone(field) },
  children: recorded.draft.children.map(({ fill: _fill, ...face }) => ({
    ...structuredClone(face),
    materialField: 'glass'
  }))
})
const project = (p: { x: number; y: number; z: number }) => {
  const { azimuth, elevation, scale, originX, originY } =
    recorded.draft.projection
  const a = (azimuth * Math.PI) / 180,
    e = (elevation * Math.PI) / 180
  return {
    x: originX + scale * (Math.cos(a) * p.x - Math.sin(a) * p.y),
    y:
      originY +
      scale *
        (Math.sin(e) * (Math.sin(a) * p.x + Math.cos(a) * p.y) -
          Math.cos(e) * p.z)
  }
}
const phase = (g: DesignGradientData, x: number, y: number) => {
  const [s, e] = g.gradientHandles,
    dx = e.x - s.x,
    dy = e.y - s.y
  return ((x - s.x) * dx + (y - s.y) * dy) / (dx * dx + dy * dy)
}
const gradient = (entry: ReturnType<typeof prepareDesign>['entries'][number]) =>
  (entry.descriptor.fills as { gradient: DesignGradientData }[])[0].gradient

describe('world material preparation through native artifact admission', () => {
  it('maps recorded first and later glass faces to one world field instead of restarting each local box', () => {
    const original = prepareDesign(recorded.draft)
    expect(gradient(original.entries[1])).toEqual(gradient(original.entries[2]))
    const draft = source(),
      before = structuredClone(draft)
    const prepared = prepareDesign(draft)
    expect(admitPreparedDesign(JSON.parse(JSON.stringify(prepared)))).toEqual(
      prepared
    )
    expect(draft).toEqual(before)
    recorded.draft.children.forEach((face, i) => {
      const points = face.vertices.map(project),
        xs = points.map((p) => p.x),
        ys = points.map((p) => p.y)
      const x = Math.min(...xs),
        y = Math.min(...ys),
        w = Math.max(...xs) - x,
        h = Math.max(...ys) - y
      points.forEach((p, j) =>
        expect(
          phase(gradient(prepared.entries[i + 1]), (p.x - x) / w, (p.y - y) / h)
        ).toBeCloseTo(face.vertices[j].z / 50800, 9)
      )
    })
    expect(gradient(prepared.entries[1])).not.toEqual(
      gradient(prepared.entries[2])
    )
  })
  it('rejects conflicting fill intent before creating an artifact', () => {
    const draft = source()
    Object.assign(draft.children[0], { fill: '#ffffff' })
    expect(() => prepareDesign(draft)).toThrow(
      /materialField.*fill|fill.*materialField/
    )
  })
})

it('preserves world phase across translated templates with independent Fill identities', async () => {
  const compiler = await import('../design-linear-field')
  const { vi } = await import('vitest')
  const compiled = vi.spyOn(compiler, 'createLinearFieldFill')
  const face = {
    key: 'wall',
    name: 'Wall',
    materialField: 'glass',
    vertices: [
      { x: 0, y: 0, z: 0 },
      { x: 20, y: 0, z: 0 },
      { x: 20, y: 0, z: 10 },
      { x: 0, y: 0, z: 10 }
    ]
  }
  const draft = {
    type: 'group',
    name: 'Repeated',
    projection: {
      azimuth: 0,
      elevation: 30,
      scale: 2,
      originX: -200,
      originY: 100
    },
    linearFields: { glass: { ...field, end: { x: 0, y: 0, z: 30 } } },
    children: [
      {
        type: 'pattern',
        key: 'p',
        name: 'Pattern',
        origin: { x: 0, y: 0, z: 0 },
        axes: [{ count: 3, step: { x: 0, y: 0, z: 10 } }],
        faces: [face]
      }
    ]
  }
  try {
    const result = prepareDesign(draft)
    expect(compiled).toHaveBeenCalledTimes(1)
    result.entries.slice(1).forEach((entry, i) => {
      expect(phase(gradient(entry), 0.5, 0.5)).toBeCloseTo(
        (i * 10 + 5) / 30,
        10
      )
    })
    for (let i = 1; i < 3; i++)
      expect(phase(gradient(result.entries[i]), 0.5, 0)).toBeCloseTo(
        phase(gradient(result.entries[i + 1]), 0.5, 1),
        10
      )
    const ids = result.entries
      .slice(1)
      .map((e) => (e.descriptor.fills as { id: string }[])[0].id)
    expect(new Set(ids).size).toBe(3)
    expect(admitPreparedDesign(JSON.parse(JSON.stringify(result)))).toEqual(
      JSON.parse(JSON.stringify(result))
    )
  } finally {
    compiled.mockRestore()
  }
})

it.each([
  [
    'missing key',
    (d: ReturnType<typeof source>) => {
      d.children[0].materialField = 'absent'
    }
  ],
  [
    'zero direction',
    (d: ReturnType<typeof source>) => {
      d.linearFields.glass.end = { ...d.linearFields.glass.start }
    }
  ],
  [
    'nonfinite',
    (d: ReturnType<typeof source>) => {
      d.linearFields.glass.end.x = Infinity
    }
  ],
  [
    'wrong frame',
    (d: ReturnType<typeof source>) => {
      d.linearFields.glass.frame = 'camera'
    }
  ],
  [
    'unordered stops',
    (d: ReturnType<typeof source>) => {
      d.linearFields.glass.gradientStops.reverse()
    }
  ],
  [
    'unknown field',
    (d: ReturnType<typeof source>) => {
      Object.assign(d.linearFields.glass, { extra: true })
    }
  ]
])('rejects %s without changing the caller source', (_name, change) => {
  const d = source()
  change(d)
  const before = structuredClone(d)
  expect(() => prepareDesign(d)).toThrow(/linear material field/)
  expect(d).toEqual(before)
})

it('samples a constant planar field with opacity and right-hand hard-stop semantics', () => {
  const d = source()
  d.linearFields.glass = {
    frame: 'world',
    start: { x: 0, y: 0, z: 0 },
    end: { x: 0, y: 5000, z: 0 },
    gradientStops: [
      { position: 0, color: '#000000', opacity: 0 },
      { position: 0.5, color: '#ff0000', opacity: 0.2 },
      { position: 0.5, color: '#00ff00', opacity: 0.7 },
      { position: 1, color: '#ffffff', opacity: 1 }
    ]
  }
  // Both recorded facade planes have y=2500, giving a constant phase of 0.5.
  d.children.forEach((face) =>
    face.vertices.forEach((p) => {
      p.y = 2500
    })
  )
  const result = prepareDesign(d)
  result.entries.slice(1).forEach((entry) =>
    expect(gradient(entry).gradientStops).toEqual([
      { position: 0, color: '#00ff00', opacity: 0.7 },
      { position: 1, color: '#00ff00', opacity: 0.7 }
    ])
  )
})

it('reverses a field without changing geometry or borrowing shared Fill identities', () => {
  const d = source(),
    original = prepareDesign(d, 'same')
  const start = d.linearFields.glass.start
  d.linearFields.glass.start = d.linearFields.glass.end
  d.linearFields.glass.end = start
  const reversed = prepareDesign(d, 'same')
  original.entries.slice(1).forEach((e, i) => {
    expect(phase(gradient(reversed.entries[i + 1]), 0.3, 0.7)).toBeCloseTo(
      1 - phase(gradient(e), 0.3, 0.7),
      10
    )
    for (const key of ['x', 'y', 'width', 'height', 'points', 'segments'])
      expect(reversed.entries[i + 1].descriptor[key]).toEqual(e.descriptor[key])
  })
})

it('keeps advertised field exclusivity equivalent at canonical and native schema boundaries', async () => {
  const { projectedFaceSchema, designPatternSchema } =
    await import('../design-construction-schema')
  const { nativeToolInputSchema, operationInputIssue } =
    await import('../operation-input-schema')
  const face = source().children[0]
  const pattern = {
    type: 'pattern',
    key: 'p',
    name: 'Faces',
    origin: { x: 0, y: 0, z: 0 },
    axes: [{ count: 1, step: { x: 0, y: 0, z: 0 } }],
    faces: [
      {
        key: face.key,
        name: face.name,
        vertices: face.vertices,
        materialField: 'glass'
      }
    ]
  }
  for (const transform of [(s: unknown) => s, nativeToolInputSchema]) {
    expect(
      operationInputIssue(face, transform(projectedFaceSchema))
    ).toBeUndefined()
    expect(
      operationInputIssue(
        { ...face, fill: '#ffffff' },
        transform(projectedFaceSchema)
      )
    ).toBeDefined()
    expect(
      operationInputIssue(pattern, transform(designPatternSchema))
    ).toBeUndefined()
    expect(
      operationInputIssue(
        { ...pattern, fills: ['#ffffff'] },
        transform(designPatternSchema)
      )
    ).toBeDefined()
    expect(
      operationInputIssue(
        { ...pattern, faces: [{ ...pattern.faces[0], fill: '#ffffff' }] },
        transform(designPatternSchema)
      )
    ).toBeDefined()
  }
  expect(() =>
    prepareDesign({
      ...source(),
      children: [{ ...pattern, fills: ['#ffffff'] }]
    })
  ).toThrow(/materialField conflicts/)
})

it.each([
  [-10, '#000000', 0],
  [0, '#000000', 0],
  [2500, '#808080', 0.5],
  [5000, '#ffffff', 1],
  [6000, '#ffffff', 1]
])(
  'samples constant field at world y=%s with native stop clamping',
  (y, color, opacity) => {
    const d = source()
    d.linearFields.glass = {
      frame: 'world',
      start: { x: 0, y: 0, z: 0 },
      end: { x: 0, y: 5000, z: 0 },
      gradientStops: [
        { position: 0, color: '#000000', opacity: 0 },
        { position: 1, color: '#ffffff', opacity: 1 }
      ]
    }
    d.children.forEach((f) =>
      f.vertices.forEach((p) => {
        p.y = y
      })
    )
    const result = prepareDesign(d)
    for (const e of result.entries.slice(1))
      expect(gradient(e).gradientStops).toEqual([
        { position: 0, color, opacity },
        { position: 1, color, opacity }
      ])
  }
)

it('keeps field phase invariant under camera translation and uniform scale', () => {
  const d = source(),
    original = prepareDesign(d)
  d.projection = { ...d.projection, scale: 0.04, originX: -300, originY: 700 }
  const changed = prepareDesign(d)
  for (let i = 1; i < original.entries.length; i++)
    for (const [x, y] of [
      [0, 0],
      [0.2, 0.7],
      [1, 1]
    ])
      expect(phase(gradient(changed.entries[i]), x, y)).toBeCloseTo(
        phase(gradient(original.entries[i]), x, y),
        9
      )
})

it('rejects unrepresentable native handles and unsupported nodes without fallback paint', () => {
  const d = source()
  d.linearFields.glass.end.z = 100000
  d.children = [
    {
      ...d.children[0],
      vertices: [
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 0, z: 0 },
        { x: 10, y: 0, z: 0.001 },
        { x: 0, y: 0, z: 0.001 }
      ]
    }
  ]
  expect(() => prepareDesign(d)).toThrow(/native bounded handles/)
  expect(() =>
    prepareDesign({
      ...source(),
      children: [
        {
          type: 'rectangle',
          key: 'r',
          name: 'Rectangle',
          width: 10,
          height: 10,
          materialField: 'glass'
        }
      ]
    })
  ).toThrow()
})

it('cancels real field expansion and retries through the same owner without publishing partial output', async () => {
  const { constructDesignAsync } = await import('../design-construction')
  const draft = {
    type: 'group',
    name: 'Field cancellation',
    projection: { azimuth: 0, elevation: 30, scale: 1, originX: 0, originY: 0 },
    linearFields: { glass: { ...field, end: { x: 0, y: 0, z: 4000 } } },
    children: [
      {
        type: 'pattern',
        key: 'p',
        name: 'Panels',
        origin: { x: 0, y: 0, z: 0 },
        axes: [{ count: 2200, step: { x: 0, y: 0, z: 1 } }],
        faces: [
          {
            key: 'f',
            name: 'Panel',
            materialField: 'glass',
            vertices: [
              { x: 0, y: 0, z: 0 },
              { x: 10, y: 0, z: 0 },
              { x: 10, y: 0, z: 1 },
              { x: 0, y: 0, z: 1 }
            ]
          }
        ]
      }
    ]
  }
  const before = structuredClone(draft),
    controller = new AbortController()
  const pending = constructDesignAsync(
    draft,
    'cancelled-root',
    controller.signal
  )
  setImmediate(() => controller.abort(new Error('Cancelled field expansion')))
  await expect(pending).rejects.toThrow('Cancelled field expansion')
  expect(draft).toEqual(before)
  const retried = prepareDesign(draft)
  expect(retried.entries).toHaveLength(2201)
  expect(phase(gradient(retried.entries[2200]), 0.5, 0.5)).toBeCloseTo(
    2199.5 / 4000,
    9
  )
  expect(admitPreparedDesign(JSON.parse(JSON.stringify(retried)))).toEqual(
    JSON.parse(JSON.stringify(retried))
  )
})

it('evaluates native handle bounds at actual pattern placement rather than an unused template origin', () => {
  const draft = {
    type: 'group',
    name: 'Placed field',
    projection: { azimuth: 0, elevation: 30, scale: 1, originX: 0, originY: 0 },
    linearFields: {
      glass: {
        ...field,
        start: { x: 0, y: 0, z: 99990 },
        end: { x: 0, y: 0, z: 100000 }
      }
    },
    children: [
      {
        type: 'pattern',
        key: 'p',
        name: 'Panel',
        origin: { x: 0, y: 0, z: 99990 },
        axes: [{ count: 1, step: { x: 0, y: 0, z: 0 } }],
        faces: [
          {
            key: 'f',
            name: 'Face',
            materialField: 'glass',
            vertices: [
              { x: 0, y: 0, z: 0 },
              { x: 10, y: 0, z: 0 },
              { x: 10, y: 0, z: 1 },
              { x: 0, y: 0, z: 1 }
            ]
          }
        ]
      }
    ]
  }
  const result = prepareDesign(draft)
  expect(phase(gradient(result.entries[1]), 0.5, 0.5)).toBeCloseTo(0.05, 9)
  expect(admitPreparedDesign(JSON.parse(JSON.stringify(result)))).toEqual(
    JSON.parse(JSON.stringify(result))
  )
})

it('preserves intentionally separate material domains instead of forcing every facade to share one field', () => {
  const original = source()
  const draft = {
    ...original,
    linearFields: {
      ...original.linearFields,
      trim: {
        ...field,
        gradientStops: [
          { position: 0, color: '#ff0000', opacity: 0.2 },
          { position: 1, color: '#ff0000', opacity: 0.2 }
        ]
      }
    },
    children: original.children.map((f, i) => ({
      ...f,
      materialField: i ? 'trim' : 'glass'
    }))
  }
  const result = prepareDesign(draft),
    baseline = prepareDesign(original)
  expect(gradient(result.entries[1])).toEqual(gradient(baseline.entries[1]))
  expect(gradient(result.entries[2]).gradientStops).toEqual(
    draft.linearFields.trim.gradientStops
  )
  expect(
    (result.entries[1].descriptor.fills as { id: string }[])[0].id
  ).not.toBe((result.entries[2].descriptor.fills as { id: string }[])[0].id)
})

it.each([false, true])(
  'preserves an exactly constant oblique plane without normalization residuals - pattern %s',
  (pattern) => {
    const face = {
      key: 'wall',
      name: 'Oblique wall',
      materialField: 'glass',
      vertices: [
        { x: 0.5, y: 0.5, z: 5.5 },
        { x: 11.5, y: 0.5, z: 4.5 },
        { x: 11.5, y: 11.5, z: 3.5 },
        { x: 0.5, y: 11.5, z: 4.5 }
      ]
    }
    // Every vertex has x + y + 11*z = 61.5, exactly half of |(1,1,11)|^2.
    const draft = {
      type: 'group',
      name: 'Oblique constant material',
      projection: {
        azimuth: 35,
        elevation: 28,
        scale: 2,
        originX: 0,
        originY: 0
      },
      linearFields: {
        glass: {
          frame: 'world',
          start: { x: 0, y: 0, z: 0 },
          end: { x: 1, y: 1, z: 11 },
          gradientStops: [
            { position: 0, color: '#000000', opacity: 0 },
            { position: 1, color: '#ffffff', opacity: 1 }
          ]
        }
      },
      children: pattern
        ? [
            {
              type: 'pattern',
              key: 'p',
              name: 'Panels',
              origin: { x: 0, y: 0, z: 0 },
              axes: [{ count: 2, step: { x: 1, y: 1, z: 11 } }],
              faces: [face]
            }
          ]
        : [{ ...face, type: 'projected-face' }]
    }
    const prepared = prepareDesign(draft)
    expect(admitPreparedDesign(JSON.parse(JSON.stringify(prepared)))).toEqual(
      prepared
    )
    expect(gradient(prepared.entries[1]).gradientStops).toEqual([
      { position: 0, color: '#808080', opacity: 0.5 },
      { position: 1, color: '#808080', opacity: 0.5 }
    ])
    if (pattern)
      expect(gradient(prepared.entries[2]).gradientStops).toEqual([
        { position: 0, color: '#ffffff', opacity: 1 },
        { position: 1, color: '#ffffff', opacity: 1 }
      ])
    // A real weak slope is not silently snapped to constant paint.
    draft.linearFields.glass.end.z += 1e-10
    expect(() => prepareDesign(draft)).toThrow(/native bounded handles/)
  }
)

it('preserves two-axis world phase and source order when recovering sparse instances at a nonzero origin', () => {
  const faces = [0, 20].map((x, index) => ({
    key: `face-${index}`,
    name: 'Independent glass',
    materialField: 'glass',
    vertices: [
      { x, y: 0, z: 0 },
      { x: x + 8, y: 0, z: 0 },
      { x: x + 8, y: 0, z: 10 },
      { x, y: 0, z: 10 }
    ]
  }))
  const pattern = {
    type: 'pattern',
    key: 'p',
    name: 'Two-axis panels',
    origin: { x: 7, y: 3, z: 11 },
    axes: [
      { count: 3, step: { x: 12, y: 0, z: 2 } },
      { count: 2, step: { x: 1, y: 0, z: 15 } }
    ],
    faces
  }
  const draft = {
    type: 'group',
    name: 'Sparse field recovery',
    projection: {
      azimuth: 0,
      elevation: 30,
      scale: 2,
      originX: -200,
      originY: 100
    },
    linearFields: {
      glass: {
        ...field,
        start: { x: -10, y: 0, z: -20 },
        end: { x: 90, y: 0, z: 80 }
      }
    },
    children: [pattern]
  }
  const session = createDesignPreparationSession()
  const receipt = session.prepare(draft)
  const full = session.resolve(receipt.artifactId)
  const preserved = structuredClone(full)
  const ranges = [
    { start: 1, end: 3 },
    { start: 5, end: 6 }
  ]
  const sparseReceipt = session.prepare({
    ...draft,
    children: [{ ...pattern, instanceRanges: ranges }]
  })
  const sparse = session.resolve(sparseReceipt.artifactId)
  expect(sparse.entries.slice(1).map((e) => e.key)).toEqual(
    [1, 2, 5].flatMap((i) => faces.map((face) => `p-${i}-${face.key}`))
  )
  for (const entry of sparse.entries.slice(1)) {
    const original = full.entries.find((e) => e.key === entry.key)
    if (!original) throw new Error(`Missing original entry ${entry.key}`)
    expect(gradient(entry)).toEqual(gradient(original))
    const [, instance, , faceIndex] = entry.key.split('-')
    const i = Number(instance),
      face = faces[Number(faceIndex)]
    const offset = {
      x: 7 + Math.floor(i / 2) * 12 + (i % 2),
      z: 11 + Math.floor(i / 2) * 2 + (i % 2) * 15
    }
    face.vertices.forEach((point) => {
      const x = (point.x - face.vertices[0].x) / 8
      const y = 1 - point.z / 10
      const expected = (point.x + offset.x + 10 + point.z + offset.z + 20) / 200
      expect(phase(gradient(entry), x, y)).toBeCloseTo(expected, 10)
    })
  }
  expect(admitPreparedDesign(structuredClone(sparse))).toEqual(sparse)
  expect(() =>
    session.prepare({
      ...draft,
      children: [{ ...pattern, instanceRanges: [{ start: 2, end: 1 }] }]
    })
  ).toThrow()
  session.release([sparseReceipt.artifactId])
  expect(session.resolve(receipt.artifactId)).toEqual(preserved)
})

it.each(['facade', 'horizontal'] as const)(
  'recompiles a known palette with exact world color and opacity on %s faces',
  (kind) => {
    const draft = source()
    draft.linearFields.glass = {
      ...field,
      end: { x: 0, y: 0, z: 20000 },
      gradientStops: [
        { position: 0, color: '#000000', opacity: 0 },
        { position: 1, color: '#ffffff', opacity: 1 }
      ]
    }
    if (kind === 'horizontal')
      draft.children.forEach((face, index) => {
        face.vertices = [
          { x: -2000, y: 1000, z: 4000 + index * 8000 },
          { x: 2000, y: 1000, z: 4000 + index * 8000 },
          { x: 2000, y: 3000, z: 4000 + index * 8000 },
          { x: -2000, y: 3000, z: 4000 + index * 8000 }
        ]
      })
    const before = prepareDesign(draft)
    draft.linearFields.glass.gradientStops = [
      { position: 0, color: '#ff0000', opacity: 0.2 },
      { position: 1, color: '#0000ff', opacity: 0.8 }
    ]
    const after = prepareDesign(draft)
    expect(admitPreparedDesign(JSON.parse(JSON.stringify(after)))).toEqual(
      JSON.parse(JSON.stringify(after))
    )
    draft.children.forEach((face, index) => {
      const g = gradient(after.entries[index + 1])
      expect(g.gradientHandles).toEqual(
        gradient(before.entries[index + 1]).gradientHandles
      )
      const points = face.vertices.map(project)
      const minX = Math.min(...points.map((p) => p.x)),
        minY = Math.min(...points.map((p) => p.y))
      const width = Math.max(...points.map((p) => p.x)) - minX,
        height = Math.max(...points.map((p) => p.y)) - minY
      // Vertices and centroid cover edges plus the interior of rotated,
      // non-square projected faces. Native color is compared to world intent.
      const samples = [
        ...face.vertices,
        {
          x: face.vertices.reduce((n, p) => n + p.x, 0) / 4,
          y: face.vertices.reduce((n, p) => n + p.y, 0) / 4,
          z: face.vertices.reduce((n, p) => n + p.z, 0) / 4
        }
      ]
      for (const point of samples) {
        const projected = project(point)
        const t = Math.max(
          0,
          Math.min(
            1,
            phase(
              g,
              (projected.x - minX) / width,
              (projected.y - minY) / height
            )
          )
        )
        const [a, b] = g.gradientStops
        const channel = (color: string, offset: number) =>
          parseInt(color.slice(offset, offset + 2), 16)
        const expected = point.z / 20000
        expect(
          channel(a.color, 1) * (1 - t) + channel(b.color, 1) * t
        ).toBeCloseTo(255 * (1 - expected), 0)
        expect(
          channel(a.color, 5) * (1 - t) + channel(b.color, 5) * t
        ).toBeCloseTo(255 * expected, 0)
        expect(a.opacity * (1 - t) + b.opacity * t).toBeCloseTo(
          0.2 + 0.6 * expected,
          8
        )
      }
    })
    if (kind === 'horizontal') {
      const lower = gradient(after.entries[1]),
        upper = gradient(after.entries[2])
      expect(lower.gradientHandles).toEqual(upper.gradientHandles)
      expect(lower.gradientStops).not.toEqual(upper.gradientStops)
      // Identical native handles cannot recover different source phases.
      expect(gradient(before.entries[1]).gradientStops).not.toEqual(
        lower.gradientStops
      )
    }
  }
)

it('revises a retained world material without changing creation identities or unrelated source', async () => {
  const session = createDesignPreparationSession()
  const draft = source()
  const first = session.prepare(draft)
  const original = structuredClone(session.resolve(first.artifactId))
  const definition = {
    ...field,
    gradientStops: stops.map((stop) => ({ ...stop, color: '#eac490' }))
  }
  const revised = await session.reviseMaterial(
    first.artifactId,
    'glass',
    definition,
    new AbortController().signal
  )
  expect(revised.materialRevisionId).not.toBe(first.artifactId)
  const material = session.materialRevision(revised.materialRevisionId)
  expect(material.rootId).toBe(original.rootId)
  expect(material.updates.map((item) => item.elementId)).toEqual(
    original.entries.slice(1).map((entry) => entry.descriptor.id)
  )
  const changed = session.resolve(revised.materialRevisionId)
  changed.entries.forEach((entry, i) => {
    const { fills: _fills, ...geometry } = entry.descriptor
    const { fills: _before, ...before } = original.entries[i].descriptor
    expect(geometry).toEqual(before)
  })
  expect(session.resolve(first.artifactId)).toEqual(original)
  expect(session.recipe(first.artifactId).recipe).toEqual(draft)
  expect(
    session.withMaterialSource(
      { type: 'group', children: [] },
      revised.materialRevisionId
    )
  ).toMatchObject({ linearFields: { glass: definition } })
  expect(() =>
    session.withMaterialSource({ linearFields: {} }, revised.materialRevisionId)
  ).toThrow(/conflict/i)
  await expect(
    session.reviseMaterial(
      first.artifactId,
      'missing',
      definition,
      new AbortController().signal
    )
  ).rejects.toThrow(/field/i)
  const cancelled = new AbortController()
  cancelled.abort()
  await expect(
    session.reviseMaterial(
      first.artifactId,
      'glass',
      definition,
      cancelled.signal
    )
  ).rejects.toThrow()
  session.release([revised.materialRevisionId])
  expect(() => session.materialRevision(revised.materialRevisionId)).toThrow(
    /unavailable/i
  )
  expect(session.resolve(first.artifactId)).toEqual(original)
})

it('revises sampled constant-phase faces from their world source without normalizing phases', async () => {
  const draft = source()
  draft.linearFields.glass = { ...field, end: { x: 0, y: 0, z: 20000 } }
  draft.children.forEach((face, index) => {
    face.vertices = [
      { x: -2000, y: 1000, z: 4000 + index * 8000 },
      { x: 2000, y: 1000, z: 4000 + index * 8000 },
      { x: 2000, y: 3000, z: 4000 + index * 8000 },
      { x: -2000, y: 3000, z: 4000 + index * 8000 }
    ]
  })
  const session = createDesignPreparationSession()
  const first = session.prepare(draft)
  const definition = {
    ...draft.linearFields.glass,
    gradientStops: [
      { position: 0, color: '#ff0000', opacity: 0.2 },
      { position: 1, color: '#0000ff', opacity: 0.8 }
    ]
  }
  const revision = await session.reviseMaterial(
    first.artifactId,
    'glass',
    definition,
    new AbortController().signal
  )
  const updates = session.materialRevision(revision.materialRevisionId).updates
  expect(updates).toHaveLength(2)
  expect(updates[0].gradient).not.toEqual(updates[1].gradient)
  const expected = prepareDesign({
    ...draft,
    linearFields: { glass: definition }
  })
  updates.forEach((item, index) =>
    expect(item.gradient).toEqual(gradient(expected.entries[index + 1]))
  )
  expect(session.recipe(first.artifactId).recipe).toEqual(draft)
})
