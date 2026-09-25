import type { NativeImageBackground } from './local-image-layer-separation'
import { randomUUID } from 'node:crypto'
import { Bezier } from 'bezier-js'
import { LocalComponentAnalysisLimits } from './local-component-analysis-limits'

interface Point {
  x: number
  y: number
}
interface VectorAnchor extends Point {
  inControl?: Point
  outControl?: Point
}
interface Bounds {
  x: number
  y: number
  width: number
  height: number
}
interface VectorPath {
  id: string
  fill: string
  rings: VectorAnchor[][]
  bounds: Bounds
  pointCount: number
}
export interface LocalVectorArtifact {
  imageArtifactId: string
  width: number
  height: number
  paths: VectorPath[]
  background?: NativeImageBackground
  sourceBounds?: Bounds
}
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const invalid = (): never => {
  throw new Error('Invalid vector artifact')
}
const numberPattern = '-?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?'
const tokensPattern = new RegExp(`[MLCZ]|${numberPattern}`, 'g')
const boundsOf = (points: readonly Point[]): Bounds => {
  let x = Infinity,
    y = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const point of points) {
    x = Math.min(x, point.x)
    y = Math.min(y, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  }
  return { x, y, width: maxX - x, height: maxY - y }
}
const attributes = (source: string): Record<string, string> => {
  const result: Record<string, string> = Object.create(null)
  const pattern = /([A-Za-z][\w:-]*)="([^"]*)"/g
  for (const match of source.matchAll(pattern)) {
    if (match[1] in result) invalid()
    result[match[1]] = match[2]
  }
  if (source.replace(pattern, '').trim()) invalid()
  return result
}
const curveBounds = (rings: readonly VectorAnchor[][]): Bounds => {
  const extrema: Point[] = []
  for (const ring of rings) {
    ring.forEach((start, index) => {
      const end = ring[(index + 1) % ring.length]
      if (start.outControl && end.inControl) {
        const bounds = new Bezier(
          start,
          start.outControl,
          end.inControl,
          end
        ).bbox()
        extrema.push(
          { x: bounds.x.min, y: bounds.y.min },
          { x: bounds.x.max, y: bounds.y.max }
        )
      } else extrema.push(start, end)
    })
  }
  return boundsOf(extrema)
}
/** Recompute derived measurements only when backend-owned contour data changes. */
export const measureVectorPath = (
  path: LocalVectorArtifact['paths'][number]
) => ({
  ...path,
  bounds: curveBounds(path.rings),
  pointCount: path.rings
    .flat()
    .reduce((n, p) => n + 1 + Number(!!p.inControl) + Number(!!p.outControl), 0)
})

const parseRings = (
  source: string,
  width: number,
  height: number
): VectorAnchor[][] => {
  if (source.replace(tokensPattern, '').replace(/[,\s]/g, '')) invalid()
  const tokens = source.match(tokensPattern) ?? []
  const rings: VectorAnchor[][] = []
  let current: VectorAnchor[] | undefined
  let index = 0
  let command = ''
  const readPoint = (): Point => {
    const x = Number(tokens[index++]),
      y = Number(tokens[index++])
    // Fitted curves may overshoot image edges. Admit bounded native output;
    // clipping controls changes the curve rather than validating it.
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x < -width ||
      y < -height ||
      x > 2 * width ||
      y > 2 * height
    )
      invalid()
    return { x, y }
  }
  while (index < tokens.length) {
    if (/^[MLCZ]$/.test(tokens[index])) {
      command = tokens[index++]
      if (command === 'Z') {
        if (!current || current.length === 0) return invalid()
        if (
          current.length > 1 &&
          current[0].x === current.at(-1)?.x &&
          current[0].y === current.at(-1)?.y
        ) {
          current[0].inControl = current.at(-1)?.inControl
          current.pop()
        }
        if (current.length >= 3 || current.some((anchor) => anchor.outControl))
          rings.push(current)
        current = undefined
        command = ''
        continue
      }
      if (command === 'M') {
        if (current) invalid()
        current = []
      }
    }
    if (!current || !['M', 'L', 'C'].includes(command)) return invalid()
    if (command === 'C') {
      const start = current.at(-1)
      if (!start) return invalid()
      start.outControl = readPoint()
      const inControl = readPoint()
      current.push({ ...readPoint(), inControl })
    } else {
      current.push(readPoint())
      command = 'L'
    }
  }
  if (current) invalid()
  return rings
}

