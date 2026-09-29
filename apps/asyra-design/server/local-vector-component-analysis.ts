import { randomUUID } from 'node:crypto'
import { LocalComponentAnalysisLimits as limits } from './local-component-analysis-limits'
import type { LocalVectorArtifact } from './local-vector-artifact'

interface Point {
  x: number
  y: number
}
class AnalysisLimitError extends Error {}
const boundaryLimit = 0.01
const areaLimit = 0.02
const midpoint = (a: Point, b: Point): Point => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2
})
const distance = (p: Point, a: Point, b: Point) => {
  const dx = b.x - a.x,
    dy = b.y - a.y
  const length = dx * dx + dy * dy
  const t = length
    ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length))
    : 0
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy)
}
const cross = (a: Point, b: Point, c: Point) =>
  (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)

/** Bounded intersection evidence on the measured contour; no topology repair. */
const hasIntersection = (points: Point[], signal: AbortSignal) => {
  const edges = points
    .map((a, index) => {
      const b = points[(index + 1) % points.length]
      return {
        a,
        b,
        index,
        minX: Math.min(a.x, b.x),
        maxX: Math.max(a.x, b.x),
        minY: Math.min(a.y, b.y),
        maxY: Math.max(a.y, b.y)
      }
    })
    .sort((a, b) => a.minX - b.minX)
  let checks = 0
  for (let i = 0; i < edges.length; i++) {
    if (signal.aborted) throw new Error('Analysis cancelled')
    const a = edges[i]
    for (let j = i + 1; j < edges.length && edges[j].minX <= a.maxX; j++) {
      if (++checks > limits.intersectionChecksPerPath)
        throw new AnalysisLimitError('Analysis complexity limit')
      const b = edges[j]
      const difference = Math.abs(a.index - b.index)
      if (
        difference === 1 ||
        difference === edges.length - 1 ||
        a.maxY < b.minY ||
        b.maxY < a.minY
      )
        continue
      if (
        cross(a.a, a.b, b.a) * cross(a.a, a.b, b.b) <= 0 &&
        cross(b.a, b.b, a.a) * cross(b.a, b.b, a.b) <= 0
      )
        return true
    }
  }
  return false
}

