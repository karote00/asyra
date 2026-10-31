import { part, placeParts, type AssetPart } from './catalog'
import {
  append,
  box,
  ellipsoid,
  emptyMesh,
  lathe,
  tube,
  type Mesh
} from './geometry'
import { subtractSolid, subtractSolids } from './solid-subtraction'

/** Hollow open vessel with a continuous rim, inner wall and solid bottom. */
function vessel(radius: number, height: number, wall: number, base: number) {
  return lathe(
    [
      [0, 0],
      [radius * 0.88, 0],
      [radius * 0.94, 0.004],
      [radius, height - 0.003],
      [radius - 0.001, height],
      [radius - wall, height],
      [radius - wall, height - 0.003],
      [radius * 0.88 - wall, base],
      [0, base]
    ],
    64
  )
}

export function americanoGlass(
  glassColor = 0xffffff,
  coffeeColor = 0x332218
): AssetPart[] {
  // Split the actual shell at its thicker lip and base, without overlapping faces.
  const wall = emptyMesh()
  append(
    wall,
    lathe(
      [
        [0.032, 0.014],
        [0.045, 0.102]
      ],
      64
    )
  )
  append(
    wall,
    lathe(
      [
        [0.0426, 0.102],
        [0.0296, 0.014]
      ],
      64
    )
  )
  const glass = part('glass', wall, glassColor, 'plain', 0.08)
  glass.opacity = 1
  glass.optics = {
    transmission: 1,
    ior: 1.5,
    thickness: 0.0024,
    attenuationColor: 0xffffff,
    attenuationDistance: 1,
    captureLayer: 2
  }
  glass.environmentIntensity = 1
  const rim = part(
    'glass-rim',
    lathe(
      [
        [0.045, 0.102],
        [0.045, 0.103],
        [0.0442, 0.105],
        [0.0432, 0.105],
        [0.0426, 0.103],
        [0.0426, 0.102]
      ],
      64
    ),
    glassColor,
    'plain',
    0.08
  )
  rim.opacity = 1
  rim.optics = { ...glass.optics }
  rim.environmentIntensity = 0.4
  const base = part(
    'glass-base',
    lathe(
      [
        [0, 0],
        [0.026, 0],
        [0.028, 0.0006],
        [0.03, 0.0025],
        [0.0312, 0.005],
        [0.0317, 0.009],
        [0.032, 0.014],
        [0.0296, 0.014],
        [0, 0.014]
      ],
      64
    ),
    glassColor,
    'plain',
    0.08
  )
  base.opacity = 1
  base.optics = { ...glass.optics, thickness: 0.014 }
  base.environmentIntensity = 0.4
  const ice: AssetPart[] = []
  // Static floating ice: every solid crosses the liquid surface; smaller pieces fill the centre.
  const poses = [
    { p: [0.027, 0, 0.087], r: [12, -8, 17], s: [0.019, 0.02, 0.02] },
    { p: [0.008, 0.0247, 0.086], r: [-9, 11, 61], s: [0.02, 0.019, 0.021] },
    { p: [-0.021, 0.0153, 0.088], r: [8, 7, -23], s: [0.019, 0.021, 0.02] },
    { p: [-0.021, -0.0153, 0.086], r: [-12, -6, 38], s: [0.021, 0.019, 0.022] },
    { p: [0.008, -0.0247, 0.087], r: [9, -13, 85], s: [0.019, 0.02, 0.02] },
    { p: [-0.007, -0.001, 0.091], r: [18, 14, 29], s: [0.011, 0.01, 0.012] },
    { p: [0.007, 0.001, 0.0915], r: [-16, 9, -31], s: [0.01, 0.011, 0.012] }
  ]
  for (const [index, pose] of poses.entries()) {
    const mesh = emptyMesh()
    append(
      mesh,
      box(pose.s as [number, number, number], 0.003, 2),
      pose.p as [number, number, number],
      pose.r as [number, number, number]
    )
    const cube = part(`ice-${index}`, mesh, 0xffffff, 'plain', 0.04)
    cube.opacity = 1
    cube.optics = {
      transmission: 1,
      ior: 1.31,
      thickness: 0.02,
      attenuationColor: 0xffffff,
      attenuationDistance: 1,
      captureLayer: 0
    }
    cube.environmentIntensity = 0.5
    ice.push(cube)
  }
  // Remove displaced liquid, including real openings where ice crosses the surface.
  const liquid = subtractSolids(
    lathe(
      [
        [0, 0.015],
        [0.0293, 0.015],
        [0.0413, 0.096],
        [0, 0.096]
      ],
      64
    ),
    ice.map((cube) => cube.mesh)
  )
  const bodyMesh = emptyMesh(),
    surfaceMesh = emptyMesh(),
    interfaceMesh = emptyMesh()
  const vertices = new Map<Mesh, Map<number, number>>()
  for (const mesh of [bodyMesh, surfaceMesh, interfaceMesh]) {
    vertices.set(mesh, new Map())
  }
  for (let i = 0; i < liquid.indices.length; i += 3) {
    const ids = liquid.indices.slice(i, i + 3)
    let target = bodyMesh
    if (liquid.triangleRegions[i / 3] > 0) {
      target = interfaceMesh
    } else if (
      ids.every((id) => Math.abs(liquid.positions[id * 3 + 2] - 0.096) < 1e-8)
    ) {
      target = surfaceMesh
    }
    const mapping = vertices.get(target)
    if (!mapping) {
      throw new Error('Missing liquid region vertex map')
    }
    for (const id of ids) {
      let vertex = mapping.get(id)
      if (vertex === undefined) {
        vertex = target.positions.length / 3
        mapping.set(id, vertex)
        target.positions.push(...liquid.positions.slice(id * 3, id * 3 + 3))
        target.uvs.push(...liquid.uvs.slice(id * 2, id * 2 + 2))
      }
      target.indices.push(vertex)
    }
  }
  // Index-matched liquid/ice boundaries must not repaint the ice with coffee alpha.
  const contact = part(
    'coffee-ice-interface',
    interfaceMesh,
    coffeeColor,
    'plain',
    0.08
  )
  contact.opacity = 0
  const coffee = part('coffee', bodyMesh, 0xffffff, 'plain', 0.035)
  coffee.opacity = 1
  coffee.optics = {
    captureLayer: 1,
    transmission: 1,
    ior: 1.33,
    thickness: 0.055,
    attenuationColor: coffeeColor,
    attenuationDistance: 0.06
  }
  const surface = part('coffee-surface', surfaceMesh, 0xffffff, 'plain', 0.015)
  surface.opacity = 1
  surface.optics = {
    captureLayer: 1,
    transmission: 1,
    ior: 1.33,
    thickness: 0.075,
    attenuationColor: coffeeColor,
    attenuationDistance: 0.06
  }
  surface.environmentIntensity = 0.005
  return [glass, rim, base, coffee, surface, contact, ...ice]
}

