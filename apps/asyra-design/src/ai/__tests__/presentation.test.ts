import { reduceAiActivity } from '../activity-state'
import { describe, expect, it } from 'vitest'
import { projectAiActivity, createAiActivityProjection } from '../presentation'
import {
  canRetryAiTurn,
  formatElapsedTime,
  projectAiDrawingDetailChoice,
  summarizeAiTurn
} from '../presentation'
import { AiActionNames, AiDrawingDetailOptionIds } from '../../constants'

const turn = (
  outcome: 'cancelled' | 'failed' | 'no-change' | 'partial' | 'success'
) => ({
  attachments: [],
  conversationId: 'conversation-a',
  durationMs: 1_250,
  intent: 'request',
  outcome,
  progress: [],
  result: {
    actionResults: [
      {
        actionId: 'secret-action-id',
        actionName: 'secret-action-name',
        result: {
          appliedElementIds: ['secret-canonical-id'],
          skipped: [{ reason: 'secret-reason' }],
          status: outcome === 'partial' ? 'partial' : 'complete'
        }
      }
    ],
    providerBody: 'secret-provider-body',
    status: 'executed'
  },
  turnId: 'conversation-a:turn:1'
})

describe('Asyra Design AI presentation summaries', () => {
  it('keeps the sanitized action explanation when no member survives the failed request', () => {
    const reason =
      'The original drawing is missing. Select the drawing to revise and try again.'
    const failed = {
      ...turn('failed'),
      result: {
        status: 'failed',
        stage: 'execution',
        code: 'AI_EXECUTION_FAILED',
        message: reason,
        transaction: { status: 'rolled-back' }
      }
    }
    expect(summarizeAiTurn(failed).message).toContain(reason)
    expect(summarizeAiTurn(failed).message).toContain('rolled back')
    expect(
      summarizeAiTurn({
        ...failed,
        result: { ...failed.result, stage: 'transaction' }
      }).message
    ).not.toContain(reason)
  })

  it('explains retained work after stopping a grouped request without requiring action receipts', () => {
    const stopped = {
      ...turn('cancelled'),
      result: {
        status: 'cancelled',
        transaction: { status: 'committed' }
      }
    }
    expect(summarizeAiTurn(stopped).message).toBe(
      'The request was stopped. Changes already applied have been kept.'
    )
    expect(canRetryAiTurn(stopped)).toBe(false)
  })

  it('explains a failed refinement with retained changes without offering replay', () => {
    const failed = {
      ...turn('partial'),
      result: {
        status: 'failed',
        stage: 'execution',
        failedAction: AiActionNames.UPDATE_COMPOSITION_ELEMENTS,
        transaction: { status: 'committed' }
      }
    }
    expect(summarizeAiTurn(failed).message).toBe(
      'Refining the drawing could not be completed. Changes already applied have been kept.'
    )
    expect(canRetryAiTurn(failed)).toBe(false)
  })

  it('never claims an unknown rollback left the canvas unchanged or permits replay', () => {
    const failed = {
      ...turn('failed'),
      result: {
        status: 'failed',
        stage: 'provider',
        transaction: { status: 'unknown' }
      }
    }
    expect(summarizeAiTurn(failed).message).toBe(
      'The request stopped, but its final change state could not be confirmed. Review the canvas before continuing.'
    )
    expect(canRetryAiTurn(failed)).toBe(false)
  })

  it('uses distinct safe summaries for every terminal outcome', () => {
    const summaries = [
      'success',
      'partial',
      'no-change',
      'cancelled',
      'failed'
    ].map((outcome) =>
      summarizeAiTurn(turn(outcome as Parameters<typeof turn>[0]))
    )

    expect(summaries.map((summary) => summary.message)).toEqual([
      'Updated 1 editable element.',
      'Partially updated the drawing: 1 applied, 1 skipped.',
      'No canvas changes were needed.',
      'The request was cancelled.',
      'The request failed. Review the canvas before trying again.'
    ])
    expect(summaries.map((summary) => summary.durationLabel)).toEqual(
      Array.from({ length: 5 }, () => '1.3s')
    )
    expect(
      summarizeAiTurn({
        ...turn('success'),
        durationMs: 40_500
      }).durationLabel
    ).toBe('41s')
    expect(
      summarizeAiTurn({
        ...turn('success'),
        durationMs: 65_000
      }).durationLabel
    ).toBe('1m 5s')
    expect(new Set(summaries.map((summary) => summary.message))).toHaveProperty(
      'size',
      5
    )
    expect(JSON.stringify(summaries)).not.toMatch(
      /secret-action|secret-canonical|secret-provider|secret-reason/
    )
  })

  it('projects only the exact registered drawing-detail clarification as App-owned choices', () => {
    const clarificationTurn = {
      ...turn('no-change'),
      result: {
        actionResults: [
          {
            actionId: 'provider-action-id-is-not-presented',
            actionName: AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE,
            result: {
              action: AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE,
              clarification: {
                kind: 'drawing-detail',
                optionIds: [
                  AiDrawingDetailOptionIds.BALANCED,
                  AiDrawingDetailOptionIds.MAXIMUM
                ]
              },
              status: 'no-change'
            }
          }
        ],
        providerBody: 'provider-detail-wording-is-not-presented',
        status: 'executed'
      }
    }

    const projection = projectAiDrawingDetailChoice(clarificationTurn)

    expect(projection).toEqual({
      choices: [
        {
          description: 'Faster and lighter for editing.',
          id: AiDrawingDetailOptionIds.BALANCED,
          label: 'Balanced detail',
          resourceWarning: null
        },
        {
          description:
            'Preserves more detail with potentially more editable shapes.',
          id: AiDrawingDetailOptionIds.MAXIMUM,
          label: 'Maximum detail',
          resourceWarning:
            'May temporarily use much more memory and reduce app responsiveness.'
        }
      ],
      kind: 'drawing-detail'
    })
    expect(summarizeAiTurn(clarificationTurn).message).toBe(
      'Choose a drawing detail level.'
    )
    expect(JSON.stringify(projection)).not.toMatch(
      /provider-action|provider-detail/
    )
    expect(
      projectAiDrawingDetailChoice({
        ...clarificationTurn,
        result: {
          ...clarificationTurn.result,
          actionResults: [
            {
              ...clarificationTurn.result.actionResults[0],
              actionName: 'unregistered-provider-action'
            }
          ]
        }
      })
    ).toBeNull()
  })
})

