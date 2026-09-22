import { randomUUID } from 'node:crypto'
import { analyzeVectorComponents } from './local-vector-component-analysis'
import {
  measureVectorPath,
  type LocalVectorArtifact
} from './local-vector-artifact'

type Path = LocalVectorArtifact['paths'][number]
type Anchor = Path['rings'][number][number]
interface Point {
  x: number
  y: number
}
interface Edit {
  anchor: number
  field: 'inControl' | 'outControl'
  value?: Point
}
export const ContourReviewLimits = Object.freeze({
  pathsPerCall: 16,
  segmentsPerPath: 2048,
  proposals: 64,
  generations: 3,
  displacementPx: 0.5,
  smoothAngleDegrees: 30
})
export const CONTOUR_QUALITY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['mode', 'targetSize'],
  properties: {
    mode: { type: 'string', enum: ['faithful', 'cleanup'] },
    targetSize: {
      type: 'object',
      additionalProperties: false,
      required: ['width', 'height'],
      properties: {
        width: { type: 'number', exclusiveMinimum: 0 },
        height: { type: 'number', exclusiveMinimum: 0 }
      }
    }
  }
} as const
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
/** Both limits use drawing pixels, independent of viewport zoom or device DPI. */
export const resolveContourQuality = (
  artifact: LocalVectorArtifact,
  value: unknown
) => {
  if (
    !isRecord(value) ||
    Object.keys(value).length !== 2 ||
    !['faithful', 'cleanup'].includes(String(value.mode)) ||
    !isRecord(value.targetSize) ||
    Object.keys(value.targetSize).length !== 2
  )
    throw new Error('Invalid contour quality policy')
  const { width, height } = value.targetSize
  if (
    typeof width !== 'number' ||
    typeof height !== 'number' ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  )
    throw new Error('Invalid contour output size')
  const frame = artifact.sourceBounds ?? {
    width:
      Math.max(...artifact.paths.map((p) => p.bounds.x + p.bounds.width)) -
      Math.min(...artifact.paths.map((p) => p.bounds.x)),
    height:
      Math.max(...artifact.paths.map((p) => p.bounds.y + p.bounds.height)) -
      Math.min(...artifact.paths.map((p) => p.bounds.y))
  }
  const outputScale = Math.max(width / frame.width, height / frame.height)
  if (!Number.isFinite(outputScale) || outputScale <= 0)
    throw new Error('Invalid contour output scale')
  const outputLimitPx = 0.5
  return {
    mode: value.mode as 'faithful' | 'cleanup',
    targetSize: { width, height },
    outputScale,
    sourceLimitPx: ContourReviewLimits.displacementPx,
    outputLimitPx,
    maxSourceDisplacementPx: Math.min(
      ContourReviewLimits.displacementPx,
      outputLimitPx / outputScale
    )
  }
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
const interpolate = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t
})
const controls = (a: Anchor, b: Anchor) => [
  a.outControl ?? interpolate(a, b, 1 / 3),
  b.inControl ?? interpolate(a, b, 2 / 3)
]
const angle = (a: Point, b: Point) => {
  const lengths = Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y)
  return lengths < 1e-10
    ? null
    : (Math.acos(Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y) / lengths))) *
        180) /
        Math.PI
}
const chordError = (a: Anchor, b: Anchor) => {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    l2 = dx * dx + dy * dy
  if (!l2) return Infinity
  // A cubic is inside its control hull. Projected controls must remain ordered
  // inside the chord so the replacement does not hide a reversing segment.
  const cs = controls(a, b)
  const ts = cs.map((p) => ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2)
  if (ts[0] < 0 || ts[1] > 1 || ts[0] > ts[1]) return Infinity
  return Math.max(...cs.map((p, i) => distance(p, interpolate(a, b, ts[i]))))
}
interface Proposal {
  id: string
  pathId: string
  segmentIndex: number
  kind: 'straighten' | 'smooth-join'
  before: number
  after: number
  displacementBoundPx: number
  location: Point
  edits: Edit[]
}

