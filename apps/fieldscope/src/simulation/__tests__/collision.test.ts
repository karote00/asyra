import { expect, it, vi } from 'vitest'
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
import { REST_JOINTS } from '../../domain/robot-kinematics'
import * as kinematics from '../../domain/robot-kinematics'
import * as crops from '../../domain/crop-models'
import * as models from '../../domain/robot-model'
import { TriangleBuilder } from '../../domain/mesh'
import { QueryGeometry, type GeometryReceipt } from '../geometry'
import { SurfaceQueries, type SurfaceBatch } from '../collision'

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
