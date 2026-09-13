import { expect, it, vi } from 'vitest'
import { prepareHierarchy, queryHierarchy } from './source-hierarchy'
import { SiteGeometry } from '../../render-app/site-geometry'
import { RobotProjection } from '../../render-app/robot-projection'
import {
  buildSiteMeshes,
  type SiteMesh
} from '../../render-app/site-projection'
import { readSpatialDescriptor } from '../../engine/spatial-contract'
import {
  DEFAULT_CONFIGURATION,
  type FarmConfiguration
} from '../../domain/farm-configuration'
import {
  DEFAULT_ROBOT,
  assessRobotDesign,
  validateRobot
} from '../../domain/robot-configuration'
import type { Point3 } from '../../domain/greenhouse'
import { REST_JOINTS, prepareRobotRig } from '../../domain/robot-kinematics'
import type { RobotSource, DockSource } from '../../render-app/robot-projection'
import * as kinematics from '../../domain/robot-kinematics'
import * as crops from '../../domain/crop-models'
import * as models from '../../domain/robot-model'
import { TriangleBuilder } from '../../domain/mesh'
import {
  QueryGeometry,
  type GeometryReceipt,
  type GeometryBounds
} from '../geometry'
import { interval, add, type Interval } from '../query-arithmetic'
import {
  prepareQueryForwardFrame,
  prepareQueryInstanceFrame,
  transformQueryPoint
} from '../ray-query'
import {
  SurfaceQueries,
  type SurfaceBatch,
  type SurfaceSweepBatch,
  type SurfaceCoverageBatch
} from '../collision'

const farm = {
  ...DEFAULT_CONFIGURATION,
  strips: [{ id: 'soil', kind: 'soil' as const, width: 6.3 }]
}
const robot = new RobotProjection()
robot.update(assessRobotDesign(validateRobot(DEFAULT_ROBOT), farm))
function triangle(id: string, positions: number[]): SiteMesh {
  return {
    id,
    layer: 'barriers',
    visible: false,
    regions: Object.freeze([
      Object.freeze({
        id: 'sheet',
        kind: 'sheet' as const,
        indexStart: 0,
        indexCount: 3
      })
    ]),
    descriptor: readSpatialDescriptor({
      kind: 'mesh',
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      shape: { kind: 'triangles', positions, indices: [0, 1, 2] },
      color: 0xabcdef,
      opacity: 0.1,
      wireframe: false,
      selectable: false
    }) as SiteMesh['descriptor']
  }
}
function setup(
  meshes: SiteMesh[],
  configuration: FarmConfiguration = farm,
  site = new SiteGeometry()
) {
  const scene = site.prepareScene(configuration, meshes)
  const receipt: GeometryReceipt = Object.freeze({
    revision: 1,
    scene,
    robot: robot.getSource(),
    dock: robot.getDockSource()
  })
  const owner = new QueryGeometry({
    isCurrentReceipt: (value) => value === receipt,
    isCurrentScene: site.isCurrentScene.bind(site),
    isCurrentRobot: robot.isCurrentSource.bind(robot),
    isCurrentDock: robot.isCurrentDockSource.bind(robot)
  })
  return {
    site,
    owner,
    source: owner.prepare(receipt),
    query: new SurfaceQueries(owner)
  }
}
function batch(): SurfaceBatch {
  return {
    source: 'synthetic',
    time: 1,
    validFrom: 0,
    validUntil: 10,
    leaves: 'source-pose',
    fruits: 'all-attached',
    robot: {
      base: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
      joints: { ...REST_JOINTS }
    },
    pairs: [
      {
        first: { mesh: 0, instance: 0, triangle: 0 },
        second: { mesh: 1, instance: 0, triangle: 0 }
      }
    ]
  }
}
const plane = [0, 0, 0, 4, 0, 0, 0, 4, 0]
it.each([
  ['crossing', [1, 1, -1, 1, 1, 1, 2, 1, 1], 'surface-intersection'],
  ['parallel separated', [0, 0, 1, 4, 0, 1, 0, 4, 1], 'surface-separated'],
  ['coplanar overlapping', [1, 1, 0, 2, 1, 0, 1, 2, 0], 'surface-intersection'],
  ['coplanar separated', [5, 5, 0, 6, 5, 0, 5, 6, 0], 'surface-separated'],
  ['edge contact', [0, 0, 0, 4, 0, 0, 0, -4, 0], 'surface-intersection'],
  ['vertex contact', [4, 0, 0, 5, 0, 1, 5, 1, 1], 'surface-intersection'],
  [
    'small finite gap',
    [0, 0, 1e-12, 4, 0, 1e-12, 0, 4, 1e-12],
    'surface-separated'
  ],
  ['degenerate', [0, 0, 0, 1, 0, 0, 2, 0, 0], 'unknown']
])(
  'classifies original %s triangles without thickness or contact exemptions',
  (_name, points, expected) => {
    const f = setup([triangle('a', plane), triangle('b', points as number[])])
    const input = batch(),
      result = f.query.query(f.source, input),
      pair = result.results[0]
    expect(pair.status).toBe(expected)
    expect(pair.first.mesh).toBe(f.source.meshes[0])
    expect(pair.second.mesh).toBe(f.source.meshes[1])
    expect(pair.first.region).toBe(f.source.meshes[0].origin.regions[0])
    expect(pair.first.triangle).toBe(0)
    expect(result).not.toHaveProperty('clear')
    input.pairs[0].first.triangle = 999
    expect(result.input.pairs[0].first.triangle).toBe(0)
    expect(Object.isFrozen(result.input.pairs[0].first)).toBe(true)
    expect(Object.isFrozen(pair)).toBe(true)
  }
)

it('does not infer free material from separated nested closed box surfaces', () => {
  const boxes = [4, 1].map((size, i) => {
    const builder = new TriangleBuilder()
    builder.box([0, 0, 0], [size, size, size])
    const mesh = triangle(`box-${i}`, plane)
    return {
      ...mesh,
      regions: builder.regions(),
      descriptor: readSpatialDescriptor({
        ...mesh.descriptor,
        shape: builder.shape()
      }) as SiteMesh['descriptor']
    }
  })
  const f = setup(boxes),
    input = batch()
  input.pairs = Array.from({ length: 144 }, (_, index) => ({
    first: { mesh: 0, instance: 0, triangle: Math.floor(index / 12) },
    second: { mesh: 1, instance: 0, triangle: index % 12 }
  }))
  const result = f.query.query(f.source, input)
  expect(
    result.results.every((pair) => pair.status === 'surface-separated')
  ).toBe(true)
  expect(
    result.results.every((pair) => pair.first.region.kind === 'closed-solid')
  ).toBe(true)
  expect(result).not.toHaveProperty('bodyDisjoint')
})

