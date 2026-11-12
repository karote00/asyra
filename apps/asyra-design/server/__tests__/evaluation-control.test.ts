import correctablePreparation from '../../test-data/ai-drawing/fixtures/correctable-preparation-20261106.json'
import recordedTargetStop from '../../test-data/ai-drawing/fixtures/strict-target-stop-20261106.json'
import strictNativeDetail from './fixtures/recorded-101/strict-native-detail-20261106.json'
import strictReview from './fixtures/recorded-101/strict-review-rework-20261106.json'
import { expect, it, vi } from 'vitest'
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import {
  createEvaluationControl,
  evaluationToolStop
} from '../evaluation-control'

it('continues a correctable part after a completed owner receipt without inline Host metadata', () => {
  const completed = {
    applicable: true,
    completedSteps: ['prepare_design', 'apply_prepared_design'],
    actionResults: [
      {
        actionId: 'draw',
        actionName: 'apply_prepared_design',
        result: {
          status: 'complete',
          compositionId: 'root',
          appliedElementCount: 1
        }
      }
    ]
  }
  const value = {
    status: 'partial',
    settlement: 'partial',
    parts: [completed, correctablePreparation.owner]
  }
  const reply = {
    success: false,
    text: JSON.stringify(value),
    outcome: { status: 'partial', settlement: 'partial', issues: [] }
  }

  expect(evaluationToolStop(reply)).toBeUndefined()
  for (const prefix of [
    {},
    { ...completed, actionResults: [] },
    { ...completed, actionResults: [{}] },
    { ...completed, inspectionIssues: [{ message: 'Capture unavailable' }] },
    {
      ...completed,
      actionResults: [
        {
          actionId: 'draw',
          actionName: 'apply_prepared_design',
          result: { status: 'failed', settlement: 'unknown' }
        }
      ]
    }
  ]) {
    expect(
      evaluationToolStop({
        ...reply,
        text: JSON.stringify({
          ...value,
          parts: [prefix, correctablePreparation.owner]
        })
      })
    ).toBeDefined()
  }
})

it.each([
  { value: { toolOutcome: { status: 'failed' } }, failed: true },
  {
    value: { text: JSON.stringify({ toolOutcome: { status: 'partial' } }) },
    failed: true
  },
  {
    value: {
      type: 'webSearch',
      status: 'failed',
      error: 'Unavailable reference'
    },
    failed: true
  },
  { value: { checks: { counts: { fail: 1 } } }, failed: false },
  {
    value: { countsScope: 'selected-checks', counts: { fail: 1 } },
    failed: false
  },
  {
    value: { actionResults: [{ result: { status: 'unknown' } }] },
    failed: true
  },
  {
    value: {
      toolOutcome: { status: 'success' },
      checks: { counts: { fail: 0, unverified: 3 } }
    },
    failed: false
  },
  {
    value: { status: 'no-change', value: { status: 'failed' } },
    failed: false
  },
  {
    value: { status: 'complete', text: 'The source contains the word failed' },
    failed: false
  }
])(
  'classifies actual evaluation outcome $value as failed=$failed',
  ({ value, failed }) => {
    expect(Boolean(evaluationToolStop(value))).toBe(failed)
  }
)

it('requires a matching recorder window and latches the first stop without creating a policy', () => {
  const root = join(process.cwd(), 'tmp')

  mkdirSync(root, { recursive: true })
  const directory = mkdtempSync(join(root, 'evaluation-control-test-'))
  const reasons: unknown[] = []
  let control: ReturnType<typeof createEvaluationControl>

  try {
    expect(
      createEvaluationControl(directory, 1, (reason) => reasons.push(reason))
    ).toBeUndefined()
    writeFileSync(
      join(directory, 'evaluation-control.json'),
      JSON.stringify({ workDeadlineAt: 2, stopOnFailure: true })
    )
    expect(
      createEvaluationControl(directory, 1, (reason) => reasons.push(reason))
    ).toBeUndefined()
    control = createEvaluationControl(directory, 2, (reason) =>
      reasons.push(reason)
    )
    control?.stop({ kind: 'tool-failure', message: 'First failure' })
    control?.stop({ kind: 'tool-failure', message: 'Later failure' })
    expect(reasons).toEqual([
      { kind: 'tool-failure', message: 'First failure' }
    ])
  } finally {
    control?.dispose()
    rmSync(directory, { recursive: true, force: true })
  }
})

it('allows ordinary correction after a successful recorded visual failure', () => {
  expect(evaluationToolStop(strictReview.output)).toBeUndefined()
  expect(
    evaluationToolStop({ text: JSON.stringify(strictReview.output) })
  ).toBeUndefined()
  expect(
    evaluationToolStop({ actionResults: [{ result: strictReview.output }] })
  ).toBeUndefined()
  expect(
    evaluationToolStop({
      toolOutcome: { status: 'success' },
      value: strictReview.output
    })
  ).toBeUndefined()
})

