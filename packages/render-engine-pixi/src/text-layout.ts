import { CanvasTextMetrics, TextStyle, type TextStyleOptions } from 'pixi.js'
import type {
  RenderEngineTextLayout,
  RenderEngineTextMeasurement
} from '@asyra/render-engine'

export const createTextLayoutStyle = (
  layout: RenderEngineTextLayout
): TextStyleOptions => ({
  fontFamily: layout.fontFamily,
  fontSize: layout.fontSize,
  fontWeight: layout.fontWeight,
  fontStyle: layout.fontStyle,
  lineHeight: layout.lineHeight,
  letterSpacing: layout.letterSpacing,
  whiteSpace: 'pre',
  wordWrap: layout.width !== undefined,
  wordWrapWidth: layout.width,
  breakWords: true
})

export const measureTextLayout = (
  layout: RenderEngineTextLayout
): RenderEngineTextMeasurement => {
  const style = new TextStyle(createTextLayoutStyle(layout))
  const metrics = CanvasTextMetrics.measureText(layout.text, style)
  return {
    type: 'text-measurement',
    width: layout.width ?? Math.max(1, Math.ceil(metrics.width)),
    height: Math.max(
      metrics.height,
      layout.lineHeight,
      metrics.lines.length * layout.lineHeight
    ),
    lines: [...metrics.lines]
  }
}