describe('capability outcomes', () => {
  it('explains an unsupported remainder after earlier changes without replacing it with success', () => {
    const original = turn('partial')
    const result = {
      ...original,
      result: {
        ...original.result,
        actionResults: [
          ...original.result.actionResults,
          {
            actionId: 'outcome',
            actionName: 'report_outcome',
            result: {
              status: 'no-change',
              outcome: 'unsupported',
              message:
                'I traced the image, but this app cannot cut the connected mark.'
            }
          }
        ]
      }
    }
    expect(summarizeAiTurn(result).message).toContain(
      'cannot cut the connected mark'
    )
    expect(summarizeAiTurn(result).message).toBe(
      'I traced the image, but this app cannot cut the connected mark.'
    )
  })
})

describe('shared current activity and activity history', () => {
  it('keeps one entry per research or drawing loop and preserves phase transitions', () => {
    const tool = (name: string, toolStatus: 'running' | 'completed') => ({
      attempt: 1,
      phase: 'provider' as const,
      tool: name,
      toolStatus,
      summary: 'Tool'
    })
    const updates = [
      tool('research_design_context', 'running'),
      tool('research_design_context', 'completed'),
      tool('search_reference_images', 'running'),
      tool('search_reference_images', 'completed'),
      tool('import_reference_image', 'running'),
      tool('import_reference_image', 'completed'),
      tool('prepare_design', 'running'),
      tool('prepare_design', 'completed'),
      tool('inspect_drawing', 'running'),
      tool('inspect_drawing', 'completed'),
      { attempt: 1, phase: 'resolution' as const, summary: 'Resolve' },
      { attempt: 1, phase: 'permission' as const, summary: 'Check' },
      tool('update_design_element', 'running'),
      tool('update_design_element', 'completed'),
      tool('review_design', 'running'),
      tool('research_design_context', 'running')
    ]
    expect(projectAiActivity(updates).entries).toEqual([
      { label: 'Researching design context' },
      { label: 'Drawing and refining' },
      { label: 'Researching design context' }
    ])
    expect(updates).toHaveLength(16)
  })

  it('reuses the latest activity description without exposing tools or AI wait states', () => {
    const projection = projectAiActivity([
      { attempt: 1, phase: 'context', summary: 'legacy context' },
      {
        attempt: 1,
        phase: 'provider',
        tool: 'vtracer',
        toolStatus: 'running',
        summary: 'Running a tool'
      },
      {
        attempt: 1,
        phase: 'provider',
        tool: 'vtracer',
        toolStatus: 'completed',
        summary: 'Tool completed'
      }
    ])
    expect(projection.entries.map((entry) => entry.label)).toEqual([
      'Reviewing the drawing',
      'Converting artwork to vectors'
    ])
    expect(projection.current).toBe(projection.entries.at(-1))
  })
  it('keeps backend operation messages attached to their event and projects real control states', () => {
    const updates = [
      {
        attempt: 1,
        phase: 'provider' as const,
        tool: 'set_element_visibility',
        toolStatus: 'running' as const,
        summary: 'Running a tool',
        message: 'Hiding the mark',
        activity: { kind: 'work' as const, callId: 'hide', sequence: 1 }
      }
    ]
    const projection = projectAiActivity(updates)
    expect(projection.current).toMatchObject({
      label: 'Adjusting element visibility',
      message: 'Hiding the mark'
    })
    for (const [state, label] of [
      [{ stopping: true }, 'Stopping…'],
      [{ awaitingApproval: true }, 'Awaiting approval']
    ] as const) {
      const controlled = projectAiActivity(updates, state)
      expect(controlled.current).toBe(controlled.entries.at(-1))
      expect(controlled.current.label).toBe(label)
    }
  })
})

