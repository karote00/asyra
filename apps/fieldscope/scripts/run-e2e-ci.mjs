import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import { createRequire } from 'node:module'

import {
  CI_E2E_GROUPS,
  collectBrowserSpecFiles,
  mergePlaywrightReports
} from './e2e-ci-groups.mjs'

const require = createRequire(import.meta.url)
const appRoot = fileURLToPath(new URL('../', import.meta.url))
const reportPath = path.resolve(
  process.env.PLAYWRIGHT_JSON_OUTPUT_FILE ??
    path.join(appRoot, '.artifacts', 'fieldscope-e2e-ci.playwright.json')
)
const assigned = CI_E2E_GROUPS.flatMap(({ files }) => files).toSorted()
if (
  assigned.length !== new Set(assigned).size ||
  JSON.stringify(assigned) !== JSON.stringify(collectBrowserSpecFiles(appRoot))
)
  throw new Error('FieldScope CI groups must cover every browser spec once')

const artifactDirectory = path.join(appRoot, '.artifacts', 'e2e-ci')
const outputRoot = path.join(appRoot, 'test-results', 'ci', `${Date.now()}`)
const totalTimeoutMs = 900_000
const startedAt = Date.now()
fs.mkdirSync(path.dirname(reportPath), { recursive: true })
fs.mkdirSync(artifactDirectory, { recursive: true })

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
      resolve({ exitCode: code ?? 1, signal, error: spawnError })
    })
  })
}

const groupRuns = []
const failedGroups = []
for (const [index, group] of CI_E2E_GROUPS.entries()) {
  const remainingTimeout = totalTimeoutMs - (Date.now() - startedAt)
  if (remainingTimeout <= 0 || receivedSignal) {
    failedGroups.push(group.name)
    groupRuns.push({
      group: group.name,
      exitCode: 1,
      error: receivedSignal ?? 'The 15 minute E2E suite budget expired.'
    })
    continue
  }

  const childReportPath = path.join(
    artifactDirectory,
    `${index}-${group.name}.json`
  )
  const outputDirectory = path.join(outputRoot, group.name)
  fs.rmSync(childReportPath, { force: true })
  const command = [
    require.resolve('@playwright/test/cli'),
    'test',
    '--config',
    'playwright.config.ts',
    ...group.files,
    '--timeout=90000',
    `--global-timeout=${remainingTimeout}`,
    '--reporter=line,json'
  ]
  const result = await runPlaywright(command, {
    ...process.env,
    TMPDIR: artifactDirectory,
    TMP: artifactDirectory,
    TEMP: artifactDirectory,
    PLAYWRIGHT_OUTPUT_DIR: outputDirectory,
    PLAYWRIGHT_JSON_OUTPUT_FILE: childReportPath
  })

  let report = null
  let reportError = null
  try {
    report = JSON.parse(fs.readFileSync(childReportPath, 'utf8'))
  } catch (error) {
    reportError = error.message
  }
  const run = {
    group: group.name,
    exitCode: result.exitCode,
    error: result.error ?? reportError,
    report
  }
  groupRuns.push(run)
  const outcomes = report?.stats
    ? (report.stats.expected ?? 0) +
      (report.stats.unexpected ?? 0) +
      (report.stats.skipped ?? 0)
    : 0
  if (
    result.exitCode !== 0 ||
    result.error ||
    reportError ||
    !outcomes ||
    report?.errors?.length ||
    (report.stats?.unexpected ?? 0) > 0
  ) {
    failedGroups.push(group.name)
    process.stderr.write(
      `FieldScope E2E group failed or incomplete: ${group.name}; report ${childReportPath}\n`
    )
  } else fs.rmSync(childReportPath, { force: true })

  if (receivedSignal) {
    failedGroups.push(`interrupted-${receivedSignal}`)
    for (const pending of CI_E2E_GROUPS.slice(index + 1))
      groupRuns.push({
        group: pending.name,
        exitCode: 1,
        error: `Not started because the runner received ${receivedSignal}.`
      })
    break
  }
}

const merged = mergePlaywrightReports(groupRuns)
fs.writeFileSync(reportPath, JSON.stringify(merged, null, 2))
if (failedGroups.length) {
  process.stderr.write(
    `FieldScope E2E incomplete groups: ${failedGroups.join(', ')}\n`
  )
  process.exitCode = 1
}