it('preserves non-axis transform uncertainty while supporting ordinary interior crossings', () => {
  const first = triangle('a', plane),
    second = triangle('b', [1, 1, -1, 1, 1, 1, 2, 1, 1])
  const rotation = [0, Math.sin(Math.PI / 8), 0, Math.cos(Math.PI / 8)]
  for (const mesh of [first, second])
    mesh.descriptor = readSpatialDescriptor({
      ...mesh.descriptor,
      rotation
    }) as SiteMesh['descriptor']
  const f = setup([first, second])
  expect(f.query.query(f.source, batch()).results[0].status).toBe(
    'surface-intersection'
  )
  const touching = triangle('touch', [4, 0, 0, 5, 0, 1, 5, 1, 1])
  touching.descriptor = readSpatialDescriptor({
    ...touching.descriptor,
    rotation
  }) as SiteMesh['descriptor']
  const g = setup([first, touching])
  expect(g.query.query(g.source, batch()).results[0].status).toBe('unknown')
})

it('uses original instance then installed transforms without replacing source vertices', () => {
  const a = triangle('a', plane)
  a.descriptor = readSpatialDescriptor({
    ...a.descriptor,
    position: [10, 2, 3],
    instances: [
      { position: [1, 0, 0], yaw: 0 },
      { position: [0, 0, 10], yaw: Math.PI }
    ]
  }) as SiteMesh['descriptor']
  const b = triangle('b', [12, 3, 2, 12, 3, 4, 13, 3, 4])
  const f = setup([a, b]),
    input = batch()
  expect(f.query.query(f.source, input).results[0].status).toBe(
    'surface-intersection'
  )
  input.pairs[0].first.instance = 1
  expect(f.query.query(f.source, input).results[0].status).toBe(
    'surface-separated'
  )
})

it('rejects malformed or replaced input before FK and preserves unknown validity/dynamics', () => {
  const f = setup([triangle('a', plane), triangle('b', plane)])
  const fk = vi.spyOn(kinematics, 'evaluateRobotPose')
  try {
    for (const value of [NaN, -1, 0.5, 999]) {
      const input = batch()
      input.pairs[0].first.triangle = value
      expect(() => f.query.query(f.source, input)).toThrow()
    }
    const sparse = batch()
    sparse.robot = {
      base: {
        position: new Array(3) as unknown as Point3,
        rotation: [0, 0, 0, 1]
      },
      joints: { ...REST_JOINTS }
    }
    expect(() => f.query.query(f.source, sparse)).toThrow()
    const input = batch()
    let reads = 0
    Object.defineProperty(input, 'pairs', {
      enumerable: true,
      get() {
        reads++
        return [
          {
            first: { mesh: NaN, instance: 0, triangle: 0 },
            second: { mesh: 1, instance: 0, triangle: 0 }
          }
        ]
      }
    })
    expect(() => f.query.query(f.source, input)).toThrow()
    expect(reads).toBe(1)
    expect(fk).not.toHaveBeenCalled()
    for (const time of [0, 10]) {
      const timed = batch()
      timed.time = time
      expect(f.query.query(f.source, timed).results[0].status).toBe(
        time === 0 ? 'surface-intersection' : 'unknown'
      )
    }
    const unknown = batch()
    unknown.leaves = 'unknown'
    expect(f.query.query(f.source, unknown).results[0].status).toBe('unknown')
    expect(() => f.query.query({ ...f.source }, batch())).toThrow()
    f.site.clear()
    expect(() => f.query.query(f.source, batch())).toThrow()
  } finally {
    fk.mockRestore()
  }
})

it('queries actual farm, robot and installed dock sources with one FK and no generation or bounds work', () => {
  const site = new SiteGeometry(),
    meshes = buildSiteMeshes(farm, site),
    f = setup(meshes)
  const input = batch(),
    robotIndex = f.source.meshes.findIndex((mesh) => mesh.kind === 'robot'),
    dockIndex = f.source.meshes.findIndex((mesh) => mesh.kind === 'dock')
  input.pairs = [
    {
      first: { mesh: robotIndex, instance: 0, triangle: 0 },
      second: { mesh: dockIndex, instance: 0, triangle: 0 }
    },
    {
      first: { mesh: robotIndex, instance: 0, triangle: 1 },
      second: { mesh: dockIndex, instance: 0, triangle: 1 }
    }
  ]
  const crop = vi.spyOn(crops, 'createCropModels'),
    model = vi.spyOn(models, 'createRobotModel'),
    fk = vi.spyOn(kinematics, 'evaluateRobotPose')
  try {
    const result = f.query.query(f.source, input)
    expect(
      result.results.every((pair) => pair.status === 'surface-separated')
    ).toBe(true)
    expect(result.work.fk).toBe(1)
    expect(fk).toHaveBeenCalledTimes(1)
    expect(result.work.frames).toBe(3)
    expect(result.work.vertexVisits).toBe(12)
    expect(result.work.shapeBounds).toBe(0)
    expect(result.work.regionBounds).toBe(0)
    expect(crop).not.toHaveBeenCalled()
    expect(model).not.toHaveBeenCalled()
  } finally {
    crop.mockRestore()
    model.mockRestore()
    fk.mockRestore()
  }
})

it.each(['sparse', 'limit'])(
  'rejects %s pair state before source work',
  (kind) => {
    const f = setup([triangle('a', plane), triangle('b', plane)])
    const input = batch()
    if (!input.robot) throw new Error('Missing fixture pose')
    if (kind === 'sparse') input.pairs = new Array(1)
    else input.robot.joints.lift = 0.11
    expect(() => f.query.query(f.source, input)).toThrow()
  }
)

