import { ExperimentInputReader } from '../../../storage/experiment-input'
import * as importer from '../../../storage/trajectory-import'
import {
  canonicalCsvMapping,
  trajectoryToCsv
} from '../../experiments/experiment-draft'
// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { createSyntheticExperimentDraft } from '../../../../samples/synthetic-experiment'
import { createSyntheticExample } from '../../../../samples/synthetic-workcell'
import { ORIGINAL_PART_METHOD } from '../../../analysis/methods/original-part-method'
import { terminalAnalysisResult } from '../../../analysis/result'
import { createExperimentSnapshot } from '../../../analysis/snapshot'
import { IDENTITY_POSE } from '../../../domain/math'
import { resolvePartWorkcell } from '../../../domain/part-geometry'
import { INSTALLED_METHOD_CATALOG } from '../../../extensions/installed-methods'
import { AnalysisResultView } from '../analysis-result-view'
import { isPresentedRunStale } from '../run-freshness'

it('compares v2 results using actual source identity and placement, not retired primitive geometry', () => {
  const example = createSyntheticExample()

  const draft = createSyntheticExperimentDraft(example)

  const assetId = 'a'.repeat(64)

  example.workcell.bodies[0].visuals = [
    { version: 1, id: 'part', assetId, pose: IDENTITY_POSE, scale: [1, 1, 1] }
  ]

  const source = {
    source: { sha256: assetId },
    meshes: [
      {
        positions: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
        indices: [0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3]
      }
    ]
  }

  draft.method = {
    ...draft.method,
    id: ORIGINAL_PART_METHOD.id,
    version: ORIGINAL_PART_METHOD.version
  }

  const snapshot = createExperimentSnapshot({
    snapshotId: 'parts',
    candidateId: 'candidate',
    experimentId: 'experiment',
    workcell: resolvePartWorkcell(
      example.workcell,
      new Map([[assetId, source]])
    ),
    definition: { ...draft, revision: 1, rule: { ...draft.rule, revision: 1 } },
    methods: [ORIGINAL_PART_METHOD],
    acknowledgedWarningCodes: []
  })

  const run = {
    snapshot,
    result: terminalAnalysisResult(snapshot, [], {
      runId: 'parts-result',
      startedAt: 0,
      endedAt: 1,
      execution: 'cancelled',
      error: 'Cancelled'
    })
  }

  expect(isPresentedRunStale(run, example.workcell, draft)).toBe(false)

  const changed = structuredClone(example.workcell)

  const part = changed.bodies[0].visuals?.[0]

  if (!part) throw new Error('Missing original source binding')

  part.scale = [2, 1, 1]

  expect(isPresentedRunStale(run, changed, draft)).toBe(true)

  part.scale = [1, 1, 1]

  part.assetId = 'b'.repeat(64)

  expect(isPresentedRunStale(run, changed, draft)).toBe(true)
})