it('ends history with the authoritative result even when cancellation emitted no terminal progress', () => {
  const projection = projectAiActivity(
    [
      {
        attempt: 1,
        phase: 'provider',
        tool: 'vtracer',
        toolStatus: 'running',
        summary: 'Running a tool'
      }
    ],
    { outcome: 'cancelled' }
  )
  expect(projection.entries.at(-1)?.label).toBe('Stopped')
})

it('describes provider work and unknown tools without exposing implementation names', () => {
  for (const update of [
    {
      attempt: 1,
      phase: 'provider' as const,
      summary: 'Waiting for AI response'
    },
    {
      attempt: 1,
      phase: 'provider' as const,
      summary: 'Running a tool',
      tool: 'private_internal_tool',
      toolStatus: 'running' as const
    }
  ]) {
    const projection = projectAiActivity([update])
    expect(projection.current.label).toBe('Planning the drawing')
    expect(projection.current).toBe(projection.entries.at(-1))
  }
})

it('starts elapsed time at zero without inventing a minimum duration', () => {
  for (const duration of [-1, 0, 1, 24, 49]) {
    expect(formatElapsedTime(duration)).toBe('0s')
  }
  expect(formatElapsedTime(100)).toBe('0.1s')
  expect(formatElapsedTime(1250)).toBe('1.3s')
})

it('shows concise execution descriptions instead of Applying changes', () => {
  for (const summary of [
    'Smoothing the outlines',
    'Reshaping the tail',
    '正在調整屋頂顏色'
  ]) {
    expect(
      projectAiActivity([
        {
          attempt: 1,
          phase: 'execution',
          summary,
          activity: { kind: 'work', callId: 'update', sequence: 1 },
          tool: AiActionNames.UPDATE_COMPOSITION_ELEMENTS
        }
      ]).current.label
    ).toBe(summary)
  }
  for (const summary of [
    'Applying changes',
    'Updating the drawing',
    ' '.repeat(3),
    'x'.repeat(1001)
  ]) {
    expect(
      projectAiActivity([
        {
          attempt: 1,
          phase: 'execution',
          summary,
          tool: AiActionNames.UPDATE_COMPOSITION_ELEMENTS
        }
      ]).current.label
    ).toBe('Refining the drawing')
  }
})

