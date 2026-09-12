import { TriangleBuilder } from './mesh'
import type { Point3 } from './greenhouse'
import type { RobotConfiguration } from './robot-configuration'

export type RobotDefinition = Pick<
  RobotConfiguration,
  'width' | 'length' | 'height' | 'tool'
>
export interface RobotPart {
  id: string
  color: number
  metalness: number
  shape: {
    readonly kind: 'triangles'
    readonly positions: readonly number[]
    readonly indices: readonly number[]
    readonly colors?: readonly number[]
    readonly uvs?: readonly number[]
  }
}
/** Rest frames share the exact dimensions used by the existing concept meshes. */
export function robotRestFrames({ length: l, height: h }: RobotDefinition) {
  return {
    shoulder: [0, h * 0.7, -l * 0.3 + 0.09] as Point3,
    elbow: [0, h * 0.86, -l * 0.04] as Point3,
    wrist: [0, h * 0.59, l * 0.13] as Point3,
    tool: [0, h * 0.515, l * 0.14] as Point3
  }
}

/** Dimensioned concept parts in chassis-local SI coordinates. No scene or sensing state. */
export function createRobotModel(
  definition: RobotDefinition
): readonly RobotPart[] {
  const { width: w, length: l, height: h, tool } = definition
  const frames = robotRestFrames(definition)
  const parts: RobotPart[] = []
  const add = (
    id: string,
    color: number,
    mesh: TriangleBuilder,
    metalness = 0.1
  ) => {
    parts.push({ id, color, metalness, shape: mesh.shape() })
  }
  const box = (
    id: string,
    center: Point3,
    size: Point3,
    color: number,
    metalness = 0.1
  ) => {
    const mesh = new TriangleBuilder()
    mesh.box(center, size)
    add(id, color, mesh, metalness)
  }
  const cylinder = (
    id: string,
    center: Point3,
    radius: number,
    depth: number,
    color: number,
    axis: 'x' | 'y' | 'z' = 'x',
    metalness = 0.1
  ) => {
    const mesh = new TriangleBuilder()
    const point = (angle: number, along: number): Point3 => {
      const a = radius * Math.cos(angle),
        b = radius * Math.sin(angle)
      const delta = { x: [along, a, b], y: [a, along, b], z: [a, b, along] }[
        axis
      ]
      return [center[0] + delta[0], center[1] + delta[1], center[2] + delta[2]]
    }
    for (let i = 0; i < 32; i++) {
      const a = (i * Math.PI) / 16,
        b = ((i + 1) * Math.PI) / 16
      mesh.quad(
        point(a, -depth / 2),
        point(b, -depth / 2),
        point(b, depth / 2),
        point(a, depth / 2)
      )
      const first: [number, number, number] = [...center],
        last: [number, number, number] = [...center]
      const k = { x: 0, y: 1, z: 2 }[axis]
      first[k] -= depth / 2
      last[k] += depth / 2
      mesh.triangle(first, point(b, -depth / 2), point(a, -depth / 2))
      mesh.triangle(last, point(a, depth / 2), point(b, depth / 2))
    }
    add(id, color, mesh, metalness)
  }
  const tube = (
    id: string,
    points: Point3[],
    diameter: number,
    color: number
  ) => {
    const mesh = new TriangleBuilder()
    mesh.tube({ points, diameter }, 16)
    add(id, color, mesh, 0.6)
  }
  const steel = 0xb9c4c7,
    dark = 0x283d37,
    shell = 0xe5e9dc,
    green = 0x35644e,
    rubber = 0x252b2b,
    gold = 0xd6ae53
  const r = Math.min(l * 0.13, h * 0.12)
  box('battery-case', [0, r + 0.035, 0], [w * 0.69, 0.13, l * 0.76], dark)
  box('chassis', [0, r + 0.12, 0], [w * 0.76, 0.1, l * 0.86], green)
  box('deck', [0, r + 0.182, 0], [w * 0.77, 0.025, l * 0.88], steel, 0.7)
  for (const side of [-1, 1])
    for (const end of [-1, 1]) {
      const center: Point3 = [side * w * 0.415, r, end * l * 0.32]
      cylinder(`tire-${side}-${end}`, center, r, w * 0.17, rubber)
      cylinder(
        `hub-${side}-${end}`,
        [side * w * 0.491, r, end * l * 0.32],
        r * 0.51,
        0.004,
        steel,
        'x',
        0.8
      )
      cylinder(
        `axle-${side}-${end}`,
        [side * w * 0.495, r, end * l * 0.32],
        r * 0.17,
        0.003,
        dark
      )
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6
        cylinder(
          `bolt-${side}-${end}-${i}`,
          [
            side * (w / 2 - 0.004),
            r + Math.cos(a) * r * 0.35,
            end * l * 0.32 + Math.sin(a) * r * 0.35
          ],
          0.004,
          0.003,
          dark
        )
      }
      box(
        `fender-${side}-${end}`,
        [side * w * 0.407, r * 2 + 0.022, end * l * 0.32],
        [w * 0.18, 0.026, l * 0.32],
        green
      )
    }
  for (const end of [-1, 1]) {
    box(
      `bumper-${end}`,
      [0, r + 0.1, end * l * 0.455],
      [w * 0.77, 0.07, l * 0.025],
      rubber
    )
    for (const side of [-1, 1])
      cylinder(
        `lamp-${side}-${end}`,
        [side * w * 0.24, r + 0.14, end * l * 0.471],
        0.016,
        0.004,
        0xd8eaba,
        'z'
      )
  }
  const mastZ = -l * 0.3,
    top = h - 0.045
  for (const side of [-1, 1]) {
    box(
      `mast-${side}`,
      [side * w * 0.12, (top + r + 0.2) / 2, mastZ],
      [0.028, top - r - 0.2, 0.035],
      steel,
      0.8
    )
  }
  box('mast-top', [0, top, mastZ], [w * 0.33, 0.035, 0.06], dark)
  tube(
    'lift-screw',
    [
      [0, r + 0.21, mastZ],
      [0, top, mastZ]
    ],
    0.014,
    steel
  )
  box(
    'lift-carriage',
    [0, h * 0.67, mastZ + 0.025],
    [w * 0.33, 0.12, 0.07],
    shell
  )
  cylinder('shoulder', frames.shoulder, 0.054, w * 0.25, dark)
  tube('upper-arm', [frames.shoulder, frames.elbow], 0.065, shell)
  cylinder('elbow', frames.elbow, 0.047, 0.1, green)
  tube('forearm', [frames.elbow, frames.wrist], 0.052, shell)
  cylinder('wrist', frames.wrist, 0.036, 0.07, dark)
  box(
    'camera-housing',
    [0, h - 0.029, -l * 0.15],
    [w * 0.32, 0.058, 0.058],
    dark
  )
  for (const side of [-1, 1]) {
    cylinder(
      `camera-lens-${side}`,
      [side * w * 0.105, h - 0.025, -l * 0.116],
      0.014,
      0.014,
      0x102735,
      'z',
      0.6
    )
    cylinder(
      `camera-ring-${side}`,
      [side * w * 0.105, h - 0.025, -l * 0.123],
      0.02,
      0.003,
      steel,
      'z',
      0.8
    )
  }
  tube(
    'camera-bracket',
    [
      [0, top, mastZ],
      [0, top, -l * 0.15]
    ],
    0.016,
    steel
  )
  // Guarded jaws are a concept; no exposed cutting blade or actuated pose.
  box('tool-guard', [0, h * 0.55, l * 0.13], [w * 0.24, 0.03, 0.09], green)
  for (const side of [-1, 1]) {
    box(
      `jaw-${side}`,
      [side * w * 0.075, h * 0.515, l * 0.14],
      [0.018, h * 0.06, tool === 'cucumber' ? 0.07 : 0.045],
      steel,
      0.7
    )
    box(
      `pad-${side}`,
      [side * w * 0.051, h * 0.515, l * 0.14],
      [0.01, h * 0.048, tool === 'cucumber' ? 0.058 : 0.035],
      tool === 'cucumber' ? rubber : 0xc89571
    )
  }
  // Open, washable crate behind the guarded work head, mechanically retained.
  const floor = r + 0.23,
    cw = w * 0.63,
    cl = l * 0.4,
    cz = l * 0.14,
    ch = h * 0.19
  box('crate-bottom', [0, floor, cz], [cw, 0.018, cl], gold)
  for (const side of [-1, 1]) {
    box(
      `crate-side-${side}`,
      [(side * cw) / 2, floor + ch / 2, cz],
      [0.014, ch, cl],
      gold
    )
    box(
      `crate-rim-side-${side}`,
      [(side * cw) / 2, floor + ch, cz],
      [0.024, 0.022, cl + 0.02],
      gold
    )
    box(
      `crate-end-${side}`,
      [0, floor + ch / 2, cz + (side * cl) / 2],
      [cw, ch, 0.014],
      gold
    )
    box(
      `crate-rim-end-${side}`,
      [0, floor + ch, cz + (side * cl) / 2],
      [cw + 0.02, 0.022, 0.024],
      gold
    )
    box(
      `crate-latch-${side}`,
      [side * (cw / 2 + 0.014), floor + 0.045, cz],
      [0.018, 0.07, 0.045],
      steel,
      0.8
    )
  }
  box(
    'estop-base',
    [-w * 0.28, r + 0.205, -l * 0.15],
    [0.06, 0.016, 0.06],
    0xe4c34b
  )
  cylinder(
    'estop',
    [-w * 0.28, r + 0.224, -l * 0.15],
    0.018,
    0.023,
    0xba3934,
    'y'
  )
  return parts
}

