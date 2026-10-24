import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)

test('retained candidates reproduce both App update fixtures without changing acceptance evidence', (t) => {
  const first = 'fixtures/app-update-text-consumer'
  const subsequent = 'fixtures/app-update-text-subsequent'
  const output = path.join(repositoryRoot, 'tmp/app-update-fixture-validation')
  fs.mkdirSync(output, { recursive: true })
  const files = execFileSync('git', ['ls-files', '-z', first, subsequent], {
    cwd: repositoryRoot,
    encoding: 'utf8'
  })
    .split('\0')
    .filter(Boolean)
  assert.ok(files.length > 0)
  const snapshot = () =>
    files.map((file) => [
      file,
      createHash('sha256')
        .update(fs.readFileSync(path.join(repositoryRoot, file)))
        .digest('hex')
    ])
  const original = snapshot()
  const run = (name, executable, args) => {
    const log = path.join(output, `${name}.log`)
    const fd = fs.openSync(log, 'w')
    let result
    try {
      result = spawnSync(executable, args, {
        cwd: repositoryRoot,
        env: {
          ...process.env,
          YARN_GLOBAL_FOLDER: path.join(output, 'yarn-global')
        },
        stdio: ['ignore', fd, fd],
        timeout: 180_000
      })
    } finally {
      fs.closeSync(fd)
    }
    assert.equal(
      result.status,
      0,
      `${name}: ${result.error?.message ?? result.signal ?? 'failed'}; ${log}\n${fs.readFileSync(log, 'utf8').slice(-4000)}`
    )
    t.diagnostic(`${name} passed; ${log}`)
  }

  run('handoff', 'python3', [`${subsequent}/tools/test-handoff.py`])
  const artifacts = path.join(repositoryRoot, subsequent, 'artifacts')
  fs.mkdirSync(artifacts, { recursive: true })
  run('restore-candidates', 'tar', [
    '-xzf',
    `${subsequent}/delivery/revision-2/text-spacing-r2-independent.tar.gz`,
    '--strip-components=2',
    '-C',
    artifacts,
    'consumer/artifacts'
  ])
  fs.cpSync(artifacts, path.join(repositoryRoot, 'tmp/text-update-artifacts'), {
    recursive: true
  })
  for (const [name, fixture] of [
    ['first', first],
    ['subsequent', subsequent]
  ]) {
    run(`${name}-install`, 'yarn', ['--cwd', fixture, 'install', '--immutable'])
    for (const command of ['test', 'typecheck', 'lint', 'build']) {
      run(`${name}-${command}`, 'yarn', ['--cwd', fixture, command])
    }
  }
  run('artifact-contract', 'python3', [`${subsequent}/tools/test-artifacts.py`])
  assert.deepEqual(snapshot(), original)
})

test('cross-version delivery preserves evidence and reproduces the integrated consumer', (t) => {
  const result = spawnSync(
    'python3',
    ['fixtures/app-update-text-cross-version/tools/test-delivery.py'],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
      timeout: 30_000
    }
  )
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const fixture = 'fixtures/app-update-text-cross-version'
  const output = path.join(
    repositoryRoot,
    'tmp/app-update-cross-version-validation'
  )
  const temporary = path.join(output, 'tmp')
  fs.mkdirSync(temporary, { recursive: true })
  const run = (name, command, args) => {
    const log = path.join(output, `${name}.log`)
    const fd = fs.openSync(log, 'w')
    let replay
    try {
      replay = spawnSync(command, args, {
        cwd: repositoryRoot,
        env: {
          ...process.env,
          YARN_GLOBAL_FOLDER: path.join(output, 'yarn-global'),
          TMPDIR: temporary
        },
        stdio: ['ignore', fd, fd],
        timeout: 180_000
      })
    } finally {
      fs.closeSync(fd)
    }
    assert.equal(
      replay.status,
      0,
      `${name}: ${replay.error?.message ?? replay.signal ?? 'failed'}; ${log}\n${fs.readFileSync(log, 'utf8').slice(-4000)}`
    )
    t.diagnostic(`${name} passed; ${log}`)
  }
  const artifacts = path.join(repositoryRoot, fixture, 'artifacts')
  fs.mkdirSync(artifacts, { recursive: true })
  run('restore-candidates', 'tar', [
    '-xzf',
    `${fixture}/delivery/input-v1.tar.gz`,
    '--strip-components=2',
    '-C',
    artifacts,
    'consumer/artifacts'
  ])
  run('install', 'yarn', ['--cwd', fixture, 'install', '--immutable'])
  for (const command of ['test', 'typecheck', 'lint', 'build']) {
    run(command, 'yarn', ['--cwd', fixture, command])
  }
  run('evidence-after-replay', 'python3', [`${fixture}/tools/test-delivery.py`])
})
