// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createSyntheticExperimentDraft } from '../../../../samples/synthetic-experiment'
import { createSyntheticExample } from '../../../../samples/synthetic-workcell'
import { OFFICIAL_CLEARANCE_METHOD } from '../../../analysis/methods/official-method'
import { terminalAnalysisResult } from '../../../analysis/result'
import { createExperimentSnapshot } from '../../../analysis/snapshot'
import { validateRunRecord } from '../../../storage/run-record'
import { RunLibrary } from '../run-library'
import * as comparisonOwner from '../../../storage/run-comparison'

const observationAccess = {
  features: {
    observations: {
      prepare: vi.fn(),
      retain: vi.fn(),
      discard: vi.fn(),
      cancel: vi.fn()
    },
    edit: {
      addObservation: vi.fn(),
      updateObservation: vi.fn(),
      removeObservation: vi.fn()
    }
  },
  getObservations: () => [],
  getObservationAttachment: vi.fn(),
  exportObservations: vi.fn()
}

let host: HTMLDivElement

let root: Root

const originalShow = HTMLDialogElement.prototype.showModal

const originalClose = HTMLDialogElement.prototype.close

const originalScroll = HTMLElement.prototype.scrollIntoView

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.useFakeTimers({
    toFake: ['requestAnimationFrame', 'cancelAnimationFrame']
  })
  HTMLElement.prototype.scrollIntoView = vi.fn()
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: true }))
  )

  HTMLDialogElement.prototype.showModal = vi.fn()

  HTMLDialogElement.prototype.close = vi.fn()

  host = document.createElement('div')

  document.body.append(host)

  root = createRoot(host)
})

