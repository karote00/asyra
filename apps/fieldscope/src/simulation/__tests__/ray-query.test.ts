import { Matrix4, Quaternion, Vector3 } from 'three'
import * as cropSource from '../../domain/crop-models'
import * as robotSource from '../../domain/robot-model'
import { expect, it, vi } from 'vitest'
import { SiteGeometry } from '../../render-app/site-geometry'
import { RobotProjection } from '../../render-app/robot-projection'
import {
  buildSiteMeshes,
  type SiteMesh
} from '../../render-app/site-projection'
import { readSpatialDescriptor } from '../../engine/spatial-contract'
import { DEFAULT_CONFIGURATION } from '../../domain/farm-configuration'
import {
  DEFAULT_ROBOT,
  assessRobotDesign,
  validateRobot
} from '../../domain/robot-configuration'
import { REST_JOINTS } from '../../domain/robot-kinematics'
import * as kinematics from '../../domain/robot-kinematics'
import { QueryGeometry, type GeometryReceipt } from '../geometry'
import {
  interval,
  add,
  multiply,
  subtract,
  dyadic,
  type Dyadic
} from '../query-arithmetic'
import {
  RayQueries,
  prepareQueryFrame,
  prepareQueryAffineFrame,
  prepareQueryAffineInverse,
  transformQueryDirection,
  prepareQueryForwardFrame,
  prepareQueryInstanceFrame,
  prepareQueryExactForwardFrame,
  prepareQueryExactInstanceFrame,
  transformQueryPoint,
  type RayBatch
} from '../ray-query'

const emptyFarm = {
  ...DEFAULT_CONFIGURATION,
  strips: [{ id: 'soil', kind: 'soil' as const, width: 6.3 }]
}
const projection = new RobotProjection()
projection.update(
  assessRobotDesign(
    validateRobot({ ...DEFAULT_ROBOT, dockX: 1000, dockZ: 1000 }),
    emptyFarm
  )
)
function triangle(id: string, z: number): SiteMesh {
  return {
    id,
    layer: 'barriers',
    regions: Object.freeze([
      Object.freeze({
        id: 'surface',
        kind: 'sheet' as const,
        indexStart: 0,
        indexCount: 3
      })
    ]),
    visible: false,
    descriptor: readSpatialDescriptor({
      kind: 'mesh',
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      shape: {
        kind: 'triangles',
        positions: [-2, -2, z, 2, -2, z, 0, 2, z],
        indices: [0, 1, 2]
      },
      color: 0xabcdef,
      opacity: 0.1,
      wireframe: false,
      selectable: false
    }) as SiteMesh['descriptor']
  }
}
function fixture(meshes: SiteMesh[]) {
  const site = new SiteGeometry()
  const scene = site.prepareScene(emptyFarm, meshes)
  const receipt: GeometryReceipt = Object.freeze({
    revision: 1,
    scene,
    robot: projection.getSource(),
    dock: projection.getDockSource()
  })
  const owner = new QueryGeometry({
    isCurrentReceipt: (value) => value === receipt,
    isCurrentScene: site.isCurrentScene.bind(site),
    isCurrentRobot: projection.isCurrentSource.bind(projection),
    isCurrentDock: projection.isCurrentDockSource.bind(projection)
  })
  return {
    site,
    owner,
    source: owner.prepare(receipt),
    queries: new RayQueries(owner)
  }
}
const batch = (): RayBatch => ({
  source: 'synthetic',
  time: 1,
  validFrom: 0,
  validUntil: 10,
  robot: {
    base: { position: [1000, 0, 1000], rotation: [0, 0, 0, 1] },
    joints: { ...REST_JOINTS }
  },
  leaves: 'source-pose',
  fruits: 'all-attached',
  rays: [{ origin: [0, 0, 0], direction: [0, 0, 2], maxDistance: 10 }]
})

it('returns nearest original two-sided hidden source triangle with metre distance and barycentrics', () => {
  const { queries, source } = fixture([triangle('far', 8), triangle('near', 5)])
  const request = batch()
  const result = queries.query(source, request)
  const hit = result.results[0]
  expect(hit.status).toBe('hit')
  if (hit.status !== 'hit') throw new Error('Missing source hit')
  expect(hit.mesh.origin.id).toBe('near')
  expect(hit.triangle).toBe(0)
  expect(hit.instance).toBe(0)
  expect(hit.distance).toBe(5)
  expect(hit.distanceBounds).toEqual({ low: 5, high: 5 })
  expect(Object.isFrozen(hit.distanceBounds)).toBe(true)
  expect(hit.barycentric).toEqual([0.25, 0.25, 0.5])
  expect(result.geometry === source).toBe(true)
  request.rays[0].origin[0] = 99
  expect(result.input.rays[0].origin[0]).toBe(0)
  expect(Object.isFrozen(result.input.rays[0].origin)).toBe(true)
})

