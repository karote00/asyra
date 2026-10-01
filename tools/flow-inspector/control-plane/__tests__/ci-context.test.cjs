/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs')
const { captureSource } = require('../snapshot.cjs')
const { execFileSync } = require('node:child_process')
const { loadContract, MANIFEST_PATH } = require('../contracts.cjs')
const {
  createAcceptedRepository
} = require('./accepted-repository-fixture.cjs')
const { prepareCIContext, verifierFiles } = require('../ci-context.cjs')
const root = path.resolve(__dirname, '../../../..')
for (const selectedManifestPath of [
  MANIFEST_PATH,
  'apps/example/flow-contracts.json'
])
  test(
    'CI context binds the selected accepted contract and integration source: ' +
      selectedManifestPath,
    (t) => {
      const parent = path.join(root, 'tmp/flow-inspector/ci-context-tests')
      fs.mkdirSync(parent, { recursive: true })
      const dir = fs.mkdtempSync(path.join(parent, 'run-'))
      t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
      const contract = loadContract(root),
        snapshot = captureSource(root, dir, contract)
      const repository = createAcceptedRepository(root, dir)
      if (selectedManifestPath !== MANIFEST_PATH) {
        const selectedDefinition = structuredClone(contract.definition)
        selectedDefinition.manifestPath = selectedManifestPath
        const target = path.join(repository, selectedManifestPath)
        fs.mkdirSync(path.dirname(target), { recursive: true })
        fs.writeFileSync(target, JSON.stringify(selectedDefinition))
      }
      const git = (...args) =>
        execFileSync('git', args, {
          cwd: repository,
          stdio: ['ignore', 'pipe', 'pipe']
        })
          .toString()
          .trim()
      git('add', '.')
      git(
        '-c',
        'core.hooksPath=/dev/null',
        '-c',
        'commit.gpgsign=false',
        'commit',
        '--allow-empty',
        '-m',
        'Selected manifest fixture'
      )
      git('update-ref', 'refs/remotes/origin/main', 'HEAD')
      const captured = captureSource(
        repository,
        path.join(repository, 'tmp/capture'),
        loadContract(repository, undefined, selectedManifestPath)
      )
      const result = prepareCIContext(repository, 'origin/main', captured)
      assert.equal(result.accepted.manifestPath, selectedManifestPath)
      assert.equal(result.accepted.cases.length, 9)
      assert.equal(result.expected.sourceDigest, captured.digest)
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
        prepareCIContext(
          repository,
          'origin/main',
          corrupted
        ).policyIssues.some((issue) => /integration source/.test(issue))
      )
      assert.throws(() => prepareCIContext(root, '--help', snapshot), /base/)
    }
  )
