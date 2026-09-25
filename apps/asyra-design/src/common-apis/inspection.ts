import core from '../contexts'

const inspectionElementLimit = 200

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
      const queue = [elementId]
      const visited = new Set<string>()
      const elements: Record<string, unknown>[] = []
      for (
        let index = 0;
        index < queue.length && elements.length < inspectionElementLimit;
        index += 1
      ) {
        const id = queue[index]
        if (visited.has(id)) continue
        visited.add(id)
        const data = id === elementId ? root : core.getElementData(id)
        if (!data) continue
        const computed = core.getElementComputedData(id)
        elements.push({
          id,
          name: data.name,
          type: data.type,
          visible: data.visible !== false,
          locked: data.lock === true,
          bounds: computed
            ? {
                x: computed.x,
                y: computed.y,
                width: computed.width,
                height: computed.height
              }
            : null,
          fills: Array.isArray(computed?.fills)
            ? computed.fills.map((fill: Record<string, unknown>) => ({
                color: fill.color,
                opacity: fill.opacity,
                visible: fill.visible
              }))
            : []
        })
        const children = 'children' in data ? data.children : []
        if (Array.isArray(children))
          queue.push(
            ...children.filter((id): id is string => typeof id === 'string')
          )
      }
      return {
        available: true,
        elementId,
        image,
        partial: !!region,
        imageScope: region ? 'region' : view,
        background: '#ffffff',
        elements,
        elementsTruncated: queue.length > visited.size
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
