import { useCallback, useLayoutEffect, useSyncExternalStore } from 'react'
import type { SimRuntime } from '../../init/bootstrap'
import type { WorkbenchSnapshot } from '../../init/registered-views'

const empty: WorkbenchSnapshot = {
  candidateId: null,
  candidates: [],
  workcell: null,
  modelError: '',
  experiments: [],
  retainedRuns: [],
  runError: '',
  loadIssues: [],
  historyDepth: 0
}
const noSubscription = () => undefined
const identity = (snapshot: WorkbenchSnapshot) => snapshot

/** Core UI Context owns the values and their canonical invalidation. */
export function useWorkbenchData(
  runtime: SimRuntime | null,
  candidateId: string | null
) {
  const subscribe = useCallback(
    (listener: () => void) =>
      runtime?.views.subscribe(identity, listener) ?? noSubscription,
    [runtime]
  )
  const getSnapshot = useCallback(
    () => runtime?.views.getSnapshot() ?? empty,
    [runtime]
  )
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  useLayoutEffect(() => {
    runtime?.views.selectCandidate(candidateId)
  }, [runtime, candidateId])
  if (snapshot.candidateId !== candidateId)
    return { ...snapshot, workcell: null, experiments: [] }
  return snapshot
}
