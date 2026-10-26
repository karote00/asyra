import { expect, it } from 'vitest'
import { wallClock } from '../clock'
it('builds the retained clock recipe with rim, dial and hands before scene admission', () => {
  const parts = wallClock().map((p) => p.id)
  expect(parts).toContain('front-rim')
  expect(parts).toContain('minute-hand')
  expect(parts.filter((id) => id.startsWith('index-'))).toHaveLength(12)
})
