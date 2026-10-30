import { part, placeParts, type AssetPart } from '../assets/catalog'
import type { GeometryInstance } from '../assets/instances'
import {
  append,
  box,
  emptyMesh,
  lathe,
  tube,
  type Vec
} from '../assets/geometry'

/** A connected conifer spray: fine closed needles grow from paired side twigs. */
function coniferSpray() {
  const leaves = emptyMesh(),
    stems = emptyMesh()
  const needle = {
    positions: [
      0, 0, 0, 0.018, 0, 0, 0.007, 0.0036, 0, 0.007, 0, 0.0022, 0.007, -0.0036,
      0, 0.007, 0, -0.0022
    ],
    indices: [
      0, 3, 2, 0, 4, 3, 0, 5, 4, 0, 2, 5, 1, 2, 3, 1, 3, 4, 1, 4, 5, 1, 5, 2
    ],
    uvs: [0, 0.5, 1, 0.5, 0.4, 1, 0.4, 0.5, 0.4, 0, 0.4, 0.5]
  }
  append(
    stems,
    tube(
      [
        [0, 0, 0],
        [0.12, 0, 0.005]
      ],
      [0.0012, 0.0003],
      5
    )
  )
  for (let node = 0; node < 6; node++) {
    const x = 0.012 + node * 0.017,
      reach = 0.028 * (1 - node * 0.1)
    for (const side of [-1, 1]) {
      const start: Vec = [x, 0, x * 0.04],
        end: Vec = [x + 0.022, side * reach, 0.007]
      append(stems, tube([start, end], [0.0007, 0.00025], 5))
      for (let rank = 0; rank < 3; rank++) {
        const t = (rank + 0.4) / 3,
          origin: Vec = start.map((n, axis) => n + (end[axis] - n) * t) as Vec
        for (const fork of [-1, 1]) {
          const direction: Vec = [
            0.7,
            side * 0.6 + fork * 0.45,
            0.15 + rank * 0.08
          ]
          appendAlong(leaves, needle, origin, direction, 0.75 + rank * 0.09)
        }
      }
      appendAlong(leaves, needle, end, [0.7, side * 0.7, 0.15], 0.8)
    }
  }
  appendAlong(leaves, needle, [0.115, 0, 0.005], [1, 0, 0.15], 0.8)
  return { leaves, stems }
}

function appendAlong(
  target: ReturnType<typeof emptyMesh>,
  source: ReturnType<typeof emptyMesh>,
  position: Vec,
  direction: Vec,
  scale: number
) {
  const yaw = (Math.atan2(direction[1], direction[0]) * 180) / Math.PI
  const pitch =
    (-Math.atan2(direction[2], Math.hypot(direction[0], direction[1])) * 180) /
    Math.PI
  append(target, source, position, [0, pitch, yaw], [scale, scale, scale])
}

export interface DiscussionConiferSize {
  height: number
  crownRadius: number
  potDiameter: number
  potHeight: number
}
export const DISCUSSION_CONIFER_SIZES = {
  reference: {
    height: 1.2,
    crownRadius: 0.44,
    potDiameter: 0.26,
    potHeight: 0.22
  },
  floor: {
    height: 2.26,
    crownRadius: 0.33,
    potDiameter: 0.28,
    potHeight: 0.24
  },
  console: {
    height: 0.8588,
    crownRadius: 0.125,
    potDiameter: 0.1064,
    potHeight: 0.0912
  }
} as const