it('names design preparation and application without exposing backend identifiers', () => {
  for (const [tool, label] of [
    ['prepare_design', 'Drawing and refining'],
    ['apply_prepared_design', 'Drawing and refining']
  ]) {
    const projection = projectAiActivity([
      {
        attempt: 1,
        phase: 'provider',
        summary: 'Running a tool',
        tool,
        toolStatus: 'running'
      }
    ])
    expect(projection.current.label).toBe(label)
  }
})

it('preserves model operation messages regardless of language', () => {
  const updates = [
    {
      attempt: 1,
      phase: 'provider' as const,
      tool: 'read_design_context',
      toolStatus: 'running' as const,
      summary: '讀取目前選取',
      message: '讀取目前選取',
      activity: { kind: 'work' as const, callId: 'read', sequence: 1 }
    }
  ]
  const result = projectAiActivity(updates)
  expect(result.entries).toEqual([
    { label: 'Reading the design', message: '讀取目前選取' }
  ])
  expect(updates[0].message).toBe('讀取目前選取')
})

it('does not append Finished after a failed execution retained partial progress', () => {
  const result = projectAiActivity(
    [
      {
        attempt: 1,
        phase: 'execution',
        tool: AiActionNames.REPLACE_VECTOR_COMPOSITION,
        summary: 'Replacing the drawing'
      },
      { attempt: 1, phase: 'settled', outcome: 'failed', summary: 'Failed' }
    ],
    { outcome: 'partial' }
  )
  expect(result.entries.map((entry) => entry.label)).toEqual([
    'Replacing the drawing',
    'Failed'
  ])
})

it('explains the actual failed step with the safe public reason and recovery', () => {
  expect(
    summarizeAiTurn({
      ...turn('partial'),
      result: {
        status: 'failed',
        stage: 'execution',
        code: 'AI_EXECUTION_FAILED',
        failedAction: AiActionNames.REPLACE_VECTOR_COMPOSITION,
        message:
          'The revision target no longer exists. Select the drawing again.',
        transaction: { status: 'committed' }
      }
    }).message
  ).toBe(
    'Replacing the drawing could not be completed. The revision target no longer exists. Select the drawing again. Changes already applied have been kept.'
  )
})