it('tracks geometric input changes while preserving frozen replay and partial lower bounds', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)

  const example = createSyntheticExample()

  const draft = createSyntheticExperimentDraft(example)

  const descriptor = structuredClone(INSTALLED_METHOD_CATALOG.descriptors[0])

  draft.rule.acceptance = {
    kind: 'all',
    conditions: [
      { kind: 'clearance', operator: 'above', value: 0.02 },
      { kind: 'penetration', expected: 'absent' }
    ]
  }

  descriptor.manifest.validation.evidence = 'Retained local validation evidence'

  const snapshot = createExperimentSnapshot({
    snapshotId: 'snapshot',
    candidateId: 'candidate',
    experimentId: 'experiment',
    workcell: example.workcell,
    definition: { ...draft, revision: 1, rule: { ...draft.rule, revision: 1 } },
    methods: [descriptor],
    acknowledgedWarningCodes: []
  })

  descriptor.manifest.validation.evidence = 'Changed after the run'

  const result = terminalAnalysisResult(
    snapshot,
    [
      {
        pairId: snapshot.pairs[0].id,
        evidence: {
          coverage: 'complete',
          lower: 1,
          upper: 1,
          evaluations: 1,
          leaves: [
            {
              start: 0,
              end: 8,
              lower: 1,
              upper: 1,
              witnessTime: 4,
              penetration: false,
              state: 'clear',
              reason: 'Independent test evidence'
            }
          ]
        }
      }
    ],
    {
      runId: 'run',
      startedAt: 0,
      endedAt: 1,
      execution: 'cancelled',
      error: 'Cancelled'
    }
  )

  const run = { snapshot, result }

  expect(isPresentedRunStale(run, example.workcell, draft)).toBe(false)

  const edited = structuredClone(example.workcell)

  edited.bodies[0].name = 'New display name'

  edited.bodies[0].color = 123

  expect(isPresentedRunStale(run, edited, draft)).toBe(false)

  edited.bodies[0].pose = { ...edited.bodies[0].pose, position: [1, 0, 0] }

  expect(isPresentedRunStale(run, edited, draft)).toBe(true)

  const host = document.createElement('div')

  const root = createRoot(host)

  const replay = vi.fn()

  try {
    await act(() =>
      root.render(
        createElement(AnalysisResultView, {
          run,
          stale: true,
          onReplay: replay
        })
      )
    )

    expect(host.textContent).toContain('Historical inputs differ')

    expect(host.textContent).toContain('Retained method declaration')

    expect(host.textContent).toContain('Retained local validation evidence')

    expect(host.textContent).not.toContain('Changed after the run')

    expect(host.textContent).toContain('User acceptance evaluation')

    expect(host.textContent).toContain('Condition 1.1 - unknown')

    expect(host.textContent).toContain('not a safety approval')

    expect(host.querySelector('[aria-label="User verdict"]')?.textContent).toBe(
      'User: cannot determine'
    )

    expect(host.textContent).toContain('Minimum lower bound0.000 mm')

    const a = snapshot.workcell.bodies.find(
      (body) => body.id === snapshot.pairs[0].a.bodyId
    )

    const b = snapshot.workcell.bodies.find(
      (body) => body.id === snapshot.pairs[0].b.bodyId
    )

    expect(
      host.querySelector('.evidence-pair > summary')?.textContent
    ).toContain(`${a?.name} - ${b?.name}`)

    const button = [...host.querySelectorAll('button')].find(
      (item) => item.textContent === 'Replay pair'
    )

    if (!button) throw new Error('Missing replay action')

    await act(() => button.click())

    expect(replay).toHaveBeenCalledWith(snapshot, 4, [
      snapshot.pairs[0].a.bodyId,
      snapshot.pairs[0].b.bodyId
    ])

    expect(snapshot.workcell.bodies[0].pose.position).not.toEqual([1, 0, 0])
  } finally {
    await act(() => root.unmount())

    vi.unstubAllGlobals()
  }
})

it('compares authored inputs using the shared executable result and treats current invalid input as stale', () => {
  const example = createSyntheticExample()
  const draft = createSyntheticExperimentDraft(example)
  const snapshot = createExperimentSnapshot({
    snapshotId: 'input',
    candidateId: 'candidate',
    experimentId: 'study',
    workcell: example.workcell,
    definition: { ...draft, revision: 1, rule: { ...draft.rule, revision: 1 } },
    methods: INSTALLED_METHOD_CATALOG.descriptors,
    acknowledgedWarningCodes: []
  })
  const run = {
    snapshot,
    result: terminalAnalysisResult(snapshot, [], {
      runId: 'input-run',
      startedAt: 0,
      endedAt: 1,
      execution: 'cancelled',
      error: 'Cancelled'
    })
  }
  const input = {
    version: 1 as const,
    kind: 'csv' as const,
    text: trajectoryToCsv(example.workcell, draft.trajectory),
    mapping: canonicalCsvMapping(example.workcell)
  }
  const reader = new ExperimentInputReader()
  reader.previewTrajectory(input, example.workcell)
  const convert = vi.spyOn(importer, 'previewTrajectoryCsv')
  try {
    expect(
      isPresentedRunStale(
        run,
        example.workcell,
        { ...draft, trajectoryInput: input },
        reader
      )
    ).toBe(false)
    expect(convert).not.toHaveBeenCalled()
    expect(
      isPresentedRunStale(
        run,
        example.workcell,
        { ...draft, trajectoryInput: { ...input, text: 'broken' } },
        reader
      )
    ).toBe(true)
    expect(convert).toHaveBeenCalledOnce()
    expect(
      isPresentedRunStale(
        run,
        example.workcell,
        { ...draft, trajectoryInput: input },
        reader
      )
    ).toBe(false)
    expect(convert).toHaveBeenCalledOnce()
  } finally {
    convert.mockRestore()
    reader.dispose()
  }
})

