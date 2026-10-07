import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseExecutionRecord } from './local-ai-records'
import {
  createExecutionPeriodReport,
  evaluateExecution
} from './local-ai-evaluation'
import {
  assessExecution,
  type AssessmentInput,
  type ExecutionAssessment
} from './local-ai-assessment'

const readSavedAssessments = async (directory: string) => {
  const entries: (ExecutionAssessment & {
    recordedAt: string
    file: string
  })[] = []
  const issues: string[] = []
  let files
  try {
    files = await readdir(join(directory, 'assessments'), {
      withFileTypes: true
    })
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT')
      return { entries, issues }
    throw error
  }
  for (const file of files.filter(
    (file) => file.isFile() && file.name.endsWith('.json')
  )) {
    try {
      const value = JSON.parse(
        await readFile(join(directory, 'assessments', file.name), 'utf8')
      )
      if (
        !value ||
        value.schemaVersion !== 1 ||
        !['recorded', 'reused', 'unavailable', 'failed'].includes(
          value.status
        ) ||
        !['process', 'visual'].includes(value.purpose) ||
        typeof value.sourceRequestId !== 'string' ||
        !Number.isFinite(Date.parse(value.recordedAt)) ||
        !Array.isArray(value.criteria) ||
        !value.criteria.every(
          (criterion: unknown) => typeof criterion === 'string'
        ) ||
        typeof value.durationMs !== 'number' ||
        !Number.isFinite(value.durationMs) ||
        value.durationMs < 0
      )
        throw new Error('Invalid assessment')
      entries.push({ ...value, file: file.name })
    } catch {
      issues.push(`Unreadable assessment: ${file.name}`)
    }
  }
  return { entries, issues }
}

const help = `Execution reports (local; default read only)
  --directory PATH    Record directory (default AI_EXECUTION_RECORD_DIR or tmp/ai-executions)
  --request ID        Inspect one request, regardless of date
  --from ISO --to ISO Half-open period; default recent seven days
  --feedback PATH     Optional JSON object of request IDs to user feedback strings
  --assess PURPOSE    Explicit optional post-run model opinion: process or visual (requires --request)
  --criterion TEXT    Assessment criterion; repeat for multiple criteria
  --json              Full structured report instead of readable summary
  --help              This help
Only --assess can make a model call and save a separate local assessment. It never draws.`

const renderRun = (run: ReturnType<typeof evaluateExecution>) => {
  const lines = [
    `Request ${run.requestId ?? 'unknown'} - ${run.outcome} - record ${run.complete ? 'complete' : 'incomplete'}`,
    `Total: ${run.timing.durationMs} ms; observed tool/research union: ${run.timing.observedToolAndResearchMs} ms; Unattributed: ${run.timing.unattributedMs} ms`,
    `Exclusive ownership: ${JSON.stringify(run.timing.owners)} (provider wait is not measured model thinking)`,
    `Usage: ${run.usageStatus}; model review: ${run.modelReview.status} (not visual certification)`,
    `Steps: ${run.toolCalls.length}; findings: ${run.findings.length}`,
    `Tool outcomes: ${JSON.stringify(run.toolOutcomes)}; nested action failures: ${run.actions.filter((action) => action.status === 'failed').length} (separate levels, not additive; recovery requires linked evidence)`,
    `Model rounds: unavailable; program-to-tool links: ${run.orchestration.programChildLinks}. Native exec/wait items: ${run.orchestration.programs.length}. ${run.orchestration.reason}`
  ]
  const longest = [...run.toolCalls]
    .sort((a, b) => (b.durationMs ?? -1) - (a.durationMs ?? -1))
    .slice(0, 10)
  lines.push(
    `Longest observed calls (${longest.length} of ${run.toolCalls.length}; full details with --json):`
  )
  for (const call of longest) {
    const duration = run.timing.callDurations.find(
      (entry) => entry.callId === call.callId
    )
    lines.push(
      `  ${call.callId} - ${call.tool} - ${call.durationMs ?? 'unknown'} ms inclusive; ${duration?.ownMs ?? 'unknown'} ms own - ${call.responseTextBytes ?? 'unknown'} response bytes - sequence ${call.sequence}`
    )
  }
  for (const finding of run.findings)
    lines.push(
      `  ${finding.kind} - call ${finding.callId ?? 'unknown'} - sequence ${finding.sequence ?? 'unknown'}: ${finding.observation} ${finding.possibleRemedy}`
    )
  for (const issue of run.issues) lines.push(`  Record issue: ${issue}`)
  if (run.userFeedback !== null)
    lines.push(`User feedback: ${run.userFeedback}`)
  return lines.join('\n')
}

