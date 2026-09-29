import { describe, expect, it } from 'vitest'
import { parseLocalVectorArtifact } from '../local-vector-artifact'
import {
  reviewVectorContours,
  resolveContourQuality,
  applyContourRefinements
} from '../local-vector-contour-review'

const required = <T>(value: T | undefined): T => {
  if (value === undefined) throw new Error('Missing expected proposal')
  return value
}
const signal = () => new AbortController().signal
const artifact = (d: string) =>
  parseLocalVectorArtifact(
    `<svg width="100" height="100"><path fill="#008800" d="${d}"/></svg>`
  )
const nearStraight = () => artifact('M10,10C30,10.2 70,10.2 90,10L90,90L10,90Z')

describe('backend contour quality', () => {
  it('measures and straightens a bowed edge without moving anchors or changing the source', () => {
    const source = nearStraight()
    const before = JSON.stringify(source)
    const review = reviewVectorContours(source, ['path-1'], signal())
    const proposal = required(
      review.proposals.find((p) => p.kind === 'straighten')
    )
    expect(proposal).toBeDefined()
    expect(proposal.before).toBeGreaterThan(0)
    expect(proposal.after).toBe(0)
    const result = applyContourRefinements(
      source,
      source,
      review,
      [proposal.id],
      signal()
    )
    expect(result.artifact.paths[0].rings[0][0].outControl).toBeUndefined()
    expect(result.maxDisplacementPx).toBeLessThanOrEqual(0.5)
    expect(result.artifact.paths[0].fill).toBe(source.paths[0].fill)
    expect(JSON.stringify(source)).toBe(before)
  })
  it('improves a shallow tangent break but never proposes smoothing a sharp corner', () => {
    const source = artifact(
      'M10,50C20,30 35,39.8 50,40C65,40.6 80,30 90,50L90,90L10,90Z'
    )
    const review = reviewVectorContours(source, ['path-1'], signal())
    const smooth = required(
      review.proposals.find((p) => p.kind === 'smooth-join')
    )
    expect(smooth).toBeDefined()
    expect(smooth.after).toBeLessThan(smooth.before)
    expect(
      review.proposals
        .filter((p) => p.kind === 'smooth-join')
        .every((p) => p.before <= 30)
    ).toBe(true)
    expect(() =>
      applyContourRefinements(source, source, review, [smooth.id], signal())
    ).not.toThrow()
  })
  it('does not approve broad bends, compound paths or degenerate contours', () => {
    const source = artifact('M10,10C30,30 70,30 90,10L90,90L10,90Z')
    expect(
      reviewVectorContours(source, ['path-1'], signal()).proposals.some(
        (p) => p.kind === 'straighten' && p.segmentIndex === 0
      )
    ).toBe(false)
    const compound = artifact(
      'M10,10L90,10L90,90L10,90ZM30,30L30,60L60,60L60,30Z'
    )
    const review = reviewVectorContours(compound, ['path-1'], signal())
    expect(review.proposals).toHaveLength(0)
    expect(review.paths[0].limitation).toMatch(/Compound/)
  })
  it('rejects foreign receipts, duplicate proposals, unknown selections and cancellation', () => {
    const source = nearStraight()
    const review = reviewVectorContours(source, ['path-1'], signal())
    const id = review.proposals[0].id
    expect(() =>
      applyContourRefinements(nearStraight(), source, review, [id], signal())
    ).toThrow()
    expect(() =>
      applyContourRefinements(source, source, review, [id, id], signal())
    ).toThrow()
    expect(() =>
      applyContourRefinements(source, source, review, ['forged'], signal())
    ).toThrow()
    const c = new AbortController()
    c.abort()
    expect(() => reviewVectorContours(source, ['path-1'], c.signal)).toThrow()
    expect(() =>
      applyContourRefinements(source, source, review, [id], c.signal)
    ).toThrow()
  })
  it('bounds drift against the original source, even when a later proposal looks locally small', () => {
    const source = nearStraight()
    const current = structuredClone(source)
    current.imageArtifactId = 'later'
    current.paths[0].rings[0][0].y += 2
    const review = reviewVectorContours(current, ['path-1'], signal())
    expect(() =>
      applyContourRefinements(
        current,
        source,
        review,
        [review.proposals[0].id],
        signal()
      )
    ).toThrow()
  })
  it('does not accumulate individually small handle changes beyond the root budget', () => {
    const root = artifact('M10,10C30,10.8 70,10.8 90,10L90,90L10,90Z')
    const current = artifact('M10,10C30,10.4 70,10.4 90,10L90,90L10,90Z')
    const review = reviewVectorContours(current, ['path-1'], signal())
    const proposal = required(
      review.proposals.find((p) => p.kind === 'straighten')
    )
    expect(() =>
      applyContourRefinements(current, root, review, [proposal.id], signal())
    ).toThrow(/budget/)
  })
  it('converges instead of proposing the same straightening repeatedly', () => {
    const source = nearStraight()
    const review = reviewVectorContours(source, ['path-1'], signal())
    const proposal = required(
      review.proposals.find((p) => p.kind === 'straighten')
    )
    const result = applyContourRefinements(
      source,
      source,
      review,
      [proposal.id],
      signal()
    )
    expect(
      reviewVectorContours(result.artifact, ['path-1'], signal()).proposals
    ).toHaveLength(0)
  })
  it('preserves sharp polygon corners and reports self-intersections without edits', () => {
    const square = artifact('M10,10L90,10L90,90L10,90Z')
    expect(
      reviewVectorContours(square, ['path-1'], signal()).proposals
    ).toHaveLength(0)
    const crossed = artifact('M10,10L90,90L10,90L90,10Z')
    const report = reviewVectorContours(crossed, ['path-1'], signal())
    expect(report.proposals).toHaveLength(0)
    expect(report.paths[0].limitation).toMatch(/intersect/)
  })
  it('rejects overlapping edits before publishing a partially refined artifact', () => {
    const source = artifact('M10,10C20,10.1 30,10.1 40,10L70,10.1L90,90L10,90Z')
    const review = reviewVectorContours(source, ['path-1'], signal())
    const straight = required(
      review.proposals.find((p) => p.kind === 'straighten')
    )
    const smooth = required(
      review.proposals.find(
        (p) => p.kind === 'smooth-join' && p.segmentIndex === 1
      )
    )
    expect(straight).toBeDefined()
    expect(smooth).toBeDefined()
    const before = JSON.stringify(source)
    expect(() =>
      applyContourRefinements(
        source,
        source,
        review,
        [straight.id, smooth.id],
        signal()
      )
    ).toThrow(/Overlapping/)
    expect(JSON.stringify(source)).toBe(before)
  })
  it('uses both source and final drawing limits, including nonuniform enlargement and reduction', () => {
    const source = nearStraight()
    expect(
      resolveContourQuality(source, {
        mode: 'cleanup',
        targetSize: { width: 160, height: 80 }
      })
    ).toMatchObject({ outputScale: 2, maxSourceDisplacementPx: 0.25 })
    expect(
      resolveContourQuality(source, {
        mode: 'cleanup',
        targetSize: { width: 20, height: 20 }
      })
    ).toMatchObject({ outputScale: 0.25, maxSourceDisplacementPx: 0.5 })
  })
  it.each([
    undefined,
    {},
    { mode: 'other', targetSize: { width: 80, height: 80 } },
    { mode: 'cleanup', targetSize: { width: 0, height: 80 } },
    { mode: 'cleanup', targetSize: { width: Infinity, height: 80 } },
    { mode: 'cleanup', targetSize: { width: 80, height: 80, extra: true } },
    { mode: 'cleanup', targetSize: { width: 80, height: 80 }, extra: true }
  ])('rejects invalid fidelity policies: %j', (value) => {
    expect(() => resolveContourQuality(nearStraight(), value)).toThrow()
  })
})
