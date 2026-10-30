import { defineFeature } from '@asyra/core'
import { historyApis } from '../../common-apis'
import { FeatureNames, InputSystemEvents } from '../../constants'
import type { SystemContextSnapshotWithDetail } from '@asyra/utils'

export const undoRedoFeature = defineFeature(
  FeatureNames.UNDO_REDO,
  InputSystemEvents.INPUT_SHORTCUT_UNDOREDO,
  {
    priority: 100,
    executionMode: 'immediate',
    exclusive: true,
    execution: async (snapshot: SystemContextSnapshotWithDetail) => {
      const direction = snapshot.detail?.historyDirection
      if (direction !== 'undo' && direction !== 'redo') {
        return null
      }
      if (direction === 'redo') {
        await historyApis.redo()
        return { redid: true }
      } else {
        await historyApis.undo()
        return { undid: true }
      }
    }
  }
)

export default undoRedoFeature
