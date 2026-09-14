import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'
import test from 'node:test'

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
test('the entire owned group is stopped and reaped', () => {
  const result = run('descendant')
  assert.equal(result.reaped, true)
  const pid = result.lastReceipt.descendantPid
  assert.ok(pid > 0)
  const state = spawnSync('ps', ['-o', 'stat=', '-p', String(pid)], {
    encoding: 'utf8'
  }).stdout.trim()
  assert.ok(!state || state.startsWith('Z'), state)
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

test('CI builds checkout-local dependencies before invoking the same supervised app entry', () => {
  const workflow = readFileSync(
    new URL('../../../../.github/workflows/main.yml', import.meta.url),
    'utf8'
  )
  const markers = [
    'Record original test job deadline',
    'Initialize test execution envelope',
    'run: yarn react:build',
    'run: yarn test:ci'
  ]
  function checkOrdering(source) {
    for (const marker of markers) {
      assert.equal(source.split(marker).length - 1, 1, marker)
      assert.ok(source.indexOf(marker) >= 0, marker)
    }
    for (let index = 1; index < markers.length; index++)
      assert.ok(
        source.indexOf(markers[index - 1]) < source.indexOf(markers[index])
      )
  }
  const validateJob = workflow.match(
    /\n {2}validate:\n([\s\S]*?)(?=\n {2}[a-zA-Z][\w-]*:\n|$)/
  )?.[1]
  assert.ok(validateJob)
  checkOrdering(validateJob)
  for (const marker of markers) {
    assert.throws(
      () => checkOrdering(validateJob.replace(marker, 'removed')),
      marker
    )
    assert.throws(() => checkOrdering(validateJob + '\n' + marker), marker)
  }
  const manifest = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
  )
  assert.equal(manifest.scripts['test:local'], manifest.scripts['test:ci'])
  function checkEntry(script) {
    assert.equal(
      script.split('python3 scripts/supervise-tests.py').length - 1,
      1
    )
    assert.doesNotMatch(script, /install|ln -s/)
  }
  checkEntry(manifest.scripts['test:ci'])
  assert.throws(() =>
    checkEntry(
      manifest.scripts['test:ci'] + ' && python3 scripts/supervise-tests.py --'
    )
  )
})