it('includes the exact range endpoint, preserves source-order ties and handles extreme finite direction scales', () => {
  const { queries, source } = fixture([
    triangle('first', 5),
    triangle('second', 5)
  ])
  for (const magnitude of [Number.MIN_VALUE, 1e308]) {
    const input = batch()
    input.rays[0] = {
      origin: [0, 0, 0],
      direction: [0, 0, magnitude],
      maxDistance: 5
    }
    const hit = queries.query(source, input).results[0]
    expect(hit.status).toBe('hit')
    if (hit.status === 'hit') expect(hit.mesh.origin.id).toBe('first')
    input.rays[0].maxDistance = 4.999
    expect(queries.query(source, input).results[0].status).toBe('miss')
  }
})

it('rejects invalid numeric requests and keeps missing, future and expired dynamic evidence unknown', () => {
  const { queries, source } = fixture([triangle('surface', 5)])
  for (const direction of [
    [0, 0, 0],
    [0, NaN, 1],
    [Infinity, 0, 1]
  ] as [number, number, number][]) {
    const input = batch()
    input.rays[0].direction = direction
    expect(() => queries.query(source, input)).toThrow()
  }
  for (const patch of [
    { validFrom: 2 },
    { validUntil: 1 },
    { leaves: 'unknown' as const },
    { fruits: 'unknown' as const },
    { robot: null }
  ]) {
    const result = queries.query(source, { ...batch(), ...patch })
    expect(result.results[0].status).toBe('unknown')
    expect(result.work.fk).toBe(0)
  }
  for (const patch of [
    { time: NaN },
    { validFrom: 10 },
    { validUntil: Infinity }
  ])
    expect(() => queries.query(source, { ...batch(), ...patch })).toThrow()
})

it('reports relevant coplanar ambiguity instead of fabricating a miss', () => {
  const { queries, source } = fixture([triangle('surface', 0)])
  const input = batch()
  input.rays[0].direction = [1, 0, 0]
  expect(queries.query(source, input).results[0].status).toBe('unknown')
})

it('evaluates one C robot pose per batch and refuses retired or copied source products', () => {
  const { queries, source, site } = fixture([triangle('surface', 5)])
  const fk = vi.spyOn(kinematics, 'evaluateRobotAffinePose')
  try {
    const input = batch()
    input.rays.push({ ...input.rays[0] })
    const result = queries.query(source, input)
    expect(result.work.fk).toBe(1)
    expect(result.work.bodyMatrices).toBe(
      fk.mock.results[0]?.value?.work.matrices
    )
    expect(fk).toHaveBeenCalledTimes(1)
    expect(() => queries.query({ ...source }, input)).toThrow()
    site.clear()
    expect(() => queries.query(source, input)).toThrow()
    expect(fk).toHaveBeenCalledTimes(1)
  } finally {
    fk.mockRestore()
  }
})

it('uses descriptor-after-instance placement and reports the nearest instance', () => {
  const original = triangle('instances', 0)
  const mesh = {
    ...original,
    descriptor: readSpatialDescriptor({
      ...original.descriptor,
      position: [0, 0, 10],
      rotation: [0, Math.sin(Math.PI / 4), 0, Math.cos(Math.PI / 4)],
      instances: [3, 5].map((x) => ({ position: [x, 0, 0], yaw: Math.PI / 2 }))
    }) as SiteMesh['descriptor']
  }
  const { queries, source } = fixture([mesh])
  const hit = queries.query(source, batch()).results[0]
  expect(hit.status).toBe('hit')
  if (hit.status !== 'hit') throw new Error('Missing transformed hit')
  expect(hit.instance).toBe(1)
  expect(hit.distance).toBeCloseTo(5, 12)
})

it('distinguishes actual platform material from the open crate cavity', () => {
  const { queries, source } = fixture([])
  const input = batch()
  input.rays[0] = {
    origin: [1000, -0.015, 1000],
    direction: [0, 1, 0],
    maxDistance: 0.001
  }
  expect(queries.query(source, input).results[0].status).toBe('unknown')
  input.robot = {
    base: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
    joints: { ...REST_JOINTS }
  }
  input.rays[0] = {
    origin: [0.1, 0.45, 0.15],
    direction: [0, 1, 0],
    maxDistance: 0.05
  }
  expect(queries.query(source, input).results[0].status).toBe('miss')
})

it('does not let ambiguity strictly behind a known nearer hit erase its identity', () => {
  const far = triangle('degenerate-far', 8)
  const degenerate = {
    ...far,
    descriptor: readSpatialDescriptor({
      ...far.descriptor,
      shape: {
        kind: 'triangles',
        positions: [-1, 0, 8, 0, 0, 8, 1, 0, 8],
        indices: [0, 1, 2]
      }
    }) as SiteMesh['descriptor']
  }
  const { queries, source } = fixture([degenerate, triangle('near', 5)])
  const hit = queries.query(source, batch()).results[0]
  expect(hit.status).toBe('hit')
  if (hit.status === 'hit') expect(hit.mesh.origin.id).toBe('near')
})