afterEach(async () => {
  await act(() => root.unmount())

  host.remove()

  HTMLDialogElement.prototype.showModal = originalShow

  HTMLDialogElement.prototype.close = originalClose

  HTMLElement.prototype.scrollIntoView = originalScroll
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function record(id: string, threshold = 0.01) {
  const example = createSyntheticExample()

  const draft = createSyntheticExperimentDraft(example)

  draft.rule.minimumClearance = threshold

  const snapshot = createExperimentSnapshot({
    snapshotId: `snapshot-${id}`,
    candidateId: 'candidate',
    experimentId: 'study',
    workcell: example.workcell,
    definition: { ...draft, revision: 1, rule: { ...draft.rule, revision: 1 } },
    methods: [OFFICIAL_CLEARANCE_METHOD],
    acknowledgedWarningCodes: []
  })

  return validateRunRecord({
    version: 1,
    name: id,
    retainedAt: new Date().toISOString(),
    environment: {
      appVersion: 'test',
      userAgent: 'Test browser',
      hardwareConcurrency: 8
    },
    snapshot,
    result: terminalAnalysisResult(snapshot, [], {
      runId: id,
      startedAt: 0,
      endedAt: 1,
      execution: 'cancelled',
      error: 'Cancelled by user'
    })
  })
}

const button = (text: string) => {
  const found = [...host.querySelectorAll('button')].find(
    (item) => item.textContent === text
  )

  if (!found) throw new Error(`Missing button: ${text}`)

  return found
}

it('discloses incompatible comparisons and limits selection to three immutable runs', async () => {
  const runs = [record('a'), record('b', 0.03), record('c'), record('d')]

  await act(() =>
    root.render(
      createElement(RunLibrary, {
        runs,
        retainedIds: new Set<string>(['a']),
        candidateIds: new Set(['candidate']),
        onRetain: vi.fn(),
        onReplay: vi.fn(),
        onCandidate: vi.fn(),
        isStale: () => false,
        onClose: vi.fn(),
        runtime: observationAccess,
        isCurrent: () => true
      })
    )
  )

  for (const id of ['a', 'b', 'c']) {
    await act(() =>
      host
        .querySelector<HTMLInputElement>(`[aria-label="Compare ${id}"]`)
        ?.click()
    )
  }

  expect(
    host.querySelector<HTMLInputElement>('[aria-label="Compare d"]')?.disabled
  ).toBe(true)

  await act(() => button('Compare selected runs (3/3)').click())
  await completeComparison()

  const comparison = host.querySelector('[aria-label="Run comparison"]')

  expect(comparison?.textContent).toContain('Not directly comparable')

  expect(comparison?.textContent).toContain('Decision rules differ')

  expect(
    comparison?.querySelectorAll('.comparison-columns > article')
  ).toHaveLength(3)

  expect(comparison?.textContent).toContain('rule.minimumClearance')

  expect(comparison?.textContent).toContain('unresolved/missing pairs')
})

it('retains the exact result and reports failure without claiming acknowledgement', async () => {
  const run = record('a')

  const onRetain = vi.fn(async () => {
    throw new Error('Missing source candidate')
  })

  const props = {
    runs: [run],
    retainedIds: new Set<string>(),
    candidateIds: new Set(['candidate']),
    onRetain,
    onReplay: vi.fn(),
    onCandidate: vi.fn(),
    isStale: () => false,
    onClose: vi.fn(),
    runtime: observationAccess,
    isCurrent: () => true
  }

  await act(() => root.render(createElement(RunLibrary, props)))

  await act(async () => {
    button('Retry retention').click()

    await Promise.resolve()
  })

  expect(onRetain).toHaveBeenCalledWith(run)

  expect(host.querySelector('[role="alert"]')?.textContent).toBe(
    'Missing source candidate'
  )

  expect(host.querySelector('.run-detail')?.textContent).toContain(
    'Temporary result'
  )

  await act(() =>
    root.render(
      createElement(RunLibrary, { ...props, retainedIds: new Set(['a']) })
    )
  )

  expect(
    [...host.querySelectorAll('button')].some(
      (node) => node.textContent === 'Retry retention'
    )
  ).toBe(false)

  expect(host.querySelector('.run-detail')?.textContent).toContain(
    'Retained in project'
  )
})

it('identifies selected revisions in selection order and removes a slot without navigating history', async () => {
  const runs = [record('a'), record('b', 0.03), record('c')]
  const before = JSON.stringify(runs)
  const onReplay = vi.fn(),
    onRetain = vi.fn(),
    onCandidate = vi.fn()
  await act(() =>
    root.render(
      createElement(RunLibrary, {
        runs,
        retainedIds: new Set(['a', 'b', 'c']),
        candidateIds: new Set(['candidate']),
        onRetain,
        onReplay,
        onCandidate,
        isStale: () => false,
        onClose: vi.fn(),
        runtime: observationAccess,
        isCurrent: () => true
      })
    )
  )
  for (const id of ['c', 'a'])
    await act(() =>
      host
        .querySelector<HTMLInputElement>(`[aria-label="Compare ${id}"]`)
        ?.click()
    )
  const selection = host.querySelector(
    '[aria-label="Selected comparison runs"]'
  )
  expect(selection?.textContent).toContain('1 - c')
  expect(selection?.textContent).toContain('2 - a')
  expect(selection?.textContent).toContain('Experiment revision 1')
  await act(() => button('Compare selected runs (2/3)').click())
  await completeComparison()
  const comparison = host.querySelector('[aria-label="Run comparison"]')
  expect(
    [...(comparison?.querySelectorAll('article h4') ?? [])].map(
      (node) => node.textContent
    )
  ).toEqual(['1 - c', '2 - a'])
  expect(comparison?.textContent).toContain('Candidate: candidate')
  expect(comparison?.textContent).toContain('Experiment: study')
  expect(comparison?.textContent).toContain('Execution: cancelled')
  expect(comparison?.textContent).toContain('Coverage: partial')
  expect(comparison?.textContent).toContain('Verdict: cannot-determine')
  await act(() => button('Remove 1 - c').click())
  expect(host.querySelector('[aria-label="Run comparison"]')).toBeNull()
  expect(button('Compare selected runs (1/3)').disabled).toBe(true)
  expect(onReplay).not.toHaveBeenCalled()
  expect(onRetain).not.toHaveBeenCalled()
  expect(onCandidate).not.toHaveBeenCalled()
  expect(JSON.stringify(runs)).toBe(before)
})

it('retires comparison when a canonical run disappears instead of displaying removed evidence', async () => {
  const compare = vi.spyOn(comparisonOwner, 'compareRuns')
  const runs = [record('a'), record('b')]
  const props = {
    runs,
    retainedIds: new Set(['a', 'b']),
    candidateIds: new Set(['candidate']),
    onRetain: vi.fn(),
    onReplay: vi.fn(),
    onCandidate: vi.fn(),
    isStale: () => false,
    onClose: vi.fn(),
    runtime: observationAccess,
    isCurrent: () => true
  }
  await act(() => root.render(createElement(RunLibrary, props)))
  for (const id of ['a', 'b'])
    await act(() =>
      host
        .querySelector<HTMLInputElement>(`[aria-label="Compare ${id}"]`)
        ?.click()
    )
  await act(() => button('Compare selected runs (2/3)').click())
  await completeComparison()
  expect(host.querySelector('[aria-label="Run comparison"]')).not.toBeNull()
  expect(compare).toHaveBeenCalledTimes(1)
  for (let index = 0; index < 5; index++)
    await act(() =>
      root.render(createElement(RunLibrary, { ...props, runs: [...runs] }))
    )
  expect(compare).toHaveBeenCalledTimes(1)
  expect(host.querySelector('[aria-label="Run comparison"]')).not.toBeNull()
  await act(() =>
    root.render(createElement(RunLibrary, { ...props, runs: [runs[0]] }))
  )
  expect(host.querySelector('[aria-label="Run comparison"]')).toBeNull()
  expect(button('Compare selected runs (1/3)').disabled).toBe(true)
  await act(() => root.render(createElement(RunLibrary, props)))
  expect(host.querySelector('[aria-label="Run comparison"]')).toBeNull()
  expect(button('Compare selected runs (1/3)').disabled).toBe(true)
  expect(compare).toHaveBeenCalledTimes(1)
})

async function completeComparison() {
  await act(() => vi.advanceTimersToNextFrame())
  await act(() => vi.advanceTimersToNextFrame())
}

async function selectPair() {
  const runs = [record('a'), record('b')]
  const props = {
    runs,
    retainedIds: new Set(['a', 'b']),
    candidateIds: new Set(['candidate']),
    onRetain: vi.fn(),
    onReplay: vi.fn(),
    onCandidate: vi.fn(),
    isStale: () => false,
    onClose: vi.fn(),
    runtime: observationAccess,
    isCurrent: () => true
  }
  await act(() => root.render(createElement(RunLibrary, props)))
  for (const id of ['a', 'b'])
    await act(() =>
      host
        .querySelector<HTMLInputElement>(`[aria-label="Compare ${id}"]`)
        ?.click()
    )
  return props
}

it('paints pending feedback before comparing once and automatically reveals the completed result', async () => {
  await selectPair()
  const compare = vi.spyOn(comparisonOwner, 'compareRuns')
  const action = button('Compare selected runs (2/3)')
  await act(() => {
    action.click()
    action.click()
  })
  expect(action.textContent).toContain('Comparing runs')
  expect(action.disabled).toBe(true)
  expect(action.getAttribute('aria-busy')).toBe('true')
  expect(compare).not.toHaveBeenCalled()
  await act(() => vi.advanceTimersToNextFrame())
  expect(compare).not.toHaveBeenCalled()
  await act(() => vi.advanceTimersToNextFrame())
  expect(compare).toHaveBeenCalledTimes(1)
  const result = host.querySelector<HTMLElement>(
    '[aria-label="Run comparison"]'
  )
  expect(result).not.toBeNull()
  expect(document.activeElement).toBe(result)
  expect(result?.scrollIntoView).toHaveBeenCalledTimes(1)
  expect(action.disabled).toBe(false)
  expect(action.getAttribute('aria-busy')).toBe('false')
})

it.each(['selection', 'source', 'unmount'])(
  'cancels pending comparison on %s change without stale navigation',
  async (change) => {
    const props = await selectPair()
    const compare = vi.spyOn(comparisonOwner, 'compareRuns')
    await act(() => button('Compare selected runs (2/3)').click())
    if (change === 'selection') await act(() => button('Remove 1 - a').click())
    if (change === 'source')
      await act(() =>
        root.render(
          createElement(RunLibrary, { ...props, runs: [props.runs[0]] })
        )
      )
    if (change === 'unmount') {
      await act(() => root.unmount())
      root = createRoot(host)
    }
    await completeComparison()
    expect(compare).not.toHaveBeenCalled()
    expect(host.querySelector('[aria-label="Run comparison"]')).toBeNull()
    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled()
  }
)

it('restores comparison action after failure and permits a fresh explicit retry', async () => {
  await selectPair()
  const compare = vi
    .spyOn(comparisonOwner, 'compareRuns')
    .mockImplementationOnce(() => {
      throw new Error('Comparison unavailable')
    })
  await act(() => button('Compare selected runs (2/3)').click())
  await completeComparison()
  expect(host.querySelector('[role="alert"]')?.textContent).toBe(
    'Comparison unavailable'
  )
  expect(button('Compare selected runs (2/3)').disabled).toBe(false)
  expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled()
  await act(() => button('Compare selected runs (2/3)').click())
  await completeComparison()
  expect(compare).toHaveBeenCalledTimes(2)
  expect(host.querySelector('[role="alert"]')).toBeNull()
  expect(document.activeElement).toBe(
    host.querySelector('[aria-label="Run comparison"]')
  )
})
