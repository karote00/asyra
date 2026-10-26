/** Offline projection audit of the production seating, never a runtime layout. */
import { mkdirSync, writeFileSync } from 'node:fs'
import { composeOfficeSeating } from '../src/scene/office-seating'
import { placeParts } from '../src/assets/catalog'
import structure from '../src/scene/reference/office-structure.json'
import source from '../src/scene/reference/interior-landmarks.json'

const eye = structure.camera.position
const direction = eye.map((v, i) => v - structure.camera.target[i])
const length = Math.hypot(...direction)
const toward = direction.map((v) => v / length)
const horizontal = Math.hypot(toward[0], toward[1])
const right = [-toward[1] / horizontal, toward[0] / horizontal, 0]
const up = [
  -toward[2] * right[1],
  toward[2] * right[0],
  toward[0] * right[1] - toward[1] * right[0]
]
const focal = 756 / (2 * Math.tan((structure.camera.fov * Math.PI) / 360))
const measurements: object[] = []
composeOfficeSeating({
  add(id, asset, parts, position, rotation, scale) {
    const bounds = [Infinity, Infinity, -Infinity, -Infinity]
    for (const part of placeParts(parts, position, rotation, scale)) {
      for (let i = 0; i < part.mesh.positions.length; i += 3) {
        const point = part.mesh.positions
          .slice(i, i + 3)
          .map((v, k) => v - eye[k])
        const dot = (axis: number[]) =>
          point.reduce((n, v, k) => n + v * axis[k], 0)
        const depth = -dot(toward)
        const x = 642.5 + (focal * dot(right)) / depth
        const y = 422 - (focal * dot(up)) / depth
        bounds[0] = Math.min(bounds[0], x)
        bounds[1] = Math.min(bounds[1], y)
        bounds[2] = Math.max(bounds[2], x)
        bounds[3] = Math.max(bounds[3], y)
      }
    }
    const evidence = Object.entries(source.furniture).find(
      ([key]) => key === id
    )?.[1]
    if (!evidence) throw new Error(`Missing seating trace ${id}`)
    measurements.push({
      id,
      asset,
      position,
      rotation,
      scale,
      projectedBounds: bounds,
      historicalSourceBounds: evidence.box,
      centreDeltaPixels: [0, 1].map(
        (a) =>
          (bounds[a] + bounds[a + 2] - evidence.box[a] - evidence.box[a + 2]) /
          2
      ),
      projectedExtentRatio: [0, 1].map(
        (a) =>
          (bounds[a + 2] - bounds[a]) / (evidence.box[a + 2] - evidence.box[a])
      )
    })
  }
})
mkdirSync('tmp/setup', { recursive: true })
writeFileSync(
  'tmp/setup/seating-placement-measurements.json',
  JSON.stringify(
    {
      camera: structure.camera,
      source: source.reference,
      viewport: source.viewport,
      limits:
        'Historical source bounds are visible illustration envelopes, not complete mesh extents. The work chair is substantially occluded. Absolute residuals also include the approved structural correction; do not treat them as isolated furniture translations or fit hidden geometry to them.',
      measurements
    },
    null,
    2
  ) + '\n'
)
process.stdout.write(
  'Wrote production seating projection audit. No runtime changes.\n'
)
