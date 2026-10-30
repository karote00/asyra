import recordedEvents from '../../../server/__tests__/fixtures/recorded-101/activity-events-20261017.json'
import recordedStarts from '../../../server/__tests__/fixtures/recorded-101/activity-starts-20261017.json'
import type { AiRuntimeProgressUpdate } from '@asyra/ai-agent-runtime'
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
  it('records each observed start and end instead of retaining a generic loop', () => {
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
    expect(
      projectAiActivity(updates).entries.map((entry) => entry.label)
    ).toEqual([
      'Researching design context',
      'Processing your request',
      'Finding a reference',
      'Processing your request',
      'Preparing the reference',
      'Processing your request',
      'Preparing the design',
      'Processing your request',
      'Reviewing the drawing',
      'Processing your request',
      'Reviewing the planned changes',
      'Checking whether changes can be applied',
      'Refining the design',
      'Processing your request',
      'Checking the layout',
      'Researching design context'
    ])
    expect(updates).toHaveLength(16)
  })

  it('ends an unscoped tool label on its completion', () => {
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
      'Converting artwork to vectors',
      'Processing your request'
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
      ]).current.message
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
    ['prepare_design', 'Preparing the design'],
    ['apply_prepared_design', 'Adding the design']
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

  it('tracks live work through phases and retires it before the next invocation', () => {
    const first = running('正在加入窗戶光影反射效果')
    const second = {
      ...running('正在調整屋頂顏色'),
      activity: { kind: 'work' as const, callId: 'roof', sequence: 5 }
    }
    const updates = [
      first,
      {
        ...first,
        message: undefined,
        activity: {
          ...first.activity,
          kind: 'system' as const,
          sequence: 2,
          phase: 'applying' as const
        }
      },
      {
        ...first,
        toolStatus: 'completed' as const,
        activity: { ...first.activity, sequence: 3 }
      },
      second,
      {
        ...first,
        toolStatus: 'completed' as const,
        activity: { ...first.activity, sequence: 6 }
      }
    ]
    const snapshot = structuredClone(updates)
    const activity = projectAiActivity(updates)
    expect(activity.entries).toEqual([
      { label: 'Refining the design', message: first.message },
      {
        label: 'Operation ended - outcome unconfirmed',
        message: first.message
      },
      { label: 'Refining the design', message: second.message }
    ])
    expect(activity.current).toBe(activity.entries.at(-1))
    expect(updates).toEqual(snapshot)
  })

  it('does not promote a child summary over the principal operation', () => {
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
          parentCallId: 'work',
          sequence: ++activitySequence
        }
      }
    ])
    expect(activity.current.message ?? activity.current.label).toBe(
      'Refining the design'
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
      ).toEqual({ label: 'Refining the design', message: 'Adding windows' })
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
      expect(
        projected.entries.every((entry) => entry.message === first.message)
      ).toBe(true)
    }
    const next = projectAiActivity([
      first,
      ...internal,
      running('Adjusting the roof color')
    ])
    expect([
      ...new Set(next.entries.map((entry) => entry.message ?? entry.label))
    ]).toEqual(['Adding window reflections', 'Adjusting the roof color'])
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
    activity: {
      kind: 'system' as const,
      callId: 'call-2',
      parentCallId: 'call-1',
      sequence: 3
    }
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
  expect(projection.append(first)).toMatchObject({
    reason: 'scoped-owner-phase'
  })
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
  ).toMatchObject({ reason: 'scoped-owner-phase' })
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
    calls: {},
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
      reason: 'scoped-owner-phase'
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
      calls: {},
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

it('returns to the observed provider phase without reviving the objective after drawing completes', () => {
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
    label: 'Running the planned task',
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
    label: 'Running the planned task',
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
    label: 'Operation ended - outcome unconfirmed',
    message: 'Base surfaces'
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
    label: 'Operation ended - outcome unconfirmed (2)',
    message: 'Base geometry; Roof colors'
  })
})

it('retires superseded commentary after principal work without retaining completed call purpose', () => {
  const projection = createAiActivityProjection({
    purpose: 'Draw the entire building'
  })
  projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Public progress',
    message: 'Tower silhouette and surfaces',
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
    label: 'Operation ended - outcome unconfirmed',
    message: 'Building the crown and spire'
  })
})

it('does not assign unscoped commentary during work to an active parent', () => {
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
    label: 'Running an operation'
  })
})

it('does not retain concurrent unscoped commentary after principal completion', () => {
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
    label: 'Operation ended - outcome unconfirmed',
    message: 'Add the crown'
  })
})

