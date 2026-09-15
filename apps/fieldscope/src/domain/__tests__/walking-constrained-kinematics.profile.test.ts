import { expect, it } from 'vitest'
import { WalkingConstrainedCycleOwner } from '../walking-constrained-kinematics'
import { WalkingSourceRelationEvaluator } from '../../simulation/walking-source-relation'
import type { QueryExactFrame } from '../../simulation/ray-query'
import {
  cycleFixture,
  fraction,
  gcd
} from './walking-constrained-kinematics-test-fixtures'
import type { Fraction } from './walking-constrained-kinematics-test-fixtures'

const externalRootCases = [
  ['solid-articulation/1', 0],
  ['solid-articulation/2', 0],
  ['solid-articulation/2', 1]
] as const

for (const [sourceProfile, phase] of externalRootCases)
  it(`external-root profile ${sourceProfile} phase ${phase} midpoint classifies every actual original-region pair`, async (context) => {
    await context.annotate(
      `Starting external-root profile ${sourceProfile} phase ${phase} midpoint proof`,
      'info'
    )
    const { source, raw } = cycleFixture({ sourceProfile })
    const owner = new WalkingConstrainedCycleOwner()
    const cycle = owner.prepare(source, raw)
    const point = owner.evaluate(cycle, phase, fraction(1n, 2n))
    expect(point.parts.map((entry) => entry.part)).toEqual(source.parts)
    // One positive common denominator uniformly scales the exact point scene.
    // This preserves every zero-margin SAT relation and uses the existing
    // original-material kernel; neither display nor legacy FK supplies frames.
    const denominator = point.parts
      .flatMap(({ exact: frame }) => [...frame.origin, ...frame.matrix.flat()])
      .reduce(
        (d, value) => (d / gcd(d, value.denominator)) * value.denominator,
        1n
      )
    expect(denominator.toString(2).length).toBeLessThanOrEqual(
      raw.budget.maxBits
    )
    const scalar = (value: Fraction) => ({
      significand: value.numerator * (denominator / value.denominator),
      exponent: 0
    })
    const evaluator = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 2000000,
      maxExactPredicates: 20000000
    })
    const entries = point.parts.flatMap(({ part, exact: frame }) => {
      const m = frame.matrix.map((row) => row.map(scalar))
      const n = m.map((row) => row.map((value) => value.significand))
      const determinant =
        n[0][0] * (n[1][1] * n[2][2] - n[1][2] * n[2][1]) -
        n[0][1] * (n[1][0] * n[2][2] - n[1][2] * n[2][0]) +
        n[0][2] * (n[1][0] * n[2][1] - n[1][1] * n[2][0])
      expect(determinant).not.toBe(0n)
      const transformed: QueryExactFrame = Object.freeze({
        matrix: m as unknown as QueryExactFrame['matrix'],
        position: frame.origin.map(
          scalar
        ) as unknown as QueryExactFrame['position'],
        determinant: { significand: determinant, exponent: 0 }
      })
      const frames = Object.freeze([transformed])
      return part.regions.map((region) => ({
        part,
        original: region,
        placement: { region: evaluator.prepare(part.shape, region), frames }
      }))
    })
    const failures: string[] = []
    let candidate = 0,
      sameBody = 0,
      separated = 0,
      boundary = 0
    for (let a = 0; a < entries.length; a++)
      for (let b = a + 1; b < entries.length; b++) {
        candidate++
        const first = entries[a],
          second = entries[b]
        if (first.part.bodyId === second.part.bodyId) {
          sameBody++
          continue
        }
        const relation = evaluator.relate(first.placement, second.placement, 0)
        if (relation.kind === 'separated') separated++
        else if (relation.kind === 'boundary') boundary++
        else
          failures.push(
            first.part.id +
              ' - ' +
              first.original.id +
              ' : ' +
              second.part.id +
              ' - ' +
              second.original.id +
              ' : ' +
              relation.kind
          )
      }
    expect(candidate).toBe((entries.length * (entries.length - 1)) / 2)
    expect(evaluator.work.regionPairs).toBe(candidate - sameBody)
    expect(evaluator.work.regionPreparations).toBe(entries.length)
    expect(evaluator.work.transformPreparations).toBe(entries.length)
    expect(evaluator.work.unvisitedRegionPairs).toBe(0)
    expect(evaluator.exactBudgetExhausted).toBe(false)
    const expected =
      sourceProfile === 'solid-articulation/1'
        ? [
            'chassis - region-1 : right-front-coxa - region-0 : volume-overlap',
            'chassis - region-1 : right-rear-coxa - region-0 : volume-overlap',
            'chassis - region-3 : right-front-coxa - region-0 : volume-overlap',
            'chassis - region-3 : right-rear-coxa - region-0 : volume-overlap',
            'chassis - region-19 : left-middle-coxa - region-0 : volume-overlap',
            'chassis - region-21 : left-middle-coxa - region-0 : volume-overlap'
          ]
        : []
    expect(failures, failures.slice(0, 8).join('\n')).toEqual(expected)
    expect(separated + boundary + failures.length).toBe(candidate - sameBody)
    console.info(
      'External root exact midpoint source accounting',
      JSON.stringify({
        sourceProfile,
        phase,
        candidate,
        sameBody,
        separated,
        boundary,
        ...evaluator.work
      })
    )
  }, 300000)
