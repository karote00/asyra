import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import type { MeshGeometry } from '../../../domain/part-geometry'
import { EXPERIMENT_RESOURCE_PROFILE } from '../../contracts'
import type { ConvexShape } from '../convex-query'
import * as meshIndex from '../mesh-index'
import { MeshWorkLimit, OriginalMeshQuery } from '../original-mesh-query'
import { queryOriginalPartPair } from '../original-part-method'
import { representativeSnapshot } from './representative-fixture'

const ops = poseOperations(intervalAlgebra)
afterEach(() => vi.restoreAllMocks())

describe.runIf(process.env.SIM_CAPACITY_DIAGNOSTICS === '1')(
  'existing component representative seed feasibility',
  () => {
    it.each([67, 114])(
      'measures complete point witnesses at original frame %s',
      async (frame) => {
        const snapshot = await representativeSnapshot(0)
        const pair = snapshot.pairs.find(
          (item) =>
            item.a.bodyId === 'example:joint-2' &&
            item.b.bodyId === 'obstacle-11'
        )
        if (!pair) throw new Error('Missing diagnosed source pair')
        const time = snapshot.trajectory.keyframes[frame].time
        const prepared = new WeakMap<MeshGeometry, meshIndex.MeshIndex>()
        const build = meshIndex.buildMeshIndex
        vi.spyOn(meshIndex, 'buildMeshIndex').mockImplementation(
          (geometry, checkpoint, hierarchy) => {
            const index = build(geometry, checkpoint, hierarchy)
            prepared.set(geometry, index)
            return index
          }
        )
        const context = new OriginalMeshQuery()
        let shapes: readonly [ConvexShape, ConvexShape] | undefined
        const distance = context.distance.bind(context)
        context.distance = (a, b, ...args) => {
          if (shapes) throw new Error('Static probe unexpectedly resampled')
          shapes = [a, b]
          return distance(a, b, ...args)
        }
        const evidence = queryOriginalPartPair(
          {
            workcell: snapshot.workcell,
            trajectory: snapshot.trajectory,
            a: pair.a,
            b: pair.b,
            interval: [time, time]
          },
          {
            threshold: snapshot.rule.minimumClearance,
            ...snapshot.method.settings,
            maxIntervals: snapshot.budget.maxIntervals
          },
          () => undefined,
          context
        )
        expect(evidence.coverage).toBe('complete')
        expect(evidence.evaluations).toBe(1)
        if (!shapes) throw new Error('Missing actual static query inputs')
        const pairShapes: readonly [ConvexShape, ConvexShape] = shapes
        const charges = { transforms: 0, norms: 0 }
        const tick = (kind: keyof typeof charges) => {
          charges[kind]++
          if (
            context.work + charges.transforms + charges.norms >
            EXPERIMENT_RESOURCE_PROFILE.maxWorkUnits
          )
            throw new MeshWorkLimit(
              'Passive point preparation exceeded the unchanged guard'
            )
        }
        const points = pairShapes.map((shape) => {
          if (shape.geometry.kind !== 'mesh')
            throw new Error('Expected admitted source mesh')
          const index = prepared.get(shape.geometry)
          if (!index) throw new Error('Missing exact source preparation')
          return index.representatives.map((point) => {
            tick('transforms')
            return meshIndex.worldPoint(shape.pose, point)
          })
        })
        let minimumUpper = Infinity,
          initialUpper = Infinity
        let witness: readonly [number, number] | undefined
        points[0].forEach((a, i) =>
          points[1].forEach((b, j) => {
            tick('norms')
            const upper = ops.norm(ops.sub(a, b))[1]
            if (i === 0 && j === 0) initialUpper = upper
            if (upper < minimumUpper) {
              minimumUpper = upper
              witness = [i, j]
            }
          })
        )
        expect(charges.transforms).toBe(points[0].length + points[1].length)
        expect(charges.norms).toBe(points[0].length * points[1].length)
        expect(minimumUpper).toBeLessThanOrEqual(initialUpper)
        expect(Number.isFinite(minimumUpper)).toBe(true)
        expect(minimumUpper).toBeGreaterThan(snapshot.rule.minimumClearance)
        // eslint-disable-next-line no-console -- permanent bounded passive evidence, never a modified query result
        console.info(
          JSON.stringify({
            profile: 'component-source-seed',
            frame,
            time,
            components: points.map((items) => items.length),
            threshold: snapshot.rule.minimumClearance,
            initialUpper,
            minimumUpper,
            witness,
            establishesWarning: minimumUpper < snapshot.rule.minimumClearance,
            baselineWork: context.work,
            charges,
            combinedWork: context.work + charges.transforms + charges.norms,
            baseline: evidence.leaves[0]
          })
        )
      },
      20000
    )
  }
)
