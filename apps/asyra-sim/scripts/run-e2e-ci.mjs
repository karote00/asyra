import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'
import { createRequire } from 'node:module'

import {
  CI_E2E_GROUPS,
  collectBrowserSpecFiles,
  mergePlaywrightReports
} from './e2e-ci-groups.mjs'

const require = createRequire(import.meta.url)
const appRoot = fileURLToPath(new URL('../', import.meta.url))
const repositoryRoot = path.resolve(appRoot, '../..')
const temporary =
  process.env.RUNNER_TEMP ||
  fileURLToPath(new URL('../.artifacts/browser-tmp/', import.meta.url))
const aggregateReportPath =
  process.env.PLAYWRIGHT_JSON_OUTPUT_FILE ??
  path.join(appRoot, '.artifacts', 'browser-report.json')

const artifactId = crypto
  .createHash('sha256')
  .update('@asyra/asyra-sim')
  .digest('hex')
  .slice(0, 16)
const resultDirectory = path.dirname(aggregateReportPath)
const identity = {
  repository: process.env.CI_SCOPE_REPOSITORY ?? '',
  base: process.env.CI_SCOPE_BASE ?? '',
  head: process.env.CI_SCOPE_HEAD ?? '',
  integration: process.env.CI_SCOPE_INTEGRATION ?? '',
  run: process.env.CI_SCOPE_RUN ?? '',
  attempt: process.env.CI_SCOPE_ATTEMPT ?? ''
}
const runLabel = (identity.run || 'local')
  .replace(/[^a-zA-Z0-9_-]/g, '-')
  .slice(0, 40)
const attemptLabel = (identity.attempt || '1')
  .replace(/[^a-zA-Z0-9_-]/g, '-')
  .slice(0, 12)

const discovered = collectBrowserSpecFiles(appRoot)
const assigned = CI_E2E_GROUPS.flatMap(({ files }) => files).toSorted()
if (
  assigned.length !== new Set(assigned).size ||
  JSON.stringify(assigned) !== JSON.stringify(discovered)
)
  throw new Error('Sim CI browser groups must cover every configured spec once')

fs.mkdirSync(temporary, { recursive: true })
fs.mkdirSync(resultDirectory, { recursive: true })

let activeChild
let receivedSignal = null
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    receivedSignal = signal
    activeChild?.kill(signal)
  })

function runPlaywright(command, environment) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, command, {
      cwd: appRoot,
      env: environment,
      stdio: 'inherit'
    })
    activeChild = child
    let spawnError = null
    child.on('error', (error) => {
      spawnError = error.message
    })
    child.on('close', (code, signal) => {
      activeChild = undefined
      resolve({
        exitCode: code ?? 1,
        signal,
        error: spawnError
      })
    })
  })
}

const groupRuns = []
const groupFailures = []
for (const group of CI_E2E_GROUPS) {
  const startedAt = new Date().toISOString()
  const outputDirectory = path.posix.join(
    'test-results',
    'ci',
    `${runLabel}-${attemptLabel}`,
    group.name
  )
  const reportPath = path.join(
    resultDirectory,
    `${artifactId}.${runLabel}.${attemptLabel}.${group.name}.playwright.json`
  )
  const command = [
    require.resolve('@playwright/test/cli'),
    'test',
    '--config',
    'playwright.config.ts',
    ...group.files,
    '--reporter=line,json'
  ]
  const commandDescription = [process.execPath, ...command]
  const result = await runPlaywright(command, {
    ...process.env,
    TMPDIR: temporary,
    TMP: temporary,
    TEMP: temporary,
    PLAYWRIGHT_OUTPUT_DIR: outputDirectory,
    PLAYWRIGHT_JSON_OUTPUT_FILE: reportPath
  })
  const finishedAt = new Date().toISOString()
  let report = null
  let reportError = null
  try {
    report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
  } catch (error) {
    reportError = error.message
  }
  const run = {
    group: group.name,
    command: commandDescription,
    exitCode: result.exitCode,
    startedAt,
    finishedAt,
    outputDirectory,
    reportPath: path
      .relative(repositoryRoot, reportPath)
      .split(path.sep)
      .join('/'),
    error: result.error ?? reportError,
    report
  }
  groupRuns.push(run)
  const groupReport = report
    ? {
        ...report,
        ciRun: {
          identity,
          group: group.name,
          selection: group.files,
          command: commandDescription,
          exitCode: result.exitCode,
          startedAt,
          finishedAt,
          outputDirectory
        }
      }
    : null
  if (groupReport)
    fs.writeFileSync(reportPath, JSON.stringify(groupReport, null, 2))

  const noTests =
    !report?.stats ||
    (report.stats.expected ?? 0) +
      (report.stats.unexpected ?? 0) +
      (report.stats.skipped ?? 0) ===
      0
  const failed =
    result.exitCode !== 0 ||
    Boolean(result.error || reportError) ||
    noTests ||
    Boolean(report?.errors?.length) ||
    (report.stats?.unexpected ?? 0) > 0
  if (failed) {
    groupFailures.push(group.name)
    process.stderr.write(
      `Sim E2E group failed or incomplete: ${group.name}; report ${run.reportPath}\n`
    )
  } else if (fs.existsSync(reportPath)) {
    fs.unlinkSync(reportPath)
  }
  if (receivedSignal) {
    groupFailures.push(`interrupted-${receivedSignal}`)
    break
  }
}

if (groupRuns.length < CI_E2E_GROUPS.length) {
  for (const group of CI_E2E_GROUPS.slice(groupRuns.length)) {
    const outputDirectory = path.posix.join(
      'test-results',
      'ci',
      `${runLabel}-${attemptLabel}`,
      group.name
    )
    groupRuns.push({
      group: group.name,
      command: [],
      exitCode: 1,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      outputDirectory,
      reportPath: null,
      error: `not started because the CI runner received ${receivedSignal}`,
      report: null
    })
    groupFailures.push(group.name)
  }
}

const merged = mergePlaywrightReports(groupRuns, identity)
fs.mkdirSync(path.dirname(aggregateReportPath), { recursive: true })
fs.writeFileSync(aggregateReportPath, JSON.stringify(merged, null, 2))
if (groupFailures.length) {
  process.stderr.write(
    `Sim E2E incomplete groups: ${groupFailures.join(', ')}\n`
  )
  process.exitCode = 1
}
