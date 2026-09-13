// Test-owned cost experiment only. No runtime consumer or persistent cache.
import type { GeometrySource, GeometryMesh, GeometryBounds } from '../geometry'
import type { SourceRegion } from '../../domain/source-occupancy'
import type { SurfaceCoverageBatch, SurfaceBatch } from '../collision'
import { evaluateRobotPose } from '../../domain/robot-kinematics'
import { interval, add, type Interval } from '../query-arithmetic'
import {
  prepareQueryForwardFrame,
  prepareQueryInstanceFrame,
  transformQueryPoint
} from '../ray-query'
import type { Point3 } from '../../domain/greenhouse'

type SurfaceReference = SurfaceBatch['pairs'][number]['first']

interface Node {
  bounds: GeometryBounds
  count: number
  region: SourceRegion
  children?: readonly [Node, Node]
  triangles?: readonly number[]
}
interface Triangle {
  ordinal: number
  bounds: GeometryBounds
}
const limit = (value: number, maximum: number) => {
  if (!Number.isSafeInteger(value) || value > maximum)
    throw new Error('Hierarchy experiment guard exceeded')
}
const elapsed = (started: number) => {
  if (performance.now() - started > 10000)
    throw new Error('Hierarchy experiment time guard exceeded')
}
const union = (bounds: readonly GeometryBounds[]): GeometryBounds => {
  const min: [number, number, number] = [Infinity, Infinity, Infinity],
    max: [number, number, number] = [-Infinity, -Infinity, -Infinity]
  for (const box of bounds)
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], box.min[axis])
      max[axis] = Math.max(max[axis], box.max[axis])
    }
  return Object.freeze({ min: Object.freeze(min), max: Object.freeze(max) })
}
const separated = (a: GeometryBounds, b: GeometryBounds) =>
  a.min.some((value, axis) => value > b.max[axis] || a.max[axis] < b.min[axis])
