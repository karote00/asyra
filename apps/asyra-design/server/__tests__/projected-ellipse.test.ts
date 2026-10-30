import recordedEllipse from './fixtures/recorded-101/projected-ellipse-20261024.json'
import { expect, it } from 'vitest'
import { constructDesign } from '../design-construction'
import {
  prepareDesign,
  createDesignPreparationSession
} from '../design-preparation'
import { measureDesignBudget } from '../design-budget'
import { deliverPreparedDesign } from '../../src/ai/prepared-design'
import { admitPreparedDesignDelivery } from '../../src/ai/prepared-design-admission'

const camera = {
  azimuth: 35,
  elevation: 25,
  scale: 1.3,
  originX: 40,
  originY: 80
}
const ellipse = {
  center: { x: 9, y: 3, z: 12 },
  u: { x: 6, y: 2, z: 1 },
  v: { x: 1, y: -2, z: 5 }
}
const face = (e = ellipse) => ({
  type: 'projected-face',
  key: 'disk',
  name: 'Disk',
  ellipse: e,
  fill: '#123456'
})
const root = (children: unknown[]) => ({
  type: 'group',
  name: 'Projected ovals',
  projection: camera,
  children
})
const project = (p: { x: number; y: number; z: number }) => {
  const a = (camera.azimuth * Math.PI) / 180,
    e = (camera.elevation * Math.PI) / 180
  return {
    x: camera.originX + camera.scale * (Math.cos(a) * p.x - Math.sin(a) * p.y),
    y:
      camera.originY +
      camera.scale *
        (Math.sin(e) * (Math.sin(a) * p.x + Math.cos(a) * p.y) -
          Math.cos(e) * p.z)
  }
}

it.each([
  ellipse,
  { ...ellipse, u: { x: 5, y: 0, z: 0 }, v: { x: 0, y: 0, z: 5 } },
  { ...ellipse, v: { x: -1, y: 2, z: -5 } },
  { ...ellipse, u: { x: 6, y: 0, z: 0 }, v: { x: 3, y: 0, z: 2 } }
])(
  'creates an analytic oval through official prepared admission for %j',
  (e) => {
    const design = prepareDesign(root([face(e)]), 'oval')
    const admitted = admitPreparedDesignDelivery(deliverPreparedDesign(design))
    const r = admitted.entries[0].descriptor,
      d = admitted.entries[1].descriptor
    expect(d.type).toBe('oval')
    expect(d).not.toHaveProperty('points')
    const angle = Number(d.rotation),
      c = Math.cos(angle),
      s = Math.sin(angle)
    const x = Number(r.x) + Number(d.x),
      y = Number(r.y) + Number(d.y)
    const w = Number(d.width),
      h = Number(d.height)
    const center = project(e.center)
    expect(x + (c * w) / 2 - (s * h) / 2).toBeCloseTo(center.x, 9)
    expect(y + (s * w) / 2 + (c * h) / 2).toBeCloseTo(center.y, 9)
    for (let i = 0; i < 97; i++) {
      const t = (2 * Math.PI * i) / 97
      const p = project({
        x: e.center.x + e.u.x * Math.cos(t) + e.v.x * Math.sin(t),
        y: e.center.y + e.u.y * Math.cos(t) + e.v.y * Math.sin(t),
        z: e.center.z + e.u.z * Math.cos(t) + e.v.z * Math.sin(t)
      })
      const dx = p.x - center.x,
        dy = p.y - center.y
      expect(
        ((c * dx + s * dy) / (w / 2)) ** 2 + ((-s * dx + c * dy) / (h / 2)) ** 2
      ).toBeCloseTo(1, 10)
    }
  }
)

it('retains translated pattern order and native object budgets without sampled curves', () => {
  const input = root([
    {
      type: 'pattern',
      key: 'parts',
      name: 'Parts',
      origin: { x: 0, y: 0, z: 0 },
      axes: [{ count: 100, step: { x: 20, y: 0, z: 0 } }],
      members: [face()]
    }
  ])
  expect(measureDesignBudget(input).observed).toMatchObject({
    expandedNodes: 101,
    expandedPathCommands: 0,
    sourcePathCommands: 0
  })
  const constructed = constructDesign(input)
  expect(constructed.sourceWork.projectionCalls).toBeLessThanOrEqual(105)
  const design = prepareDesign(input, 'repeat')
  expect(
    design.entries.slice(1).every((e) => e.descriptor.type === 'oval')
  ).toBe(true)
  expect(design.entries[100].key).toBe('parts-99-disk')
  expect(design.entries[1].descriptor.rotation).toBe(
    design.entries[100].descriptor.rotation
  )
})

