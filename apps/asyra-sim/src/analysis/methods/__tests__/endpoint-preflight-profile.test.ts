import { expect, it } from 'vitest'
import {
  evaluatePairKinematics,
  interpolateSegment,
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import { interval, type Interval } from '../../../domain/interval'
import type { ConvexShape, DistanceEvidence } from '../convex-query'
import { MeshWorkLimit, OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'

it.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'measures the first deterministic adjacent endpoint preflight with independent preparation',
  async () => {
    const snapshot = await representativeSnapshot(0),
      frames = snapshot.trajectory.keyframes
    const pair = snapshot.pairs.find(
      (p) => p.a.bodyId === 'example:joint-2' && p.b.bodyId === 'obstacle-11'
    )
    if (!pair) throw new Error('Missing original ordered pair')
    const settings = {
      ...snapshot.method.settings,
      threshold: snapshot.rule.minimumClearance,
      maxIntervals: snapshot.budget.maxIntervals
    }
    const query = (segment: number) => ({
      workcell: snapshot.workcell,
      trajectory: snapshot.trajectory,
      a: pair.a,
      b: pair.b,
      interval: [frames[segment].time, frames[segment + 1].time] as const
    })
    interface Source {
      a: ConvexShape
      b: ConvexShape
      evidence: DistanceEvidence
      time: number
    }
    const runSource = (context: OriginalMeshQuery) => {
      let source: Source | undefined
      const make = context.createStaticSampler.bind(context)
      context.createStaticSampler = (options) => {
        const sample = make(options)
        const observe: typeof sample = (a, b, origin, previous) => {
          const result = sample(a, b, origin, previous)
          if (origin.segment === 198 && origin.time === origin.start) {
            if (!result || result.exhausted || source)
              throw new Error('Incomplete or repeated source')
            expect(origin.originalRoot).toBe(true)
            source = { a, b, evidence: result.evidence, time: origin.time }
          }
          return result
        }
        observe.publishBoundary = sample.publishBoundary
        return observe
      }
      const result = queryOriginalPartPair(
        query(198),
        settings,
        () => undefined,
        context
      )
      expect(result.coverage).toBe('complete')
      expect(result.leaves).toHaveLength(1)
      expect(result.leaves[0].penetration).toBe(false)
      if (!source) throw new Error('Missing actual first source')
      return { source, result, work: context.work }
    }
    const context = new OriginalMeshQuery()
    const actual = runSource(context)
    const e = actual.source.evidence
    let status = 'source-ineligible',
      gap: number | null = null
    const operations = {
      capture: 0,
      publication: 0,
      endpoint: 0,
      interval: 0,
      admission: 0
    }
    const charge = (key: keyof typeof operations) => {
      const before = context.work
      try {
        context.chargeSourceWitness()
      } finally {
        operations[key] += context.work - before
      }
    }
    const report = (extra: object = {}) => {
      // eslint-disable-next-line no-console -- one fixed endpoint cost measurement, not a changed result route
      console.info(
        JSON.stringify({
          profile: 'endpoint-preflight',
          sourceSegment: 198,
          targetSegment: 197,
          status,
          sourceWork: actual.work,
          totalWork: context.work,
          operations,
          gap,
          ...extra
        })
      )
    }
    if (
      e.penetration ||
      !(e.lower > 0) ||
      !Number.isFinite(e.upper) ||
      e.lower > e.upper ||
      e.upper <= settings.threshold
    ) {
      report()
      return
    }
    charge('capture')
    const copyInterval = (value: Interval): Interval =>
      Object.freeze([value[0], value[1]])
    const copy = (shape: ConvexShape): ConvexShape =>
      Object.freeze({
        geometry: shape.geometry,
        pose: Object.freeze({
          position: Object.freeze(
            shape.pose.position.map(copyInterval)
          ) as ConvexShape['pose']['position'],
          rotation: Object.freeze(
            shape.pose.rotation.map(copyInterval)
          ) as ConvexShape['pose']['rotation']
        })
      })
    const source = Object.freeze({
      ...actual.source,
      a: copy(actual.source.a),
      b: copy(actual.source.b),
      evidence: Object.freeze({
        ...e,
        witnessA: Object.freeze(
          e.witnessA.map(copyInterval)
        ) as DistanceEvidence['witnessA'],
        witnessB: Object.freeze(
          e.witnessB.map(copyInterval)
        ) as DistanceEvidence['witnessB']
      })
    })
    charge('publication')
    const shapes = (time: Interval): readonly [ConvexShape, ConvexShape] => {
      const values = interpolateSegment(
        snapshot.trajectory,
        197,
        time,
        intervalAlgebra
      )
      const poses = evaluatePairKinematics(
        snapshot.workcell,
        values,
        pair.a.bodyId,
        pair.b.bodyId,
        intervalAlgebra
      )
      const ops = poseOperations(intervalAlgebra)
      return [pair.a, pair.b].map((reference, side) => {
        const body = snapshot.workcell.bodies.find(
          (body) => body.id === reference.bodyId
        )
        const collider = body?.colliders.find(
          (collider) => collider.id === reference.colliderId
        )
        if (!collider) throw new Error('Missing canonical collider')
        return {
          geometry: collider.geometry,
          pose: ops.compose(poses[side], ops.fromPose(collider.pose))
        }
      }) as unknown as readonly [ConvexShape, ConvexShape]
    }
    charge('endpoint')
    const endpoint = shapes(interval(frames[198].time))
    charge('interval')
    const whole = shapes(interval(frames[197].time, frames[198].time))
    charge('admission')
    expect(source.time).toBe(frames[198].time)
    let identical = true
    for (const [side, shape] of [source.a, source.b].entries()) {
      expect(endpoint[side].geometry).toBe(shape.geometry)
      expect(whole[side].geometry).toBe(shape.geometry)
      if (shape.geometry.kind !== 'mesh')
        throw new Error('Expected immutable source mesh')
      expect(
        Object.isFrozen(shape.geometry) &&
          Object.isFrozen(shape.geometry.positions) &&
          Object.isFrozen(shape.geometry.indices)
      ).toBe(true)
      const left = [...shape.pose.position, ...shape.pose.rotation]
      const right = [
        ...endpoint[side].pose.position,
        ...endpoint[side].pose.rotation
      ]
      identical &&= left.every(
        (value, i) =>
          Object.is(value[0], right[i][0]) && Object.is(value[1], right[i][1])
      )
    }
    if (!identical) {
      status = 'endpoint-identity-mismatch'
      report()
      return
    }
    expect(
      Object.values(operations).reduce((sum, value) => sum + value, 0)
    ).toBe(5)
    const before = context.work
    try {
      gap = context.lowerOver(
        whole[0],
        whole[1],
        settings.threshold,
        source.evidence,
        settings.distanceTolerance,
        settings.maxIterations
      )
    } catch (error) {
      if (!(error instanceof MeshWorkLimit)) throw error
      status = 'exhausted'
      report({ certificateWork: context.work - before })
      return
    }
    const certificateWork = context.work - before
    if (gap <= settings.threshold) {
      status = 'no-clear-proof'
      report({ certificateWork })
      return
    }
    expect(gap).toBeLessThanOrEqual(source.evidence.upper)
    const control = new OriginalMeshQuery()
    const original = runSource(control)
    expect(original.result).toEqual(actual.result)
    expect(original.source.evidence).toEqual(actual.source.evidence)
    expect(original.work).toBe(actual.work)
    const categories = {
      distance: 0,
      interval: 0,
      source: 0,
      handoff: 0,
      derivation: 0
    }
    const distance = control.distance.bind(control),
      lower = control.lowerOver.bind(control)
    control.distance = (...args) => {
      const before = control.work
      try {
        return distance(...args)
      } finally {
        categories.distance += control.work - before
      }
    }
    control.lowerOver = (...args) => {
      const before = control.work
      try {
        return lower(...args)
      } finally {
        categories.interval += control.work - before
      }
    }
    for (const [method, key] of [
      ['chargeSourceWitness', 'source'],
      ['chargeEvidenceHandoff', 'handoff'],
      ['chargeEvidenceDerivation', 'derivation']
    ] as const) {
      const charge = control[method].bind(control)
      control[method] = () => {
        const before = control.work
        try {
          charge()
        } finally {
          categories[key] += control.work - before
        }
      }
    }
    const target = queryOriginalPartPair(
      query(197),
      settings,
      () => undefined,
      control
    )
    expect(target.coverage).toBe('complete')
    expect(target.leaves).toHaveLength(1)
    expect(target.leaves[0]).toMatchObject({
      state: 'clear',
      penetration: false
    })
    const targetWork = control.work - original.work
    expect(
      Object.values(categories).reduce((sum, value) => sum + value, 0)
    ).toBe(targetWork)
    const preflightWork = context.work - actual.work
    expect(preflightWork).toBe(certificateWork + 5)
    status = 'complete'
    report({
      certificateWork,
      preflightWork,
      targetWork,
      categories,
      netSavingUpperLimit: targetWork - preflightWork,
      controlTotal: control.work,
      sourceUpper: source.evidence.upper,
      originalTarget: target
    })
  },
  20000
)
