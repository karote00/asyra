import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath, URL } from 'node:url'

const app = fileURLToPath(new URL('../..', import.meta.url))
const supervisor = fileURLToPath(
  new URL('../supervise-tests.py', import.meta.url)
)
const artifacts = fileURLToPath(
  new URL('../../.artifacts/supervisor-tests/', import.meta.url)
)
const child = String.raw`
const cp = require('node:child_process');
const mode = process.argv[1];
if (mode === 'busy') while (true) {}
if (mode === 'descendant') {
  const child = cp.spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], {stdio:'ignore'});
  console.log('descendant:' + child.pid);
  while (true) {}
}
if (mode === 'output') process.stdout.write('x'.repeat(4096));
if (mode === 'failed') process.exitCode = 7;
if (mode === 'normal') console.log('complete');
`
const runner = String.raw`
import importlib.util, json, sys
from pathlib import Path
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('fieldscope_supervisor', sys.argv[1])
owner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(owner)
result = owner.run_command(
    json.loads(sys.argv[2]), int(sys.argv[3]),
    json.loads(sys.argv[7]),
    Path(sys.argv[4]), max_stream_bytes=int(sys.argv[5]))
print(json.dumps(result))
`

function run(
  mode,
  hardStopMs = 1000,
  streamBytes = 64 * 1024 * 1024,
  selection = {
    kind: 'diagnostic-title',
    coverage: 'filtered',
    files: ['synthetic-child'],
    title: mode
  }
) {
  const result = spawnSync(
    'python3',
    [
      '-c',
      runner,
      supervisor,
      JSON.stringify([process.execPath, '-e', child, mode]),
      String(hardStopMs),
      artifacts,
      String(streamBytes),
      mode,
      JSON.stringify(selection)
    ],
    { cwd: app, encoding: 'utf8', timeout: 10000 }
  )
  assert.equal(result.error, undefined)
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout)
}

function parseLinuxProcessState(status) {
  const commandEnd = status.lastIndexOf(')')
  if (commandEnd < 0) throw new Error('Malformed Linux process status')
  const [state, ...remaining] = status
    .slice(commandEnd + 1)
    .trim()
    .split(/\s+/)
  if (!state || state.length !== 1 || remaining.length === 0)
    throw new Error('Malformed Linux process status')
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
        if (
          parseLinuxProcessState(readFileSync(`/proc/${pid}/stat`, 'utf8')) ===
          'Z'
        )
          return
      } catch (error) {
        if (error.code === 'ENOENT') return
        assert.fail(`Linux PID state could not be verified: ${error.message}`)
      }
    }
    await delay(10)
  }
  assert.fail(`Descendant PID ${pid} remained live after owned cleanup`)
}

test.before(() => mkdirSync(artifacts, { recursive: true }))
test.after(() => rmSync(artifacts, { recursive: true, force: true }))

test('records bounded artifacts and exact process accounting for normal and failed exits', () => {
  const normal = run('normal')
  assert.equal(normal.outcome, 'passed')
  assert.equal(normal.completion, 'filtered-selection-complete')
  assert.equal(normal.exitCode, 0)
  assert.equal(normal.reaped, true)
  assert.equal(normal.unknownTail, false)
  assert.equal(normal.selection.coverage, 'filtered')
  assert.ok(normal.processWallMs >= 0)
  assert.ok(normal.processUserCpuMs >= 0)
  assert.ok(normal.processSystemCpuMs >= 0)
  assert.match(normal.consoleTail, /complete/)
  assert.equal(
    JSON.parse(readFileSync(normal.summaryPath, 'utf8')).outcome,
    'passed'
  )
  assert.match(readFileSync(normal.logPath, 'utf8'), /complete/)

  const failed = run('failed')
  assert.equal(failed.outcome, 'failed')
  assert.equal(failed.exitCode, 7)
  assert.equal(failed.completion, 'incomplete')
  assert.equal(failed.workInterpretation, 'lower-bound')
})

