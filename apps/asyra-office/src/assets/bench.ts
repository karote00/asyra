import specification from '../../../../assets/asyra-office/models/outdoor-accents/outdoor-accents-model-spec.json'
import { part, placeParts, type AssetPart } from './catalog'
import {
  append,
  bezier,
  box,
  cylinder,
  emptyMesh,
  tube,
  vec,
  type Vec
} from './geometry'
import { requiredSpecValue } from './specification'

const source = requiredSpecValue(
  specification.modules.find((m) => m.moduleId === 'park-bench'),
  'park-bench'
)
function component<T>(id: string): T {
  return requiredSpecValue(
    source.components.find((c) => c.partId === id),
    id
  ) as T
}
/** Slats and swept frame use the current approved construction coordinates. */
export function bench(): AssetPart[] {
  const pieces: AssetPart[] = []
  const wood = parseInt(specification.materials.wood.baseColorSRGB.slice(1), 16)
  const metal = parseInt(
    specification.materials.metal.baseColorSRGB.slice(1),
    16
  )
  const addBox = (
    id: string,
    size: Vec,
    position: Vec,
    radius: number,
    rotation: Vec = [0, 0, 0],
    isWood = true
  ) => {
    const mesh = emptyMesh()
    append(mesh, box(size, radius), position, rotation)
    pieces.push(
      part(id, mesh, isWood ? wood : metal, isWood ? 'wood' : 'metal')
    )
  }
  const seat = component<{
    size: number[]
    centresY: number[]
    centreX: number
    centreZ: number
    bevel: number
  }>('seat-slats')
  seat.centresY.forEach((y, i) =>
    addBox(
      `seat-slat-${i}`,
      vec(seat.size),
      [seat.centreX, y, seat.centreZ],
      seat.bevel
    )
  )
  const back = component<{
    width: number
    normalThickness: number
    localHeight: number
    centresZ: number[]
    bevel: number
    inclinationDegrees: number
    rearPostSetbackY: number
  }>('back-slats')
  const angle = (back.inclinationDegrees * Math.PI) / 180
  back.centresZ.forEach((z, i) =>
    addBox(
      `back-slat-${i}`,
      [back.width, back.normalThickness, back.localHeight],
      [0, 0.18 + (z - 0.29) * Math.tan(angle) - back.rearPostSetbackY, z],
      back.bevel,
      [-back.inclinationDegrees, 0, 0]
    )
  )
  const rails = component<{
    instances: { size: number[]; centre: number[] }[]
    bevel: number
  }>('seat-crossrails')
  rails.instances.forEach((rail, i) =>
    addBox(
      `crossrail-${i}`,
      vec(rail.size),
      vec(rail.centre),
      rails.bevel,
      [0, 0, 0],
      false
    )
  )
  const supports = component<{
    centrelineEndpoints: number[][][]
    sizeWidthLengthHeight: number[]
    bevel: number
  }>('seat-supports')
  supports.centrelineEndpoints.forEach(([a, b], i) => {
    const rotation = (Math.atan2(-(b[0] - a[0]), b[1] - a[1]) * 180) / Math.PI
    addBox(
      `seat-support-${i}`,
      vec(supports.sizeWidthLengthHeight),
      vec(a.map((v, k) => (v + b[k]) / 2)),
      supports.bevel,
      [0, 0, rotation],
      false
    )
  })
  const fronts = component<{
    centresXY: number[][]
    radius: number
    zMin: number
    zMax: number
    radialSegments: number
  }>('front-legs')
  fronts.centresXY.forEach(([x, y], i) =>
    pieces.push(
      ...placeParts(
        [
          part(
            `front-leg-${i}`,
            cylinder(
              fronts.radius,
              fronts.zMax - fronts.zMin,
              fronts.radius,
              fronts.radialSegments
            ),
            metal,
            'metal'
          )
        ],
        [x, y, (fronts.zMin + fronts.zMax) / 2]
      )
    )
  )
  const rear = component<{
    xValues: number[]
    pathYZ: number[][]
    radius: number
    radialSegments: number
  }>('rear-posts')
  rear.xValues.forEach((x, i) =>
    pieces.push(
      part(
        `rear-post-${i}`,
        tube(
          rear.pathYZ.map(([y, z]) => [x, y, z]),
          rear.radius,
          rear.radialSegments
        ),
        metal,
        'metal'
      )
    )
  )
  const arms = component<{
    controlSegmentsRightXYZ: number[][][]
    pathIntervalsPerSegment: number
    radius: number
    radialSegments: number
  }>('arms')
  for (const side of [-1, 1]) {
    const path = arms.controlSegmentsRightXYZ.flatMap((points, i) =>
      bezier(
        points.map(([x, y, z]) => [side * x, y, z]),
        arms.pathIntervalsPerSegment
      ).slice(i ? 1 : 0)
    )
    pieces.push(
      part(
        `arm-${side}`,
        tube(path, arms.radius, arms.radialSegments),
        metal,
        'metal'
      )
    )
  }
  return placeParts(
    pieces,
    vec(
      requiredSpecValue(source.constructionToAssetTranslation, 'bench origin')
    )
  )
}
