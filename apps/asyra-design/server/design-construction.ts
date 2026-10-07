import { createDesignSourceWork, sourcePathCommandCount } from './design-budget'
import { randomUUID } from 'node:crypto'
import { isDesignFill } from '../src/ai/design-fill'
import { DesignPreparationLimits as limits } from '../src/ai/prepared-design'

export type LayoutProperty = 'x' | 'y' | 'width' | 'height'
export interface DesignBrief {
  intent: string
  viewpoint: string
  sources: string[]
  assumptions: string[]
  checks: {
    key: string
    property: LayoutProperty
    expected: number
    tolerance: number
  }[]
}
type Node = Record<string, unknown>
export class DesignKeyConflictError extends Error {
  constructor(readonly conflicts: { key: string; paths: string[] }[]) {
    super(
      'Invalid design construction: duplicate keys. Replace the conflicting source keys at the reported paths.'
    )
    this.name = 'DesignKeyConflictError'
  }
}
interface Point3 {
  x: number
  y: number
  z: number
}
interface Relation {
  target: string
  property: LayoutProperty
  source: string
  sourceProperty: string
  factor: number
  offset: number
  targetAnchor: number
}
const record = (v: unknown): v is Node =>
  !!v && typeof v === 'object' && !Array.isArray(v)
const fail = (message: string): never => {
  throw new Error(`Invalid design construction: ${message}`)
}
const fields = (v: Node, allowed: string[], context: string) => {
  if (Object.keys(v).some((k) => !allowed.includes(k))) fail(`${context} field`)
}
const number = (
  v: unknown,
  context: string,
  min = -limits.dimension,
  max: number = limits.dimension
): number => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max)
    return fail(context)
  return v
}
const label = (v: unknown, context: string, max = 500): string => {
  if (typeof v !== 'string' || !v.trim() || v.length > max) return fail(context)
  return v
}
const properties = ['x', 'y', 'width', 'height']
const sourceProperties = [
  ...properties,
  'right',
  'bottom',
  'centerX',
  'centerY'
]
const readBrief = (value: unknown): DesignBrief | undefined => {
  if (value === undefined) return
  if (!record(value)) return fail('brief')
  fields(
    value,
    ['intent', 'viewpoint', 'sources', 'assumptions', 'checks'],
    'brief'
  )
  const notes = (v: unknown): string[] => {
    if (!Array.isArray(v) || v.length > 16) return fail('brief notes')
    return v.map((s) => label(s, 'brief note'))
  }
  if (!Array.isArray(value.checks) || value.checks.length > limits.checks)
    return fail('brief checks')
  return {
    intent: label(value.intent, 'intent'),
    viewpoint: label(value.viewpoint, 'viewpoint'),
    sources: notes(value.sources),
    assumptions: notes(value.assumptions),
    checks: value.checks.map((c) => {
      if (!record(c)) return fail('check')
      fields(c, ['key', 'property', 'expected', 'tolerance'], 'check')
      if (!properties.includes(String(c.property)))
        return fail('check property')
      return {
        key: label(c.key, 'check key', 160),
        property: c.property as LayoutProperty,
        expected: number(c.expected, 'check expected', 0),
        tolerance: number(c.tolerance, 'check tolerance', 0)
      }
    })
  }
}

// Shared camera is resolved once; all explicit faces use this same projection.
const camera = (value: unknown) => {
  if (value === undefined) return
  if (!record(value)) return fail('projection')
  fields(
    value,
    ['azimuth', 'elevation', 'scale', 'originX', 'originY'],
    'projection'
  )
  const az = (number(value.azimuth, 'azimuth', -360, 360) * Math.PI) / 180
  const el = (number(value.elevation, 'elevation', -90, 90) * Math.PI) / 180
  const scale = number(value.scale, 'projection scale', Number.MIN_VALUE)
  const ox = number(value.originX, 'projection originX', 0)
  const oy = number(value.originY, 'projection originY', 0)
  const ca = Math.cos(az),
    sa = Math.sin(az),
    ce = Math.cos(el),
    se = Math.sin(el)
  return (p: Point3) => ({
    x: ox + scale * (ca * p.x - sa * p.y),
    y: oy + scale * (se * (sa * p.x + ca * p.y) - ce * p.z)
  })
}
const planar = (points: Point3[]) => {
  const a = points[0]
  const diff = (b: Point3) => ({ x: b.x - a.x, y: b.y - a.y, z: b.z - a.z })
  let normal: Point3 | undefined
  for (let i = 1; i < points.length - 1; i++) {
    const b = diff(points[i]),
      c = diff(points[i + 1])
    const n = {
      x: b.y * c.z - b.z * c.y,
      y: b.z * c.x - b.x * c.z,
      z: b.x * c.y - b.y * c.x
    }
    const length = Math.hypot(n.x, n.y, n.z)
    if (length > 1e-10) {
      normal = { x: n.x / length, y: n.y / length, z: n.z / length }
      break
    }
  }
  if (!normal) return fail('degenerate face')
  const extent = Math.max(
    1,
    ...points.map((p) => Math.hypot(...Object.values(diff(p))))
  )
  for (const point of points) {
    const d = diff(point)
    if (
      Math.abs(normal.x * d.x + normal.y * d.y + normal.z * d.z) >
      extent * 1e-8
    )
      fail('nonplanar face')
  }
}

