import { afterEach, expect, it, vi } from 'vitest'
import { runOriginalPartMethod } from '../original-part-method'
import { OriginalMeshQuery } from '../original-mesh-query'
import * as meshIndex from '../mesh-index'
import * as membership from '../mesh-membership'
import * as convex from '../convex-query'
import { representativeSnapshot } from './representative-fixture'

afterEach(() => vi.restoreAllMocks())

it('completes the unchanged representative workcell within the original geometry work budget', async () => {
  const snapshot = await representativeSnapshot(0)
  const counts = {
    distanceCalls: 0,
    distanceWork: 0,
    lowerCalls: 0,
    lowerWork: 0,
    indexBuilds: 0,
    preparationWork: 0,
    membershipCalls: 0,
    membershipWork: 0,
    worldBoundsCalls: 0,
    repeatedWorldBounds: 0,
    convexCalls: 0,
    clearIntervalCertificates: 0
  }
  let transformed = new WeakMap<object, WeakSet<object>>()
  const worldBounds = meshIndex.worldBounds
  vi.spyOn(meshIndex, 'worldBounds').mockImplementation((bounds, pose) => {
    counts.worldBoundsCalls++
    const poses = transformed.get(bounds) ?? new WeakSet<object>()
    if (poses.has(pose)) counts.repeatedWorldBounds++
    poses.add(pose)
    transformed.set(bounds, poses)
    return worldBounds(bounds, pose)
  })
  const convexDistance = convex.convexDistance
  vi.spyOn(convex, 'convexDistance').mockImplementation((...args) => {
    counts.convexCalls++
    return convexDistance(...args)
  })
  const distance = OriginalMeshQuery.prototype.distance
  const lower = OriginalMeshQuery.prototype.lowerOver
  vi.spyOn(OriginalMeshQuery.prototype, 'distance').mockImplementation(
    function (this: OriginalMeshQuery, ...args) {
      transformed = new WeakMap()
      const before = this.work
      counts.distanceCalls++
      try {
        return distance.apply(this, args)
      } finally {
        counts.distanceWork += this.work - before
      }
    }
  )
  vi.spyOn(OriginalMeshQuery.prototype, 'lowerOver').mockImplementation(
    function (this: OriginalMeshQuery, ...args) {
      transformed = new WeakMap()
      const before = this.work
      counts.lowerCalls++
      try {
        const result = lower.apply(this, args)
        if (result > args[2]) counts.clearIntervalCertificates++
        return result
      } finally {
        counts.lowerWork += this.work - before
      }
    }
  )
  const build = meshIndex.buildMeshIndex
  vi.spyOn(meshIndex, 'buildMeshIndex').mockImplementation(
    (geometry, checkpoint, hierarchy) => {
      counts.indexBuilds++
      return build(
        geometry,
        () => {
          counts.preparationWork++
          checkpoint()
        },
        hierarchy
      )
    }
  )
  const contains = membership.shapeMembership
  vi.spyOn(membership, 'shapeMembership').mockImplementation(
    (point, shape, index, checkpoint) => {
      counts.membershipCalls++
      return contains(point, shape, index, () => {
        counts.membershipWork++
        checkpoint()
      })
    }
  )
  const start = performance.now()
  const pairCosts: {
    pairId: string
    work: number
    staticWork: number
    intervalWork: number
    evaluations: number
    clearIntervals: number
  }[] = []
  let previousStatic = 0,
    previousInterval = 0,
    previousClear = 0
  const evidence = runOriginalPartMethod(
    snapshot,
    () => undefined,
    (pair) => {
      const staticWork = counts.distanceWork - previousStatic
      const intervalWork = counts.lowerWork - previousInterval
      pairCosts.push({
        pairId: pair.pairId,
        work: staticWork + intervalWork,
        staticWork,
        intervalWork,
        evaluations: pair.evidence.evaluations,
        clearIntervals: counts.clearIntervalCertificates - previousClear
      })
      previousStatic = counts.distanceWork
      previousInterval = counts.lowerWork
      previousClear = counts.clearIntervalCertificates
    }
  )
  const first = evidence.pairs.find(
    (pair) => pair.evidence.coverage === 'partial'
  )
  // eslint-disable-next-line no-console -- permanent bounded logical-work evidence
  console.info(
    JSON.stringify({
      profile: 'representative-original-work',
      largestPairCosts: pairCosts.sort((a, b) => b.work - a.work).slice(0, 5),
      ...counts,
      traversalWork:
        counts.distanceWork +
        counts.lowerWork -
        counts.preparationWork -
        counts.membershipWork,
      pairs: evidence.pairs.length,
      evaluations: evidence.evaluations,
      firstPartialPair: first?.pairId,
      firstPartialEvaluations: first?.evidence.evaluations,
      durationMs: Math.round(performance.now() - start)
    })
  )
  expect(evidence.pairs).toHaveLength(298)
  expect(evidence.coverage).toBe('complete')
}, 20000)