/** Resolve branch lengths first; attach undeformed foliage to their centerlines. */
export function discussionTree(
  dimensions: DiscussionConiferSize,
  seed: number
): AssetPart[] {
  const { height, crownRadius, potDiameter, potHeight } = dimensions
  if (
    Object.values(dimensions).some((n) => !Number.isFinite(n) || n <= 0) ||
    height <= potHeight
  ) {
    throw new Error('Invalid discussion conifer dimensions')
  }
  const stems = emptyMesh(),
    groups: GeometryInstance[][] = [[], [], []],
    prototype = coniferSpray()
  const foliageScale = crownRadius / 0.44
  const branchHeight = (height - potHeight) / 0.98
  const branchCount = Math.ceil(96 * Math.max(1, branchHeight / foliageScale))
  const coreCount = Math.ceil(36 * Math.max(1, branchHeight / foliageScale))
  const branchZ = (z: number) => potHeight + (z - 0.22) * branchHeight
  const twigs: GeometryInstance[] = []
  const variation = (i: number) => (Math.sin(i * 91.73 + seed * 17.17) + 1) / 2
  append(
    stems,
    tube(
      [
        [0, 0, potHeight * 0.55],
        [0, 0, height - 0.04 * foliageScale]
      ],
      [potDiameter * 0.046, 0.001 * foliageScale],
      8
    )
  )
  const spray = (origin: Vec, direction: Vec, size: number, tint: number) => {
    const length = Math.hypot(...direction)
    const x = direction.map((n) => n / length) as Vec
    const yaw = Math.atan2(x[1], x[0])
    const y: Vec = [-Math.sin(yaw), Math.cos(yaw), 0]
    const z: Vec = [
      -x[2] * Math.cos(yaw),
      -x[2] * Math.sin(yaw),
      Math.hypot(x[0], x[1])
    ]
    const roll = (variation(twigs.length + 907) - 0.5) * 2.1
    const turnedY = y.map(
      (n, axis) => n * Math.cos(roll) + z[axis] * Math.sin(roll)
    ) as Vec
    const turnedZ = z.map(
      (n, axis) => n * Math.cos(roll) - y[axis] * Math.sin(roll)
    ) as Vec
    const instance: GeometryInstance = {
      id: 'spray-' + twigs.length,
      position: origin,
      basis: [x, turnedY, turnedZ],
      scale: size * foliageScale
    }
    twigs.push(instance)
    groups[tint].push(instance)
  }
  for (let branch = 0; branch < branchCount; branch++) {
    const t = branch / (branchCount - 1),
      z = 0.245 + t * 0.765 + (variation(branch + 309) - 0.5) * 0.045,
      angle = branch * 2.39996 + variation(branch) * 1.1,
      reach =
        (0.315 * (1 - t) ** 0.76 + 0.012) *
        (0.83 + 0.17 * variation(branch + 71)) *
        foliageScale,
      rise = -0.035 + 0.11 * t + 0.085 * variation(branch + 109),
      radial: Vec = [Math.cos(angle), Math.sin(angle), 0],
      tangent: Vec = [-Math.sin(angle), Math.cos(angle), 0]
    const path = (u: number): Vec => [
      radial[0] * reach * u,
      radial[1] * reach * u,
      branchZ(z + rise * u * u)
    ]
    const stations = [
      0,
      ...Array.from({ length: 5 }, (_, rank) => 0.17 + rank * 0.18),
      1
    ]
    append(
      stems,
      tube(
        stations.map(path),
        stations.map(
          (u) =>
            ((0.004 * (1 - t) + 0.001) * (1 - u) + 0.0008 * u) * foliageScale
        ),
        6
      )
    )
    for (let rank = 0; rank < 5; rank++) {
      const u = 0.17 + rank * 0.18
      for (const side of [-1, 1]) {
        const direction: Vec = [
            radial[0] * 0.75 + tangent[0] * side * 0.65,
            radial[1] * 0.75 + tangent[1] * side * 0.65,
            -0.15 + t * 0.65 + variation(branch * 17 + rank + side) * 0.7
          ],
          size =
            (1.16 - t * 0.64) *
            (0.8 + 0.2 * variation(branch * 13 + rank * 2 + side))
        spray(path(u), direction, size, (branch + rank + (side + 1) / 2) % 3)
      }
    }
    spray(path(1), [radial[0], radial[1], -0.05 + t * 0.8], 0.9 - t * 0.5, 2)
  }
  // Upright foliage covers the leader and the core between outward branches.
  for (let i = 0; i < coreCount; i++) {
    const t = i / (coreCount - 1),
      angle = i * 2.39996,
      origin: Vec = [
        0.012 * foliageScale * Math.cos(angle),
        0.012 * foliageScale * Math.sin(angle),
        potHeight +
          0.05 * foliageScale +
          t * (height - potHeight - 0.125 * foliageScale)
      ]
    spray(
      origin,
      [Math.cos(angle) * 0.4, Math.sin(angle) * 0.4, 1],
      0.85 - t * 0.25,
      i % 3
    )
  }
  const parts = [
    part(
      'pot',
      lathe(
        [
          [0, 0],
          [0.085, 0],
          [0.091, 0.012],
          [0.13, 0.21],
          [0.13, 0.22],
          [0.12, 0.22],
          [0.079, 0.02],
          [0, 0.02]
        ],
        40
      ),
      0x393638,
      'ceramic',
      0.8
    ),
    part(
      'soil',
      lathe(
        [
          [0, 0.195],
          [0.115, 0.195],
          [0.115, 0.2],
          [0, 0.2]
        ],
        32
      ),
      0x3f3428,
      'plain'
    )
  ]
  return [
    ...placeParts(parts, [0, 0, 0], 0, [
      potDiameter / 0.26,
      potDiameter / 0.26,
      potHeight / 0.22
    ]),
    part('stems', stems, 0x4d5935, 'leaf'),
    {
      ...part('sprig-stems', prototype.stems, 0x4d5935, 'leaf'),
      instances: twigs
    },
    ...groups.map((instances, i) => ({
      ...part(
        'leaves-' + i,
        prototype.leaves,
        [0x536b36, 0x718344, 0x8b9b50][i],
        'leaf'
      ),
      instances
    }))
  ]
}

