/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { captureSource } = require('../snapshot.cjs')
const { loadContract, MANIFEST_PATH } = require('../contracts.cjs')
const { verifierFiles } = require('../ci-context.cjs')

// A committed test baseline is independent of the contributor checkout's diff.
function createAcceptedRepository(root, dir) {
  const snapshotDirectory = path.join(dir, 'baseline-source')
  fs.mkdirSync(snapshotDirectory)
  const contract = loadContract(root),
    snapshot = captureSource(root, snapshotDirectory, contract)
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
  return repository
}
module.exports = { createAcceptedRepository }