describe('concrete current work', () => {
  let activitySequence = 0
  const running = (message?: string) => ({
    activity: {
      kind: 'work' as const,
      callId: 'work',
      sequence: ++activitySequence
    },
    attempt: 1,
    phase: 'provider' as const,
    tool: 'update_design_element',
    toolStatus: 'running' as const,
    summary: 'Running a tool',
    ...(message === undefined ? {} : { message })
  })

  it('keeps concrete work inside drawing loops through internal phases and acknowledgements', () => {
    const first = running('正在加入窗戶光影反射效果')
    const second = running('正在調整屋頂顏色')
    const updates = [
      first,
      {
        ...first,
        phase: 'resolution' as const,
        toolStatus: undefined,
        message: undefined
      },
      {
        ...first,
        phase: 'permission' as const,
        toolStatus: undefined,
        message: undefined
      },
      {
        ...first,
        phase: 'execution' as const,
        toolStatus: undefined,
        message: undefined,
        summary: '正在加入窗戶光影反射效果'
      },
      { ...first, toolStatus: 'completed' as const },
      second,
      { ...first, toolStatus: 'completed' as const },
      second
    ]
    const snapshot = structuredClone(updates)
    const activity = projectAiActivity(updates)
    expect(activity.entries).toEqual([
      { label: 'Drawing and refining', message: first.message },
      { label: 'Drawing and refining', message: second.message }
    ])
    expect(activity.current).toBe(activity.entries.at(-1))
    expect(updates).toEqual(snapshot)
  })

  it('accepts a concrete execution summary after a generic preparation loop', () => {
    const activity = projectAiActivity([
      running(),
      {
        attempt: 1,
        phase: 'execution',
        tool: 'execute_design_batch',
        summary: 'Removing covered objects',
        activity: {
          kind: 'work',
          callId: 'remove',
          sequence: ++activitySequence
        }
      }
    ])
    expect(activity.current.message ?? activity.current.label).toBe(
      'Removing covered objects'
    )
  })

  it('shows bounded authored text without guessing missing or oversized descriptions', () => {
    const detailed =
      'Adjusting the roof color to match the selected source and keeping the existing window reflections and shadows intact'
    expect(projectAiActivity([running(detailed)]).current.message).toBe(
      detailed
    )
    for (const message of [undefined, '', '   ', 'x'.repeat(1001)]) {
      expect(
        projectAiActivity([running('Adding windows'), running(message)]).current
      ).toEqual({ label: 'Drawing and refining', message: 'Adding windows' })
    }
  })

  it('preserves announced work through generic read, review and planning substeps', () => {
    const first = running('Adding window reflections')
    const internal = [
      { attempt: 1, phase: 'provider' as const, summary: 'Planning' },
      { attempt: 1, phase: 'context' as const, summary: 'Context' },
      {
        attempt: 1,
        phase: 'execution' as const,
        tool: 'read_design_context',
        summary: 'Reading the design'
      },
      {
        attempt: 1,
        phase: 'execution' as const,
        tool: 'inspect_drawing',
        summary: 'Reviewing the drawing'
      },
      {
        attempt: 1,
        phase: 'execution' as const,
        tool: 'validate_inspection_evidence',
        summary: 'Checking inspection freshness'
      },
      { ...running(), tool: 'read_design_context' }
    ]
    for (let count = 1; count <= internal.length; count++) {
      const projected = projectAiActivity([first, ...internal.slice(0, count)])
      expect(projected.current.message ?? projected.current.label).toBe(
        first.message
      )
      expect(projected.entries).toHaveLength(1)
    }
    const next = projectAiActivity([
      first,
      ...internal,
      running('Adjusting the roof color')
    ])
    expect(next.entries.map((entry) => entry.message ?? entry.label)).toEqual([
      'Adding window reflections',
      'Adjusting the roof color'
    ])
    expect(projectAiActivity(internal).current).toBeDefined()
  })

  it('lets control and terminal state override concrete work', () => {
    for (const [state, label] of [
      [{ stopping: true }, 'Stopping…'],
      [{ awaitingApproval: true }, 'Awaiting approval'],
      [{ outcome: 'success' as const }, 'Finished'],
      [{ outcome: 'failed' as const }, 'Failed'],
      [{ outcome: 'cancelled' as const }, 'Stopped']
    ] as const) {
      expect(
        projectAiActivity([running('Adjusting the roof color')], state).current
      ).toEqual({ label })
    }
    expect(
      projectAiActivity([
        running('Adding windows'),
        {
          attempt: 1,
          phase: 'settled',
          summary: 'Done',
          message: 'Old work',
          outcome: 'failed'
        }
      ]).current
    ).toEqual({ label: 'Failed' })
  })
})

it('retains authored work when a real system message arrives and rejects older starts', () => {
  const work = {
    attempt: 1,
    phase: 'provider' as const,
    tool: 'execute_design_batch',
    toolStatus: 'running' as const,
    summary: 'Running a tool',
    message: 'Adding window reflections',
    activity: { kind: 'work' as const, callId: 'call-1', sequence: 2 }
  }
  const system = {
    ...work,
    tool: 'prepare_design',
    message: 'Preparing the design',
    activity: { kind: 'system' as const, callId: 'call-2', sequence: 3 }
  }
  const old = {
    ...work,
    message: 'Adding the base',
    activity: { kind: 'work' as const, callId: 'call-0', sequence: 1 }
  }
  expect(projectAiActivity([work, system, old]).current.message).toBe(
    'Adding window reflections'
  )
  expect(projectAiActivity([system]).current.message).toBeUndefined()
})

