import {
  featureEnabled,
  toolId,
  type DisabledCommandBehavior
} from '../../workspace-features'
import type { SystemContextSnapshotWithDetail } from '@asyra/utils'
import { defineFeature } from '@asyra/core'
import { systemContextApis } from '../../common-apis'
import {
  FeatureNames,
  InputSystemEvents,
  PrimaryToolType
} from '../../constants'

interface SwitchPrimaryToolAPI {
  switch: (tool: string, behavior?: DisabledCommandBehavior) => boolean
  [key: string]: unknown
}

const api: SwitchPrimaryToolAPI = {
  switch: (tool, behavior = 'ignore') => {
    if (!featureEnabled(toolId(tool), behavior)) {
      return false
    }

    systemContextApis.switchPrimaryTool(tool)
    if (systemContextApis.getPathEditingMode()) {
      if (tool === PrimaryToolType.SELECT || tool === PrimaryToolType.PEN) {
        systemContextApis.setPathEditingStartNewSubpath(true)
      } else {
        systemContextApis.exitPathEditingMode()
      }
    }

    return true
  }
}

export const switchPrimaryToolFeature = defineFeature(
  FeatureNames.SWITCH_PRIMARY_TOOL,
  InputSystemEvents.INPUT_SHORTCUT_SWITCH_PRIMARY_TOOL,
  {
    priority: 10,
    exclusive: true,
    api,

    execution: (snapshot: SystemContextSnapshotWithDetail) => {
      const tool = snapshot.detail?.primaryTool as string

      if (tool && api.switch(tool)) {
        return { tool }
      }

      return null
    }
  }
)

export default switchPrimaryToolFeature
