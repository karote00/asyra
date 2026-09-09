import type { Point3 } from './greenhouse'
import { TriangleBuilder } from './mesh'

const clamp = (n: number) => Math.max(0, Math.min(1, n))
const linear = (n: number) =>
  n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4
const mix = (a: Point3, b: Point3, t: number): Point3 =>
  a.map((v, i) => v + (b[i] - v) * clamp(t)) as unknown as Point3

/** Surface maturation varies over a single fruit, including its greener shoulder. */
export function fruitSkinColor(
  t: number,
  angle: number,
  ripeness: number,
  cucumber: boolean,
  phase: number
): Point3 {
  const mottling =
    Math.sin(angle * 3 + phase + t * 5) * 0.045 +
    Math.sin(angle * 7 - t * 13 + phase) * 0.018
  if (cucumber) {
    const stripe = Math.max(0, Math.cos(angle * 5 + t)) ** 8 * 0.04
    const green: Point3 = [
      0.09 + (1 - clamp(ripeness)) * 0.23 + stripe + mottling * 0.2,
      0.24 + (1 - clamp(ripeness)) * 0.15 + stripe + mottling,
      0.1 + (1 - clamp(ripeness)) * 0.08 + stripe * 0.6
    ]
    return mix(
      green,
      [0.36 + mottling, 0.43 + mottling, 0.32 + mottling],
      (ripeness - 1) / 0.75
    ).map(linear) as unknown as Point3
  }
  const development = clamp(
    ripeness +
      (t - 0.5) * (1 - ripeness) * 0.8 +
      mottling +
      0.025 * Math.sin(angle + phase)
  )
  const green: Point3 = [0.39, 0.59, 0.18],
    yellow: Point3 = [0.95, 0.77, 0.16],
    orange: Point3 = [0.96, 0.34, 0.07],
    red: Point3 = [0.79, 0.055, 0.025]
  let color = mix(green, yellow, development / 0.4)
  if (development > 0.4) color = mix(yellow, orange, (development - 0.4) / 0.25)
  if (development > 0.65) color = mix(orange, red, (development - 0.65) / 0.35)
  return color.map(linear) as unknown as Point3
}

/** Rounded Yu-Nu ellipsoid or slender cucumber, with smooth shared ring vertices. */
export function appendFruitSurface(
  builder: TriangleBuilder,
  center: Point3,
  length: number,
  radius: number,
  cucumber: boolean,
  bend: number,
  distant: boolean,
  ripeness: number,
  phase: number
) {
  const rings = distant ? 3 : 14 + Number(cucumber) * 22,
    sides = distant ? 6 : 16 + Number(cucumber) * 16
  const surface = (t: number, angle: number): Point3 => {
    const theta = Math.PI * t
    const taper = cucumber ? Math.sin(theta) ** 0.25 : Math.sin(theta)
    const relief =
      0.045 * Math.cos(5 * angle + 0.3 * Math.sin(t * 17)) +
      0.048 *
        Math.sin(t * 47 + angle * 3 + phase) *
        Math.sin(angle * 11 - t * 9) +
      0.09 *
        Math.max(0, Math.sin(t * 44 + phase) * Math.cos(angle * 8 + t * 3)) ** 8
    const rib = cucumber ? (1 + relief) / (ripeness > 1 ? 1.183 : 1) : 1
    return [
      center[0] +
        radius * taper * Math.cos(angle) * rib +
        bend * Math.sin(theta),
      center[1] +
        (cucumber ? length * (0.5 - t) : length * 0.5 * Math.cos(theta)),
      center[2] + radius * taper * Math.sin(angle) * rib
    ]
  }
  const offset = builder.positions.length / 3
  for (let ring = 0; ring <= rings; ring++)
    for (let side = 0; side < sides; side++) {
      const t = ring / rings,
        angle = (side / sides) * Math.PI * 2
      builder.positions.push(...surface(t, angle))
      builder.colors.push(
        ...fruitSkinColor(t, angle, ripeness, cucumber, phase)
      )
    }
  for (let ring = 0; ring < rings; ring++)
    for (let side = 0; side < sides; side++) {
      const a = offset + ring * sides + side,
        b = offset + ring * sides + ((side + 1) % sides)
      builder.indices.push(a, b, b + sides, a, b + sides, a + sides)
    }
  let spineCount = 0
  if (cucumber && !distant) {
    const scale = Math.min(1, length / 0.12)
    for (let row = 1; row <= 14; row++)
      for (let side = 0; side < 6; side++) {
        const t =
          Math.round(((row + 0.2 * Math.sin(side + phase)) / 16) * rings) /
          rings
        const angle =
          (Math.round(
            (((side * Math.PI) / 3 + row * 0.47 + phase) / (Math.PI * 2)) *
              sides
          ) /
            sides) *
          Math.PI *
          2
        const base = surface(t, angle),
          height =
            (0.0012 + 0.0007 * Math.sin(row * 2 + side) ** 2) *
            (0.65 + 0.35 * scale)
        const normal: Point3 = [Math.cos(angle), 0.18, Math.sin(angle)]
        const tip = base.map(
          (v, i) => v + normal[i] * height
        ) as unknown as Point3
        const start = builder.positions.length / 3
        const footprint = 0.00045 * Math.min(1, scale)
        for (const [along, across] of [
          [1, 0],
          [0, 1],
          [-1, 0],
          [0, -1]
        ]) {
          builder.positions.push(
            ...surface(
              t - (along * footprint) / length,
              angle + (across * footprint) / radius
            )
          )
          builder.colors.push(
            ...fruitSkinColor(t, angle, ripeness, true, phase)
          )
        }
        builder.positions.push(...tip)
        builder.colors.push(...[0.78, 0.81, 0.67].map(linear))
        for (let face = 0; face < 4; face++)
          builder.indices.push(
            start + face,
            start + ((face + 1) % 4),
            start + 4
          )
        spineCount++
      }
  }
  return spineCount
}