it('records each activity decision without rereading earlier progress', () => {
  let reads = 0
  const first = {
    get phase() {
      reads++
      return 'provider' as const
    },
    attempt: 1,
    summary: 'Preparing',
    tool: 'draw',
    toolStatus: 'running' as const,
    message: 'Adding windows',
    activity: { kind: 'work' as const, callId: 'a', sequence: 1 }
  }
  const projection = createAiActivityProjection()
  expect(projection.append(first)).toMatchObject({ reason: 'authored-work' })
  const captured = reads
  expect(
    projection.append({
      phase: 'provider',
      attempt: 1,
      summary: 'Checking',
      tool: 'read',
      toolStatus: 'running',
      activity: { kind: 'system', callId: 'b', sequence: 2 }
    })
  ).toMatchObject({ reason: 'system-progress-after-work' })
  expect(reads).toBe(captured)
})

// Lifecycle rules are independent of the language or amount of authored work.
describe('activity lifecycle transitions', () => {
  const work = (sequence: number) => ({
    attempt: 1,
    phase: 'provider' as const,
    summary: 'Running',
    message: 'Adding windows',
    activity: { kind: 'work' as const, callId: `call-${sequence}`, sequence }
  })

  it.each([
    { phase: 'settlement' as const, summary: 'Saving the drawing' },
    { phase: 'settled' as const, summary: 'Done', outcome: 'executed' as const }
  ])('does not reopen $phase on late work', (control) => {
    const projection = createAiActivityProjection()
    projection.append(work(1))
    projection.append({ attempt: 1, ...control })
    const before = projection.result()
    expect(projection.append(work(2)).status).toBe('rejected')
    expect(projection.result()).toEqual(before)
  })

  it('keeps projection reads out of the activity history', () => {
    const projection = createAiActivityProjection()
    const empty = projection.result()
    expect(projection.result()).toEqual(empty)
    projection.append(work(1))
    expect(empty.entries).toEqual([{ label: 'Starting request' }])
    expect(projection.result().entries).toHaveLength(1)
  })

  it('resumes approval on running progress, never on a late acknowledgement', () => {
    const projection = createAiActivityProjection()
    projection.append(work(1))
    projection.append({
      attempt: 1,
      phase: 'confirmation',
      summary: 'Approval'
    })
    projection.append({ ...work(2), toolStatus: 'completed' })
    expect(projection.result().current.label).toBe('Awaiting approval')
    projection.append({ attempt: 1, phase: 'execution', summary: 'Execute' })
    expect(projection.result().current.message).toBe('Adding windows')
  })

  it('accepts failure during saving and retains it after later progress', () => {
    const projection = createAiActivityProjection()
    projection.append({
      attempt: 1,
      phase: 'settlement',
      summary: 'Saving the drawing'
    })
    projection.append({
      attempt: 1,
      phase: 'settled',
      summary: 'Failed',
      outcome: 'failed'
    })
    projection.append({ ...work(3), attempt: 2 })
    expect(projection.result().current).toEqual({ label: 'Failed' })
  })
})