/** Admits only the absolute M/L/C/Z dialect emitted by the registered worker. */
export const parseLocalVectorArtifact = (
  source: string
): LocalVectorArtifact => {
  const clean = source
    .replace(/^\s*<\?xml[^?]*\?>/, '')
    .replace(/<!--[^]*?-->/g, '')
    .trim()
  const root = /^<svg\s+([^>]*)>([^]*)<\/svg>$/.exec(clean)
  if (!root) return invalid()
  const attrs = attributes(root[1])
  if (
    Object.keys(attrs).some(
      (key) => !['width', 'height', 'version', 'xmlns'].includes(key)
    )
  )
    invalid()
  const width = Number(attrs.width),
    height = Number(attrs.height)
  if (
    ![width, height].every(
      (value) => Number.isFinite(value) && value > 0 && value <= 32768
    )
  )
    invalid()
  const pathPattern = /<path\s+([^>]*?)\s*\/>/g
  const paths: VectorPath[] = []
  for (const match of root[2].matchAll(pathPattern)) {
    const pathAttrs = attributes(match[1])
    if (
      Object.keys(pathAttrs).some((key) => !['d', 'fill'].includes(key)) ||
      !/^#[0-9a-f]{6}$/i.test(pathAttrs.fill) ||
      !pathAttrs.d
    )
      invalid()
    const rings = parseRings(pathAttrs.d, width, height)
    const points = rings.flat()
    if (!points.length) continue
    const bounds = curveBounds(rings)
    if (bounds.width <= 0 || bounds.height <= 0) continue
    paths.push({
      id: `path-${paths.length + 1}`,
      fill: pathAttrs.fill.toUpperCase(),
      rings,
      bounds,
      pointCount: points.reduce(
        (count, point) =>
          count + 1 + Number(!!point.inControl) + Number(!!point.outControl),
        0
      )
    })
  }
  if (!paths.length || root[2].replace(pathPattern, '').trim()) invalid()
  return { imageArtifactId: randomUUID(), width, height, paths }
}

const vectorComponentTargets = {
  oval: 'Whole single-contour circles or ellipses with solid fill; no holes or irregular artwork.',
  rect: 'Whole single-contour axis-aligned rectangles with square corners and solid fill; no holes, rounded corners or rotated artwork.'
} as const

type VectorComponentType = keyof typeof vectorComponentTargets

export const vectorArtifactSummary = (artifact: LocalVectorArtifact) => ({
  imageArtifactId: artifact.imageArtifactId,
  componentTargets: vectorComponentTargets,
  ...(artifact.background
    ? { background: artifact.background, sourceBounds: artifact.sourceBounds }
    : {}),
  width: artifact.width,
  height: artifact.height,
  paths: artifact.paths.map(({ id, fill, bounds, pointCount, rings }) => ({
    id,
    fill,
    bounds,
    pointCount,
    subpathCount: rings.length
  }))
})

export const LOCAL_VECTOR_REFERENCE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['imageArtifactId', 'bounds', 'compositionRole', 'excludePathIds'],
  properties: {
    imageArtifactId: { type: 'string' },
    analysisIds: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: LocalComponentAnalysisLimits.receiptIdsPerCall,
      uniqueItems: true,
      description:
        'Required for componentMappings or ovalPathIds. Use same-request analysis receipts for this artifact and only select eligible path/component pairs.'
    },
    compositionRole: { type: 'string', minLength: 1, maxLength: 160 },
    componentMappings: {
      type: 'array',
      description:
        'Map whole paths to supported App components after data review. Only select when the component preserves the intended shape; a matching bounding box is insufficient. Unmapped paths remain vectors.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['pathId', 'componentType'],
        properties: {
          pathId: { type: 'string', minLength: 1 },
          componentType: {
            type: 'string',
            enum: Object.keys(vectorComponentTargets)
          }
        }
      }
    },
    ovalPathIds: {
      type: 'array',
      uniqueItems: true,
      items: { type: 'string' },
      description:
        'Optional IDs of whole single-contour paths that represent intended circles or ellipses. Replace each with one filled native Oval at its mapped bounds, preserving color and order. Do not select irregular artwork, paths with holes, or excluded paths.'
    },
    excludePathIds: {
      type: 'array',
      uniqueItems: true,
      items: { type: 'string' },
      description:
        'IDs of whole paths to omit. Use bounds and colors from the VTracer summary to identify separate marks. Empty preserves all paths.'
    },
    bounds: {
      type: 'object',
      additionalProperties: false,
      required: ['x', 'y', 'width', 'height'],
      properties: {
        x: { type: 'number', minimum: 0 },
        y: { type: 'number', minimum: 0 },
        width: { type: 'number', exclusiveMinimum: 0 },
        height: { type: 'number', exclusiveMinimum: 0 }
      }
    }
  }
} as const

