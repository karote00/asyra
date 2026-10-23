import type { SourceRegion } from '../domain/source-occupancy'
import type { FarmConfiguration } from '../domain/farm-configuration'
import type { Point3 } from '../domain/greenhouse'
import { TriangleBuilder } from '../domain/mesh'
import {
  createSupportAssembly,
  springClipWire
} from '../domain/planting-supports'
import { createPlantingNet, NET_LAYOUT } from '../domain/planting-net'
import {
  readSpatialDescriptor,
  readSpatialInstances,
  type SpatialShape,
  type SpatialInstance
} from '../engine/spatial-contract'
import type { SpatialMesh } from './spatial-layer'
import type { SiteMesh, LayerId } from './site-projection'
import type { SiteGeometry } from './site-geometry'

function tieShape(radius: number) {
  const builder = new TriangleBuilder()
  const x = 0,
    y = 0,
    z = 0
  // A flat nylon band with thickness, locking head and short trimmed tail.
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12,
      b = ((i + 1) * Math.PI) / 12
    const point = (
      angle: number,
      radius: number,
      height: number
    ): readonly [number, number, number] => [
      x + radius * Math.cos(angle),
      height,
      z + radius * Math.sin(angle)
    ]
    const inner = radius,
      outer = inner + NET_LAYOUT.tieThickness
    const low = y - NET_LAYOUT.tieWidth / 2,
      high = y + NET_LAYOUT.tieWidth / 2
    builder.quad(
      point(a, outer, low),
      point(b, outer, low),
      point(b, outer, high),
      point(a, outer, high)
    )
    builder.quad(
      point(b, inner, low),
      point(a, inner, low),
      point(a, inner, high),
      point(b, inner, high)
    )
    builder.quad(
      point(a, inner, high),
      point(a, outer, high),
      point(b, outer, high),
      point(b, inner, high)
    )
    builder.quad(
      point(a, outer, low),
      point(a, inner, low),
      point(b, inner, low),
      point(b, outer, low)
    )
  }
  // The original trigonometric band seam is not welded.
  builder.region('open-shell', 0)
  builder.box([x + radius, y, z], [0.004, 0.006, 0.006])
  builder.box(
    [x + radius + 0.005, y, z],
    [0.01, NET_LAYOUT.tieWidth, NET_LAYOUT.tieThickness]
  )
  return { shape: builder.shape(), regions: builder.regions() }
}

/** Same canonical hardware, represented by shared local shapes and world origins. */
export function buildCultivationMeshes(
  config: FarmConfiguration,
  geometry: SiteGeometry
): SiteMesh[] {
  const groups = new Map<
    string,
    {
      layer: LayerId
      color: number
      shape: SpatialShape
      regions: readonly SourceRegion[]
      instances: SpatialInstance[]
    }
  >()
  const add = (
    key: string,
    layer: LayerId,
    color: number,
    position: Point3,
    produce: () => { shape: SpatialShape; regions: readonly SourceRegion[] }
  ) => {
    let group = groups.get(key)
    if (!group) {
      group = {
        layer,
        color,
        ...geometry.primitive(key, produce),
        instances: []
      }
      groups.set(key, group)
    }
    group.instances.push({ position, yaw: 0 })
  }
  const tube = (
    member: { points: readonly Point3[]; diameter: number },
    layer: LayerId,
    color: number
  ) => {
    const a = member.points[0],
      b = member.points[1]
    const delta: Point3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
    const key = `${layer}:${member.diameter}:${delta.join(',')}`
    add(key, layer, color, a, () => {
      const builder = new TriangleBuilder()
      builder.tube({ points: [[0, 0, 0], delta], diameter: member.diameter })
      return { shape: builder.shape(), regions: builder.regions() }
    })
  }
  const assembly = createSupportAssembly(config)
  for (const member of [...assembly.tubes, ...assembly.rails])
    tube(member, 'supports', 0x8a9c9b)
  const net = createPlantingNet(assembly, config)
  for (const strand of net.strands) tube(strand, 'net', 0xe5e8ce)
  for (const tie of net.ties)
    add(`tie:${tie.radius}`, 'ties', 0x26322b, tie.center, () =>
      tieShape(tie.radius)
    )
  for (const clip of assembly.clips) {
    const key = `clip:${JSON.stringify([clip.firstAxis, clip.secondAxis, clip.normal, clip.firstDiameter, clip.secondDiameter])}`
    add(key, 'clips', 0xb4bfbe, clip.origin, () => {
      const builder = new TriangleBuilder()
      builder.tube(springClipWire({ ...clip, origin: [0, 0, 0] }))
      return { shape: builder.shape(), regions: builder.regions() }
    })
  }
  const result: SiteMesh[] = []
  const counts = new Map<LayerId, number>()
  for (const group of groups.values()) {
    for (let start = 0; start < group.instances.length; start += 60000) {
      const index = counts.get(group.layer) ?? 0
      counts.set(group.layer, index + 1)
      result.push({
        id:
          group.layer === 'supports' && index === 0
            ? 'supports'
            : `${group.layer}-${index}`,
        layer: group.layer,
        regions: group.regions,
        visible: true,
        descriptor: readSpatialDescriptor({
          kind: 'mesh',
          position: [0, 0, 0],
          rotation: [0, 0, 0, 1],
          shape: group.shape,
          instances: readSpatialInstances(
            group.instances.slice(start, start + 60000)
          ),
          color: group.color,
          opacity: 1,
          wireframe: false,
          selectable: false
        }) as SpatialMesh
      })
    }
  }
  return result
}