describe('explicit activity state machine guards', () => {
  const initial = () => ({
    lifecycle: 'running' as const,
    entry: { label: 'Starting request' },
    attempt: 0,
    sequence: 0,
    failed: false
  })

  it.each([
    'provider',
    'context',
    'resolution',
    'permission',
    'execution',
    'confirmation',
    'settlement'
  ] as const)('does not leave stopping on delayed %s progress', (phase) => {
    const stopping = reduceAiActivity(initial(), {
      type: 'conversation',
      snapshot: { stopping: true }
    }).state
    const delayed = reduceAiActivity(stopping, {
      type: 'progress',
      update: { phase, attempt: 1, summary: 'Delayed work' }
    })
    expect(delayed.state.lifecycle).toBe('stopping')
    expect(delayed.state.entry.label).toBe('Stopping…')
    expect(delayed.decision.status).toBe('rejected')
  })

  it.each(['cancelled', 'executed', 'failed'] as const)(
    'allows stopping to settle as %s',
    (outcome) => {
      const stopping = reduceAiActivity(initial(), {
        type: 'conversation',
        snapshot: { stopping: true }
      }).state
      const terminal = reduceAiActivity(stopping, {
        type: 'progress',
        update: { phase: 'settled', attempt: 1, summary: 'Done', outcome }
      })
      expect(terminal.state.lifecycle).toBe('settled')
      expect(terminal.decision.status).toBe('accepted')
    }
  )

  it('deduplicates visible work while admitting a later sequence and rejecting stale attempts', () => {
    const projection = createAiActivityProjection()
    const work = {
      attempt: 2,
      phase: 'provider' as const,
      summary: 'Working',
      message: 'Adding windows',
      activity: { kind: 'work' as const, callId: 'windows', sequence: 1 }
    }
    projection.append(work)
    expect(
      projection.append({
        ...work,
        activity: { ...work.activity, sequence: 2 }
      })
    ).toMatchObject({
      status: 'retained',
      reason: 'duplicate-visible-activity'
    })
    expect(projection.append(work)).toMatchObject({
      status: 'rejected',
      reason: 'old-sequence'
    })
    expect(projection.append({ ...work, attempt: 1 })).toMatchObject({
      status: 'rejected',
      reason: 'older-attempt'
    })
    expect(projection.result().entries).toHaveLength(1)
  })

  it('keeps outcome projections repeatable and never mutates earlier snapshots', () => {
    const projection = createAiActivityProjection({ outcome: 'partial' })
    projection.append({
      attempt: 1,
      phase: 'settled',
      outcome: 'failed',
      summary: 'Failure'
    })
    const first = projection.result()
    expect(projection.result()).toEqual(first)
    expect(first.entries).toEqual([{ label: 'Failed' }])
  })
})

it('does not restore approval after the user has started stopping', () => {
  const stopping = reduceAiActivity(
    {
      lifecycle: 'running',
      entry: { label: 'Adding windows' },
      attempt: 1,
      sequence: 1,
      failed: false
    },
    { type: 'conversation', snapshot: { stopping: true } }
  ).state
  const lateApproval = reduceAiActivity(stopping, {
    type: 'conversation',
    snapshot: { awaitingApproval: true }
  })
  expect(lateApproval.state.lifecycle).toBe('stopping')
  expect(lateApproval.state.entry.label).toBe('Stopping…')
})

it('shows the parent purpose after a drawing child completes instead of claiming continuous drawing', () => {
  const projection = createAiActivityProjection({
    purpose: 'Draw the entire building'
  })
  projection.append({
    attempt: 1,
    summary: 'Observed owner phase',
    phase: 'provider',
    tool: 'prepare_and_apply_design',
    toolStatus: 'running',
    message: 'Base surfaces',
    activity: { kind: 'work', callId: 'base', sequence: 1, phase: 'preparing' }
  })
  expect(projection.result().current).toMatchObject({
    label: 'Preparing geometry',
    message: 'Base surfaces'
  })
  projection.append({
    attempt: 1,
    summary: 'Observed owner phase',
    phase: 'provider',
    tool: 'apply_prepared_design',
    toolStatus: 'running',
    activity: {
      kind: 'system',
      callId: 'apply-base',
      parentCallId: 'base',
      sequence: 2,
      phase: 'applying'
    }
  })
  expect(projection.result().current).toMatchObject({
    label: 'Updating the canvas',
    message: 'Base surfaces'
  })
  projection.append({
    attempt: 1,
    summary: 'Observed owner phase',
    phase: 'provider',
    tool: 'apply_prepared_design',
    toolStatus: 'completed',
    activity: {
      kind: 'system',
      callId: 'apply-base',
      parentCallId: 'base',
      sequence: 3,
      phase: 'applying'
    }
  })
  projection.append({
    attempt: 1,
    summary: 'Observed owner phase',
    phase: 'provider',
    tool: 'prepare_and_apply_design',
    toolStatus: 'completed',
    activity: {
      kind: 'system',
      callId: 'base',
      sequence: 4,
      phase: 'preparing'
    }
  })
  expect(projection.result().current).toEqual({
    label: 'AI processing',
    message: 'Draw the entire building'
  })
})