it('distinguishes retained penetration, clearance and unresolved intervals with exact replay times', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const example = createSyntheticExample()
  const draft = createSyntheticExperimentDraft(example)
  const snapshot = createExperimentSnapshot({
    snapshotId: 'mixed-evidence',
    candidateId: 'candidate',
    experimentId: 'experiment',
    workcell: example.workcell,
    definition: { ...draft, revision: 1, rule: { ...draft.rule, revision: 1 } },
    methods: INSTALLED_METHOD_CATALOG.descriptors,
    acknowledgedWarningCodes: []
  })
  const leaves = [
    {
      start: 0,
      end: 2,
      lower: 0,
      upper: 0,
      witnessTime: 1.123456789,
      penetration: true,
      state: 'finding' as const,
      reason: 'Established static witness.'
    },
    {
      start: 2,
      end: 4,
      lower: 0,
      upper: 0.01,
      witnessTime: 3,
      penetration: false,
      state: 'finding' as const,
      reason: 'Established static witness.'
    },
    {
      start: 4,
      end: 8,
      lower: 0,
      upper: null,
      witnessTime: null,
      penetration: false,
      state: 'unresolved' as const,
      reason: 'No retained witness.'
    }
  ]
  const result = terminalAnalysisResult(
    snapshot,
    [
      {
        pairId: snapshot.pairs[0].id,
        evidence: {
          coverage: 'partial',
          lower: 0,
          upper: 0,
          evaluations: 2,
          leaves
        }
      }
    ],
    {
      runId: 'mixed-run',
      startedAt: 0,
      endedAt: 1,
      execution: 'cancelled',
      error: 'Cancelled'
    }
  )
  const before = JSON.stringify({ snapshot, result })
  const host = document.createElement('div')
  const root = createRoot(host)
  const replay = vi.fn()
  try {
    await act(() =>
      root.render(
        createElement(AnalysisResultView, {
          run: { snapshot, result },
          stale: false,
          onReplay: replay
        })
      )
    )
    const pair = host.querySelector<HTMLDetailsElement>('.evidence-pair')
    if (!pair) throw new Error('Missing pair')
    await act(() => {
      pair.open = true
      pair.dispatchEvent(new Event('toggle'))
    })
    expect(pair.textContent).toContain('Collision - established penetration')
    expect(pair.textContent).toContain('Clearance violation')
    expect(pair.textContent).toContain('Unresolved')
    expect(pair.textContent).toContain('Witness time: 1.123456789 s')
    expect(pair.textContent).toContain('No retained witness')
    expect(pair.textContent).toContain('not first contact')
    const buttons = [...pair.querySelectorAll('button')].filter((button) =>
      /^Replay (witness|interval start)$/.test(button.textContent ?? '')
    )
    expect(buttons).toHaveLength(3)
    for (let index = 0; index < buttons.length; index++) {
      await act(() => buttons[index].click())
      expect(replay).toHaveBeenLastCalledWith(
        snapshot,
        leaves[index].witnessTime ?? leaves[index].start,
        [snapshot.pairs[0].a.bodyId, snapshot.pairs[0].b.bodyId]
      )
    }
    expect(JSON.stringify({ snapshot, result })).toBe(before)
  } finally {
    await act(() => root.unmount())
    vi.unstubAllGlobals()
  }
})
