import { describe, expect, it, vi } from 'vitest'
import { createDesignTargetIndex } from '../design-target-index'

describe('prepared target index', () => {
  it('visits only the prefix range and retains source order on repeated large queries', () => {
    const keys = Array.from({ length: 10000 }, (_, index) => `part-${index}`)
    const map = Object.fromEntries(keys.map((key) => [key, `id-${key}`]))
    const index = createDesignTargetIndex(map)
    const expected = keys.filter((key) => key.startsWith('part-91'))
    const matches = vi.spyOn(String.prototype, 'startsWith')
    try {
      expect(index.keys('part-91')).toEqual(expected)
      expect(matches).toHaveBeenCalledTimes(expected.length + 1)
      matches.mockClear()
      expect(index.keys('part-91')).toEqual(expected)
      expect(matches).toHaveBeenCalledTimes(expected.length + 1)
    } finally {
      matches.mockRestore()
    }
  })

  it('handles Unicode, exact prefixes, misses and defensive result arrays', () => {
    const keys = ['窗-10', 'a/2', '窗-1', '窗', '__proto__', '\ufffftail']
    const index = createDesignTargetIndex(
      Object.fromEntries(keys.map((key) => [key, key]))
    )
    for (const prefix of ['', '窗', '窗-1', 'a/', '__', '\uffff', 'missing']) {
      expect(index.keys(prefix)).toEqual(
        keys.filter((key) => key.startsWith(prefix))
      )
    }
    index.keys().pop()
    expect(index.keys()).toEqual(keys)
  })
})
