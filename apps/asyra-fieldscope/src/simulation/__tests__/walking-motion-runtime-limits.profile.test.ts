import { describe, expect, it } from 'vitest'
import { WalkingMotionOwner } from '../walking-motion'
import { nonlinearFixture } from './walking-motion-test-fixtures'

describe('canonical nonlinear runtime limits', () => {
  it('issues unknown with complete inventory when admitted runtime work cannot start', () => {
    const { raw, owner } = nonlinearFixture()
    const request = {
      ...raw,
      budget: {
        ...raw.budget,
        maxCycleOperations: 1,
        maxRegionPairs: 1,
        maxEnvelopePairs: 1,
        maxExactPredicates: 1
      }
    }
    let product: ReturnType<WalkingMotionOwner['prepare']> | undefined
    expect(() => {
      product = owner.prepare(request)
    }).not.toThrow()
    if (!product || !('format' in product))
      throw new Error('Missing nonlinear budget result')
    expect(product.status).toBe('unknown')
    expect(product.phaseCover).toHaveLength(0)
    expect(product.sourceRelations.coverage.required).toBeGreaterThan(1)
    const coverage = product.sourceRelations.coverage
    expect(coverage.required).toBe(coverage.unknown + coverage.unvisited)
    expect(product.work.cycleOperations).toBeLessThanOrEqual(1)
    expect(product.work.exactOperations).toBeLessThanOrEqual(1)
    expect(product.reasons).toContain('nonlinear-phase-cover-incomplete')
    expect(owner.read()).toBe(product)
    expect(owner.prepare(product.request)).toBe(product)
    owner.clear()
    expect(owner.isCurrent(product)).toBe(false)
    const limited = owner.prepare({
      ...raw,
      budget: {
        ...raw.budget,
        maxRegionPairs: 1,
        maxEnvelopePairs: 1,
        maxExactPredicates: 1
      }
    })
    if (
      !('format' in limited) ||
      limited.format !== 'walking-motion-admission/3'
    )
      throw new Error('Missing nonlinear runtime result')
    expect(limited.status).toBe('unknown')
    expect(limited.phaseCover).toHaveLength(2)
    expect(limited.work.exactOperations).toBeLessThanOrEqual(1)
    expect(limited.sourceRelations.work.kernel.exactPredicates).toBe(0)
    expect(limited.sourceRelations.coverage.unvisited).toBe(
      limited.sourceRelations.coverage.required
    )
    for (const cover of limited.phaseCover) {
      expect(cover.source).toBe(limited.source)
      expect(cover.cycle).toBe(limited.cycle)
      expect(cover.terrain).toBe(limited.request.terrain)
      expect(cover.load).toBe(limited.request.load)
      expect(cover.stance.path).toBe(limited.request.path)
      expect(cover.stance.supports).toHaveLength(3)
      expect(cover.plane).toBeNull()
      expect(cover.bounds.parts).toHaveLength(limited.source.parts.length)
      expect(cover.parameter).toEqual({
        low: { numerator: 0n, denominator: 1n },
        high: { numerator: 1n, denominator: 1n }
      })
    }
    expect(owner.isCurrent({ ...limited })).toBe(false)
    expect(owner.prepare(limited.request)).toBe(limited)
    owner.clear()
    expect(owner.isCurrent(limited)).toBe(false)
  }, 30000)
})