it('keeps principal work visible while authored children and coordinator phases advance', () => {
  const projection = createAiActivityProjection({ purpose: 'Build the tower' })
  const send = (
    callId: string,
    sequence: number,
    parentCallId?: string,
    message?: string,
    phase: NonNullable<
      AiRuntimeProgressUpdate['activity']
    >['phase'] = 'executing'
  ) =>
    projection.append({
      attempt: 1,
      phase: 'provider',
      summary: 'Owner activity',
      tool: 'operation',
      toolStatus: 'running',
      message,
      activity: {
        kind: message ? 'work' : 'system',
        callId,
        parentCallId,
        sequence,
        phase
      }
    })
  send('parent', 1, undefined, 'Construct the building')
  send('child', 2, 'parent', 'Window reflections', 'applying')
  send('parent', 3)
  expect(projection.result().current).toEqual({
    label: 'Running an operation',
    message: 'Construct the building'
  })
  send('child', 4, undefined, undefined, 'applying')
  send('parent', 5)
  expect(projection.result().current).toEqual({
    label: 'Running an operation',
    message: 'Construct the building'
  })
})

it('keeps unrelated concurrent work distinct without adopting the objective or last sibling text', () => {
  const projection = createAiActivityProjection({
    purpose: 'Refine the building'
  })
  for (const [index, message] of [
    'Check the roof',
    'Read the windows'
  ].entries())
    projection.append({
      attempt: 1,
      phase: 'provider',
      summary: 'Owner activity',
      message,
      tool: 'operation',
      toolStatus: 'running',
      activity: {
        kind: 'work',
        callId: `read-${index}`,
        sequence: index + 1,
        phase: 'inspecting'
      }
    })
  expect(projection.result().current).toEqual({
    label: 'Checking the drawing - 2 operations'
  })
  projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Completed',
    toolStatus: 'completed',
    activity: {
      kind: 'system',
      callId: 'read-1',
      sequence: 3,
      phase: 'inspecting'
    }
  })
  expect(projection.result().current).toEqual({
    label: 'Checking the drawing',
    message: 'Check the roof'
  })
})

it('uses a common live coordinator purpose for parallel children and preserves authored revisions', () => {
  const initial = {
    lifecycle: 'running' as const,
    entry: { label: 'Starting request' },
    attempt: 0,
    sequence: 0,
    objective: 'Build tower',
    calls: {},
    failed: false
  }
  let state = reduceAiActivity(initial, {
    type: 'progress',
    update: {
      attempt: 1,
      phase: 'provider',
      summary: 'Running',
      message: 'Build the crown',
      activity: {
        kind: 'work',
        callId: 'crown',
        sequence: 1,
        phase: 'executing'
      }
    }
  }).state
  const purpose = state.calls.crown.purpose
  for (const [index, id] of ['roof', 'spire'].entries()) {
    state = reduceAiActivity(state, {
      type: 'progress',
      update: {
        attempt: 1,
        phase: 'provider',
        summary: 'Running',
        message: `Prepare ${id}`,
        activity: {
          kind: 'work',
          callId: id,
          parentCallId: 'crown',
          sequence: index + 2,
          phase: 'preparing'
        }
      }
    }).state
  }
  expect(state.entry).toEqual({
    label: 'Running an operation',
    message: 'Build the crown'
  })
  state = reduceAiActivity(state, {
    type: 'progress',
    update: {
      attempt: 1,
      phase: 'provider',
      summary: 'Running',
      activity: {
        kind: 'system',
        callId: 'crown',
        sequence: 4,
        phase: 'executing'
      }
    }
  }).state
  expect(state.calls.crown.purpose).toBe(purpose)
  expect(purpose).toEqual({
    id: 'crown',
    scope: 'call',
    revision: 1,
    message: 'Build the crown'
  })
  expect(state.entry).toEqual({
    label: 'Running an operation',
    message: 'Build the crown'
  })
})

it('does not present the original objective as active work after completion or retry', () => {
  const projection = createAiActivityProjection({ purpose: 'Draw a tower' })
  const work = {
    attempt: 1,
    phase: 'provider' as const,
    summary: 'Observed phase',
    tool: 'apply_prepared_design',
    message: 'Window reflections',
    toolStatus: 'running' as const,
    activity: {
      kind: 'work' as const,
      callId: 'windows',
      sequence: 1,
      phase: 'applying' as const
    }
  }
  projection.append(work)
  const decision = projection.append({
    ...work,
    message: undefined,
    toolStatus: 'completed',
    activity: { ...work.activity, kind: 'system', sequence: 2 }
  })
  expect(projection.result().current).toEqual({
    label: 'Operation ended - outcome unconfirmed',
    message: 'Window reflections'
  })
  expect(decision).toMatchObject({
    phaseLabel: 'Processing your request',
    activeCallCount: 0,
    purposeSource: 'none'
  })
  expect(decision).not.toHaveProperty('purpose')
  projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Provider processing'
  })
  expect(projection.result().current).toEqual({
    label: 'Operation ended - outcome unconfirmed',
    message: 'Window reflections'
  })
  projection.append({
    ...work,
    message: 'Late wrong subject',
    activity: { ...work.activity, sequence: 3 }
  })
  expect(projection.result().current).toEqual({
    label: 'Operation ended - outcome unconfirmed',
    message: 'Window reflections'
  })
  projection.append({
    attempt: 2,
    phase: 'provider',
    summary: 'Retrying',
    activity: {
      kind: 'system',
      callId: 'retry',
      scope: 'request',
      sequence: 4,
      phase: 'provider'
    }
  })
  expect(projection.result().current).toEqual({
    label: 'Processing your request'
  })
})

