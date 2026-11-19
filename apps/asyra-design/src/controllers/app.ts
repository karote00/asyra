import { getFeature } from '@asyra/core'
import { FeatureNames, PrimaryToolType } from '../constants'

export const switchPrimaryTool = (primaryTool: PrimaryToolType) => {
  try {
    const featureAPI = getFeature(FeatureNames.SWITCH_PRIMARY_TOOL)

    if (featureAPI?.switch) {
      const switchFn = featureAPI.switch as (tool: string) => void

      switchFn(primaryTool)
    }
  } catch (error) {
    console.error('[app.controller.switchPrimaryTool] Error:', error)
  }
}
