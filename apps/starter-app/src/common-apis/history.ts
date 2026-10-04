import { undoWithRenderPolicy, redoWithRenderPolicy } from '@asyra/core'

// The public history functions address the active Factory. Bind their availability
// to this App lifetime so a retained callback cannot edit a replacement App.
export const createHistoryApis = (isActive: () => boolean) => ({
  async undo(): Promise<void> {
    if (isActive()) await undoWithRenderPolicy({ mode: 'atomic' })
  },
  async redo(): Promise<void> {
    if (isActive()) await redoWithRenderPolicy({ mode: 'atomic' })
  }
})