it.each([undefined, 'Draw a tower'])(
  'retires completed work with objective %s even without an optional phase hint',
  (purpose) => {
    const projection = createAiActivityProjection({ purpose })
    const start = {
      attempt: 1,
      phase: 'provider' as const,
      summary: 'Work',
      toolStatus: 'running' as const,
      tool: 'review_design',
      message: 'Checking the crown',
      activity: { kind: 'work' as const, callId: 'crown-check', sequence: 1 }
    }
    projection.append(start)
    expect(projection.result().current.message).toBe('Checking the crown')
    const end = projection.append({
      ...start,
      toolStatus: 'completed',
      activity: { ...start.activity, kind: 'system', sequence: 2 }
    })
    expect(end.activeCallCount).toBe(0)
    expect(projection.result().current).toEqual({
      label: 'Operation ended - outcome unconfirmed',
      message: 'Checking the crown'
    })
    projection.append({
      ...start,
      activity: { ...start.activity, sequence: 3 }
    })
    expect(projection.result().current.label).toBe(
      'Operation ended - outcome unconfirmed'
    )
  }
)

it('updates identical visible starts and closes each invocation without leaking a completed purpose', () => {
  const projection = createAiActivityProjection({ purpose: 'Draw a tower' })
  const send = (callId: string, sequence: number, completed = false) =>
    projection.append({
      attempt: 1,
      phase: 'provider',
      summary: 'Observed',
      toolStatus: completed ? 'completed' : 'running',
      message: 'Checking windows',
      activity: {
        kind: completed ? 'system' : 'work',
        callId,
        sequence,
        phase: 'inspecting'
      }
    })
  send('first', 1)
  send('second', 2)
  expect(send('first', 3, true).activeCallCount).toBe(1)
  expect(projection.result().current.message).toBe('Checking windows')
  expect(send('second', 4, true).activeCallCount).toBe(0)
  expect(projection.result().current).toEqual({
    label: 'Operation ended - outcome unconfirmed (2)',
    message: 'Checking windows; Checking windows'
  })
})

it('retires explicitly completed request commentary without presenting the objective as work', () => {
  const projection = createAiActivityProjection({ purpose: 'Draw a tower' })
  const stage = {
    attempt: 1,
    phase: 'provider' as const,
    summary: 'Planning',
    toolStatus: 'running' as const,
    message: 'Plan the windows',
    activity: {
      kind: 'work' as const,
      callId: 'plan-window',
      scope: 'request' as const,
      sequence: 1,
      phase: 'provider' as const
    }
  }
  projection.append(stage)
  projection.append({
    ...stage,
    toolStatus: 'completed',
    activity: { ...stage.activity, kind: 'system', sequence: 2 }
  })
  expect(projection.result().current).toEqual({
    label: 'Processing your request'
  })
})

it('tracks the identity of identical consecutive request purposes', () => {
  const projection = createAiActivityProjection({ purpose: 'Draw a tower' })
  const send = (callId: string, sequence: number, completed = false) =>
    projection.append({
      attempt: 1,
      phase: 'provider',
      summary: 'Observed',
      toolStatus: completed ? 'completed' : 'running',
      message: 'Plan windows',
      activity: {
        kind: completed ? 'system' : 'work',
        scope: 'request',
        callId,
        sequence
      }
    })
  send('first', 1)
  send('second', 2)
  send('first', 3, true)
  expect(projection.result().current.message).toBe('Plan windows')
  send('second', 4, true)
  expect(projection.result().current).toEqual({
    label: 'Processing your request'
  })
})

it.each(['provider', 'resolution'] as const)(
  'retires a completed %s call while approval stays active',
  (phase) => {
    const projection = createAiActivityProjection({ purpose: 'Draw a tower' })
    const start = {
      attempt: 1,
      phase,
      summary: 'Observed',
      toolStatus: 'running' as const,
      message: 'Plan windows',
      activity: { kind: 'work' as const, callId: 'windows', sequence: 1 }
    }
    projection.append(start)
    projection.append({
      attempt: 1,
      phase: 'confirmation',
      summary: 'Approval'
    })
    const end = projection.append({
      ...start,
      toolStatus: 'completed',
      activity: { ...start.activity, kind: 'system', sequence: 2 }
    })
    expect(end.activeCallCount).toBe(0)
    expect(projection.result().current.label).toBe('Awaiting approval')
    projection.append({ attempt: 1, phase: 'execution', summary: 'Resumed' })
    expect(projection.result().current).toEqual({
      label: 'Operation ended - outcome unconfirmed',
      message: 'Plan windows'
    })
  }
)