it('keeps real cultivar instances and botanical source metadata in a bounded surface profile', () => {
  const configuration = { ...DEFAULT_CONFIGURATION, length: 2.2 },
    site = new SiteGeometry()
  const f = setup(buildSiteMeshes(configuration, site), configuration, site),
    input = batch()
  const selected = ['cucumber-1914', 'tomato-yu-nu'].map((species) => {
    const index = f.source.meshes.findIndex(
      (mesh) =>
        mesh.plants &&
        mesh.plants.length > 1 &&
        mesh.plants[0].species === species &&
        mesh.partitions?.length
    )
    if (index < 0) throw new Error('Missing actual cultivar source')
    const mesh = f.source.meshes[index],
      part = mesh.partitions?.find((partition) => partition.fruitId !== null)
    if (!part) throw new Error('Missing source fruit ownership')
    return { index, mesh, triangle: part.indexStart / 3 }
  })
  input.pairs = selected.map(({ index, mesh, triangle }) => ({
    first: { mesh: index, instance: 0, triangle },
    second: { mesh: index, instance: (mesh.plants?.length ?? 1) - 1, triangle }
  }))
  const crop = vi.spyOn(crops, 'createCropModels'),
    model = vi.spyOn(models, 'createRobotModel'),
    dock = vi.spyOn(models, 'createDockModel'),
    prepare = vi.spyOn(f.owner, 'prepare')
  try {
    const start = performance.now(),
      result = f.query.query(f.source, input)
    expect(
      result.results.every((pair) => pair.status === 'surface-separated')
    ).toBe(true)
    expect(result.work).toMatchObject({
      pairs: 2,
      vertexVisits: 12,
      fk: 0,
      shapeBounds: 0,
      regionBounds: 0
    })
    result.results.forEach((pair, index) => {
      expect(pair.first.mesh).toBe(selected[index].mesh)
      expect(pair.first.triangle).toBe(selected[index].triangle)
      expect(pair.first.region).toBe(
        selected[index].mesh.origin.regions.find(
          (region) =>
            selected[index].triangle * 3 >= region.indexStart &&
            selected[index].triangle * 3 < region.indexStart + region.indexCount
        )
      )
    })
    expect(crop).not.toHaveBeenCalled()
    expect(model).not.toHaveBeenCalled()
    expect(dock).not.toHaveBeenCalled()
    expect(prepare).not.toHaveBeenCalled()
    console.log(
      'static source pair profile',
      JSON.stringify({
        work: result.work,
        milliseconds: performance.now() - start
      })
    )
  } finally {
    crop.mockRestore()
    model.mockRestore()
    dock.mockRestore()
    prepare.mockRestore()
  }
})

it('does not exempt intersecting original robot surfaces and preserves empty batches', () => {
  const f = setup([]),
    input = batch(),
    mesh = f.source.meshes.findIndex((item) => item.kind === 'robot')
  input.pairs = [
    {
      first: { mesh, instance: 0, triangle: 0 },
      second: { mesh, instance: 0, triangle: 0 }
    }
  ]
  expect(f.query.query(f.source, input).results[0].status).toBe(
    'surface-intersection'
  )
  input.pairs = []
  const empty = f.query.query(f.source, input)
  expect(empty.results).toEqual([])
  expect(empty.work).toMatchObject({
    pairs: 0,
    vertexVisits: 0,
    frames: 0,
    fk: 0
  })
})

function sweep(): SurfaceSweepBatch {
  const initial = batch()
  return {
    source: initial.source,
    from: 1,
    until: 3,
    validFrom: 0,
    validUntil: 10,
    robot: initial.robot,
    leaves: 'source-pose-throughout',
    fruits: 'all-attached-throughout',
    pairs: initial.pairs.map((pair) => ({
      ...pair,
      firstTranslation: [0, 0, 2],
      secondTranslation: [0, 0, 0]
    }))
  }
}
const shiftedPlane = (z: number) => [0, 0, z, 4, 0, z, 0, 4, z]
it.each([
  ['interior', 1, 0.5],
  ['initial endpoint', 0, 0],
  ['final endpoint', 2, 1],
  ['brief contact', 2e-12, 1e-12]
])(
  'proves continuous %s contact on original triangles',
  (_label, height, fraction) => {
    const f = setup([
        triangle('moving', plane),
        triangle('obstacle', shiftedPlane(height as number))
      ]),
      input = sweep()
    const result = f.query.sweep(f.source, input),
      contact = result.results[0]
    expect(contact.status).toBe('swept-intersection')
    if (!contact.contactFraction || !contact.contactTime)
      throw new Error('Missing certified contact occurrence')
    expect(contact.contactFraction.low).toBeLessThanOrEqual(fraction as number)
    expect(contact.contactFraction.high).toBeGreaterThanOrEqual(
      fraction as number
    )
    expect(contact.contactTime.low).toBeLessThanOrEqual(
      1 + 2 * (fraction as number)
    )
    expect(contact.contactTime.high).toBeGreaterThanOrEqual(
      1 + 2 * (fraction as number)
    )
    expect(contact.first.mesh).toBe(f.source.meshes[0])
    expect(contact.second.mesh).toBe(f.source.meshes[1])
    expect(Object.isFrozen(contact.contactFraction)).toBe(true)
    expect(Object.isFrozen(contact.contactTime)).toBe(true)
    if (fraction === 0.5) {
      expect(f.query.query(f.source, batch()).results[0].status).toBe(
        'surface-separated'
      )
      const end = setup([
        triangle('moving-end', shiftedPlane(2)),
        triangle('obstacle', shiftedPlane(1))
      ])
      expect(end.query.query(end.source, batch()).results[0].status).toBe(
        'surface-separated'
      )
    }
  }
)

it.each([
  ['coplanar overlap', [3, 0, 0, 4, 0, 0, 3, 1, 0], 'swept-intersection'],
  ['coplanar edge grazing', [3, 1, 0, 4, 1, 0, 3, 2, 0], 'swept-intersection'],
  ['coplanar separated', [3, 2, 0, 4, 2, 0, 3, 3, 0], 'swept-separated']
])(
  'covers continuous %s with the complete coplanar axis family',
  (_label, points, expected) => {
    const f = setup([
        triangle('moving', [0, 0, 0, 1, 0, 0, 0, 1, 0]),
        triangle('obstacle', points as number[])
      ]),
      input = sweep()
    input.pairs[0].firstTranslation = [4, 0, 0]
    expect(f.query.sweep(f.source, input).results[0].status).toBe(expected)
  }
)

it('requires one common time instead of unrelated axis overlap times', () => {
  const f = setup([
      triangle('moving', [0, 0, 0, 1, 0, 0, 0, 1, 0]),
      triangle('obstacle', [3, 0, 1, 4, 0, 1, 3, 1, 1])
    ]),
    input = sweep()
  input.pairs[0].firstTranslation = [4, 0, 4]
  // Z overlap requires t=1/4; X overlap requires t>=1/2.
  expect(f.query.sweep(f.source, input).results[0].status).toBe(
    'swept-separated'
  )
})

it.each([0, 1])(
  'preserves zero relative motion and common translation for original separation %s',
  (height) => {
    const f = setup([
        triangle('a', plane),
        triangle('b', shiftedPlane(height))
      ]),
      input = sweep()
    for (const translation of [
      [0, 0, 0],
      [1e10, 3, -9]
    ] as Point3[]) {
      input.pairs[0].firstTranslation = translation
      input.pairs[0].secondTranslation = translation
      expect(f.query.sweep(f.source, input).results[0].status).toBe(
        height ? 'swept-separated' : 'swept-intersection'
      )
    }
  }
)