/** Measurements are candidates, never an artistic decision or raster fidelity score. */
export const reviewVectorContours = (
  artifact: LocalVectorArtifact,
  pathIds: readonly string[],
  signal: AbortSignal
) => {
  signal.throwIfAborted()
  if (
    !pathIds.length ||
    pathIds.length > ContourReviewLimits.pathsPerCall ||
    new Set(pathIds).size !== pathIds.length ||
    pathIds.some((id) => !artifact.paths.some((p) => p.id === id))
  )
    throw new Error('Invalid contour review selection')
  const proposals: Proposal[] = []
  let omittedProposals = 0
  const paths = pathIds.map((pathId) => {
    signal.throwIfAborted()
    const path = artifact.paths.find((p) => p.id === pathId)
    if (!path) throw new Error('Unknown contour path')
    const count = path.rings.reduce((n, r) => n + r.length, 0)
    const complexity =
      count > ContourReviewLimits.segmentsPerPath
        ? 'Contour segment limit exceeded.'
        : null
    const topology = complexity
      ? undefined
      : analyzeVectorComponents(artifact, [pathId], signal).paths[0]
    const limitation = complexity ?? topology?.limitation ?? null
    let cubicSegments = 0,
      tangentBreaks = 0,
      maxTangentAngleDegrees = 0
    const add = (proposal: Omit<Proposal, 'id' | 'pathId'>) => {
      if (proposals.length < ContourReviewLimits.proposals)
        proposals.push({ ...proposal, id: randomUUID(), pathId })
      else omittedProposals++
    }
    if (!limitation) {
      const ring = path.rings[0]
      ring.forEach((a, i) => {
        signal.throwIfAborted()
        const next = (i + 1) % ring.length,
          prev = (i + ring.length - 1) % ring.length
        const b = ring[next],
          p = ring[prev]
        if (a.outControl && b.inControl) {
          cubicSegments++
          const error = chordError(a, b)
          if (error > 1e-6 && error <= ContourReviewLimits.displacementPx)
            add({
              kind: 'straighten',
              segmentIndex: i,
              before: error,
              after: 0,
              displacementBoundPx: error,
              location: interpolate(a, b, 0.5),
              edits: [
                { anchor: i, field: 'outControl' },
                { anchor: next, field: 'inControl' }
              ]
            })
        }
        const [pc, incoming] = controls(p, a),
          [outgoing, nc] = controls(a, b)
        const u = { x: a.x - incoming.x, y: a.y - incoming.y },
          v = { x: outgoing.x - a.x, y: outgoing.y - a.y }
        const degrees = angle(u, v)
        if (degrees === null) return
        maxTangentAngleDegrees = Math.max(maxTangentAngleDegrees, degrees)
        if (degrees > 0.1) tangentBreaks++
        if (degrees <= 0.1 || degrees > ContourReviewLimits.smoothAngleDegrees)
          return
        const lu = Math.hypot(u.x, u.y),
          lv = Math.hypot(v.x, v.y)
        const direction = { x: u.x / lu + v.x / lv, y: u.y / lu + v.y / lv }
        const norm = Math.hypot(direction.x, direction.y)
        const inControl = {
          x: a.x - (direction.x / norm) * lu,
          y: a.y - (direction.y / norm) * lu
        }
        const outControl = {
          x: a.x + (direction.x / norm) * lv,
          y: a.y + (direction.y / norm) * lv
        }
        const deviation = Math.max(
          distance(incoming, inControl),
          distance(outgoing, outControl)
        )
        if (deviation <= ContourReviewLimits.displacementPx)
          add({
            kind: 'smooth-join',
            segmentIndex: i,
            before: degrees,
            after: 0,
            displacementBoundPx: deviation,
            location: { x: a.x, y: a.y },
            edits: [
              { anchor: prev, field: 'outControl', value: pc },
              { anchor: i, field: 'inControl', value: inControl },
              { anchor: i, field: 'outControl', value: outControl },
              { anchor: next, field: 'inControl', value: nc }
            ]
          })
      })
    }
    return {
      pathId,
      limitation,
      segmentCount: count,
      cubicSegments: limitation ? null : cubicSegments,
      tangentBreaks: limitation ? null : tangentBreaks,
      maxTangentAngleDegrees: limitation ? null : maxTangentAngleDegrees,
      signedArea: topology?.contours[0]?.signedArea ?? 0
    }
  })
  return {
    reviewId: randomUUID(),
    imageArtifactId: artifact.imageArtifactId,
    units: 'source pixels; tangent angles in degrees',
    paths,
    proposals,
    omittedProposals,
    requiresVisualReview: true as const
  }
}

