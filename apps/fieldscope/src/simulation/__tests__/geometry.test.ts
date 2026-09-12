import { beforeAll, expect, it, vi } from 'vitest'
import { SiteGeometry } from '../../render-app/site-geometry'
import { buildSiteMeshes } from '../../render-app/site-projection'
import { RobotProjection } from '../../render-app/robot-projection'
import { DEFAULT_CONFIGURATION } from '../../domain/farm-configuration'
import {
  DEFAULT_ROBOT,
  assessRobotDesign,
  validateRobot
} from '../../domain/robot-configuration'
import * as crops from '../../domain/crop-models'
import * as models from '../../domain/robot-model'
import { QueryGeometry, type GeometryReceipt } from '../geometry'

const site = new SiteGeometry()
const robot = new RobotProjection()
const farm = { ...DEFAULT_CONFIGURATION, length: 2.2 }
const report = assessRobotDesign(
  validateRobot({ ...DEFAULT_ROBOT, end: 1.7 }),
  farm
)
let receipt: GeometryReceipt
let current: GeometryReceipt
beforeAll(() => {
  const scene = site.prepareScene(farm, buildSiteMeshes(farm, site))
  robot.update(report)
  receipt = Object.freeze({
    revision: 1,
    scene,
    robot: robot.getSource(),
    dock: robot.getDockSource()
  })
  current = receipt
})
const owners = {
  isCurrentReceipt: (value: GeometryReceipt) => value === current,
  isCurrentScene: site.isCurrentScene.bind(site),
  isCurrentRobot: robot.isCurrentSource.bind(robot),
  isCurrentDock: robot.isCurrentDockSource.bind(robot)
}

it('retains all current near physical sources with unique shape and rigid-piece ownership', () => {
  const owner = new QueryGeometry(owners)
  const source = owner.prepare(receipt)
  const physical = receipt.scene.meshes.filter(
    (mesh) => mesh.layer !== 'dimensions'
  )
  expect(source.meshes.filter((mesh) => mesh.kind === 'farm')).toHaveLength(
    physical.length
  )
  expect(source.meshes.filter((mesh) => mesh.kind === 'dock')).toHaveLength(
    receipt.dock.meshes.length
  )
  expect(source.meshes.filter((mesh) => mesh.kind === 'robot')).toHaveLength(
    receipt.robot.parts.length
  )
  expect(source.shapes.length).toBe(
    new Set(source.meshes.map((mesh) => mesh.shape)).size
  )
  for (const mesh of physical) {
    const record = source.meshes.find((item) => item.origin === mesh)
    expect(record?.shape === mesh.descriptor.shape).toBe(true)
    expect(record?.descriptor === mesh.descriptor).toBe(true)
  }
  expect(
    source.meshes.some((mesh) => mesh.kind === 'farm' && mesh.layer === 'base')
  ).toBe(true)
  expect(
    source.meshes.some((mesh) => mesh.kind === 'farm' && mesh.layer === 'film')
  ).toBe(true)
  expect(
    source.meshes.some((mesh) => mesh.kind === 'farm' && mesh.layer === 'net')
  ).toBe(true)
  for (const part of receipt.robot.rig?.parts ?? []) {
    const record = source.meshes.find((mesh) => mesh.origin === part.source)
    expect(record?.body).toBe(part.body)
    expect(record?.frame).toBe('robot')
  }
  for (const mesh of receipt.dock.meshes) {
    const record = source.meshes.find((item) => item.origin === mesh)
    expect(record?.shape === mesh.descriptor.shape).toBe(true)
    expect(record?.frame).toBe('world')
  }
  expect(Object.isFrozen(source.meshes)).toBe(true)
  expect(source.meshes.every(Object.isFrozen)).toBe(true)
})

it('binds original fruit partitions to exact canonical plant instances without distant geometry', () => {
  const owner = new QueryGeometry(owners)
  const source = owner.prepare(receipt)
  for (const fruit of receipt.scene.fruits) {
    for (const part of fruit.model.parts) {
      if (!part.partitions.some((span) => span.fruitId === fruit.source.id))
        continue
      const mesh = source.meshes.find((item) => item.shape === part.shape)
      expect(mesh?.partitions === part.partitions).toBe(true)
      const instance = mesh?.plants?.findIndex((plant) => plant === fruit.plant)
      expect(instance).toBeGreaterThanOrEqual(0)
      if (!mesh || instance === undefined)
        throw new Error('Missing exact fruit source')
      const world = owner.placePoint(
        source,
        mesh,
        fruit.source.center,
        instance
      )
      world.forEach((value, axis) =>
        expect(value).toBeCloseTo(fruit.position[axis], 12)
      )
      expect(mesh.shape === part.distantShape).toBe(false)
    }
  }
})