it('uses oval-local world material coordinates after projection', () => {
  const { fill: _fill, ...source } = face()
  const input = {
    ...root([{ ...source, materialField: 'light' }]),
    linearFields: {
      light: {
        frame: 'world',
        start: { x: 0, y: 0, z: 0 },
        end: { x: 0, y: 0, z: 100 },
        gradientStops: [
          { position: 0, color: '#000000', opacity: 1 },
          { position: 1, color: '#ffffff', opacity: 1 }
        ]
      }
    }
  }
  const node = (
    constructDesign(input).draft.children as {
      type: string
      x: number
      y: number
      width: number
      height: number
      rotation: number
      fill: { gradientHandles: { x: number; y: number }[] }
    }[]
  )[0]
  expect(node.type).toBe('oval')
  const [start, end] = node.fill.gradientHandles
  const gx = end.x - start.x,
    gy = end.y - start.y,
    length = gx * gx + gy * gy
  for (const t of [0, 0.4, 1.7, 3.2, 4.8]) {
    const p = {
      x:
        ellipse.center.x +
        ellipse.u.x * Math.cos(t) +
        ellipse.v.x * Math.sin(t),
      y:
        ellipse.center.y +
        ellipse.u.y * Math.cos(t) +
        ellipse.v.y * Math.sin(t),
      z:
        ellipse.center.z + ellipse.u.z * Math.cos(t) + ellipse.v.z * Math.sin(t)
    }
    const q = project(p),
      dx = q.x - node.x,
      dy = q.y - node.y,
      c = Math.cos(node.rotation),
      s = Math.sin(node.rotation)
    const u = (c * dx + s * dy) / node.width,
      v = (-s * dx + c * dy) / node.height
    expect(((u - start.x) * gx + (v - start.y) * gy) / length).toBeCloseTo(
      p.z / 100,
      10
    )
  }
})

it('rejects the superseded segment selector and degenerate ellipses', () => {
  expect(() =>
    prepareDesign(root([face({ ...ellipse, segments: 4 } as typeof ellipse)]))
  ).toThrow()
  expect(() =>
    prepareDesign(root([face({ ...ellipse, v: ellipse.u })]))
  ).toThrow()
})

it('prepares the saved-input-derived curve design without changing polygon order or source evidence', () => {
  const before = JSON.stringify(recordedEllipse)
  const compact = JSON.parse(
    JSON.stringify(recordedEllipse.compact, (key, value) =>
      key === 'ellipse'
        ? { center: value.center, u: value.u, v: value.v }
        : value
    )
  )
  const design = prepareDesign(compact.draft, 'saved')
  const original = prepareDesign(recordedEllipse.original.draft, 'saved')
  expect(
    design.entries.map((e) => [e.key, e.descriptor.name, e.parentId])
  ).toEqual(original.entries.map((e) => [e.key, e.descriptor.name, e.parentId]))
  expect(
    design.entries.filter((e) => e.descriptor.type === 'oval')
  ).toHaveLength(192)
  for (let i = 1; i < design.entries.length; i++) {
    if (design.entries[i].descriptor.type !== 'oval') {
      const current = design.entries[i].descriptor,
        prior = original.entries[i].descriptor
      for (const key of Object.keys(prior)) {
        if (!['x', 'y'].includes(key)) {
          expect(current[key]).toEqual(prior[key])
        }
      }
      for (const key of ['x', 'y']) {
        expect(
          Number(current[key]) + Number(design.entries[0].descriptor[key])
        ).toBeCloseTo(
          Number(prior[key]) + Number(original.entries[0].descriptor[key]),
          8
        )
      }
    }
  }
  for (let i = 1; i < design.entries.length; i++) {
    const d = design.entries[i].descriptor
    if (d.type !== 'oval') {
      continue
    }
    const c = Math.cos(Number(d.rotation)),
      s = Math.sin(Number(d.rotation)),
      w = Number(d.width),
      h = Number(d.height)
    const cx =
      Number(design.entries[0].descriptor.x) +
      Number(d.x) +
      (c * w) / 2 -
      (s * h) / 2
    const cy =
      Number(design.entries[0].descriptor.y) +
      Number(d.y) +
      (s * w) / 2 +
      (c * h) / 2
    const points = original.entries[i].descriptor.points as Record<
      string,
      { x: number; y: number }
    >
    for (const p of Object.values(points)) {
      const dx = p.x - cx,
        dy = p.y - cy
      expect(
        ((c * dx + s * dy) / (w / 2)) ** 2 + ((-s * dx + c * dy) / (h / 2)) ** 2
      ).toBeCloseTo(1, 8)
    }
  }
  expect(JSON.stringify(compact).length).toBeLessThan(
    JSON.stringify(recordedEllipse.original).length / 4
  )
  expect(JSON.stringify(recordedEllipse)).toBe(before)
})

