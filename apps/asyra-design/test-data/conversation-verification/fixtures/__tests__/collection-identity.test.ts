import { describe, expect, test } from 'vitest'

// Real runner identity fixture: separators inside authored names are not paths.
describe('outer > literal', () => {
  describe('nested', () => {
    test.each([1, 2])('value > %i', (value) => {
      expect(value).toBeGreaterThan(0)
    })
  })
})
