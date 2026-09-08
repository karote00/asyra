import { SITE, createLayout, type Point3 } from './greenhouse'

/** Placement is measured to the centreline of each tube, in metres. */
export const SUPPORT_LAYOUT = Object.freeze({
  diameter: 0.02,
  soilInset: 0.15,
  endInset: 0.25,
  spacing: 0.3,
  embedDepth: 0.15,
  wireDiameter: 0.0025
})

export interface SupportPosition {
  bay: number
  side: 'left' | 'right'
  row: number
  x: number
  z: number
}

export function createSupportPositions(): SupportPosition[] {
  const drains = createLayout().strips.filter((strip) => strip.kind === 'drain')
  const intervalCount = Math.floor(
    (SITE.length - 2 * SUPPORT_LAYOUT.endInset) / SUPPORT_LAYOUT.spacing
  )
  return drains.flatMap((drain, row) =>
    (['left', 'right'] as const).flatMap((side) => {
      const x =
        side === 'left'
          ? drain.x - SUPPORT_LAYOUT.soilInset
          : drain.x + drain.width + SUPPORT_LAYOUT.soilInset
      return Array.from({ length: intervalCount + 1 }, (_, index) => ({
        bay: drain.bay,
        side,
        row,
        x,
        // Index-based placement avoids accumulated floating-point drift at the far end.
        z: SUPPORT_LAYOUT.endInset + index * SUPPORT_LAYOUT.spacing
      }))
    })
  )
}

export function createSupportTubes(
  height: number = SITE.eave,
  embedDepth: number = SUPPORT_LAYOUT.embedDepth
) {
  if (
    !Number.isFinite(height) ||
    height <= 0 ||
    !Number.isFinite(embedDepth) ||
    embedDepth <= 0
  )
    throw new Error('Support height and embed depth must be positive metres')
  return createSupportPositions().map((position) => ({
    ...position,
    diameter: SUPPORT_LAYOUT.diameter,
    points: [
      [position.x, -embedDepth, position.z],
      [position.x, height, position.z]
    ] as const
  }))
}

export interface SpringClip {
  bay: number
  origin: Point3
  firstAxis: Point3
  secondAxis: Point3
  normal: Point3
  firstDiameter: number
  secondDiameter: number
}

/** Tangent crossed pipes: keep the upright centreline at the requested soil inset. */
export function createSupportAssembly() {
  const tubes = createSupportTubes()
  const rows = tubes.filter((tube) => tube.z === SUPPORT_LAYOUT.endInset)
  const railY = SITE.eave - (SITE.tubeDiameter + SUPPORT_LAYOUT.diameter) / 2
  const rails = rows.map((row) => {
    const direction = row.side === 'left' ? -1 : 1
    const x = row.x + direction * SUPPORT_LAYOUT.diameter
    return {
      bay: row.bay,
      diameter: SUPPORT_LAYOUT.diameter,
      points: [
        [x, railY, 0],
        [x, railY, SITE.length]
      ] as const
    }
  })
  const clips: SpringClip[] = tubes.map((tube) => ({
    bay: tube.bay,
    origin: [tube.x, railY, tube.z],
    firstAxis: [0, 1, 0],
    secondAxis: [0, 0, 1],
    normal: [tube.side === 'left' ? -1 : 1, 0, 0],
    firstDiameter: SUPPORT_LAYOUT.diameter,
    secondDiameter: SUPPORT_LAYOUT.diameter
  }))
  for (const rail of rails)
    for (let z = 0; z <= SITE.length; z += SITE.postSpacing)
      clips.push({
        bay: rail.bay,
        origin: [rail.points[0][0], railY, z],
        firstAxis: [0, 0, 1],
        secondAxis: [1, 0, 0],
        normal: [0, 1, 0],
        firstDiameter: SUPPORT_LAYOUT.diameter,
        secondDiameter: SITE.tubeDiameter
      })
  return { tubes, rails, clips }
}

/** Bent spring wire: two open hooks, parallel arms and one enclosing U saddle.
 * Visual sizing follows the supplied photograph; this is not a manufacturer CAD profile.
 * Local u/v are the two pipe axes, w is their tangent separation direction.
 */
export function springClipWire(clip: SpringClip) {
  const wireRadius = SUPPORT_LAYOUT.wireDiameter / 2
  const a = clip.firstDiameter / 2 + wireRadius
  const b = clip.secondDiameter / 2 + wireRadius
  const separation = (clip.firstDiameter + clip.secondDiameter) / 2
  const hook = (u: number): Point3[] =>
    Array.from({ length: 13 }, (_, i) => {
      const angle = -Math.PI / 3 + ((i / 12) * Math.PI * 4) / 3
      return [u, a * Math.cos(angle), a * Math.sin(angle)]
    })
  const saddle: Point3[] = Array.from({ length: 13 }, (_, i) => {
    const angle = Math.PI - (i / 12) * Math.PI
    return [b * Math.cos(angle), -2 * a, separation + b * Math.sin(angle)]
  })
  const local: Point3[] = [...hook(-b), ...saddle, ...hook(b).reverse()]
  return {
    diameter: SUPPORT_LAYOUT.wireDiameter,
    points: local.map(([u, v, w]): Point3 => [
      clip.origin[0] +
        u * clip.firstAxis[0] +
        v * clip.secondAxis[0] +
        w * clip.normal[0],
      clip.origin[1] +
        u * clip.firstAxis[1] +
        v * clip.secondAxis[1] +
        w * clip.normal[1],
      clip.origin[2] +
        u * clip.firstAxis[2] +
        v * clip.secondAxis[2] +
        w * clip.normal[2]
    ])
  }
}

/** A real upright/rail connection in the first row, used by the detail camera. */
export function supportJointTarget(): Point3 {
  const drain = createLayout().strips.find((strip) => strip.kind === 'drain')
  if (!drain) throw new Error('Support layout requires a drainage channel')
  return [
    drain.x - SUPPORT_LAYOUT.soilInset - SUPPORT_LAYOUT.diameter / 2,
    SITE.eave - (SITE.tubeDiameter + SUPPORT_LAYOUT.diameter) / 2,
    SUPPORT_LAYOUT.endInset
  ]
}
