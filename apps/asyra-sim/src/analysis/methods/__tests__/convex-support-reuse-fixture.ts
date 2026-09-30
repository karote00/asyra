import { interval } from '../../../domain/interval'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import { IDENTITY_POSE, axisAngle } from '../../../domain/math'
import type { ConvexShape } from '../convex-query'

// Captured from the unchanged canonical owner at 5c87e0e; full evidence is hashed
// as binary64 bytes. Counts include point-only and strict interior operations.
export const supportBaseline = [
  [
    'triangle-one',
    '53c774894aaa004bfd91d4d9d8a2d23d6988606a9d9ff9df760cee42369f08eb',
    10,
    11,
    5,
    1,
    1,
    1
  ],
  [
    'triangle-two',
    '9cf2b8ac590fe2a9b6d3699dee9f462bac6ab2c877a27c8bdc7c915512b30afb',
    16,
    19,
    9,
    2,
    1,
    1
  ],
  [
    'triangle-four',
    'e4ceeb9b18e83606ea4e1f065a2fcc0a132fcceb5191dee6126654e4b71cd781',
    24,
    32,
    16,
    3,
    1,
    1
  ],
  [
    'triangle-early',
    'bb07cbeefdb6026fc046427448c655e8ac43db31251c0faee2cff2770659e3a5',
    6,
    8,
    4,
    0,
    1,
    1
  ],
  [
    'interval-triangle',
    '1f95f91ecac8b9f25bb6fcebf4956de71d9802db5464860697279a5ef6664ff7',
    28,
    35,
    17,
    4,
    1,
    1
  ],
  [
    'native',
    '2b1ccd50acdfc94c6daf0e99fec4b8b1a91804f61bb3886aff6bf4605d5b8607',
    28,
    8,
    17,
    4,
    0,
    1
  ],
  [
    'reverse',
    '44921d2536289115e1b474be62ef7e201794e4f87dfce4c183a9fee5498612d9',
    24,
    32,
    16,
    3,
    1,
    1
  ],
  [
    'touching-tie',
    '2b3328a41350122109d9e6675848fbf810b602405f78c7c22eda419221143510',
    50,
    500,
    3,
    1,
    2,
    0
  ],
  [
    'changed-pose',
    '54a5905e52141521b693dc064c9181e7f8a7731e5af6547e1bb7de443fea34d6',
    24,
    32,
    16,
    3,
    1,
    1
  ]
] as const
const ops = poseOperations(intervalAlgebra)
export function supportCases() {
  const triangle: ConvexShape = {
    geometry: {
      kind: 'triangle',
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0]
      ]
    },
    pose: ops.fromPose(IDENTITY_POSE)
  }
  const sphere: ConvexShape = {
    geometry: { kind: 'sphere', radius: 0.1 },
    pose: ops.fromPose({ ...IDENTITY_POSE, position: [0.9, 0.9, 0] })
  }
  const box: ConvexShape = {
    geometry: { kind: 'box', size: [2, 3, 4] },
    pose: ops.fromPose(IDENTITY_POSE)
  }
  const capsule: ConvexShape = {
    geometry: { kind: 'capsule', radius: 0.2, length: 1 },
    pose: ops.fromPose({
      position: [3, 2, 1],
      rotation: axisAngle([1, 2, 3], 0.7)
    })
  }
  const uncertain = {
    ...triangle,
    pose: {
      ...triangle.pose,
      position: [
        interval(-0.01, 0.01),
        interval(0),
        interval(0)
      ] as ConvexShape['pose']['position']
    }
  }
  return [
    {
      name: 'triangle-one',
      a: triangle,
      b: sphere,
      iterations: 1,
      tolerance: 1e-6
    },
    {
      name: 'triangle-two',
      a: triangle,
      b: sphere,
      iterations: 2,
      tolerance: 1e-6
    },
    {
      name: 'triangle-four',
      a: triangle,
      b: sphere,
      iterations: 4,
      tolerance: 1e-6
    },
    {
      name: 'triangle-early',
      a: triangle,
      b: sphere,
      iterations: 4,
      tolerance: 10
    },
    {
      name: 'interval-triangle',
      a: uncertain,
      b: sphere,
      iterations: 4,
      tolerance: 1e-6
    },
    { name: 'native', a: box, b: capsule, iterations: 4, tolerance: 1e-6 },
    { name: 'reverse', a: sphere, b: triangle, iterations: 4, tolerance: 1e-6 },
    {
      name: 'touching-tie',
      a: triangle,
      b: triangle,
      iterations: 4,
      tolerance: 1e-6
    },
    {
      name: 'changed-pose',
      a: triangle,
      b: { ...sphere, pose: capsule.pose },
      iterations: 4,
      tolerance: 1e-6
    }
  ]
}
