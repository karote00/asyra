/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs')
const { captureSource } = require('../snapshot.cjs')
const { execFileSync } = require('node:child_process')
const { loadContract, MANIFEST_PATH } = require('../contracts.cjs')
const { prepareCIContext, verifierFiles } = require('../ci-context.cjs')
const root = path.resolve(__dirname, '../../../..')
test('CI context loads independent accepted obligations and binds captured source to integration Git bytes', (t) => {
  const parent = path.join(root, 'tmp/flow-inspector/ci-context-tests')
  fs.mkdirSync(parent, { recursive: true })
  const dir = fs.mkdtempSync(path.join(parent, 'run-'))
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  const contract = loadContract(root),
    snapshot = captureSource(root, dir, contract)
  const repository = path.join(dir, 'repository')
  fs.mkdirSync(repository)
  const files = new Set([
    ...snapshot.files.map((f) => f.path),
    MANIFEST_PATH,
    contract.definition.architecturePath,
    contract.definition.specPath,
    contract.definition.testFile,
    contract.definition.configFile,
    'yarn.lock',
    '.github/workflows/main.yml',
    ...verifierFiles
  ])
  for (const file of files) {
    const target = path.join(repository, file)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.copyFileSync(path.join(root, file), target)
  }
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: repository,
      stdio: ['ignore', 'pipe', 'pipe']
    })
      .toString()
      .trim()
  git('init')
  git('config', 'user.email', 'test@example.invalid')
  git('config', 'user.name', 'Flow test')
  git('add', '.')
  git(
    '-c',
    'core.hooksPath=/dev/null',
    '-c',
    'commit.gpgsign=false',
    'commit',
    '-m',
    'Accepted fixture'
  )
  git('remote', 'add', 'origin', 'https://github.com/example/fixture.git')
  git('update-ref', 'refs/remotes/origin/main', 'HEAD')
  const captured = { ...snapshot, head: git('rev-parse', 'HEAD') }
  const result = prepareCIContext(repository, 'origin/main', captured)
  assert.equal(result.accepted.cases.length, 6)
  assert.equal(result.expected.sourceDigest, snapshot.digest)
  assert.match(result.expected.base, /^[a-f0-9]{40}$/)
  assert.equal(result.expected.integration, captured.head)
  assert.equal(result.expected.head, captured.head)
  assert.deepEqual(result.policyIssues, [])
  fs.appendFileSync(
    path.join(repository, verifierFiles[0]),
    '\n// Candidate policy change\n'
  )
  assert.ok(
    prepareCIContext(repository, 'origin/main', captured).policyIssues.some(
      (issue) => /gate input/.test(issue)
    )
  )
  const corrupted = structuredClone(captured)
  corrupted.files[0].digest = '0'.repeat(64)
  assert.ok(
    prepareCIContext(repository, 'origin/main', corrupted).policyIssues.some(
      (issue) => /integration source/.test(issue)
    )
  )
  assert.throws(() => prepareCIContext(root, '--help', snapshot), /base/)
})