it('retains transformed interval ambiguity instead of declaring endpoint separation clear', () => {
  const a = triangle('a', plane),
    b = triangle('b', shiftedPlane(1))
  const rotation = [0, Math.sin(Math.PI / 8), 0, Math.cos(Math.PI / 8)]
  for (const mesh of [a, b])
    mesh.descriptor = readSpatialDescriptor({
      ...mesh.descriptor,
      rotation
    }) as SiteMesh['descriptor']
  const f = setup([a, b]),
    input = sweep()
  input.pairs[0].firstTranslation = [Math.SQRT2, 0, Math.SQRT2]
  expect(f.query.sweep(f.source, input).results[0].status).toBe('unknown')
})

it('requires fresh assumptions through the closed final endpoint and rejects malformed sweep inputs', () => {
  const f = setup([triangle('a', plane), triangle('b', shiftedPlane(1))])
  for (const value of [NaN, Infinity, 1, 0]) {
    const input = sweep()
    input.until = value
    expect(() => f.query.sweep(f.source, input)).toThrow()
  }
  const sparse = sweep()
  sparse.pairs[0].firstTranslation = new Array(3) as unknown as Point3
  expect(() => f.query.sweep(f.source, sparse)).toThrow()
  const instant = { ...sweep(), leaves: 'source-pose' }
  expect(() => f.query.sweep(f.source, instant as SurfaceSweepBatch)).toThrow()
  const expired = sweep()
  expired.validUntil = expired.until
  expect(f.query.sweep(f.source, expired).results[0].status).toBe('unknown')
  expired.validUntil = 4
  expect(f.query.sweep(f.source, expired).results[0].status).toBe(
    'swept-intersection'
  )
  expired.leaves = 'unknown'
  expect(f.query.sweep(f.source, expired).results[0].status).toBe('unknown')
  const getter = sweep()
  let reads = 0
  Object.defineProperty(getter, 'until', {
    enumerable: true,
    get() {
      reads++
      return NaN
    }
  })
  expect(() => f.query.sweep(f.source, getter)).toThrow()
  expect(reads).toBe(1)
  expect(() => f.query.sweep({ ...f.source }, sweep())).toThrow()
  f.site.clear()
  expect(() => f.query.sweep(f.source, sweep())).toThrow()
})

it('reuses completed source and batch FK for an actual robot and installed dock sweep', () => {
  const f = setup([]),
    input = sweep(),
    mesh = f.source.meshes.findIndex((item) => item.kind === 'robot'),
    dock = f.source.meshes.findIndex((item) => item.kind === 'dock')
  input.pairs = [0, 1].map((triangle) => ({
    first: { mesh, triangle, instance: 0 },
    second: { mesh: dock, triangle, instance: 0 },
    firstTranslation: [0.1, 0, 0],
    secondTranslation: [0, 0, 0]
  }))
  const fk = vi.spyOn(kinematics, 'evaluateRobotPose'),
    prepare = vi.spyOn(f.owner, 'prepare')
  try {
    const result = f.query.sweep(f.source, input)
    expect(
      result.results.every((pair) => pair.status === 'swept-separated')
    ).toBe(true)
    expect(result.work).toMatchObject({
      pairs: 2,
      frames: 3,
      vertexVisits: 12,
      fk: 1,
      shapeBounds: 0,
      regionBounds: 0
    })
    expect(fk).toHaveBeenCalledTimes(1)
    expect(prepare).not.toHaveBeenCalled()
    input.pairs[0].firstTranslation = [99, 0, 0]
    expect(result.input.pairs[0].firstTranslation[0]).toBe(0.1)
    expect(Object.isFrozen(result.input.pairs[0].firstTranslation)).toBe(true)
  } finally {
    fk.mockRestore()
    prepare.mockRestore()
  }
})

it('proves a common guaranteed nonpoint time and conclusive nonpoint separation', () => {
  const a = triangle('a', plane),
    b = triangle('b', [1, 1, -1, 2, 1.25, 1, 1.125, 2, 1.5])
  const rotation = [0, Math.sin(Math.PI / 8), 0, Math.cos(Math.PI / 8)]
  for (const mesh of [a, b])
    mesh.descriptor = readSpatialDescriptor({
      ...mesh.descriptor,
      rotation
    }) as SiteMesh['descriptor']
  const f = setup([a, b]),
    input = sweep()
  input.pairs[0].firstTranslation = [0.5, 0, 0]
  input.pairs[0].secondTranslation = [0.5, 0, 0]
  const contact = f.query.sweep(f.source, input).results[0]
  expect(contact.status).toBe('swept-intersection')
  expect(contact.reason).toBe('common-guaranteed-time')
  expect(contact.contactFraction).toEqual({ low: 0, high: 0 })
  const far = triangle('far', shiftedPlane(10))
  far.descriptor = readSpatialDescriptor({
    ...far.descriptor,
    rotation
  }) as SiteMesh['descriptor']
  const separated = setup([a, far])
  expect(separated.query.sweep(separated.source, input).results[0].status).toBe(
    'swept-separated'
  )
})

it('keeps relative displacement and large finite simulation-time conversion conservative', () => {
  const f = setup([triangle('a', plane), triangle('b', shiftedPlane(1))]),
    input = sweep()
  input.pairs[0].firstTranslation = [0, 0, 1]
  input.pairs[0].secondTranslation = [0, 0, -1]
  input.from = 8e307
  input.until = 1.6e308
  input.validUntil = 1.7e308
  const contact = f.query.sweep(f.source, input).results[0]
  expect(contact.status).toBe('swept-intersection')
  expect(contact.contactFraction).toEqual({ low: 0.5, high: 0.5 })
  if (!contact.contactTime) throw new Error('Missing time enclosure')
  expect(contact.contactTime.low).toBeLessThanOrEqual(1.2e308)
  expect(contact.contactTime.high).toBeGreaterThanOrEqual(1.2e308)
  expect(contact.contactTime.low).toBeGreaterThanOrEqual(input.from)
  expect(contact.contactTime.high).toBeLessThanOrEqual(input.until)
})