it('profiles actual C hit, miss, net, leaf and both cultivar sources without regenerating their geometry', () => {
  const site = new SiteGeometry()
  const farm = { ...DEFAULT_CONFIGURATION, length: 2.2 }
  const scene = site.prepareScene(farm, buildSiteMeshes(farm, site))
  const receipt: GeometryReceipt = Object.freeze({
    revision: 1,
    scene,
    robot: projection.getSource(),
    dock: projection.getDockSource()
  })
  const owner = new QueryGeometry({
    isCurrentReceipt: (value) => value === receipt,
    isCurrentScene: site.isCurrentScene.bind(site),
    isCurrentRobot: projection.isCurrentSource.bind(projection),
    isCurrentDock: projection.isCurrentDockSource.bind(projection)
  })
  const source = owner.prepare(receipt),
    queries = new RayQueries(owner)
  const input = batch()
  input.rays = [
    { origin: [-10, 10, -10], direction: [0, 1, 0], maxDistance: 5 }
  ]
  const foliageShapes = new Set(
    scene.fruits.flatMap((fruit) =>
      fruit.model.parts
        .filter((part) => part.id === 'foliage')
        .map((part) => part.shape)
    )
  )
  for (const layer of ['net', 'cucumbers', 'tomatoes', 'foliage'] as const) {
    const mesh = source.meshes.find((item) =>
      layer === 'foliage' ? foliageShapes.has(item.shape) : item.layer === layer
    )
    if (!mesh || mesh.shape.kind !== 'triangles')
      throw new Error('Missing actual source')
    const shape = mesh.shape
    const points = [0, 1, 2].map((index) => {
      const offset = shape.indices[index] * 3
      return owner.placePoint(source, mesh, [
        shape.positions[offset],
        shape.positions[offset + 1],
        shape.positions[offset + 2]
      ])
    })
    const a = points[0],
      b = points[1],
      c = points[2]
    const e = b.map((value, axis) => value - a[axis]),
      f = c.map((value, axis) => value - a[axis])
    const normal = [
      e[1] * f[2] - e[2] * f[1],
      e[2] * f[0] - e[0] * f[2],
      e[0] * f[1] - e[1] * f[0]
    ]
    const length = Math.hypot(...normal)
    if (!length) throw new Error('Degenerate sample source')
    const center = a.map((value, axis) => (value + b[axis] + c[axis]) / 3)
    input.rays.push({
      origin: center.map(
        (value, axis) => value + (normal[axis] / length) * 0.01
      ) as [number, number, number],
      direction: normal.map((value) => -value / length) as [
        number,
        number,
        number
      ],
      maxDistance: 0.02
    })
  }
  input.rays.push({ origin: [2, 6, 1], direction: [0, -1, 0], maxDistance: 5 })
  input.rays.push({
    origin: [1000, 2, 1000],
    direction: [0, -1, 0],
    maxDistance: 3
  })
  input.rays.push({
    origin: [2.45, 1, 1],
    direction: [0, 1, 0],
    maxDistance: 10
  })
  const buildCrop = vi.spyOn(cropSource, 'createCropModels')
  const buildRobot = vi.spyOn(robotSource, 'createRobotModel')
  const buildDock = vi.spyOn(robotSource, 'createDockModel')
  try {
    const started = performance.now()
    const first = queries.query(source, input),
      second = queries.query(source, input)
    console.info(
      'near-ray source profile',
      JSON.stringify({
        preparation: source.work,
        first: first.work,
        second: second.work,
        milliseconds: performance.now() - started,
        outcomes: first.results.map((result) =>
          result.status === 'unknown'
            ? {
                reason: result.reason,
                witnesses: result.witnesses?.map(
                  ({ mesh, instance, triangle, distance }) => ({
                    source: mesh.origin.id,
                    instance,
                    triangle,
                    distance
                  })
                )
              }
            : result.status
        )
      })
    )
    expect(first.results[0].status).toBe('miss')
    expect(first.results.some((result) => result.status === 'hit')).toBe(true)
    expect(
      first.results.at(-1)?.status,
      'Greenhouse interior air is not film material'
    ).toBe('hit')
    expect(
      first.results.slice(1).every((result) => result.status !== 'miss')
    ).toBe(true)
    expect(second.results.map((result) => result.status)).toEqual(
      first.results.map((result) => result.status)
    )
    expect(first.work.fk).toBe(1)
    expect(second.work.fk).toBe(1)
    expect(first.work.shapeBounds).toBe(0)
    expect(first.work.vertexVisits).toBe(0)
    expect(first.work.regionBounds).toBe(0)
    expect(second.work.regionIndexVisits).toBe(0)
    expect(source.work.shapeBounds).toBe(source.shapes.length)
    expect(source.work.vertexVisits).toBeGreaterThan(0)
    expect(source.work.regionIndexVisits).toBeGreaterThan(0)
    expect(second.work.exactPredicates).toBe(first.work.exactPredicates)
    expect(first.work.exactPredicates).toBeLessThan(first.work.triangles)
    expect(buildCrop).not.toHaveBeenCalled()
    expect(buildRobot).not.toHaveBeenCalled()
    expect(buildDock).not.toHaveBeenCalled()
    expect(second.work.shapeBounds).toBe(first.work.shapeBounds)
    expect(second.work.vertexVisits).toBe(first.work.vertexVisits)
  } finally {
    buildCrop.mockRestore()
    buildRobot.mockRestore()
    buildDock.mockRestore()
  }
})