it('does no geometry generation or preparation on reads and rejects copied or replaced receipts', () => {
  const crop = vi.spyOn(crops, 'createCropModels')
  const vehicle = vi.spyOn(models, 'createRobotModel')
  const station = vi.spyOn(models, 'createDockModel')
  try {
    const owner = new QueryGeometry(owners)
    const source = owner.prepare(receipt)
    const prepare = vi.spyOn(owner, 'prepare')
    for (let i = 0; i < 10; i++)
      expect(owner.read(source) === source).toBe(true)
    expect(prepare).not.toHaveBeenCalled()
    expect(owner.prepare(receipt) === source).toBe(true)
    expect(() => owner.prepare({ ...receipt })).toThrow()
    expect(() => owner.read({ ...source })).toThrow()
    expect(owner.read(source) === source).toBe(true)
    current = Object.freeze({ ...receipt, revision: 2 })
    expect(() => owner.read(source)).toThrow()
    const next = owner.prepare(current)
    expect(next === source).toBe(false)
    expect(() => owner.read(source)).toThrow()
    expect(crop).not.toHaveBeenCalled()
    expect(vehicle).not.toHaveBeenCalled()
    expect(station).not.toHaveBeenCalled()
  } finally {
    current = receipt
    crop.mockRestore()
    vehicle.mockRestore()
    station.mockRestore()
  }
})

it('rechecks every handle before publication and use without partially replacing the product', () => {
  let dockCurrent = true
  let duringPreparation = false
  let checks = 0
  const owner = new QueryGeometry({
    ...owners,
    isCurrentDock: (value) => {
      checks++
      return (
        dockCurrent &&
        owners.isCurrentDock(value) &&
        !(duringPreparation && checks > 1)
      )
    }
  })
  const source = owner.prepare(receipt)
  current = Object.freeze({ ...receipt, revision: 2 })
  duringPreparation = true
  checks = 0
  expect(() => owner.prepare(current)).toThrow()
  current = receipt
  duringPreparation = false
  expect(owner.read(source) === source).toBe(true)
  dockCurrent = false
  expect(() => owner.read(source)).toThrow()
})

it('retires on actual dock, robot and scene replacement and rejects use after disposal', () => {
  const localSite = new SiteGeometry()
  const localRobot = new RobotProjection()
  const scene = localSite.prepareScene(farm, buildSiteMeshes(farm, localSite))
  localRobot.update(report)
  let tuple: GeometryReceipt = Object.freeze({
    revision: 1,
    scene,
    robot: localRobot.getSource(),
    dock: localRobot.getDockSource()
  })
  const owner = new QueryGeometry({
    isCurrentReceipt: (value) => value === tuple,
    isCurrentScene: localSite.isCurrentScene.bind(localSite),
    isCurrentRobot: localRobot.isCurrentSource.bind(localRobot),
    isCurrentDock: localRobot.isCurrentDockSource.bind(localRobot)
  })
  const first = owner.prepare(tuple)
  localRobot.update({ ...report, settings: { ...report.settings, dockX: 9 } })
  expect(() => owner.read(first)).toThrow()
  expect(() => owner.prepare(tuple)).toThrow()
  tuple = Object.freeze({
    ...tuple,
    revision: 2,
    dock: localRobot.getDockSource()
  })
  const moved = owner.prepare(tuple)
  localRobot.update({
    ...report,
    settings: { ...report.settings, dockX: 9, tool: 'tomato' }
  })
  expect(() => owner.read(moved)).toThrow()
  tuple = Object.freeze({
    ...tuple,
    revision: 3,
    robot: localRobot.getSource()
  })
  const changed = owner.prepare(tuple)
  localSite.clear()
  expect(() => owner.read(changed)).toThrow()
  localRobot.clear()
  expect(() => owner.prepare(tuple)).toThrow()
  owner.clear()
  expect(() => owner.read(changed)).toThrow()
})

it('composes instance placement before descriptor rotation and never substitutes dock for robot pose', async () => {
  const { readSpatialDescriptor } =
    await import('../../engine/spatial-contract')
  const localSite = new SiteGeometry()
  const meshes = buildSiteMeshes(farm, localSite)
  const original = meshes.find((mesh) => mesh.layer === 'base')
  if (!original) throw new Error('Missing base fixture')
  const installed = {
    ...original,
    descriptor: readSpatialDescriptor({
      ...original.descriptor,
      position: [3, 4, 5],
      rotation: [0, Math.sin(Math.PI / 4), 0, Math.cos(Math.PI / 4)],
      instances: [{ position: [2, 3, 4], yaw: Math.PI / 2 }]
    }) as typeof original.descriptor
  }
  const scene = localSite.prepareScene(
    farm,
    meshes.map((mesh) => (mesh === original ? installed : mesh))
  )
  const tuple = Object.freeze({ ...receipt, scene })
  const owner = new QueryGeometry({
    ...owners,
    isCurrentReceipt: (value) => value === tuple,
    isCurrentScene: localSite.isCurrentScene.bind(localSite)
  })
  const source = owner.prepare(tuple)
  const mesh = source.meshes.find((item) => item.origin.id === installed.id)
  const robotMesh = source.meshes.find((item) => item.kind === 'robot')
  if (!mesh || !robotMesh) throw new Error('Missing geometry record')
  const point = owner.placePoint(source, mesh, [1, 2, 3])
  point.forEach((value, axis) => expect(value).toBeCloseTo([6, 9, 0][axis], 12))
  expect(() => owner.placePoint(source, mesh, [NaN, 0, 0])).toThrow()
  expect(() => owner.placePoint(source, mesh, [0, 0, 0], 1)).toThrow()
  expect(() => owner.placePoint(source, { ...mesh }, [0, 0, 0])).toThrow()
  expect(() => owner.placePoint(source, robotMesh, [0, 0, 0])).toThrow('pose')
  localSite.clear()
  expect(() => owner.placePoint(source, mesh, [0, 0, 0])).toThrow()
})