export function sugarJar(
  color = 0xf5f1e7,
  lidPose: 'closed' | 'leaning' = 'leaning'
): AssetPart[] {
  const outer = [
    [0.032, 0],
    [0.041, 0.005],
    [0.051, 0.012],
    [0.056, 0.023],
    [0.054, 0.033],
    [0.048, 0.041],
    [0.045, 0.044]
  ]
  const body = lathe(
    [
      [0, 0],
      ...outer,
      [0.041, 0.044],
      [0.044, 0.038],
      [0.049, 0.03],
      [0.051, 0.023],
      [0.047, 0.015],
      [0.035, 0.006],
      [0, 0.006]
    ],
    64,
    true
  )
  const lid = lathe(
    [
      [0, 0.042],
      [0.04, 0.042],
      [0.04, 0.044],
      [0.046, 0.044],
      [0.047, 0.046],
      [0.044, 0.049],
      [0.01, 0.051],
      [0.008, 0.058],
      [0.005, 0.06],
      [0, 0.06]
    ],
    64,
    true
  )
  // A physical slot through the lip and seated lid admits the spoon handle.
  const slot = emptyMesh()
  append(slot, box([0.036, 0.01, 0.026]), [0.054, 0, 0.0505])
  const spoon = emptyMesh()
  const bowl = lathe(
    [
      [0, -0.003],
      [0.004, -0.0025],
      [0.008, -0.001],
      [0.01, 0.001],
      [0.0094, 0.0015],
      [0.0075, 0],
      [0.003, -0.0014],
      [0, -0.0015]
    ],
    32
  )
  append(spoon, bowl, [0.012, 0, 0.0315], [0, 0, 0], [1.5, 1, 1])
  append(
    spoon,
    tube(
      [
        [0.026, 0, 0.0325],
        [0.034, 0, 0.036],
        [0.05, 0, 0.044],
        [0.074, 0, 0.056],
        [0.095, 0, 0.065]
      ],
      [0.0015, 0.0015, 0.0017, 0.0019, 0.0022],
      12
    )
  )
  append(spoon, ellipsoid([0.004, 0.0028, 0.0014], 16, 8), [0.095, 0, 0.065])
  const utensil = part('teaspoon', spoon, 0xc5c9ca, 'metal', 0.16)
  utensil.metalness = 1
  utensil.environmentIntensity = 1
  const seatedLid = subtractSolid(lid, slot)
  const parts = [
    part('vessel', subtractSolid(body, slot), color, 'ceramic', 0.32),
    part(
      'lid',
      lidPose === 'closed' ? seatedLid : leanLid(seatedLid, outer),
      color,
      'ceramic',
      0.32
    ),
    utensil
  ]
  const layers = [
    [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 0],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1]
    ],
    [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1]
    ],
    [
      [-1, -1],
      [-1, 1]
    ]
  ]
  let cube = 0
  layers.forEach((layer, level) =>
    layer.forEach(([x, y]) => {
      // Frozen irregular placement: stable identities and no per-frame randomness.
      const index = cube++
      const yaw = ((index * 137.508 + 17) % 80) - 40
      parts.push(
        ...placeParts(
          [
            part(
              'sugar-cube-' + index,
              box([0.012, 0.012, 0.012], 0.001),
              0xfffaf0,
              'granulated',
              0.95
            )
          ],
          [
            x * 0.018 + Math.sin(index * 2.41) * 0.0004,
            y * 0.018 + Math.cos(index * 1.73) * 0.0004,
            0.012 + level * 0.012
          ],
          yaw
        )
      )
    })
  )
  return parts
}