export function prepareHierarchy(source: GeometrySource) {
  const started = performance.now(),
    shapes = new Set<GeometryMesh['shape']>(),
    mappings = new Map<
      GeometryMesh['shape'],
      Map<readonly SourceRegion[], readonly Node[]>
    >()
  const work = {
    shapes: 0,
    mappings: 0,
    uniqueTriangles: 0,
    regions: 0,
    builtTriangles: 0,
    vertices: 0,
    nodes: 0,
    leafReferences: 0
  }
  for (const mesh of source.meshes) {
    elapsed(started)
    const shape = mesh.shape
    if (shape.kind !== 'triangles') throw new Error('Expected triangle source')
    if (!shapes.has(shape)) {
      shapes.add(shape)
      work.shapes++
      work.uniqueTriangles += shape.indices.length / 3
      limit(work.uniqueTriangles, 1000000)
    }
  }
  const build = (items: Triangle[], region: SourceRegion): Node => {
    elapsed(started)
    limit(++work.nodes, 300000)
    const bounds = union(items.map((item) => item.bounds))
    if (items.length <= 8) {
      work.leafReferences += items.length
      return Object.freeze({
        bounds,
        region,
        count: items.length,
        triangles: Object.freeze(items.map((item) => item.ordinal))
      })
    }
    let axis = 0
    for (let next = 1; next < 3; next++)
      if (
        bounds.max[next] - bounds.min[next] >
        bounds.max[axis] - bounds.min[axis]
      )
        axis = next
    const center = (item: Triangle) =>
      item.bounds.min[axis] / 2 + item.bounds.max[axis] / 2
    items.sort((a, b) => center(a) - center(b) || a.ordinal - b.ordinal)
    const middle = Math.floor(items.length / 2)
    return Object.freeze({
      bounds,
      region,
      count: items.length,
      children: Object.freeze([
        build(items.slice(0, middle), region),
        build(items.slice(middle), region)
      ] as const)
    })
  }
  for (const mesh of source.meshes) {
    elapsed(started)
    const shape = mesh.shape
    if (shape.kind !== 'triangles') throw new Error('Expected triangles')
    let mapped = mappings.get(shape)
    if (!mapped) {
      mapped = new Map()
      mappings.set(shape, mapped)
    }
    if (mapped.has(mesh.origin.regions)) continue
    work.mappings++
    const roots = mesh.origin.regions.map((region) => {
      work.regions++
      const items: Triangle[] = []
      for (
        let offset = region.indexStart;
        offset < region.indexStart + region.indexCount;
        offset += 3
      ) {
        if (work.builtTriangles % 256 === 0) elapsed(started)
        limit(++work.builtTriangles, 1000000)
        const points: GeometryBounds[] = []
        for (let corner = 0; corner < 3; corner++) {
          const index = shape.indices[offset + corner] * 3,
            point = [
              shape.positions[index],
              shape.positions[index + 1],
              shape.positions[index + 2]
            ] as Point3
          if (!point.every(Number.isFinite))
            throw new Error('Nonfinite original vertex')
          work.vertices++
          points.push({ min: point, max: point })
        }
        items.push({ ordinal: offset / 3, bounds: union(points) })
      }
      return build(items, region)
    })
    mapped.set(mesh.origin.regions, Object.freeze(roots))
  }
  return Object.freeze({
    source,
    work: Object.freeze(work),
    milliseconds: performance.now() - started,
    // Payload accounting, not a claim about JS heap overhead.
    payloadBytes: work.nodes * 8 * 8 + work.leafReferences * 8,
    roots: (mesh: GeometryMesh) => {
      const roots = mappings.get(mesh.shape)?.get(mesh.origin.regions)
      if (!roots || !source.meshes.includes(mesh))
        throw new Error('Foreign source mapping')
      return roots
    }
  })
}
export function queryHierarchy(
  tree: ReturnType<typeof prepareHierarchy>,
  input: SurfaceCoverageBatch,
  capture = false
) {
  const started = performance.now(),
    source = tree.source,
    state = input.robot,
    rig = source.receipt.robot.rig
  if (!state || !rig) throw new Error('Expected admitted test pose')
  elapsed(started)
  const pose = evaluateRobotPose(rig, state.joints),
    bodies = new Map(pose.parts.map((part) => [part.source, part.transform]))
  const work = {
    fk: 1,
    corners: 0,
    nodePairs: 0,
    meshPairs: 0,
    excluded: 0,
    candidates: 0,
    unvisited: 0,
    total: 0
  }
  const candidates: { first: SurfaceReference; second: SurfaceReference }[] = []
  const placements = source.meshes.flatMap((mesh, meshIndex) =>
    Array.from(
      { length: mesh.descriptor?.instances?.length ?? 1 },
      (_, instance) => {
        if (instance % 256 === 0) elapsed(started)
        const frames: ReturnType<typeof prepareQueryForwardFrame>[] = [],
          placement = mesh.descriptor?.instances?.[instance]
        if (placement) frames.push(prepareQueryInstanceFrame(placement))
        if (mesh.kind === 'robot') {
          const body = bodies.get(
            mesh.origin as (typeof pose.parts)[number]['source']
          )
          if (!body) throw new Error('Missing source body')
          frames.push(
            prepareQueryForwardFrame(body),
            prepareQueryForwardFrame(state.base)
          )
        } else {
          if (!mesh.descriptor) throw new Error('Missing placement')
          frames.push(prepareQueryForwardFrame(mesh.descriptor))
        }
        const displacement =
          mesh.kind === 'robot' ? input.displacement : [0, 0, 0]
        const transform = (local: GeometryBounds) => {
          const corners: GeometryBounds[] = []
          for (let mask = 0; mask < 8; mask++) {
            let point: readonly [Interval, Interval, Interval] = [
              interval(mask & 1 ? local.max[0] : local.min[0]),
              interval(mask & 2 ? local.max[1] : local.min[1]),
              interval(mask & 4 ? local.max[2] : local.min[2])
            ]
            for (const frame of frames)
              point = transformQueryPoint(frame, point)
            work.corners++
            const min = point.map(
              (value, axis) =>
                add(
                  interval(value.low),
                  interval(Math.min(0, displacement[axis]))
                ).low
            ) as unknown as Point3
            const max = point.map(
              (value, axis) =>
                add(
                  interval(value.high),
                  interval(Math.max(0, displacement[axis]))
                ).high
            ) as unknown as Point3
            corners.push({ min, max })
          }
          return union(corners)
        }
        const completed = new Map<Node, GeometryBounds>(),
          roots = tree.roots(mesh)
        return {
          mesh,
          meshIndex,
          instance,
          roots,
          count: roots.reduce((sum, node) => sum + node.count, 0),
          bounds: transform(mesh.prepared.bounds),
          nodeBounds: (node: Node) => {
            let value = completed.get(node)
            if (!value) {
              value = transform(node.bounds)
              completed.set(node, value)
            }
            return value
          }
        }
      }
    )
  )
  type Placement = (typeof placements)[number]
  const compare = (first: Placement, second: Placement) => {
    if (work.meshPairs % 256 === 0) elapsed(started)
    work.meshPairs++
    work.total += first.count * second.count
    limit(work.total, Number.MAX_SAFE_INTEGER)
    if (separated(first.bounds, second.bounds)) {
      work.excluded += first.count * second.count
      return
    }
    for (const a of first.roots)
      for (const b of second.roots) {
        const stack: [Node, Node][] = [[a, b]]
        while (stack.length) {
          if (work.nodePairs % 256 === 0) elapsed(started)
          const pair = stack.pop()
          if (!pair) throw new Error('Missing pending pair')
          const [left, right] = pair,
            count = left.count * right.count
          if (work.nodePairs >= 500000) {
            elapsed(started)
            work.unvisited += count
            continue
          }
          work.nodePairs++
          if (separated(first.nodeBounds(left), second.nodeBounds(right))) {
            work.excluded += count
            continue
          }
          if (left.children && (!right.children || left.count >= right.count)) {
            stack.push([left.children[1], right], [left.children[0], right])
            continue
          }
          if (right.children) {
            stack.push([left, right.children[1]], [left, right.children[0]])
            continue
          }
          work.candidates += count
          if (capture)
            for (const x of left.triangles ?? [])
              for (const y of right.triangles ?? [])
                candidates.push({
                  first: {
                    mesh: first.meshIndex,
                    instance: first.instance,
                    triangle: x
                  },
                  second: {
                    mesh: second.meshIndex,
                    instance: second.instance,
                    triangle: y
                  }
                })
        }
      }
  }
  const robots = placements.filter((item) => item.mesh.kind === 'robot'),
    environment = placements.filter((item) => item.mesh.kind !== 'robot')
  for (let index = 0; index < robots.length; index++) {
    for (const item of environment) compare(robots[index], item)
    for (let other = index + 1; other < robots.length; other++)
      compare(robots[index], robots[other])
  }
  return { work, candidates, milliseconds: performance.now() - started }
}
