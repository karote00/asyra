import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'
import test from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'

const supervisor = fileURLToPath(
  new URL('../supervise-tests.py', import.meta.url)
)
const child = String.raw`
const fs = require('node:fs'), cp = require('node:child_process');
const mode = process.argv[1];
const fd = +process.env.TEST_RECEIPT_FD;
let sequence = 0, work = 0;
function emit(kind, extra={}) {
  fs.writeSync(fd, JSON.stringify({ sequence: sequence++, kind, stage: 0, work,
    completed: 0, ...extra })+'\n');
}
emit('ready');
if (mode === 'truncated') fs.writeSync(fd, '{"sequence":1,"work":999');
if (mode === 'busy' || mode === 'truncated') while (true) {}
if (mode === 'heartbeat' || mode === 'progress') {
  setInterval(() => { if(mode === 'progress') work++; emit('progress'); }, 10);
} else if (mode === 'descendant') {
  const p = cp.spawn(process.execPath, ['-e','setInterval(()=>{},1000)'], {stdio:'ignore'});
  emit('progress', { descendantPid: p.pid });
  while (true) {}
} else if (mode === 'missing') {
  work=7; emit('progress');
} else if (mode === 'late') {
  setTimeout(()=>emit('final', {completed:1}), 400);
} else {
  work=9; emit('final', {completed:1, outcome: mode === 'cancel' ? 'cancelled' : 'complete'});
  if(mode === 'failed') process.exitCode=1;
}
`
function run(mode, hard = 3000, idle = 1000) {
  const result = spawnSync(
    'python3',
    [
      supervisor,
      '--oracle-command',
      JSON.stringify([process.execPath, '-e', child, mode]),
      '--hard-stop-ms',
      String(hard),
      '--idle-ms',
      String(idle)
    ],
    { encoding: 'utf8', timeout: 10000 }
  )
  assert.equal(result.error, undefined)
  assert.ok(result.stdout.trim(), result.stderr)
  return { status: result.status, ...JSON.parse(result.stdout) }
}
function parseLinuxProcessState(status) {
  const commandEnd = status.lastIndexOf(')')
  if (commandEnd < 0) {
    throw new Error('Malformed Linux process status')
  }
  const [state, ...remaining] = status
    .slice(commandEnd + 1)
    .trim()
    .split(/\s+/)
  if (!state || state.length !== 1 || remaining.length === 0) {
    throw new Error('Malformed Linux process status')
  }
  return state
}
async function waitForProcessExitOrLinuxZombie(pid, timeoutMs = 1000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      process.kill(pid, 0)
    } catch (error) {
      if (error.code === 'ESRCH') return
      assert.fail(`PID liveness check did not prove exit: ${error.code}`)
    }
    if (process.platform === 'linux') {
      try {
        const state = parseLinuxProcessState(
          readFileSync(`/proc/${pid}/stat`, 'utf8')
        )
        if (state === 'Z') return
      } catch (error) {
        if (error.code === 'ENOENT') return
        assert.fail(`Linux PID state could not be verified: ${error.message}`)
      }
    }
    await delay(10)
  }
  assert.fail(`Descendant PID ${pid} remained live after owned cleanup`)
}
test('Linux process status parsing preserves a zombie after a parenthesized command name', () => {
  assert.equal(
    parseLinuxProcessState('4321 (worker name (phase)) Z 1 2 3'),
    'Z'
  )
  assert.throws(() => parseLinuxProcessState('4321 malformed status'))
})
test('normal assertion completion and exit are both required', () => {
  const result = run('normal')
  assert.equal(result.status, 0)
  assert.equal(result.outcome, 'passed')
  assert.equal(result.unknownTail, false)
  assert.equal(result.lastReceipt.work, 9)
  for (const mode of ['missing', 'failed', 'cancel']) {
    assert.notEqual(run(mode).status, 0, mode)
  }
})
test('a blocked event loop is stopped outside the child', () => {
  const result = run('busy')
  assert.equal(result.outcome, 'no-progress')
  assert.equal(result.unknownTail, true)
  assert.equal(result.workInterpretation, 'lower-bound')
  assert.equal(result.reaped, true)
})
test('receipt heartbeat cannot count as useful progress', () => {
  assert.equal(run('heartbeat').outcome, 'no-progress')
})
test('even continuously advancing paid work cannot renew the hard deadline', () => {
  assert.equal(run('progress').outcome, 'hard-stop')
})
test('a truncated receipt cannot replace the last complete lower bound', () => {
  const result = run('truncated')
  assert.equal(result.lastReceipt.work, 0)
  assert.ok(result.discardedTailBytes > 0)
  assert.equal(result.unknownTail, true)
})
test('a late final result cannot convert timeout to success', () => {
  assert.notEqual(run('late', 250, 500).status, 0)
})
test('the owned descendant has exited or is a Linux zombie after cleanup', async () => {
  const result = run('descendant')
  const pid = result.lastReceipt.descendantPid
  assert.ok(pid > 0)
  await waitForProcessExitOrLinuxZombie(pid)
})