/** Narrow recurved sepals rise around the shoulder, as in the cultivar references. */
export function appendFruitCalyx(
  builder: TriangleBuilder,
  center: Point3,
  radius: number,
  distant: boolean
) {
  const sections = distant ? 2 : 5
  for (let sepal = 0; sepal < 5; sepal++) {
    const angle = (sepal * Math.PI * 2) / 5
    const start = builder.positions.length / 3
    for (let step = 0; step <= sections; step++) {
      const t = step / sections
      const reach = radius * (0.12 + 0.88 * t)
      const width = radius * 0.15 * Math.sin(Math.PI * (0.12 + t * 0.88))
      for (const side of [-1, 1])
        builder.positions.push(
          center[0] + Math.cos(angle) * reach - Math.sin(angle) * width * side,
          center[1] -
            radius * 0.12 * Math.sin(Math.PI * t) +
            radius * 0.55 * t ** 3,
          center[2] + Math.sin(angle) * reach + Math.cos(angle) * width * side
        )
      if (step) {
        const a = start + (step - 1) * 2
        builder.indices.push(a, a + 2, a + 3, a, a + 3, a + 1)
      }
    }
  }
}

/** Flowering ovaries retain a yellow corolla; older attached fruit retain a dry remnant. */
export function appendCucumberFlower(
  builder: TriangleBuilder,
  center: Point3,
  growth: number,
  scale: number,
  distant: boolean
) {
  while (builder.colors.length < builder.positions.length)
    builder.colors.push(0.89, 0.58, 0.035)
  const radius = [0.014, 0.009, 0.004, 0.002][Math.min(3, growth)] * scale
  const sections = distant ? 2 : 5
  for (let petal = 0; petal < 5; petal++) {
    const angle = (petal * Math.PI * 2) / 5
    const offset = builder.positions.length / 3
    for (let step = 0; step <= sections; step++) {
      const t = step / sections
      const reach = radius * t
      const width = radius * 0.48 * Math.sin(Math.PI * t)
      for (const side of [-1, 1]) {
        builder.positions.push(
          center[0] + Math.cos(angle) * reach - Math.sin(angle) * width * side,
          center[1] -
            radius *
              (0.12 + t * 0.85 + 0.13 * Math.sin(t * Math.PI * 3 + petal)),
          center[2] + Math.sin(angle) * reach + Math.cos(angle) * width * side
        )
        builder.colors.push(
          ...(growth < 2
            ? [0.95, 0.55 + t * 0.22, 0.012]
            : [0.19, 0.095, 0.023])
        )
      }
      if (step) {
        const a = offset + (step - 1) * 2
        builder.indices.push(a, a + 2, a + 3, a, a + 3, a + 1)
      }
    }
  }
}
