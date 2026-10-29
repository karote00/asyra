import { expect, it } from 'vitest'
import {
  growTreeBranches,
  distributeTreeFoliage,
  type TreeCurve
} from '../tree-branching'
import spec from '../../../../../assets/asyra-office/models/street/tree-construction-spec.json'

it.each([606, 1607, 2608, 3609, 4610, 5611])(
  'preserves two-level parents and distributes foliage along branches for seed %i',
  (seed) => {
    const curves = new Map<string, TreeCurve>()
    curves.set('trunk', { at: (t) => [0, 0, 2.55 * t], radius: () => 0.08 })
    // Straight primary fixtures isolate growth ownership from the scaffold deformation.
    for (const branch of spec.branches.entries.filter((b) => b.level === 1))
      curves.set(branch.id, { at: (t) => [t, 0, 1 + t], radius: () => 0.04 })
    const added = growTreeBranches(seed, curves),
      levels = new Map(spec.branches.entries.map((b) => [b.id, b.level]))
    levels.set('trunk', 0)
    for (const branch of added) {
      expect(branch.level).toBe((levels.get(branch.parent) ?? -10) + 1)
      expect(branch.level).toBeLessThanOrEqual(2)
      const parent = curves.get(branch.parent),
        child = curves.get(branch.id)
      expect(child?.at(0)).toEqual(parent?.at(branch.attachment))
      expect(child?.radius(0)).toBeLessThan(
        parent?.radius(branch.attachment) ?? 0
      )
      levels.set(branch.id, branch.level)
    }
    const clusters = distributeTreeFoliage(seed, added)
    expect(clusters.reduce((sum, c) => sum + c.count, 0)).toBe(3264)
    expect(clusters.every((c) => c.count > 0)).toBe(true)
    for (const branch of [...spec.branches.entries, ...added].filter(
      (b) => b.level === 1
    )) {
      const locations = clusters
        .filter((c) => c.branch === branch.id)
        .map((c) => c.branchT ?? 0)
      expect(Math.min(...locations)).toBeLessThanOrEqual(0.55)
      expect(Math.max(...locations)).toBeGreaterThanOrEqual(0.72)
    }
  }
)