/** Produces request-owned evidence only; the model selects any subsequent conversion. */
export const analyzeVectorComponents = (
  artifact: LocalVectorArtifact,
  pathIds: readonly string[],
  signal: AbortSignal
) => {
  if (signal.aborted) throw new Error('Analysis cancelled')
  if (
    !pathIds.length ||
    pathIds.length > limits.pathsPerJob ||
    new Set(pathIds).size !== pathIds.length ||
    pathIds.some((id) => !artifact.paths.some((path) => path.id === id))
  )
    throw new Error('Invalid analysis selection')
  const paths = pathIds.map((id) => {
    const path = artifact.paths.find((entry) => entry.id === id)
    if (!path) throw new Error('Unknown analysis path')
    const { x, y, width, height } = path.bounds
    const scale = Math.min(width, height)
    const tolerance = scale * 0.0001
    try {
      let count = 0
      const rings = path.rings.map((ring) => {
        const points: Point[] = []
        const push = (point: Point) => {
          if (++count > limits.samplesPerPath)
            throw new AnalysisLimitError('Analysis sample limit')
          if (signal.aborted) throw new Error('Analysis cancelled')
          points.push({ x: point.x, y: point.y })
        }
        const flatten = (
          a: Point,
          b: Point,
          c: Point,
          d: Point,
          depth: number
        ): void => {
          if (Math.max(distance(b, a, d), distance(c, a, d)) <= tolerance) {
            push(d)
            return
          }
          if (depth >= 16)
            throw new AnalysisLimitError('Analysis precision limit')
          const ab = midpoint(a, b),
            bc = midpoint(b, c),
            cd = midpoint(c, d)
          const abc = midpoint(ab, bc),
            bcd = midpoint(bc, cd),
            center = midpoint(abc, bcd)
          flatten(a, ab, abc, center, depth + 1)
          flatten(center, bcd, cd, d, depth + 1)
        }
        push(ring[0])
        ring.forEach((a, index) => {
          const b = ring[(index + 1) % ring.length]
          if (a.outControl && b.inControl)
            flatten(a, a.outControl, b.inControl, b, 0)
          else push(b)
        })
        points.pop() // The closing endpoint is the first point, not another edge.
        return points
      })
      const area = (points: Point[]) =>
        points.reduce((sum, a, index) => {
          const b = points[(index + 1) % points.length]
          return sum + a.x * b.y - b.x * a.y
        }, 0) / 2
      const contours = rings.map((points, index) => {
        const xs = points.map((p) => p.x),
          ys = points.map((p) => p.y)
        const minX = Math.min(...xs),
          minY = Math.min(...ys)
        return {
          id: `${id}:contour-${index + 1}`,
          bounds: {
            x: minX,
            y: minY,
            width: Math.max(...xs) - minX,
            height: Math.max(...ys) - minY
          },
          signedArea: area(points),
          sampleCount: points.length
        }
      })
      let limitation: string | null = null
      if (rings.length !== 1)
        limitation =
          'Compound artwork requires decomposition before whole-path conversion; contour splitting is not registered.'
      else if (hasIntersection(rings[0], signal))
        limitation =
          'Self-intersecting contours cannot be replaced as a whole primitive.'
      else if (Math.abs(contours[0].signedArea) <= width * height * 1e-8)
        limitation = 'Degenerate contour cannot be converted.'
      const candidates = (['oval', 'rect'] as const).map((componentType) => {
        let maxDeviation = 0
        // Include line interiors as well as vertices; corners alone cannot prove a fit.
        for (const points of rings) {
          points.forEach((a, index) => {
            const b = points[(index + 1) % points.length]
            for (let sample = 0; sample <= 8; sample++) {
              const px = a.x + ((b.x - a.x) * sample) / 8
              const py = a.y + ((b.y - a.y) * sample) / 8
              let deviation: number
              if (componentType === 'rect')
                deviation = Math.min(
                  Math.abs(px - x),
                  Math.abs(px - x - width),
                  Math.abs(py - y),
                  Math.abs(py - y - height)
                )
              else {
                const dx = px - x - width / 2,
                  dy = py - y - height / 2
                const radius = Math.hypot((2 * dx) / width, (2 * dy) / height)
                deviation =
                  radius === 0
                    ? scale / 2
                    : Math.hypot(dx, dy) * Math.abs(1 - 1 / radius)
              }
              maxDeviation = Math.max(maxDeviation, deviation)
            }
          })
        }
        const expectedArea =
          componentType === 'oval'
            ? (Math.PI * width * height) / 4
            : width * height
        const relativeAreaDifference =
          Math.abs(
            Math.abs(
              contours.reduce((sum, contour) => sum + contour.signedArea, 0)
            ) - expectedArea
          ) / expectedArea
        const relativeBoundaryDeviation = (maxDeviation + tolerance) / scale
        const eligible =
          !limitation &&
          relativeBoundaryDeviation <= boundaryLimit &&
          relativeAreaDifference <= areaLimit
        return {
          componentType,
          eligible,
          relativeBoundaryDeviation,
          relativeAreaDifference,
          reason:
            limitation ??
            (eligible
              ? 'Within geometric fit limits; AI must still assess intent and review the rendered result.'
              : 'Shape deviation exceeds the conversion limits; preserve the vector or choose another supported operation.')
        }
      })
      return {
        pathId: id,
        fill: path.fill,
        bounds: path.bounds,
        contours: contours.slice(0, limits.contourSummariesPerPath),
        contourCount: path.rings.length,
        contoursTruncated: contours.length > limits.contourSummariesPerPath,
        samplingTolerance: tolerance,
        limitation,
        candidates
      }
    } catch (error) {
      if (!(error instanceof AnalysisLimitError)) throw error
      const limitation = `${error.message}; no conversion was approved. Preserve this vector or analyze a simpler supported selection.`
      return {
        pathId: id,
        fill: path.fill,
        bounds: path.bounds,
        contours: [],
        contourCount: path.rings.length,
        contoursTruncated: true,
        samplingTolerance: tolerance,
        limitation,
        candidates: (['oval', 'rect'] as const).map((componentType) => ({
          componentType,
          eligible: false,
          relativeBoundaryDeviation: null,
          relativeAreaDifference: null,
          reason: limitation
        }))
      }
    }
  })
  return {
    analysisId: randomUUID(),
    imageArtifactId: artifact.imageArtifactId,
    units: 'source pixels',
    limits: {
      relativeBoundaryDeviation: boundaryLimit,
      relativeAreaDifference: areaLimit
    },
    requiresVisualReview: true,
    paths
  }
}