it('ignores obsolete visual-stop requests but accepts a confirmed missing App result', async () => {
  const root = join(process.cwd(), 'tmp')

  mkdirSync(root, { recursive: true })
  const directory = mkdtempSync(join(root, 'evaluation-control-test-'))
  const file = join(directory, 'evaluation-control.json')
  const policy = { workDeadlineAt: 2, stopOnFailure: true }
  const stop = vi.fn()

  writeFileSync(file, JSON.stringify(policy))
  const control = createEvaluationControl(directory, 2, stop)

  try {
    writeFileSync(
      file,
      JSON.stringify({
        ...policy,
        stop: {
          kind: 'corrective-rework',
          message: 'A visible belt needs correction'
        }
      })
    )
    await new Promise((resolve) => setTimeout(resolve, 250))
    expect(stop).not.toHaveBeenCalled()
    writeFileSync(
      file,
      JSON.stringify({
        ...policy,
        stop: {
          kind: 'tool-failure',
          message: 'Acknowledged created element data is unavailable',
          callId: 'missing-result'
        }
      })
    )
    await vi.waitFor(() =>
      expect(stop).toHaveBeenCalledWith({
        kind: 'tool-failure',
        message: 'Acknowledged created element data is unavailable',
        callId: 'missing-result'
      })
    )
    expect(stop).toHaveBeenCalledOnce()
  } finally {
    control?.dispose()
    rmSync(directory, { recursive: true, force: true })
  }
})

it('retains the first concrete capture failure instead of the aggregate partial message', () => {
  expect(evaluationToolStop(strictNativeDetail.output)).toMatchObject({
    kind: 'tool-failure',
    message: expect.stringContaining('1024')
  })
  expect(evaluationToolStop(strictNativeDetail.output)?.message).toContain(
    'smaller child'
  )
  expect(
    evaluationToolStop({ status: 'partial', message: 'No child receipt' })
  ).toEqual({ kind: 'tool-failure', message: 'No child receipt' })
})

it('preserves recorded host issue messages without searching arbitrary value data', () => {
  for (const receipt of [
    recordedTargetStop.output,
    recordedTargetStop.aggregate
  ]) {
    expect(evaluationToolStop(receipt)).toEqual({
      kind: 'tool-failure',
      message: 'Context match count 0 does not satisfy expectedCount 24.'
    })
  }

  expect(
    evaluationToolStop({ status: 'failed', value: { message: 'User text' } })
  ).toEqual({ kind: 'tool-failure', message: 'Tool outcome failed' })
  expect(
    evaluationToolStop({ status: 'success', issues: ['User data'] })
  ).toBeUndefined()
})

it('allows explicit recorded input repair through owner and host envelopes', () => {
  for (const value of [
    correctablePreparation.owner,
    correctablePreparation.child,
    correctablePreparation.execution,
    { execution: correctablePreparation.execution },
    {
      saved: [],
      toolOutcome: { status: 'failed', settlement: 'not-started' },
      failure: { execution: correctablePreparation.execution }
    }
  ]) {
    expect(evaluationToolStop(value)).toBeUndefined()
    expect(
      evaluationToolStop({ success: false, text: JSON.stringify(value) })
    ).toBeUndefined()
  }

  expect(
    evaluationToolStop({
      status: 'failed',
      settlement: 'unknown',
      value: correctablePreparation.owner
    })
  ).toBeDefined()
})

it.each([
  {
    saved: [],
    failure: correctablePreparation.owner,
    toolOutcome: {
      status: 'partial',
      settlement: 'not-started',
      issues: [
        {
          code: 'TOOL_DELIVERY_INVALID',
          message: 'Selected result unavailable'
        }
      ]
    }
  },
  { ...correctablePreparation.owner, error: 'Transport failed' },
  { success: false, text: JSON.stringify({ value: 'Incomplete response' }) },
  {
    status: 'partial',
    settlement: 'unknown',
    execution: correctablePreparation.execution
  },
  {
    status: 'partial',
    parts: [
      correctablePreparation.owner,
      { toolOutcome: { status: 'failed', settlement: 'unknown' } }
    ]
  }
])(
  'does not conceal an independent execution defect behind input recovery',
  (value) => {
    expect(evaluationToolStop(value)).toBeDefined()
  }
)

it.each(['source-only', 'unknown', 'independent', 'missing-recovery'])(
  'preserves typed reference recovery without masking other failures: %s',
  async (mode) => {
    const { default: recorded } =
      await import('../../test-data/ai-drawing/fixtures/source-recovery-20261108.json')
    const source = {
      ...recorded.failedSource,
      settlement: 'not-started',
      recovery: { kind: 'select_reference', settlement: 'not-started' }
    } as Record<string, unknown>

    if (mode === 'unknown') {
      source.settlement = 'unknown'
    }

    if (mode === 'missing-recovery') {
      delete source.recovery
    }

    const { localToolOutcome } = await import('../local-tool-invocation')
    const receipt = {
      available: true,
      status: 'partial',
      references: [
        { available: true, referenceId: 'reference:kept', attachmentIndex: 0 },
        source
      ],
      actionResults: [{ actionName: 'import_reference_image', result: source }]
    } as Record<string, unknown>

    receipt.toolOutcome = localToolOutcome(receipt)
    if (mode === 'independent') {
      ;(receipt.toolOutcome as { issues: unknown[] }).issues.push({
        code: 'DELIVERY_FAILED',
        message: 'Required image delivery failed'
      })
    }

    expect(Boolean(evaluationToolStop(receipt))).toBe(mode !== 'source-only')
  }
)
