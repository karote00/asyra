import specification from '../../../../assets/asyra-office/models/desk-items/desk-items-model-spec.json'
import {
  append,
  box,
  cylinder,
  ellipsoid,
  emptyMesh,
  lathe,
  tube,
  vec
} from './geometry'
import { part, placeParts, type AssetPart } from './catalog'
import { requiredSpecValue } from './specification'
const modules = specification.modules
export function mug(color = 0xeee8d9, filled = false): AssetPart[] {
  const source = requiredSpecValue(
    modules.find((m) => m.moduleId === 'ceramic-mug'),
    'mug'
  )
  const vessel = requiredSpecValue(
    source.components.find((c) => c.partId === 'vessel'),
    'vessel'
  ) as unknown as {
    radialSegments: number
    profile: {
      line?: number[][]
      arc?: {
        centre: number[]
        radius: number
        startDegrees: number
        endDegrees: number
        segments: number
      }
    }[]
  }
  const makeCup = (quality: number) => {
    const profile: number[][] = []
    for (const segment of vessel.profile) {
      const arc = segment.arc
      const steps = arc ? Math.max(2, Math.round(arc.segments * quality)) : 0
      const points = arc
        ? Array.from({ length: steps + 1 }, (_, i) => {
            const angle =
              ((arc.startDegrees +
                ((arc.endDegrees - arc.startDegrees) * i) / steps) *
                Math.PI) /
              180
            return [
              arc.centre[0] + arc.radius * Math.cos(angle),
              arc.centre[1] + arc.radius * Math.sin(angle)
            ]
          })
        : (segment.line ?? [])
      for (const point of points)
        if (
          !profile.length ||
          Math.hypot(
            point[0] - profile[profile.length - 1][0],
            point[1] - profile[profile.length - 1][1]
          ) > 1e-10
        )
          profile.push(point)
    }
    return lathe(profile, Math.round(vessel.radialSegments * quality))
  }
  const cup = part('cup', makeCup(1), color, 'ceramic')
  cup.distant = { mesh: makeCup(0.25), maxError: 0.0005 }
  const handle = tube(
    Array.from({ length: 49 }, (_, i) => {
      const t = ((90 - (i * 180) / 48) * Math.PI) / 180
      return [
        0.038 + 0.034 * Math.cos(t) - 0.005 * Math.min(0, Math.sin(t)) ** 2,
        0,
        0.049 + 0.028 * Math.sin(t)
      ]
    }),
    0.005,
    16
  )
  return [
    cup,
    part('handle', handle, color, 'ceramic'),
    ...(filled
      ? placeParts(
          [part('coffee', cylinder(0.034, 0.001), 0x493123)],
          [0, 0, 0.079]
        )
      : [])
  ]
}
export function laptop(): AssetPart[] {
  const lid = emptyMesh()
  append(lid, box([0.3, 0.006, 0.19], 0.002), [0, 0.1225, 0.1073], [-20, 0, 0])
  const p = [
    ...placeParts(
      [part('base', box([0.3, 0.21, 0.0105], 0.003), 0xbfc1c4, 'metal')],
      [0, 0, 0.00675]
    ),
    part('lid', lid, 0xbfc1c4, 'metal')
  ]
  for (let j = 0; j < 5; j++)
    for (let i = 0; i < 14; i++)
      p.push(
        ...placeParts(
          [part(`key-${i}-${j}`, box([0.015, 0.014, 0.001]), 0x303236)],
          [-0.117 + i * 0.018, 0.063 - j * 0.021, 0.0125]
        )
      )
  const source = requiredSpecValue(
    modules.find((m) => m.moduleId === 'laptop'),
    'laptop'
  )
  const bottom = requiredSpecValue(
    source.components.find((c) => c.partId === 'bottom-row'),
    'bottom row'
  ) as unknown as {
    rowY: number
    smallKeyCentresX: number[]
    smallKeySize: number[]
    spacebarCentreX: number
    spacebarSize: number[]
    centreZ: number
  }
  for (const [i, x] of bottom.smallKeyCentresX.entries())
    p.push(
      ...placeParts(
        [
          part(
            `key-bottom-${i}`,
            box(vec(bottom.smallKeySize), 0.0002),
            0x303236
          )
        ],
        [x, bottom.rowY, bottom.centreZ]
      )
    )
  p.push(
    ...placeParts(
      [part('spacebar', box(vec(bottom.spacebarSize), 0.0002), 0x303236)],
      [bottom.spacebarCentreX, bottom.rowY, bottom.centreZ]
    )
  )
  const hinge = emptyMesh()
  append(hinge, cylinder(0.003, 0.25, 0.003, 48), [0, 0.09, 0.015], [0, 90, 0])
  p.push(part('hinge', hinge, 0x303236))
  for (const c of source.components.filter((c) =>
    c.partId.startsWith('underside-pad-')
  )) {
    const pad = c as unknown as {
      partId: string
      size: number[]
      centre: number[]
    }
    p.push(
      ...placeParts(
        [part(pad.partId, box(vec(pad.size), 0.0004), 0x303236)],
        vec(pad.centre)
      )
    )
  }
  p.push(
    ...placeParts(
      [part('trackpad', box([0.126, 0.039, 0.0008]), 0xb1b3b7, 'metal')],
      [0, -0.078, 0.0125]
    )
  )
  const screen = emptyMesh()
  append(screen, box([0.276, 0.001, 0.157]), [0, 0.119, 0.106], [-20, 0, 0])
  p.push(part('screen', screen, 0x263747))
  const badge = emptyMesh()
  append(badge, ellipsoid([0.009, 0.001, 0.011], 12, 8), [0, 0.128, 0.114])
  p.push(part('emblem', badge, 0xf6f4ee))
  return p
}
