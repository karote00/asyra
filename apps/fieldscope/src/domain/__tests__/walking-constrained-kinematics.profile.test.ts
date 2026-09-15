import { describe, expect, it } from 'vitest'
import { roundFraction } from '../scalar-arithmetic'
import { evaluateExactPolynomialTrig } from '../kinematic-trigonometry'
import {
  WalkingConstrainedCycleOwner,
  WalkingConstrainedKinematicsOwner
} from '../walking-constrained-kinematics'
import { WalkingSourceRelationEvaluator } from '../../simulation/walking-source-relation'
import type { QueryExactFrame } from '../../simulation/ray-query'
import {
  cycleFixture,
  exact,
  fixture,
  fraction,
  gcd,
  inRange,
  minus,
  negate,
  over,
  plus,
  pointOracle,
  required,
  rotateOracle,
  times,
  vectorPlus
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

describe('exact polynomial complementary tripod offline profiles', () => {
  for (const phase of [0, 1] as const)
    it(`proves phase ${phase} full soles from actual vertices and encloses all original part points`, async (context) => {
      await context.annotate(
        `Starting phase ${phase} complete original-vertex envelope proof`,
        'info'
      )
      const { source, raw } = cycleFixture()
      const owner = new WalkingConstrainedCycleOwner(),
        cycle = owner.prepare(source, raw)
      const point = owner.evaluate(cycle, phase, fraction(1n, 2n))
      const bounded = cycle.phases[phase]
      expect(bounded.supports).toHaveLength(3)
      expect(bounded.swing).toHaveLength(3)
      expect(bounded.bodies.map((b) => b.body)).toEqual(source.rig.bodies)
      expect(bounded.parts.map((p) => p.part)).toEqual(source.parts)
      let sourceVertices = 0,
        oracleVertices = 0
      let minimumX: Fraction | undefined, maximumX: Fraction | undefined
      for (let p = 0; p < point.parts.length; p++) {
        const { part, exact: frame } = point.parts[p],
          bounds = bounded.parts[p].sourceBounds
        const denominator = [...frame.origin, ...frame.matrix.flat()].reduce(
          (d, v) => (d / gcd(d, v.denominator)) * v.denominator,
          1n
        )
        const origins = frame.origin.map(
          (v) => v.numerator * (denominator / v.denominator)
        )
        const coefficients = frame.matrix.map((row) =>
          row.map((v) => v.numerator * (denominator / v.denominator))
        )
        const lows = bounds.min.map(exact),
          highs = bounds.max.map(exact)
        const coordinates = new Map<string, readonly Fraction[]>()
        for (let i = 0; i < part.shape.positions.length; i += 3) {
          const rawPoint = part.shape.positions.slice(i, i + 3),
            key = rawPoint.join(',')
          let actual = coordinates.get(key)
          if (!actual) {
            const point = rawPoint.map(exact)
            const divisor = point.reduce(
              (d, v) => (d / gcd(d, v.denominator)) * v.denominator,
              1n
            )
            const scaled = point.map(
              (v) => v.numerator * (divisor / v.denominator)
            )
            actual = origins.map((v, k) => ({
              numerator:
                v * divisor +
                coefficients[k].reduce((n, c, j) => n + c * scaled[j], 0n),
              denominator: denominator * divisor
            }))
            coordinates.set(key, actual)
            oracleVertices++
            if (i === 0) {
              const independent = pointOracle(frame, point)
              actual.forEach((v, k) =>
                expect(v.numerator * independent[k].denominator).toBe(
                  independent[k].numerator * v.denominator
                )
              )
            }
          }
          actual.forEach((v, k) => {
            expect(
              v.numerator * lows[k].denominator -
                lows[k].numerator * v.denominator
            ).toBeGreaterThanOrEqual(0n)
            expect(
              highs[k].numerator * v.denominator -
                v.numerator * highs[k].denominator
            ).toBeGreaterThanOrEqual(0n)
          })
          const x = actual[0]
          if (
            !minimumX ||
            x.numerator * minimumX.denominator <
              minimumX.numerator * x.denominator
          )
            minimumX = x
          if (
            !maximumX ||
            x.numerator * maximumX.denominator >
              maximumX.numerator * x.denominator
          )
            maximumX = x
          sourceVertices++
        }
        expect(coordinates.size).toBe(
          new Set(
            Array.from({ length: part.shape.positions.length / 3 }, (_, i) =>
              part.shape.positions.slice(i * 3, i * 3 + 3).join(',')
            )
          ).size
        )
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
      expect(cycle.work.sourceVertices).toBe(2 * sourceVertices)
      const width = minus(required(maximumX), required(minimumX))
      const outwardWidth = roundFraction(
        width.numerator,
        width.denominator,
        'up'
      )
      expect(Number.isFinite(outwardWidth)).toBe(true)
      console.info(
        'External root actual midpoint envelope',
        JSON.stringify({
          sourceProfile: source.definition.sourceModel.kind,
          phase,
          outwardWidth
        })
      )
      expect(oracleVertices).toBeLessThan(sourceVertices)
      for (const support of bounded.supports) {
        const frame = required(
          point.parts.find((p) => p.part === support.part)
        ).exact
        const indices = new Set(
          support.patch.ranges.flatMap((r) =>
            support.part.shape.indices.slice(
              r.indexStart,
              r.indexStart + r.indexCount
            )
          )
        )
        expect(
          support.fixedVertices.map((v) => v.index).sort((a, b) => a - b)
        ).toEqual([...indices].sort((a, b) => a - b))
        for (const vertex of support.fixedVertices)
          expect(
            pointOracle(
              frame,
              support.part.shape.positions
                .slice(vertex.index * 3, vertex.index * 3 + 3)
                .map(exact)
            )
          ).toEqual(vertex.position)
      }
      const initial = owner.evaluate(cycle, phase, exact(0))
      for (const swing of bounded.swing) {
        const chain = required(
          source.rig.legChains.find((c) => c.id === swing.chainId)
        )
        const joints = chain.jointIds.map((id) =>
          required(source.rig.joints.find((j) => j.id === id))
        )
        const foot = required(
          required(source.rig.bodies.find((b) => b.id === chain.footBodyId))
            .fixedFrame
        )
        const part = swing.part
        // At u=1/2, theta=0. This independently binds the general lift
        // certificate's rho/down interval coefficients to original source vertices.
        const beta = raw.alpha
        const s = evaluateExactPolynomialTrig('sin', over(beta, exact(2))).value
        const c = evaluateExactPolynomialTrig('cos', over(beta, exact(2))).value
        const n = plus(times(s, s), times(c, c)),
          sn = over(times(exact(2), times(s, c)), n),
          oneMinusCos = over(times(exact(2), times(s, s)), n)
        const current = required(point.parts.find((p) => p.part === part)).exact
        const initialFrame = required(
          initial.parts.find((p) => p.part === part)
        ).exact
        expect(swing.certificate.scalar.sineSign).toBe('input-sign')
        expect(swing.certificate.openPhasePositive).toBe(true)
        for (const vertex of swing.vertices) {
          const sourcePoint = part.shape.positions
            .slice(vertex.index * 3, vertex.index * 3 + 3)
            .map(exact)
          const partLocal = vectorPlus(
            part.localFrame.position.map(exact),
            rotateOracle(part.localFrame.rotation.map(exact), sourcePoint)
          )
          const offset = vectorPlus(
            vectorPlus(
              joints[1].frame.position.map(exact),
              joints[2].frame.position.map(exact)
            ),
            vectorPlus(foot.position.map(exact), partLocal)
          )
          const rho = chain.side === 'left' ? negate(offset[0]) : offset[0],
            down = negate(offset[1])
          inRange(rho, vertex.rho)
          inRange(down, vertex.down)
          expect(vertex.rho.low).toBeGreaterThan(0)
          expect(vertex.down.low).toBeGreaterThanOrEqual(0)
          const h = plus(times(rho, sn), times(down, oneMinusCos))
          const before = pointOracle(initialFrame, sourcePoint),
            now = pointOracle(current, sourcePoint)
          expect(minus(now[1], before[1])).toEqual(h)
          expect(h.numerator).toBeGreaterThan(0n)
        }
      }
    }, 300000)
})

describe('constrained projection offline geometry profiles', () => {
  it('keeps every exact body frame and original part vertex inside one polynomial recipe interval', async (context) => {
    await context.annotate(
      'Starting complete exact body-frame and original-vertex interval proof',
      'info'
    )
    const { source, recipe, alpha } = fixture()
    const owner = new WalkingConstrainedKinematicsOwner()
    const projection = owner.prepare(source, recipe)
    expect(projection.work.boundLeaves).toBe(2)
    expect(projection.work.sourceVertices).toBe(
      source.parts.reduce(
        (count, part) => count + part.shape.positions.length / 3,
        0
      )
    )
    expect(projection.work.supportVertices).toBe(
      projection.supports.reduce(
        (count, support) => count + support.fixedVertices.length,
        0
      )
    )
    for (const parameter of [-alpha, alpha / 3, alpha]) {
      const point = owner.evaluate(projection, parameter)
      expect(point.work.pointLeaves).toBe(2)
      expect(point.source).toBe(source)
      expect(point.recipe).toBe(projection.recipe)
      for (const body of point.frames) {
        const bounds = required(
          projection.bodies.find((entry) => entry.body === body.body)
        ).bounds
        body.exact.origin.forEach((value, index) =>
          inRange(value, bounds.origin[index])
        )
        body.exact.matrix.forEach((row, index) =>
          row.forEach((value, column) =>
            inRange(value, bounds.matrix[index][column])
          )
        )
        expect(
          [...body.display.origin, ...body.display.matrix.flat()].every(
            Number.isFinite
          )
        ).toBe(true)
      }
      for (const entry of point.parts) {
        const bounds = required(
          projection.parts.find((part) => part.part === entry.part)
        ).sourceBounds
        for (
          let offset = 0;
          offset < entry.part.shape.positions.length;
          offset += 3
        ) {
          const p = pointOracle(
            entry.exact,
            entry.part.shape.positions.slice(offset, offset + 3).map(exact)
          )
          p.forEach((value, axis) =>
            inRange(value, { low: bounds.min[axis], high: bounds.max[axis] })
          )
        }
        const support = projection.supports.find(
          (support) => support.part === entry.part
        )
        if (support)
          for (const vertex of support.fixedVertices)
            expect(
              pointOracle(
                entry.exact,
                entry.part.shape.positions
                  .slice(vertex.index * 3, vertex.index * 3 + 3)
                  .map(exact)
              )
            ).toEqual(vertex.position)
      }
    }
    const nonSupport = required(
      projection.bodies.find((entry) => entry.body.id === 'base')
    )
    expect(
      nonSupport.bounds.origin.some((value) => value.low < value.high)
    ).toBe(true)
  }, 300000)
})
