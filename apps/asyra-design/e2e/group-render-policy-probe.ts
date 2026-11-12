import { renderStrategyRegistry } from '@asyra/core'

/** Test-local policy substitution. No application runtime or saved contract changes. */
export const createGroupRenderPolicyProbe = () => {
  const original = renderStrategyRegistry.get('group')

  if (!original) {
    throw new Error('Missing official Group strategy')
  }

  const previous: typeof original = (graphic, data) => {
    graphic.clear()
    graphic.x = data.x
    graphic.y = data.y
  }

  Object.assign(previous, { directPropertyKeys: original.directPropertyKeys })

  const select = (isolated: boolean) => {
    renderStrategyRegistry.unregister('group')
    renderStrategyRegistry.register('group', isolated ? original : previous)
  }

  return {
    select,

    restore: () => select(true),

    baselineSource: previous.toString(),
    candidateSource: original.toString()
  }
}

export const createBenchmarkVectorData = async () => {
  const { createDefaultFill } = await import('@asyra/utils')
  const { prepareVectorElementData } =
    await import('../src/common-apis/element/vector-apis')

  return (x: number, y: number, parentX: number, parentY: number) => {
    const prefix = `benchmark-${x}-${y}`
    const ids = [0, 1, 2, 3].map((index) => `${prefix}-p${index}`)
    const segmentIds = [0, 1, 2, 3].map((index) => `${prefix}-s${index}`)
    const networkId = `${prefix}-network`
    const vertices = [
      [x, y],
      [x + 6, y],
      [x + 6, y + 6],
      [x, y + 6]
    ]
    const data = prepareVectorElementData({
      type: 'vector',
      parentWorkspaceOrigin: { x: parentX, y: parentY },
      points: Object.fromEntries(
        ids.map((id, index) => [
          id,
          {
            id,
            kind: 'anchor' as const,
            anchorType: 'sharp' as const,
            handleMode: 'none' as const,
            x: vertices[index][0],
            y: vertices[index][1]
          }
        ])
      ),
      segments: Object.fromEntries(
        segmentIds.map((id, index) => [
          id,
          { id, startId: ids[index], endId: ids[(index + 1) % 4] }
        ])
      ),
      networks: {
        [networkId]: { id: networkId, pointIds: ids, segmentIds, closed: true }
      },
      closed: true,
      fills: [createDefaultFill({ color: '#cccccc' })],
      strokes: []
    })

    if (!data) {
      throw new Error('Invalid benchmark vector')
    }

    return data
  }
}
