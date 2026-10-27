import {
  DEFAULT_TEXT_DATA,
  TEXT_COMPONENT_TYPE,
  TextSizing,
  type TextData
} from '@asyra/preset'
import type { Rect, DataTypes } from '@asyra/utils'
import core from '../contexts'

export const measureTextBox = (
  typography: TextData,
  bounds: Rect,
  text: string
): Rect => {
  if (typography.textSizing === TextSizing.FIXED) return { ...bounds }
  const measured = core.measureText({
    ...typography,
    text,
    width:
      typography.textSizing === TextSizing.AUTO_HEIGHT
        ? bounds.width
        : undefined
  })
  return { ...bounds, width: measured.width, height: measured.height }
}

const layoutKeys = new Set(
  Object.keys(DEFAULT_TEXT_DATA).filter((key) => key !== 'textAlign')
)

export const projectTextLayoutUpdate = (
  elementId: string,
  values: Readonly<Record<string, DataTypes>>
): Readonly<Record<string, DataTypes>> => {
  if (
    !Object.keys(values).some(
      (key) => layoutKeys.has(key) || key === 'width' || key === 'height'
    )
  )
    return values
  if (core.getElementData(elementId)?.type !== TEXT_COMPONENT_TYPE)
    return values
  const data = core.getElementComputedData(elementId)
  if (!data) return values
  const typography = { ...data, ...values } as unknown as TextData
  if (typography.textSizing === TextSizing.FIXED) return values
  if ('height' in values) return { ...values, textSizing: TextSizing.FIXED }
  if ('width' in values) typography.textSizing = TextSizing.AUTO_HEIGHT
  const bounds = measureTextBox(
    typography,
    {
      x: 0,
      y: 0,
      width: Number(values.width ?? data.width),
      height: Number(data.height)
    },
    typography.text
  )
  return {
    ...values,
    textSizing: typography.textSizing,
    width: bounds.width,
    height: bounds.height
  }
}