it('never reports a miss for an unresolved near-parallel in-range intersection', () => {
  const original = triangle('near-parallel', 0)
  const mesh = {
    ...original,
    descriptor: readSpatialDescriptor({
      ...original.descriptor,
      shape: {
        kind: 'triangles',
        positions: [0, 0, 0, 100000, 0, 0, 0, 100000, 0],
        indices: [0, 1, 2]
      }
    }) as SiteMesh['descriptor']
  }
  const { queries, source } = fixture([mesh])
  const input = batch()
  input.rays[0] = {
    origin: [1, 1, -1e-10],
    direction: [1, 0, 1e-14],
    maxDistance: 20000
  }
  expect(queries.query(source, input).results[0].status).not.toBe('miss')
})

it('keeps non-axis-aligned edge and range-end arithmetic uncertainty from becoming false misses', () => {
  const original = triangle('boundary', 5)
  const mesh = {
    ...original,
    descriptor: readSpatialDescriptor({
      ...original.descriptor,
      shape: {
        kind: 'triangles',
        positions: [0, 0, 5, 2, 0, 5, 0, 2, 5],
        indices: [0, 1, 2]
      }
    }) as SiteMesh['descriptor']
  }
  const { queries, source } = fixture([mesh])
  const edge = batch()
  edge.rays[0] = {
    origin: [0.1, 0.2, 0],
    direction: [0.4, 1.3, 5],
    maxDistance: 10
  }
  const endpoint = batch()
  endpoint.rays[0] = {
    origin: [0, 0, 0],
    direction: [1, 1, 5],
    maxDistance: Math.hypot(1, 1, 5)
  }
  expect.soft(queries.query(source, edge).results[0].status).not.toBe('miss')
  expect
    .soft(queries.query(source, endpoint).results[0].status)
    .not.toBe('miss')
})

it('retains ordinary non-axis hits and separates both sides of edges and range limits', () => {
  const original = triangle('controls', 5)
  const mesh = {
    ...original,
    descriptor: readSpatialDescriptor({
      ...original.descriptor,
      shape: {
        kind: 'triangles',
        positions: [0, 0, 5, 2, 0, 5, 0, 2, 5],
        indices: [0, 1, 2]
      }
    }) as SiteMesh['descriptor']
  }
  const { queries, source } = fixture([mesh])
  for (const [direction, range, expected] of [
    [[0.25, 0.5, 5], 10, 'hit'],
    [[10, 0, 5], 20, 'miss'],
    [[0.5 - 1e-6, 1.5, 5], 10, 'hit'],
    [[0.5 + 1e-6, 1.5, 5], 10, 'miss'],
    [[0.25, 0.5, 5], Math.hypot(0.25, 0.5, 5) + 1e-6, 'hit'],
    [[0.25, 0.5, 5], Math.hypot(0.25, 0.5, 5) - 1e-6, 'miss']
  ] as const) {
    const input = batch()
    input.rays[0] = {
      origin: [0, 0, 0],
      direction: [...direction],
      maxDistance: range
    }
    expect(queries.query(source, input).results[0].status).toBe(expected)
  }
})

it('keeps unresolved open-shell origin separate from material and forward hit distance', async () => {
  const { TriangleBuilder } = await import('../../domain/mesh')
  const builder = new TriangleBuilder()
  builder.tube({
    points: [
      [-1, 0, 0],
      [-1, 0, 2],
      [1, 0, 2],
      [1, 0, 0]
    ],
    diameter: 0.1
  })
  const original = triangle('bent-shell', 0)
  const mesh = {
    ...original,
    regions: builder.regions(),
    descriptor: readSpatialDescriptor({
      ...original.descriptor,
      shape: builder.shape()
    }) as SiteMesh['descriptor']
  }
  const { queries, source } = fixture([mesh, triangle('ahead', 1.1)])
  const input = batch()
  input.rays[0] = { origin: [0, 0, 1], direction: [0, 0, 1], maxDistance: 0.2 }
  const unresolved = queries.query(source, input).results[0]
  expect(unresolved.status).toBe('unknown')
  if (unresolved.status === 'unknown')
    expect(unresolved.reason).toBe('unknown-origin-occupancy')
  input.rays[0] = { origin: [4, 0, 1], direction: [1, 0, 0], maxDistance: 1 }
  expect(queries.query(source, input).results[0].status).toBe('miss')
})

it('bounds immutable representative uncertainty witnesses to the same original source', () => {
  const { queries, source } = fixture([
    triangle('first-overlap', 5),
    triangle('second-overlap', 5),
    triangle('third-overlap', 5)
  ])
  const input = batch()
  input.rays[0].direction = [0.05, 0.1, 1]
  const output = queries.query(source, input)
  const result = output.results[0]
  expect(result.status).toBe('unknown')
  if (result.status !== 'unknown') throw new Error('Missing uncertainty')
  expect(result.witnesses).toHaveLength(2)
  const witnesses = result.witnesses
  if (!witnesses) throw new Error('Missing representative witnesses')
  expect(witnesses.map((witness) => witness.mesh.origin.id)).toEqual([
    'first-overlap',
    'second-overlap'
  ])
  expect(output.geometry === source).toBe(true)
  for (const witness of witnesses) {
    expect(source.meshes.includes(witness.mesh)).toBe(true)
    expect(witness.instance).toBe(0)
    expect(witness.triangle).toBe(0)
    expect(Object.isFrozen(witness)).toBe(true)
    if (!witness.distance) throw new Error('Missing finite distance bound')
    expect(witness.distance.low).toBeLessThanOrEqual(Math.hypot(0.25, 0.5, 5))
    expect(witness.distance.high).toBeGreaterThanOrEqual(
      Math.hypot(0.25, 0.5, 5)
    )
  }
  input.rays[0].origin[0] = 100
  expect(output.input.rays[0].origin[0]).toBe(0)
  expect(Object.isFrozen(witnesses)).toBe(true)
})

