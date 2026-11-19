import { expect, it, vi } from 'vitest'
import recorded from '../../test-data/ai-drawing/fixtures/strict-grid-material-20261106.json'
import { constructDesign } from '../design-construction'
import {
  prepareDesign,
  createDesignPreparationSession
} from '../design-preparation'
import { admitPreparedDesign } from '../../src/ai/prepared-design-admission'
import type { DesignGradientData } from '../../src/ai/design-fill'
import * as compiler from '../design-linear-field'
import {
  surfaceGridSchema,
  surfaceMotifsSchema
} from '../design-construction-schema'
import { operationInputIssue } from '../operation-input-schema'

interface PaintedNode {
  key: string
  fill: DesignGradientData
  x: number
  y: number
  width: number
  height: number
}

const stops = [
  { position: 0, color: '#123456', opacity: 0.2 },
  { position: 1, color: '#abcdef', opacity: 0.9 }
]

it('declares conflicting paint modes on motifs and override patches before execution', () => {
  const motif = {
    ...recorded.draft.motifTemplates.window[0],
    materialField: 'glass'
  }

  expect(operationInputIssue([motif], surfaceMotifsSchema)).toBeDefined()
  const reference = surfaceGridSchema.properties.motifs.anyOf[1]

  expect(
    operationInputIssue(
      {
        template: 'window',
        overrides: { glass: { materialField: 'glass', fill: '#123456' } }
      },
      reference
    )
  ).toBeDefined()
  expect(
    operationInputIssue(
      {
        template: 'window',
        overrides: { glass: { materialField: 'glass' } }
      },
      reference
    )
  ).toBeUndefined()
})
const field = {
  frame: 'world',
  start: { x: 0, y: 0, z: 0 },
  end: { x: 0, y: 0, z: 50800 },
  gradientStops: stops
}

const source = () => {
  const draft = structuredClone(recorded.draft)
  const face = draft.children[0]
  const grid = draft.children[1]

  return {
    ...draft,
    linearFields: { glass: structuredClone(field) },
    motifTemplates: {
      window: draft.motifTemplates.window.map(({ fill, ...motif }) =>
        motif.key === 'glass'
          ? { ...motif, materialField: 'glass' }
          : { ...motif, fill }
      )
    },
    children: [face, grid]
  }
}

const phase = (g: DesignGradientData, x: number, y: number) => {
  const [a, b] = g.gradientHandles
  const dx = b.x - a.x,
    dy = b.y - a.y

  return ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy)
}

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

it('maps the recorded tapered grid to one continuous field without repeating plane solves', () => {
  const solve = vi.spyOn(compiler, 'createLinearFieldFill')
  const draft = source(),
    before = structuredClone(draft)

  try {
    const result = constructDesign(draft)

    expect(solve).toHaveBeenCalledTimes(1)
    const nodes = result.draft.children as PaintedNode[]
    const grid = recorded.draft.children[1]
    const corners = recorded.draft.children[0].vertices

    if (!corners || grid.rows === undefined || grid.columns === undefined) {
      throw new Error('Recorded grid geometry is missing')
    }

    const rows = grid.rows,
      columns = grid.columns
    const motif = draft.motifTemplates.window[0]
    const glasses = nodes.filter((n) => String(n.key).endsWith('-glass'))

    expect(glasses).toHaveLength(rows * columns)
    glasses.forEach((node, cell) => {
      motif.vertices.forEach((point) => {
        const u = ((cell % columns) + point.u) / columns
        const v = (Math.floor(cell / columns) + point.v) / rows
        const weights = [(1 - u) * (1 - v), u * (1 - v), u * v, (1 - u) * v]
        const world = { x: 0, y: 0, z: 0 }

        for (const axis of ['x', 'y', 'z'] as const) {
          world[axis] = corners.reduce(
            (sum, p, i) => sum + weights[i] * p[axis],
            0
          )
        }

        const p = project(world)

        expect(
          phase(
            node.fill,
            (p.x - node.x) / node.width,
            (p.y - node.y) / node.height
          )
        ).toBeCloseTo(world.z / 50800, 9)
      })
      expect(result.materialFields[String(node.key)]).toBe('glass')
    })
    expect(draft).toEqual(before)
    const original = constructDesign(recorded.draft)

    expect(nodes.map(({ fill: _fill, ...node }) => node)).toEqual(
      (original.draft.children as Record<string, unknown>[]).map(
        ({ fill: _fill, ...node }) => node
      )
    )
    const prepared = prepareDesign(draft)

    expect(admitPreparedDesign(JSON.parse(JSON.stringify(prepared)))).toEqual(
      JSON.parse(JSON.stringify(prepared))
    )
  } finally {
    solve.mockRestore()
  }
})