test('default and worker-limited suites run heavy once without skipping ordinary tests', () => {
  const code = `
import sys, importlib.util, json
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('supervisor', sys.argv[1])
owner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(owner)
print(json.dumps([owner.phase_commands(['vitest','run'], args, False)
                  for args in ([], ['--maxWorkers=1'], ['some.test.ts'])]))
`
  const result = spawnSync('python3', ['-c', code, supervisor], {
    encoding: 'utf8',
    timeout: 5000
  })
  assert.equal(result.status, 0, result.stderr)
  const [normal, limited, selected] = JSON.parse(result.stdout)
  for (const phases of [normal, limited]) {
    assert.equal(phases.length, 4)
    assert.equal(phases[0][2], 0)
    assert.ok(phases[0][1].includes('--exclude'))
    assert.equal(phases[1][2], 4)
    assert.equal(phases[2][2], 1)
    assert.equal(phases[3][2], 4)
    for (const [index, file] of [
      [1, 'fresh-witness-source-work'],
      [2, 'representative-work'],
      [3, 'witnessed-zero-source-work']
    ]) {
      const path = phases[index][1].find((arg) => arg.includes(file))
      assert.ok(path)
      const excluded = phases[0][1].indexOf(path)
      assert.ok(excluded > 0)
      assert.equal(phases[0][1][excluded - 1], '--exclude')
    }
    assert.equal(
      phases[1][1].filter((arg) => arg.includes('fresh-witness-source-work'))
        .length,
      1
    )
  }
  assert.equal(selected.length, 1)
  assert.ok(selected[0][1].includes('some.test.ts'))
})

test('selected heavy files retain separate complete-case receipts and reject filtered proofs', () => {
  const code = `
import sys, importlib.util, json
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('supervisor', sys.argv[1])
owner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(owner)
files = ['src/analysis/methods/__tests__/representative-work.test.ts',
         'src/analysis/methods/__tests__/witnessed-zero-source-work.test.ts']
phases = owner.phase_commands(['vitest','run'], files + ['some.test.ts', '--maxWorkers=1'], False)
rejected = []
for file in files:
    try:
        owner.phase_commands(['vitest','run'], [file, '-t', 'one case'], False)
        rejected.append(False)
    except ValueError:
        rejected.append(True)
print(json.dumps(dict(phases=phases, rejected=rejected)))
`
  const result = spawnSync('python3', ['-c', code, supervisor], {
    encoding: 'utf8',
    timeout: 5000
  })
  assert.equal(result.status, 0, result.stderr)
  const { phases, rejected } = JSON.parse(result.stdout)
  assert.deepEqual(rejected, [true, true])
  assert.deepEqual(
    phases.map((phase) => phase[2]),
    [0, 1, 4]
  )
  for (const phase of phases) assert.ok(phase[1].includes('--maxWorkers=1'))
  assert.ok(phases[0][1].includes('some.test.ts'))
  assert.equal(
    phases[0][1].filter((arg) => arg.includes('source-work')).length,
    0
  )
  assert.equal(phases[1][1].filter((arg) => arg.endsWith('.test.ts')).length, 1)
  assert.equal(phases[2][1].filter((arg) => arg.endsWith('.test.ts')).length, 1)
})

