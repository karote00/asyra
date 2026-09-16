import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { spawn, spawnSync } from 'node:child_process'
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
const runner = fileURLToPath(
  new URL('../run-profile-groups.py', import.meta.url)
)
const artifacts = fileURLToPath(
  new URL('../../.artifacts/profile-group-runner-tests/', import.meta.url)
)
const heavy =
  'src/domain/__tests__/walking-constrained-kinematics.profile.test.ts'
const source = 'src/runtime/__tests__/nested/new-owner.source.profile.test.ts'
const remaining = 'src/runtime/__tests__/nested/new-owner.profile.test.ts'

function writeProfile(root, relative) {
  const target = path.join(root, relative)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, '')
}

function fixture() {
  const root = mkdtempSync(path.join(artifacts, 'fixture-'))
  writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({
      name: '@asyra/fieldscope',
      private: true,
      packageManager: 'yarn@4.3.1'
    })
  )
  writeProfile(root, heavy)
  writeProfile(root, source)
  writeProfile(root, remaining)
  writeProfile(root, 'src/runtime/__tests__/ignored.profile.test.tsx')
  writeProfile(root, 'src/runtime/outside.profile.test.ts')
  return root
}

const loadRunner = String.raw`
import importlib.util, json, sys
from pathlib import Path
spec = importlib.util.spec_from_file_location('profile_groups', sys.argv[1])
owner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(owner)
`

function discover(root) {
  const code =
    loadRunner +
    String.raw`
print(json.dumps(owner.discover_profile_groups(Path(sys.argv[2]))))
`
  const result = spawnSync('python3', ['-c', code, runner, root], {
    cwd: app,
    encoding: 'utf8',
    timeout: 5000
  })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout)
}

function writeFakeSupervisor(root) {
  const fake = path.join(root, 'fake-supervisor.py')
  writeFileSync(
    fake,
    String.raw`
import json, os, signal, sys, time
from pathlib import Path
args = sys.argv[1:]
files = [args[index + 1] for index, value in enumerate(args) if value == '--file']
record = Path(os.environ['PROFILE_GROUP_RECORD'])
with record.open('a') as target:
    target.write(json.dumps(files) + '\n')
mode = os.environ.get('PROFILE_GROUP_MODE', 'pass')
if mode == 'wait':
    def stop(signum, _frame):
        Path(os.environ['PROFILE_GROUP_CLEANED']).write_text(str(signum))
        sys.exit(128 + signum)
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    Path(os.environ['PROFILE_GROUP_STARTED']).write_text('started')
    while True:
        time.sleep(0.05)
selection = {
    'kind': 'selected-profile-files',
    'coverage': 'filtered-profiles',
    'files': files,
    'title': None,
}
result = {
    'outcome': 'passed',
    'completion': 'filtered-profile-selection-complete',
    'exitCode': 0,
    'error': None,
    'reaped': True,
    'workInterpretation': 'exact',
    'unknownTail': False,
    'selection': selection,
    'summaryPath': 'summary.json',
    'logPath': 'console.log',
}
if mode == 'incomplete':
    result['completion'] = 'incomplete'
if mode == 'source-incomplete' and files == [
        'src/runtime/__tests__/nested/new-owner.source.profile.test.ts']:
    result['completion'] = 'incomplete'
if mode == 'remaining-incomplete' and files == [
        'src/runtime/__tests__/nested/new-owner.profile.test.ts']:
    result['completion'] = 'incomplete'
if mode == 'remaining-error' and files == [
        'src/runtime/__tests__/nested/new-owner.profile.test.ts']:
    result.update({
        'outcome': 'failed',
        'completion': 'incomplete',
        'exitCode': 7,
        'error': 'Vitest remaining failure',
        'workInterpretation': 'lower-bound',
        'unknownTail': True,
        'processWallMs': 4321.5,
        'consoleTail': '界' * 9000 + 'remaining-tail-end',
        'summaryPath': 'remaining-summary.json',
        'logPath': 'remaining-console.log',
    })
    sys.stderr.write('remaining wrapper stderr')
if mode == 'malformed':
    sys.stderr.write('錯' * 9000 + 'malformed-stderr-end')
    print('not-json')
    raise SystemExit(9)
if mode == 'wrong-selection':
    result['selection'] = {**selection, 'files': files + ['unexpected.profile.test.ts']}
if mode == 'error':
    result['outcome'] = 'failed'
    result['exitCode'] = 7
print(json.dumps(result))
if result['outcome'] == 'failed':
    raise SystemExit(7)
`
  )
  return fake
}