it('rejects edge-on projections, mixed geometry, nonfinite and out-of-range ellipses before delivery', () => {
  const edge = {
    ...root([
      face({
        center: { x: 0, y: 0, z: 0 },
        u: { x: 10, y: 0, z: 0 },
        v: { x: 0, y: 10, z: 0 }
      })
    ]),
    projection: { azimuth: 0, elevation: 0, scale: 1, originX: 0, originY: 0 }
  }
  expect(() => prepareDesign(edge)).toThrow(/projected face/)
  expect(() =>
    prepareDesign(
      root([{ ...face(), vertices: [ellipse.center, ellipse.u, ellipse.v] }])
    )
  ).toThrow()
  expect(() =>
    prepareDesign(root([face({ ...ellipse, center: { x: NaN, y: 0, z: 0 } })]))
  ).toThrow()
  expect(() =>
    prepareDesign(
      root([face({ ...ellipse, center: { x: 1000000, y: 0, z: 0 } })])
    )
  ).toThrow()
})

it('preserves faces-only patterns and nearly circular projected geometry', () => {
  const e = {
    center: { x: 10, y: 0, z: 20 },
    u: { x: 5, y: 0, z: 0 },
    v: { x: 0, y: 0, z: 5.000000001 }
  }
  const draft = {
    ...root([
      {
        type: 'pattern',
        key: 'rings',
        name: 'Rings',
        origin: { x: 0, y: 0, z: 0 },
        axes: [{ count: 2, step: { x: 20, y: 0, z: 0 } }],
        faces: [{ key: 'ring', name: 'Ring', ellipse: e, fill: '#123456' }]
      }
    ]),
    projection: { azimuth: 0, elevation: 0, scale: 1, originX: 0, originY: 0 }
  }
  const result = prepareDesign(draft)
  expect(result.entries.slice(1).map((e) => e.descriptor.type)).toEqual([
    'oval',
    'oval'
  ])
  for (const entry of result.entries.slice(1)) {
    expect(Number(entry.descriptor.width)).toBeCloseTo(10, 7)
    expect(Number(entry.descriptor.height)).toBeCloseTo(10, 7)
  }
})

it('preserves world material phase across translated ovals and retained material revision', async () => {
  const field = {
    frame: 'world',
    start: { x: 0, y: 0, z: 0 },
    end: { x: 0, y: 0, z: 100 },
    gradientStops: [
      { position: 0, color: '#000000', opacity: 1 },
      { position: 1, color: '#ffffff', opacity: 1 }
    ]
  }
  const { fill: _fill, ...member } = face()
  const draft = {
    ...root([
      {
        type: 'pattern',
        key: 'parts',
        name: 'Parts',
        origin: { x: 0, y: 0, z: 0 },
        axes: [{ count: 3, step: { x: 20, y: 0, z: 10 } }],
        members: [{ ...member, materialField: 'light' }]
      }
    ]),
    linearFields: { light: field }
  }
  const session = createDesignPreparationSession()
  const first = session.prepare(draft)
  const before = structuredClone(session.resolve(first.artifactId))
  const revision = await session.reviseMaterial(
    first.artifactId,
    'light',
    {
      ...field,
      gradientStops: field.gradientStops.map((s) => ({
        ...s,
        color: '#abcdef'
      }))
    },
    new AbortController().signal
  )
  const after = session.resolve(revision.materialRevisionId)
  after.entries.forEach((entry, i) => {
    const { fills: _after, ...geometry } = entry.descriptor
    const { fills: _before, ...original } = before.entries[i].descriptor
    expect(geometry).toEqual(original)
  })
  const updates = session.materialRevision(revision.materialRevisionId).updates
  expect(updates.map((u) => u.elementId)).toEqual(
    before.entries.slice(1).map((e) => e.descriptor.id)
  )
  updates.forEach((u, i) => {
    const [a, b] = u.gradient.gradientHandles
    const dx = b.x - a.x,
      dy = b.y - a.y
    expect(
      ((0.5 - a.x) * dx + (0.5 - a.y) * dy) / (dx * dx + dy * dy)
    ).toBeCloseTo((ellipse.center.z + i * 10) / 100, 10)
  })
  expect(session.resolve(first.artifactId)).toEqual(before)
  expect(session.recipe(first.artifactId).recipe).toEqual(draft)
})

it('checks the analytic oval footprint against Frame limits without rewriting geometry', () => {
  const frame = { ...root([face()]), type: 'frame', width: 200, height: 200 }
  const inside = prepareDesign(frame, 'frame')
  expect(inside.findings).toEqual([])
  const outside = prepareDesign({ ...frame, width: 1 }, 'frame')
  expect(outside.findings).toContainEqual(
    expect.objectContaining({
      kind: 'overflow',
      key: 'disk',
      right: expect.any(Number)
    })
  )
  expect(outside.entries[1]).toEqual(inside.entries[1])
})
