import { expect, it, vi } from 'vitest'
import { Matrix4, Quaternion, Vector3 } from 'three'
import { SiteGeometry } from '../../render-app/site-geometry'
import { RobotProjection } from '../../render-app/robot-projection'
import { DEFAULT_CONFIGURATION } from '../../domain/farm-configuration'
import {
  DEFAULT_ROBOT,
  assessRobotDesign
} from '../../domain/robot-configuration'
import { REST_JOINTS, type RobotJoints } from '../../domain/robot-kinematics'
import * as kinematics from '../../domain/robot-kinematics'
import * as models from '../../domain/robot-model'
import { QueryGeometry } from '../geometry'
import { JointSegments, type JointSegmentInput } from '../motion'
import { RobotMotionBounds, type MotionAssumptions } from '../motion-bounds'

function setup(height = DEFAULT_ROBOT.height) {
  const site = new SiteGeometry(),
    robot = new RobotProjection()
  const farm = {
    ...DEFAULT_CONFIGURATION,
    strips: [{ id: 'soil', kind: 'soil' as const, width: 6.3 }]
  }
  const scene = site.prepareScene(farm, [])
  robot.update(assessRobotDesign({ ...DEFAULT_ROBOT, height }, farm))
  const receipt = Object.freeze({
    revision: 1,
    scene,
    robot: robot.getSource(),
    dock: robot.getDockSource()
  })
  const geometry = new QueryGeometry({
    isCurrentReceipt: (value) => value === receipt,
    isCurrentScene: site.isCurrentScene.bind(site),
    isCurrentRobot: robot.isCurrentSource.bind(robot),
    isCurrentDock: robot.isCurrentDockSource.bind(robot)
  })
  return {
    robot,
    geometry,
    source: geometry.prepare(receipt),
    owner: new RobotMotionBounds(geometry)
  }
}
const centre: RobotJoints = {
  lift: 0.02,
  yaw: 0.3,
  shoulder: -0.4,
  elbow: 0.5,
  wrist: -0.2
}
const segment = (
  joints: RobotJoints = centre,
  radius = 0
): JointSegmentInput => ({
  source: 'synthetic',
  assumption: 'Explicit numeric joint segment',
  from: 0,
  until: 100,
  start: Object.fromEntries(
    Object.entries(joints).map(([key, value]) => [key, value - radius])
  ) as unknown as RobotJoints,
  end: Object.fromEntries(
    Object.entries(joints).map(([key, value]) => [key, value + radius])
  ) as unknown as RobotJoints
})
const window = { queryFrom: 0, queryUntil: 100, validFrom: 0, validUntil: 101 }
const assumptions = (): MotionAssumptions => ({
  source: 'synthetic',
  assumption:
    'Fixed base and original empty robot shapes for the entire window',
  base: {
    kind: 'fixed-pose',
    transform: { position: [1, 0, 2], rotation: [0, 0, 0, 1] }
  },
  shapes: 'rigid-source-shapes-throughout',
  held: 'empty-held-throughout'
})
// Independent Three CPU body coefficients; base uses its declared raw quaternion
// rotation formula, not a normalized quaternion or a production query helper.
function point(
  part: ReturnType<typeof kinematics.evaluateRobotAffinePose>['parts'][number],
  local: readonly number[],
  state: MotionAssumptions
) {
  const t = part.transform
  const matrix = new Matrix4().compose(
    new Vector3(...t.position),
    new Quaternion(...t.rotation),
    new Vector3(1, 1, 1)
  )
  const p = new Vector3(local[0], local[1], local[2]).applyMatrix4(matrix)
  const [x, y, z, w] = state.base.transform.rotation
  const rotate = (v: number[]) => {
    const tx = 2 * (y * v[2] - z * v[1]),
      ty = 2 * (z * v[0] - x * v[2]),
      tz = 2 * (x * v[1] - y * v[0])
    return [
      v[0] + w * tx + (y * tz - z * ty),
      v[1] + w * ty + (z * tx - x * tz),
      v[2] + w * tz + (x * ty - y * tx)
    ]
  }
  const columns = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ].map(rotate),
    v = p.toArray()
  return [0, 1, 2].map(
    (axis) =>
      columns[0][axis] * v[0] +
      columns[1][axis] * v[1] +
      columns[2][axis] * v[2] +
      state.base.transform.position[axis]
  )
}
function contains(
  bounds: { min: readonly number[]; max: readonly number[] },
  p: readonly number[]
) {
  p.forEach((value, axis) => {
    if (!(bounds.min[axis] <= value && value <= bounds.max[axis]))
      throw new Error(
        `Original vertex outside envelope at axis ${axis}: ${value} not in [${bounds.min[axis]}, ${bounds.max[axis]}]`
      )
  })
}

