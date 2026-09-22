import { randomUUID } from 'node:crypto'
import {
  measureVectorPath,
  type LocalVectorArtifact
} from './local-vector-artifact'
import {
  DesignPreparationLimits as limits,
  DesignTextDefaults,
  DesignTextValidators,
  PREPARED_DESIGN_VERSION,
  type PreparedDesign,
  type PreparedDesignEntry,
  type DesignFinding
} from '../src/ai/prepared-design'

type NodeKind = 'frame' | 'rect' | 'oval' | 'text' | 'vector'
type IllustrationRings = LocalVectorArtifact['paths'][number]['rings']
type Layout = 'absolute' | 'row' | 'column' | 'grid'
type DraftNode = Record<string, unknown> & {
  key: string
  name: string
  type: NodeKind
  width: number
  height: number
  x: number
  y: number
  padding: number
  gap: number
  columns: number
  layout: Layout
  align: 'start' | 'center' | 'end'
  children: DraftNode[]
  rings?: IllustrationRings
}
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const fail = (message: string): never => {
  throw new Error(`Invalid design: ${message}`)
}
const finite = (value: unknown, name: string, minimum = 0): number => {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > limits.dimension
  )
    return fail(name)
  return value
}
const textKeys = Object.keys(DesignTextDefaults)
const commonKeys = ['key', 'name', 'type', 'width', 'height', 'x', 'y', 'fill']
const containerKeys = [
  'children',
  'padding',
  'gap',
  'layout',
  'columns',
  'align'
]
const freeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}