function run(root, supervisor, mode = 'pass') {
  const record = path.join(root, 'record.jsonl')
  const code =
    loadRunner +
    String.raw`
result = owner.run_profile_groups(
    Path(sys.argv[2]),
    Path(sys.argv[3]),
    environment=json.loads(sys.argv[4]),
)
print(json.dumps(result))
`
  const environment = {
    ...process.env,
    PROFILE_GROUP_MODE: mode,
    PROFILE_GROUP_RECORD: record
  }
  const result = spawnSync(
    'python3',
    ['-c', code, runner, root, supervisor, JSON.stringify(environment)],
    { cwd: app, encoding: 'utf8', timeout: 5000 }
  )
  assert.equal(result.status, 0, result.stderr)
  return {
    result: JSON.parse(result.stdout),
    calls: readFileSync(record, 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line))
  }
}

test.before(() => mkdirSync(artifacts, { recursive: true }))
test.after(() => rmSync(artifacts, { recursive: true, force: true }))

test('discovers the exact profile config class and automatically assigns nested source and remaining files', (t) => {
  const root = fixture()
  t.after(() => rmSync(root, { recursive: true, force: true }))
  assert.deepEqual(discover(root), {
    heavy: [heavy],
    source: [source],
    remaining: [remaining],
    all: [heavy, remaining, source]
  })
  rmSync(path.join(root, heavy))
  const missing = spawnSync(
    'python3',
    [
      '-c',
      loadRunner + String.raw`owner.discover_profile_groups(Path(sys.argv[2]))`,
      runner,
      root
    ],
    { cwd: app, encoding: 'utf8', timeout: 5000 }
  )
  assert.notEqual(missing.status, 0)
  assert.match(missing.stderr, /heavy profile/i)
})

test('runs heavy then source then remaining and reports full completion only after three exact receipts', (t) => {
  const root = fixture()
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const result = run(root, writeFakeSupervisor(root))
  assert.deepEqual(result.calls, [[heavy], [source], [remaining]])
  assert.equal(result.result.outcome, 'passed')
  assert.equal(result.result.completion, 'profile-suite-complete')
  assert.equal(result.result.selection.coverage, 'profiles')
  assert.deepEqual(result.result.selection.files, [heavy, remaining, source])
  assert.deepEqual(
    result.result.groups.map((group) => group.name),
    ['heavy', 'source', 'remaining']
  )
})

test('rejects an error, incomplete or mismatched receipt and never starts the source group', (t) => {
  for (const mode of ['error', 'incomplete', 'wrong-selection']) {
    const root = fixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))
    const result = run(root, writeFakeSupervisor(root), mode)
    assert.equal(result.result.outcome, 'failed')
    assert.equal(result.result.completion, 'incomplete')
    assert.deepEqual(result.calls, [[heavy]])
  }
})

test('fails full completion when the source or remaining group is incomplete', (t) => {
  for (const [mode, calls, completion] of [
    [
      'source-incomplete',
      [[heavy], [source]],
      ['filtered-profile-selection-complete', 'incomplete']
    ],
    [
      'remaining-incomplete',
      [[heavy], [source], [remaining]],
      [
        'filtered-profile-selection-complete',
        'filtered-profile-selection-complete',
        'incomplete'
      ]
    ]
  ]) {
    const root = fixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))
    const result = run(root, writeFakeSupervisor(root), mode)
    assert.equal(result.result.outcome, 'failed')
    assert.equal(result.result.completion, 'incomplete')
    assert.deepEqual(result.calls, calls)
    assert.deepEqual(
      result.result.groups.map((group) => group.completion),
      completion
    )
  }
})

test('preserves bounded failed receipt and malformed output diagnostics', (t) => {
  const receiptRoot = fixture()
  t.after(() => rmSync(receiptRoot, { recursive: true, force: true }))
  const receiptResult = run(
    receiptRoot,
    writeFakeSupervisor(receiptRoot),
    'remaining-error'
  )
  assert.deepEqual(receiptResult.calls, [[heavy], [source], [remaining]])
  const remainingGroup = receiptResult.result.groups.at(-1)
  assert.equal(remainingGroup.summaryPath, 'remaining-summary.json')
  assert.equal(remainingGroup.logPath, 'remaining-console.log')
  assert.equal(
    remainingGroup.failure.reason,
    'Supervisor group did not return a complete exact selection'
  )
  assert.equal(remainingGroup.failure.exitCode, 7)
  assert.equal(remainingGroup.failure.stderr, 'remaining wrapper stderr')
  assert.deepEqual(
    {
      ...remainingGroup.failure.supervisor,
      consoleTail: undefined
    },
    {
      outcome: 'failed',
      completion: 'incomplete',
      exitCode: 7,
      error: 'Vitest remaining failure',
      reaped: true,
      workInterpretation: 'lower-bound',
      unknownTail: true,
      processWallMs: 4321.5,
      summaryPath: 'remaining-summary.json',
      logPath: 'remaining-console.log',
      consoleTail: undefined
    }
  )
  assert.ok(
    Buffer.byteLength(remainingGroup.failure.supervisor.consoleTail, 'utf8') <=
      8000
  )
  assert.match(
    remainingGroup.failure.supervisor.consoleTail,
    /remaining-tail-end$/
  )

  const malformedRoot = fixture()
  t.after(() => rmSync(malformedRoot, { recursive: true, force: true }))
  const malformedResult = run(
    malformedRoot,
    writeFakeSupervisor(malformedRoot),
    'malformed'
  )
  assert.deepEqual(malformedResult.calls, [[heavy]])
  const malformedFailure = malformedResult.result.groups[0].failure
  assert.match(malformedFailure.reason, /did not return one JSON receipt/)
  assert.equal(malformedFailure.exitCode, 9)
  assert.equal(malformedFailure.supervisor, null)
  assert.ok(Buffer.byteLength(malformedFailure.stderr, 'utf8') <= 8000)
  assert.match(malformedFailure.stderr, /malformed-stderr-end$/)
})