it('closes child phases with their parent and keeps an independent concurrent purpose', () => {
  const projection = createAiActivityProjection({ purpose: 'Building details' })
  let sequence = 0
  const send = (
    callId: string,
    parentCallId?: string,
    completed = false,
    message?: string
  ) =>
    projection.append({
      attempt: 1,
      phase: 'provider',
      summary: 'Owner activity',
      tool: 'operation',
      toolStatus: completed ? 'completed' : 'running',
      message,
      activity: {
        kind: message ? 'work' : 'system',
        callId,
        parentCallId,
        sequence: ++sequence,
        phase: 'preparing'
      }
    })
  send('independent', undefined, false, 'Roof colors')
  send('base', undefined, false, 'Base geometry')
  send('base-child', 'base')
  send('base', undefined, true)
  expect(projection.result().current.message).toBe('Roof colors')
  send('late-child', 'base')
  expect(projection.result().current.message).toBe('Roof colors')
  send('independent', undefined, true)
  expect(projection.result().current).toEqual({
    label: 'AI processing',
    message: 'Building details'
  })
})

it('does not revive superseded stage commentary after a later authored operation completes', () => {
  const projection = createAiActivityProjection({
    purpose: 'Draw the entire building'
  })
  projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Public progress',
    message: 'Building the eight bamboo tiers',
    activity: {
      kind: 'work',
      callId: 'commentary',
      sequence: 1,
      scope: 'request',
      phase: 'provider'
    }
  })
  projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Owner activity',
    tool: 'apply_prepared_design',
    toolStatus: 'running',
    message: 'Building the crown and spire',
    activity: { kind: 'work', callId: 'spire', sequence: 2, phase: 'applying' }
  })
  projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Owner activity',
    tool: 'apply_prepared_design',
    toolStatus: 'completed',
    activity: {
      kind: 'system',
      callId: 'spire',
      sequence: 3,
      phase: 'applying'
    }
  })
  expect(projection.result().current).toEqual({
    label: 'AI processing',
    message: 'Draw the entire building'
  })
})

it('resolves inherited text from the current request without fabricating an authored parent purpose', () => {
  const projection = createAiActivityProjection({
    purpose: 'Draw the entire building'
  })
  projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Public progress',
    message: 'Building the tiers',
    activity: {
      kind: 'work',
      callId: 'commentary',
      sequence: 1,
      scope: 'request',
      phase: 'provider'
    }
  })
  projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Owner activity',
    tool: 'operation',
    toolStatus: 'running',
    activity: {
      kind: 'system',
      callId: 'parent',
      sequence: 2,
      phase: 'executing'
    }
  })
  projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Public progress',
    message: 'Checking the crown proportions',
    activity: {
      kind: 'work',
      callId: 'new-commentary',
      sequence: 3,
      scope: 'request',
      phase: 'provider'
    }
  })
  expect(projection.result().current).toEqual({
    label: 'Running an operation',
    message: 'Checking the crown proportions'
  })
})

it('keeps newer commentary when an unchanged call purpose repeats during a phase update', () => {
  const projection = createAiActivityProjection({
    purpose: 'Draw the building'
  })
  const call = {
    attempt: 1,
    phase: 'provider' as const,
    summary: 'Owner activity',
    tool: 'operation',
    toolStatus: 'running' as const,
    message: 'Add the crown'
  }
  projection.append({
    ...call,
    activity: { kind: 'work', callId: 'crown', sequence: 1, phase: 'queued' }
  })
  projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Public progress',
    message: 'Inspect the crown proportions',
    activity: {
      kind: 'work',
      callId: 'commentary',
      sequence: 2,
      scope: 'request',
      phase: 'provider'
    }
  })
  projection.append({
    ...call,
    activity: { kind: 'work', callId: 'crown', sequence: 3, phase: 'applying' }
  })
  projection.append({
    ...call,
    toolStatus: 'completed',
    activity: {
      kind: 'system',
      callId: 'crown',
      sequence: 4,
      phase: 'applying'
    }
  })
  expect(projection.result().current).toEqual({
    label: 'AI processing',
    message: 'Inspect the crown proportions'
  })
})