test('profile completion never reports ordinary full-suite coverage', () => {
  for (const [coverage, completion] of [
    ['profiles', 'profile-suite-complete'],
    ['filtered-profiles', 'filtered-profile-selection-complete']
  ]) {
    const selected = { kind: 'profile-suite', coverage, files: [], title: null }
    const result = run('normal', 1000, 4096, selected)
    assert.equal(result.completion, completion)
    assert.equal(result.selection.coverage, coverage)
    const stopped = run('busy', 250, 4096, selected)
    assert.equal(stopped.outcome, 'hard-stop')
    assert.equal(stopped.completion, 'incomplete')
    assert.equal(stopped.reaped, true)
    assert.equal(stopped.unknownTail, true)
  }
})

test('stops a synchronous child outside its blocked event loop', () => {
  const result = run('busy', 250)
  assert.equal(result.outcome, 'hard-stop')
  assert.equal(result.reaped, true)
  assert.equal(result.unknownTail, true)
  assert.equal(result.workInterpretation, 'lower-bound')
})

test('stops descendants in the owned process group', async () => {
  const result = run('descendant', 250)
  const pid = Number(result.consoleTail.match(/descendant:(\d+)/)?.[1])
  assert.ok(pid > 0)
  await waitForProcessExitOrLinuxZombie(pid)
})

test('bounds captured output and rejects malformed Linux process status', () => {
  const result = run('output', 1000, 128)
  assert.equal(result.outcome, 'output-limit')
  assert.equal(result.unknownTail, true)
  assert.ok(readFileSync(result.logPath).byteLength <= 128)
  assert.ok(Buffer.byteLength(result.consoleTail) <= 8000)
  assert.equal(
    parseLinuxProcessState('4321 (worker name (phase)) Z 1 2 3'),
    'Z'
  )
  assert.throws(() => parseLinuxProcessState('4321 malformed status'))
})

test('selects the full suite or an explicitly labelled filtered file/title scope without bypass flags', () => {
  const code = String.raw`
import importlib.util, json, sys
from pathlib import Path
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('fieldscope_supervisor', sys.argv[1])
owner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(owner)
app = Path(sys.argv[2])
file = 'src/domain/__tests__/walking-constrained-kinematics.test.ts'
full = owner.select_tests(app, [], None)
selected = owner.select_tests(app, [file], None)
title = owner.select_tests(app, [file], 'canonical constrained support projection')
errors = []
for files, name in [(['missing.test.ts'], None),
                    (['../outside.test.ts'], None),
                    (['src/domain/__tests__/scalar.profile.test.ts'], None),
                    ([], 'filtered'), ([file, file], None)]:
    try:
        owner.select_tests(app, files, name)
        errors.append(None)
    except (ValueError, RuntimeError) as error:
        errors.append(str(error))
print(json.dumps({'full': full, 'selected': selected, 'title': title,
                  'errors': errors}))
`
  const result = spawnSync('python3', ['-c', code, supervisor, app], {
    encoding: 'utf8',
    timeout: 5000
  })
  assert.equal(result.status, 0, result.stderr)
  const selection = JSON.parse(result.stdout)
  assert.equal(selection.full.coverage, 'full')
  assert.equal(selection.full.kind, 'ordinary-suite')
  assert.equal(selection.selected.coverage, 'filtered')
  assert.equal(selection.selected.kind, 'selected-files')
  assert.equal(selection.title.coverage, 'filtered')
  assert.equal(selection.title.kind, 'selected-title')
  assert.ok(selection.errors.every(Boolean))

  for (const flag of [
    '--exclude',
    '--passWithNoTests',
    '--config',
    '--testNamePattern'
  ]) {
    const rejected = spawnSync('python3', [supervisor, flag, 'value'], {
      cwd: app,
      encoding: 'utf8',
      timeout: 5000
    })
    assert.notEqual(rejected.status, 0, flag)
  }
})