it('resolves a supported exact source edge on the real steel assembly without a tolerance expansion', () => {
  const owner = new SiteGeometry()
  const steel = buildSiteMeshes(
    { ...DEFAULT_CONFIGURATION, length: 2.2 },
    owner
  ).find((mesh) => mesh.layer === 'steel')
  if (!steel) throw new Error('Missing original steel source')
  const { queries, source } = fixture([steel])
  const input = batch()
  input.rays[0] = {
    origin: [2.45, 1, 1],
    direction: [0, 1, 0],
    maxDistance: 10
  }
  const result = queries.query(source, input).results[0]
  expect(result.status).toBe('hit')
  if (result.status === 'hit') {
    expect(result.mesh.origin.id).toBe(steel.id)
    // Independent original source-plane oracle; the earlier broadphase lower
    // bound is not an intersection distance and cannot serve as this expected value.
    const shape = steel.descriptor.shape
    if (shape.kind !== 'triangles') throw new Error('Missing steel triangles')
    const [a, b, c] = [0, 1, 2].map((vertex) => {
      const index = shape.indices[1042 * 3 + vertex] * 3
      return shape.positions.slice(index, index + 3)
    })
    const e = b.map((value, axis) => value - a[axis]),
      f = c.map((value, axis) => value - a[axis])
    const normal = [
      e[1] * f[2] - e[2] * f[1],
      e[2] * f[0] - e[0] * f[2],
      e[0] * f[1] - e[1] * f[0]
    ]
    const expected =
      normal.reduce(
        (sum, value, axis) =>
          sum + value * (a[axis] - input.rays[0].origin[axis]),
        0
      ) / normal[1]
    expect(result.distance).toBeCloseTo(expected, 10)
  }
})

it('orders exact rational hit distances and preserves true ties without rounding them to one midpoint', () => {
  const first = triangle('first-rational', 0),
    second = triangle('second-rational', 0)
  const shape = (offset: number) => ({
    kind: 'triangles' as const,
    positions: [0, offset, -2, 3, 1 + offset, -2, 0, offset, 2],
    indices: [0, 1, 2]
  })
  for (const offset of [0, 2 ** -50]) {
    const meshes = [first, second].map((mesh, index) => ({
      ...mesh,
      descriptor: readSpatialDescriptor({
        ...mesh.descriptor,
        shape: shape(index ? 0 : offset)
      }) as SiteMesh['descriptor']
    }))
    const { queries, source } = fixture(meshes)
    const input = batch()
    input.rays[0] = { origin: [1, -1, 0], direction: [0, 1, 0], maxDistance: 3 }
    const result = queries.query(source, input).results[0]
    expect(result.status).toBe('hit')
    if (result.status === 'hit') {
      expect(result.mesh.origin.id).toBe(offset ? second.id : first.id)
      expect(result.distance).toBeCloseTo(4 / 3, 12)
      expect(result.distanceBounds.low).toBeLessThanOrEqual(4 / 3)
      expect(result.distanceBounds.high).toBeGreaterThanOrEqual(4 / 3)
      expect(
        result.distanceBounds.high - result.distanceBounds.low
      ).toBeLessThan(1e-14)
    }
  }
})

it('validates the single detached accessor snapshot before FK or query work', () => {
  const { queries, source } = fixture([triangle('admission', 5)])
  const input = batch()
  let reads = 0
  Object.defineProperty(input, 'time', {
    enumerable: true,
    get: () => (++reads <= 2 ? 0 : NaN)
  })
  const fk = vi.spyOn(kinematics, 'evaluateRobotAffinePose')
  try {
    const result = queries.query(source, input)
    expect(reads).toBe(1)
    expect(result.input.time).toBe(0)
    expect(result.results[0].status).toBe('hit')
    expect(fk).toHaveBeenCalledTimes(1)
    fk.mockClear()
    const invalid = batch()
    Object.defineProperty(invalid, 'time', { enumerable: true, get: () => NaN })
    expect(() => queries.query(source, invalid)).toThrow()
    expect(fk).not.toHaveBeenCalled()
  } finally {
    fk.mockRestore()
  }
})