it('encloses original robot vertices and every region using actual body source correspondence', () => {
  for (const height of [DEFAULT_ROBOT.height, 0.8]) {
    const f = setup(height),
      raw = segment(centre, 1e-6),
      state = assumptions()
    state.base.transform = {
      ...state.base.transform,
      rotation: [0, Math.sin(0.35), 0, Math.cos(0.35) * (1 + 2e-13)]
    }
    const result = f.owner.enclose(f.source, raw, window, state)
    const rig = f.source.receipt.robot.rig
    if (!rig) throw new Error('Missing rig')
    expect(result.meshes.map((item) => item.mesh)).toEqual(
      f.source.meshes.filter((mesh) => mesh.kind === 'robot')
    )
    for (const time of [0, 25, 50, 75, 100]) {
      const sample = new JointSegments(f.geometry).enclose(f.source, raw, {
        ...window,
        queryFrom: time,
        queryUntil: time
      }).start
      const pose = kinematics.evaluateRobotAffinePose(rig, sample)
      for (const item of result.meshes) {
        const part = pose.parts.find(
          (value) => value.source === item.mesh.origin
        )
        if (
          !part ||
          item.mesh.shape.kind !== 'triangles' ||
          item.envelope.status !== 'bounded'
        )
          throw new Error('Missing finite original source')
        expect(item.part.source).toBe(item.mesh.origin)
        expect(item.regions.map((region) => region.source)).toEqual(
          item.mesh.origin.regions
        )
        const shape = item.mesh.shape
        // Every original vertex, not a rendered proxy or an aggregate fixture box.
        for (let offset = 0; offset < shape.positions.length; offset += 3)
          contains(
            item.envelope.bounds,
            point(part, shape.positions.slice(offset, offset + 3), state)
          )
        for (const region of item.regions) {
          if (region.envelope.status !== 'bounded')
            throw new Error('Unresolved fixture region')
          for (
            let index = region.source.indexStart;
            index < region.source.indexStart + region.source.indexCount;
            index++
          ) {
            const offset = shape.indices[index] * 3
            contains(
              region.envelope.bounds,
              point(part, shape.positions.slice(offset, offset + 3), state)
            )
          }
        }
      }
    }
    expect(result).not.toHaveProperty('clearance')
    expect(result.source).toBe(f.source)
  }
})

it('keeps fixed singleton and narrow-window usefulness limits and full-domain finite controls', () => {
  const f = setup(),
    rig = f.source.receipt.robot.rig
  if (!rig) throw new Error('Missing rig')
  for (const [joints, radius, threshold] of [
    [REST_JOINTS, 0, 1e-8],
    [centre, 0, 1e-8],
    [centre, 1e-6, 1e-2]
  ] as const) {
    const raw = segment(joints, radius),
      state = assumptions(),
      result = f.owner.enclose(f.source, raw, window, state)
    const poses = [raw.start, raw.end].map((q) =>
      kinematics.evaluateRobotAffinePose(rig, q)
    )
    for (const item of result.meshes) {
      if (item.envelope.status !== 'bounded')
        throw new Error('Unresolved usefulness case')
      const points: number[][] = []
      for (const pose of poses) {
        const part = pose.parts.find(
          (value) => value.source === item.mesh.origin
        )
        if (!part) throw new Error('Missing part')
        for (let corner = 0; corner < 8; corner++) {
          const local = [0, 1, 2].map((axis) =>
            corner & (1 << axis)
              ? item.mesh.prepared.bounds.max[axis]
              : item.mesh.prepared.bounds.min[axis]
          )
          points.push(point(part, local, state))
        }
      }
      for (let axis = 0; axis < 3; axis++) {
        expect(
          Math.min(...points.map((p) => p[axis])) -
            item.envelope.bounds.min[axis]
        ).toBeLessThanOrEqual(threshold)
        expect(
          item.envelope.bounds.max[axis] -
            Math.max(...points.map((p) => p[axis]))
        ).toBeLessThanOrEqual(threshold)
      }
    }
  }
  const full = segment()
  full.start = Object.fromEntries(
    Object.entries(rig.limits).map(([key, range]) => [key, range[0]])
  ) as unknown as RobotJoints
  full.end = Object.fromEntries(
    Object.entries(rig.limits).map(([key, range]) => [key, range[1]])
  ) as unknown as RobotJoints
  expect(
    f.owner
      .enclose(f.source, full, window, assumptions())
      .meshes.every((item) => item.envelope.status === 'bounded')
  ).toBe(true)
})