export function createDockModel(): readonly RobotPart[] {
  const parts: RobotPart[] = []
  const box = (id: string, center: Point3, size: Point3, color: number) => {
    const mesh = new TriangleBuilder()
    mesh.box(center, size)
    parts.push({ id, color, metalness: 0.3, shape: mesh.shape() })
  }
  box('platform', [0, -0.015, 0], [1.5, 0.03, 2.1], 0x90998d)
  box('charger-foot', [0, 0.035, -0.85], [0.45, 0.07, 0.24], 0x33463e)
  box('charger', [0, 0.38, -0.87], [0.29, 0.66, 0.16], 0xdde5d7)
  box('charger-screen', [0, 0.58, -0.782], [0.2, 0.11, 0.008], 0x264b52)
  for (const side of [-1, 1])
    box(
      `charge-contact-${side}`,
      [side * 0.072, 0.24, -0.772],
      [0.035, 0.085, 0.018],
      0xc7a157
    )
  box('exchange-shelf', [1.08, 0.59, 0], [0.55, 0.025, 0.7], 0xb9c4c7)
  for (const x of [0.85, 1.31])
    for (const z of [-0.27, 0.27])
      box(`exchange-leg-${x}-${z}`, [x, 0.3, z], [0.025, 0.58, 0.025], 0x9ca8a6)
  return parts
}
