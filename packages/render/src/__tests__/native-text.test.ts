import { describe, expect, it } from 'vitest'
import { RenderGraphics } from '../types/render-object.js'

const text = () => ({
  text: 'Hello 世界\n<plain text>',
  x: 10,
  y: 20,
  width: 240,
  height: 100,
  fontFamily: 'sans-serif',
  fontSize: 24,
  fontWeight: 'normal' as const,
  fontStyle: 'normal' as const,
  align: 'left' as const,
  lineHeight: 30,
  letterSpacing: 0
})

describe('native text projection', () => {
  it('preserves literal Unicode text and explicit layout bounds', () => {
    const graphic = new RenderGraphics()
    const input = text()
    graphic.text(input, { color: '#123456', alpha: 0.4 })
    expect(graphic.getDrawOperations()).toEqual([
      { type: 'text', ...input, paint: { color: '#123456', alpha: 0.4 } }
    ])
    expect(graphic.getLocalBounds()).toEqual({
      x: 10,
      y: 20,
      width: 240,
      height: 100
    })
  })

  it('owns its input snapshot and replaces prior content on clear', () => {
    const graphic = new RenderGraphics()
    const input = text()
    graphic.text(input, { color: '#123456', alpha: 0.4 })
    input.text = 'Changed externally'
    input.fontSize = 60
    expect(graphic.getDrawOperations()[0]).toMatchObject({
      text: 'Hello 世界\n<plain text>',
      fontSize: 24
    })
    graphic
      .clear()
      .text({ ...text(), text: 'Replacement' }, { color: '#123456' })
    expect(graphic.getDrawOperations()).toEqual([
      { type: 'clear' },
      {
        type: 'text',
        ...text(),
        text: 'Replacement',
        paint: { color: '#123456' }
      }
    ])
  })
})
