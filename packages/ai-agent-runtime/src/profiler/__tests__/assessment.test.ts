import { describe, expect, it, vi } from 'vitest'
import { assessExecution } from '../../index.js'
import { evaluateExecution } from '../../index.js'
import { parseExecutionRecord } from '../../node/index.js'

const report = () =>
  evaluateExecution(
    parseExecutionRecord(
      [
        { event: 'ai_request_started', model: 'gpt-6-astra' },
        {
          event: 'ai_request_trace',
          stage: 'tool_started',
          tool: 'read_design_context',
          callId: 'one',
          elapsedMs: 1
        },
        {
          event: 'ai_request_trace',
          stage: 'tool_completed',
          tool: 'read_design_context',
          callId: 'one',
          elapsedMs: 5
        },
        { event: 'ai_request_usage', outcome: 'completed', durationMs: 10 }
      ]
        .map((event, sequence) =>
          JSON.stringify({
            ...event,
            sequence,
            schemaVersion: 2,
            requestId: 'drawing-1'
          })
        )
        .join('\n')
    )
  )

describe('post-run assessment', () => {
  it('makes one compact request, preserves requested criteria and separates identity/time', async () => {
    const provider = vi.fn(async (_summary: unknown) => ({
      requestId: 'assessment-1',
      value: {
        overall: 'Insufficient evidence',
        findings: [
          {
            callId: 'one',
            assessment: 'unknown',
            observation: 'No revision was recorded',
            proposal: 'Record revision on reads'
          }
        ]
      }
    }))
    let time = 5
    const input = report()
    Object.assign(input.toolCalls[0], {
      selectors: {
        operations: Array.from({ length: 1000 }, () => ({
          name: 'read_design_context',
          arguments: { elementIds: ['many-targets'] }
        }))
      }
    })
    const result = await assessExecution(input, {
      criteria: ['Match an intentionally ugly drawing'],
      purpose: 'process',
      provider,
      now: () => (time += 5)
    })
    expect(provider).toHaveBeenCalledTimes(1)
    expect(provider.mock.calls[0][0]).toMatchObject({
      sourceRequestId: 'drawing-1',
      criteria: ['Match an intentionally ugly drawing'],
      calls: [{ callId: 'one' }]
    })
    expect(JSON.stringify(provider.mock.calls[0][0])).not.toContain('records')
    expect(JSON.stringify(provider.mock.calls[0][0])).not.toContain('selectors')
    expect(JSON.stringify(provider.mock.calls[0][0])).not.toContain(
      'many-targets'
    )
    expect(result).toMatchObject({
      status: 'recorded',
      sourceRequestId: 'drawing-1',
      assessmentRequestId: 'assessment-1',
      durationMs: 5
    })
  })

  it('marks missing provider, failed call and invalid citations without retrying or approving a drawing', async () => {
    expect(
      await assessExecution(report(), {
        criteria: ['Find avoidable work'],
        purpose: 'process'
      })
    ).toMatchObject({ status: 'unavailable' })
    const provider = vi.fn(async () => {
      throw Object.assign(new Error('private provider failure'), {
        requestId: 'failed-assessment'
      })
    })
    expect(
      await assessExecution(report(), {
        criteria: ['Find avoidable work'],
        purpose: 'process',
        provider
      })
    ).toMatchObject({
      status: 'failed',
      reason: 'ASSESSMENT_FAILED',
      assessmentRequestId: 'failed-assessment'
    })
    expect(provider).toHaveBeenCalledTimes(1)
    const invalid = async () => ({
      requestId: 'bad',
      value: {
        overall: 'Done',
        findings: [
          {
            callId: 'invented',
            assessment: 'good',
            observation: 'fine',
            proposal: 'none'
          }
        ]
      }
    })
    expect(
      await assessExecution(report(), {
        criteria: ['Find avoidable work'],
        purpose: 'process',
        provider: invalid
      })
    ).toMatchObject({ status: 'failed', reason: 'INVALID_ASSESSMENT' })
  })

  it('reuses an adequate current visual opinion without a new call', async () => {
    const input = report()
    input.modelReview = {
      ...input.modelReview,
      status: 'recorded',
      inspectionIds: ['i'],
      current: true,
      checks: [
        { requirement: 'Requested rough style', status: 'pass', evidence: 'i' }
      ]
    }
    const provider = vi.fn()
    expect(
      await assessExecution(input, {
        criteria: ['Requested rough style'],
        purpose: 'visual',
        provider
      })
    ).toMatchObject({ status: 'reused', durationMs: 0 })
    expect(provider).not.toHaveBeenCalled()
  })

  it('does not reuse a stale opinion or a review of different criteria', async () => {
    const input = report()
    input.modelReview = {
      ...input.modelReview,
      status: 'recorded',
      current: false,
      checks: [{ requirement: 'Other criterion', status: 'pass' }]
    }
    expect(
      await assessExecution(input, {
        criteria: ['Requested rough style'],
        purpose: 'visual'
      })
    ).toMatchObject({ status: 'unavailable' })
  })
})
