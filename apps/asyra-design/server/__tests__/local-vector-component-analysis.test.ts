import { describe, expect, it } from 'vitest'
import { parseLocalVectorArtifact } from '../local-vector-artifact'
import { analyzeVectorComponents } from '../local-vector-component-analysis'

const artifact = (path: string) =>
  parseLocalVectorArtifact(
    `<svg width="100" height="100"><path d="${path}" fill="#008800"/></svg>`
  )
const circle =
  'M90,50C90,72.0914,72.0914,90,50,90C27.9086,90,10,72.0914,10,50C10,27.9086,27.9086,10,50,10C72.0914,10,90,27.9086,90,50Z'
const analyze = (path: string) =>
  analyzeVectorComponents(
    artifact(path),
    ['path-1'],
    new AbortController().signal
  )

describe('read-only component analysis', () => {
  it('measures a cubic circle without preferring a component or changing the source', () => {
    const source = artifact(circle)
    const before = JSON.stringify(source)
    const result = analyzeVectorComponents(
      source,
      ['path-1'],
      new AbortController().signal
    )
    expect(JSON.stringify(source)).toBe(before)
    expect(result.paths[0].candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ componentType: 'oval', eligible: true }),
        expect.objectContaining({ componentType: 'rect', eligible: false })
      ])
    )
    expect(result.paths[0].contours[0]).toMatchObject({
      id: 'path-1:contour-1'
    })
    expect(JSON.stringify(result)).not.toMatch(
      /inControl|outControl|"rings"|"points"/
    )
  })
  it('recognizes a rectangle and rejects an irregular silhouette', () => {
    expect(
      analyze('M10,10L90,10L90,90L10,90Z').paths[0].candidates
    ).toContainEqual(
      expect.objectContaining({ componentType: 'rect', eligible: true })
    )
    expect(
      analyze('M10,10L90,10L50,50L90,90L10,90Z').paths[0].candidates.every(
        (candidate) => !candidate.eligible
      )
    ).toBe(true)
  })
  it('retains holes and rejects compound or self-intersecting whole-path replacements', () => {
    for (const path of [
      `${circle} M40,40L60,40L60,60L40,60Z`,
      'M10,10L90,90L10,90L90,10Z'
    ]) {
      const result = analyze(path)
      expect(
        result.paths[0].candidates.every((candidate) => !candidate.eligible)
      ).toBe(true)
      expect(result.paths[0].limitation).toBeTruthy()
    }
  })
  it('returns bounded evidence for complex paths without aborting other candidates', () => {
    const source = artifact('M10,10L90,10L90,90L10,90Z')
    source.paths[0].rings = Array.from(
      { length: 3000 },
      () => source.paths[0].rings[0]
    )
    const result = analyzeVectorComponents(
      source,
      ['path-1'],
      new AbortController().signal
    )
    expect(result.paths[0].limitation).toMatch(/limit/i)
    expect(
      result.paths[0].candidates.every((candidate) => !candidate.eligible)
    ).toBe(true)
    expect(JSON.stringify(result).length).toBeLessThan(6000)
  })
  it('bounds contour summaries and retains the true contour count', () => {
    const result = analyze(
      Array.from({ length: 30 }, () => 'M10,10L90,10L90,90L10,90Z').join(' ')
    )
    expect(result.paths[0].contourCount).toBe(30)
    expect(result.paths[0].contours.length).toBeLessThanOrEqual(8)
    expect(result.paths[0].contoursTruncated).toBe(true)
  })
  it('measures an ellipse and retains a visibly dented near-rectangle', () => {
    const source = artifact(circle)
    for (const point of source.paths[0].rings[0]) {
      point.x *= 2
      if (point.inControl) point.inControl.x *= 2
      if (point.outControl) point.outControl.x *= 2
    }
    source.paths[0].bounds.x *= 2
    source.paths[0].bounds.width *= 2
    const result = analyzeVectorComponents(
      source,
      ['path-1'],
      new AbortController().signal
    )
    expect(result.paths[0].candidates).toContainEqual(
      expect.objectContaining({ componentType: 'oval', eligible: true })
    )
    expect(
      analyze('M10,10L90,10L90,90L50,85L10,90Z').paths[0].candidates.every(
        (candidate) => !candidate.eligible
      )
    ).toBe(true)
  })
  it('rejects invalid selections and cancelled work', () => {
    const source = artifact(circle)
    for (const ids of [[], ['missing'], ['path-1', 'path-1']])
      expect(() =>
        analyzeVectorComponents(source, ids, new AbortController().signal)
      ).toThrow()
    const controller = new AbortController()
    controller.abort()
    expect(() =>
      analyzeVectorComponents(source, ['path-1'], controller.signal)
    ).toThrow()
  })
})