it('keeps unchanged current presentation attached to its existing history entry', () => {
  const projection = createAiActivityProjection({ purpose: 'Draw a tower' })
  for (const sequence of [1, 2]) {
    projection.append({
      attempt: 1,
      phase: 'provider',
      summary: 'Observed',
      activity: {
        kind: 'system',
        scope: 'request',
        callId: `provider-${sequence}`,
        sequence,
        phase: 'provider'
      }
    })
    const view = projection.result()
    expect(view.entries.at(-1)).toBe(view.current)
    expect(view.entries).toHaveLength(1)
  }
})

it('retires preceding stage context while preserving principal phase ownership', () => {
  const projection = createAiActivityProjection({
    purpose: 'Draw the entire building'
  })
  let sequence = 0
  projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Public progress',
    message: 'Third-tier window reflections',
    activity: {
      kind: 'work',
      scope: 'request',
      callId: 'stage',
      sequence: ++sequence,
      phase: 'provider'
    }
  })
  const initial = projection.result().current
  expect(initial).toEqual({
    label: 'Current task',
    message: 'Third-tier window reflections'
  })
  for (let index = 0; index < 40; index++) {
    for (const phase of ['admission', 'preparing', 'applying'] as const) {
      const decision = projection.append({
        attempt: 1,
        phase: 'provider',
        summary: 'Observed operation',
        tool: 'update_design_element',
        toolStatus: 'running',
        message:
          phase === 'applying' ? 'Applying a window reflection' : undefined,
        activity: {
          kind: phase === 'applying' ? 'work' : 'system',
          callId: `part-${index}`,
          sequence: ++sequence,
          phase
        }
      })
      expect(decision.activeCallCount).toBe(1)
      expect(decision.purposeSource).toBe(
        phase === 'applying' ? 'live-call' : 'none'
      )
      expect(decision.phaseLabel).toBe(
        {
          admission: 'Checking inputs',
          preparing: 'Preparing geometry',
          applying: 'Updating the canvas'
        }[phase]
      )
      expect(projection.result().current).toEqual({
        label:
          phase === 'admission'
            ? 'Processing your request'
            : 'Refining the design',
        message: {
          applying: 'Applying a window reflection',
          admission: undefined,
          preparing: undefined
        }[phase]
      })
    }
    const completed = projection.append({
      attempt: 1,
      phase: 'provider',
      summary: 'Observed completion',
      tool: 'update_design_element',
      toolStatus: 'completed',
      activity: {
        kind: 'system',
        callId: `part-${index}`,
        sequence: ++sequence,
        phase: 'applying'
      }
    })
    expect(completed.activeCallCount).toBe(0)
    expect(projection.result().current).toEqual({
      label: 'Operation ended - outcome unconfirmed',
      message: 'Applying a window reflection'
    })
  }
  const history = projection.result().entries
  for (let index = 1; index < history.length; index++)
    expect(history[index]).not.toEqual(history[index - 1])
  projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Public progress',
    message: 'Roof material colors',
    activity: {
      kind: 'work',
      scope: 'request',
      callId: 'roof-stage',
      sequence: ++sequence,
      phase: 'provider'
    }
  })
  expect(projection.result().current.message).toBe('Roof material colors')
  const late = projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Late stage update',
    message: 'Stale window stage',
    activity: {
      kind: 'work',
      scope: 'request',
      callId: 'stage',
      sequence: ++sequence,
      phase: 'provider'
    }
  })
  expect(late.status).toBe('rejected')
  expect(projection.result().current.message).toBe('Roof material colors')
  // A late completion of the replaced stage must not remove the current stage.
  projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Stage completed',
    toolStatus: 'completed',
    activity: {
      kind: 'system',
      scope: 'request',
      callId: 'stage',
      sequence: ++sequence
    }
  })
  expect(projection.result().current.message).toBe('Roof material colors')
  projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Stage completed',
    toolStatus: 'completed',
    activity: {
      kind: 'system',
      scope: 'request',
      callId: 'roof-stage',
      sequence: ++sequence
    }
  })
  expect(projection.result().current).toEqual({
    label: 'Operation ended - outcome unconfirmed',
    message: 'Applying a window reflection'
  })
  projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Late commentary',
    message: 'Stale roof colors',
    activity: {
      kind: 'work',
      scope: 'request',
      callId: 'roof-stage',
      sequence: ++sequence
    }
  })
  expect(projection.result().current).toEqual({
    label: 'Operation ended - outcome unconfirmed',
    message: 'Applying a window reflection'
  })
})