it('preserves grid field provenance through translated members and material-only revision', async () => {
  const draft = source()
  const grid = {
    ...draft.children[1],
    rows: 2,
    columns: 3,
    boundary: draft.children[0].vertices,
    motifs: {
      template: 'window',
      overrides: { glass: { offset: { x: 0, y: 1, z: 25 } } }
    }
  }
  const repeated = {
    ...draft,
    children: [
      {
        type: 'pattern',
        key: 'units',
        name: 'Units',
        origin: { x: 0, y: 0, z: 100 },
        axes: [{ count: 3, step: { x: 0, y: 0, z: 12000 } }],
        members: [grid]
      }
    ]
  }
  const solve = vi.spyOn(compiler, 'createLinearFieldFill')

  try {
    const constructed = constructDesign(repeated)

    expect(solve).toHaveBeenCalledTimes(1)
    const nodes = (constructed.draft.children as PaintedNode[]).filter((n) =>
      String(n.key).endsWith('-glass')
    )

    expect(nodes).toHaveLength(18)
    const base = constructDesign({
      ...draft,
      children: [{ ...grid, motifs: { template: 'window' } }]
    })
    const first = (base.draft.children as PaintedNode[]).find((n) =>
      String(n.key).endsWith('-glass')
    )

    if (!first) {
      throw new Error('Missing baseline pane')
    }

    expect(
      phase(nodes[0].fill, 0.5, 0.5) - phase(first.fill, 0.5, 0.5)
    ).toBeCloseTo(125 / 50800, 9)
    expect(solve).toHaveBeenCalledTimes(2)
    for (let i = 0; i < 6; i++) {
      expect(
        phase(nodes[i + 6].fill, 0.5, 0.5) - phase(nodes[i].fill, 0.5, 0.5)
      ).toBeCloseTo(12000 / 50800, 9)
    }

    expect(Object.keys(constructed.materialFields)).toHaveLength(18)
    const session = createDesignPreparationSession()
    const prepared = session.prepare(repeated)
    const revised = await session.reviseMaterial(
      prepared.artifactId,
      'glass',
      {
        ...field,
        gradientStops: [...stops].map((s) => ({ ...s, opacity: 1 }))
      },
      new AbortController().signal
    )

    expect(
      session.materialRevision(revised.materialRevisionId).updates
    ).toHaveLength(18)
    expect(session.recipe(prepared.artifactId).recipe).toEqual(repeated)
  } finally {
    solve.mockRestore()
  }
})

it('preserves reversed world phase and constant-plane color and opacity on grid cells', () => {
  const draft = source()
  const grid = { ...draft.children[1], rows: 2, columns: 2 }
  const reversed = { ...field, start: field.end, end: field.start }
  const forward = constructDesign({
    ...draft,
    children: [draft.children[0], grid]
  })
  const backward = constructDesign({
    ...draft,
    linearFields: { glass: reversed },
    children: [draft.children[0], grid]
  })

  const glass = (result: ReturnType<typeof constructDesign>) =>
    (result.draft.children as PaintedNode[]).filter((n) =>
      String(n.key).endsWith('-glass')
    )

  glass(forward).forEach((node, i) =>
    expect(phase(glass(backward)[i].fill, 0.5, 0.5)).toBeCloseTo(
      1 - phase(node.fill, 0.5, 0.5),
      9
    )
  )
  const horizontal = {
    ...grid,
    boundary: [
      { x: 0, y: 0, z: 25400 },
      { x: 20, y: 0, z: 25400 },
      { x: 20, y: 20, z: 25400 },
      { x: 0, y: 20, z: 25400 }
    ]
  }
  const constant = constructDesign({ ...draft, children: [horizontal] })

  for (const node of glass(constant)) {
    expect(node.fill.gradientStops).toEqual([
      { position: 0, color: '#5f81a3', opacity: 0.55 },
      { position: 1, color: '#5f81a3', opacity: 0.55 }
    ])
  }
})

it('allows explicit template paint-mode replacement but rejects conflicts and missing fields', () => {
  const draft = source()
  const grid = draft.children[1]

  const revised = (patch: Record<string, unknown>) => ({
    ...draft,
    children: [
      draft.children[0],
      {
        ...grid,
        rows: 1,
        columns: 1,
        motifs: { template: 'window', overrides: { glass: patch } }
      }
    ]
  })

  expect(() => prepareDesign(revised({ fill: '#123456' }))).not.toThrow()
  expect(() =>
    prepareDesign(revised({ fills: ['#123456', '#abcdef'] }))
  ).not.toThrow()
  expect(() =>
    prepareDesign(revised({ fill: '#123456', materialField: 'glass' }))
  ).toThrow(/materialField.*conflict/)
  expect(() => prepareDesign(revised({ materialField: 'missing' }))).toThrow(
    /unknown materialField/
  )
  const native = structuredClone(recorded.draft)

  Object.assign(native, { linearFields: { glass: field } })
  Object.assign(native.children[1], {
    rows: 1,
    columns: 1,
    motifs: {
      template: 'window',
      overrides: { glass: { materialField: 'glass' } }
    }
  })
  expect(() => prepareDesign(native)).not.toThrow()
})
