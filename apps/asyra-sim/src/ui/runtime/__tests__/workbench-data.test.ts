// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { createSyntheticExample } from '../../../../samples/synthetic-workcell'
import type { SimRuntime } from '../../../init/bootstrap'
import type { WorkbenchSnapshot } from '../../../init/registered-views'
import { ViewSource } from '../../shared/view-source'
import { useWorkbenchData } from '../workbench-data'

it('consumes registered values without recapturing workcells or runs on unrelated notifications', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const root = createRoot(document.createElement('div'))
  const workcell = createSyntheticExample().workcell
  const initial: WorkbenchSnapshot = {
    candidateId: 'a',
    candidates: [{ id: 'a', name: 'A' }],
    workcell,
    modelError: '',
    experiments: [],
    retainedRuns: [],
    runError: '',
    loadIssues: [],
    historyDepth: 1
  }
  const source = new ViewSource(initial)
  const first = {
    views: { ...source, selectCandidate: vi.fn() },
    getCandidates: () => initial.candidates,
    getLoadIssues: () => [],
    getHistoryDepth: () => 1,
    getRuns: vi.fn(() => []),
    getWorkcell: vi.fn(() => structuredClone(workcell))
  }
  let snapshot: ReturnType<typeof useWorkbenchData> | undefined
  function View({ runtime }: { runtime: SimRuntime | null }) {
    snapshot = useWorkbenchData(runtime, 'a')
    return null
  }
  const render = (runtime: unknown) =>
    act(() =>
      root.render(
        createElement(View, { runtime: runtime as SimRuntime | null })
      )
    )
  try {
    await render(first)
    expect(snapshot?.workcell).toBe(workcell)
    expect(first.getWorkcell).not.toHaveBeenCalled()
    expect(first.getRuns).not.toHaveBeenCalled()
    await act(() => source.publish({ ...initial, historyDepth: 2 }))
    expect(snapshot?.workcell).toBe(workcell)
    expect(snapshot?.historyDepth).toBe(2)
    const empty = {
      ...initial,
      workcell: null,
      modelError: 'Invalid candidate'
    }
    await act(() => source.publish(empty))
    expect(snapshot?.modelError).toBe('Invalid candidate')
    await render(null)
    expect(snapshot?.workcell).toBeNull()
    expect(snapshot?.historyDepth).toBe(0)
  } finally {
    await act(() => root.unmount())
    vi.unstubAllGlobals()
  }
})