export function handlelessCup(color = 0xe8dbc0): AssetPart[] {
  return [
    part('vessel', vessel(0.05, 0.085, 0.004, 0.006), color, 'ceramic', 0.38)
  ]
}

/** Place the same rigid lid on the table, tangent to the jar's front envelope. */
function leanLid(source: Mesh, outer: number[][]): Mesh {
  const result = emptyMesh()
  append(result, source, [0, 0, 0], [65, 0, 0])
  let minimumZ = Infinity
  for (let i = 2; i < result.positions.length; i += 3) {
    minimumZ = Math.min(minimumZ, result.positions[i])
  }
  for (let i = 2; i < result.positions.length; i += 3) {
    result.positions[i] -= minimumZ
  }
  const radiusAt = (z: number) => {
    for (let j = 1; j < outer.length; j++) {
      const [r0, z0] = outer[j - 1],
        [r1, z1] = outer[j]
      if (z >= z0 && z <= z1) {
        return r0 + ((r1 - r0) * (z - z0)) / (z1 - z0)
      }
    }
    return 0
  }
  let translationY = Infinity
  // Include triangle interiors, not just vertices, in the support envelope.
  for (let i = 0; i < result.indices.length; i += 3) {
    for (let a = 0; a <= 4; a++) {
      for (let b = 0; b <= 4 - a; b++) {
        const weights = [a / 4, b / 4, 1 - (a + b) / 4]
        const point = [0, 0, 0]
        weights.forEach((weight, corner) => {
          const vertex = result.indices[i + corner] * 3
          for (let axis = 0; axis < 3; axis++) {
            point[axis] += result.positions[vertex + axis] * weight
          }
        })
        const radius = radiusAt(point[2])
        if (radius > Math.abs(point[0])) {
          translationY = Math.min(
            translationY,
            -Math.sqrt(radius * radius - point[0] * point[0]) - point[1]
          )
        }
      }
    }
  }
  if (!Number.isFinite(translationY)) {
    throw new Error('Lid cannot reach sugar jar support')
  }
  for (let i = 1; i < result.positions.length; i += 3) {
    result.positions[i] += translationY - 0.00005
  }
  return result
}