it('preserves fresh-preparation results while time, rays and working joints reuse static bounds', () => {
  const { site, source, queries } = fixture([triangle('reused-surface', 5)])
  const freshOwner = new QueryGeometry({
    isCurrentReceipt: (value) => value === source.receipt,
    isCurrentScene: site.isCurrentScene.bind(site),
    isCurrentRobot: projection.isCurrentSource.bind(projection),
    isCurrentDock: projection.isCurrentDockSource.bind(projection)
  })
  const freshQueries = new RayQueries(freshOwner)
  for (const time of [0, 0.2, 0.5]) {
    const input = batch()
    input.time = time
    input.rays[0].direction = [time, 0, 1]
    if (!input.robot) throw new Error('Missing dynamic robot fixture')
    input.robot.joints = { ...input.robot.joints, yaw: time }
    const retained = queries.query(source, input)
    freshOwner.clear()
    const fresh = freshQueries.query(freshOwner.prepare(source.receipt), input)
    expect(retained.results.map((result) => result.status)).toEqual(
      fresh.results.map((result) => result.status)
    )
    for (let i = 0; i < retained.results.length; i++) {
      const a = retained.results[i],
        b = fresh.results[i]
      if (a.status === 'hit' && b.status === 'hit') {
        expect(a.mesh.origin === b.mesh.origin).toBe(true)
        expect([a.instance, a.triangle, a.distance, ...a.barycentric]).toEqual([
          b.instance,
          b.triangle,
          b.distance,
          ...b.barycentric
        ])
      } else if (a.status === 'unknown' && b.status === 'unknown')
        expect(a.reason).toBe(b.reason)
    }
    expect(retained.work.vertexVisits + retained.work.regionIndexVisits).toBe(0)
    expect(retained.work.fk).toBe(1)
  }
})

it('shares the original coefficient inverse as an immutable direction frame', () => {
  const frame = prepareQueryFrame({
    position: [100, 10, -30],
    rotation: [0, 1, 0, 0]
  })
  expect(transformQueryDirection(frame, [2, 3, 4])).toEqual([
    { low: -2, high: -2 },
    { low: 3, high: 3 },
    { low: -4, high: -4 }
  ])
  expect(Object.isFrozen(frame)).toBe(true)
  expect(Object.isFrozen(frame.matrix[0])).toBe(true)
  const rotation = [0, Math.sin(Math.PI / 8), 0, Math.cos(Math.PI / 8)] as const
  const direction = kinematics.transformRobotPoint(
    { position: [0, 0, 0], rotation },
    [1, 2, 3]
  )
  const transformed = transformQueryDirection(
    prepareQueryFrame({ position: [0, 0, 0], rotation }),
    direction
  )
  for (let axis = 0; axis < 3; axis++) {
    expect(transformed[axis].low).toBeLessThanOrEqual(axis + 1)
    expect(transformed[axis].high).toBeGreaterThanOrEqual(axis + 1)
  }
})

const frameSum = (a: Dyadic, b: Dyadic): Dyadic => {
  const exponent = Math.min(a.exponent, b.exponent)
  return {
    significand:
      (a.significand << BigInt(a.exponent - exponent)) +
      (b.significand << BigInt(b.exponent - exponent)),
    exponent
  }
}
const frameProduct = (a: Dyadic, b: Dyadic): Dyadic => ({
  significand: a.significand * b.significand,
  exponent: a.exponent + b.exponent
})
const frameDifference = (a: Dyadic, b: Dyadic) =>
  frameSum(a, { significand: -b.significand, exponent: b.exponent })
const expectFrameValue = (actual: Dyadic, expected: Dyadic) =>
  expect(frameDifference(actual, expected).significand).toBe(0n)

it('publishes exact original quaternion coefficients with compatible outward frames', () => {
  for (const rotation of [
    [0, 1, 0, 0],
    [0.2, 0.3, 0.4, Math.sqrt(0.71)],
    [1e-150, 0, 0, 1]
  ] as const) {
    const transform = { position: [1e200, 1e-200, -3] as const, rotation }
    const exact = prepareQueryExactForwardFrame(transform),
      outward = prepareQueryForwardFrame(transform)
    const [x, y, z, w] = rotation.map(dyadic),
      one = dyadic(1),
      two = dyadic(2)
    const twice = (value: Dyadic) => frameProduct(two, value)
    const expected = [
      [
        frameDifference(
          one,
          twice(frameSum(frameProduct(y, y), frameProduct(z, z)))
        ),
        twice(frameDifference(frameProduct(x, y), frameProduct(z, w))),
        twice(frameSum(frameProduct(x, z), frameProduct(y, w)))
      ],
      [
        twice(frameSum(frameProduct(x, y), frameProduct(z, w))),
        frameDifference(
          one,
          twice(frameSum(frameProduct(x, x), frameProduct(z, z)))
        ),
        twice(frameDifference(frameProduct(y, z), frameProduct(x, w)))
      ],
      [
        twice(frameDifference(frameProduct(x, z), frameProduct(y, w))),
        twice(frameSum(frameProduct(y, z), frameProduct(x, w))),
        frameDifference(
          one,
          twice(frameSum(frameProduct(x, x), frameProduct(y, y)))
        )
      ]
    ]
    for (let row = 0; row < 3; row++)
      for (let column = 0; column < 3; column++) {
        const value = exact.matrix[row][column],
          enclosure = outward.matrix[row][column]
        expectFrameValue(value, expected[row][column])
        expect(
          frameDifference(value, dyadic(enclosure.low)).significand >= 0n
        ).toBe(true)
        expect(
          frameDifference(dyadic(enclosure.high), value).significand >= 0n
        ).toBe(true)
        expect(Object.isFrozen(value)).toBe(true)
      }
    transform.position.forEach((value, axis) =>
      expectFrameValue(exact.position[axis], dyadic(value))
    )
    expect(exact.determinant.significand).not.toBe(0n)
    expect(Object.isFrozen(exact)).toBe(true)
    expect(Object.isFrozen(exact.matrix[0])).toBe(true)
  }
})

