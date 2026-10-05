import core from '../contexts'

export const inspectionApis = {
  inspect: (
    elementId: string,
    region?: { x: number; y: number; width: number; height: number },
    view: 'overview' | 'detail' = 'overview'
  ) => {
    const root = core.getElementData(elementId)
    if (!root || root.type === 'workspace')
      return {
        available: false,
        elementId,
        message: 'The requested drawing is unavailable for inspection.'
      }
    try {
      const image = core.captureElementSnapshot(elementId, 1024, {
        nativeResolution: !!region || view === 'detail',
        ...(region ? { region } : {})
      })
      return {
        available: true,
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
        message:
          'Capture is unavailable. For native detail exceeding 1024 pixels per side, inspect a smaller child or specify a target-local region within that limit. Use view=overview for composition framing; an overview does not prove native detail. Do not claim verification from an unavailable image.'
      }
    }
  }
}