test('selects required profiles with their own config, bounded selectors and worker acknowledgements', () => {
  const code = String.raw`
import importlib.util, json, sys
from pathlib import Path
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('fieldscope_supervisor', sys.argv[1])
owner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(owner)
app = Path(sys.argv[2])
file = 'src/domain/__tests__/kinematic-trigonometry.profile.test.ts'
full = owner.select_tests(app, [], None, profile=True)
selected = owner.select_tests(app, [file], None, profile=True)
title = owner.select_tests(app, [file], 'exact polynomial', profile=True)
errors = []
for files, name in [(['src/domain/__tests__/walking-constrained-kinematics.test.ts'], None),
                    (['../outside.profile.test.ts'], None),
                    (['src/domain/__tests__/missing.profile.test.ts'], None),
                    ([str(app / file)], None),
                    ([], 'filtered'), ([file, file], None),
                    ([file], ''), ([file], 'bad\nname'), ([file], 'x' * 4097)]:
    try:
        owner.select_tests(app, files, name, profile=True)
        errors.append(None)
    except (ValueError, RuntimeError) as error:
        errors.append(str(error))
command = owner.test_command(app, 'node', Path('vitest.mjs'), title, profile=True)
ordinary = owner.test_command(app, 'node', Path('vitest.mjs'),
                              owner.select_tests(app, [], None))
print(json.dumps({'full': full, 'selected': selected, 'title': title,
                  'errors': errors, 'command': command, 'ordinary': ordinary}))
`
  const result = spawnSync('python3', ['-c', code, supervisor, app], {
    encoding: 'utf8',
    timeout: 5000
  })
  assert.equal(result.status, 0, result.stderr)
  const selection = JSON.parse(result.stdout)
  assert.equal(selection.full.kind, 'profile-suite')
  assert.equal(selection.full.coverage, 'profiles')
  assert.equal(selection.selected.kind, 'selected-profile-files')
  assert.equal(selection.selected.coverage, 'filtered-profiles')
  assert.equal(selection.title.kind, 'selected-profile-title')
  assert.equal(selection.title.coverage, 'filtered-profiles')
  assert.ok(selection.errors.every(Boolean))
  assert.deepEqual(selection.command, [
    'node',
    'vitest.mjs',
    'run',
    '--config',
    path.join(app, 'vitest.profile.config.ts'),
    'src/domain/__tests__/kinematic-trigonometry.profile.test.ts',
    '-t',
    'exact polynomial'
  ])
  assert.equal(selection.ordinary[4], path.join(app, 'vitest.config.ts'))
  const profileConfig = readFileSync(
    path.join(app, 'vitest.profile.config.ts'),
    'utf8'
  )
  assert.match(profileConfig, /setupFiles:[\s\S]*vitest\.setup\.ts/)
  const scripts = JSON.parse(
    readFileSync(path.join(app, 'package.json'), 'utf8')
  ).scripts
  assert.equal(
    scripts['test:profiles'],
    'node --test scripts/__tests__/supervise-tests.test.mjs && python3 scripts/supervise-tests.py --profile'
  )
})

test('resolves only the FieldScope checkout installation and rejects an arbitrary ancestor', (t) => {
  const unknown = mkdtempSync(path.join(artifacts, 'unknown-owner-'))
  t.after(() => rmSync(unknown, { recursive: true, force: true }))
  const nested = path.join(unknown, 'nested/app')
  mkdirSync(path.join(unknown, 'node_modules/vitest'), { recursive: true })
  mkdirSync(nested, { recursive: true })
  writeFileSync(
    path.join(unknown, 'package.json'),
    JSON.stringify({ name: 'unrelated', private: true })
  )
  writeFileSync(
    path.join(nested, 'package.json'),
    JSON.stringify({
      name: '@asyra/fieldscope',
      private: true,
      packageManager: 'yarn@4.3.1'
    })
  )
  writeFileSync(path.join(unknown, 'node_modules/vitest/vitest.mjs'), '')
  const code = String.raw`
import importlib.util, json, sys
from pathlib import Path
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('fieldscope_supervisor', sys.argv[1])
owner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(owner)
root, vitest, artifacts = owner.resolve_runtime(Path(sys.argv[2]))
try:
    owner.resolve_runtime(Path(sys.argv[3]))
    error = None
except RuntimeError as caught:
    error = str(caught)
print(json.dumps({'root': str(root), 'vitest': str(vitest),
                  'artifacts': str(artifacts), 'error': error}))
`
  const result = spawnSync('python3', ['-c', code, supervisor, app, nested], {
    encoding: 'utf8',
    timeout: 5000
  })
  assert.equal(result.status, 0, result.stderr)
  const resolved = JSON.parse(result.stdout)
  assert.equal(resolved.root, path.resolve(app, '../..'))
  assert.equal(
    resolved.vitest,
    path.resolve(app, '../../node_modules/vitest/vitest.mjs')
  )
  assert.equal(
    resolved.artifacts,
    path.resolve(app, '.artifacts/test-supervision')
  )
  assert.match(resolved.error, /owned|installation|manifest/i)
})
