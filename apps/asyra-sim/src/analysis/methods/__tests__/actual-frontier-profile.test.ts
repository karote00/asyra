import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as kinematics from '../../../domain/kinematic-algebra'
import * as meshIndex from '../mesh-index'
import * as projections from '../mesh-projection'
import * as membership from '../mesh-membership'
import * as convex from '../convex-query'
import * as official from '../official-method'
import * as samplers from '../fresh-static-sampler'
import type { PairEvidence } from '../continuous-query'
import { MeshWorkLimit, OriginalMeshQuery } from '../original-mesh-query'
import {
  runOriginalPartMethod,
  queryOriginalPartPair
} from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'

afterEach(() => vi.restoreAllMocks())

describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'actual representative frontier',
  () => {
    it.each(['representative', 'segment74'] as const)(
      'attributes completed and exhausted queries - %s',
      async (mode) => {
        const snapshot = await representativeSnapshot(0)
        let active = false,
          segment = -1,
          time: readonly [number, number] = [0, 0]
        let target: PairEvidence | undefined,
          handoffWork = 0
        const handoffs = new Map<number, number>()
        let sourceWitnessWork = 0
        const sourceWitnesses = new Map<number, number>()
        let derivationWork = 0
        const derivations = new Map<number, number>()
        interface Row {
          kind: 'static' | 'interval'
          origin?: {
            node: number
            segment: number
            start: number
            end: number
            time: number
            role: string
          }
          segment: number
          time: readonly [number, number]
          input: string
          before: number
          after: number
          work: number
          milliseconds: number
          status: 'running' | 'complete' | 'exhausted'
          median: number
          refinement: number
          membership: number
          axes: number
          convexCalls: number
          convexPenetrations: number
          convexZeroLower: number
          lower?: number
          upper?: number
          penetration?: boolean
          converged?: boolean
          firstWarningWork?: number
          initialUpper?: number
          levels: Record<
            'node' | 'triangle' | 'other',
            {
              calls: number
              axes: number
              rejections: number
              milliseconds: number
            }
          >
          convexMilliseconds: number
          phases: {
            clearance: { calls: number; axes: number; rejections: number }
            penetration: { calls: number; axes: number; rejections: number }
          }
        }
        let seededUpper: number | undefined
        let sampleOrigin: samplers.StaticSampleOrigin | undefined
        let sourceOrigin: samplers.StaticSampleOrigin | undefined
        let sourceAction: 'capture' | 'consume' | 'publication' | undefined
        const sourceCharges: {
          action: string
          segment: number
          start: number
          end: number
          time: number
          work: number
        }[] = []
        let targetContext: OriginalMeshQuery | undefined
        let targetBefore = 0
        let targetAfter: number | undefined
        const originalCreate = OriginalMeshQuery.prototype.createStaticSampler
        vi.spyOn(
          OriginalMeshQuery.prototype,
          'createStaticSampler'
        ).mockImplementation(function (this: OriginalMeshQuery, options) {
          if (active) {
            // eslint-disable-next-line @typescript-eslint/no-this-alias -- observe the actual shared invocation, never create another context
            targetContext = this
            targetBefore = this.work
          }
          return originalCreate.call(this, options)
        })
        const createSampler = samplers.createFreshStaticSampler
        vi.spyOn(samplers, 'createFreshStaticSampler').mockImplementation(
          (threshold, tick, solve, exhausted) => {
            const sources = new Map<unknown, samplers.StaticSampleOrigin>()
            const sample = createSampler(
              threshold,
              tick,
              (a, b, seed) => {
                seededUpper = seed?.upper
                try {
                  return solve(a, b, seed)
                } finally {
                  seededUpper = undefined
                  sourceAction = 'capture'
                }
              },
              exhausted
            )
            const observe: samplers.StaticSampler = (
              a,
              b,
              origin,
              previous
            ) => {
              sampleOrigin = origin
              sourceOrigin = origin
              sourceAction = 'consume'
              try {
                const result = sample(a, b, origin, previous)
                if (result?.source !== undefined)
                  sources.set(result.source, origin)
                return result
              } finally {
                sampleOrigin = undefined
                sourceOrigin = undefined
                sourceAction = undefined
              }
            }
            if (sample.publishBoundary) {
              const publish = sample.publishBoundary
              observe.publishBoundary = (source) => {
                sourceOrigin = sources.get(source)
                sourceAction = 'publication'
                try {
                  return publish(source)
                } finally {
                  sourceOrigin = undefined
                  sourceAction = undefined
                }
              }
            }
            return observe
          }
        )
        const rows: Row[] = []
        let current: Row | undefined
        let currentContext: OriginalMeshQuery | undefined
        let currentShapes:
          readonly [convex.ConvexShape, convex.ConvexShape] | undefined
        let bestUpper = Infinity
        const indices = new WeakMap<object, meshIndex.MeshIndex>()
        const nodeBounds = new WeakSet<object>(),
          triangleBounds = new WeakSet<object>()
        const register = (index: meshIndex.MeshIndex) => {
          const pending = [index.root]
          while (pending.length) {
            const node = pending.pop()
            if (!node) throw new Error('Missing measured node')
            nodeBounds.add(node.bounds)
            for (const triangle of node.triangles)
              triangleBounds.add(triangle.bounds)
            if (node.children) pending.push(...node.children)
          }
        }
        const ops = kinematics.poseOperations(kinematics.intervalAlgebra)
        const admitInitialWitness = () => {
          if (
            !current ||
            current.kind !== 'static' ||
            current.initialUpper !== undefined ||
            !currentShapes ||
            !currentContext
          )
            return
          const [a, b] = currentShapes,
            ai = indices.get(a.geometry),
            bi = indices.get(b.geometry)
          if (!ai || !bi) throw new Error('Missing exact measured source index')
          const upper = ops.norm(
            ops.sub(
              meshIndex.worldPoint(a.pose, ai.representatives[0]),
              meshIndex.worldPoint(b.pose, bi.representatives[0])
            )
          )[1]
          current.initialUpper = upper
          bestUpper = upper
          if (upper < snapshot.rule.minimumClearance)
            current.firstWarningWork = currentContext.work - current.before
        }
        const identities = new WeakMap<object, number>()
        let nextIdentity = 0
        const identity = (value: object) => {
          let key = identities.get(value)
          if (key === undefined) {
            key = nextIdentity++
            identities.set(value, key)
          }
          return key
        }
        const run = official.runClearanceQueries
        vi.spyOn(official, 'runClearanceQueries').mockImplementation(
          (input, descriptor, query, checkpoint, onPair) =>
            run(
              input,
              descriptor,
              (request, settings, check) => {
                active =
                  request.a.bodyId === 'example:joint-2' &&
                  request.b.bodyId === 'obstacle-11'
                try {
                  const result = query(request, settings, check)
                  if (active) {
                    target = result
                    targetAfter = targetContext?.work
                  }
                  return result
                } finally {
                  active = false
                }
              },
              checkpoint,
              onPair
            )
        )
        const interpolate = kinematics.interpolateSegment
        vi.spyOn(kinematics, 'interpolateSegment').mockImplementation(
          (...args) => {
            if (active) {
              segment = args[1]
              if (!Array.isArray(args[2]))
                throw new Error('Expected interval algebra input')
              time = [args[2][0], args[2][1]]
            }
            return interpolate(...args)
          }
        )
        const record = <T>(
          context: OriginalMeshQuery,
          kind: Row['kind'],
          args:
            | Parameters<typeof context.distance>
            | Parameters<typeof context.lowerOver>,
          call: () => T
        ): T => {
          if (!active) return call()
          if (kind === 'static' && !sampleOrigin)
            throw new Error('Missing actual static sampler origin')
          const origin = kind === 'static' ? sampleOrigin : undefined
          let sampleRole = 'middle'
          if (origin?.time === origin?.start) sampleRole = 'first'
          else if (origin?.time === origin?.end) sampleRole = 'end'
          const row: Row = {
            kind,
            origin: origin
              ? {
                  node: identity(origin.node),
                  segment: origin.segment,
                  start: origin.start,
                  end: origin.end,
                  time: origin.time,
                  role: `${origin.originalRoot ? 'root' : 'child'}-${sampleRole}`
                }
              : undefined,
            segment: origin?.segment ?? segment,
            time: origin ? [origin.time, origin.time] : time,
            input: JSON.stringify(
              [
                identity(args[0].geometry),
                args[0].pose,
                identity(args[1].geometry),
                args[1].pose,
                ...args.slice(2)
              ],
              (_key, value) =>
                typeof value === 'number' && Object.is(value, -0)
                  ? 'negative-zero'
                  : value
            ),
            before: context.work,
            after: context.work,
            work: 0,
            milliseconds: 0,
            status: 'running',
            median: 0,
            refinement: 0,
            membership: 0,
            axes: 0,
            convexCalls: 0,
            convexPenetrations: 0,
            convexZeroLower: 0,
            convexMilliseconds: 0,
            levels: {
              node: { calls: 0, axes: 0, rejections: 0, milliseconds: 0 },
              triangle: { calls: 0, axes: 0, rejections: 0, milliseconds: 0 },
              other: { calls: 0, axes: 0, rejections: 0, milliseconds: 0 }
            },
            phases: {
              clearance: { calls: 0, axes: 0, rejections: 0 },
              penetration: { calls: 0, axes: 0, rejections: 0 }
            }
          }
          const started = performance.now()
          rows.push(row)
          current = row
          currentContext = context
          currentShapes = [args[0], args[1]]
          bestUpper = kind === 'static' ? (seededUpper ?? Infinity) : Infinity
          if (kind === 'static' && seededUpper !== undefined) {
            row.initialUpper = seededUpper
            if (seededUpper < snapshot.rule.minimumClearance)
              row.firstWarningWork = 0
          }
          try {
            const value = call()
            row.status = 'complete'
            if (typeof value === 'number') row.lower = value
            else
              Object.assign(row, {
                lower: (value as convex.DistanceEvidence).lower,
                upper: (value as convex.DistanceEvidence).upper,
                penetration: (value as convex.DistanceEvidence).penetration,
                converged: (value as convex.DistanceEvidence).converged
              })
            return value
          } catch (error) {
            if (error instanceof MeshWorkLimit) row.status = 'exhausted'
            throw error
          } finally {
            row.milliseconds = performance.now() - started
            row.after = context.work
            row.work = row.after - row.before
            current = undefined
            currentContext = undefined
            currentShapes = undefined
          }
        }
        const distance = OriginalMeshQuery.prototype.distance
        vi.spyOn(OriginalMeshQuery.prototype, 'distance').mockImplementation(
          function (this: OriginalMeshQuery, ...args) {
            return record(this, 'static', args, () =>
              distance.apply(this, args)
            )
          }
        )
        const lower = OriginalMeshQuery.prototype.lowerOver
        vi.spyOn(OriginalMeshQuery.prototype, 'lowerOver').mockImplementation(
          function (this: OriginalMeshQuery, ...args) {
            return record(this, 'interval', args, () => lower.apply(this, args))
          }
        )
        const handoff = OriginalMeshQuery.prototype.chargeEvidenceHandoff
        vi.spyOn(
          OriginalMeshQuery.prototype,
          'chargeEvidenceHandoff'
        ).mockImplementation(function (this: OriginalMeshQuery) {
          const before = this.work
          try {
            return handoff.call(this)
          } finally {
            if (active) {
              handoffWork += this.work - before
              handoffs.set(
                segment,
                (handoffs.get(segment) ?? 0) + this.work - before
              )
            }
          }
        })
        const build = meshIndex.buildMeshIndex
        const sourceWitness = OriginalMeshQuery.prototype.chargeSourceWitness
        vi.spyOn(
          OriginalMeshQuery.prototype,
          'chargeSourceWitness'
        ).mockImplementation(function (this: OriginalMeshQuery) {
          const before = this.work
          try {
            return sourceWitness.call(this)
          } finally {
            if (active) {
              sourceCharges.push({
                action: sourceAction ?? 'unknown',
                segment: sourceOrigin?.segment ?? -1,
                start: sourceOrigin?.start ?? NaN,
                end: sourceOrigin?.end ?? NaN,
                time: sourceOrigin?.time ?? NaN,
                work: this.work - before
              })
              sourceWitnessWork += this.work - before
              sourceWitnesses.set(
                sourceOrigin?.segment ?? -1,
                (sourceWitnesses.get(sourceOrigin?.segment ?? -1) ?? 0) +
                  this.work -
                  before
              )
            }
          }
        })
        const derivation = OriginalMeshQuery.prototype.chargeEvidenceDerivation
        vi.spyOn(
          OriginalMeshQuery.prototype,
          'chargeEvidenceDerivation'
        ).mockImplementation(function (this: OriginalMeshQuery) {
          const before = this.work
          try {
            return derivation.call(this)
          } finally {
            if (active) {
              derivationWork += this.work - before
              derivations.set(
                segment,
                (derivations.get(segment) ?? 0) + this.work - before
              )
            }
          }
        })
        vi.spyOn(meshIndex, 'buildMeshIndex').mockImplementation(
          (geometry, checkpoint, hierarchy) => {
            const index = build(
              geometry,
              () => {
                if (current) current.median++
                checkpoint()
              },
              hierarchy
            )
            indices.set(geometry, index)
            register(index)
            return index
          }
        )
        const refine = meshIndex.refineMeshIndex
        vi.spyOn(meshIndex, 'refineMeshIndex').mockImplementation(
          (index, checkpoint) => {
            const completed = refine(index, () => {
              if (current) current.refinement++
              checkpoint()
            })
            register(completed)
            return completed
          }
        )
        const project = projections.projectedBoundsGap
        vi.spyOn(projections, 'projectedBoundsGap').mockImplementation(
          (a, ap, b, bp, threshold, checkpoint) => {
            admitInitialWitness()
            const phase =
              current?.phases[threshold === 0 ? 'penetration' : 'clearance']
            if (phase) phase.calls++
            let level: keyof Row['levels'] = 'other'
            if (triangleBounds.has(a) && triangleBounds.has(b))
              level = 'triangle'
            else if (nodeBounds.has(a) && nodeBounds.has(b)) level = 'node'
            const cost = current?.levels[level]
            if (cost) cost.calls++
            const started = performance.now()
            const gap = project(a, ap, b, bp, threshold, () => {
              if (current) current.axes++
              if (phase) phase.axes++
              if (cost) cost.axes++
              checkpoint()
            })
            if (phase && gap > threshold) phase.rejections++
            if (cost) {
              cost.milliseconds += performance.now() - started
              if (gap > threshold) cost.rejections++
            }
            return gap
          }
        )
        const contains = membership.shapeMembership
        vi.spyOn(membership, 'shapeMembership').mockImplementation(
          (point, shape, index, checkpoint) => {
            admitInitialWitness()
            return contains(point, shape, index, () => {
              if (current) current.membership++
              checkpoint()
            })
          }
        )
        const solve = convex.convexDistance
        vi.spyOn(convex, 'convexDistance').mockImplementation((...args) => {
          const started = performance.now()
          const value = solve(...args)
          if (current) {
            current.convexMilliseconds += performance.now() - started
            current.convexCalls++
            if (value.penetration) current.convexPenetrations++
            if (value.lower <= 0) current.convexZeroLower++
            if (current.kind === 'static') {
              if (value.penetration || value.upper < bestUpper)
                bestUpper = value.upper
              if (
                current.firstWarningWork === undefined &&
                bestUpper < snapshot.rule.minimumClearance &&
                currentContext
              )
                current.firstWarningWork = currentContext.work - current.before
            }
          }
          return value
        })
        let evaluations: number
        if (mode === 'representative') {
          const evidence = runOriginalPartMethod(snapshot)
          evaluations = evidence.evaluations
        } else {
          const pair = snapshot.pairs.find(
            (pair) =>
              pair.a.bodyId === 'example:joint-2' &&
              pair.b.bodyId === 'obstacle-11'
          )
          if (!pair) throw new Error('Missing original frontier pair')
          active = true
          target = queryOriginalPartPair(
            {
              workcell: snapshot.workcell,
              trajectory: snapshot.trajectory,
              a: pair.a,
              b: pair.b,
              interval: [
                snapshot.trajectory.keyframes[74].time,
                snapshot.trajectory.keyframes[75].time
              ]
            },
            {
              threshold: snapshot.rule.minimumClearance,
              ...snapshot.method.settings,
              maxIntervals: snapshot.budget.maxIntervals
            },
            () => undefined,
            new OriginalMeshQuery()
          )
          targetAfter = targetContext?.work
          active = false
          evaluations = target.evaluations
          expect(target.coverage).toBe('complete')
        }
        if (!target) throw new Error('Missing measured target')
        const targetLeaves = target.leaves
        const exhausted = rows.filter((row) => row.status === 'exhausted')
        const frontier = exhausted[0]
        const frontierSegment = frontier?.segment ?? 74
        const summary = (selected: Row[]) => ({
          work: selected.reduce((sum, row) => sum + row.work, 0),
          milliseconds: selected.reduce(
            (sum, row) => sum + row.milliseconds,
            0
          ),
          convexCalls: selected.reduce((sum, row) => sum + row.convexCalls, 0),
          convexMilliseconds: selected.reduce(
            (sum, row) => sum + row.convexMilliseconds,
            0
          ),
          staticWork: selected
            .filter((row) => row.kind === 'static')
            .reduce((sum, row) => sum + row.work, 0),
          intervalWork: selected
            .filter((row) => row.kind === 'interval')
            .reduce((sum, row) => sum + row.work, 0),
          median: selected.reduce((sum, row) => sum + row.median, 0),
          refinement: selected.reduce((sum, row) => sum + row.refinement, 0),
          membership: selected.reduce((sum, row) => sum + row.membership, 0),
          axes: selected.reduce((sum, row) => sum + row.axes, 0)
        })
        const segmentRows = [...new Set(rows.map((row) => row.segment))].map(
          (segment) => {
            const start = snapshot.trajectory.keyframes[segment].time,
              end = snapshot.trajectory.keyframes[segment + 1].time
            const leaves = targetLeaves.filter(
              (leaf) => leaf.start >= start && leaf.end <= end
            )
            return {
              segment,
              start,
              end,
              ...summary(rows.filter((row) => row.segment === segment)),
              handoffWork: handoffs.get(segment) ?? 0,
              sourceWitnessWork: sourceWitnesses.get(segment) ?? 0,
              derivationWork: derivations.get(segment) ?? 0,
              states: leaves.reduce<Record<string, number>>((sum, leaf) => {
                sum[leaf.state] = (sum[leaf.state] ?? 0) + 1
                return sum
              }, {})
            }
          }
        )
        const compact = ({ input: _input, ...row }: Row) => ({
          ...row,
          afterWarningWork:
            row.firstWarningWork === undefined
              ? 0
              : row.work - row.firstWarningWork,
          traversal:
            row.work -
            row.median -
            row.refinement -
            row.membership -
            row.axes -
            1
        })
        const common = segmentRows.filter((row) => row.segment >= 114)
        const detail = {
          profile: 'actual-frontier',
          mode,
          geometryPolicy: 'current',
          recordedBeforeFreshSource: {
            source: '910d0ad74',
            evaluations: 20240,
            targetEvaluations: 141
          },
          recordedBeforeDerivation: {
            source: '6862daf58',
            evaluations: 20237,
            targetEvaluations: 138
          },
          evaluations,
          targetEvaluations: target.evaluations,
          target: summary(rows),
          handoffWork,
          derivationWork,
          sourceWitnessWork,
          commonPrefix: {
            fromSegment: 114,
            query: summary(rows.filter((row) => row.segment >= 114)),
            leaves: targetLeaves.filter(
              (leaf) => leaf.start >= snapshot.trajectory.keyframes[114].time
            ),
            segments: common.length,
            work: common.reduce(
              (sum, row) =>
                sum +
                row.work +
                row.handoffWork +
                row.derivationWork +
                row.sourceWitnessWork,
              0
            )
          },
          frontier: frontier ? compact(frontier) : null,
          largestComplete: rows
            .filter((row) => row.status === 'complete')
            .sort((a, b) => b.work - a.work)
            .slice(0, 6)
            .map(compact),
          largestSegments: segmentRows
            .slice()
            .sort((a, b) => b.work - a.work)
            .slice(0, 6),
          adjacentLeaves: targetLeaves.filter(
            (leaf) =>
              leaf.start >=
                snapshot.trajectory.keyframes[Math.max(0, frontierSegment - 1)]
                  .time &&
              leaf.end <=
                snapshot.trajectory.keyframes[frontierSegment + 2].time
          )
        }
        const buckets = [
          ...new Set(
            rows.map(
              (row) =>
                `${row.kind}:${row.origin?.role ?? 'interval'}:${row.status}`
            )
          )
        ].map((key) => {
          const selected = rows.filter(
            (row) =>
              `${row.kind}:${row.origin?.role ?? 'interval'}:${row.status}` ===
              key
          )
          return { key, calls: selected.length, ...summary(selected) }
        })
        const sourceBuckets = Object.fromEntries(
          ['capture', 'consume', 'publication'].map((action) => [
            action,
            sourceCharges
              .filter((row) => row.action === action)
              .reduce((sum, row) => sum + row.work, 0)
          ])
        )
        const charged =
          summary(rows).work + handoffWork + derivationWork + sourceWitnessWork
        const invocationWork =
          targetAfter === undefined ? null : targetAfter - targetBefore
        const artifactPath = fileURLToPath(
          new URL(
            `../../../../../../tmp/capacity/actual-frontier-${mode}-population.json`,
            import.meta.url
          )
        )
        mkdirSync(dirname(artifactPath), { recursive: true })
        writeFileSync(
          artifactPath,
          JSON.stringify(
            {
              ...detail,
              rows,
              segments: segmentRows,
              sourceCharges,
              targetLeaves,
              buckets,
              sourceBuckets,
              charged,
              invocationWork,
              note: 'Preparation, refinement, membership and axes are nested query-work subitems. Unvisited leaves are unknown, not measured costs.'
            },
            null,
            2
          ) + '\n'
        )
        // eslint-disable-next-line no-console -- bounded complete-population buckets; full rows live in the artifact
        console.info(
          JSON.stringify({
            profile: 'actual-frontier-population',
            mode,
            evaluations,
            targetEvaluations: target.evaluations,
            charged,
            invocationWork,
            target: summary(rows),
            sourceBuckets,
            handoffWork,
            derivationWork,
            buckets,
            frontier: frontier ? compact(frontier) : null,
            artifactPath
          })
        )
        expect(
          sourceCharges.every(
            (row) => row.action !== 'unknown' && row.segment >= 0
          )
        ).toBe(true)
        expect(common.every((row) => !row.states.unresolved)).toBe(true)
        expect(charged).toBe(invocationWork)
        expect(
          Object.values(sourceBuckets).reduce((sum, value) => sum + value, 0)
        ).toBe(sourceWitnessWork)
        expect(exhausted).toHaveLength(mode === 'representative' ? 1 : 0)
        if (mode === 'representative') {
          expect(evaluations).toBe(20265)
          expect(target.evaluations).toBe(166)
          expect(target.coverage).toBe('partial')
          expect(summary(rows).staticWork).toBe(306103)
          expect(summary(rows).intervalWork).toBe(91548)
          expect(charged).toBe(398216)
        }
      },
      20000
    )
  }
)