it('prepares immutable original-source local bounds once and recomputes only for a successor', () => {
  const owner = new QueryGeometry(owners)
  const source = owner.prepare(receipt)
  let visits = 0
  for (const shape of source.shapes) {
    if (shape.kind !== 'triangles') throw new Error('Missing triangle source')
    visits += shape.positions.length / 3
    const records = source.meshes.filter((mesh) => mesh.shape === shape)
    const box = records[0].prepared.bounds
    expect(records.every((mesh) => mesh.prepared.bounds === box)).toBe(true)
    const points = Array.from({ length: shape.positions.length / 3 }, (_, i) =>
      shape.positions.slice(i * 3, i * 3 + 3)
    )
    for (let axis = 0; axis < 3; axis++) {
      const values = points.map((point) => point[axis])
      expect(box.min[axis]).toBe(
        values.reduce((a, b) => Math.min(a, b), Infinity)
      )
      expect(box.max[axis]).toBe(
        values.reduce((a, b) => Math.max(a, b), -Infinity)
      )
    }
    expect(
      Object.isFrozen(box) &&
        Object.isFrozen(box.min) &&
        Object.isFrozen(box.max)
    ).toBe(true)
    for (const mesh of records) {
      expect(Object.isFrozen(mesh.prepared)).toBe(true)
      expect(mesh.prepared.regions.map((item) => item.source)).toEqual(
        mesh.origin.regions.filter((item) => item.kind !== 'sheet')
      )
      for (const item of mesh.prepared.regions) {
        expect(mesh.origin.regions.includes(item.source)).toBe(true)
        const { indexStart, indexCount } = item.source
        const ids = shape.indices.slice(indexStart, indexStart + indexCount)
        for (let axis = 0; axis < 3; axis++) {
          const values = ids.map((id) => shape.positions[id * 3 + axis])
          expect(item.bounds.min[axis]).toBe(
            values.reduce((a, b) => Math.min(a, b), Infinity)
          )
          expect(item.bounds.max[axis]).toBe(
            values.reduce((a, b) => Math.max(a, b), -Infinity)
          )
        }
      }
    }
  }
  expect(source.work.vertexVisits).toBe(visits)
  expect(source.work.shapeBounds).toBe(source.shapes.length)
  expect(owner.prepare(receipt) === source).toBe(true)
  current = Object.freeze({ ...receipt, revision: 7 })
  try {
    const next = owner.prepare(current)
    expect(next.work).toEqual(source.work)
    expect(next.meshes[0].prepared === source.meshes[0].prepared).toBe(false)
    expect(() => owner.read(source)).toThrow()
    owner.clear()
    expect(() => owner.read(next)).toThrow()
  } finally {
    current = receipt
  }
})

it('shares vertex bounds but never borrows another source region mapping on the same shape', () => {
  const base = receipt.scene.meshes.find((mesh) => mesh.layer === 'base')
  if (!base) throw new Error('Missing actual base source')
  const sheets = Object.freeze(
    base.regions.map((region) =>
      Object.freeze({ ...region, kind: 'sheet' as const })
    )
  )
  const copy = Object.freeze({ ...base, regions: sheets })
  const scene = Object.freeze({
    ...receipt.scene,
    meshes: Object.freeze([base, base, copy])
  })
  const tuple = Object.freeze({ ...receipt, scene })
  const owner = new QueryGeometry({
    ...owners,
    isCurrentReceipt: (value) => value === tuple,
    isCurrentScene: (value) => value === scene
  })
  const source = owner.prepare(tuple)
  const [first, repeated, different] = source.meshes
  expect(first.prepared === repeated.prepared).toBe(true)
  expect(first.prepared.bounds === different.prepared.bounds).toBe(true)
  expect(first.prepared === different.prepared).toBe(false)
  expect(first.prepared.regions.length).toBeGreaterThan(0)
  expect(different.prepared.regions).toHaveLength(0)
  expect(first.prepared.regions[0].source === base.regions[0]).toBe(true)
})
