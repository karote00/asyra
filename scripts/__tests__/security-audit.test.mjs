import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath, URL } from 'node:url'

const repositoryRoot = path.resolve(
  fileURLToPath(new URL('../..', import.meta.url))
)

const advisory = (name, severity = 'high') => ({
  value: name,
  children: {
    ID: 123456,
    Issue: 'A dependency vulnerability',
    URL: 'https://github.com/advisories/GHSA-test',
    Severity: severity,
    'Vulnerable Versions': '<=1.0.0',
    'Tree Versions': ['1.0.0'],
    Dependents: ['parent@npm:1.0.0']
  }
})

const finding = (name, severity) => ({
  status: 1,
  stdout: JSON.stringify(advisory(name, severity)) + '\n'
})

const clean = { status: 0, stdout: '' }

function execute(t, recursive, direct) {
  const parent = path.join(repositoryRoot, 'tmp/security-audit-tests')

  fs.mkdirSync(parent, { recursive: true })
  const root = fs.mkdtempSync(path.join(parent, 'case-'))

  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  fs.mkdirSync(path.join(root, 'bin'))
  fs.writeFileSync(
    path.join(root, 'fixture.json'),
    JSON.stringify({ recursive, direct })
  )
  fs.writeFileSync(
    path.join(root, 'bin/yarn'),
    `#!/usr/bin/env node
import fs from 'node:fs';
const args = process.argv.slice(2);
fs.appendFileSync('calls.jsonl', JSON.stringify(args) + '\\n');
const fixture = JSON.parse(fs.readFileSync('fixture.json', 'utf8'));
const result = args.includes('--recursive') ? fixture.recursive : fixture.direct;
process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');
process.exit(result.status);
`,
    { mode: 0o755 }
  )
  const manifest = JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
  )
  const [command, ...args] = manifest.scripts['security:audit'].split(' ')

  if (command === 'node') {
    args[0] = path.join(repositoryRoot, args[0])
  }

  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: path.join(root, 'bin') + path.delimiter + process.env.PATH
    }
  })
  const calls = fs.existsSync(path.join(root, 'calls.jsonl'))
    ? fs
        .readFileSync(path.join(root, 'calls.jsonl'), 'utf8')
        .trim()
        .split('\n')
        .map(JSON.parse)
    : []
  const evidenceRoot = path.join(root, 'tmp/security-audit')
  const directories = fs.existsSync(evidenceRoot)
    ? fs.readdirSync(evidenceRoot)
    : []
  const evidence =
    directories.length === 1 ? path.join(evidenceRoot, directories[0]) : null

  return { result, calls, evidence }
}

test('records transitive-only findings without blocking the actual security command', (t) => {
  const { result, calls, evidence } = execute(t, finding('picomatch'), clean)

  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.deepEqual(calls, [
    ['npm', 'audit', '--all', '--recursive', '--severity', 'high', '--json'],
    ['npm', 'audit', '--all', '--severity', 'high', '--json']
  ])
  assert.ok(evidence)
  assert.equal(
    fs.readFileSync(path.join(evidence, 'recursive.ndjson'), 'utf8'),
    finding('picomatch').stdout
  )
  assert.equal(
    fs.readFileSync(path.join(evidence, 'direct.ndjson'), 'utf8'),
    ''
  )
  const summary = JSON.parse(
    fs.readFileSync(path.join(evidence, 'summary.json'), 'utf8')
  )

  assert.equal(summary.status, 'passed-with-transitive-findings')
  assert.match(result.stdout, /picomatch/u)
})

test('direct findings still block even when the same package is also transitive', (t) => {
  const { result, evidence } = execute(t, finding('shared'), finding('shared'))

  assert.equal(result.status, 1)
  assert.ok(evidence)
  const summary = JSON.parse(
    fs.readFileSync(path.join(evidence, 'summary.json'), 'utf8')
  )

  assert.equal(summary.status, 'blocked-direct-findings')
  assert.equal(
    fs.readFileSync(path.join(evidence, 'direct.ndjson'), 'utf8'),
    finding('shared').stdout
  )
})

test('keeps critical transitive findings visible under the same owner policy', (t) => {
  const { result } = execute(t, finding('nested', 'critical'), clean)

  assert.equal(result.status, 0)
  assert.match(result.stdout, /critical/u)
})

test('accepts an empty successful report from both Yarn scopes', (t) => {
  const { result, calls } = execute(t, clean, clean)

  assert.equal(result.status, 0, result.stderr)
  assert.equal(calls.length, 2)
})

for (const [name, invalid] of [
  [
    'registry error',
    { status: 1, stdout: '{"type":"error","data":"Registry unavailable"}\n' }
  ],
  ['empty failed scan', { status: 1, stdout: '' }],
  ['truncated report', { status: 1, stdout: '{"value":' }],
  ['unrecognized record', { status: 1, stdout: '{}\n' }],
  ['contradictory exit', { status: 0, stdout: finding('nested').stdout }],
  ['unexpected process exit', { status: 2, stdout: finding('nested').stdout }]
]) {
  for (const scope of ['recursive', 'direct']) {
    test(`does not accept ${name} in the ${scope} scan`, (t) => {
      const { result, evidence } = execute(
        t,
        scope === 'recursive' ? invalid : clean,
        scope === 'direct' ? invalid : clean
      )

      assert.equal(result.status, 2)
      assert.ok(evidence)
      const summary = JSON.parse(
        fs.readFileSync(path.join(evidence, 'summary.json'), 'utf8')
      )

      assert.equal(summary.status, 'failed-scan')
      assert.equal(
        fs.readFileSync(path.join(evidence, `${scope}.ndjson`), 'utf8'),
        invalid.stdout
      )
    })
  }
}

test('does not hide findings with repository advisory or package exclusions', () => {
  const config = fs.readFileSync(
    path.join(repositoryRoot, '.yarnrc.yml'),
    'utf8'
  )

  assert.doesNotMatch(
    config,
    /^npmAudit(?:IgnoreAdvisories|ExcludePackages):/mu
  )
})

test('retains the observed picomatch advisory with its real installed versions', (t) => {
  const stdout = fs.readFileSync(
    new URL('./fixtures/security-audit/picomatch.ndjson', import.meta.url),
    'utf8'
  )
  const { result, evidence } = execute(t, { status: 1, stdout }, clean)

  assert.equal(result.status, 0, result.stderr)
  assert.equal(
    fs.readFileSync(path.join(evidence, 'recursive.ndjson'), 'utf8'),
    stdout
  )
  assert.match(result.stdout, /2\.3\.2/u)
  assert.match(result.stdout, /4\.0\.7/u)
})
