import type { EvenOddShape } from '@asyra/core'
import { parseColor, type FillAttrs } from '@asyra/utils'

/** Native local material coordinates are valid for a single convex polygon.
 * Keep complex coverage and sharp/alpha transitions on the canonical evaluator.
 * This is eligibility only: it never changes the source contour or colors.
 */
export const canUseNativeVectorFill = (
  shape: EvenOddShape,
  fills: readonly FillAttrs[]
): boolean => {
  if (shape.paths.length !== 1 || fills.length !== 1) return false
  const fill = fills[0]
  const gradient = fill.gradient
  if (
    fill.kind !== 'gradient' ||
    !fill.visible ||
    fill.opacity !== 1 ||
    gradient?.gradientType !== 'linear'
  )
    return false
  const stops = [...gradient.gradientStops].sort(
    (a, b) => a.position - b.position
  )
  if (
    stops.length < 2 ||
    stops[0].position !== 0 ||
    stops[stops.length - 1].position !== 1
  )
    return false
  // The existing native material uses a 256-texel ramp. Only admit
  // transitions with a conservative channel error bound; do not blur stops.
  const colors = stops.map((stop) => parseColor(stop.color))
  for (let index = 0; index < stops.length; index++) {
    const color = colors[index]
    if (!color || color.a !== 1 || stops[index].opacity !== 1) return false
    if (index === 0) continue
    const previous = colors[index - 1]
    if (!previous) return false
    const distance = stops[index].position - stops[index - 1].position
    if (distance < 1 / 128) return false
    if (
      (['r', 'g', 'b'] as const).some(
        (channel) =>
          Math.abs(color[channel] - previous[channel]) / distance > 512
      )
    )
      return false
  }
  const [start, end] = gradient.gradientHandles
  if (!start || !end || Math.hypot(end.x - start.x, end.y - start.y) <= 0.001)
    return false
  const segments = shape.paths[0].segments
  if (
    segments.length < 3 ||
    segments.some((segment) => segment.type !== 'line')
  )
    return false
  let winding = 0
  let direction = 0
  for (let index = 0; index < segments.length; index++) {
    const a = segments[index].points
    const b = segments[(index + 1) % segments.length].points
    if (a[2] !== b[0] || a[3] !== b[1]) return false
    const ax = a[2] - a[0],
      ay = a[3] - a[1]
    const bx = b[2] - b[0],
      by = b[3] - b[1]
    if (Math.hypot(ax, ay) === 0) return false
    const cross = ax * by - ay * bx
    const dot = ax * bx + ay * by
    if (cross === 0 && dot <= 0) return false
    const turn = Math.atan2(cross, dot)
    if (cross !== 0) {
      const sign = Math.sign(cross)
      if (direction && sign !== direction) return false
      direction = sign
    }
    winding += turn
  }
  // Consistent turns alone admit stars; a convex boundary winds exactly once.
  return direction !== 0 && Math.abs(Math.abs(winding) - 2 * Math.PI) < 1e-7
}
