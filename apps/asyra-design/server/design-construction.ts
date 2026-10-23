import { createLinearFieldFill, readLinearFields } from './design-linear-field'
import { setImmediate as yieldTurn } from 'node:timers/promises'
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
        expected: number(
          c.expected,
          'check expected',
          c.property === 'x' || c.property === 'y' ? -limits.dimension : 0
        ),
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
  const ox = number(value.originX, 'projection originX')
  const oy = number(value.originY, 'projection originY')
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
export function* constructDesignSteps(
  input: unknown,
  generatedRootId: string = randomUUID()
): Generator<
  void,
  {
    draft: Node
    materialFields: Record<string, string>
    brief?: DesignBrief
    sourceWork: ReturnType<
      ReturnType<typeof createDesignSourceWork>['summary']
    > & {
      projectionCalls: number
      expansionWork: ReturnType<
        ReturnType<typeof createDesignSourceWork>['summary']
      >
      identityWork: ReturnType<
        ReturnType<typeof createDesignSourceWork>['summary']
      >
    }
  },
  void
> {
  if (!record(input)) return fail('draft')
  const rootLayout = input.layout ?? 'absolute'
  const rootKey =
    input.key === undefined
      ? generatedRootId
      : label(input.key, 'node key', 160)
  const brief = readBrief(input.brief)
  const linearFields = readLinearFields(input.linearFields)
  const materialFields: Record<string, string> = Object.create(null)
  const materialNames = new WeakMap<Node, string>()
  const materialFills = new WeakMap<
    Node,
    ReturnType<typeof createLinearFieldFill>
  >()
  const projection = camera(input.projection)
  let projectionCalls = 0
  const project = projection
    ? (point: Point3) => {
        projectionCalls++
        return projection(point)
      }
    : undefined
  const nodes = new Map<string, { node: Node; parent?: string }>()
  const keyPaths = new Map<string, string[]>()
  const sourceWork = createDesignSourceWork()
  const expansionWork = createDesignSourceWork()
  const identityWork = createDesignSourceWork()
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
    fields(
      node,
      ['key', 'name', 'type', 'fill', 'materialField', 'vertices'],
      'projected face'
    )
    if (node.materialField !== undefined && node.fill !== undefined)
      return fail('materialField conflicts with fill')
    if (!project || parent !== rootKey || rootLayout !== 'absolute')
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
    const compiled = vectorFromPoints(node, key, points, template)
    if (node.materialField !== undefined) {
      const material = createLinearFieldFill(
        linearFields,
        node.materialField,
        vertices,
        points
      )
      compiled.fill = template ? undefined : material()
      materialFills.set(compiled, material)
      materialNames.set(compiled, String(node.materialField))
      if (!template) materialFields[key] = String(node.materialField)
    }
    return compiled
  }
  const vectorFromPoints = (
    node: Node,
    key: string,
    points: { x: number; y: number }[],
    template = false
  ): Node => {
    const area = points.reduce((sum, p, i) => {
      const q = points[(i + 1) % points.length]
      return sum + p.x * q.y - p.y * q.x
    }, 0)
    if (Math.abs(area) <= 1e-8) return fail('degenerate projected face')
    const x = Math.min(...points.map((p) => p.x)),
      y = Math.min(...points.map((p) => p.y))
    const width = Math.max(...points.map((p) => p.x)) - x,
      height = Math.max(...points.map((p) => p.y)) - y
    if (!template) number(x, 'projected x')
    if (!template) number(y, 'projected y')
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
  function* expand(value: Node, parent: string): Generator<void, Node[], void> {
    fields(
      value,
      [
        'key',
        'name',
        'type',
        'faces',
        'members',
        'axes',
        'origin',
        'fills',
        'instanceRanges'
      ],
      'pattern'
    )
    if (!project || parent !== rootKey || rootLayout !== 'absolute')
      return fail('pattern requires shared projection and absolute root')
    if (
      ['key', 'name', 'origin', 'axes'].some((k) => value[k] === undefined) ||
      (Array.isArray(value.faces) &&
        value.faces.some(
          (f) =>
            !record(f) ||
            ['key', 'name', 'vertices'].some((k) => !Object.hasOwn(f, k))
        ))
    )
      return fail(
        'pattern requires key, name, origin:{x,y,z}, axes:[{count,step:{x,y,z}}], exactly one of faces:[{key,name,vertices:[{x,y,z},...],fill?}] or members:[projected-face|surface-grid]. All names and keys are required, including each face. No canvas changes were made.'
      )
    const mixed = value.members !== undefined
    if (
      mixed === (value.faces !== undefined) ||
      (mixed && value.fills !== undefined)
    )
      return fail(
        'pattern requires either faces or members; members forbids pattern fills'
      )
    const members = mixed ? value.members : value.faces
    if (!Array.isArray(members) || !members.length)
      return fail('pattern requires nonempty faces or members')
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
    if (!Array.isArray(ranges) || !ranges.length)
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
    if (nodeCount + count * members.length > limits.expandedNodes)
      return fail('pattern node limit')
    const fills = value.fills
    if (
      fills !== undefined &&
      (!Array.isArray(fills) || !fills.length || !fills.every(isDesignFill))
    )
      return fail('pattern fills')
    const seen = new Set<string>()
    // Template compilation is bounded work, not a second charge to final output.
    const templateWork = createDesignSourceWork()
    const templates: {
      compiled: Node
      bounds: { min: Point3; max: Point3 }
      faceKey: string
    }[] = []
    for (const member of members) {
      if (!record(member)) return fail('pattern member')
      if (mixed && member.type === 'surface-grid') {
        const memberKey = label(member.key, 'pattern grid key', 80)
        if (seen.has(memberKey)) return fail('duplicate pattern member key')
        seen.add(memberKey)
        const beforeVertices = vertexCount
        const bounds = {
          min: { x: Infinity, y: Infinity, z: Infinity },
          max: { x: -Infinity, y: -Infinity, z: -Infinity }
        }
        const compiled = yield* expandGrid(member, parent, bounds, templateWork)
        vertexCount += (vertexCount - beforeVertices) * (count - 1)
        if (vertexCount > limits.expandedPathCommands)
          return fail('pattern vertex limit')
        for (const node of compiled)
          templates.push({ compiled: node, bounds, faceKey: String(node.key) })
        continue
      }
      if (mixed && member.type !== 'projected-face')
        return fail(
          'pattern members support projected-face and surface-grid only'
        )
      const v = mixed ? { ...member } : member
      if (mixed) delete v.type
      fields(
        v,
        ['key', 'name', 'fill', 'materialField', 'vertices'],
        'pattern face'
      )
      if (v.materialField !== undefined && fills !== undefined)
        return fail('materialField conflicts with pattern fills')
      const faceKey = label(v.key, 'pattern face key', mixed ? 80 : 40)
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
      if (sourceWork.admit(vertices.length)) yield
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
          materialField: v.materialField,
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
      templates.push({ compiled, bounds, faceKey })
    }
    if (nodeCount + count * templates.length > limits.expandedNodes)
      return fail('pattern node limit')
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
          if (expansionWork.admit(sourcePathCommandCount(compiled))) yield
          for (const k of ['x', 'y', 'z'] as const) {
            number(bounds.min[k] + offset[k], 'pattern world extent')
            number(bounds.max[k] + offset[k], 'pattern world extent')
          }
          const material = materialFills.get(compiled)
          const materialName = materialNames.get(compiled)
          if (materialName)
            materialFields[`${key}-${i}-${faceKey}`] = materialName
          result.push({
            ...compiled,
            key: `${key}-${i}-${faceKey}`,
            name: `${name} - ${i + 1} - ${compiled.name}`,
            x: number(
              Number(compiled.x) + projected.x - zero.x,
              'pattern projected x'
            ),
            y: number(
              Number(compiled.y) + projected.y - zero.y,
              'pattern projected y'
            ),
            ...(material ? { fill: material(offset) } : {}),
            ...(Array.isArray(fills) ? { fill: fills[i % fills.length] } : {})
          })
        }
      }
    }
    return result
  }
  interface CompiledMotif {
    key: string
    name: string
    fill: unknown
    fills?: unknown[]
    offset: { x: number; y: number }
    worldOffset: Point3
    vertices: { u: number; v: number }[]
  }

  const motifDefinitions = new Map<string, CompiledMotif[]>()
  function* compileMotifs(
    source: unknown
  ): Generator<void, CompiledMotif[], void> {
    const projectMotif = project
    if (!projectMotif)
      return fail('surface grid motifs require shared projection')
    if (!Array.isArray(source) || !source.length)
      return fail('surface grid motifs')
    const motifs: CompiledMotif[] = []
    const keys = new Set<string>()
    for (const item of source) {
      if (!record(item)) return fail('surface grid motif')
      fields(
        item,
        ['key', 'name', 'fill', 'fills', 'offset', 'vertices'],
        'surface grid motif'
      )
      const motifKey = label(item.key, 'surface grid motif key', 40)
      if (keys.has(motifKey)) return fail('duplicate surface grid motif key')
      keys.add(motifKey)
      if (item.fill !== undefined && !isDesignFill(item.fill))
        return fail('surface grid motif fill')
      const fills = item.fills
      if (
        fills !== undefined &&
        (!Array.isArray(fills) || !fills.length || !fills.every(isDesignFill))
      )
        return fail('surface grid motif fills')
      let offset = { x: 0, y: 0 }
      let worldOffset = { x: 0, y: 0, z: 0 }
      if (item.offset !== undefined) {
        const shift = point3(item.offset)
        worldOffset = shift
        const zero = projectMotif({ x: 0, y: 0, z: 0 })
        const moved = projectMotif(shift)
        offset = { x: moved.x - zero.x, y: moved.y - zero.y }
      }
      const rawVertices = item.vertices
      if (!Array.isArray(rawVertices) || rawVertices.length < 3)
        return fail('surface grid motif vertices')
      if (sourceWork.admit(rawVertices.length)) yield
      const vertices = rawVertices.map((point) => {
        if (!record(point)) return fail('surface grid motif point')
        fields(point, ['u', 'v'], 'surface grid motif point')
        return {
          u: number(point.u, 'surface grid u', 0, 1),
          v: number(point.v, 'surface grid v', 0, 1)
        }
      })
      motifs.push({
        key: motifKey,
        name: label(item.name, 'surface grid motif name', 60),
        fill: item.fill,
        fills: fills as unknown[] | undefined,
        offset,
        worldOffset,
        vertices
      })
    }
    return motifs
  }
  function* expandGrid(
    value: Node,
    parent: string,
    worldBounds?: { min: Point3; max: Point3 },
    work = expansionWork
  ): Generator<void, Node[], void> {
    fields(
      value,
      ['type', 'key', 'name', 'boundary', 'rows', 'columns', 'motifs', 'order'],
      'surface grid'
    )
    if (!project || parent !== rootKey || rootLayout !== 'absolute')
      return fail('surface grid requires shared projection and absolute root')
    const key = label(value.key, 'surface grid key', 80)
    const name = label(value.name, 'surface grid name', 60)
    const rows = number(
      value.rows,
      'surface grid rows',
      1,
      limits.expandedNodes
    )
    const columns = number(
      value.columns,
      'surface grid columns',
      1,
      limits.expandedNodes
    )
    if (!Number.isInteger(rows) || !Number.isInteger(columns))
      return fail('surface grid integer counts')
    if (value.order !== 'cell-major' && value.order !== 'motif-major')
      return fail('surface grid order')
    if (!Array.isArray(value.boundary) || value.boundary.length !== 4)
      return fail('surface grid boundary')
    if (sourceWork.admit(4)) yield
    const boundary = value.boundary.map(point3)
    planar(boundary)
    const corners = boundary.map(project)
    let winding = 0
    for (let i = 0; i < 4; i++) {
      const a = corners[i],
        b = corners[(i + 1) % 4],
        c = corners[(i + 2) % 4]
      const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)
      if (Math.abs(cross) <= 1e-8 || (winding && Math.sign(cross) !== winding))
        return fail(
          'surface grid boundary must project to a nondegenerate convex quadrilateral'
        )
      winding = Math.sign(cross)
    }
    const count = rows * columns
    let motifs: CompiledMotif[]
    if (Array.isArray(value.motifs)) motifs = yield* compileMotifs(value.motifs)
    else {
      if (!record(value.motifs)) return fail('surface grid motifs')
      fields(value.motifs, ['template'], 'surface grid motif reference')
      const template = label(
        value.motifs.template,
        'surface grid motif template',
        160
      )
      const definition = motifDefinitions.get(template)
      if (!definition) return fail(`unknown motif template ${template}`)
      motifs = definition
    }
    if (nodeCount + count * motifs.length > limits.expandedNodes)
      return fail('surface grid node limit')
    for (const motif of motifs) {
      vertexCount += count * motif.vertices.length
      if (vertexCount > limits.expandedPathCommands)
        return fail('surface grid vertex limit')
      if (worldBounds)
        for (const point of boundary)
          for (const axis of ['x', 'y', 'z'] as const) {
            worldBounds.min[axis] = Math.min(
              worldBounds.min[axis],
              point[axis] + motif.worldOffset[axis]
            )
            worldBounds.max[axis] = Math.max(
              worldBounds.max[axis],
              point[axis] + motif.worldOffset[axis]
            )
          }
    }
    const result: Node[] = []
    const total = count * motifs.length
    for (let index = 0; index < total; index++) {
      const cell =
        value.order === 'cell-major'
          ? Math.floor(index / motifs.length)
          : index % count
      const motif =
        motifs[
          value.order === 'cell-major'
            ? index % motifs.length
            : Math.floor(index / count)
        ]
      if (work.admit(motif.vertices.length)) yield
      const points = motif.vertices.map((point) => {
        const u = ((cell % columns) + point.u) / columns
        const v = (Math.floor(cell / columns) + point.v) / rows
        const weights = [(1 - u) * (1 - v), u * (1 - v), u * v, (1 - u) * v]
        return {
          x:
            motif.offset.x +
            corners.reduce((sum, p, i) => sum + weights[i] * p.x, 0),
          y:
            motif.offset.y +
            corners.reduce((sum, p, i) => sum + weights[i] * p.y, 0)
        }
      })
      result.push(
        vectorFromPoints(
          {
            name: `${name} - ${cell + 1} - ${motif.name}`,
            fill: motif.fills
              ? motif.fills[cell % motif.fills.length]
              : motif.fill
          },
          `${key}-${cell}-${motif.key}`,
          points,
          worldBounds !== undefined
        )
      )
    }
    return result
  }
  function* expandVectors(value: Node): Generator<void, Node[], void> {
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
    const result: Node[] = []
    for (const [index, placement] of value.placements.entries()) {
      if (expansionWork.admit(sourcePathCommandCount(value))) yield
      if (!record(placement)) return fail('vector placement')
      fields(placement, ['x', 'y', 'fill'], 'vector placement')
      result.push({
        ...template,
        type: 'vector',
        key: `${key}-${index}`,
        name: `${name} - ${index + 1}`,
        x: number(placement.x, 'vector placement x'),
        y: number(placement.y, 'vector placement y'),
        ...(placement.fill !== undefined ? { fill: placement.fill } : {})
      })
    }
    return result
  }
  function* copy(
    value: unknown,
    parent?: string,
    depth = 1,
    generated = false,
    path = ''
  ): Generator<void, Node, void> {
    if (identityWork.admit(0)) yield
    if (!generated && consumeSourceNode(value)) yield
    if (!generated && expansionWork.admit(sourcePathCommandCount(value))) yield
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
      delete node.linearFields
      delete node.fillTemplates
      delete node.motifTemplates
    }
    if (node.type === 'projected-face') node = face(node, key, parent)
    nodes.set(key, { node, parent })
    if (node.children !== undefined) {
      if (
        !Array.isArray(node.children) ||
        node.children.length > limits.expandedNodes
      )
        return fail('children limit')
      const children: Node[] = []
      for (const [childIndex, child] of node.children.entries()) {
        const childPath = `${path}/children/${childIndex}`
        if (record(child) && child.type === 'vector-pattern') {
          if (consumeSourceNode(child)) yield
          for (const item of yield* expandVectors(child))
            children.push(yield* copy(item, key, depth + 1, true, childPath))
        } else if (record(child) && child.type === 'surface-grid') {
          for (const item of yield* expandGrid(child, key))
            children.push(yield* copy(item, key, depth + 1, true, childPath))
        } else if (record(child) && child.type === 'pattern') {
          for (const item of yield* expand(child, key))
            children.push(yield* copy(item, key, depth + 1, true, childPath))
        } else
          children.push(yield* copy(child, key, depth + 1, false, childPath))
      }
      node.children = children
    }
    return node
  }
  if (input.motifTemplates !== undefined) {
    if (!record(input.motifTemplates))
      return fail('motifTemplates must be a named map')
    for (const [name, source] of Object.entries(input.motifTemplates)) {
      label(name, 'motif template key', 160)
      motifDefinitions.set(name, yield* compileMotifs(source))
    }
  }
  const draft = yield* copy(input)
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
        property === 'width' || property === 'height'
          ? Number.MIN_VALUE
          : -limits.dimension
      )
      pending.delete(id)
      resolved.add(id)
    }
    return number(
      entry.node[property] ?? 0,
      'relation source value',
      property === 'width' || property === 'height' ? 0 : -limits.dimension
    )
  }
  for (const relation of relations.values())
    get(relation.target, relation.property)
  for (const check of brief?.checks ?? [])
    if (!nodes.has(check.key)) fail('check key is missing')
  return {
    draft,
    brief,
    materialFields,
    sourceWork: {
      ...sourceWork.summary(),
      projectionCalls,
      expansionWork: expansionWork.summary(),
      identityWork: identityWork.summary()
    }
  }
}

/** Synchronous callers and server callers execute the same construction steps. */
export const completeDesignSteps = <T>(steps: Generator<void, T, void>): T => {
  let current = steps.next()
  while (!current.done) current = steps.next()
  return current.value
}

export const completeDesignStepsAsync = async <T>(
  steps: Generator<void, T, void>,
  signal: AbortSignal
): Promise<T> => {
  try {
    signal.throwIfAborted()
    let current = steps.next()
    while (!current.done) {
      await yieldTurn(undefined, { signal })
      signal.throwIfAborted()
      current = steps.next()
    }
    signal.throwIfAborted()
    return current.value
  } catch (error) {
    signal.throwIfAborted()
    throw error
  } finally {
    // Release the invocation-local generator, including on cancellation.
    steps.return(undefined as T)
  }
}

export const constructDesign = (
  input: unknown,
  generatedRootId = randomUUID()
) => completeDesignSteps(constructDesignSteps(input, generatedRootId))

export const constructDesignAsync = (
  input: unknown,
  generatedRootId: string,
  signal: AbortSignal
) =>
  completeDesignStepsAsync(constructDesignSteps(input, generatedRootId), signal)
