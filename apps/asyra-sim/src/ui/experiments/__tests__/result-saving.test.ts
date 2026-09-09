// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { createSyntheticExample } from '../../../../samples/synthetic-workcell'
import { createSyntheticExperimentDraft } from '../../../../samples/synthetic-experiment'
import { createExperimentSnapshot } from '../../../analysis/snapshot'
import { terminalAnalysisResult } from '../../../analysis/result'
import { INSTALLED_METHOD_CATALOG } from '../../../extensions/installed-methods'
import { ExperimentInputReader } from '../../../storage/experiment-input'
import type {
  ProjectSession,
  PersistenceState
} from '../../../storage/project-session'
import { ViewSource } from '../../shared/view-source'
import { ExperimentResult } from '../experiment-result'

it('distinguishes canonical retention from acknowledged saving, failure and retry', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const example = createSyntheticExample()
  const draft = createSyntheticExperimentDraft(example)
  const snapshot = createExperimentSnapshot({
    snapshotId: 'save',
    candidateId: 'candidate',
    experimentId: 'study',
    workcell: example.workcell,
    definition: { ...draft, revision: 1, rule: { ...draft.rule, revision: 1 } },
    methods: INSTALLED_METHOD_CATALOG.descriptors,
    acknowledgedWarningCodes: []
  })
  const result = terminalAnalysisResult(snapshot, [], {
    runId: 'save-run',
    startedAt: 0,
    endedAt: 1,
    execution: 'failed',
    error: 'Worker failed'
  })
  const selectedRun = {
    version: 1 as const,
    name: 'Saved study',
    retainedAt: new Date().toISOString(),
    environment: {
      appVersion: 'test',
      userAgent: 'test',
      hardwareConcurrency: 1
    },
    snapshot,
    result
  }
  const state = new ViewSource<PersistenceState>({
    project: null,
    status: 'saving',
    busy: 'save',
    dirty: true,
    error: ''
  })
  const flush = vi.fn(async () => {
    state.publish({
      ...state.getSnapshot(),
      status: 'saved',
      busy: null,
      dirty: false,
      error: ''
    })
  })
  const session = {
    getState: state.getSnapshot,
    subscribe: state.subscribe,
    flush
  } as unknown as ProjectSession
  const host = document.createElement('div')
  const root = createRoot(host)
  const retain = vi.fn()
  try {
    await act(() =>
      root.render(
        createElement(ExperimentResult, {
          canonicalDraft: draft,
          inputReader: new ExperimentInputReader(),
          replayRun: vi.fn(),
          selectedRun,
          retainSelectedRun: retain,
          retainedIds: new Set([result.runId]),
          workcell: example.workcell,
          onOpenRuns: vi.fn(),
          session
        })
      )
    )
    expect(host.textContent).toContain('Saving to this project')
    expect(host.textContent).not.toContain('Saved to this project')
    await act(() =>
      state.publish({
        ...state.getSnapshot(),
        status: 'error',
        busy: null,
        error: 'Quota exceeded'
      })
    )
    expect(host.textContent).toContain('Quota exceeded')
    const retry = [...host.querySelectorAll('button')].find(
      (button) => button.textContent === 'Retry saving'
    )
    expect(retry).toBeDefined()
    await act(() => retry?.click())
    expect(flush).toHaveBeenCalledOnce()
    expect(retain).not.toHaveBeenCalled()
    expect(host.textContent).toContain('Saved to this project')
  } finally {
    await act(() => root.unmount())
    vi.unstubAllGlobals()
  }
})
