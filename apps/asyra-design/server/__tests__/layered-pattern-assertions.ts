import { expect } from 'vitest'
import type { PreparedDesign } from '../../src/ai/prepared-design'

// Names and source keys are deliberately compared separately. All canonical
// references, topology, materials, ordered entries and numeric fields remain.
export const expectEquivalentPatternEntries = (
  actual: PreparedDesign,
  expected: PreparedDesign
) => {
  const differences: string[] = []
  let maxNumericDifference = 0
  const compare = (a: unknown, b: unknown, path: string) => {
    if (typeof a === 'number' && typeof b === 'number') {
      const delta = Math.abs(a - b)
      maxNumericDifference = Math.max(maxNumericDifference, delta)
      if (!Number.isFinite(delta) || delta >= 5e-8) {
        differences.push(path)
      }
    } else if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        differences.push(path + '/length')
      }
      a.forEach((value, index) => compare(value, b[index], `${path}/${index}`))
    } else if (a && b && typeof a === 'object' && typeof b === 'object') {
      if (Object.keys(a).sort().join() !== Object.keys(b).sort().join()) {
        differences.push(path + '/keys')
      }
      for (const [key, value] of Object.entries(a)) {
        compare(value, (b as Record<string, unknown>)[key], `${path}/${key}`)
      }
    } else if (a !== b) {
      differences.push(path)
    }
  }
  const comparable = (design: PreparedDesign) =>
    design.entries.map(({ key: _key, descriptor, ...entry }) => {
      const { name: _name, ...values } = descriptor
      return { ...entry, descriptor: values }
    })
  compare(comparable(actual), comparable(expected), 'entries')
  expect(differences.slice(0, 10)).toEqual([])
  return maxNumericDifference
}