it('records accepted live phases instead of rejected events or completed children', () => {
  const projection = createAiActivityProjection()
  let sequence = 0
  const event = (
    id: string,
    phase: 'executing' | 'applying' | 'inspecting',
    parentCallId?: string,
    completed = false
  ) => ({
    attempt: 1,
    phase: 'provider' as const,
    summary: 'Observed operation',
    toolStatus: completed ? ('completed' as const) : ('running' as const),
    activity: {
      kind: 'system' as const,
      callId: id,
      parentCallId,
      phase,
      sequence: ++sequence
    }
  })
  projection.append(event('coordinator', 'executing'))
  projection.append(event('child', 'inspecting', 'coordinator'))
  expect(projection.append(event('coordinator', 'executing')).phaseLabel).toBe(
    'Checking the drawing'
  )
  const old = event('stale', 'applying')
  old.activity.sequence = 1
  expect(projection.append(old)).toMatchObject({
    status: 'rejected',
    phaseLabel: 'Checking the drawing',
    activeCallCount: 2
  })
  projection.append(event('sibling', 'applying'))
  expect(
    projection.append(event('sibling', 'applying', undefined, true)).phaseLabel
  ).toBe('Checking the drawing')
  expect(
    projection.append(event('child', 'inspecting', 'coordinator', true))
      .phaseLabel
  ).toBe('Running an operation')
  expect(
    projection.append(event('child', 'applying', 'coordinator'))
  ).toMatchObject({ status: 'rejected', phaseLabel: 'Running an operation' })
  expect(
    projection.append(event('coordinator', 'executing', undefined, true))
  ).toMatchObject({ phaseLabel: 'Processing your request', activeCallCount: 0 })
})

it('shows the live inspection purpose instead of an earlier drawing stage and retains exact phase diagnostics', () => {
  const projection = createAiActivityProjection()
  projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Public work',
    message: 'Draw the crown',
    activity: { kind: 'work', scope: 'request', callId: 'stage', sequence: 1 }
  })
  const event = {
    attempt: 1,
    phase: 'provider' as const,
    summary: 'Inspection',
    tool: 'review_drawing',
    toolStatus: 'running' as const,
    message: 'Compare crown bands with the selected reference',
    activity: {
      kind: 'work' as const,
      callId: 'review',
      sequence: 2,
      phase: 'inspecting' as const
    }
  }
  const decision = projection.append(event)
  expect(projection.result().current).toEqual({
    label: 'Checking the requested details',
    message: event.message
  })
  expect(decision).toMatchObject({
    purposeSource: 'live-call',
    phaseLabel: 'Checking the drawing'
  })
  const current = projection.result().current
  projection.append({
    ...event,
    message: undefined,
    activity: {
      ...event.activity,
      kind: 'system',
      sequence: 3,
      phase: 'admission'
    }
  })
  expect(projection.result().current).toBe(current)
  projection.append({
    ...event,
    toolStatus: 'completed',
    message: undefined,
    activity: { ...event.activity, kind: 'system', sequence: 4 }
  })
  expect(projection.result().current).toEqual({
    label: 'Operation ended - outcome unconfirmed',
    message: 'Compare crown bands with the selected reference'
  })
  projection.append({ ...event, activity: { ...event.activity, sequence: 5 } })
  expect(projection.result().current.label).toBe(
    'Operation ended - outcome unconfirmed'
  )
})

it('preserves the original history snapshot while recording actual principal transitions', () => {
  const projection = createAiActivityProjection()
  projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Work',
    message: 'Crown proportions',
    activity: { kind: 'work', scope: 'request', callId: 'stage', sequence: 1 }
  })
  const snapshot = projection.result()
  for (const [index, tool] of [
    'read_design_context',
    'review_drawing',
    'describe_design_apis'
  ].entries()) {
    projection.append({
      attempt: 1,
      phase: 'provider',
      summary: 'Work',
      tool,
      toolStatus: 'running',
      activity: {
        kind: 'system',
        callId: tool,
        sequence: index * 2 + 2,
        phase: 'executing'
      }
    })
    const running = projection.result()
    expect(running.entries).toHaveLength(2 + index * 2)
    expect(running.current).toBe(running.entries.at(-1))
    expect(running.current.label).not.toBe('Current task')
    projection.append({
      attempt: 1,
      phase: 'provider',
      summary: 'Done',
      tool,
      toolStatus: 'completed',
      activity: { kind: 'system', callId: tool, sequence: index * 2 + 3 }
    })
  }
  expect(projection.result().entries).toHaveLength(7)
  expect(snapshot.entries).toEqual([
    { label: 'Current task', message: 'Crown proportions' }
  ])
})