test('forwards interruption to the active supervisor and waits for its cleanup', async (t) => {
  const root = fixture()
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const supervisor = writeFakeSupervisor(root)
  const record = path.join(root, 'record.jsonl')
  const started = path.join(root, 'started')
  const cleaned = path.join(root, 'cleaned')
  const code =
    loadRunner +
    String.raw`
try:
    owner.run_profile_groups(
        Path(sys.argv[2]),
        Path(sys.argv[3]),
        environment=json.loads(sys.argv[4]),
    )
except KeyboardInterrupt:
    raise SystemExit(130)
`
  const child = spawn(
    'python3',
    [
      '-c',
      code,
      runner,
      root,
      supervisor,
      JSON.stringify({
        ...process.env,
        PROFILE_GROUP_MODE: 'wait',
        PROFILE_GROUP_RECORD: record,
        PROFILE_GROUP_STARTED: started,
        PROFILE_GROUP_CLEANED: cleaned
      })
    ],
    { cwd: app, stdio: 'pipe' }
  )
  t.after(() => {
    if (child.exitCode === null) child.kill('SIGKILL')
  })
  const deadline = Date.now() + 3000
  while (Date.now() < deadline) {
    try {
      if (readFileSync(started, 'utf8') === 'started') break
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    await delay(10)
  }
  assert.equal(readFileSync(started, 'utf8'), 'started')
  child.kill('SIGTERM')
  const exit = await new Promise((resolve) => child.once('exit', resolve))
  assert.notEqual(exit, 0)
  assert.equal(readFileSync(cleaned, 'utf8'), String(15))
  assert.deepEqual(
    readFileSync(record, 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line)),
    [[heavy]]
  )
})

test('covers interruption after child spawn but before Popen returns', (t) => {
  const root = fixture()
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const supervisor = writeFakeSupervisor(root)
  const record = path.join(root, 'record.jsonl')
  const started = path.join(root, 'started')
  const cleaned = path.join(root, 'cleaned')
  const childPid = path.join(root, 'child-pid')
  const code =
    loadRunner +
    String.raw`
import os, signal, time
environment = json.loads(sys.argv[4])
original_popen = owner.subprocess.Popen
def interrupt_after_spawn(*args, **kwargs):
    child = original_popen(*args, **kwargs)
    Path(environment['PROFILE_GROUP_CHILD_PID']).write_text(str(child.pid))
    deadline = time.monotonic() + 3
    while not Path(environment['PROFILE_GROUP_STARTED']).exists():
        if time.monotonic() >= deadline:
            child.kill()
            child.wait()
            raise RuntimeError('fake supervisor did not start')
        time.sleep(0.01)
    os.kill(os.getpid(), signal.SIGTERM)
    return child
owner.subprocess.Popen = interrupt_after_spawn
try:
    owner.run_profile_groups(
        Path(sys.argv[2]),
        Path(sys.argv[3]),
        environment=environment,
    )
except owner.ProfileGroupInterrupted as error:
    print(json.dumps({'signum': error.signum}))
`
  const result = spawnSync(
    'python3',
    [
      '-c',
      code,
      runner,
      root,
      supervisor,
      JSON.stringify({
        ...process.env,
        PROFILE_GROUP_MODE: 'wait',
        PROFILE_GROUP_RECORD: record,
        PROFILE_GROUP_STARTED: started,
        PROFILE_GROUP_CLEANED: cleaned,
        PROFILE_GROUP_CHILD_PID: childPid
      })
    ],
    { cwd: app, encoding: 'utf8', timeout: 5000 }
  )
  const spawnedPid = Number(readFileSync(childPid, 'utf8'))
  t.after(() => {
    try {
      process.kill(spawnedPid, 'SIGKILL')
    } catch (error) {
      if (error.code !== 'ESRCH') throw error
    }
  })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), { signum: 15 })
  assert.equal(readFileSync(cleaned, 'utf8'), String(15))
  assert.throws(() => process.kill(spawnedPid, 0), { code: 'ESRCH' })
  assert.deepEqual(
    readFileSync(record, 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line)),
    [[heavy]]
  )
})
