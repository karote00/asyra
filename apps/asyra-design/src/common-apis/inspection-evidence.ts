import core from '../contexts'
import { subscribeToFileLoadComplete } from '@asyra/core'
import {
  SharedDataChannelNames,
  SCENE_TREE_ACTIONS,
  PROPS_ACTIONS
} from '@asyra/utils'
import type { SceneTreeChange, PropsChange } from '@asyra/utils'
import {
  createInspectionDependencies,
  type InspectionDependencyChange,
  type InspectionRegion
} from './inspection-dependencies'

export const observeInspectionChanges = (
  listener: (change?: InspectionDependencyChange) => void
) => {
  const scene = core.observeSharedDataChannel(
    SharedDataChannelNames.SCENE_TREE,
    (value) => {
      try {
        const change = value as SceneTreeChange
        if (
          !change ||
          !Object.values(SCENE_TREE_ACTIONS).includes(change.action)
        ) {
          listener()
          return
        }
        if ('entries' in change) {
          listener({
            elementIds: change.entries.map((entry) => entry.data.id),
            parentIds: change.entries.map((entry) => entry.parentId)
          })
        } else if ('moves' in change) {
          listener({
            elementIds: change.moves.map((move) => move.elementId),
            parentIds: change.moves.flatMap((move) => [
              move.before.parentId,
              move.after.parentId
            ])
          })
        } else if ('removed' in change) {
          listener({
            elementIds: change.removed.map((entry) => entry.elementId),
            parentIds: [
              change.removed.find(
                (entry) => entry.elementId === change.elementId
              )?.parentId ?? ''
            ].filter(Boolean)
          })
        } else if ('data' in change) {
          listener({
            elementIds: [change.data.id],
            parentIds: [change.parentId ?? change.data.parentId].filter(
              (id): id is string => !!id
            )
          })
        } else if ('id' in change) {
          const fields: { key: string; before: unknown; after: unknown }[] = []
          if ('changes' in change) fields.push(...change.changes)
          else if ('key' in change) fields.push(change)
          const visible = fields.filter(
            (field) => !['name', 'lock', 'children'].includes(field.key)
          )
          const parents = fields
            .filter((field) => field.key === 'parentId')
            .flatMap((field) => [field.before, field.after])
            .filter((id): id is string => typeof id === 'string' && !!id)
          listener({
            elementIds: visible.length || 'patch' in change ? [change.id] : [],
            attachmentIds: fields.some((field) => field.key === 'lock')
              ? [change.id]
              : [],
            parentIds: [
              ...parents,
              ...fields
                .filter((field) => field.key === 'children')
                .map(() => change.id)
            ]
          })
        } else listener()
      } catch {
        listener()
      }
    }
  )
  const props = core.observeSharedDataChannel(
    SharedDataChannelNames.PROPS,
    (value) => {
      try {
        const change = value as PropsChange
        if (!change || !Object.values(PROPS_ACTIONS).includes(change.action)) {
          listener()
          return
        }
        const ids =
          'id' in change
            ? [change.id]
            : [
                ...change.data.map((entry) => entry.id),
                ...(change.parentId ? [change.parentId] : [])
              ]
        listener({
          elementIds: core.getPropertyOwnerElementIds(ids, {
            includeRetired: change.action === PROPS_ACTIONS.REMOVE_PROPERTY
          })
        })
      } catch {
        listener()
      }
    }
  )
  const load = subscribeToFileLoadComplete(() => listener())
  return () => {
    scene()
    props()
    load.unsubscribe()
  }
}

const readAttachment = (parentId?: string) => {
  const workspaceId = core.getCurrentWorkspaceId()
  if (!workspaceId) throw new Error('Attachment workspace is unavailable.')
  const target = parentId ?? workspaceId
  const visited = new Set<string>()
  const parentPath: string[] = []
  let id = target
  while (id !== workspaceId) {
    if (!id || visited.has(id))
      throw new Error('Attachment parent is not in the current workspace.')
    visited.add(id)
    parentPath.push(id)
    const item = core.getElementMetadata(id)
    if (!item || !core.isContainerType(item.type) || item.lock)
      throw new Error('Attachment parent is not an editable container.')
    id = item.parentId ?? ''
  }
  const points = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 }
  ]
  const basis =
    target === workspaceId
      ? points
      : points.map((point) => core.elementLocalToWorkspace(target, point))
  if (
    basis.some(
      (point) =>
        !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)
    )
  )
    throw new Error('Attachment parent transform is unavailable.')
  const bounds =
    target === workspaceId
      ? null
      : core.getElementComputedData(target, ['x', 'y', 'width', 'height'])
  if (
    target !== workspaceId &&
    (!bounds ||
      ['x', 'y', 'width', 'height'].some(
        (field) => !Number.isFinite(bounds[field])
      ))
  )
    throw new Error('Attachment parent bounds are unavailable.')
  return {
    parentPath,
    result: { available: true, workspaceId, parentId: target, bounds, basis }
  }
}