it('distinguishes queued application from actual canvas execution without admission chatter', () => {
  const projection = createAiActivityProjection()
  const event = {
    attempt: 1,
    phase: 'provider' as const,
    summary: 'Work',
    tool: 'apply_prepared_design',
    toolStatus: 'running' as const,
    message: 'Window reflections'
  }
  for (const [index, phase] of ['queued', 'admission', 'applying'].entries()) {
    projection.append({
      ...event,
      activity: {
        kind: 'work',
        callId: 'apply',
        sequence: index + 1,
        phase: phase as 'queued' | 'admission' | 'applying'
      }
    })
    expect(projection.result().current).toEqual({
      label: phase === 'applying' ? 'Adding the design' : 'Current task',
      message: event.message
    })
    expect(projection.result().entries).toHaveLength(1)
  }
})

it('names distinct concurrent operations instead of hiding both behind a count', () => {
  const projection = createAiActivityProjection({
    purpose: 'Draw the building'
  })
  for (const [index, phase] of ['preparing', 'inspecting'].entries())
    projection.append({
      attempt: 1,
      phase: 'provider',
      summary: 'Owner activity',
      tool: 'operation',
      toolStatus: 'running',
      activity: {
        kind: 'system',
        callId: `phase-${index}`,
        sequence: index + 1,
        phase: phase as 'preparing' | 'inspecting'
      }
    })
  expect(projection.result().current?.label).toBe(
    'Preparing geometry - Checking the drawing - 2 operations'
  )
})

it('projects recorded anonymous batch phases through their active named owner without losing diagnostics', () => {
  const projection = createAiActivityProjection()
  let sequence = 0
  const emit = (
    callId: string,
    tool: string,
    phase: 'admission' | 'executing' | 'applying',
    parentCallId?: string,
    completed = false
  ) =>
    projection.append({
      attempt: 1,
      phase: 'provider',
      summary: 'Observed operation',
      tool,
      toolStatus: completed ? 'completed' : 'running',
      activity: {
        kind: 'system',
        callId,
        parentCallId,
        phase,
        sequence: ++sequence
      }
    })
  projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Work purpose',
    message: 'Window reflections',
    activity: {
      kind: 'work',
      scope: 'request',
      callId: 'stage',
      phase: 'provider',
      sequence: ++sequence
    }
  })
  emit('root', 'prepare_and_apply_design', 'executing')
  const root = projection.result().current
  emit('batch', 'app-batch', 'executing', 'root')
  expect(projection.result().current).toEqual(root)
  const diagnostic = emit('batch', 'app-batch', 'applying', 'root')
  expect(diagnostic.activeCallCount).toBe(2)
  expect(diagnostic.phaseLabel).toBe('Updating the canvas')
  expect(projection.result().current).toEqual(root)
  emit('apply', 'apply_prepared_design', 'admission', 'batch')
  expect(projection.result().current).toEqual(root)
  emit('apply', 'apply_prepared_design', 'applying', 'batch')
  expect(projection.result().current).toEqual(root)
  emit('sibling', 'review_drawing', 'executing')
  expect(projection.result().current.label).toContain('2 operations')
  emit('apply', 'apply_prepared_design', 'applying', 'batch', true)
  expect(projection.result().current.label).toContain(
    'Running the planned task'
  )
  emit('batch', 'app-batch', 'executing', 'root', true)
  emit('root', 'prepare_and_apply_design', 'executing', undefined, true)
  expect(projection.result().current.label).toBe(
    'Checking the requested details'
  )
  emit('sibling', 'review_drawing', 'executing', undefined, true)
  expect(projection.result().current).toEqual({
    label: 'Operation ended - outcome unconfirmed (2)',
    message: 'Running the planned task; Checking the requested details'
  })
  emit('batch', 'app-batch', 'executing', 'root')
  expect(projection.result().current).toEqual({
    label: 'Operation ended - outcome unconfirmed (2)',
    message: 'Running the planned task; Checking the requested details'
  })
})

it('does not display queued child intent as its executing parent work', () => {
  const projection = createAiActivityProjection()
  projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Work',
    tool: 'prepare_and_apply_design',
    toolStatus: 'running',
    message: 'Build the crown',
    activity: {
      kind: 'work',
      callId: 'parent',
      phase: 'executing',
      sequence: 1
    }
  })
  const before = projection.result().current
  const decision = projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Work',
    tool: 'review_drawing',
    toolStatus: 'running',
    message: 'Check the windows',
    activity: {
      kind: 'work',
      callId: 'child',
      parentCallId: 'parent',
      phase: 'admission',
      sequence: 2
    }
  })
  expect(projection.result().current).toEqual(before)
  expect(decision.purpose?.id).toBe('parent')
})

