import { TEXT_PROPERTY_SCHEMA } from '@asyra/preset'
import {
  DesignPreparationLimits as limits,
  PREPARED_DESIGN_VERSION,
  type PreparedDesign
} from './prepared-design'

const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
function check(value: unknown): asserts value {
  if (!value) throw new Error('Prepared design is invalid.')
}
const finite = (v: unknown, maximum = limits.dimension * (limits.depth + 2)) =>
  typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= maximum
const keysOnly = (v: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(v).every((k) => keys.includes(k))
const vectorFields = [
  'points',
  'segments',
  'networks',
  'closed',
  'pointCoordinateSpace',
  'fillRule'
]
const textFields = TEXT_PROPERTY_SCHEMA.fields.map((f) => f.key)

function validateVector(d: Record<string, unknown>): number {
  check(
    d.closed === true &&
      d.pointCoordinateSpace === 'workspace' &&
      d.fillRule === 'nonzero'
  )
  const { points, segments, networks } = d
  check(record(points) && record(segments) && record(networks))
  const pointKeys = Object.keys(points),
    segmentKeys = Object.keys(segments),
    networkKeys = Object.keys(networks)
  check(pointKeys.length > 0 && pointKeys.length <= limits.pathCommands)
  check(
    segmentKeys.length <= pointKeys.length &&
      networkKeys.length > 0 &&
      networkKeys.length <= pointKeys.length
  )
  const usedPoints = new Set<string>(),
    usedSegments = new Set<string>()
  for (const [id, p] of Object.entries(points)) {
    check(
      record(p) &&
        p.id === id &&
        id.startsWith(`${d.id}-p-`) &&
        finite(p.x) &&
        finite(p.y)
    )
    if (p.kind === 'anchor') {
      check(
        keysOnly(p, ['id', 'kind', 'x', 'y', 'anchorType', 'handleMode']) &&
          p.anchorType === 'sharp' &&
          p.handleMode === 'none'
      )
    } else {
      check(
        p.kind === 'control' &&
          keysOnly(p, ['id', 'kind', 'x', 'y', 'controlForId', 'controlRole'])
      )
      check(
        typeof p.controlForId === 'string' &&
          (p.controlRole === 'in' || p.controlRole === 'out')
      )
    }
  }
  for (const [id, n] of Object.entries(networks)) {
    check(
      record(n) &&
        n.id === id &&
        id.startsWith(`${d.id}-n-`) &&
        n.closed === true
    )
    check(keysOnly(n, ['id', 'pointIds', 'segmentIds', 'closed']))
    check(
      Array.isArray(n.pointIds) &&
        n.pointIds.length >= 2 &&
        Array.isArray(n.segmentIds) &&
        n.segmentIds.length === n.pointIds.length
    )
    for (let i = 0; i < n.pointIds.length; i++) {
      const startId = n.pointIds[i],
        endId = n.pointIds[(i + 1) % n.pointIds.length],
        segmentId = n.segmentIds[i]
      check(
        typeof startId === 'string' &&
          typeof endId === 'string' &&
          typeof segmentId === 'string'
      )
      const p = points[startId],
        s = segments[segmentId]
      check(record(p) && p.kind === 'anchor' && !usedPoints.has(startId))
      check(
        record(s) &&
          s.id === segmentId &&
          segmentId.startsWith(`${d.id}-s-`) &&
          !usedSegments.has(segmentId)
      )
      check(
        keysOnly(s, [
          'id',
          'startId',
          'endId',
          'outControlId',
          'inControlId'
        ]) &&
          s.startId === startId &&
          s.endId === endId
      )
      check((s.outControlId === null) === (s.inControlId === null))
      usedPoints.add(startId)
      usedSegments.add(segmentId)
      for (const [controlId, anchorId, role] of [
        [s.outControlId, startId, 'out'],
        [s.inControlId, endId, 'in']
      ]) {
        if (controlId === null) continue
        check(typeof controlId === 'string')
        const c = points[controlId]
        check(
          record(c) &&
            c.kind === 'control' &&
            c.controlForId === anchorId &&
            c.controlRole === role &&
            !usedPoints.has(controlId)
        )
        usedPoints.add(controlId)
      }
    }
  }
  check(
    usedPoints.size === pointKeys.length &&
      usedSegments.size === segmentKeys.length
  )
  return pointKeys.length
}

/** Wire admission only: consumes prepared geometry without recomputing it. */
export function admitPreparedDesign(input: unknown): PreparedDesign {
  check(
    record(input) &&
      keysOnly(input, ['version', 'rootId', 'entries', 'keyToId', 'findings'])
  )
  check(
    input.version === PREPARED_DESIGN_VERSION &&
      typeof input.rootId === 'string'
  )
  check(
    Array.isArray(input.entries) &&
      input.entries.length > 0 &&
      input.entries.length <= limits.nodes
  )
  check(
    record(input.keyToId) &&
      Object.keys(input.keyToId).length === input.entries.length
  )
  check(
    Array.isArray(input.findings) && input.findings.length <= limits.nodes * 2
  )
  const parents = new Map<string, { type: string; depth: number }>(),
    semanticKeys = new Set<string>(),
    identities = new Set<string>()
  let pointCount = 0,
    textCount = 0
  const claim = (id: unknown) => {
    check(
      typeof id === 'string' &&
        id.length > 0 &&
        id.length <= 256 &&
        !identities.has(id)
    )
    identities.add(id)
  }
  for (let index = 0; index < input.entries.length; index++) {
    const entry = input.entries[index]
    check(
      record(entry) &&
        keysOnly(entry, ['key', 'parentId', 'descriptor']) &&
        record(entry.descriptor)
    )
    const d = entry.descriptor
    check(
      typeof entry.key === 'string' &&
        entry.key.length > 0 &&
        entry.key.length <= 160 &&
        !semanticKeys.has(entry.key)
    )
    semanticKeys.add(entry.key)
    check(input.keyToId[entry.key] === d.id)
    claim(d.id)
    check(
      typeof d.type === 'string' &&
        ['frame', 'rect', 'oval', 'text', 'vector'].includes(d.type)
    )
    check(
      typeof d.name === 'string' &&
        d.name.trim() &&
        d.name.length <= 160 &&
        d.lock === false &&
        d.visible === true
    )
    check(
      finite(d.x) &&
        finite(d.y) &&
        finite(d.width, limits.dimension) &&
        Number(d.width) > 0 &&
        finite(d.height, limits.dimension) &&
        Number(d.height) > 0
    )
    let depth = 1
    if (index === 0)
      check(
        entry.parentId === null &&
          d.type === 'frame' &&
          d.id === input.rootId &&
          entry.key === '$root'
      )
    else {
      check(typeof entry.parentId === 'string')
      const parent = parents.get(entry.parentId)
      check(parent && parent.type === 'frame' && parent.depth < limits.depth)
      depth = parent.depth + 1
    }
    const props = ['position', 'dimension']
    const fields = [
      'id',
      'type',
      'name',
      'x',
      'y',
      'width',
      'height',
      'visible',
      'lock',
      'props'
    ]
    if (d.type === 'text') {
      props.push('typography')
      fields.push(...textFields)
      for (const f of TEXT_PROPERTY_SCHEMA.fields) check(f.validate?.(d[f.key]))
      textCount += String(d.text).length
      check(textCount <= limits.textCharacters)
    } else {
      props.push('fills')
      fields.push('fills')
      check(Array.isArray(d.fills) && d.fills.length <= 1)
      for (const f of d.fills) {
        check(
          record(f) &&
            keysOnly(f, [
              'id',
              'type',
              'kind',
              'color',
              'opacity',
              'visible',
              'colorFormat',
              'defaultColorFormat',
              'gradient'
            ])
        )
        check(
          f.id === `${d.id}-fill` &&
            f.type === 'fill' &&
            f.kind === 'solid' &&
            f.opacity === 1 &&
            f.visible === true
        )
        check(
          typeof f.color === 'string' &&
            /^#[0-9a-f]{6}$/i.test(f.color) &&
            f.colorFormat === 'hex' &&
            f.defaultColorFormat === 'hex' &&
            f.gradient === null
        )
        claim(f.id)
      }
      if (d.type === 'frame') {
        fields.push('children')
        check(Array.isArray(d.children) && d.children.length === 0)
      } else {
        props.push('strokes')
        fields.push('strokes')
        check(Array.isArray(d.strokes) && d.strokes.length === 0)
      }
    }
    if (d.type === 'vector') {
      props.push(...vectorFields)
      fields.push(...vectorFields)
      pointCount += validateVector(d)
      for (const field of ['points', 'segments', 'networks']) {
        const nodes = d[field]
        check(record(nodes))
        Object.keys(nodes).forEach(claim)
      }
      check(pointCount <= limits.pathCommands)
    }
    check(
      keysOnly(d, fields) &&
        record(d.props) &&
        Object.keys(d.props).length === props.length
    )
    for (const p of props) {
      check(d.props[p] === `${d.id}-${p}`)
      claim(d.props[p])
    }
    parents.set(String(d.id), { type: d.type, depth })
  }
  for (const f of input.findings) {
    check(record(f) && typeof f.key === 'string' && semanticKeys.has(f.key))
    if (f.kind === 'text-metrics-required') check(keysOnly(f, ['kind', 'key']))
    else {
      check(
        f.kind === 'overflow' &&
          keysOnly(f, ['kind', 'key', 'left', 'top', 'right', 'bottom'])
      )
      for (const k of ['left', 'top', 'right', 'bottom'])
        check(finite(f[k]) && Number(f[k]) >= 0)
    }
  }
  return structuredClone(input) as unknown as PreparedDesign
}