/** Frosted rectangular fragrance bottle with a seated champagne-metal cap. */
export function discussionPerfume(): AssetPart[] {
  return [
    ...placeParts(
      [
        part('bottle', box([0.1, 0.075, 0.165], 0.012), 0xece5d8, 'plain', 0.32)
      ],
      [0, 0, 0.0825]
    ),
    part(
      'shoulder-neck',
      lathe(
        [
          [0, 0.155],
          [0.035, 0.155],
          [0.035, 0.162],
          [0.019, 0.178],
          [0.014, 0.182],
          [0.014, 0.2],
          [0, 0.2]
        ],
        32
      ),
      0xece5d8,
      'plain',
      0.32
    ),
    ...placeParts(
      [
        {
          ...part(
            'cap',
            box([0.033, 0.028, 0.042], 0.003),
            0xb79a61,
            'metal',
            0.28
          ),
          metalness: 0.75
        }
      ],
      [0, 0, 0.209]
    ),
    ...placeParts(
      [part('label', box([0.062, 0.001, 0.052], 0.001), 0xdcd1c0, 'plain')],
      [0, -0.0375, 0.08]
    )
  ]
}

/** An open side table with one basket on the left, a closed cabinet on the right. */
export function discussionStorage(closed: boolean): AssetPart[] {
  const w = 0.56,
    d = 0.34,
    h = 0.55,
    t = 0.025
  const parts: AssetPart[] = []
  const panel = (id: string, size: Vec, position: Vec, color = 0xb49164) =>
    parts.push(
      ...placeParts([part(id, box(size, 0.003), color, 'wood')], position)
    )
  panel('top', [w, d, t], [0, 0, h - t / 2])
  if (closed) {
    panel('base', [w - t * 2, d - t, t], [0, 0, 0.035])
    panel('back', [w - t * 2, t, h - t], [0, (d - t) / 2, (h - t) / 2])
    for (const side of [-1, 1]) {
      panel(
        'side-' + side,
        [t, d, h - t],
        [(side * (w - t)) / 2, 0, (h - t) / 2]
      )
    }
    panel(
      'door-inset',
      [w - 0.09, 0.014, h - 0.12],
      [0, -d / 2 + 0.012, h / 2],
      0xb59774
    )
    for (const side of [-1, 1]) {
      panel(
        'door-stile-' + side,
        [0.035, 0.025, h - 0.04],
        [side * (w / 2 - 0.0425), -d / 2, h / 2]
      )
      panel(
        'door-rail-' + side,
        [w - 0.12, 0.025, 0.035],
        [0, -d / 2, h / 2 + side * (h / 2 - 0.0375)]
      )
    }
  } else {
    for (const x of [-1, 1]) {
      for (const y of [-1, 1]) {
        panel(
          `leg-${x}-${y}`,
          [0.03, 0.03, h - t],
          [x * 0.24, y * 0.13, (h - t) / 2],
          0x705739
        )
      }
    }
    // One open rectangular fabric basket stands on the floor between the legs.
    const basket = emptyMesh()
    append(basket, box([0.3, 0.23, 0.012], 0.003), [0, 0, 0.006])
    for (const side of [-1, 1]) {
      append(basket, box([0.012, 0.23, 0.378], 0.003), [side * 0.144, 0, 0.201])
      append(basket, box([0.276, 0.012, 0.378], 0.003), [
        0,
        side * 0.109,
        0.201
      ])
    }
    parts.push(part('basket', basket, 0xd4c6b0, 'fabric'))
    const vessel = lathe(
      [
        [0, 0],
        [0.075, 0],
        [0.084, 0.015],
        [0.108, 0.14],
        [0.108, 0.15],
        [0.098, 0.15],
        [0.098, 0.14],
        [0.075, 0.022],
        [0, 0.022]
      ],
      48
    )
    parts.push(
      ...placeParts(
        [part('empty-vessel', vessel, 0x89868b, 'ceramic')],
        [0, -0.015, h]
      )
    )
  }
  return parts
}
