import type { TextData } from '@asyra/preset'
import { DataTypes, type EVENT_OPTIONS } from '@asyra/utils'
import { elementApis, selectionApis } from '../common-apis'

const NUMERIC_PROPERTY_KEYS = new Set(['x', 'y', 'width', 'height', 'rotation'])

export const updateSelectedElementProperties = (
  key: string,
  data: DataTypes,
  options?: EVENT_OPTIONS
) => {
  if (NUMERIC_PROPERTY_KEYS.has(key)) {
    if (typeof data !== 'number' || !Number.isFinite(data)) {
      return
    }
  }

  elementApis.updateElementProperties(
    selectionApis.getSelectedIds(),
    {
      [key]: data
    },
    options
  )
}

export const updateSelectedTextStyle = (
  values: Pick<TextData, 'fontWeight' | 'fontStyle'>
) => {
  elementApis.updateElementProperties(selectionApis.getSelectedIds(), values)
}
