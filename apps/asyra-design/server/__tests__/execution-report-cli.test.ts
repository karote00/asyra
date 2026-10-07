import {
  mkdir,
  mkdtemp,
  writeFile,
  rm,
  readdir,
  readFile
} from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runExecutionReportCli } from '../execution-report-cli'

describe('execution report CLI', () => {
  it('reports a real saved record, explicit feedback and incomplete files without drawing', async () => {
    const base = join(process.cwd(), 'tmp')
    await mkdir(base, { recursive: true })
    const directory = await mkdtemp(join(base, 'execution-report-test-'))
    try {
      await writeFile(
        join(directory, 'run-1.jsonl'),
        [
          {
            event: 'ai_request_started',
            startedAt: '2026-10-02T00:00:00Z',
            model: 'gpt-6-astra'
          },
          { event: 'ai_request_usage', outcome: 'completed', durationMs: 25 }
        ]
          .map((entry, sequence) =>
            JSON.stringify({
              ...entry,
              requestId: 'run-1',
              sequence,
              schemaVersion: 2
            })
          )
          .join('\n')
      )
      await writeFile(join(directory, 'partial.jsonl'), 'broken')
      const feedback = join(directory, 'feedback.json')
      await writeFile(feedback, JSON.stringify({ 'run-1': 'Too plain.' }))
      const result = await runExecutionReportCli([
        '--directory',
        directory,
        '--from',
        '2026-10-01',
        '--to',
        '2026-10-03',
        '--feedback',
        feedback,
        '--json'
      ])
      expect(result.code).toBe(0)
      expect(JSON.parse(result.output)).toMatchObject({
        investigationTargets: [],
        runs: [{ requestId: 'run-1', userFeedback: 'Too plain.' }],
        excluded: [{ requestId: null, reason: 'unknown-request' }]
      })
      const readable = await runExecutionReportCli([
        '--directory',
        directory,
        '--from',
        '2026-10-01',
        '--to',
        '2026-10-03'
      ])
      expect(readable.output).toContain('Investigation targets: 0')
      const single = await runExecutionReportCli([
        '--directory',
        directory,
        '--request',
        'run-1'
      ])
      expect(single.output).toContain('run-1')
      expect(single.output).toContain('Unattributed')
      expect(single.output).toContain('Tool outcomes:')
      expect(single.output).toContain('nested action failures: 0')
      expect(single.output).toContain('Model rounds: unavailable')
      expect(single.output).toContain('program-to-tool links: unavailable')
      expect(single.output).toContain('unavailable')
      const assessed = await runExecutionReportCli(
        [
          '--directory',
          directory,
          '--request',
          'run-1',
          '--assess',
          'process',
          '--criterion',
          'Avoid repeated lookups',
          '--json'
        ],
        {},
        {
          provider: async () => ({
            requestId: 'assessment-1',
            value: { overall: 'No calls to evaluate', findings: [] }
          })
        }
      )
      expect(assessed.code).toBe(0)
      expect(JSON.parse(assessed.output).assessment).toMatchObject({
        status: 'recorded',
        assessmentRequestId: 'assessment-1'
      })
      const opinions = (await readdir(join(directory, 'assessments'))).filter(
        (name) => name.endsWith('.json')
      )
      expect(opinions).toHaveLength(1)
      expect(
        JSON.parse(
          await readFile(join(directory, 'assessments', opinions[0]), 'utf8')
        )
      ).toMatchObject({ sourceRequestId: 'run-1', status: 'recorded' })
      const period = await runExecutionReportCli([
        '--directory',
        directory,
        '--from',
        '2026-10-01',
        '--to',
        '2026-10-03',
        '--json'
      ])
      expect(JSON.parse(period.output).assessments).toEqual([
        expect.objectContaining({
          sourceRequestId: 'run-1',
          status: 'recorded',
          purpose: 'process'
        })
      ])
      expect(
        (
          await runExecutionReportCli([
            '--directory',
            directory,
            '--request',
            'missing'
          ])
        ).code
      ).toBe(1)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('explains invalid arguments and missing input instead of inventing an empty successful report', async () => {
    expect(await runExecutionReportCli(['--bogus'])).toMatchObject({ code: 1 })
    expect(await runExecutionReportCli(['--directory'])).toMatchObject({
      code: 1
    })
    expect(
      await runExecutionReportCli([
        '--directory',
        'tmp/absent-report-directory'
      ])
    ).toMatchObject({ code: 1 })
    expect(await runExecutionReportCli(['--help'])).toMatchObject({ code: 0 })
  })
})