test('runtime ownership accepts explicit monorepo and standalone installations but rejects arbitrary ancestors', (t) => {
  const parent = fileURLToPath(
    new URL('../../.artifacts/consumer-tests/', import.meta.url)
  )
  mkdirSync(parent, { recursive: true })
  const directory = mkdtempSync(path.join(parent, 'supervisor-roots-'))
  t.after(() => rmSync(directory, { recursive: true }))
  const manifest = (name, extra = {}) =>
    JSON.stringify({
      name,
      private: true,
      packageManager: 'yarn@4.3.1',
      ...extra
    })
  const standalone = path.join(directory, 'standalone')
  mkdirSync(path.join(standalone, 'node_modules/vitest'), { recursive: true })
  writeFileSync(
    path.join(standalone, 'package.json'),
    manifest('@asyra/asyra-sim')
  )
  writeFileSync(path.join(standalone, 'node_modules/vitest/vitest.mjs'), '')

  const repository = path.join(directory, 'repository')
  const repositoryApp = path.join(repository, 'apps/asyra-sim')
  mkdirSync(path.join(repository, 'node_modules/vitest'), { recursive: true })
  mkdirSync(path.join(repositoryApp, 'node_modules/vitest'), {
    recursive: true
  })
  writeFileSync(
    path.join(repository, 'package.json'),
    manifest('workspace-root', { workspaces: ['apps/*'] })
  )
  writeFileSync(
    path.join(repositoryApp, 'package.json'),
    manifest('@asyra/asyra-sim')
  )
  writeFileSync(path.join(repository, 'node_modules/vitest/vitest.mjs'), '')
  writeFileSync(path.join(repositoryApp, 'node_modules/vitest/vitest.mjs'), '')

  const unknownRoot = path.join(directory, 'unknown')
  const unknownApp = path.join(unknownRoot, 'nested/app')
  mkdirSync(path.join(unknownRoot, 'node_modules/vitest'), { recursive: true })
  mkdirSync(unknownApp, { recursive: true })
  writeFileSync(path.join(unknownRoot, 'package.json'), manifest('unrelated'))
  writeFileSync(
    path.join(unknownApp, 'package.json'),
    manifest('@asyra/asyra-sim')
  )
  writeFileSync(path.join(unknownRoot, 'node_modules/vitest/vitest.mjs'), '')

  const code = `
import sys, importlib.util, json
from pathlib import Path
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('supervisor', sys.argv[1])
owner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(owner)
results = []
for candidate in sys.argv[2:]:
    try:
        results.append([str(path) for path in owner.resolve_runtime(Path(candidate))])
    except RuntimeError as error:
        results.append({'error': str(error)})
print(json.dumps(results))
`
  const result = spawnSync(
    'python3',
    ['-c', code, supervisor, standalone, repositoryApp, unknownApp],
    { encoding: 'utf8', timeout: 5000 }
  )
  assert.equal(result.status, 0, result.stderr)
  const [standaloneResult, repositoryResult, unknownResult] = JSON.parse(
    result.stdout
  )
  assert.deepEqual(standaloneResult, [
    standalone,
    path.join(standalone, 'node_modules/vitest/vitest.mjs'),
    path.join(standalone, 'tmp/test-supervision')
  ])
  assert.deepEqual(repositoryResult, [
    repository,
    path.join(repository, 'node_modules/vitest/vitest.mjs'),
    path.join(repository, 'tmp/test-supervision')
  ])
  assert.match(unknownResult.error, /owned|installation|manifest/i)
})

test('fresh CI records the original job deadline before install while execution still requires owned Vitest', (t) => {
  const parent = fileURLToPath(
    new URL('../../.artifacts/consumer-tests/', import.meta.url)
  )
  mkdirSync(parent, { recursive: true })
  const repository = mkdtempSync(path.join(parent, 'fresh-ci-'))
  t.after(() => rmSync(repository, { recursive: true }))
  const app = path.join(repository, 'apps/asyra-sim')
  const script = path.join(app, 'scripts/supervise-tests.py')
  mkdirSync(path.dirname(script), { recursive: true })
  writeFileSync(
    path.join(repository, 'package.json'),
    JSON.stringify({
      private: true,
      packageManager: 'yarn@4.3.1',
      workspaces: ['apps/*']
    })
  )
  writeFileSync(
    path.join(app, 'package.json'),
    JSON.stringify({
      name: '@asyra/asyra-sim',
      private: true,
      packageManager: 'yarn@4.3.1'
    })
  )
  copyFileSync(supervisor, script)
  const deadline = Date.now() + 600_000
  const environment = {
    ...process.env,
    TEST_JOB_DEADLINE_MS: String(deadline),
    TEST_CLEANUP_MS: '60000',
    TEST_IDLE_MS: '120000'
  }
  const initialized = spawnSync('python3', [script, '--init-ci'], {
    cwd: app,
    encoding: 'utf8',
    env: environment,
    timeout: 5000
  })
  assert.equal(initialized.status, 0, initialized.stderr)
  assert.deepEqual(
    JSON.parse(
      readFileSync(
        path.join(repository, 'tmp/test-supervision/ci-budget.json'),
        'utf8'
      )
    ),
    { deadlineMs: deadline, cleanupMs: 60000, idleMs: 120000 }
  )
  const execution = spawnSync('python3', [script], {
    cwd: app,
    encoding: 'utf8',
    env: { ...environment, CI: '' },
    timeout: 5000
  })
  assert.notEqual(execution.status, 0)
  assert.match(execution.stderr, /Missing owned Vitest installation/)
})