const admitDraft = (input: unknown): DraftNode => {
  let count = 0,
    characters = 0,
    pathPoints = 0
  const keys = new Set<string>()
  const admit = (
    source: unknown,
    depth: number,
    parentLayout: Layout,
    root = false
  ): DraftNode => {
    if (!record(source) || depth > limits.depth || ++count > limits.nodes)
      return fail('node/depth limit')
    const type = root ? 'frame' : source.type
    if (!['frame', 'rect', 'oval', 'text', 'vector'].includes(String(type)))
      return fail('unsupported component')
    const allowed = [
      ...commonKeys.filter((key) => type !== 'text' || key !== 'fill'),
      ...(type === 'frame' ? containerKeys : []),
      ...(type === 'text' ? textKeys : []),
      ...(type === 'vector' ? ['rings'] : [])
    ]
    if (Object.keys(source).some((key) => !allowed.includes(key)))
      return fail('unknown field')
    if (root && (source.type !== undefined || source.key !== undefined))
      return fail('root identity is server-owned')
    const key = root ? '$root' : source.key
    if (
      typeof key !== 'string' ||
      !key.trim() ||
      key.length > 160 ||
      keys.has(key)
    )
      return fail('duplicate or invalid key')
    keys.add(key)
    if (
      typeof source.name !== 'string' ||
      !source.name.trim() ||
      source.name.length > 160
    )
      return fail('name')
    if (
      parentLayout !== 'absolute' &&
      (source.x !== undefined || source.y !== undefined)
    )
      return fail('flow child position')
    if (
      source.fill !== undefined &&
      (typeof source.fill !== 'string' || !/^#[0-9a-f]{6}$/i.test(source.fill))
    )
      return fail('fill')
    if (type === 'text') {
      if (typeof source.text !== 'string') return fail('missing text')
      characters += source.text.length
      if (characters > limits.textCharacters) return fail('text limit')
      for (const [key, validate] of Object.entries(DesignTextValidators)) {
        if (source[key] !== undefined && !validate(source[key]))
          return fail(`text ${key}`)
      }
    }
    if (type === 'vector') {
      if (!Array.isArray(source.rings) || !source.rings.length)
        return fail('missing vector rings')
      const admitPoint = (value: unknown) => {
        if (
          !record(value) ||
          Object.keys(value).some((k) => !['x', 'y'].includes(k))
        )
          return fail('vector control')
        finite(value.x, 'vector x')
        finite(value.y, 'vector y')
        if (++pathPoints > limits.pathCommands)
          return fail('vector point limit')
      }
      for (const ring of source.rings) {
        if (!Array.isArray(ring) || ring.length < 2) return fail('vector ring')
        for (const anchor of ring) {
          if (
            !record(anchor) ||
            Object.keys(anchor).some(
              (k) => !['x', 'y', 'inControl', 'outControl'].includes(k)
            )
          )
            return fail('vector anchor')
          admitPoint({ x: anchor.x, y: anchor.y })
          if (anchor.inControl !== undefined) admitPoint(anchor.inControl)
          if (anchor.outControl !== undefined) admitPoint(anchor.outControl)
        }
        ring.forEach((anchor, index) => {
          const next = ring[(index + 1) % ring.length]
          if (
            (anchor.outControl !== undefined) !==
            (next.inControl !== undefined)
          )
            fail('unpaired cubic controls')
        })
      }
    }
    const layout = source.layout ?? 'absolute'
    if (!['absolute', 'row', 'column', 'grid'].includes(String(layout)))
      return fail('layout')
    const align = source.align ?? 'start'
    if (!['start', 'center', 'end'].includes(String(align)))
      return fail('alignment')
    const columns = source.columns ?? 1
    if (
      !Number.isInteger(columns) ||
      Number(columns) < 1 ||
      Number(columns) > 24 ||
      (source.columns !== undefined && layout !== 'grid')
    )
      return fail('grid columns')
    if (source.children !== undefined && !Array.isArray(source.children))
      return fail('children')
    return {
      ...source,
      key,
      type: type as NodeKind,
      name: source.name,
      width: finite(source.width, 'width', Number.MIN_VALUE),
      height: finite(source.height, 'height', Number.MIN_VALUE),
      x: finite(source.x ?? 0, 'x'),
      y: finite(source.y ?? 0, 'y'),
      padding: finite(source.padding ?? 0, 'padding'),
      gap: finite(source.gap ?? 0, 'gap'),
      columns: Number(columns),
      layout: layout as Layout,
      align: align as DraftNode['align'],
      children: ((source.children ?? []) as unknown[]).map((child) =>
        admit(child, depth + 1, layout as Layout)
      )
    }
  }
  return admit(input, 1, 'absolute', true)
}

export const prepareDesign = (
  input: unknown,
  identity: string = randomUUID()
): PreparedDesign => {
  const root = admitDraft(input)
  const entries: PreparedDesignEntry[] = [],
    findings: DesignFinding[] = []
  const keyToId: Record<string, string> = Object.create(null)
  let ordinal = 0
  const visit = (
    node: DraftNode,
    parentId: string | null,
    x: number,
    y: number,
    parentX = 0,
    parentY = 0
  ) => {
    const id = `design-${identity}-${ordinal++}`
    keyToId[node.key] = id
    const propertyNames =
      node.type === 'text'
        ? ['position', 'dimension', 'typography']
        : [
            'position',
            'dimension',
            'fills',
            ...(node.type === 'frame' ? [] : ['strokes'])
          ]
    const descriptor = {
      id,
      type: node.type,
      name: node.name,
      x,
      y,
      width: node.width,
      height: node.height,
      visible: true,
      lock: false,
      props: Object.fromEntries(
        propertyNames.map((name) => [name, `${id}-${name}`])
      ),
      ...(node.type === 'frame' ? { children: [] } : {}),
      ...(node.type === 'text'
        ? Object.fromEntries(
            textKeys.map((key) => [
              key,
              node[key] ??
                DesignTextDefaults[key as keyof typeof DesignTextDefaults]
            ])
          )
        : {
            fills:
              typeof node.fill === 'string'
                ? [
                    {
                      id: `${id}-fill`,
                      type: 'fill',
                      kind: 'solid',
                      color: node.fill,
                      opacity: 1,
                      visible: true,
                      colorFormat: 'hex',
                      defaultColorFormat: 'hex',
                      gradient: null
                    }
                  ]
                : [],
            ...(node.type === 'frame' ? {} : { strokes: [] })
          })
    } as PreparedDesignEntry['descriptor']
    if (node.type === 'vector') {
      const rings = node.rings
      if (!rings) return fail('missing vector rings')
      const measured = measureVectorPath({
        id,
        fill: String(node.fill ?? '#000000'),
        rings,
        bounds: { x: 0, y: 0, width: node.width, height: node.height },
        pointCount: 0
      })
      const b = measured.bounds
      if (
        b.width <= 0 ||
        b.height <= 0 ||
        b.x < 0 ||
        b.y < 0 ||
        b.x + b.width > node.width ||
        b.y + b.height > node.height
      )
        fail('vector exceeds declared bounds')
      const points: Record<string, unknown> = {},
        segments: Record<string, unknown> = {},
        networks: Record<string, unknown> = {}
      const workspacePoint = (p: { x: number; y: number }) => ({
        x: parentX + x + p.x,
        y: parentY + y + p.y
      })
      rings.forEach((ring, ringIndex) => {
        const pointIds = ring.map((anchor, index) => {
          const pointId = `${id}-p-${ringIndex}-${index}`
          points[pointId] = {
            id: pointId,
            kind: 'anchor',
            anchorType: 'sharp',
            handleMode: 'none',
            ...workspacePoint(anchor)
          }
          return pointId
        })
        const control = (
          p: { x: number; y: number } | undefined,
          anchorId: string,
          role: 'in' | 'out'
        ) => {
          if (!p) return null
          const controlId = `${anchorId}-${role}`
          points[controlId] = {
            id: controlId,
            kind: 'control',
            controlForId: anchorId,
            controlRole: role,
            ...workspacePoint(p)
          }
          return controlId
        }
        const segmentIds = ring.map((anchor, index) => {
          const next = (index + 1) % ring.length
          const segmentId = `${id}-s-${ringIndex}-${index}`
          segments[segmentId] = {
            id: segmentId,
            startId: pointIds[index],
            endId: pointIds[next],
            outControlId: control(anchor.outControl, pointIds[index], 'out'),
            inControlId: control(ring[next].inControl, pointIds[next], 'in')
          }
          return segmentId
        })
        const networkId = `${id}-n-${ringIndex}`
        networks[networkId] = {
          id: networkId,
          pointIds,
          segmentIds,
          closed: true
        }
      })
      Object.assign(descriptor, {
        x: x + b.x,
        y: y + b.y,
        width: b.width,
        height: b.height,
        points,
        segments,
        networks,
        closed: true,
        pointCoordinateSpace: 'workspace',
        fillRule: 'nonzero',
        props: {
          ...descriptor.props,
          ...Object.fromEntries(
            [
              'points',
              'segments',
              'networks',
              'closed',
              'pointCoordinateSpace',
              'fillRule'
            ].map((key) => [key, `${id}-${key}`])
          )
        }
      })
    }
    entries.push({ key: node.key, parentId, descriptor })
    if (node.type === 'text')
      findings.push({ kind: 'text-metrics-required', key: node.key })
    const columnWidths = Array.from({ length: node.columns }, (_, column) =>
      Math.max(
        0,
        ...node.children
          .filter((_, index) => index % node.columns === column)
          .map((child) => child.width)
      )
    )
    const rowHeights = Array.from(
      { length: Math.ceil(node.children.length / node.columns) },
      (_, row) =>
        Math.max(
          0,
          ...node.children
            .slice(row * node.columns, (row + 1) * node.columns)
            .map((child) => child.height)
        )
    )
    let cursor = node.padding
    node.children.forEach((child, index) => {
      let cx = child.x,
        cy = child.y
      const alignOffset = (available: number) => {
        if (node.align === 'center') return available / 2
        if (node.align === 'end') return available
        return 0
      }
      if (node.layout === 'row') {
        cx = cursor
        cy =
          node.padding +
          alignOffset(node.height - node.padding * 2 - child.height)
        cursor += child.width + node.gap
      }
      if (node.layout === 'column') {
        cy = cursor
        cx =
          node.padding +
          alignOffset(node.width - node.padding * 2 - child.width)
        cursor += child.height + node.gap
      }
      if (node.layout === 'grid') {
        const column = index % node.columns,
          row = Math.floor(index / node.columns)
        cx =
          node.padding +
          columnWidths
            .slice(0, column)
            .reduce((sum, value) => sum + value + node.gap, 0)
        cy =
          node.padding +
          rowHeights
            .slice(0, row)
            .reduce((sum, value) => sum + value + node.gap, 0)
      }
      const overflow = {
        left: Math.max(0, -cx),
        top: Math.max(0, -cy),
        right: Math.max(0, cx + child.width - node.width),
        bottom: Math.max(0, cy + child.height - node.height)
      }
      if (Object.values(overflow).some((value) => value > 0))
        findings.push({ kind: 'overflow', key: child.key, ...overflow })
      visit(child, id, cx, cy, parentX + x, parentY + y)
    })
  }
  visit(root, null, root.x, root.y)
  return freeze({
    version: PREPARED_DESIGN_VERSION,
    rootId: entries[0].descriptor.id,
    entries,
    keyToId,
    findings
  })
}

export const createDesignPreparationSession = (
  compile: typeof prepareDesign = prepareDesign
) => {
  const artifacts = new Map<string, PreparedDesign>()
  return {
    prepare(input: unknown) {
      if (artifacts.size >= limits.artifacts)
        throw new Error('Design preparation limit reached')
      const artifactId = randomUUID()
      const artifact = compile(input, artifactId)
      artifacts.set(artifactId, artifact)
      return {
        artifactId,
        elementCount: artifact.entries.length,
        findings: artifact.findings
      }
    },
    resolve(artifactId: string): PreparedDesign {
      const artifact = artifacts.get(artifactId)
      if (!artifact)
        throw new Error('Design artifact is unavailable in this request')
      return artifact
    }
  }
}