function coverage(): SurfaceCoverageBatch {
  const input = sweep()
  return {
    source: input.source,
    from: input.from,
    until: input.until,
    validFrom: input.validFrom,
    validUntil: input.validUntil,
    robot: input.robot,
    leaves: input.leaves,
    fruits: input.fruits,
    displacement: [0, 0, 2],
    held: 'empty',
    maxTrianglePairs: 100
  }
}
function smallCoverage(
  meshes: SiteMesh[] = [],
  overlapping = false,
  degenerate = false,
  firstRegions = 1
) {
  // A deliberately small admitted source fixture proves exhaustive traversal.
  // Actual generated robot/farm inventory is independently covered below.
  const ids = [
    'lift-carriage',
    'shoulder',
    'upper-arm',
    'elbow',
    'forearm',
    'wrist',
    'tool-guard',
    'pad--1',
    'pad-1',
    'crate-bottom',
    'tire--1--1'
  ]
  const parts = ids.map((id, i) => {
    const builder = new TriangleBuilder(),
      x = overlapping && i === 7 ? 60 : i * 10
    for (let region = 0; region < (i === 0 ? firstRegions : 1); region++)
      builder.triangle(
        [x, 0, 0],
        [x + 4, 0, 0],
        degenerate && i === 0 ? [x + 2, 0, 0] : [x, 4, 0]
      )
    return {
      id,
      color: 0xffffff,
      metalness: 0,
      regions: builder.regions(),
      shape: builder.shape()
    }
  })
  const rig = prepareRobotRig(DEFAULT_ROBOT, parts)
  const sourceRobot: RobotSource = Object.freeze({
    revision: 100,
    parts: Object.freeze(rig.parts.map((part) => part.source)),
    rig,
    unavailable: null
  })
  const dock: DockSource = Object.freeze({
    revision: 100,
    meshes: Object.freeze([])
  })
  const site = new SiteGeometry(),
    scene = site.prepareScene(farm, meshes)
  const receipt: GeometryReceipt = Object.freeze({
    revision: 100,
    scene,
    robot: sourceRobot,
    dock
  })
  const owner = new QueryGeometry({
    isCurrentReceipt: (value) => value === receipt,
    isCurrentScene: site.isCurrentScene.bind(site),
    isCurrentRobot: (value) => value === sourceRobot,
    isCurrentDock: (value) => value === dock
  })
  return {
    site,
    owner,
    source: owner.prepare(receipt),
    query: new SurfaceQueries(owner)
  }
}
function expectedInventory(source: ReturnType<typeof setup>['source']) {
  const robots = source.meshes.filter((mesh) => mesh.kind === 'robot'),
    environment = source.meshes.filter((mesh) => mesh.kind !== 'robot')
  const triangles = (mesh: (typeof robots)[number]) => {
    if (mesh.shape.kind !== 'triangles')
      throw new Error('Invalid fixture source')
    return mesh.shape.indices.length / 3
  }
  let meshPairs = 0,
    trianglePairs = 0,
    environmentInstances = 0
  for (const mesh of environment)
    environmentInstances += mesh.descriptor?.instances?.length ?? 1
  for (let i = 0; i < robots.length; i++) {
    for (const mesh of environment) {
      const instances = mesh.descriptor?.instances?.length ?? 1
      meshPairs += instances
      trianglePairs += triangles(robots[i]) * triangles(mesh) * instances
    }
    for (let j = i + 1; j < robots.length; j++) {
      meshPairs++
      trianglePairs += triangles(robots[i]) * triangles(robots[j])
    }
  }
  return {
    robotParts: robots.length,
    environmentInstances,
    meshPairs,
    trianglePairs
  }
}

it('covers the complete original pair domain with exact-budget middle contact', () => {
  const f = smallCoverage([triangle('obstacle', shiftedPlane(1))]),
    input = coverage()
  input.maxTrianglePairs = 1
  const result = f.query.cover(f.source, input)
  expect(result.inventory).toEqual(expectedInventory(f.source))
  expect(result.inventory).toMatchObject({
    robotParts: 11,
    environmentInstances: 1,
    meshPairs: 66,
    trianglePairs: 66
  })
  expect(result.complete).toBe(true)
  expect(result.status).toBe('surface-intersections')
  expect(result.coverage).toMatchObject({
    excluded: 65,
    queried: 1,
    unvisited: 0,
    intersections: 1,
    uncertain: 0
  })
  expect(result.witnesses).toHaveLength(1)
  expect(result.witnesses[0].first.mesh.origin.id).toBe('lift-carriage')
  expect(result.witnesses[0].second.mesh.origin.id).toBe('obstacle')
  expect(result).not.toHaveProperty('movementClear')
})

it('permits complete strict exclusion at zero budget but never hides a remaining pair', () => {
  const separated = smallCoverage(),
    input = coverage()
  input.maxTrianglePairs = 0
  const complete = separated.query.cover(separated.source, input)
  expect(complete.complete).toBe(true)
  expect(complete.status).toBe('surface-separated')
  expect(complete.coverage).toMatchObject({
    excluded: 55,
    queried: 0,
    unvisited: 0
  })
  const crossing = smallCoverage([triangle('obstacle', shiftedPlane(1))]),
    partial = crossing.query.cover(crossing.source, input)
  expect(partial.complete).toBe(false)
  expect(partial.status).toBe('unknown')
  expect(partial.coverage).toMatchObject({
    excluded: 65,
    queried: 0,
    unvisited: 1
  })
})

it('includes distinct same-body parts and preserves complete numerical uncertainty', () => {
  const f = smallCoverage([], true),
    result = f.query.cover(f.source, coverage())
  expect(result.complete).toBe(true)
  expect(result.status).toBe('surface-intersections')
  const witness = result.witnesses[0]
  expect(witness.first.mesh.body).toBe('wrist')
  expect(witness.second.mesh.body).toBe('wrist')
  expect(witness.first.mesh.origin.id).not.toBe(witness.second.mesh.origin.id)
  const degenerate = smallCoverage(
      [triangle('obstacle', shiftedPlane(1))],
      false,
      true
    ),
    unknown = degenerate.query.cover(degenerate.source, coverage())
  expect(unknown.complete).toBe(true)
  expect(unknown.status).toBe('unknown')
  expect(unknown.coverage.uncertain).toBe(1)
})

it('keeps whole-source coverage input atomic, retained fruit unknown and work bounded', () => {
  const f = smallCoverage([triangle('obstacle', shiftedPlane(1))])
  for (const value of [-1, 0.5, NaN, Infinity]) {
    const input = coverage()
    input.maxTrianglePairs = value
    expect(() => f.query.cover(f.source, input)).toThrow()
  }
  const input = coverage()
  input.held = 'unknown'
  const held = f.query.cover(f.source, input)
  expect(held.status).toBe('unknown')
  expect(held.complete).toBe(false)
  expect(held.work.fk).toBe(0)
  expect(held.coverage.queried).toBe(0)
  const malformed = coverage()
  let reads = 0
  Object.defineProperty(malformed, 'displacement', {
    enumerable: true,
    get() {
      reads++
      return new Array(3)
    }
  })
  expect(() => f.query.cover(f.source, malformed)).toThrow()
  expect(reads).toBe(1)
  const valid = coverage(),
    result = f.query.cover(f.source, valid)
  valid.displacement = [0, 0, 99]
  expect(result.input.displacement).toEqual([0, 0, 2])
  expect(Object.isFrozen(result.coverage)).toBe(true)
  expect(Object.isFrozen(result.inventory)).toBe(true)
  expect(Object.isFrozen(result.witnesses)).toBe(true)
  expect(result.work).toMatchObject({
    fk: 1,
    boundsCorners: 96,
    placements: 12,
    shapeBounds: 0,
    regionBounds: 0
  })
  f.site.clear()
  expect(() => f.query.cover(f.source, coverage())).toThrow()
})

