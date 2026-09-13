import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  intervalAlgebra,
  poseOperations,
  type AlgebraPose
} from '../../../domain/kinematic-algebra'
import {
  idiv,
  imid,
  interval,
  isub,
  type Interval
} from '../../../domain/interval'
import { IDENTITY_POSE, type Vec3 } from '../../../domain/math'
import type { ConvexShape } from '../convex-query'
import * as mesh from '../mesh-index'
import { projectBounds } from '../bounds-projection'
import { projectedBoundsGap } from '../mesh-projection'
import { OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'

const ops = poseOperations(intervalAlgebra)
function directions(
  a: AlgebraPose<Interval>,
  b: AlgebraPose<Interval>,
  tick: () => void
): Vec3[] {
  const axes = [a, b].map((pose) =>
    [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ].map((axis) => {
      tick()
      return ops
        .rotate(pose.rotation, ops.vector(axis as unknown as Vec3))
        .map(imid) as unknown as Vec3
    })
  )
  return axes[0].flatMap((left) =>
    axes[1].map((right) => {
      tick()
      return ops
        .cross(ops.vector(left), ops.vector(right))
        .map(imid) as unknown as Vec3
    })
  )
}
function crossGap(
  a: mesh.Bounds,
  ap: AlgebraPose<Interval>,
  b: mesh.Bounds,
  bp: AlgebraPose<Interval>,
  axes: readonly Vec3[],
  tick: () => void
): number {
  let lower = 0
  for (const axis of axes) {
    tick()
    const norm = ops.norm(ops.vector(axis))
    if (norm[0] <= 0) continue
    const pa = projectBounds(a, ap, axis),
      pb = projectBounds(b, bp, axis)
    lower = Math.max(
      lower,
      idiv(isub(interval(pb[0]), interval(pa[1])), norm)[0],
      idiv(isub(interval(pa[0]), interval(pb[1])), norm)[0]
    )
  }
  return lower
}
afterEach(() => vi.restoreAllMocks())
it('certifies independent rational skew boxes that overlap on all six face directions', () => {
  const bounds: mesh.Bounds = [
    [-1, 1],
    [-1 / 128, 1 / 128],
    [-1 / 128, 1 / 128]
  ]
  const a = ops.fromPose(IDENTITY_POSE),
    b = ops.fromPose({
      ...IDENTITY_POSE,
      position: [0, 1 / 16, 1 / 4],
      rotation: [1, 2, 3, 4]
    })
  // Exact normalized integer quaternion: R = [[2,-10,11],[14,5,2],[-5,10,10]] / 15.
  // All corner coordinates below use the independent common denominator 1920.
  const corners = [-1n, 1n].flatMap((x) =>
    [-1n, 1n].flatMap((y) => [-1n, 1n].map((z) => [x, y, z]))
  )
  const ac = corners.map(([x, y, z]) => [1920n * x, 15n * y, 15n * z])
  const bc = corners.map(([x, y, z]) => [
    256n * x - 10n * y + 11n * z,
    1792n * x + 5n * y + 2n * z + 120n,
    -640n * x + 10n * y + 10n * z + 480n
  ])
  const dot = (p: bigint[], axis: bigint[]) =>
    p.reduce((sum, v, i) => sum + v * axis[i], 0n)
  const min = (v: bigint[]) => v.reduce((a, b) => (a < b ? a : b)),
    max = (v: bigint[]) => v.reduce((a, b) => (a > b ? a : b))
  const gap = (axis: bigint[]) =>
    max([
      min(bc.map((p) => dot(p, axis))) - max(ac.map((p) => dot(p, axis))),
      min(ac.map((p) => dot(p, axis))) - max(bc.map((p) => dot(p, axis)))
    ])
  for (const axis of [
    [15n, 0n, 0n],
    [0n, 15n, 0n],
    [0n, 0n, 15n],
    [2n, 14n, -5n],
    [-10n, 5n, 10n],
    [11n, 2n, 10n]
  ])
    expect(gap(axis)).toBeLessThan(0n)
  expect(gap([0n, 5n, 14n])).toBe(6720n) // 6720/28800 = 7/30.
  expect(projectedBoundsGap(bounds, a, bounds, b, 0, () => undefined)).toBe(0)
  let preparation = 0,
    attempts = 0
  const axes = directions(a, b, () => preparation++)
  const lower = crossGap(bounds, a, bounds, b, axes, () => attempts++)
  expect(preparation).toBe(15)
  expect(attempts).toBe(9)
  expect(lower).toBeGreaterThan(1 / 5)
  // Exact closest supporting edges lie inside both long extents; distance²=49/884.
  expect(lower * lower).toBeLessThanOrEqual(49 / 884)
})

describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'fixed frontier cross directions',
  () => {
    it('measures one unchanged point and unions actual descendant work without injecting rejection', async () => {
      const snapshot = await representativeSnapshot(0)
      const pair = snapshot.pairs.find(
        (p) => p.a.bodyId === 'example:joint-2' && p.b.bodyId === 'obstacle-11'
      )
      if (!pair) throw new Error('Missing source pair')
      const time = snapshot.trajectory.keyframes[67].time
      expect(time).toBe(2.693467336683417)
      const context = new OriginalMeshQuery()
      const parents = new Map<mesh.MeshNode, mesh.MeshNode | undefined>(),
        nodes = new Map<mesh.Bounds, mesh.MeshNode>()
      const register = (root: mesh.MeshNode) => {
        const pending: { node: mesh.MeshNode; parent?: mesh.MeshNode }[] = [
          { node: root }
        ]
        while (pending.length) {
          const entry = pending.pop()
          if (!entry) throw new Error('Missing observed node')
          const prior = nodes.get(entry.node.bounds)
          if (prior && prior !== entry.node)
            throw new Error('Ambiguous exact Bounds identity')
          parents.set(entry.node, entry.parent)
          nodes.set(entry.node.bounds, entry.node)
          for (const child of entry.node.children ?? [])
            pending.push({ node: child, parent: entry.node })
        }
      }
      let preparation = 0,
        refinement = 0,
        extraPreparation = 0,
        extraAttempts = 0
      const build = mesh.buildMeshIndex,
        refine = mesh.refineMeshIndex
      vi.spyOn(mesh, 'buildMeshIndex').mockImplementation((...args) => {
        const before = context.work,
          result = build(...args)
        preparation += context.work - before
        register(result.root)
        return result
      })
      vi.spyOn(mesh, 'refineMeshIndex').mockImplementation((...args) => {
        const before = context.work,
          result = refine(...args)
        refinement += context.work - before
        register(result.root)
        return result
      })
      const extra = () => extraPreparation + extraAttempts
      const baseline = () => context.work - extra()
      const charge = (kind: 'prepare' | 'attempt') => {
        const before = context.work
        try {
          context.chargeSourceWitness()
        } finally {
          if (kind === 'prepare') extraPreparation += context.work - before
          else extraAttempts += context.work - before
        }
      }
      interface Event {
        root: boolean
        a: mesh.MeshNode
        b: mesh.MeshNode
        entered: number
        after: number
        threshold: number
        legacy: number
        candidate?: number
      }
      const events: Event[] = []
      let axes: Vec3[] | undefined,
        poses:
          readonly [AlgebraPose<Interval>, AlgebraPose<Interval>] | undefined
      type Project = (
        a: ConvexShape,
        b: ConvexShape,
        ab: mesh.Bounds | undefined,
        bb: mesh.Bounds | undefined,
        gap: number,
        threshold: number
      ) => number
      const owner = context as unknown as { projectGap: Project }
      const original = owner.projectGap.bind(context)
      const descriptor = Object.getOwnPropertyDescriptor(owner, 'projectGap')
      owner.projectGap = (a, b, ab, bb, gap, threshold) => {
        if (!ab || !bb) throw new Error('Unexpected nonmesh path')
        const an = nodes.get(ab),
          bn = nodes.get(bb)
        if (!an || !bn) throw new Error('Unknown exact source lineage')
        const entered = baseline() - (events.length === 0 ? 0 : 1)
        const legacy = original(a, b, ab, bb, gap, threshold)
        const event: Event = {
          root: events.length === 0,
          a: an,
          b: bn,
          entered,
          after: baseline(),
          threshold,
          legacy
        }
        events.push(event)
        if (legacy <= threshold) {
          if (!axes) {
            poses = [a.pose, b.pose]
            axes = directions(a.pose, b.pose, () => charge('prepare'))
          }
          expect(a.pose).toBe(poses?.[0])
          expect(b.pose).toBe(poses?.[1])
          event.candidate = crossGap(ab, a.pose, bb, b.pose, axes, () =>
            charge('attempt')
          )
        }
        return legacy
      }
      let result: ReturnType<typeof queryOriginalPartPair>
      try {
        result = queryOriginalPartPair(
          {
            workcell: snapshot.workcell,
            trajectory: snapshot.trajectory,
            a: pair.a,
            b: pair.b,
            interval: [time, time]
          },
          {
            ...snapshot.method.settings,
            threshold: snapshot.rule.minimumClearance,
            maxIntervals: snapshot.budget.maxIntervals
          },
          () => undefined,
          context
        )
      } finally {
        if (descriptor) Object.defineProperty(owner, 'projectGap', descriptor)
        else Reflect.deleteProperty(owner, 'projectGap')
      }
      const originalWork = baseline()
      expect(originalWork).toBe(16564)
      expect(result.coverage).toBe('complete')
      expect(result.leaves[0]).toMatchObject({
        lower: 0.0006410267376114053,
        upper: 0.007203098142746448,
        penetration: false,
        state: 'finding'
      })
      const descendant = (
        node: mesh.MeshNode,
        ancestor: mesh.MeshNode
      ): boolean => {
        let current: mesh.MeshNode | undefined = node
        while (current) {
          if (current === ancestor) return true
          current = parents.get(current)
        }
        return false
      }
      const beneath = (child: Event, parent: Event) =>
        descendant(child.a, parent.a) &&
        descendant(child.b, parent.b) &&
        (child.a !== parent.a || child.b !== parent.b)
      const spans: { start: number; end: number; index: number }[] = []
      let retainedAttempts = 0,
        positive = 0,
        prunedAttempts = 0
      for (const [index, event] of events.entries()) {
        if (event.candidate === undefined) continue
        if (
          spans.some(
            (span) => event.entered >= span.start && event.entered < span.end
          )
        ) {
          prunedAttempts += 9
          continue
        }
        retainedAttempts += 9
        if (event.candidate <= event.threshold) continue
        positive++
        if (event.root) {
          expect(result.upper).not.toBeNull()
          expect(event.candidate).toBeLessThanOrEqual(result.upper ?? Infinity)
        }
        const next = event.root
          ? undefined
          : events.slice(index + 1).find((other) => !beneath(other, event))
        const end = next?.entered ?? originalWork
        expect(end).toBeGreaterThanOrEqual(event.after)
        if (end > event.after) spans.push({ start: event.after, end, index })
      }
      const avoidedUpperLimit = spans.reduce(
        (sum, span) => sum + span.end - span.start,
        0
      )
      const prospectiveCost = extraPreparation + retainedAttempts
      expect(extraAttempts).toBe(retainedAttempts + prunedAttempts)
      // eslint-disable-next-line no-console -- one source-complete passive upper limit, not actual candidate savings
      console.info(
        JSON.stringify({
          profile: 'cross-axis-frontier',
          frame: 67,
          time,
          originalWork,
          preparation,
          refinement,
          queryWork: originalWork - preparation - refinement,
          visitedPairs: events.length,
          attemptedPairs: extraAttempts / 9,
          positiveMaximalPairs: positive,
          extraPreparation,
          extraAttempts,
          totalWork: context.work,
          avoidedUpperLimit,
          prospectiveRetainedAttemptCost: retainedAttempts,
          prospectiveCost,
          netSavingUpperLimit: avoidedUpperLimit - prospectiveCost,
          prunedDiagnosticAttempts: prunedAttempts,
          spans: spans.slice(0, 8)
        })
      )
    }, 20000)
  }
)