/** Receipted edits affect request-local artifacts only; canonical mutation uses existing actions. */
export const applyContourRefinements = (
  source: LocalVectorArtifact,
  original: LocalVectorArtifact,
  review: ReturnType<typeof reviewVectorContours>,
  proposalIds: readonly string[],
  signal: AbortSignal
) => {
  signal.throwIfAborted()
  if (
    review.imageArtifactId !== source.imageArtifactId ||
    !proposalIds.length ||
    proposalIds.length > ContourReviewLimits.proposals ||
    new Set(proposalIds).size !== proposalIds.length
  )
    throw new Error('Invalid contour review receipt')
  const selected = proposalIds.map((id) => {
    const p = review.proposals.find((p) => p.id === id)
    if (!p) throw new Error('Unknown contour proposal')
    return p
  })
  const paths = source.paths.slice(),
    changed = new Map<string, Path>(),
    edits = new Set<string>()
  for (const proposal of selected) {
    signal.throwIfAborted()
    let path = changed.get(proposal.pathId)
    if (!path) {
      const sourcePath = source.paths.find((p) => p.id === proposal.pathId)
      if (!sourcePath) throw new Error('Unknown contour source')
      path = structuredClone(sourcePath)
      changed.set(proposal.pathId, path)
    }
    if (path.rings.length !== 1)
      throw new Error('Compound contour refinement is unavailable')
    for (const edit of proposal.edits) {
      const key = `${proposal.pathId}:${edit.anchor}:${edit.field}`
      if (edits.has(key))
        throw new Error(
          'Overlapping contour proposals; choose a non-overlapping subset'
        )
      edits.add(key)
      if (edit.value) path.rings[0][edit.anchor][edit.field] = { ...edit.value }
      else if (edit.field === 'inControl')
        delete path.rings[0][edit.anchor].inControl
      else delete path.rings[0][edit.anchor].outControl
    }
  }
  let maxDisplacementPx = 0
  for (const [id, path] of changed) {
    const root = original.paths.find((p) => p.id === id)
    if (
      !root ||
      root.rings.length !== 1 ||
      root.rings[0].length !== path.rings[0].length
    )
      throw new Error('Mismatched original contour')
    const ring = path.rings[0],
      before = root.rings[0]
    ring.forEach((a, i) => {
      const next = (i + 1) % ring.length,
        b = ring[next],
        old = before[i],
        end = before[next]
      if (a.x !== old.x || a.y !== old.y)
        throw new Error('Contour anchors must not move')
      const deviation =
        !a.outControl && !b.inControl
          ? chordError(old, end)
          : Math.max(
              ...controls(a, b).map((p, j) =>
                distance(p, controls(old, end)[j])
              )
            )
      if (
        !Number.isFinite(deviation) ||
        deviation > ContourReviewLimits.displacementPx + 1e-9
      )
        throw new Error(
          'Contour displacement exceeds the original-source budget'
        )
      maxDisplacementPx = Math.max(maxDisplacementPx, deviation)
    })
    paths[paths.findIndex((p) => p.id === id)] = measureVectorPath(path)
  }
  const artifact = { ...source, imageArtifactId: randomUUID(), paths }
  // Keep the preparation coordinate frame stable even when curve extrema change.
  if (!artifact.sourceBounds) {
    const x = Math.min(...original.paths.map((p) => p.bounds.x)),
      y = Math.min(...original.paths.map((p) => p.bounds.y))
    artifact.sourceBounds = {
      x,
      y,
      width:
        Math.max(...original.paths.map((p) => p.bounds.x + p.bounds.width)) - x,
      height:
        Math.max(...original.paths.map((p) => p.bounds.y + p.bounds.height)) - y
    }
  }
  const checks = analyzeVectorComponents(artifact, [...changed.keys()], signal)
  for (const check of checks.paths) {
    const previous = review.paths.find((p) => p.pathId === check.pathId)
    if (!previous) throw new Error('Unknown contour evidence')
    if (
      check.limitation ||
      Math.sign(previous.signedArea) !== Math.sign(check.contours[0].signedArea)
    )
      throw new Error('Contour topology validation rejected this refinement')
  }
  signal.throwIfAborted()
  return {
    artifact,
    maxDisplacementPx,
    changes: selected.map(
      ({ id, kind, pathId, segmentIndex, before, after }) => ({
        id,
        kind,
        pathId,
        segmentIndex,
        before,
        after
      })
    ),
    requiresVisualReview: true
  }
}
