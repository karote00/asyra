import { expect, it, vi } from 'vitest'
const measure = vi.hoisted(() =>
  vi.fn(() => ({ width: 43.2, height: 36, lines: ['first', 'second'] }))
)
vi.mock('pixi.js', () => ({
  TextStyle: vi.fn(function (this: object, value: object) {
    Object.assign(this, value)
  }),
  CanvasTextMetrics: { measureText: measure }
}))
import { createTextLayoutStyle, measureTextLayout } from '../text-layout.js'
const layout = {
  text: 'first\nsecond',
  fontFamily: 'sans-serif',
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  lineHeight: 20,
  letterSpacing: 0
} as const
it('uses native metrics once for unwrapped content and explicit line height', () => {
  const result = measureTextLayout(layout)
  expect(result).toEqual({
    type: 'text-measurement',
    width: 44,
    height: 40,
    lines: ['first', 'second']
  })
  expect(measure).toHaveBeenCalledExactlyOnceWith(
    layout.text,
    expect.objectContaining({ wordWrap: false, whiteSpace: 'pre' })
  )
})
it('shares the render style and preserves the requested wrapping width', () => {
  expect(createTextLayoutStyle({ ...layout, width: 100 })).toMatchObject({
    wordWrap: true,
    wordWrapWidth: 100,
    breakWords: true,
    letterSpacing: 0
  })
  expect(measureTextLayout({ ...layout, width: 100 }).width).toBe(100)
})

it('includes native glyph height when the font exceeds the requested line height', () => {
  measure.mockReturnValueOnce({ width: 70, height: 37, lines: ['Large'] })
  expect(
    measureTextLayout({ ...layout, text: 'Large', fontSize: 32 }).height
  ).toBe(37)
})