it('reuses original affine and bounds products without source reconstruction and retains every region provenance', () => {
  const f = setup(),
    calls = vi.spyOn(kinematics, 'evaluateRobotIntervalPose'),
    pointCalls = vi.spyOn(kinematics, 'evaluateRobotAffinePose'),
    build = vi.spyOn(models, 'createRobotModel'),
    prepare = vi.spyOn(f.geometry, 'prepare')
  try {
    const result = f.owner.enclose(f.source, segment(), window, assumptions())
    expect(calls).toHaveBeenCalledTimes(1)
    expect(pointCalls).not.toHaveBeenCalled()
    expect(build).not.toHaveBeenCalled()
    expect(prepare).not.toHaveBeenCalled()
    expect(result.work.pose).toBe(result.pose.work)
    expect(result.work.pose.fk).toBe(1)
    expect(result.work.pose.trigCalls).toBe(8)
    const distinct = new Set(
      result.meshes.flatMap((item) => [
        item.envelope,
        ...item.regions.map((region) => region.envelope)
      ])
    )
    expect(result.work.envelopes).toBe(distinct.size)
    expect(result.work.corners).toBe(8 * distinct.size)
    expect(result.work.parts).toBe(result.meshes.length)
    expect(result.work.regions).toBe(
      result.meshes.reduce((sum, item) => sum + item.regions.length, 0)
    )
    expect(result.work.baseFrames).toBe(1)
    for (const item of result.meshes)
      for (const region of item.regions) {
        const prepared = item.mesh.prepared.regions.find(
          (value) => value.source === region.source
        )
        expect(region.provenance).toBe(
          prepared ? 'region-bounds' : 'mesh-envelope'
        )
        if (!prepared) expect(region.envelope).toBe(item.envelope)
        expect(Object.isFrozen(region)).toBe(true)
      }
    expect(Object.isFrozen(result)).toBe(true)
    const again = f.owner.enclose(f.source, segment(), window, assumptions())
    expect(again.meshes[0].envelope).not.toBe(result.meshes[0].envelope)
  } finally {
    vi.restoreAllMocks()
  }
})

it('validates detached whole-window assumptions and current sources before FK or publication', () => {
  const f = setup(),
    call = vi.spyOn(kinematics, 'evaluateRobotIntervalPose')
  try {
    for (const edit of [
      (s: MotionAssumptions) => {
        s.held = 'unknown' as never
      },
      (s: MotionAssumptions) => {
        s.shapes = 'unknown' as never
      },
      (s: MotionAssumptions) => {
        s.base.kind = 'moving' as never
      },
      (s: MotionAssumptions) => {
        s.base.transform = {
          ...s.base.transform,
          position: new Array(3) as unknown as [number, number, number]
        }
      },
      (s: MotionAssumptions) => {
        s.base.transform = {
          ...s.base.transform,
          rotation: new Array(4) as unknown as [number, number, number, number]
        }
      },
      (s: MotionAssumptions) => {
        s.base.transform = { ...s.base.transform, rotation: [0, 0, 0, 2] }
      }
    ]) {
      const state = assumptions()
      edit(state)
      expect(() =>
        f.owner.enclose(f.source, segment(), window, state)
      ).toThrow()
    }
    expect(call).not.toHaveBeenCalled()
    expect(() =>
      f.owner.enclose({ ...f.source }, segment(), window, assumptions())
    ).toThrow()
    const state = assumptions()
    let reads = 0
    Object.defineProperty(state, 'assumption', {
      enumerable: true,
      get: () => (++reads === 1 ? 'Captured once' : '')
    })
    const result = f.owner.enclose(f.source, segment(), window, state)
    expect(reads).toBe(1)
    const mutablePosition = state.base.transform.position as [
      number,
      number,
      number
    ]
    mutablePosition[0] = 900
    expect(result.assumptions.base.transform.position[0]).toBe(1)
    expect(Object.isFrozen(state)).toBe(false)
    const original =
      call.getMockImplementation() ?? kinematics.evaluateRobotIntervalPose
    call.mockRestore()
    const retire = vi
      .spyOn(kinematics, 'evaluateRobotIntervalPose')
      .mockImplementation((...args) => {
        const pose = original(...args)
        f.robot.clear()
        return pose
      })
    expect(() =>
      f.owner.enclose(f.source, segment(), window, assumptions())
    ).toThrow()
    expect(retire).toHaveBeenCalledTimes(1)
  } finally {
    vi.restoreAllMocks()
  }
})

it('retains arithmetic overflow as unresolved envelopes rather than finite bounds', () => {
  const f = setup(),
    state = assumptions()
  state.base.transform = {
    ...state.base.transform,
    position: [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE]
  }
  const result = f.owner.enclose(f.source, segment(), window, state)
  expect(
    result.meshes.some((item) => item.envelope.status === 'unresolved')
  ).toBe(true)
})