it('replays saved operation admission without public phase churn before execution', () => {
  const projection = createAiActivityProjection()
  projection.append({
    attempt: 1,
    phase: 'provider',
    summary: 'Recorded purpose',
    message: recordedStarts.purpose,
    activity: {
      kind: 'work',
      scope: 'request',
      callId: 'stage',
      phase: 'provider',
      sequence: 1
    }
  })
  expect(projection.result().current.message).toBe(recordedStarts.purpose)
  const decisions = recordedStarts.starts.map((start) => {
    const decision = projection.append({
      ...start,
      attempt: 1,
      summary: 'Recorded start phase',
      toolStatus: 'running'
    } as AiRuntimeProgressUpdate)
    if (start.activity.phase !== 'executing')
      expect(projection.result().current).toEqual({
        label: 'Processing your request'
      })
    return decision
  })
  expect(decisions.map((item) => item.phaseLabel)).toEqual([
    'Queued App operation',
    'Checking inputs',
    'Running an operation'
  ])
  expect(projection.result().current).toEqual({
    label: 'Finding available operations'
  })
})

it('keeps a principal status through named and authored child work and settlement', () => {
  const projection = createAiActivityProjection()
  let sequence = 0
  const send = (
    callId: string,
    tool: string,
    parentCallId?: string,
    message?: string,
    toolStatus: 'running' | 'completed' = 'running'
  ) =>
    projection.append({
      attempt: 1,
      phase: 'provider',
      summary: 'Operation event',
      tool,
      toolStatus,
      message,
      activity: {
        kind: message ? 'work' : 'system',
        callId,
        parentCallId,
        phase: 'executing',
        sequence: ++sequence
      }
    })
  send('principal', 'prepare_and_apply_design', undefined, 'Build the facade')
  const current = projection.result().current
  send('prepare', 'prepare_design', 'principal', 'Compute local windows')
  expect(projection.result().current).toEqual(current)
  const child = send(
    'apply',
    'apply_prepared_design',
    'principal',
    'Apply window colors'
  )
  expect(child.activeCallCount).toBe(3)
  expect(projection.result().current).toEqual(current)
  send('apply', 'apply_prepared_design', 'principal', undefined, 'completed')
  expect(projection.result().current).toEqual(current)
  send('peer', 'review_drawing', undefined, 'Check the roof')
  expect(projection.result().current.label).toContain('2 operations')
  expect(projection.result().current.message).toBeUndefined()
  send(
    'principal',
    'prepare_and_apply_design',
    undefined,
    undefined,
    'completed'
  )
  expect(projection.result().current.message).toBe('Check the roof')
  send('prepare', 'prepare_design', 'principal', 'Late child')
  expect(projection.result().current.message).toBe('Check the roof')
})

it('replays every retained provider input without labeling generic batches as edits', () => {
  const projection = createAiActivityProjection()
  expect(recordedEvents.events).toHaveLength(1063)
  for (const input of recordedEvents.events) {
    const update = input as AiRuntimeProgressUpdate
    projection.append(update)
    if (update.tool === 'execute_design_batch')
      expect(projection.result().current.label).not.toContain(
        'Applying planned edits'
      )
  }
})

it('keeps distinct authored purpose identities in history even when their prose matches', () => {
  const projection = createAiActivityProjection()
  for (const [index, callId] of ['first-stage', 'second-stage'].entries())
    projection.append({
      attempt: 1,
      phase: 'provider',
      summary: 'Work',
      message: 'Check the crown',
      activity: { kind: 'work', scope: 'request', callId, sequence: index + 1 }
    })
  expect(
    projection
      .result()
      .entries.filter((entry) => entry.message === 'Check the crown')
  ).toHaveLength(2)
})

it('projects actual descendant dispatch effects without replacing the principal purpose', () => {
  const projection = createAiActivityProjection()
  let sequence = 0
  const append = (
    callId: string,
    phase: 'executing' | 'applying',
    effect?: 'read' | 'mutation' | 'mixed',
    completed = false
  ) =>
    projection.append({
      attempt: 1,
      phase: 'provider',
      summary: 'Operation',
      tool: callId === 'principal' ? 'execute_design_batch' : 'app-batch',
      toolStatus: completed ? 'completed' : 'running',
      message: callId === 'principal' ? 'Adjust crown reflections' : undefined,
      activity: {
        kind: callId === 'principal' ? 'work' : 'system',
        callId,
        parentCallId: callId === 'principal' ? undefined : 'principal',
        sequence: ++sequence,
        phase,
        effect
      }
    })
  append('principal', 'executing')
  expect(projection.result().current.label).toBe('Running planned operations')
  append('read-batch', 'executing', 'read')
  expect(projection.result().current).toEqual({
    label: 'Reading data',
    message: 'Adjust crown reflections'
  })
  append('write-batch', 'applying', 'mutation')
  expect(projection.result().current.label).toBe('Running mixed operations')
  append('write-batch', 'applying', 'mutation', true)
  expect(projection.result().current.label).toBe('Reading data')
  append('read-batch', 'executing', 'read', true)
  expect(projection.result().current.label).toBe('Running planned operations')
  append('principal', 'executing', undefined, true)
  expect(projection.result().current).toEqual({
    label: 'Operation ended - outcome unconfirmed',
    message: 'Adjust crown reflections'
  })
})