it('retains binary64 yaw coefficients and instance-before-descriptor exact placement', () => {
  const placement = { position: [5, 6, 7] as const, yaw: Math.PI / 3 }
  const instance = prepareQueryExactInstanceFrame(placement)
  expectFrameValue(instance.matrix[0][0], dyadic(Math.cos(placement.yaw)))
  expectFrameValue(instance.matrix[0][2], dyadic(Math.sin(placement.yaw)))
  expectFrameValue(instance.matrix[2][0], dyadic(-Math.sin(placement.yaw)))
  const descriptor = {
    position: [10, 20, 30] as const,
    rotation: [0, 1, 0, 0] as const
  }
  const outer = prepareQueryExactForwardFrame(descriptor)
  const apply = (frame: typeof outer, point: readonly Dyadic[]) =>
    frame.matrix.map((row, axis) =>
      row.reduce(
        (sum, value, index) => frameSum(sum, frameProduct(value, point[index])),
        frame.position[axis]
      )
    )
  const point = [1e100, 2, 1e-100].map(dyadic)
  const installed = apply(instance, point),
    world = apply(outer, installed)
  expectFrameValue(world[0], frameDifference(dyadic(10), installed[0]))
  expectFrameValue(world[1], frameSum(dyadic(20), installed[1]))
  expectFrameValue(world[2], frameDifference(dyadic(30), installed[2]))
  const bounds = transformQueryPoint(
    prepareQueryForwardFrame(descriptor),
    transformQueryPoint(
      prepareQueryInstanceFrame(placement),
      [1e100, 2, 1e-100].map(interval)
    )
  )
  world.forEach((value, axis) => {
    expect(
      frameDifference(value, dyadic(bounds[axis].low)).significand >= 0n
    ).toBe(true)
    expect(
      frameDifference(dyadic(bounds[axis].high), value).significand >= 0n
    ).toBe(true)
  })
  expect(Object.isFrozen(instance.position[0])).toBe(true)
  expect(prepareQueryExactInstanceFrame(placement)).not.toBe(instance)
})

it('refuses invalid or singular exact source frames without inventing an inverse', () => {
  for (const rotation of [
    [0, 0, 0, 0],
    [0.5, 0.5, 0, 0],
    [NaN, 0, 0, 1]
  ] as const)
    expect(() =>
      prepareQueryExactForwardFrame({ position: [0, 0, 0], rotation })
    ).toThrow()
  expect(() =>
    prepareQueryExactForwardFrame({
      position: [Infinity, 0, 0],
      rotation: [0, 0, 0, 1]
    })
  ).toThrow()
  expect(() =>
    prepareQueryExactInstanceFrame({ position: [0, 0, 0], yaw: Infinity })
  ).toThrow()
})

it('shares original forward quaternion and instance frames with surface queries', () => {
  const point = [1, 2, 3] as const
  const frame = prepareQueryForwardFrame({
    position: [10, 20, 30],
    rotation: [0, 1, 0, 0]
  })
  expect(transformQueryPoint(frame, point.map(interval))).toEqual([
    interval(9),
    interval(22),
    interval(27)
  ])
  const placement = { position: [5, 6, 7] as const, yaw: Math.PI / 3 }
  const placed = transformQueryPoint(
    prepareQueryInstanceFrame(placement),
    point.map(interval)
  )
  const expected = [
    5 + Math.cos(placement.yaw) + 3 * Math.sin(placement.yaw),
    8,
    7 - Math.sin(placement.yaw) + 3 * Math.cos(placement.yaw)
  ]
  expected.forEach((value, axis) => {
    expect(placed[axis].low).toBeLessThanOrEqual(value)
    expect(placed[axis].high).toBeGreaterThanOrEqual(value)
  })
  expect(Object.isFrozen(frame)).toBe(true)
})

