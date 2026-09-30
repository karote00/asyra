import { describe, afterEach, expect, it, vi } from 'vitest'
import { OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import * as membership from '../mesh-membership'
import * as meshIndex from '../mesh-index'
import type { Bounds, MeshNode } from '../mesh-index'
import * as convex from '../convex-query'
import * as kinematics from '../../../domain/kinematic-algebra'
import { representativeSnapshot } from './representative-fixture'

// Explicit hypothesis evidence; this is not the representative capacity goal gate.
describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'source-query-cost.test',
  () => {
    afterEach(() => vi.restoreAllMocks())

    it.each([0, 1, 2, 3, 4, 5, 6, 7])(
      'profiles the current dominant source pair over second %s',
      async (start) => {
        const snapshot = await representativeSnapshot(0)
        const pair = snapshot.pairs.find(
          (pair) =>
            pair.a.bodyId === 'example:joint-2' &&
            pair.b.bodyId === 'obstacle-11'
        )
        if (!pair) throw new Error('Missing measured source pair')
        const context = new OriginalMeshQuery()
        const rows: {
          kind: string
          work: number
          membershipWork: number
          convexCalls: number
          lower: number | null
          upper?: number
          penetration?: boolean
        }[] = []
        const nodeRows: {
          depth: number
          triangles: number
          overlap: number
          visits: number
          axisMismatch: boolean
          centroidWidths: number[]
          fullAxis: number
          centroidAxis: number
          alternativeOverlap: number
        }[] = []
        const nodes = new WeakMap<Bounds, (typeof nodeRows)[number]>()
        const area = (bounds: Bounds) => {
          const [x, y, z] = bounds.map((axis) => Math.max(0, axis[1] - axis[0]))
          return 2 * (x * y + x * z + y * z)
        }
        const centroidBoxes = new WeakMap<MeshNode, Bounds>()
        const register = (node: MeshNode, depth: number): number => {
          let count = node.triangles.length
          if (node.children) {
            const [a, b] = node.children
            count = register(a, depth + 1) + register(b, depth + 1)
            const intersect: Bounds = a.bounds.map((axis, i) => [
              Math.max(axis[0], b.bounds[i][0]),
              Math.min(axis[1], b.bounds[i][1])
            ]) as unknown as Bounds
            const overlap = intersect.some((axis) => axis[0] > axis[1])
              ? 0
              : area(intersect) /
                Math.max(
                  Number.MIN_VALUE,
                  Math.min(area(a.bounds), area(b.bounds))
                )
            const ac = centroidBoxes.get(a),
              bc = centroidBoxes.get(b)
            if (!ac || !bc) throw new Error('Missing complete centroid summary')
            const centroids = ac.map((axis, i) => [
              Math.min(axis[0], bc[i][0]),
              Math.max(axis[1], bc[i][1])
            ]) as unknown as Bounds
            centroidBoxes.set(node, centroids)
            const fullWidths = node.bounds.map((axis) => axis[1] - axis[0])
            const centroidWidths = centroids.map((axis) => axis[1] - axis[0])
            const fullAxis = fullWidths.indexOf(Math.max(...fullWidths))
            const centroidAxis = centroidWidths.indexOf(
              Math.max(...centroidWidths)
            )
            const collectTriangles = (
              current: MeshNode
            ): typeof node.triangles =>
              current.children
                ? current.children.flatMap(collectTriangles)
                : current.triangles
            let alternativeOverlap = overlap
            if (fullAxis !== centroidAxis) {
              const sorted = [...collectTriangles(node)].sort(
                (a, b) =>
                  a.bounds[centroidAxis][0] +
                    a.bounds[centroidAxis][1] -
                    b.bounds[centroidAxis][0] -
                    b.bounds[centroidAxis][1] || a.offset - b.offset
              )
              const box = (items: typeof sorted): Bounds =>
                [0, 1, 2].map((axis) => [
                  Math.min(...items.map((item) => item.bounds[axis][0])),
                  Math.max(...items.map((item) => item.bounds[axis][1]))
                ]) as unknown as Bounds
              const left = box(sorted.slice(0, Math.floor(sorted.length / 2))),
                right = box(sorted.slice(Math.floor(sorted.length / 2)))
              const common = left.map((axis, i) => [
                Math.max(axis[0], right[i][0]),
                Math.min(axis[1], right[i][1])
              ]) as unknown as Bounds
              alternativeOverlap = common.some((axis) => axis[0] > axis[1])
                ? 0
                : area(common) /
                  Math.max(Number.MIN_VALUE, Math.min(area(left), area(right)))
            }
            const row = {
              depth,
              triangles: count,
              overlap,
              visits: 0,
              axisMismatch: fullAxis !== centroidAxis,
              centroidWidths,
              fullAxis,
              centroidAxis,
              alternativeOverlap
            }
            nodes.set(node.bounds, row)
            nodeRows.push(row)
          }
          if (!node.children) {
            const centroids = [0, 1, 2].map((axis) => {
              const values = node.triangles.map(
                (triangle) =>
                  triangle.bounds[axis][0] + triangle.bounds[axis][1]
              )
              return [Math.min(...values), Math.max(...values)]
            }) as unknown as Bounds
            centroidBoxes.set(node, centroids)
          }
          return count
        }
        const build = meshIndex.buildMeshIndex
        vi.spyOn(meshIndex, 'buildMeshIndex').mockImplementation((...args) => {
          const index = build(...args)
          register(index.root, 0)
          return index
        })
        const world = meshIndex.worldBounds
        vi.spyOn(meshIndex, 'worldBounds').mockImplementation(
          (bounds, pose) => {
            const row = nodes.get(bounds)
            if (row) row.visits++
            return world(bounds, pose)
          }
        )
        let queryTime: readonly [number, number] = [start, start]
        const interpolate = kinematics.interpolateSegment
        vi.spyOn(kinematics, 'interpolateSegment').mockImplementation(
          (...args) => {
            if (Array.isArray(args[2])) queryTime = [args[2][0], args[2][1]]
            return interpolate(...args)
          }
        )
        let previous:
          | {
              key: string
              a: object
              b: object
              value: number
              admitted: boolean
            }
          | undefined
        let repeatedIntervalWork = 0,
          repeatedIntervalCalls = 0
        let membershipWork = 0,
          convexCalls = 0
        const contains = membership.shapeMembership
        vi.spyOn(membership, 'shapeMembership').mockImplementation(
          (point, shape, index, checkpoint) =>
            contains(point, shape, index, () => {
              membershipWork++
              checkpoint()
            })
        )
        const distance = convex.convexDistance
        vi.spyOn(convex, 'convexDistance').mockImplementation((...args) => {
          convexCalls++
          return distance(...args)
        })
        for (const method of ['distance', 'lowerOver'] as const) {
          const original = context[method].bind(context)
          // Preserve the two public query signatures while recording their actual work.
          if (method === 'distance') {
            const call = original as typeof context.distance
            context.distance = (...args) => {
              const before = context.work,
                members = membershipWork,
                calls = convexCalls
              const result = call(...args)
              rows.push({
                kind: method,
                work: context.work - before,
                membershipWork: membershipWork - members,
                convexCalls: convexCalls - calls,
                lower: result.lower,
                upper: result.upper,
                penetration: result.penetration
              })
              return result
            }
          } else {
            const call = original as typeof context.lowerOver
            context.lowerOver = (...args) => {
              const before = context.work,
                members = membershipWork,
                calls = convexCalls
              const result = call(...args)
              const key = JSON.stringify([
                queryTime,
                args[0].pose,
                args[1].pose,
                args[2],
                args[4],
                args[5]
              ])
              const admitted = args[3].lower > 0
              if (
                previous?.key === key &&
                previous.a === args[0].geometry &&
                previous.b === args[1].geometry &&
                previous.admitted &&
                admitted
              ) {
                expect(result).toBe(previous.value)
                repeatedIntervalWork += context.work - before
                repeatedIntervalCalls++
              }
              previous = {
                key,
                a: args[0].geometry,
                b: args[1].geometry,
                value: result,
                admitted
              }
              rows.push({
                kind: method,
                work: context.work - before,
                membershipWork: membershipWork - members,
                convexCalls: convexCalls - calls,
                lower: result
              })
              return result
            }
          }
        }
        const result = queryOriginalPartPair(
          {
            workcell: snapshot.workcell,
            trajectory: snapshot.trajectory,
            a: pair.a,
            b: pair.b,
            interval: [start, start + 1]
          },
          {
            threshold: snapshot.rule.minimumClearance,
            ...snapshot.method.settings,
            maxIntervals: snapshot.budget.maxIntervals
          },
          () => undefined,
          context
        )
        // eslint-disable-next-line no-console -- permanent bounded owner-cost evidence
        console.info(
          JSON.stringify({
            profile: 'source-query-cost',
            start,
            work: context.work,
            coverage: result.coverage,
            states: result.leaves.reduce<Record<string, number>>(
              (sum, leaf) => ({
                ...sum,
                [leaf.state]: (sum[leaf.state] ?? 0) + 1
              }),
              {}
            ),
            firstNonclear: result.leaves.find((leaf) => leaf.state !== 'clear'),
            membershipWork,
            convexCalls,
            repeatedIntervalCalls,
            repeatedIntervalWork,
            staticWork: rows
              .filter((row) => row.kind === 'distance')
              .reduce((sum, row) => sum + row.work, 0),
            intervalWork: rows
              .filter((row) => row.kind === 'lowerOver')
              .reduce((sum, row) => sum + row.work, 0),
            centroidAlternativeWeightedOverlap: nodeRows
              .filter((row) => row.axisMismatch)
              .reduce(
                (sum, row) => sum + row.visits * row.alternativeOverlap,
                0
              ),
            centroidCurrentWeightedOverlap: nodeRows
              .filter((row) => row.axisMismatch)
              .reduce((sum, row) => sum + row.visits * row.overlap, 0),
            centroidMismatchNodes: nodeRows.filter((row) => row.axisMismatch)
              .length,
            centroidMismatchVisits: nodeRows
              .filter((row) => row.axisMismatch)
              .reduce((sum, row) => sum + row.visits, 0),
            centroidMismatchOverlappingVisits: nodeRows
              .filter((row) => row.axisMismatch && row.overlap > 0)
              .reduce((sum, row) => sum + row.visits, 0),
            centroidMismatchTop: nodeRows
              .filter((row) => row.axisMismatch)
              .sort((a, b) => b.visits - a.visits)
              .slice(0, 5),
            hierarchyInternalVisits: nodeRows.reduce(
              (sum, row) => sum + row.visits,
              0
            ),
            hierarchyOverlappingVisits: nodeRows
              .filter((row) => row.overlap > 0)
              .reduce((sum, row) => sum + row.visits, 0),
            hierarchyWeightedOverlap:
              nodeRows.reduce((sum, row) => sum + row.visits * row.overlap, 0) /
              Math.max(
                1,
                nodeRows.reduce((sum, row) => sum + row.visits, 0)
              ),
            mostVisitedNodes: nodeRows
              .sort((a, b) => b.visits - a.visits)
              .slice(0, 5),
            largestQueries: rows.sort((a, b) => b.work - a.work).slice(0, 4)
          })
        )
        expect(result.leaves[0].start).toBe(start)
        expect(result.leaves.at(-1)?.end).toBe(start + 1)
        expect(context.work).toBeLessThanOrEqual(500001)
      },
      20000
    )
  }
)
