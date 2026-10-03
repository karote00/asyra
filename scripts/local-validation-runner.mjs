import fs from 'node:fs'
import path from 'node:path'
import { execFileSync, spawn } from 'node:child_process'

function processIdentities() {
  const output = execFileSync('ps', ['-Ao', 'pid=,ppid=,pgid=,lstart='], {
    encoding: 'utf8',
    timeout: 2000,
    maxBuffer: 4 * 1024 * 1024
  })
  return output.split('\n').flatMap((line) => {
    const match = line.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s+(.+)$/)
    return match
      ? [
          {
            pid: Number(match[1]),
            parent: Number(match[2]),
            group: Number(match[3]),
            started: match[4]
          }
        ]
      : []
  })
}

function ownedDescendantGroups(rootPid) {
  const identities = processIdentities()
  const owned = new Set([rootPid])
  let changed = true
  while (changed) {
    changed = false
    for (const identity of identities)
      if (owned.has(identity.parent) && !owned.has(identity.pid)) {
        owned.add(identity.pid)
        changed = true
      }
  }
  const groups = new Map()
  for (const identity of identities) {
    // A group is owned only when its leader belongs to this command tree.
    if (!owned.has(identity.pid) || !owned.has(identity.group)) continue
    if (!groups.has(identity.group)) groups.set(identity.group, [])
    groups.get(identity.group).push(identity)
  }
  return groups
}

function signalOwnedGroups(groups, signal) {
  const current = new Map(
    processIdentities().map((identity) => [identity.pid, identity])
  )
  for (const [group, members] of groups) {
    const stillOwned = members.some(
      (member) =>
        current.get(member.pid)?.group === group &&
        current.get(member.pid)?.started === member.started
    )
    if (!stillOwned) continue
    try {
      process.kill(-group, signal)
    } catch (error) {
      if (error.code !== 'ESRCH') throw error
    }
  }
}

