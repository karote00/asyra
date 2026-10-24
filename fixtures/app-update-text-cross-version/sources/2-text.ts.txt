import type {
  ComponentDefinition,
  EngineNeutralRenderStrategy
} from '@asyra/core'
import { PropertyTypes, setElementGeometryLocalBounds } from '@asyra/utils'
import {
  TEXT_PROPERTY_TYPE,
  DEFAULT_TEXT_DATA,
  type TextData
} from '../props/components/text-component.js'
import { PRESET_REGISTRATION } from '../registration.js'
import { createRectangleHitArea } from './shape-hit-area.js'

export const TEXT_COMPONENT_TYPE = 'text'

export const TEXT_COMPONENT_DEFINITION: ComponentDefinition = {
  type: TEXT_COMPONENT_TYPE,
  idPrefix: TEXT_COMPONENT_TYPE,
  namePrefix: 'Text',
  registration: PRESET_REGISTRATION,
  properties: [
    {
      name: PropertyTypes.POSITION,
      type: PropertyTypes.POSITION,
      alias: ['x', 'y', 'rotation']
    },
    {
      name: PropertyTypes.DIMENSION,
      type: PropertyTypes.DIMENSION,
      alias: ['width', 'height']
    },
    {
      name: TEXT_PROPERTY_TYPE,
      type: TEXT_PROPERTY_TYPE,
      alias: Object.keys(DEFAULT_TEXT_DATA)
    }
  ]
}

export const TEXT_RENDER_STRATEGY: EngineNeutralRenderStrategy<TextData> = (
  graphic,
  data
) => {
  const bounds = { x: 0, y: 0, width: data.width, height: data.height }
  graphic.clear()
  setElementGeometryLocalBounds(
    graphic as Parameters<typeof setElementGeometryLocalBounds>[0],
    bounds
  )
  graphic.hitArea = createRectangleHitArea(data.width, data.height)
  graphic.text({
    ...bounds,
    text: data.text,
    fontFamily: data.fontFamily,
    fontSize: data.fontSize,
    fontWeight: data.fontWeight,
    fontStyle: data.fontStyle,
    align: data.textAlign,
    lineHeight: data.lineHeight,
    letterSpacing: data.letterSpacing,
    color: data.textColor
  })
  graphic.x = data.x
  graphic.y = data.y
}