/** Build existing canonical wire descriptors once, after model selection, on the server. */
export const prepareLocalVectorArtifact = (
  artifact: LocalVectorArtifact,
  input: unknown
) => {
  if (
    !record(input) ||
    Object.keys(input).some(
      (key) =>
        ![
          'imageArtifactId',
          'bounds',
          'compositionRole',
          'excludePathIds',
          'ovalPathIds',
          'componentMappings'
        ].includes(key)
    ) ||
    input.imageArtifactId !== artifact.imageArtifactId ||
    typeof input.compositionRole !== 'string' ||
    !input.compositionRole.trim() ||
    input.compositionRole.length > 160 ||
    !record(input.bounds) ||
    !Array.isArray(input.excludePathIds)
  )
    return invalid()
  const bounds = input.bounds
  if (
    Object.keys(bounds).length !== 4 ||
    !['x', 'y', 'width', 'height'].every(
      (key) => typeof bounds[key] === 'number' && Number.isFinite(bounds[key])
    )
  )
    return invalid()
  const target = bounds as unknown as Bounds
  if (
    target.x < 0 ||
    target.y < 0 ||
    target.width <= 0 ||
    target.height <= 0 ||
    target.x + target.width > 2048 ||
    target.y + target.height > 2048
  )
    invalid()
  const excluded = new Set(input.excludePathIds)
  const pathIds = new Set(artifact.paths.map(({ id }) => id))
  if (
    excluded.size !== input.excludePathIds.length ||
    [...excluded].some((id) => typeof id !== 'string' || !pathIds.has(id))
  )
    invalid()
  const ovalIds = input.ovalPathIds === undefined ? [] : input.ovalPathIds
  if (!Array.isArray(ovalIds)) return invalid()
  const ovals = new Set(ovalIds)
  if (
    ovals.size !== ovalIds.length ||
    [...ovals].some(
      (id) => typeof id !== 'string' || !pathIds.has(id) || excluded.has(id)
    ) ||
    artifact.paths.some((path) => ovals.has(path.id) && path.rings.length !== 1)
  )
    return invalid()
  const mappings =
    input.componentMappings === undefined ? [] : input.componentMappings
  if (!Array.isArray(mappings)) return invalid()
  const components = new Map<string, VectorComponentType>(
    [...ovals].map((id) => [id as string, 'oval'])
  )
  for (const mapping of mappings) {
    if (
      !record(mapping) ||
      Object.keys(mapping).some(
        (key) => !['pathId', 'componentType'].includes(key)
      ) ||
      typeof mapping.pathId !== 'string' ||
      !pathIds.has(mapping.pathId) ||
      excluded.has(mapping.pathId) ||
      components.has(mapping.pathId) ||
      typeof mapping.componentType !== 'string' ||
      !Object.hasOwn(vectorComponentTargets, mapping.componentType)
    )
      return invalid()
    components.set(mapping.pathId, mapping.componentType as VectorComponentType)
  }
  if (
    artifact.paths.some(
      (path) => components.has(path.id) && path.rings.length !== 1
    )
  )
    return invalid()
  const retained = artifact.paths.filter(({ id }) => !excluded.has(id))
  if (!retained.length && !artifact.background) invalid()
  const source =
    artifact.sourceBounds ??
    boundsOf(
      retained.flatMap(({ bounds: b }) => [
        { x: b.x, y: b.y },
        { x: b.x + b.width, y: b.y + b.height }
      ])
    )
  const mapPoint = (point: Point): Point => ({
    x: target.x + ((point.x - source.x) * target.width) / source.width,
    y: target.y + ((point.y - source.y) * target.height) / source.height
  })
  const base = (
    type: 'group' | 'vector' | VectorComponentType,
    name: string,
    b: Bounds
  ) => {
    const id = randomUUID()
    return {
      id,
      name,
      type,
      ...b,
      visible: true,
      lock: false,
      props: Object.fromEntries(
        ['position', 'dimension', 'fills', 'strokes'].map((key) => [
          key,
          `${id}-${key}`
        ])
      ),
      strokes: []
    }
  }
  const groupDescriptor = {
    ...base('group', input.compositionRole, target),
    children: [],
    fills: []
  }
  const roleToElementIds: Record<string, string[]> = {}
  const prepared = retained.map((path) => {
    const componentType = components.get(path.id)
    const mappedOrigin = mapPoint(path.bounds)
    // Reuse the admitted curve bounds. Preparation only transforms selected
    // anchors/controls; it does not reconstruct or remeasure the source curve.
    const b = {
      ...mappedOrigin,
      width: (path.bounds.width * target.width) / source.width,
      height: (path.bounds.height * target.height) / source.height
    }
    const common = base(componentType ?? 'vector', path.id, {
      ...b,
      x: b.x - target.x,
      y: b.y - target.y
    })
    const fills = [
      {
        id: `${common.id}-fill`,
        type: 'fill',
        kind: 'solid',
        color: path.fill,
        opacity: 1,
        visible: true,
        colorFormat: 'hex',
        defaultColorFormat: 'hex',
        gradient: null
      }
    ]
    roleToElementIds[path.id] = [common.id]
    if (componentType)
      return { descriptor: { ...common, fills }, pointCount: 0, role: path.id }
    const points: Record<string, unknown> = {},
      segments: Record<string, unknown> = {},
      networks: Record<string, unknown> = {}
    path.rings.forEach((ring, ringIndex) => {
      const pointIds = ring.map((point, index) => {
        const id = `${common.id}-p-${ringIndex}-${index}`
        points[id] = {
          id,
          kind: 'anchor',
          anchorType: 'sharp',
          handleMode: 'none',
          ...mapPoint(point)
        }
        return id
      })
      const segmentIds = pointIds.map((startId, index) => {
        const id = `${common.id}-s-${ringIndex}-${index}`
        const next = (index + 1) % ring.length
        const endId = pointIds[next]
        const addControl = (
          point: Point | undefined,
          anchorId: string,
          role: 'in' | 'out'
        ) => {
          if (!point) return null
          const controlId = `${anchorId}-${role}`
          points[controlId] = {
            id: controlId,
            kind: 'control',
            controlForId: anchorId,
            controlRole: role,
            ...mapPoint(point)
          }
          return controlId
        }
        segments[id] = {
          id,
          startId,
          endId,
          outControlId: addControl(ring[index].outControl, startId, 'out'),
          inControlId: addControl(ring[next].inControl, endId, 'in')
        }
        return id
      })
      const id = `${common.id}-n-${ringIndex}`
      networks[id] = { id, pointIds, segmentIds, closed: true }
    })
    roleToElementIds[path.id] = [common.id]
    return {
      descriptor: {
        ...common,
        points,
        segments,
        networks,
        closed: true,
        pointCoordinateSpace: 'workspace',
        fillRule: 'nonzero',
        props: {
          ...common.props,
          ...Object.fromEntries(
            [
              'points',
              'segments',
              'networks',
              'closed',
              'pointCoordinateSpace',
              'fillRule'
            ].map((key) => [key, `${common.id}-${key}`])
          )
        },
        fills
      },
      pointCount: path.pointCount,
      role: path.id
    }
  })
  if (artifact.background) {
    const background = artifact.background
    const origin = mapPoint(background.bounds)
    const common = base(background.componentType, 'background', {
      x: origin.x - target.x,
      y: origin.y - target.y,
      width: (background.bounds.width * target.width) / source.width,
      height: (background.bounds.height * target.height) / source.height
    })
    roleToElementIds.background = [common.id]
    prepared.unshift({
      descriptor: {
        ...common,
        fills: [
          {
            id: `${common.id}-fill`,
            type: 'fill',
            kind: 'solid',
            color: background.fill,
            opacity: 1,
            visible: true,
            colorFormat: 'hex',
            defaultColorFormat: 'hex',
            gradient: null
          }
        ]
      },
      pointCount: 0,
      role: 'background'
    })
  }
  const slices: {
    descriptors: (typeof prepared)[number]['descriptor'][]
    pointCount: number
    roles: string[]
  }[] = []
  for (const item of prepared) {
    let slice = slices.at(-1)
    if (
      !slice ||
      slice.descriptors.length >= 32 ||
      slice.pointCount + item.pointCount > 2048
    ) {
      slice = { descriptors: [], pointCount: 0, roles: [] }
      slices.push(slice)
    }
    slice.descriptors.push(item.descriptor)
    slice.pointCount += item.pointCount
    slice.roles.push(item.role)
  }
  return {
    artifactVersion: 1,
    compositionRole: input.compositionRole,
    elementCount: prepared.length,
    groupBounds: target,
    groupDescriptor,
    parent: 'workspace',
    pointCount: prepared.reduce((sum, item) => sum + item.pointCount, 0),
    roleToElementIds,
    skipped: [],
    slices
  }
}