it('retires request commentary at principal dispatch and never resurrects it after concurrent work', () => {
  const projection = createAiActivityProjection({
    purpose: 'Draw the entire building'
  })
  const commentary = (id: string, sequence: number) =>
    projection.append({
      attempt: 1,
      phase: 'provider',
      summary: 'Commentary',
      toolStatus: 'running',
      message: 'Correct old reflections',
      activity: { kind: 'work', scope: 'request', callId: id, sequence }
    })
  const operation = (id: string, sequence: number, completed = false) =>
    projection.append({
      attempt: 1,
      phase: 'provider',
      summary: 'Operation',
      tool: 'prepare_design',
      toolStatus: completed ? 'completed' : 'running',
      activity: { kind: 'system', callId: id, sequence, phase: 'preparing' }
    })
  commentary('old', 1)
  operation('a', 2)
  operation('b', 3)
  commentary('during', 4)
  operation('a', 5, true)
  expect(projection.result().current.label).toBe('Preparing the design')
  expect(projection.result().current.message).toBeUndefined()
  operation('b', 6, true)
  expect(projection.result().current).toEqual({
    label: 'Operation ended - outcome unconfirmed (2)',
    message: 'Preparing the design; Preparing the design'
  })
  commentary('old', 7)
  commentary('during', 8)
  expect(projection.result().current.message).toBe(
    'Preparing the design; Preparing the design'
  )
  commentary('fresh', 9)
  expect(projection.result().current.message).toBe('Correct old reflections')
})

it.each(['success', 'partial', 'failed', 'unknown'] as const)(
  'presents canonical %s settlement without restoring the original objective',
  (status) => {
    const projection = createAiActivityProjection({
      purpose: 'Original entire task'
    })
    projection.append({
      attempt: 1,
      phase: 'provider',
      summary: 'Start',
      tool: 'prepare_design',
      toolStatus: 'running',
      message: 'Window material',
      activity: {
        kind: 'work',
        callId: 'principal',
        sequence: 1,
        phase: 'preparing'
      }
    })
    projection.append({
      attempt: 1,
      phase: 'provider',
      summary: 'End',
      tool: 'prepare_design',
      toolStatus: 'completed',
      activity: {
        kind: 'system',
        callId: 'principal',
        sequence: 2,
        outcome: {
          status,
          settlement: status === 'success' ? 'completed' : 'unknown'
        }
      }
    })
    expect(projection.result().current).toEqual({
      label: {
        success: 'Completed operation',
        partial: 'Partially completed operation',
        failed: 'Failed operation',
        unknown: 'Operation ended - outcome unconfirmed'
      }[status],
      message: 'Window material'
    })
    projection.append({
      attempt: 1,
      phase: 'provider',
      summary: 'Provider processing'
    })
    expect(projection.result().current.message).toBe('Window material')
    expect(projection.result().mode).toBe('context')
  }
)

it('retains canonical concurrent outcomes only after every principal settles', () => {
  const projection = createAiActivityProjection()
  let sequence = 0
  const send = (
    callId: string,
    completed = false,
    status: 'success' | 'failed' = 'success',
    parentCallId?: string
  ) =>
    projection.append({
      attempt: 1,
      phase: 'provider',
      summary: 'Observed',
      toolStatus: completed ? 'completed' : 'running',
      message: callId,
      activity: {
        kind: completed ? 'system' : 'work',
        callId,
        parentCallId,
        sequence: ++sequence,
        phase: 'executing',
        ...(completed
          ? { outcome: { status, settlement: 'completed' as const } }
          : {})
      }
    })
  send('Facade')
  send('Roof')
  send('child', false, 'success', 'Facade')
  send('Facade', true)
  expect(projection.result().current.message).toBe('Roof')
  send('child', true)
  expect(projection.result().current.message).toBe('Roof')
  send('Roof', true, 'failed')
  expect(projection.result().current).toEqual({
    label: 'Partially completed operation (2)',
    message: 'Facade; Roof'
  })
  const settled = projection.result()
  send('Roof', true)
  send('Facade')
  expect(projection.result().current).toEqual(settled.current)
  send('New inspection')
  expect(projection.result().current.message).toBe('New inspection')
  expect(settled.current.label).toBe('Partially completed operation (2)')
})
