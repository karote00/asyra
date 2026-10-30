import { describe, expect, it, vi } from 'vitest'
import { getAvailableFontFamilies } from '../font-options'

const createDocument = () => {
  const fonts = new EventTarget()
  const context = { font: '', measureText: vi.fn(() => ({ width: 100 })) }
  context.measureText = vi.fn(() => ({
    width: context.font.includes('"Arial"') ? 120 : 100
  }))
  const owner = {
    fonts,
    createElement: vi.fn(() => ({ getContext: () => context }))
  } as unknown as Document
  return { owner, fonts, context }
}

describe('available font catalog', () => {
  it('offers built-in and detected fonts, reuses measurements, and invalidates on font loading', () => {
    const { owner, fonts, context } = createDocument()
    const options = getAvailableFontFamilies(owner)
    expect(options).toContain('serif')
    expect(options).toContain('Arial')
    expect(options).not.toContain('Georgia')
    const measurements = context.measureText.mock.calls.length
    expect(measurements).toBeGreaterThan(0)
    for (let edit = 0; edit < 10; edit++) {
      expect(getAvailableFontFamilies(owner)).toBe(options)
    }
    expect(context.measureText.mock.calls.length).toBe(measurements)
    fonts.dispatchEvent(new Event('loadingdone'))
    expect(getAvailableFontFamilies(owner)).toEqual(options)
    expect(context.measureText.mock.calls.length).toBe(measurements * 2)
    const another = createDocument()
    getAvailableFontFamilies(another.owner)
    expect(another.context.measureText.mock.calls.length).toBe(measurements)
  })
})
