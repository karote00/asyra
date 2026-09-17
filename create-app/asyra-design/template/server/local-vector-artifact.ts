import { randomUUID } from 'node:crypto'

interface Point {
  x: number
  y: number
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
  rings: Point[][]
  bounds: Bounds
  pointCount: number
}
export interface LocalVectorArtifact {
  imageArtifactId: string
  width: number
  height: number
  paths: VectorPath[]
}
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const invalid = (): never => {
  throw new Error('Invalid vector artifact')
}
const numberPattern = '-?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?'
const tokensPattern = new RegExp(`[MLZ]|${numberPattern}`, 'g')
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
const parseRings = (
  source: string,
  width: number,
  height: number
): Point[][] => {
  if (source.replace(tokensPattern, '').replace(/[,\s]/g, '')) invalid()
  const tokens = source.match(tokensPattern) ?? []
  const rings: Point[][] = []
  let current: Point[] | undefined
  let index = 0
  let command = ''
  while (index < tokens.length) {
    if (/^[MLZ]$/.test(tokens[index])) {
      command = tokens[index++]
      if (command === 'Z') {
        if (!current || current.length === 0) return invalid()
        if (
          current[0].x === current.at(-1)?.x &&
          current[0].y === current.at(-1)?.y
        )
          current.pop()
        if (current.length >= 3) rings.push(current)
        current = undefined
        continue
      }
      if (command === 'M') {
        if (current) invalid()
        current = []
      }
    }
    if (!current || !['M', 'L'].includes(command)) return invalid()
    const x = Number(tokens[index++]),
      y = Number(tokens[index++])
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x < 0 ||
      y < 0 ||
      x > width ||
      y > height
    )
      invalid()
    current.push({ x, y })
    command = 'L'
  }
  if (current) invalid()
  return rings
}

/** Admits only the polygon SVG dialect emitted by the registered VTracer worker. */
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
    const bounds = boundsOf(points)
    if (bounds.width <= 0 || bounds.height <= 0) continue
    paths.push({
      id: `path-${paths.length + 1}`,
      fill: pathAttrs.fill.toUpperCase(),
      rings,
      bounds,
      pointCount: points.length
    })
  }
  if (!paths.length || root[2].replace(pathPattern, '').trim()) invalid()
  return { imageArtifactId: randomUUID(), width, height, paths }
}

export const vectorArtifactSummary = (artifact: LocalVectorArtifact) => ({
  imageArtifactId: artifact.imageArtifactId,
  width: artifact.width,
  height: artifact.height,
  paths: artifact.paths.map(({ id, fill, bounds, pointCount }) => ({
    id,
    fill,
    bounds,
    pointCount
  }))
})

export const LOCAL_VECTOR_REFERENCE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['imageArtifactId', 'bounds', 'compositionRole', 'excludePathIds'],
  properties: {
    imageArtifactId: { type: 'string' },
    compositionRole: { type: 'string', minLength: 1, maxLength: 160 },
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
          'excludePathIds'
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
  const retained = artifact.paths.filter(({ id }) => !excluded.has(id))
  if (!retained.length) invalid()
  const source = boundsOf(
    retained.flatMap(({ bounds: b }) => [
      { x: b.x, y: b.y },
      { x: b.x + b.width, y: b.y + b.height }
    ])
  )
  const mapPoint = (point: Point): Point => ({
    x: target.x + ((point.x - source.x) * target.width) / source.width,
    y: target.y + ((point.y - source.y) * target.height) / source.height
  })
  const base = (type: 'group' | 'vector', name: string, b: Bounds) => {
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
    const rings = path.rings.map((ring) => ring.map(mapPoint))
    const b = boundsOf(rings.flat())
    const common = base('vector', path.id, {
      ...b,
      x: b.x - target.x,
      y: b.y - target.y
    })
    const points: Record<string, unknown> = {},
      segments: Record<string, unknown> = {},
      networks: Record<string, unknown> = {}
    rings.forEach((ring, ringIndex) => {
      const pointIds = ring.map((point, index) => {
        const id = `${common.id}-p-${ringIndex}-${index}`
        points[id] = {
          id,
          kind: 'anchor',
          anchorType: 'sharp',
          handleMode: 'none',
          ...point
        }
        return id
      })
      const segmentIds = pointIds.map((startId, index) => {
        const id = `${common.id}-s-${ringIndex}-${index}`
        segments[id] = {
          id,
          startId,
          endId: pointIds[(index + 1) % pointIds.length],
          outControlId: null,
          inControlId: null
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
        fills: [
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
      },
      pointCount: path.pointCount,
      role: path.id
    }
  })
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
    pointCount: retained.reduce((sum, path) => sum + path.pointCount, 0),
    roleToElementIds,
    skipped: [],
    slices
  }
}
