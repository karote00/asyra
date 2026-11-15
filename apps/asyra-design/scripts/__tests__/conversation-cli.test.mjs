import test from 'node:test'
import process from 'node:process'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { resolve, join, relative } from 'node:path'

const root = resolve(import.meta.dirname, '../../../..')
const entry = resolve(root, 'apps/asyra-design/scripts/verify-conversation.mjs')

test('verification CLI rejects an invalid explicit project instead of using its default', () => {
  const result = spawnSync(
    process.execPath,
    [entry, '--project', 'tmp/missing-conversation-project.json', '--list'],
    { cwd: root, encoding: 'utf8' }
  )

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /missing-conversation-project/)
})

import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync
} from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { setTimeout as delay } from 'node:timers/promises'
const require = createRequire(import.meta.url)
const {
  initialize
} = require('../../../../tools/flow-inspector/flow-files/project.cjs')

const until = async (condition, message) => {
  const deadline = Date.now() + 10000

  while (!condition()) {
    assert.ok(Date.now() < deadline, message)
    await delay(20)
  }
}

const alive = (pid) => {
  try {
    process.kill(pid, 0)

    return true
  } catch (error) {
    if (error.code === 'ESRCH') {
      return false
    }

    throw error
  }
}

test('actual verification interruption cannot become success or dispatch a successor', async (t) => {
  const directory = mkdtempSync(join(root, 'tmp/conversation-cli-'))
  const project = initialize(directory, 'manual', 'interruption-proof')
  const fixtureFlow = JSON.parse(
    readFileSync(join(project.directory, 'checkout.flow.json'), 'utf8')
  )

  fixtureFlow.definition = JSON.parse(
    readFileSync(
      join(
        root,
        'apps/asyra-design/test-data/conversation-verification/flow/conversation.flow.json'
      ),
      'utf8'
    )
  ).definition
  writeFileSync(
    join(project.directory, 'checkout.flow.json'),
    JSON.stringify(fixtureFlow)
  )
  const configuration = join(root, `.conversation-cli-${randomUUID()}.json`)

  writeFileSync(
    configuration,
    JSON.stringify({
      schemaVersion: 1,
      projectId: project.projectId,
      flows: relative(root, project.directory)
    })
  )
  const bin = join(directory, 'bin')

  mkdirSync(bin)
  const calls = join(directory, 'calls.jsonl')

  // Only the external build command is substituted. Run the real CLI, its
  // process owner, evidence publication and exit decision.
  writeFileSync(
    join(bin, 'yarn'),
    String.raw`#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { appendFileSync } from 'node:fs'
const child = spawn(process.execPath, ['-e', "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)"], { stdio: 'ignore' })
appendFileSync(process.env.CONVERSATION_CLI_CALLS, JSON.stringify({ pid: process.pid, descendant: child.pid }) + '\n')
process.on('SIGTERM', () => process.exit(0))
setInterval(() => {}, 1000)
`,
    { mode: 0o755 }
  )

  const records = () =>
    existsSync(calls)
      ? readFileSync(calls, 'utf8')
          .trim()
          .split('\n')
          .filter(Boolean)
          .map(JSON.parse)
      : []

  const child = spawn(process.execPath, [entry, '--project', configuration], {
    cwd: root,
    detached: true,
    env: {
      ...process.env,
      PATH: bin + ':' + process.env.PATH,
      CONVERSATION_CLI_CALLS: calls
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  let stdout = '',
    stderr = '',
    finished = false,
    code

  child.stdout.on('data', (value) => {
    stdout += value
  })
  child.stderr.on('data', (value) => {
    stderr += value
  })
  child.on('close', (value) => {
    code = value
    finished = true
  })
  t.after(() => {
    for (const pid of [
      child.pid,
      ...records().flatMap((row) => [row.pid, row.descendant])
    ]) {
      try {
        process.kill(-pid, 'SIGKILL')
      } catch (error) {
        if (error.code !== 'ESRCH') {
          throw error
        }
      }

      try {
        process.kill(pid, 'SIGKILL')
      } catch (error) {
        if (error.code !== 'ESRCH') {
          throw error
        }
      }
    }

    rmSync(configuration)
    rmSync(directory, { recursive: true, force: true })
  })
  await until(
    () => records().length > 0 || finished,
    'Build child did not start'
  )
  assert.equal(finished, false, stdout + stderr)
  // Give the external command time to install its signal handler.
  await delay(100)
  child.kill('SIGTERM')
  await until(
    () => finished || records().length > 1,
    'Interrupted CLI did not settle'
  )
  assert.equal(records().length, 1, 'Interrupted CLI dispatched another build')
  assert.equal(code, 1, stdout + stderr)
  await until(
    () => !alive(records()[0].descendant),
    'Owned descendant survived cancellation'
  )
  const evidence = stdout.match(/Evidence: (.+)/)?.[1]

  assert.ok(evidence, 'Missing failed evidence')
  const summary = JSON.parse(
    readFileSync(join(evidence, 'summary.json'), 'utf8')
  )

  assert.equal(summary.executionStatus, 'failed-or-incomplete')
  assert.ok(summary.issues.some((issue) => /cancel|interrupt/i.test(issue)))
  const processes = JSON.parse(
    readFileSync(join(evidence, 'processes.json'), 'utf8')
  )

  assert.equal(processes.length, 2)
  assert.equal(processes[0].id, 'scope-admission')
  assert.equal(processes[0].code, 0)
  assert.equal(processes[0].reason, null)
  assert.ok(processes[0].finishedAt)
  assert.equal(processes[1].reason, 'cancelled')
  assert.ok(processes[1].finishedAt)
})
