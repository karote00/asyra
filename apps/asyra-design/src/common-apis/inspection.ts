import core from '../contexts'

export const inspectionApis = {
  inspect: (
    elementId: string,
    region?: { x: number; y: number; width: number; height: number },
    view: 'overview' | 'detail' = 'overview'
  ) => {
    const root = core.getElementMetadata(elementId)
    if (
      !root ||
      (root.type === 'workspace' && elementId !== core.getCurrentWorkspaceId())
    ) {
      return {
        available: false,
        elementId,
        code: 'INSPECTION_TARGET_UNAVAILABLE',
        settlement: 'completed' as const,
        message:
          'The inspection target does not exist in the current scene. Use a current element ID or the current workspace ID for overview; do not regroup or redraw.'
      }
    }
    if (root.type === 'workspace') {
      if (region || view === 'detail') {
        return {
          available: false,
          elementId,
          code: 'WORKSPACE_OVERVIEW_ONLY',
          settlement: 'completed' as const,
          message:
            'Workspace supports overview only. For native detail, select a concrete child and its local region; do not substitute overview for required detail or regroup the document.'
        }
      }
      if (root.childCount === 0) {
        return {
          available: false,
          elementId,
          code: 'WORKSPACE_EMPTY',
          settlement: 'completed' as const,
          message:
            'The workspace has no drawing to inspect. No image or visual judgment was produced.'
        }
      }
    }
    try {
      const image = core.captureElementSnapshot(elementId, 1024, {
        nativeResolution: !!region || view === 'detail',
        ...(region ? { region } : {})
      })
      return {
        available: true,
        settlement: 'completed' as const,
        elementId,
        image,
        partial: !!region,
        imageScope: region ? 'region' : view,
        background: '#ffffff'
      }
    } catch {
      return {
        available: false,
        elementId,
        code: 'CAPTURE_UNAVAILABLE',
        settlement: 'completed' as const,
        message:
          'Capture is unavailable; no image or judgment was produced. Retry only this failed capture, preserving valid images and completed edits. For native detail exceeding 1024 pixels per side, inspect a smaller child or specify a target-local region within that limit. Use view=overview for composition framing; an overview does not prove native detail. Do not claim verification from an unavailable image.'
      }
    }
  }
}