const dependencySource = {
  attachment(target: string) {
    return JSON.stringify(readAttachment(target))
  },
  parent(id: string) {
    const element = core.getElementMetadata(id)
    if (!element) throw new Error('Inspection dependency no longer exists')
    return element.parentId || undefined
  },
  region(target: string, region: InspectionRegion) {
    // Match the snapshot extraction's enclosing fractional frame.
    const width = Math.max(
      1,
      Math.ceil(region.width - Number.EPSILON * Math.max(1, region.width) * 4)
    )
    const height = Math.max(
      1,
      Math.ceil(region.height - Number.EPSILON * Math.max(1, region.height) * 4)
    )
    const points = [
      [0, 0],
      [width, 0],
      [0, height],
      [width, height]
    ].map(([x, y]) =>
      core.elementLocalToWorkspace(target, { x: region.x + x, y: region.y + y })
    )
    if (
      points.some(
        (point) =>
          !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)
      )
    )
      throw new Error('Inspection region transform is unavailable')
    const coordinates = points.filter(
      (point): point is { x: number; y: number } => !!point
    )
    const xs = coordinates.map((point) => point.x),
      ys = coordinates.map((point) => point.y)
    const bounds = {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys)
    }
    const parents = new Map<string, string | undefined>()
    return core.getElementIdsInBounds(bounds).filter((candidate) => {
      let id: string | undefined = candidate
      const seen = new Set<string>()
      while (id) {
        if (id === target) return true
        if (seen.has(id)) throw new Error('Cyclic inspection region')
        seen.add(id)
        if (!parents.has(id)) parents.set(id, dependencySource.parent(id))
        id = parents.get(id)
      }
      return false
    })
  }
}

import type { InspectionEvidenceStamp } from '../ai/inspection-evidence'

export interface InspectionScopeQuery {
  requiredIds: string[]
  overviewIds: string[]
}

/** Validity and containment only: no document copy, image cache or visual acceptance. */
export const createInspectionEvidence = (
  observe: (
    listener: (change?: InspectionDependencyChange) => void
  ) => () => void = observeInspectionChanges
) => {
  const sessionId = crypto.randomUUID()
  let revision = 0
  let stop: (() => void) | undefined
  let disposed = false
  const dependencies = createInspectionDependencies(dependencySource)
  const isCurrent = (value: unknown): value is InspectionEvidenceStamp => {
    if (disposed || !stop || !value || typeof value !== 'object') return false
    const stamp = value as Partial<InspectionEvidenceStamp>
    return (
      stamp.sessionId === sessionId &&
      typeof stamp.revision === 'number' &&
      (stamp.receiptId !== undefined
        ? dependencies.current({
            receiptId: stamp.receiptId,
            revision: stamp.revision
          })
        : stamp.revision === revision)
    )
  }
  const startObserving = () => {
    if (disposed) throw new Error('Inspection evidence is disposed.')
    stop ??= observe((change) => {
      revision++
      dependencies.change(change)
    })
  }
  const owner = {
    isCurrent,
    attachment: async (parentId?: string): Promise<Record<string, unknown>> => {
      startObserving()
      const start = revision
      const target = parentId ?? core.getCurrentWorkspaceId()
      if (!target) throw new Error('Attachment workspace is unavailable.')
      const snapshot = readAttachment(target)
      if (start !== revision)
        return {
          available: false,
          message: 'Attachment changed during capture.'
        }
      const stamp = dependencies.capture(target, undefined, revision, {
        signature: JSON.stringify(snapshot),
        chain: [...snapshot.parentPath, snapshot.result.workspaceId]
      })
      return { ...snapshot.result, evidence: { sessionId, ...stamp } }
    },
    validate: (stamp: unknown, scope?: InspectionScopeQuery) => {
      const current = isCurrent(stamp)
      const validatedAt = { sessionId, revision }
      if (!scope) return { current, validatedAt }
      const missingIds = new Set<string>()
      const parents = new Map<string, string | undefined>()
      const readParent = (id: string) => {
        if (!parents.has(id)) {
          const element = core.getElementData(id)
          if (!element) missingIds.add(id)
          parents.set(id, element?.parentId || undefined)
        }
        return parents.get(id)
      }
      const overviews = new Set(scope.overviewIds)
      const uncoveredIds: string[] = []
      if (current) {
        for (const id of overviews) readParent(id)
        for (const requiredId of new Set(scope.requiredIds)) {
          const visited = new Set<string>()
          let id: string | undefined = requiredId
          let covered = false
          let valid = true
          while (id) {
            if (visited.has(id)) {
              valid = false
              break
            }
            visited.add(id)
            const parent = readParent(id)
            if (missingIds.has(id)) {
              valid = false
              break
            }
            covered ||= overviews.has(id)
            id = parent
          }
          if (!covered || !valid) uncoveredIds.push(requiredId)
        }
      } else uncoveredIds.push(...scope.requiredIds)
      return {
        current,
        validatedAt,
        coverage: {
          complete:
            current &&
            scope.requiredIds.length > 0 &&
            missingIds.size === 0 &&
            uncoveredIds.length === 0,
          missingIds: [...missingIds],
          uncoveredIds
        }
      }
    },
    capture: async (
      capture: () => unknown | Promise<unknown>,
      scope?: { elementId: string; region?: InspectionRegion }
    ): Promise<Record<string, unknown>> => {
      startObserving()
      const evidence: InspectionEvidenceStamp = scope
        ? {
            sessionId,
            ...dependencies.capture(scope.elementId, scope.region, revision)
          }
        : { sessionId, revision }
      let result: unknown
      try {
        result = await capture()
      } catch (error) {
        dependencies.release(evidence)
        throw error
      }
      if (!isCurrent(evidence))
        return {
          available: false,
          message:
            'The document changed during inspection. Inspect the current drawing again.'
        }
      if (!result || typeof result !== 'object' || Array.isArray(result)) {
        dependencies.release(evidence)
        return { available: false }
      }
      const inspected = result as Record<string, unknown>
      if (inspected.available !== true) dependencies.release(evidence)
      return inspected.available === true
        ? { ...inspected, evidence }
        : inspected
    },
    dispose: () => {
      if (disposed) return
      disposed = true
      dependencies.dispose()
      stop?.()
      stop = undefined
    }
  }
  return owner
}
