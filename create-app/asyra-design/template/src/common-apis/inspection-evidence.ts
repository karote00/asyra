import core from '../contexts'
import { observeDesignChanges } from './design-review'

import type { InspectionEvidenceStamp } from '../ai/inspection-evidence'

export interface InspectionScopeQuery {
  requiredIds: string[]
  overviewIds: string[]
}

/** Validity and containment only: no document copy, image cache or visual acceptance. */
export const createInspectionEvidence = (
  observe: (listener: () => void) => () => void = observeDesignChanges
) => {
  const sessionId = crypto.randomUUID()
  let revision = 0
  let stop: (() => void) | undefined
  let disposed = false
  const isCurrent = (value: unknown): value is InspectionEvidenceStamp => {
    if (disposed || !stop || !value || typeof value !== 'object') return false
    const stamp = value as Partial<InspectionEvidenceStamp>
    return stamp.sessionId === sessionId && stamp.revision === revision
  }
  return {
    isCurrent,
    validate: (stamp: unknown, scope?: InspectionScopeQuery) => {
      const current = isCurrent(stamp)
      if (!scope) return { current }
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
      capture: () => unknown | Promise<unknown>
    ): Promise<Record<string, unknown>> => {
      if (disposed) throw new Error('Inspection evidence is disposed.')
      stop ??= observe(() => {
        revision++
      })
      const evidence = { sessionId, revision }
      const result = await capture()
      if (!isCurrent(evidence))
        return {
          available: false,
          message:
            'The document changed during inspection. Inspect the current drawing again.'
        }
      if (!result || typeof result !== 'object' || Array.isArray(result))
        return { available: false }
      const inspected = result as Record<string, unknown>
      return inspected.available === true
        ? { ...inspected, evidence }
        : inspected
    },
    dispose: () => {
      if (disposed) return
      disposed = true
      stop?.()
      stop = undefined
    }
  }
}
