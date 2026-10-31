import tea from '../../../../assets/asyra-office/models/tea-furniture/tea-furniture-model-spec.json'
import { box, vec, type Vec } from './geometry'
import { part, type AssetPart } from './catalog'
import { requiredSpecValue } from './specification'
import { roundedTaper } from './rounded-turning'
import { radialSolid } from './radial-solid'

const a = (2 * Math.PI) / 3,
  R = 0.2,
  bottom = 0.235
const shell = requiredSpecValue(
  tea.modules
    .find((m) => m.moduleId === 'tea-chair')
    ?.components.find((c) => c.partId === 'wraparound-shell'),
  'tea chair shell'
)
const shellHeight = requiredSpecValue(
  'height' in shell ? shell.height : undefined,
  'tea chair crown'
)
const height = (theta: number) =>
  shellHeight.end +
  (shellHeight.rear - shellHeight.end) *
    (1 - Math.pow(Math.abs(theta) / a, shellHeight.exponent))
function roundedBoxField(p: Vec, half: Vec, radius: number) {
  const q = p.map((v, i) => Math.abs(v) - half[i] + radius)
  return (
    Math.hypot(...q.map((v) => Math.max(v, 0))) +
    Math.min(Math.max(...q), 0) -
    radius
  )
}
function shellClearance([x, y, z]: Vec) {
  // Source-space inverse of the approved elliptical shell map.
  let lo = -0.002,
    hi = 0.052
  const ellipse = (v: number) =>
    (x / (0.17 + v)) ** 2 + (y / (0.18 + v)) ** 2 - 1
  if (ellipse(lo) < 0) {
    return 0.001
  }
  if (ellipse(hi) > 0) {
    return 0.001
  }
  for (let i = 0; i < 24; i++) {
    const m = (lo + hi) / 2
    if (ellipse(m) > 0) {
      lo = m
    } else {
      hi = m
    }
  }
  const v = (lo + hi) / 2,
    theta = Math.atan2(x / (0.17 + v), y / (0.18 + v))
  if (Math.abs(theta) > a + 0.002 / R) {
    return 0.001
  }
  const zs = bottom + ((z - bottom) * 0.415) / (height(theta) - bottom)
  return roundedBoxField(
    [R * theta, v - 0.025, zs - 0.4425],
    [R * a + 0.002, 0.027, 0.2095],
    0.014
  )
}
function seatField(
  p: Vec,
  width: number,
  depth: number,
  zMin: number,
  zMax: number,
  cy: number,
  edge: number,
  trim: boolean
) {
  const [x, y, z] = p,
    plan = 0.07
  const q = [
    Math.abs(x) - (width / 2 - plan),
    Math.abs(y - cy) - (depth / 2 - plan)
  ]
  const dxy =
    Math.hypot(...q.map((v) => Math.max(v, 0))) +
    Math.min(Math.max(...q), 0) -
    (plan - edge)
  const dz = Math.abs(z - (zMin + zMax) / 2) - ((zMax - zMin) / 2 - edge)
  const blank =
    Math.hypot(Math.max(dxy, 0), Math.max(dz, 0)) +
    Math.min(Math.max(dxy, dz), 0) -
    edge
  if (!trim) {
    return blank
  }
  const rear = y >= 0 ? (Math.hypot(x / 0.19, y / 0.2) - 1) * 0.19 : -1
  return Math.max(blank, rear, -shellClearance(p))
}
export function teaChair(): AssetPart[] {
  const orange = parseInt(tea.materials.orange.baseColorSRGB.slice(1), 16),
    wood = parseInt(tea.materials['dark-wood'].baseColorSRGB.slice(1), 16)
  const samples = Array.from(
    { length: 121 },
    (_, i) => -R * a + (2 * R * a * i) / 120
  )
  samples.push((-R * Math.PI) / 2, (R * Math.PI) / 2, 0)
  const shell = box([2 * R * a, 0.05, 0.415], 0.012, 4, [samples])
  for (let i = 0; i < shell.positions.length; i += 3) {
    const theta = shell.positions[i] / R,
      v = shell.positions[i + 1] + 0.025,
      zs = shell.positions[i + 2] + 0.4425
    shell.positions[i] = (0.17 + v) * Math.sin(theta)
    shell.positions[i + 1] = (0.18 + v) * Math.cos(theta)
    shell.positions[i + 2] =
      bottom + ((zs - bottom) / 0.415) * (height(theta) - bottom)
  }
  const seat = (
    id: string,
    width: number,
    depth: number,
    z0: number,
    z1: number,
    cy: number,
    edge: number,
    trim: boolean
  ) => {
    const lower = Array.from(
      { length: 5 },
      (_, i) => z0 + edge * (1 - Math.cos((i * Math.PI) / 8))
    )
    const upper = Array.from(
      { length: 5 },
      (_, i) => z1 - edge + edge * Math.sin((i * Math.PI) / 8)
    )
    const heights = [...new Set([...lower, ...upper])].sort((a, b) => a - b)
    return part(
      id,
      radialSolid(
        (p) => seatField(p, width, depth, z0, z1, cy, edge, trim),
        cy,
        heights,
        0.4,
        128
      ),
      orange,
      'fabric'
    )
  }
  const pieces = [
    part('shell', shell, orange, 'fabric'),
    seat('seat-base', 0.36, 0.35, 0.205, 0.255, -0.015, 0.008, false),
    seat('seat', 0.36, 0.425, 0.245, 0.33, -0.0175, 0.025, true)
  ]
  const module = requiredSpecValue(
    tea.modules.find((m) => m.moduleId === 'tea-chair'),
    'tea-chair'
  )
  const legs = requiredSpecValue(
    module.components.find((c) => c.partId === 'legs'),
    'tea legs'
  )
  requiredSpecValue(legs.endCentres, 'tea leg endpoints').forEach(
    ({ bottom, top }, i) =>
      pieces.push(
        part(
          `leg-${i}`,
          roundedTaper(vec(bottom), vec(top), 0.014, 0.018, 0.002, 32),
          wood,
          'wood'
        )
      )
  )
  return pieces
}