export const runExecutionReportCli = async (
  args: string[],
  environment: Record<string, string | undefined> = process.env,
  dependencies: {
    provider?: (
      summary: AssessmentInput
    ) => Promise<{ requestId: string; value: unknown }>
  } = {}
): Promise<{ code: number; output: string }> => {
  try {
    const options = new Map<string, string>()
    const criteria: string[] = []
    let json = false
    for (let index = 0; index < args.length; index++) {
      const flag = args[index]
      if (flag === '--help') return { code: 0, output: help }
      if (flag === '--json') {
        json = true
        continue
      }
      if (
        ![
          '--directory',
          '--request',
          '--from',
          '--to',
          '--feedback',
          '--assess',
          '--criterion'
        ].includes(flag)
      )
        throw new Error(`Unknown option: ${flag}`)
      const value = args[++index]
      if (!value || value.startsWith('--'))
        throw new Error(`Missing value for ${flag}`)
      if (flag === '--criterion') {
        criteria.push(value)
        continue
      }
      if (options.has(flag)) throw new Error(`Repeated option: ${flag}`)
      options.set(flag, value)
    }
    if (
      options.has('--request') &&
      (options.has('--from') || options.has('--to'))
    )
      throw new Error('Choose a request or a period, not both.')
    const assessmentPurpose = options.get('--assess')
    if (
      assessmentPurpose &&
      (!options.has('--request') ||
        !['process', 'visual'].includes(assessmentPurpose) ||
        !criteria.length)
    )
      throw new Error(
        '--assess requires --request, process or visual, and at least one --criterion.'
      )
    if (criteria.length && !assessmentPurpose)
      throw new Error('--criterion requires --assess.')
    const directory =
      options.get('--directory') ??
      (environment.AI_EXECUTION_RECORD_DIR?.trim() || 'tmp/ai-executions')
    let feedback: Record<string, string> = {}
    const feedbackPath = options.get('--feedback')
    if (feedbackPath) {
      const parsed: unknown = JSON.parse(await readFile(feedbackPath, 'utf8'))
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        Array.isArray(parsed) ||
        !Object.values(parsed).every((value) => typeof value === 'string')
      )
        throw new Error('Feedback must be an object of request IDs to strings.')
      feedback = parsed as Record<string, string>
    }
    const files = (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith('.jsonl'))
      .map((entry) => entry.name)
      .sort()
    const records = []
    for (const file of files)
      records.push(
        parseExecutionRecord(await readFile(join(directory, file), 'utf8'))
      )
    const sources = records.map((record, index) => ({
      file: files[index],
      requestId: record.requestId,
      issues: record.issues
    }))
    const requestId = options.get('--request')
    const savedAssessments = await readSavedAssessments(directory)
    if (requestId) {
      const matches = records.filter((record) => record.requestId === requestId)
      if (matches.length !== 1)
        throw new Error(
          `Expected one record for ${requestId}; found ${matches.length}.`
        )
      const report = {
        ...evaluateExecution(matches[0], { feedback: feedback[requestId] }),
        assessments: savedAssessments.entries.filter(
          (entry) => entry.sourceRequestId === requestId
        ),
        assessmentIssues: savedAssessments.issues,
        sourceFile: sources.find((source) => source.requestId === requestId)
          ?.file
      }
      if (assessmentPurpose) {
        const purpose = assessmentPurpose as 'process' | 'visual'
        const controller = new AbortController()
        const abort = () => controller.abort()
        process.once('SIGINT', abort)
        try {
          let provider = dependencies.provider
          const model = environment.AI_PROVIDER_MODEL?.trim()
          if (
            !provider &&
            environment.AI_PROVIDER_BACKEND === 'local-codex' &&
            model
          ) {
            provider = async (summary) => {
              const { requestLocalAiAssessment } =
                await import('./local-ai-provider')
              return requestLocalAiAssessment(summary, {
                model,
                executable:
                  environment.AI_PROVIDER_EXECUTABLE?.trim() || 'codex',
                recordDirectory: join(directory, 'assessments'),
                sourceRevision:
                  environment.AI_EXECUTION_SOURCE_REVISION?.trim(),
                signal: controller.signal
              })
            }
          }
          const assessment = await assessExecution(report, {
            purpose,
            criteria,
            provider
          })
          const assessmentDirectory = join(directory, 'assessments')
          await mkdir(assessmentDirectory, { recursive: true, mode: 0o700 })
          const assessmentFile = join(
            assessmentDirectory,
            `${randomUUID()}.json`
          )
          await writeFile(
            assessmentFile,
            JSON.stringify(
              {
                ...assessment,
                schemaVersion: 1,
                recordedAt: new Date().toISOString()
              },
              null,
              2
            ),
            { flag: 'wx', mode: 0o600 }
          )
          return {
            code: ['recorded', 'reused'].includes(assessment.status) ? 0 : 1,
            output: json
              ? JSON.stringify(
                  { ...report, assessment, assessmentFile },
                  null,
                  2
                )
              : `${renderRun(report)}\nAssessment: ${assessment.status} - ${assessmentFile}\n${JSON.stringify(assessment.opinion ?? { reason: assessment.reason }, null, 2)}`
          }
        } finally {
          process.removeListener('SIGINT', abort)
        }
      }
      return {
        code: 0,
        output: json
          ? JSON.stringify(report, null, 2)
          : `${renderRun(report)}\nSaved assessments: ${report.assessments.length}; ${report.assessmentIssues.join('; ')}`
      }
    }
    const report = {
      ...createExecutionPeriodReport(records, {
        from: options.get('--from'),
        to: options.get('--to'),
        feedback
      }),
      sources
    }
    const includedRequests = new Set(report.runs.map((run) => run.requestId))
    const assessments = savedAssessments.entries.filter((entry) =>
      includedRequests.has(entry.sourceRequestId)
    )
    if (json)
      return {
        code: 0,
        output: JSON.stringify(
          { ...report, assessments, assessmentIssues: savedAssessments.issues },
          null,
          2
        )
      }
    return {
      code: 0,
      output: [
        `Execution report - ${report.from} to ${report.to} (exclusive)`,
        `${report.runs.length} runs; ${report.partialRuns} incomplete; ${report.excluded.length} unclassified; ${report.outsidePeriod} outside period`,
        `${report.groups.length} configuration groups (task equivalence is not established)`,
        `Investigation targets: ${report.investigationTargets.length} (observations, not confirmed root causes)`,
        ...report.investigationTargets.map(
          (target) =>
            `${target.tool ?? 'protocol'} - ${target.phase ?? 'no phase'} - ${target.kind} - ${target.code ?? 'no code'}: ${target.occurrences} observations in ${target.requestIds.length} runs; source ${target.configuration.sourceRevision ?? 'unknown'}; evidence ${target.evidence.map((entry) => `${entry.requestId}:${entry.callId ?? 'none'}:${entry.sequence ?? 'unknown'}`).join(', ')}`
        ),
        `Saved assessment records: ${assessments.length} (separate opinions, not independent drawing samples)`,
        ...assessments.map(
          (entry) =>
            `${entry.sourceRequestId} - ${entry.purpose} - ${entry.status} - ${entry.file}`
        ),
        ...savedAssessments.issues,
        ...sources
          .filter((source) => source.issues.length)
          .map((source) => `${source.file}: ${source.issues.join('; ')}`),
        ...report.excluded.map(
          (entry) =>
            `Unclassified: ${entry.requestId ?? 'unknown'} - ${entry.reason}`
        ),
        ...report.frequencies.map(
          (entry) =>
            `${entry.kind}: ${entry.occurrences} occurrences across ${entry.requestIds.length} runs`
        ),
        ...report.runs.map(renderRun),
        ...report.limitations
      ].join('\n\n')
    }
  } catch (error) {
    return {
      code: 1,
      output: `Report unavailable: ${error instanceof Error ? error.message : 'unknown error'}`
    }
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const result = await runExecutionReportCli(process.argv.slice(2))
  process.stdout.write(result.output + '\n')
  process.exitCode = result.code
}