it('consumes actual C body coefficient singletons and encloses installed Three source vertices with a true inverse', () => {
  const source = projection.getSource()
  if (!source.rig) throw new Error('Missing admitted rig')
  const pose = kinematics.evaluateRobotAffinePose(source.rig, {
    lift: 0.037,
    yaw: -0.71,
    shoulder: 0.29,
    elbow: -0.83,
    wrist: 0.47
  })
  for (const part of pose.parts.filter(
    (part) => part.body === 'shoulder' || part.body === 'wrist'
  )) {
    const forward = prepareQueryAffineFrame(part.affine),
      backward = prepareQueryAffineInverse(part.affine)
    part.affine.matrix.forEach((row, axis) =>
      row.forEach((value, column) =>
        expect(forward.matrix[axis][column]).toEqual(interval(value))
      )
    )
    const matrix = new Matrix4().compose(
      new Vector3().fromArray(part.transform.position),
      new Quaternion().fromArray(part.transform.rotation),
      new Vector3(1, 1, 1)
    )
    for (
      let offset = 0;
      offset < part.source.shape.positions.length;
      offset += 3
    ) {
      const point = part.source.shape.positions.slice(offset, offset + 3) as [
        number,
        number,
        number
      ]
      const actual = transformQueryPoint(forward, point.map(interval))
      const expected = new Vector3(...point).applyMatrix4(matrix).toArray()
      expected.forEach((value, axis) => {
        expect(actual[axis].low).toBeLessThanOrEqual(value)
        expect(actual[axis].high).toBeGreaterThanOrEqual(value)
      })
      // Interval round-trip includes forward subtraction/multiplication error;
      // the nonorthogonal diagonal fixture separately rules out transpose.
      const delta = actual.map((value, axis) =>
        subtract(value, interval(part.affine.position[axis]))
      )
      backward.matrix.forEach((row, axis) => {
        const recovered = row.reduce(
          (total, value, column) => add(total, multiply(value, delta[column])),
          interval(0)
        )
        expect(recovered.low).toBeLessThanOrEqual(point[axis])
        expect(recovered.high).toBeGreaterThanOrEqual(point[axis])
      })
    }
    expect(Object.isFrozen(forward)).toBe(true)
    expect(Object.isFrozen(backward)).toBe(true)
  }
})

it('keeps singular affine inversion unresolved instead of treating transpose as inverse', () => {
  // Algebra fixture for the frame helper, not an issued C source or robot pose.
  const singular = {
    matrix: [
      [1, 0, 0],
      [0, 0, 0],
      [0, 0, 1]
    ],
    position: [0, 0, 0]
  } as const
  const inverse = prepareQueryAffineInverse(singular)
  expect(
    inverse.matrix.some((row) =>
      row.some(
        (value) => !Number.isFinite(value.low) || !Number.isFinite(value.high)
      )
    )
  ).toBe(true)
  const affine = {
    matrix: [
      [2, 0, 0],
      [0, 3, 0],
      [0, 0, 4]
    ],
    position: [0, 0, 0]
  } as const
  const trueInverse = prepareQueryAffineInverse(affine)
  transformQueryDirection(trueInverse, [2, 3, 4]).forEach((value) => {
    expect(value.low).toBeLessThanOrEqual(1)
    expect(value.high).toBeGreaterThanOrEqual(1)
    expect(value.high).toBeLessThan(2)
  })
})

it('hits an actual articulated body source face using the completed Three CPU matrix', () => {
  const f = fixture([]),
    input = batch(),
    rig = f.source.receipt.robot.rig
  if (!rig) throw new Error('Missing actual rig')
  input.robot = {
    base: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
    joints: { lift: 0.05, yaw: 0.4, shoulder: 0.3, elbow: 0.2, wrist: -0.1 }
  }
  const pose = kinematics.evaluateRobotAffinePose(rig, input.robot.joints)
  const part = pose.parts.find((part) => part.source.id === 'tool-guard')
  if (!part) throw new Error('Missing original tool guard')
  const matrix = new Matrix4().compose(
    new Vector3().fromArray(part.transform.position),
    new Quaternion().fromArray(part.transform.rotation),
    new Vector3(1, 1, 1)
  )
  const points = [0, 1, 2].map((corner) => {
    const offset = part.source.shape.indices[corner] * 3
    return new Vector3()
      .fromArray(part.source.shape.positions, offset)
      .applyMatrix4(matrix)
  })
  const center = points[0]
    .clone()
    .add(points[1])
    .add(points[2])
    .multiplyScalar(1 / 3)
  const normal = points[1]
    .clone()
    .sub(points[0])
    .cross(points[2].clone().sub(points[0]))
    .normalize()
  // The first box face winds toward its interior. Approach its exterior at
  // an oblique angle so unrelated parallel faces are not ambiguous candidates.
  const origin = center
    .clone()
    .addScaledVector(normal, -0.01)
    .addScaledVector(points[1].clone().sub(points[0]), 0.03)
    .addScaledVector(points[2].clone().sub(points[0]), 0.02)
  const direction = center.clone().sub(origin)
  input.rays = [
    {
      origin: origin.toArray(),
      direction: direction.toArray(),
      maxDistance: 0.02
    }
  ]
  const result = f.queries.query(f.source, input),
    hit = result.results[0]
  expect(
    hit.status,
    hit.status === 'unknown'
      ? JSON.stringify({
          reason: hit.reason,
          witnesses: hit.witnesses?.map((w) => ({
            id: w.mesh.origin.id,
            triangle: w.triangle,
            distance: w.distance
          }))
        })
      : undefined
  ).toBe('hit')
  if (hit.status !== 'hit') throw new Error('Missing actual body hit')
  expect(hit.mesh.origin).toBe(part.source)
  expect(hit.triangle).toBe(0)
  expect(hit.distanceBounds.low).toBeLessThanOrEqual(direction.length())
  expect(hit.distanceBounds.high).toBeGreaterThanOrEqual(direction.length())
  expect(result.work.fk).toBe(1)
  expect(result.work.bodyMatrices).toBe(pose.work.matrices)
})
