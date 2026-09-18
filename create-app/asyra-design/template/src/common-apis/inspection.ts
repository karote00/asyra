import core from '../contexts'

const inspectionElementLimit = 200

export const inspectionApis = {
  inspect: (elementId: string) => {
    const root = core.getElementData(elementId)
    if (!root || root.type === 'workspace')
      return {
        available: false,
        elementId,
        message: 'The requested drawing is unavailable for inspection.'
      }
    try {
      const image = core.captureElementSnapshot(elementId, 1024)
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
        background: '#ffffff',
        elements,
        truncated: queue.length > visited.size
      }
    } catch {
      return {
        available: false,
        elementId,
        message:
          'This drawing could not be inspected visually. Do not claim visual verification.'
      }
    }
  }
}
