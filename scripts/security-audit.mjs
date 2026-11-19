import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

function readFindings(result) {
  if (result.error || result.signal || ![0, 1].includes(result.status)) {
    throw new Error('The dependency audit process did not complete normally')
  }

  const findings = result.stdout.trim()
    ? result.stdout
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line))
    : []

  for (const finding of findings) {
    const detail = finding?.children

    if (
      typeof finding?.value !== 'string' ||
      !finding.value.trim() ||
      !Number.isSafeInteger(detail?.ID) ||
      detail.ID <= 0 ||
      typeof detail.Issue !== 'string' ||
      !detail.Issue.trim() ||
      typeof detail.URL !== 'string' ||
      !detail.URL.startsWith('https://') ||
      !['high', 'critical'].includes(detail.Severity) ||
      typeof detail['Vulnerable Versions'] !== 'string' ||
      !Array.isArray(detail['Tree Versions']) ||
      !detail['Tree Versions'].length ||
      detail['Tree Versions'].some(
        (version) => typeof version !== 'string' || !version
      ) ||
      !Array.isArray(detail.Dependents) ||
      detail.Dependents.some(
        (dependent) => typeof dependent !== 'string' || !dependent
      )
    ) {
      throw new Error(
        'Unrecognized dependency audit record; retained for inspection'
      )
    }
  }

  const hasFindings = findings.length > 0

  if ((result.status === 1) !== hasFindings) {
    throw new Error('Dependency audit exit status contradicts its findings')
  }

  return findings
}

function run() {
  const parent = path.join(process.cwd(), 'tmp/security-audit')

  fs.mkdirSync(parent, { recursive: true })
  const directory = fs.mkdtempSync(path.join(parent, 'run-'))
  const summary = { status: 'failed-scan', scans: [] }
  let exitCode = 2

  try {
    for (const scope of ['recursive', 'direct']) {
      const args = ['npm', 'audit', '--all']

      if (scope === 'recursive') {
        args.push('--recursive')
      }

      args.push('--severity', 'high', '--json')
      const result = spawnSync('yarn', args, {
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 120000,
        maxBuffer: 16 * 1024 * 1024
      })
      const stdout = result.stdout ?? ''
      const stderr = result.stderr ?? ''

      fs.writeFileSync(path.join(directory, `${scope}.ndjson`), stdout)
      fs.writeFileSync(path.join(directory, `${scope}.stderr.log`), stderr)
      const scan = {
        scope,
        args,
        pid: result.pid,
        exitCode: result.status,
        signal: result.signal,
        error: result.error?.message
      }

      summary.scans.push(scan)
      process.stdout.write(`${scope} dependency audit:\n${stdout}`)
      process.stderr.write(stderr)
      scan.findings = readFindings({ ...result, stdout }).length
    }

    const [recursive, direct] = summary.scans

    if (direct.findings) {
      summary.status = 'blocked-direct-findings'
      exitCode = 1
    } else {
      summary.status = recursive.findings
        ? 'passed-with-transitive-findings'
        : 'passed'
      exitCode = 0
    }
  } catch (error) {
    summary.error = error.message
    process.stderr.write(`Security audit failed: ${error.message}\n`)
  }

  fs.writeFileSync(
    path.join(directory, 'summary.json'),
    JSON.stringify(summary, null, 2) + '\n'
  )
  process.stdout.write(
    `Security audit: ${summary.status}. Evidence: ${directory}\n`
  )
  process.exitCode = exitCode
}

try {
  run()
} catch (error) {
  process.stderr.write(
    `Security audit evidence could not be retained: ${error.message}\n`
  )
  process.exitCode = 2
}