it('inventories every real robot and hidden physical instance before bounded Cartesian traversal', () => {
  const configuration = { ...DEFAULT_CONFIGURATION, length: 2.2 },
    site = new SiteGeometry()
  const f = setup(buildSiteMeshes(configuration, site), configuration, site),
    expected = expectedInventory(f.source),
    input = coverage()
  input.maxTrianglePairs = 32
  // Counts are obtained from source topology before any triangle Cartesian loop.
  console.log('whole-source Cartesian inventory', JSON.stringify(expected))
  const crop = vi.spyOn(crops, 'createCropModels'),
    model = vi.spyOn(models, 'createRobotModel'),
    dock = vi.spyOn(models, 'createDockModel'),
    prepare = vi.spyOn(f.owner, 'prepare'),
    fk = vi.spyOn(kinematics, 'evaluateRobotPose')
  try {
    const start = performance.now(),
      result = f.query.cover(f.source, input)
    expect(result.inventory).toEqual(expected)
    expect(result.coverage.queried).toBeLessThanOrEqual(32)
    expect(
      result.coverage.excluded +
        result.coverage.queried +
        result.coverage.unvisited
    ).toBe(expected.trianglePairs)
    expect(result.complete).toBe(result.coverage.unvisited === 0)
    expect(result.complete).toBe(false)
    expect(result.status).not.toBe('surface-separated')
    expect(result.witnesses.length).toBeLessThanOrEqual(2)
    for (const id of ['tool-guard', 'crate-bottom', 'tire--1--1'])
      expect(
        f.source.meshes.some(
          (mesh) => mesh.kind === 'robot' && mesh.origin.id === id
        )
      ).toBe(true)
    for (const layer of ['film', 'net', 'soil', 'cucumbers', 'tomatoes'])
      expect(f.source.meshes.some((mesh) => mesh.layer === layer)).toBe(true)
    expect(f.source.meshes.some((mesh) => mesh.kind === 'dock')).toBe(true)
    expect(fk).toHaveBeenCalledTimes(1)
    expect(prepare).not.toHaveBeenCalled()
    expect(crop).not.toHaveBeenCalled()
    expect(model).not.toHaveBeenCalled()
    expect(dock).not.toHaveBeenCalled()
    expect(result.work.shapeBounds).toBe(0)
    expect(result.work.regionBounds).toBe(0)
    console.log(
      'whole-source bounded profile',
      JSON.stringify({
        work: result.work,
        coverage: result.coverage,
        milliseconds: performance.now() - start
      })
    )
  } finally {
    crop.mockRestore()
    model.mockRestore()
    dock.mockRestore()
    prepare.mockRestore()
    fk.mockRestore()
  }
})

it('profiles existing primitive bounds without dropping unprepared sheets or traversing triangle products', () => {
  const configuration = { ...DEFAULT_CONFIGURATION, length: 2.2 },
    site = new SiteGeometry()
  const f = setup(buildSiteMeshes(configuration, site), configuration, site),
    input = coverage()
  const robotState = input.robot,
    rig = f.source.receipt.robot.rig
  if (!robotState || !rig) throw new Error('Expected admitted robot fixture')
  const started = performance.now(),
    pose = kinematics.evaluateRobotPose(rig, robotState.joints)
  const bodies = new Map(
    pose.parts.map((part) => [part.source, part.transform])
  )
  type Frame = ReturnType<typeof prepareQueryForwardFrame>
  let corners = 0,
    missingBounds = 0,
    regionPairs = 0,
    excluded = 0,
    remaining = 0
  const placements = f.source.meshes.flatMap((mesh) => {
    const shape = mesh.shape
    if (shape.kind !== 'triangles') throw new Error('Expected triangles')
    return Array.from(
      { length: mesh.descriptor?.instances?.length ?? 1 },
      (_, instance) => {
        const frames: Frame[] = [],
          placement = mesh.descriptor?.instances?.[instance]
        if (placement) frames.push(prepareQueryInstanceFrame(placement))
        if (mesh.kind === 'robot') {
          const body = bodies.get(
            mesh.origin as (typeof pose.parts)[number]['source']
          )
          if (!body) throw new Error('Missing body')
          frames.push(
            prepareQueryForwardFrame(body),
            prepareQueryForwardFrame(robotState.base)
          )
        } else {
          if (!mesh.descriptor) throw new Error('Missing descriptor')
          frames.push(prepareQueryForwardFrame(mesh.descriptor))
        }
        const displacement =
          mesh.kind === 'robot' ? input.displacement : [0, 0, 0]
        const transform = (local: GeometryBounds): GeometryBounds => {
          const min = [Infinity, Infinity, Infinity],
            max = [-Infinity, -Infinity, -Infinity]
          for (let corner = 0; corner < 8; corner++) {
            let point = [
              interval(corner & 1 ? local.max[0] : local.min[0]),
              interval(corner & 2 ? local.max[1] : local.min[1]),
              interval(corner & 4 ? local.max[2] : local.min[2])
            ] as readonly [Interval, Interval, Interval]
            for (const frame of frames)
              point = transformQueryPoint(frame, point)
            corners++
            for (let axis = 0; axis < 3; axis++) {
              min[axis] = Math.min(min[axis], point[axis].low)
              max[axis] = Math.max(max[axis], point[axis].high)
            }
          }
          for (let axis = 0; axis < 3; axis++) {
            min[axis] = add(
              interval(min[axis]),
              interval(Math.min(0, displacement[axis]))
            ).low
            max[axis] = add(
              interval(max[axis]),
              interval(Math.max(0, displacement[axis]))
            ).high
          }
          return {
            min: min as unknown as Point3,
            max: max as unknown as Point3
          }
        }
        const bounds = transform(mesh.prepared.bounds)
        let regions: { count: number; bounds: GeometryBounds }[] | undefined
        return {
          mesh,
          count: shape.indices.length / 3,
          bounds,
          regions: () => {
            if (!regions) {
              const prepared = new Map(
                mesh.prepared.regions.map((region) => [
                  region.source,
                  region.bounds
                ])
              )
              regions = mesh.origin.regions.map((region) => {
                const local = prepared.get(region)
                if (!local) missingBounds++
                return {
                  count: region.indexCount / 3,
                  bounds: local ? transform(local) : bounds
                }
              })
              expect(
                regions.reduce((sum, region) => sum + region.count, 0)
              ).toBe(shape.indices.length / 3)
            }
            return regions
          }
        }
      }
    )
  })
  const separate = (a: GeometryBounds, b: GeometryBounds) =>
    a.min.some(
      (value, axis) => value > b.max[axis] || a.max[axis] < b.min[axis]
    )
  const compare = (
    a: (typeof placements)[number],
    b: (typeof placements)[number]
  ) => {
    if (separate(a.bounds, b.bounds)) {
      excluded += a.count * b.count
      return
    }
    for (const first of a.regions())
      for (const second of b.regions()) {
        regionPairs++
        if (separate(first.bounds, second.bounds))
          excluded += first.count * second.count
        else remaining += first.count * second.count
      }
  }
  const robots = placements.filter((value) => value.mesh.kind === 'robot'),
    environment = placements.filter((value) => value.mesh.kind !== 'robot')
  for (let i = 0; i < robots.length; i++) {
    for (const item of environment) compare(robots[i], item)
    for (let j = i + 1; j < robots.length; j++) compare(robots[i], robots[j])
  }
  expect(excluded + remaining).toBe(expectedInventory(f.source).trianglePairs)
  expect(missingBounds).toBeGreaterThan(0)
  expect(remaining).toBeGreaterThan(0)
  const milliseconds = performance.now() - started
  const production = f.query.cover(f.source, { ...input, maxTrianglePairs: 0 })
  expect(production.coverage).toMatchObject({
    excluded,
    unvisited: remaining,
    queried: 0
  })
  console.log(
    'passive original-region profile',
    JSON.stringify({
      regionPairs,
      excluded,
      remaining,
      missingBounds,
      corners,
      milliseconds
    })
  )
})