it('profiles four fixed complete-entry batches without source scans or widened guards', () => {
  const f = setup(),
    start = performance.now(),
    rows: unknown[] = []
  const small = {
    lift: Number.MIN_VALUE,
    yaw: Number.MIN_VALUE,
    shoulder: -Number.MIN_VALUE,
    elbow: 3 * Number.MIN_VALUE,
    wrist: -5 * Number.MIN_VALUE
  }
  for (const [name, raw] of [
    ['normal-first', segment(centre, 1e-6)],
    ['normal-repeated', segment(centre, 1e-6)],
    ['subnormal-first', segment(small)],
    ['subnormal-repeated', segment(small)]
  ] as const) {
    const began = performance.now()
    let trig = 0,
      evaluations = 0,
      corners = 0,
      maxBits = 0
    for (let index = 0; index < 10; index++) {
      if (performance.now() - began > 1000 || performance.now() - start > 10000)
        throw new Error('Fixed motion bounds profile exceeded')
      const result = f.owner.enclose(f.source, raw, window, assumptions())
      trig += result.work.pose.trigCalls
      evaluations += result.work.pose.polynomialEvaluations
      corners += result.work.corners
      maxBits = Math.max(
        maxBits,
        result.work.pose.maxBigIntBits,
        result.work.domains.maxBigIntBits
      )
    }
    const elapsed = performance.now() - began
    expect(elapsed).toBeLessThanOrEqual(1000)
    expect(trig).toBe(80)
    expect(evaluations).toBeLessThanOrEqual(160)
    expect(maxBits).toBeLessThanOrEqual(24000)
    rows.push({ name, elapsed, trig, evaluations, corners, maxBits })
  }
  expect(performance.now() - start).toBeLessThanOrEqual(10000)
  console.log('Motion bounds full-entry profile', JSON.stringify(rows))
})

it('keeps same-shape different-region identity and proves zero source buffer reads after preparation', () => {
  const f = setup(),
    original = f.source.receipt.robot.parts[0]
  if (original.shape.kind !== 'triangles')
    throw new Error('Missing triangle fixture')
  let reads = 0
  const track = (values: readonly number[]) =>
    new Proxy(values, {
      get(target, key, receiver) {
        if (typeof key === 'string' && Number.isInteger(Number(key))) reads++
        return Reflect.get(target, key, receiver)
      }
    })
  // Explicit source-mapping fixture: unchanged coordinates with independently
  // declared regions, not a change to production material interpretation.
  const shape = Object.freeze({
    ...original.shape,
    positions: track(original.shape.positions),
    indices: track(original.shape.indices)
  })
  const solid = Object.freeze({
    ...original,
    id: 'bounds-region-fixture',
    shape
  })
  const sheets = Object.freeze(
    original.regions.map((region) =>
      Object.freeze({ ...region, kind: 'sheet' as const })
    )
  )
  const sheet = Object.freeze({
    ...solid,
    id: 'bounds-sheet-fixture',
    regions: sheets
  })
  const repeated = Object.freeze({ ...solid, id: 'bounds-repeated-fixture' })
  const rig = kinematics.prepareRobotRig(DEFAULT_ROBOT, [
    ...f.source.receipt.robot.parts,
    solid,
    sheet,
    repeated
  ])
  const robot = Object.freeze({
    ...f.source.receipt.robot,
    rig,
    parts: Object.freeze(rig.parts.map((part) => part.source))
  })
  const receipt = Object.freeze({ ...f.source.receipt, robot })
  const geometry = new QueryGeometry({
    isCurrentReceipt: (value) => value === receipt,
    isCurrentRobot: (value) => value === robot,
    isCurrentScene: (value) => value === receipt.scene,
    isCurrentDock: (value) => value === receipt.dock
  })
  const source = geometry.prepare(receipt)
  expect(reads).toBeGreaterThan(0)
  reads = 0
  const result = new RobotMotionBounds(geometry).enclose(
    source,
    segment(),
    window,
    assumptions()
  )
  expect(reads).toBe(0)
  const a = result.meshes.find((item) => item.mesh.origin === solid),
    b = result.meshes.find((item) => item.mesh.origin === sheet),
    c = result.meshes.find((item) => item.mesh.origin === repeated)
  if (!a || !b || !c) throw new Error('Missing source fixtures')
  expect(a.mesh.shape).toBe(b.mesh.shape)
  expect(a.envelope).toBe(b.envelope)
  expect(a.envelope).toBe(c.envelope)
  expect(a.regions[0].envelope).toBe(c.regions[0].envelope)
  expect(a.regions[0].source).not.toBe(b.regions[0].source)
  expect(
    b.regions.every(
      (region) =>
        region.provenance === 'mesh-envelope' && region.envelope === b.envelope
    )
  ).toBe(true)
  expect(
    a.regions.every((region) => region.provenance === 'region-bounds')
  ).toBe(true)
})