/** Pure, bounded pre-compilation; never edits canonical state or the caller draft. */
export const constructDesign = (
  input: unknown,
  generatedRootId: string = randomUUID()
): {
  draft: Node
  brief?: DesignBrief
  sourceWork: ReturnType<ReturnType<typeof createDesignSourceWork>['summary']>
} => {
  if (!record(input)) return fail('draft')
  const rootKey =
    input.key === undefined
      ? generatedRootId
      : label(input.key, 'node key', 160)
  const brief = readBrief(input.brief),
    project = camera(input.projection)
  const nodes = new Map<string, { node: Node; parent?: string }>()
  const keyPaths = new Map<string, string[]>()
  const sourceWork = createDesignSourceWork()
  let nodeCount = 0,
    vertexCount = 0
  const consumeSourceNode = (value: unknown) =>
    sourceWork.admit(sourcePathCommandCount(value))
  const face = (
    node: Node,
    key: string,
    parent?: string,
    template = false
  ): Node => {
    fields(node, ['key', 'name', 'type', 'fill', 'vertices'], 'projected face')
    if (
      !project ||
      parent !== rootKey ||
      (input.layout ?? 'absolute') !== 'absolute'
    )
      return fail('projected face requires a shared camera and absolute root')
    if (
      !Array.isArray(node.vertices) ||
      node.vertices.length < 3 ||
      (vertexCount += node.vertices.length) > limits.expandedPathCommands
    )
      return fail('face vertex limit')
    const vertices = node.vertices.map((v) => {
      if (!record(v)) return fail('face vertex')
      fields(v, ['x', 'y', 'z'], 'face vertex')
      return {
        x: number(v.x, 'face x'),
        y: number(v.y, 'face y'),
        z: number(v.z, 'face z')
      }
    })
    try {
      planar(vertices)
    } catch (error) {
      throw new Error(
        `Projected face ${key}.vertices: ${error instanceof Error ? error.message : 'invalid plane'}. Keep every vertex on the intended plane; split genuinely different planes into separate faces. Reuse the shared camera.`
      )
    }
    const points = vertices.map(project)
    const area = points.reduce((sum, p, i) => {
      const q = points[(i + 1) % points.length]
      return sum + p.x * q.y - p.y * q.x
    }, 0)
    if (Math.abs(area) <= 1e-8) return fail('degenerate projected face')
    const x = Math.min(...points.map((p) => p.x)),
      y = Math.min(...points.map((p) => p.y))
    const width = Math.max(...points.map((p) => p.x)) - x,
      height = Math.max(...points.map((p) => p.y)) - y
    if (!template) number(x, 'projected x', 0)
    if (!template) number(y, 'projected y', 0)
    number(width, 'projected width', Number.MIN_VALUE)
    number(height, 'projected height', Number.MIN_VALUE)
    return {
      key,
      name: node.name,
      type: 'vector',
      fill: node.fill,
      x,
      y,
      width,
      height,
      rings: [points.map((p) => ({ x: p.x - x, y: p.y - y }))]
    }
  }

  const point3 = (v: unknown): Point3 => {
    if (!record(v)) return fail('pattern point')
    fields(v, ['x', 'y', 'z'], 'pattern point')
    return {
      x: number(v.x, 'pattern x'),
      y: number(v.y, 'pattern y'),
      z: number(v.z, 'pattern z')
    }
  }
  const expand = (value: Node, parent: string): Node[] => {
    fields(
      value,
      [
        'key',
        'name',
        'type',
        'faces',
        'axes',
        'origin',
        'fills',
        'instanceRanges'
      ],
      'pattern'
    )
    if (
      !project ||
      parent !== rootKey ||
      (input.layout ?? 'absolute') !== 'absolute'
    )
      return fail('pattern requires shared projection and absolute root')
    if (
      ['key', 'name', 'origin', 'axes', 'faces'].some(
        (k) => value[k] === undefined
      ) ||
      (Array.isArray(value.faces) &&
        value.faces.some(
          (f) =>
            !record(f) ||
            ['key', 'name', 'vertices'].some((k) => !Object.hasOwn(f, k))
        ))
    )
      return fail(
        'pattern requires key, name, origin:{x,y,z}, axes:[{count,step:{x,y,z}}], faces:[{key,name,vertices:[{x,y,z},...],fill?}]. All names and keys are required, including each face. No canvas changes were made.'
      )
    const key = label(value.key, 'pattern key', 80),
      name = label(value.name, 'pattern name', 60)
    const origin = point3(value.origin)
    if (
      !Array.isArray(value.axes) ||
      value.axes.length < 1 ||
      value.axes.length > 2
    )
      return fail('pattern axes')
    const axes = value.axes.map((v) => {
      if (!record(v)) return fail('pattern axis')
      fields(v, ['count', 'step'], 'pattern axis')
      const count = number(v.count, 'pattern count', 1, limits.expandedNodes)
      if (!Number.isInteger(count)) return fail('pattern count')
      return { count, step: point3(v.step) }
    })
    const totalCount = axes.reduce((n, a) => n * a.count, 1)
    const ranges =
      value.instanceRanges === undefined
        ? [{ start: 0, end: totalCount }]
        : value.instanceRanges
    if (
      !Array.isArray(ranges) ||
      !ranges.length ||
      ranges.length > limits.nodes
    )
      return fail('pattern instanceRanges')
    let previousEnd = 0
    const selectedRanges = ranges.map((range) => {
      if (!record(range)) return fail('pattern instanceRanges')
      fields(range, ['start', 'end'], 'pattern instance range')
      const start = number(range.start, 'pattern range start', 0, totalCount)
      const end = number(range.end, 'pattern range end', 0, totalCount)
      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < previousEnd ||
        end <= start
      )
        return fail(
          'pattern ranges must be sorted, nonoverlapping, nonempty integer intervals [start,end)'
        )
      previousEnd = end
      return { start, end }
    })
    const count = selectedRanges.reduce(
      (n, range) => n + range.end - range.start,
      0
    )
    if (
      !Array.isArray(value.faces) ||
      !value.faces.length ||
      nodeCount + count * value.faces.length > limits.expandedNodes
    )
      return fail('pattern node limit')
    const fills = value.fills
    if (
      fills !== undefined &&
      (!Array.isArray(fills) ||
        !fills.length ||
        fills.length > limits.nodes ||
        !fills.every(isDesignFill))
    )
      return fail('pattern fills')
    const seen = new Set<string>()
    let templatePointCount = 0
    const templates = value.faces.map((v) => {
      if (!record(v)) return fail('pattern face')
      fields(v, ['key', 'name', 'fill', 'vertices'], 'pattern face')
      const faceKey = label(v.key, 'pattern face key', 40)
      if (seen.has(faceKey)) return fail('duplicate pattern face key')
      seen.add(faceKey)
      // Read and admit source vertices once; no per-instance source traversal.
      const vertices = v.vertices
      if (
        !Array.isArray(vertices) ||
        vertices.length < 3 ||
        vertexCount + vertices.length * count > limits.expandedPathCommands
      )
        return fail('pattern vertices')
      templatePointCount += vertices.length
      const points = vertices.map(point3)
      const bounds = {
        min: { x: Infinity, y: Infinity, z: Infinity },
        max: { x: -Infinity, y: -Infinity, z: -Infinity }
      }
      for (const p of points)
        for (const axis of ['x', 'y', 'z'] as const) {
          bounds.min[axis] = Math.min(bounds.min[axis], p[axis])
          bounds.max[axis] = Math.max(bounds.max[axis], p[axis])
        }
      const compiled = face(
        {
          key: faceKey,
          name: label(v.name, 'pattern face name', 60),
          fill: v.fill,
          type: 'projected-face',
          vertices: points
        },
        faceKey,
        parent,
        true
      )
      vertexCount += (count - 1) * points.length
      if (vertexCount > limits.expandedPathCommands)
        return fail('pattern vertex limit')
      return { compiled, bounds, faceKey }
    })
    sourceWork.admit(templatePointCount)
    const zero = project({ x: 0, y: 0, z: 0 }),
      result: Node[] = []
    for (const range of selectedRanges) {
      for (let i = range.start; i < range.end; i++) {
        let index = i
        const offset = { ...origin }
        for (let a = axes.length - 1; a >= 0; a--) {
          const axis = axes[a],
            n = index % axis.count
          index = Math.floor(index / axis.count)
          for (const k of ['x', 'y', 'z'] as const)
            offset[k] += n * axis.step[k]
        }
        const projected = project(offset)
        for (const { compiled, bounds, faceKey } of templates) {
          for (const k of ['x', 'y', 'z'] as const) {
            number(bounds.min[k] + offset[k], 'pattern world extent')
            number(bounds.max[k] + offset[k], 'pattern world extent')
          }
          result.push({
            ...compiled,
            key: `${key}-${i}-${faceKey}`,
            name: `${name} - ${i + 1} - ${compiled.name}`,
            x: number(
              Number(compiled.x) + projected.x - zero.x,
              'pattern projected x',
              0
            ),
            y: number(
              Number(compiled.y) + projected.y - zero.y,
              'pattern projected y',
              0
            ),
            ...(Array.isArray(fills) ? { fill: fills[i % fills.length] } : {})
          })
        }
      }
    }
    return result
  }
  const expandVectors = (value: Node): Node[] => {
    fields(
      value,
      ['key', 'name', 'type', 'template', 'placements'],
      'vector pattern'
    )
    const key = label(value.key, 'vector pattern key', 140)
    const name = label(value.name, 'vector pattern name', 140)
    if (!record(value.template)) return fail('vector pattern template')
    fields(
      value.template,
      ['type', 'width', 'height', 'fill', 'rings'],
      'vector template'
    )
    const template = value.template
    if (template.type !== undefined && template.type !== 'vector')
      return fail('vector template type must be vector')
    // The preparation owner validates explicit dimensions or measures omitted ones.
    // Keep the same immutable rings across placements for one exact measurement.
    if (!Array.isArray(template.rings) || !template.rings.length)
      return fail('vector template rings')
    // Source geometry is counted once. Admission checks expanded point budgets,
    // curve controls and exact bounds, sharing its request-local measurement.
    if (
      !Array.isArray(value.placements) ||
      !value.placements.length ||
      nodeCount + value.placements.length > limits.expandedNodes
    )
      return fail('vector pattern node limit')
    return value.placements.map((placement, index) => {
      if (!record(placement)) return fail('vector placement')
      fields(placement, ['x', 'y', 'fill'], 'vector placement')
      return {
        ...template,
        type: 'vector',
        key: `${key}-${index}`,
        name: `${name} - ${index + 1}`,
        x: number(placement.x, 'vector placement x', 0),
        y: number(placement.y, 'vector placement y', 0),
        ...(placement.fill !== undefined ? { fill: placement.fill } : {})
      }
    })
  }
  const copy = (
    value: unknown,
    parent?: string,
    depth = 1,
    generated = false,
    path = ''
  ): Node => {
    if (!generated) consumeSourceNode(value)
    if (!record(value)) return fail('node must be an object')
    if (++nodeCount > limits.expandedNodes)
      return fail(
        `expanded nodes ${nodeCount} exceed ${limits.expandedNodes} per artifact; use separate preparation calls without omitting detail`
      )
    if (depth > limits.depth)
      return fail(
        `depth ${depth} exceeds ${limits.depth} per artifact; reduce container nesting without changing visible geometry`
      )
    const root = parent === undefined
    const key = root ? rootKey : label(value.key, 'node key', 160)
    const paths = keyPaths.get(key) ?? []
    paths.push(`${path}/key`)
    keyPaths.set(key, paths)
    let node: Node = { ...value, key }
    if (root) {
      delete node.brief
      delete node.relations
      delete node.projection
      delete node.sharedFills
    }
    if (node.type === 'projected-face') node = face(node, key, parent)
    nodes.set(key, { node, parent })
    if (node.children !== undefined) {
      if (
        !Array.isArray(node.children) ||
        node.children.length > limits.expandedNodes
      )
        return fail('children limit')
      node.children = node.children.flatMap((child, childIndex) => {
        const childPath = `${path}/children/${childIndex}`
        if (record(child) && child.type === 'vector-pattern') {
          consumeSourceNode(child)
          return expandVectors(child).map((item) =>
            copy(item, key, depth + 1, true, childPath)
          )
        }
        if (record(child) && child.type === 'pattern') {
          return expand(child, key).map((item) =>
            copy(item, key, depth + 1, true, childPath)
          )
        }
        return [copy(child, key, depth + 1, false, childPath)]
      })
    }
    return node
  }
  const draft = copy(input)
  const conflicts = [...keyPaths]
    .filter(([, paths]) => paths.length > 1)
    .map(([key, paths]) => ({ key, paths }))
  if (conflicts.length) throw new DesignKeyConflictError(conflicts)
  const raw = input.relations ?? []
  if (!Array.isArray(raw) || raw.length > limits.relations)
    return fail('relation limit')
  const relations = new Map<string, Relation>()
  for (const value of raw) {
    if (!record(value)) return fail('relation')
    fields(
      value,
      [
        'target',
        'property',
        'source',
        'sourceProperty',
        'factor',
        'offset',
        'targetAnchor'
      ],
      'relation'
    )
    const target = label(value.target, 'relation target', 160),
      source = label(value.source, 'relation source', 160)
    if (
      !properties.includes(String(value.property)) ||
      !sourceProperties.includes(String(value.sourceProperty))
    )
      return fail('relation property')
    const entry = nodes.get(target),
      from = nodes.get(source)
    const parent = entry?.parent && nodes.get(entry.parent)
    if (
      !entry ||
      !parent ||
      entry.node.type === 'vector' ||
      (parent.node.layout ?? 'absolute') !== 'absolute' ||
      (source !== '$parent' &&
        (!from || from.parent !== entry.parent || from.node.type === 'vector'))
    )
      return fail('relation requires native siblings in absolute layout')
    if (
      value.targetAnchor !== undefined &&
      value.property !== 'x' &&
      value.property !== 'y'
    )
      return fail('relation anchor requires a position')
    const id = `${target}:${value.property}`
    if (relations.has(id)) return fail('duplicate relation target')
    relations.set(id, {
      target,
      source,
      property: value.property as LayoutProperty,
      sourceProperty: String(value.sourceProperty),
      factor: number(value.factor ?? 1, 'relation factor'),
      offset: number(value.offset ?? 0, 'relation offset'),
      targetAnchor: number(
        value.targetAnchor ?? 0,
        'relation target anchor',
        0,
        1
      )
    })
  }
  const pending = new Set<string>(),
    resolved = new Set<string>()
  const get = (key: string, property: string): number => {
    if (property === 'right') return get(key, 'x') + get(key, 'width')
    if (property === 'bottom') return get(key, 'y') + get(key, 'height')
    if (property === 'centerX') return get(key, 'x') + get(key, 'width') / 2
    if (property === 'centerY') return get(key, 'y') + get(key, 'height') / 2
    const entry = nodes.get(key)
    if (!entry) return fail('relation source')
    const id = `${key}:${property}`,
      relation = relations.get(id)
    if (relation && !resolved.has(id)) {
      if (pending.has(id)) return fail('cyclic relation')
      pending.add(id)
      let sourceValue: number
      if (relation.source === '$parent') {
        const parent = entry.parent
        if (!parent) return fail('relation parent')
        const p = relation.sourceProperty
        if (p === 'x' || p === 'y') sourceValue = 0
        else if (p === 'right' || p === 'centerX')
          sourceValue = get(parent, 'width') * (p === 'centerX' ? 0.5 : 1)
        else if (p === 'bottom' || p === 'centerY')
          sourceValue = get(parent, 'height') * (p === 'centerY' ? 0.5 : 1)
        else sourceValue = get(parent, p)
      } else sourceValue = get(relation.source, relation.sourceProperty)
      const anchorOffset =
        relation.targetAnchor === 0
          ? 0
          : relation.targetAnchor *
            get(key, property === 'x' ? 'width' : 'height')
      entry.node[property] = number(
        relation.factor * sourceValue + relation.offset - anchorOffset,
        'relation result',
        property === 'width' || property === 'height' ? Number.MIN_VALUE : 0
      )
      pending.delete(id)
      resolved.add(id)
    }
    return number(entry.node[property] ?? 0, 'relation source value', 0)
  }
  for (const relation of relations.values())
    get(relation.target, relation.property)
  for (const check of brief?.checks ?? [])
    if (!nodes.has(check.key)) fail('check key is missing')
  return { draft, brief, sourceWork: sourceWork.summary() }
}
