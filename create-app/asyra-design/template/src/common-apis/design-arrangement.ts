import { runTransaction } from '@asyra/core'
import { projectGroupGeometryPropertyUpdates } from '@asyra/preset'
import core from '../contexts'

export interface DesignArrangementRequest {
  operation: 'align' | 'distribute'
  axis: 'horizontal' | 'vertical'
  elementIds: readonly string[]
  alignment?: 'start' | 'center' | 'end'
  gap?: number
}
interface Position {
  x: number
  y: number
}
interface LayoutRecord {
  type?: string
  parentId?: string
  lock?: boolean
}
interface PositionUpdate {
  elementId: string
  values: Record<string, number>
}
interface ArrangementApis {
  read(id: string): LayoutRecord | undefined
  geometry(id: string): Record<string, unknown> | undefined
  corner(
    id: string,
    parentId: string,
    point: Position
  ): Position | null | undefined
  apply(updates: PositionUpdate[], groups: string[]): void
}
const options = { undoable: true, sharedDelivery: 'immediate' } as const
const defaultApis: ArrangementApis = {
  read: (id) => core.getElementData(id),
  geometry: (id) =>
    core.getElementComputedData(id, ['x', 'y', 'width', 'height']),
  corner: (id, parentId, point) => {
    const workspace = core.elementLocalToWorkspace(id, point)
    if (!workspace) return null
    if (parentId === core.getCurrentWorkspaceId()) return workspace
    return core.workspaceToElementLocal(parentId, workspace)
  },
  apply: (updates, groups) =>
    runTransaction(() => {
      const prepared = groups.length
        ? projectGroupGeometryPropertyUpdates(core, updates, groups)
        : updates
      core.updateElementProperties(prepared, options)
    })
}

export const createDesignArranger =
  (apis: ArrangementApis = defaultApis) =>
  (request: DesignArrangementRequest) => {
    if (
      !request ||
      typeof request !== 'object' ||
      Array.isArray(request) ||
      Object.keys(request).some(
        (key) =>
          !['operation', 'axis', 'elementIds', 'alignment', 'gap'].includes(key)
      ) ||
      !['align', 'distribute'].includes(request.operation) ||
      !['horizontal', 'vertical'].includes(request.axis) ||
      !Array.isArray(request.elementIds) ||
      request.elementIds.length < 2 ||
      request.elementIds.some(
        (id) => typeof id !== 'string' || !id.length || id.length > 256
      ) ||
      new Set(request.elementIds).size !== request.elementIds.length ||
      (request.operation === 'align' &&
        (!['start', 'center', 'end'].includes(request.alignment ?? '') ||
          request.gap !== undefined)) ||
      (request.operation === 'distribute' &&
        (request.alignment !== undefined ||
          (request.gap !== undefined &&
            (!Number.isFinite(request.gap) ||
              request.gap < 0 ||
              request.gap > 100000))))
    )
      throw new Error('Invalid arrangement request.')
    const records = new Map<string, LayoutRecord>()
    const read = (id: string): LayoutRecord => {
      const cached = records.get(id)
      if (cached) return cached
      const record = apis.read(id)
      if (!record) throw new Error('An arrangement target is unavailable.')
      records.set(id, record)
      return record
    }
    for (const id of request.elementIds) {
      const visited = new Set<string>()
      let current = id
      while (current) {
        if (visited.has(current) || visited.size >= 512)
          throw new Error('Invalid arrangement hierarchy.')
        visited.add(current)
        const record = read(current)
        if (record.lock)
          throw new Error('An arrangement target or parent is locked.')
        if (record.type === 'workspace') break
        if (!record.parentId)
          throw new Error('An arrangement parent is unavailable.')
        current = record.parentId
      }
    }
    const parentId = read(request.elementIds[0]).parentId
    if (
      !parentId ||
      request.elementIds.some((id) => read(id).parentId !== parentId)
    )
      throw new Error('Arrangement requires siblings in one parent.')
    const axis = request.axis === 'horizontal' ? 'x' : 'y'
    const targets = request.elementIds.map((id) => {
      const geometry = apis.geometry(id)
      const values = ['x', 'y', 'width', 'height'].map((key) => geometry?.[key])
      if (
        values.some(
          (value) => typeof value !== 'number' || !Number.isFinite(value)
        )
      )
        throw new Error('Arrangement geometry is unavailable.')
      const [x, y, width, height] = values as number[]
      if (width < 0 || height < 0)
        throw new Error('Arrangement size is invalid.')
      const corners = [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height }
      ].map((point) => apis.corner(id, parentId, point))
      if (
        corners.some(
          (point) =>
            !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)
        )
      )
        throw new Error('Arrangement projection is unavailable.')
      const coordinates = corners.map((point) => (point as Position)[axis])
      const start = Math.min(...coordinates),
        end = Math.max(...coordinates)
      return {
        id,
        position: axis === 'x' ? x : y,
        start,
        end,
        size: end - start
      }
    })
    const start = Math.min(...targets.map((t) => t.start)),
      end = Math.max(...targets.map((t) => t.end))
    let gap = request.gap ?? 0
    if (request.operation === 'distribute') {
      targets.sort((a, b) => a.start - b.start)
      if (request.gap === undefined)
        gap =
          (end - start - targets.reduce((sum, t) => sum + t.size, 0)) /
          (targets.length - 1)
      if (gap < 0)
        throw new Error(
          'There is not enough space to distribute without overlap. Specify a gap.'
        )
    }
    let cursor = start
    const updates: PositionUpdate[] = []
    const positions = targets.map((target) => {
      let edge = cursor
      if (request.operation === 'align') {
        edge = start
        if (request.alignment === 'center')
          edge = (start + end - target.size) / 2
        if (request.alignment === 'end') edge = end - target.size
      }
      const position = target.position + edge - target.start
      if (!Number.isFinite(position) || Math.abs(position) > 100000)
        throw new Error('Arranged position is outside the supported range.')
      if (Math.abs(position - target.position) > 1e-8)
        updates.push({ elementId: target.id, values: { [axis]: position } })
      cursor = edge + target.size + gap
      return { elementId: target.id, [axis]: position }
    })
    if (updates.length)
      apis.apply(
        updates,
        updates
          .filter((update) => read(update.elementId).type === 'group')
          .map((update) => update.elementId)
      )
    return {
      status: updates.length ? 'complete' : 'no-change',
      compositionId: parentId,
      appliedElementIds: updates.map((update) => update.elementId),
      positions
    }
  }
export const arrangeDesign = createDesignArranger()
