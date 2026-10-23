/** Original cucumber leaf microrelief, based on the supplied palmate-veined leaf photograph. */
const size = 256
const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}
const cucumberSegments: number[][] = []
for (const [x, y] of [
  [0.07, 0.38],
  [0.2, 0.7],
  [0.5, 1],
  [0.8, 0.7],
  [0.93, 0.38]
]) {
  cucumberSegments.push([0.5, 0.015, x, y, 0.012])
  for (const t of [0.28, 0.48, 0.68, 0.85]) {
    const bx = 0.5 + (x - 0.5) * t,
      by = 0.015 + (y - 0.015) * t
    for (const sign of [-1, 1])
      cucumberSegments.push([
        bx,
        by,
        bx + (x - 0.5) * 0.15 + sign * 0.09,
        by + 0.12,
        0.004
      ])
  }
}
const tomatoSegments: number[][] = [[0.5, 0.015, 0.5, 1, 0.01]]
for (const t of [0.15, 0.3, 0.45, 0.6, 0.75])
  for (const sign of [-1, 1])
    tomatoSegments.push([
      0.5,
      t,
      0.5 + sign * 0.35 * Math.sin(Math.PI * t),
      t + 0.18,
      0.004
    ])
function relief(u: number, v: number, cucumber: boolean) {
  const segments = cucumber ? cucumberSegments : tomatoSegments
  let vein = 0
  for (const [ax, ay, bx, by, width] of segments) {
    const dx = bx - ax,
      dy = by - ay
    const t = Math.max(
      0,
      Math.min(1, ((u - ax) * dx + (v - ay) * dy) / (dx * dx + dy * dy))
    )
    const distance = Math.hypot(u - ax - t * dx, v - ay - t * dy)
    vein = Math.max(vein, Math.exp(-((distance / width) ** 2) * 2))
  }
  const x = u * 22,
    y = v * 28
  let first = Infinity,
    second = Infinity
  for (let dx = -1; dx <= 1; dx++)
    for (let dy = -1; dy <= 1; dy++) {
      const cx = Math.floor(x) + dx,
        cy = Math.floor(y) + dy
      const d = Math.hypot(
        x - cx - hash(cx, cy),
        y - cy - hash(cy + 17, cx + 23)
      )
      if (d < first) {
        second = first
        first = d
      } else second = Math.min(second, d)
    }
  const fine = Math.exp(-(second - first) * 24)
  const bulge = Math.min(1, (second - first) * 3)
  return {
    vein,
    fine,
    height: bulge * (cucumber ? 0.004 : 0.0015) + vein * 0.006 - fine * 0.0009
  }
}
function createSurface(cucumber: boolean) {
  const heights: number[] = [],
    albedo: number[] = [],
    normals: number[] = []
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const p = relief(x / (size - 1), y / (size - 1), cucumber)
      heights.push(p.height)
      const grain = hash(x, y) * 7
      albedo.push(
        Math.round(171 + p.vein * 59 + p.fine * 15 + grain),
        Math.round(185 + p.vein * 55 + p.fine * 6 + grain),
        Math.round(158 + p.vein * 18 + p.fine * 12 + grain),
        255
      )
    }
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const at = (a: number, b: number) =>
        heights[
          Math.max(0, Math.min(size - 1, b)) * size +
            Math.max(0, Math.min(size - 1, a))
        ]
      const nx = -(at(x + 1, y) - at(x - 1, y)) * size * 0.5
      const ny = -(at(x, y + 1) - at(x, y - 1)) * size * 0.5
      const length = Math.hypot(nx, ny, 1)
      normals.push(
        Math.round(((nx / length) * 0.5 + 0.5) * 255),
        Math.round(((ny / length) * 0.5 + 0.5) * 255),
        Math.round(((1 / length) * 0.5 + 0.5) * 255),
        255
      )
    }
  return Object.freeze({
    width: size,
    height: size,
    albedo: Object.freeze(albedo),
    normals: Object.freeze(normals)
  })
}
/** Anatomy is invariant: one shared immutable source, independent of camera/configuration. */
export const CUCUMBER_LEAF_SURFACE = createSurface(true)
export const TOMATO_LEAF_SURFACE = createSurface(false)
