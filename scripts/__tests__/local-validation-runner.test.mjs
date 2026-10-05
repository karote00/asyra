import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn, spawnSync } from 'node:child_process'
import { runLocalChecks } from '../local-validation-runner.mjs'
import { resolveWorkspaceResultDirectory } from '../run-workspace-checks.mjs'

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)
function directory(t) {
  const parent = path.join(repositoryRoot, 'tmp/local-runner-fixtures')
  fs.mkdirSync(parent, { recursive: true })
  const root = fs.mkdtempSync(path.join(parent, 'run-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  return root
}
const command = (id, code, evidence = { type: 'exit' }) => ({
  id,
  executable: process.execPath,
  args: ['-e', code],
  evidence
})

test('cancellation also stops detached descendants while leaving unrelated processes running', async (t) => {
  const root = directory(t)
  const pidPath = path.join(root, 'descendant.pid')
  const controller = new globalThis.AbortController()
  const unrelated = spawn(
    process.execPath,
    ['-e', 'setInterval(() => {}, 1000)'],
    { detached: true, stdio: 'ignore' }
  )
  let descendant
  t.after(() => {
    for (const pid of [descendant, unrelated.pid])
      if (pid) {
        try {
          process.kill(pid, 'SIGKILL')
        } catch {
          // The cancellation assertion normally already reaped this process.
        }
      }
  })
  const code = `const {spawn}=require('node:child_process'); const fs=require('node:fs'); const child=spawn(process.execPath,['-e','setInterval(() => {},1000)'],{detached:true,stdio:'ignore'}); fs.writeFileSync(${JSON.stringify(pidPath)},String(child.pid)); setInterval(() => {},1000)`
  const pending = runLocalChecks({
    repositoryRoot,
    outputDirectory: path.join(root, 'results'),
    commands: [command('detached', code)],
    signal: controller.signal,
    verifyInputs: () => true
  })
  for (let attempt = 0; attempt < 100 && !fs.existsSync(pidPath); attempt++)
    await new Promise((resolve) => setTimeout(resolve, 20))
  assert.ok(fs.existsSync(pidPath), 'fixture child must start')
  descendant = Number(fs.readFileSync(pidPath, 'utf8'))
  controller.abort()
  const result = await pending
  assert.equal(result.status, 'cancelled')
  let state
  for (let attempt = 0; attempt < 100; attempt++) {
    state = spawnSync('ps', ['-p', String(descendant), '-o', 'stat='], {
      encoding: 'utf8'
    }).stdout.trim()
    if (!state || state.startsWith('Z')) break
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  assert.ok(
    !state || state.startsWith('Z'),
    `owned detached child remains ${state}`
  )
  assert.doesNotThrow(() => process.kill(unrelated.pid, 0))
})

test('an all-skipped TAP suite and incomplete workspace evidence cannot pass', async (t) => {
  const root = directory(t)
  const reportPath = path.join(root, 'workspace.json')
  fs.writeFileSync(
    reportPath,
    JSON.stringify({
      status: 'success',
      workspace: '@fixture/app',
      testStatus: 'zero-tests'
    })
  )
  const cases = [
    command(
      'tap',
      'console.log("# tests 2\\n# pass 0\\n# fail 0\\n# skipped 2")',
      { type: 'tap' }
    ),
    command('workspace', '', {
      type: 'workspace',
      path: reportPath,
      workspace: '@fixture/app'
    })
  ]
  for (const candidate of cases) {
    const result = await runLocalChecks({
      repositoryRoot,
      outputDirectory: path.join(root, candidate.id),
      commands: [candidate],
      verifyInputs: () => true
    })
    assert.equal(result.status, 'failed', candidate.id)
  }
})

test('owned runner records passing checks and rejects changes made during validation', async (t) => {
  const outputDirectory = directory(t)
  const commands = [command('success', 'console.log("done")')]
  const result = await runLocalChecks({
    repositoryRoot,
    outputDirectory,
    commands,
    onStarted: () =>
      assert.equal(
        JSON.parse(
          fs.readFileSync(path.join(outputDirectory, 'result.json'), 'utf8')
        ).status,
        'running'
      ),
    verifyInputs: () => true
  })
  assert.equal(result.status, 'passed')
  assert.ok(result.checks[0].pid > 0)
  assert.match(fs.readFileSync(result.checks[0].logPath, 'utf8'), /done/)
  const changed = await runLocalChecks({
    repositoryRoot,
    outputDirectory: path.join(outputDirectory, 'changed'),
    commands,
    verifyInputs: () => false
  })
  assert.equal(changed.status, 'unverified')
})

test('failed commands stop subsequent work and cannot produce a passing result', async (t) => {
  const outputDirectory = directory(t)
  const result = await runLocalChecks({
    repositoryRoot,
    outputDirectory,
    commands: [
      command('failure', 'process.exit(2)'),
      command('later', 'process.exit(0)')
    ],
    verifyInputs: () => true
  })
  assert.equal(result.status, 'failed')
  assert.deepEqual(
    result.checks.map(({ id }) => id),
    ['failure']
  )
  assert.equal(result.checks[0].exitCode, 2)
})

test('missing and zero-test E2E reports fail even when the command exits zero', async (t) => {
  const root = directory(t)
  for (const [name, report] of [
    ['missing', null],
    ['zero', { suites: [] }],
    ['failed', { suites: [], errors: ['runner failure'] }]
  ]) {
    const reportPath = path.join(root, `${name}.json`)
    if (report) fs.writeFileSync(reportPath, JSON.stringify(report))
    const result = await runLocalChecks({
      repositoryRoot,
      outputDirectory: path.join(root, name),
      commands: [command(name, '', { type: 'playwright', path: reportPath })],
      verifyInputs: () => true
    })
    assert.equal(result.status, 'failed', name)
  }
})

test('Playwright expected failures and successful retries retain their meaning without accepting unexpected outcomes', async (t) => {
  const root = directory(t)
  const cases = [
    {
      id: 'expected-failure',
      expectedStatus: 'failed',
      status: 'expected',
      results: [{ status: 'failed' }],
      outcome: 'passed'
    },
    {
      id: 'retry',
      expectedStatus: 'passed',
      status: 'flaky',
      results: [{ status: 'failed' }, { status: 'passed' }],
      outcome: 'passed'
    },
    {
      id: 'unexpected-pass',
      expectedStatus: 'failed',
      status: 'unexpected',
      results: [{ status: 'passed' }],
      outcome: 'failed'
    },
    {
      id: 'interrupted',
      expectedStatus: 'passed',
      status: 'unexpected',
      results: [{ status: 'interrupted' }],
      outcome: 'failed'
    }
  ]
  for (const item of cases) {
    const reportPath = path.join(root, `${item.id}.json`)
    fs.writeFileSync(
      reportPath,
      JSON.stringify({ suites: [{ specs: [{ tests: [item] }] }], errors: [] })
    )
    const result = await runLocalChecks({
      repositoryRoot,
      outputDirectory: path.join(root, item.id),
      commands: [
        command(item.id, '', { type: 'playwright', path: reportPath })
      ],
      verifyInputs: () => true
    })
    assert.equal(result.status, item.outcome, item.id)
  }
})

test('cancellation terminates the owned process and prevents another check', async (t) => {
  const outputDirectory = directory(t)
  const controller = new globalThis.AbortController()
  const result = await runLocalChecks({
    repositoryRoot,
    outputDirectory,
    commands: [
      command('waiting', 'setInterval(() => {}, 1000)'),
      command('later', '')
    ],
    signal: controller.signal,
    onStarted: () => controller.abort(),
    verifyInputs: () => true
  })
  assert.equal(result.status, 'cancelled')
  assert.equal(result.checks.length, 1)
  assert.throws(() => process.kill(result.checks[0].pid, 0), { code: 'ESRCH' })
})

test('workspace result directory retains the CI default and rejects paths outside the checkout', (t) => {
  const root = directory(t)
  assert.equal(
    resolveWorkspaceResultDirectory(root),
    path.join(root, '.ci-workspace-results')
  )
  assert.equal(
    resolveWorkspaceResultDirectory(root, 'tmp/results'),
    path.join(root, 'tmp/results')
  )
  assert.throws(
    () => resolveWorkspaceResultDirectory(root, '../outside'),
    /inside/
  )
})

test('workspace evidence preserves the existing owner verdict for expected or retried failures', async (t) => {
  const root = directory(t)
  const reportPath = path.join(root, 'workspace.json')
  fs.writeFileSync(
    reportPath,
    JSON.stringify({
      status: 'success',
      workspace: '@fixture/app',
      buildStatus: 'success',
      lintStatus: 'success',
      testStatus: 'success',
      e2eStatus: 'passed',
      e2eResult: { testCount: 2, passedCount: 1, failedCount: 1 }
    })
  )
  const result = await runLocalChecks({
    repositoryRoot,
    outputDirectory: path.join(root, 'result'),
    commands: [
      command('workspace', '', {
        type: 'workspace',
        path: reportPath,
        workspace: '@fixture/app'
      })
    ],
    verifyInputs: () => true
  })
  assert.equal(result.status, 'passed')
})
