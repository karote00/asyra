import core from '../contexts'
import { hierarchyApis } from './hierarchy'

export interface DesignOrganizationRequest {
  operation: 'group' | 'ungroup' | 'reorder'
  elementIds: readonly string[]
  name?: string
  index?: number
}
interface OrganizationElement {
  type?: string
  parentId?: string
  children?: readonly string[]
  lock?: boolean
}
interface OrganizationApis {
  read(id: string): OrganizationElement | undefined
  group(ids: readonly string[]): {
    groupId: string
    elementIds: readonly string[]
  }
  ungroup(id: string): {
    groupId: string
    elementIds: readonly string[]
    removed: boolean
  }
  move(request: {
    elementIds: readonly string[]
    targetParentId: string
    targetIndex: number
  }): { elementIds: readonly string[]; moves: readonly unknown[] }
  rename(id: string, name: string): void
}
const options = Object.freeze({
  undoable: true,
  sharedDelivery: 'immediate'
} as const)
const defaultApis: OrganizationApis = {
  read: (id) => core.getElementData(id),
  group: (ids) => hierarchyApis.groupElements(ids, options),
  ungroup: (id) => hierarchyApis.ungroupElement(id, options),
  move: (request) => hierarchyApis.moveElements(request, options),
  rename: (id, name) => {
    core.updateElementData(id, { name }, options)
  }
}
export const createDesignOrganizer =
  (apis: OrganizationApis = defaultApis) =>
  (request: DesignOrganizationRequest) => {
    if (
      !request ||
      typeof request !== 'object' ||
      Array.isArray(request) ||
      Object.keys(request).some(
        (key) => !['operation', 'elementIds', 'name', 'index'].includes(key)
      ) ||
      !['group', 'ungroup', 'reorder'].includes(request.operation) ||
      !Array.isArray(request.elementIds) ||
      !request.elementIds.length ||
      request.elementIds.some(
        (id) => typeof id !== 'string' || !id.length || id.length > 256
      ) ||
      new Set(request.elementIds).size !== request.elementIds.length
    )
      throw new Error('Invalid organization request.')
    if (
      (request.name !== undefined &&
        (request.operation !== 'group' ||
          typeof request.name !== 'string' ||
          !request.name.trim() ||
          request.name.length > 160)) ||
      (request.operation === 'reorder' &&
        (!Number.isSafeInteger(request.index) || (request.index ?? -1) < 0)) ||
      (request.operation !== 'reorder' && request.index !== undefined) ||
      (request.operation === 'ungroup' && request.elementIds.length !== 1)
    )
      throw new Error('Invalid organization options.')
    const observations = new Map<string, OrganizationElement>()
    const read = (id: string): OrganizationElement => {
      const cached = observations.get(id)
      if (cached) return cached
      const data = apis.read(id)
      if (!data) throw new Error('An organization target is unavailable.')
      observations.set(id, data)
      return data
    }
    const checkUnlocked = (id: string) => {
      const visited = new Set<string>()
      let current = id
      while (current) {
        if (visited.has(current) || visited.size >= 512)
          throw new Error('Invalid target hierarchy.')
        visited.add(current)
        const data = read(current)
        if (data.lock)
          throw new Error('An organization target or its parent is locked.')
        if (data.type === 'workspace') return
        if (!data.parentId) throw new Error('The target parent is unavailable.')
        current = data.parentId
      }
    }
    request.elementIds.forEach(checkUnlocked)
    const parentId = read(request.elementIds[0]).parentId
    if (
      !parentId ||
      request.elementIds.some((id) => read(id).parentId !== parentId)
    )
      throw new Error('Organization targets must have one parent.')
    const parent = read(parentId)
    if (!Array.isArray(parent.children))
      throw new Error('The target parent has no children.')
    const selected = new Set(request.elementIds)
    const ids = parent.children.filter((id) => selected.has(id))
    if (ids.length !== selected.size || new Set(ids).size !== selected.size)
      throw new Error('The target parent membership is inconsistent.')
    if (request.operation === 'group') {
      const result = apis.group(ids)
      if (request.name !== undefined) apis.rename(result.groupId, request.name)
      return { status: 'complete', operation: request.operation, ...result }
    }
    if (request.operation === 'ungroup') {
      const group = read(ids[0])
      if (
        group.type !== 'group' ||
        !Array.isArray(group.children) ||
        group.children.length > 200 ||
        new Set(group.children).size !== group.children.length
      )
        throw new Error(
          'Ungroup requires one official Group with at most 200 children.'
        )
      for (const child of group.children) {
        checkUnlocked(child)
        if (read(child).parentId !== ids[0])
          throw new Error('Group child membership is inconsistent.')
      }
      return {
        status: 'complete',
        operation: request.operation,
        ...apis.ungroup(ids[0])
      }
    }
    const index = request.index as number
    if (index > parent.children.length - ids.length)
      throw new Error('Reorder index is outside the remaining sibling list.')
    const result = apis.move({
      elementIds: ids,
      targetParentId: parentId,
      targetIndex: index
    })
    return {
      status: result.moves.length ? 'complete' : 'no-change',
      operation: request.operation,
      ...result
    }
  }
export const organizeDesign = createDesignOrganizer()
