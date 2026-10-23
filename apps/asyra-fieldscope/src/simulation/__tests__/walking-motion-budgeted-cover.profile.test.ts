import { describe, expect, it } from 'vitest'
import {
  nonlinearFixture,
  nonlinearRequired
} from './walking-motion-test-fixtures'

describe('canonical nonlinear budgeted canonical cover', () => {
  it('uses the same source-bound cursor in the canonical entry and retains every unvisited phase pair', async (context) => {
    await context.annotate(
      'Starting source-bound canonical cover accounting proof',
      'info'
    )
    const { owner, raw, source, demand, cycleOwner } = nonlinearFixture()
    const product = owner.prepare({
      ...raw,
      budget: { ...raw.budget, maxEnvelopePairs: 1, maxRegionPairs: 1 }
    })
    if (
      !('format' in product) ||
      product.format !== 'walking-motion-admission/3'
    )
      throw new Error('Missing nonlinear cover result')
    const relations = product.sourceRelations
    expect(relations.work.groupPairs).toBe(1)
    expect(relations.work.leafPairs).toBe(0)
    expect(relations.work.pointPreparations).toBe(0)
    expect(relations.work.phaseNodes).toBe(2)
    expect(relations.phaseCover).toHaveLength(2)
    expect(relations.coverage.unvisited).toBeGreaterThan(0)
    expect(product.status).toBe('unknown')
    for (const phase of relations.phases) {
      const whole = nonlinearRequired(
        relations.phaseCover.find((c) => c.phase === phase.phase)
      )
      expect(phase.pairs).toHaveLength(0)
      expect(phase.covers.reduce((sum, c) => sum + c.cardinality, 0)).toBe(
        relations.coverage.required / 2
      )
      for (const cover of phase.covers) {
        expect(cover.bounds).toBe(whole.bounds)
        expect(cover.parameter).toBe(whole.parameter)
        expect(cover.cardinality).toBe(cover.ordinal[1] - cover.ordinal[0])
        expect(cover.first.start + cover.first.count).toBeLessThanOrEqual(
          relations.movingCount
        )
        expect(cover.second.start + cover.second.count).toBeLessThanOrEqual(
          relations.inventory.length
        )
      }
    }
    for (const exclusion of demand.freePassage.exclusions)
      if (exclusion.kind === 'source') {
        const entry = nonlinearRequired(
          relations.inventory.find((input) => input.exclusion === exclusion)
        )
        expect(entry.shape).toBe(exclusion.mesh.descriptor.shape)
        expect(entry.region).toBe(exclusion.region)
      }
    for (const channel of demand.channels) {
      const entry = nonlinearRequired(
        relations.inventory.find((input) => input.owner === channel)
      )
      expect(entry.semantic?.kind).toBe('channel')
      expect(entry.semantic?.bounds).toBe(channel.bounds)
    }
    expect(
      product.terrainBindings.every(
        (binding) =>
          binding.terrainInput === product.request.terrain &&
          binding.product.request === binding.placementRequest
      )
    ).toBe(true)
    const foreign = {
      ...product,
      terrainBindings: [...product.terrainBindings]
    }
    expect(owner.isCurrent(foreign)).toBe(false)
    const work = JSON.stringify(product.work)
    expect(owner.prepare(product.request)).toBe(product)
    expect(JSON.stringify(product.work)).toBe(work)
    expect(product.source).toBe(source)
    cycleOwner.dispose()
    expect(owner.isCurrent(product)).toBe(false)
    expect(owner.read()).toBeUndefined()
  }, 300000)
})