it('preserves exhaustive surface relations through prepared and unprepared original regions', () => {
  const builder = new TriangleBuilder()
  builder.box([100, 0, 1], [2, 2, 0.5])
  builder.box([0, 0, 1], [2, 2, 0.5])
  builder.quad([0, 0, 1], [2, 0, 1], [2, 2, 1], [0, 2, 1])
  const mesh = triangle('mixed-regions', [0, 0, 0, 1, 0, 0, 0, 1, 0])
  mesh.regions = builder.regions()
  mesh.descriptor = readSpatialDescriptor({
    ...mesh.descriptor,
    shape: builder.shape()
  }) as SiteMesh['descriptor']
  const f = smallCoverage([mesh]),
    input = coverage()
  const robots = f.source.meshes
    .map((item, index) => ({ item, index }))
    .filter((value) => value.item.kind === 'robot')
  const environment = f.source.meshes
    .map((item, index) => ({ item, index }))
    .filter((value) => value.item.kind !== 'robot')
  const pairs: SurfaceSweepBatch['pairs'] = []
  const collect = (
    first: (typeof robots)[number],
    second: (typeof robots)[number]
  ) => {
    if (
      first.item.shape.kind !== 'triangles' ||
      second.item.shape.kind !== 'triangles'
    )
      throw new Error('Expected triangles')
    for (let a = 0; a < first.item.shape.indices.length / 3; a++)
      for (let b = 0; b < second.item.shape.indices.length / 3; b++) {
        pairs.push({
          first: { mesh: first.index, instance: 0, triangle: a },
          second: { mesh: second.index, instance: 0, triangle: b },
          firstTranslation: input.displacement,
          secondTranslation:
            second.item.kind === 'robot' ? input.displacement : [0, 0, 0]
        })
      }
  }
  for (let i = 0; i < robots.length; i++) {
    for (const item of environment) collect(robots[i], item)
    for (let j = i + 1; j < robots.length; j++) collect(robots[i], robots[j])
  }
  const exhaustive = f.query.sweep(f.source, { ...input, pairs })
  const result = f.query.cover(f.source, {
    ...input,
    maxTrianglePairs: pairs.length
  })
  expect(result.complete).toBe(true)
  expect(result.inventory.trianglePairs).toBe(pairs.length)
  expect(result.coverage.intersections).toBe(
    exhaustive.results.filter((value) => value.status === 'swept-intersection')
      .length
  )
  expect(result.coverage.uncertain).toBe(
    exhaustive.results.filter((value) => value.status === 'unknown').length
  )
  expect(result.coverage.intersections).toBeGreaterThan(0)
  expect(result.coverage.excluded + result.coverage.queried).toBe(pairs.length)
  expect(result.work).toMatchObject({
    regionPairs: expect.any(Number),
    fk: 1,
    shapeBounds: 0,
    regionBounds: 0
  })
  expect(result.work.boundsCorners).toBe(112)
  const sourceMesh = f.source.meshes.find(
    (value) => value.origin.id === 'mixed-regions'
  )
  expect(sourceMesh?.origin.regions.length).toBe(3)
  expect(sourceMesh?.prepared.regions.length).toBe(2)
})

it('retains exact region-bound contact at the closed translation endpoint', () => {
  const builder = new TriangleBuilder()
  builder.box([1, 1, 0.5], [2, 2, 1])
  const mesh = triangle('contact-box', [0, 0, 0, 1, 0, 0, 0, 1, 0])
  mesh.regions = builder.regions()
  mesh.descriptor = readSpatialDescriptor({
    ...mesh.descriptor,
    shape: builder.shape()
  }) as SiteMesh['descriptor']
  const f = smallCoverage([mesh]),
    input = { ...coverage(), displacement: [0, 0, -2] as Point3 }
  const limited = f.query.cover(f.source, { ...input, maxTrianglePairs: 0 })
  expect(limited.complete).toBe(false)
  expect(limited.coverage.unvisited).toBe(12)
  const result = f.query.cover(f.source, input)
  expect(result.complete).toBe(true)
  expect(result.status).toBe('surface-intersections')
  expect(result.witnesses[0].contactFraction).toEqual({ low: 0, high: 0 })
})

