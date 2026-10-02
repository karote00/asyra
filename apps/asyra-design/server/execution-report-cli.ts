import { readFile, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseExecutionRecord } from './local-ai-records'
import {
  createExecutionPeriodReport,
  evaluateExecution
} from './local-ai-evaluation'

const help = `Execution reports (local, read only)
  --directory PATH    Record directory (default AI_EXECUTION_RECORD_DIR or tmp/ai-executions)
  --request ID        Inspect one request, regardless of date
  --from ISO --to ISO Half-open period; default recent seven days
  --feedback PATH     Optional JSON object of request IDs to user feedback strings
  --json              Full structured report instead of readable summary
  --help              This help
No drawing or model call is made by this command.`

const renderRun = (run: ReturnType<typeof evaluateExecution>) => {
  const lines = [
    `Request ${run.requestId ?? 'unknown'} - ${run.outcome} - record ${run.complete ? 'complete' : 'incomplete'}`,
    `Total: ${run.timing.durationMs} ms; observed tool/research union: ${run.timing.observedToolAndResearchMs} ms; Unattributed: ${run.timing.unattributedMs} ms`,
    `Usage: ${run.usageStatus}; model review: ${run.modelReview.status} (not visual certification)`,
    `Steps: ${run.toolCalls.length}; findings: ${run.findings.length}`
  ]
  const longest = [...run.toolCalls]
    .sort((a, b) => (b.durationMs ?? -1) - (a.durationMs ?? -1))
    .slice(0, 10)
  lines.push(
    `Longest observed calls (${longest.length} of ${run.toolCalls.length}; full details with --json):`
  )
  for (const call of longest)
    lines.push(
      `  ${call.callId} - ${call.tool} - ${call.durationMs ?? 'unknown'} ms - ${call.responseTextBytes ?? 'unknown'} response bytes - sequence ${call.sequence}`
    )
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
  environment: Record<string, string | undefined> = process.env
): Promise<{ code: number; output: string }> => {
  try {
    const options = new Map<string, string>()
    let json = false
    for (let index = 0; index < args.length; index++) {
      const flag = args[index]
      if (flag === '--help') return { code: 0, output: help }
      if (flag === '--json') {
        json = true
        continue
      }
      if (
        !['--directory', '--request', '--from', '--to', '--feedback'].includes(
          flag
        )
      )
        throw new Error(`Unknown option: ${flag}`)
      const value = args[++index]
      if (!value || value.startsWith('--'))
        throw new Error(`Missing value for ${flag}`)
      if (options.has(flag)) throw new Error(`Repeated option: ${flag}`)
      options.set(flag, value)
    }
    if (
      options.has('--request') &&
      (options.has('--from') || options.has('--to'))
    )
      throw new Error('Choose a request or a period, not both.')
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
    if (requestId) {
      const matches = records.filter((record) => record.requestId === requestId)
      if (matches.length !== 1)
        throw new Error(
          `Expected one record for ${requestId}; found ${matches.length}.`
        )
      const report = {
        ...evaluateExecution(matches[0], { feedback: feedback[requestId] }),
        sourceFile: sources.find((source) => source.requestId === requestId)
          ?.file
      }
      return {
        code: 0,
        output: json ? JSON.stringify(report, null, 2) : renderRun(report)
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
    if (json) return { code: 0, output: JSON.stringify(report, null, 2) }
    return {
      code: 0,
      output: [
        `Execution report - ${report.from} to ${report.to} (exclusive)`,
        `${report.runs.length} runs; ${report.partialRuns} incomplete; ${report.excluded.length} unclassified; ${report.outsidePeriod} outside period`,
        `${report.groups.length} configuration groups (task equivalence is not established)`,
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