function checkEvidence(evidence, logPath) {
  if (evidence.type === 'exit') return
  if (evidence.type === 'tap') {
    const log = fs.readFileSync(logPath, 'utf8')
    const counts = [...log.matchAll(/^# pass (\d+)$/gm)]
    const failures = [...log.matchAll(/^# fail (\d+)$/gm)]
    if (
      Number(counts.at(-1)?.[1] ?? 0) <= 0 ||
      Number(failures.at(-1)?.[1] ?? -1) !== 0
    )
      throw new Error('No executed tests in TAP report')
    return
  }
  const report = JSON.parse(fs.readFileSync(evidence.path, 'utf8'))
  if (evidence.type === 'shared') {
    if (
      !report.checks ||
      !['lint', 'repositoryScripts', 'naming'].every((name) =>
        ['passed', 'not-selected'].includes(report.checks[name]?.status)
      )
    )
      throw new Error('Shared checks are missing or failed')
    return
  }
  if (evidence.type === 'workspace') {
    if (
      report.status !== 'success' ||
      report.workspace !== evidence.workspace ||
      report.buildStatus !== 'success' ||
      !['success', 'not-selected'].includes(report.lintStatus) ||
      !['success', 'not-selected'].includes(report.testStatus) ||
      !['passed', 'not-selected'].includes(report.e2eStatus) ||
      (report.e2eStatus === 'passed' && !(report.e2eResult?.testCount > 0))
    )
      throw new Error('Workspace checks are missing or failed')
    return
  }
  if (evidence.type !== 'playwright')
    throw new Error('Unknown result evidence contract')
  let executed = 0
  let expectedFailures = 0
  let flaky = 0
  let failed = report.errors?.length ?? 0
  const visit = (suites) => {
    for (const suite of suites ?? []) {
      for (const spec of suite.specs ?? [])
        for (const test of spec.tests ?? []) {
          const result = test.results?.at(-1)
          if (!result || result.status === 'skipped') continue
          executed++
          const expectedStatus = test.expectedStatus ?? 'passed'
          if (
            !['passed', 'failed'].includes(result.status) ||
            result.status !== expectedStatus ||
            test.status === 'unexpected'
          )
            failed++
          else if (expectedStatus === 'failed') expectedFailures++
          if (test.status === 'flaky') flaky++
        }
      visit(suite.suites)
    }
  }
  visit(report.suites)
  if (executed === 0 || failed > 0)
    throw new Error('E2E has zero executed tests or unexpected results')
  return { executed, expectedFailures, flaky }
}

function executeOwnedCommand(
  command,
  { repositoryRoot, logPath, signal, onStarted }
) {
  return new Promise((resolve) => {
    const descriptor = fs.openSync(logPath, 'wx', 0o600)
    const child = spawn(command.executable, command.args, {
      cwd: repositoryRoot,
      env: { ...process.env, ...command.env },
      detached: process.platform !== 'win32',
      stdio: ['ignore', descriptor, descriptor],
      shell: false
    })
    fs.closeSync(descriptor)
    let escalation
    let failure
    let stopping = false
    let descendantGroups = new Map()
    const terminate = (name) => {
      if (!child.pid) return
      try {
        if (process.platform === 'win32') child.kill(name)
        else if (descendantGroups.size)
          signalOwnedGroups(descendantGroups, name)
        else process.kill(-child.pid, name)
      } catch (error) {
        if (error.code !== 'ESRCH') failure = error.message
      }
    }
    const abort = () => {
      if (stopping) return
      stopping = true
      if (process.platform !== 'win32') {
        try {
          descendantGroups = ownedDescendantGroups(child.pid)
        } catch (error) {
          failure = `Descendant ownership could not be read: ${error.message}`
        }
      }
      terminate('SIGTERM')
      escalation = setTimeout(() => terminate('SIGKILL'), 5000)
      escalation.unref()
    }
    child.once('error', (error) => {
      failure = error.message
    })
    child.once('close', (exitCode, exitSignal) => {
      clearTimeout(escalation)
      signal?.removeEventListener('abort', abort)
      // Also terminate descendants if the wrapper exited before its children.
      if (signal?.aborted) terminate('SIGKILL')
      resolve({
        pid: child.pid ?? null,
        exitCode,
        exitSignal,
        ownedProcessGroups: [...descendantGroups.keys()],
        ...(failure ? { error: failure } : {})
      })
    })
    signal?.addEventListener('abort', abort, { once: true })
    child.once('spawn', () => {
      onStarted?.(child.pid)
      if (signal?.aborted) abort()
    })
  })
}

export async function runLocalChecks({
  repositoryRoot,
  outputDirectory,
  commands,
  signal,
  verifyInputs,
  onStarted,
  onProgress
}) {
  fs.mkdirSync(outputDirectory, { recursive: true, mode: 0o700 })
  const result = { authority: 'local', status: 'running', checks: [] }
  const save = () =>
    fs.writeFileSync(
      path.join(outputDirectory, 'result.json'),
      JSON.stringify(result, null, 2) + '\n',
      { mode: 0o600 }
    )
  for (const [index, command] of commands.entries()) {
    if (signal?.aborted) {
      result.status = 'cancelled'
      break
    }
    const logPath = path.join(outputDirectory, `${index + 1}.log`)
    const record = {
      id: command.id,
      status: 'running',
      logPath,
      executable: command.executable,
      args: command.args
    }
    result.checks.push(record)
    save()
    onProgress?.(`Running ${command.id}`)
    const outcome = await executeOwnedCommand(command, {
      repositoryRoot,
      logPath,
      signal,
      onStarted: (pid) => {
        record.pid = pid
        save()
        onStarted?.(pid)
      }
    })
    Object.assign(record, outcome)
    if (signal?.aborted) record.status = 'cancelled'
    else if (outcome.exitCode !== 0 || outcome.error) record.status = 'failed'
    else {
      try {
        record.evidenceSummary = checkEvidence(command.evidence, logPath)
        record.status = 'passed'
      } catch (error) {
        record.status = 'failed'
        record.error = error.message
      }
    }
    save()
    if (record.status !== 'passed') {
      result.status = record.status
      break
    }
  }
  try {
    result.sourceVerified = await verifyInputs()
  } catch (error) {
    result.sourceVerified = false
    result.sourceError = error.message
  }
  if (result.status === 'running')
    result.status = result.sourceVerified ? 'passed' : 'unverified'
  save()
  return result
}
