import { describe, expect, it } from 'vitest'
import { interval, multiply, subtract } from '../../domain/scalar-arithmetic'
import {
  mechanicsVector,
  mechanicsCentreOfMass,
  mechanicsHull,
  mechanicsSupport,
  mechanicsTorque
} from '../walking-quasi-static-arithmetic'

const frame = { position: [0, 0, 0] as const, rotation: [0, 0, 0, 1] as const }
const square = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1]
] as const
const contains = (i: { low: number; high: number }, expected: number) => {
  expect(i.low).toBeLessThanOrEqual(expected)
  expect(i.high).toBeGreaterThanOrEqual(expected)
}
describe('walking quasi-static directed mechanics', () => {
  it('conserves masses and weighted centres once, with SI torque', () => {
    const result = mechanicsCentreOfMass([
      { massKg: 2, position: mechanicsVector([0, 0, 0]) },
      { massKg: 2, position: mechanicsVector([2, 0, 0]) }
    ])
    expect(result.totalMass).toEqual(interval(4))
    expect(result.worldCoM).toEqual(mechanicsVector([1, 0, 0]))
    const torque = mechanicsTorque(
      mechanicsVector([0, 0, 0]),
      mechanicsVector([2, 0, 0]),
      interval(3)
    )
    contains(torque.vector[2], -3 * 9.80665 * 2)
    contains(torque.magnitude, 3 * 9.80665 * 2)
  })
  it('builds a deterministic exact hull with unordered, duplicate and interior contacts', () => {
    const vertices = [...square, [0, 0] as const, square[0]].reverse()
    expect(mechanicsHull(vertices)).toEqual([
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1]
    ])
    expect(
      mechanicsHull([
        [0, 0],
        [1, 1],
        [2, 2]
      ])
    ).toHaveLength(2)
  })
  it('screens strict interior, blocks exact edge/outside and complete degeneration', () => {
    const solve = (
      x: number,
      points: readonly (readonly [number, number])[] = square
    ) =>
      mechanicsSupport(
        mechanicsVector([x, 2, 0]),
        interval(10),
        frame,
        points,
        0
      )
    expect(solve(0).status).toBe('screened')
    expect(solve(1).status).toBe('blocked')
    expect(solve(2).status).toBe('blocked')
    expect(
      solve(0, [
        [0, 0],
        [1, 1],
        [2, 2]
      ]).status
    ).toBe('blocked')
    contains(solve(0).minimumMomentNm, 10 * 9.80665)
  })
  it('uses an explicit reserve and leaves an arithmetic straddle unknown', () => {
    expect(
      mechanicsSupport(
        mechanicsVector([0, 2, 0]),
        interval(1),
        frame,
        square,
        1
      ).status
    ).toBe('blocked')
    expect(
      mechanicsSupport(
        [{ low: 0.99, high: 1.01 }, interval(2), interval(0)],
        interval(1),
        frame,
        square,
        0
      ).status
    ).toBe('unknown')
  })
  it('keeps the gravity times uncertainty-reserve product outward', () => {
    const reserve = 0.9999999999999999
    const result = mechanicsSupport(
      mechanicsVector([0, 2, 0]),
      interval(1),
      frame,
      square,
      reserve
    )
    const expected = subtract(
      interval(9.80665),
      multiply(interval(9.80665), interval(reserve))
    )
    expect(result.minimumMomentNm.low).toBeLessThanOrEqual(expected.low)
    expect(result.minimumMomentNm.high).toBeGreaterThanOrEqual(expected.high)
  })
  it('projects along gravity onto a sloped plane and measures true 3D edge torque', () => {
    const angle = Math.PI / 6,
      slope = {
        position: [0, 0, 0] as const,
        rotation: [Math.sin(angle / 2), 0, 0, Math.cos(angle / 2)] as const
      }
    const result = mechanicsSupport(
      mechanicsVector([0, 2, 0]),
      interval(10),
      slope,
      square,
      0
    )
    expect(result.status).toBe('screened')
    contains(result.projection[0], 0)
    contains(result.projection[1], 0)
    contains(result.minimumMomentNm, 10 * 9.80665 * Math.cos(angle))
    const parallel = {
      position: [0, 0, 0] as const,
      rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2] as const
    }
    expect(
      mechanicsSupport(
        mechanicsVector([0, 2, 0]),
        interval(1),
        parallel,
        square,
        0
      ).status
    ).toBe('unknown')
    expect(
      mechanicsSupport(
        mechanicsVector([0, 2, 0]),
        interval(1),
        { position: [0, 0, 0], rotation: [1, 0, 0, 0] },
        square,
        0
      ).status
    ).toBe('unknown')
  })
})