it('keeps every original region triangle and exhaustive nonseparated pair across two fixtures and poses', () => {
  for (const height of [0, 1]) {
    const mesh = triangle('hierarchy-sheet', shiftedPlane(height))
    const builder = new TriangleBuilder()
    builder.box([1, 1, height], [2, 2, 1])
    builder.quad([0, 0, height], [2, 0, height], [2, 2, height], [0, 2, height])
    mesh.regions = builder.regions()
    mesh.descriptor = readSpatialDescriptor({
      ...mesh.descriptor,
      shape: builder.shape()
    }) as SiteMesh['descriptor']
    const alternate = {
      ...mesh,
      id: 'alternate-region-mapping',
      regions: Object.freeze([
        Object.freeze({
          id: 'complete-sheet',
          kind: 'sheet' as const,
          indexStart: 0,
          indexCount: (mesh.descriptor.shape as { indices: readonly number[] })
            .indices.length
        })
      ])
    }
    const f = smallCoverage(height === 0 ? [mesh] : [mesh, alternate]),
      tree = prepareHierarchy(f.source)
    if (height !== 0) expect(tree.work.mappings).toBe(tree.work.shapes + 1)
    for (const sourceMesh of f.source.meshes) {
      const ordinals: number[] = []
      const visit = (node: ReturnType<typeof tree.roots>[number]) => {
        expect(sourceMesh.origin.regions.includes(node.region)).toBe(true)
        if (node.children) {
          expect(node.children[0].count + node.children[1].count).toBe(
            node.count
          )
          node.children.forEach(visit)
        } else
          for (const ordinal of node.triangles ?? []) {
            expect(ordinal * 3).toBeGreaterThanOrEqual(node.region.indexStart)
            expect(ordinal * 3).toBeLessThan(
              node.region.indexStart + node.region.indexCount
            )
            ordinals.push(ordinal)
          }
      }
      tree.roots(sourceMesh).forEach(visit)
      if (sourceMesh.shape.kind !== 'triangles')
        throw new Error('Expected source')
      expect(ordinals.sort((a, b) => a - b)).toEqual(
        Array.from({ length: sourceMesh.shape.indices.length / 3 }, (_, i) => i)
      )
    }
    expect(() => tree.roots(smallCoverage([mesh]).source.meshes[0])).toThrow()
    for (const yaw of [0, 0.4]) {
      const input = coverage()
      if (!input.robot) throw new Error('Expected robot')
      input.robot = {
        ...input.robot,
        base: {
          position: [0, 0, 0],
          rotation: [0, Math.sin(yaw / 2), 0, Math.cos(yaw / 2)]
        }
      }
      const report = queryHierarchy(tree, input, true)
      const pairs: SurfaceSweepBatch['pairs'] = []
      const meshes = f.source.meshes
      for (let a = 0; a < meshes.length; a++) {
        if (meshes[a].kind !== 'robot') continue
        for (let b = 0; b < meshes.length; b++) {
          if (meshes[b].kind === 'robot' && b <= a) continue
          const first = meshes[a].shape,
            second = meshes[b].shape
          if (first.kind !== 'triangles' || second.kind !== 'triangles')
            throw new Error('Expected triangles')
          for (let x = 0; x < first.indices.length / 3; x++)
            for (let y = 0; y < second.indices.length / 3; y++)
              pairs.push({
                first: { mesh: a, instance: 0, triangle: x },
                second: { mesh: b, instance: 0, triangle: y },
                firstTranslation: input.displacement,
                secondTranslation:
                  meshes[b].kind === 'robot' ? input.displacement : [0, 0, 0]
              })
        }
      }
      const key = (pair: (typeof report.candidates)[number]) =>
        `${pair.first.mesh}:${pair.first.triangle}:${pair.second.mesh}:${pair.second.triangle}`
      const candidates = new Set(report.candidates.map(key))
      expect(candidates.size).toBe(report.candidates.length)
      expect(report.work.unvisited).toBe(0)
      expect(report.work.total).toBe(pairs.length)
      expect(report.work.excluded + report.work.candidates).toBe(pairs.length)
      const full = f.query.sweep(f.source, { ...input, pairs })
      full.results.forEach((result, index) => {
        if (result.status !== 'swept-separated')
          expect(candidates.has(key(pairs[index]))).toBe(true)
      })
      const selected = f.query.sweep(f.source, {
        ...input,
        pairs: pairs.filter((pair) => candidates.has(key(pair)))
      })
      for (const status of ['swept-intersection', 'unknown'])
        expect(
          selected.results.filter((value) => value.status === status).length
        ).toBe(full.results.filter((value) => value.status === status).length)
    }
  }
})

it('profiles cold source hierarchy and two warm poses without Cartesian triangle traversal', () => {
  const configuration = { ...DEFAULT_CONFIGURATION, length: 2.2 },
    site = new SiteGeometry()
  const f = setup(buildSiteMeshes(configuration, site), configuration, site),
    tree = prepareHierarchy(f.source)
  expect(tree.work.leafReferences).toBe(tree.work.builtTriangles)
  console.log(
    'hierarchy cold source profile',
    JSON.stringify({
      work: tree.work,
      milliseconds: tree.milliseconds,
      payloadBytes: tree.payloadBytes
    })
  )
  for (const yaw of [0, 0.4]) {
    const input = coverage()
    if (!input.robot) throw new Error('Expected robot')
    input.robot = {
      ...input.robot,
      base: {
        position: [0, 0, 0],
        rotation: [0, Math.sin(yaw / 2), 0, Math.cos(yaw / 2)]
      }
    }
    const baselineStart = performance.now(),
      baseline = f.query.cover(f.source, { ...input, maxTrianglePairs: 0 }),
      baselineMs = performance.now() - baselineStart
    const report = queryHierarchy(tree, input)
    expect(report.work.total).toBe(expectedInventory(f.source).trianglePairs)
    expect(
      report.work.excluded + report.work.candidates + report.work.unvisited
    ).toBe(report.work.total)
    expect(report.work.nodePairs).toBeLessThanOrEqual(500000)
    expect(report.candidates).toHaveLength(0)
    console.log(
      'hierarchy warm pose profile',
      JSON.stringify({
        yaw,
        baselineRemaining: baseline.coverage.unvisited,
        baselineMs,
        work: report.work,
        milliseconds: report.milliseconds
      })
    )
  }
})

it.each(['build', 'query'] as const)(
  'stops synchronous hierarchy %s after the fixed elapsed budget',
  (operation) => {
    const f = smallCoverage(),
      tree = prepareHierarchy(f.source)
    const clock = vi
      .spyOn(performance, 'now')
      .mockReturnValue(10001)
      .mockReturnValueOnce(0)
    try {
      expect(() =>
        operation === 'build'
          ? prepareHierarchy(f.source)
          : queryHierarchy(tree, coverage())
      ).toThrow('Hierarchy experiment time guard exceeded')
    } finally {
      clock.mockRestore()
    }
  }
)

it('checks elapsed time while accounting for root pairs after node budget exhaustion', () => {
  const builder = new TriangleBuilder()
  for (let i = 0; i < 710; i++)
    builder.triangle([0, 0, 0], [4, 0, 0], [0, 4, 0])
  const mesh = triangle('many-original-regions', [0, 0, 0, 4, 0, 0, 0, 4, 0])
  mesh.regions = builder.regions()
  mesh.descriptor = readSpatialDescriptor({
    ...mesh.descriptor,
    shape: builder.shape()
  }) as SiteMesh['descriptor']
  const f = smallCoverage([mesh], false, false, 710),
    tree = prepareHierarchy(f.source)
  // 710×710 original root pairs exceed the fixed 500,000 node budget.
  // The synthetic clock advances only after the periodic active-work checks,
  // requiring continued cooperative checks while the remainder is accounted.
  let reads = 0
  const clock = vi
    .spyOn(performance, 'now')
    .mockImplementation(() => (++reads >= 2000 ? 10001 : 0))
  try {
    expect(() => queryHierarchy(tree, coverage())).toThrow(
      'Hierarchy experiment time guard exceeded'
    )
  } finally {
    clock.mockRestore()
  }
})
