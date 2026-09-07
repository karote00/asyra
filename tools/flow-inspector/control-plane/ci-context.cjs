/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const vm = require('node:vm')
const { execFileSync } = require('node:child_process')
const { admitContract, MANIFEST_PATH } = require('./contracts.cjs')
const { sha256, safePath } = require('./snapshot.cjs')
const verifierFiles = Object.freeze(
  [
    'contracts.cjs',
    'snapshot.cjs',
    'runner.cjs',
    'evidence.cjs',
    'ci-context.cjs',
    'ci-evidence.cjs',
    'service.cjs',
    'store.cjs',
    'cli.cjs',
    'evolution.cjs'
  ].map((name) => 'tools/flow-inspector/control-plane/' + name)
)
function prepareCIContext(
  root,
  baseRef,
  snapshot,
  { runId = 'local', attempt = 1, head } = {}
) {
  if (
    typeof baseRef !== 'string' ||
    !/^[a-zA-Z0-9][a-zA-Z0-9/._-]*$/.test(baseRef)
  )
    throw new Error('Invalid accepted base reference')
  const git = (args) =>
    execFileSync('git', args, {
      cwd: root,
      maxBuffer: 4194304,
      stdio: ['ignore', 'pipe', 'pipe']
    })
  const revision = (ref) =>
    git(['rev-parse', '--verify', ref + '^{commit}'])
      .toString()
      .trim()
  const base = revision(baseRef),
    integration = revision('HEAD')
  const read = (commit, file) => git(['show', commit + ':' + file])
  const manifest = JSON.parse(read(base, MANIFEST_PATH))
  const sandbox = { module: { exports: {} }, globalThis: {} }
  vm.runInNewContext(
    read(base, manifest.architecturePath).toString(),
    sandbox,
    { timeout: 1000 }
  )
  const accepted = admitContract(manifest, sandbox.module.exports)
  const policyIssues = []
  const protectedFiles = [
    MANIFEST_PATH,
    manifest.architecturePath,
    manifest.specPath,
    manifest.testFile,
    manifest.configFile,
    'yarn.lock',
    '.github/workflows/main.yml',
    ...verifierFiles
  ]
  const basePolicy = [],
    currentPolicy = []
  for (const file of protectedFiles) {
    let baseline
    try {
      baseline = read(base, file)
    } catch {
      policyIssues.push(
        'Accepted verifier or gate file is unavailable: ' + file
      )
    }
    const current = fs.readFileSync(safePath(root, file))
    basePolicy.push({ file, digest: baseline ? sha256(baseline) : null })
    currentPolicy.push({ file, digest: sha256(current) })
    if (baseline && sha256(baseline) !== sha256(current))
      policyIssues.push('Candidate changed accepted gate input: ' + file)
  }
  if (snapshot.head !== integration)
    policyIssues.push('Captured integration source revision changed')
  // Source inventory has already been captured once; compare immutable Git bytes
  // only at CI admission, never on state reads or while projecting evidence.
  for (const file of snapshot.files) {
    try {
      if (sha256(read(integration, file.path)) !== file.digest)
        policyIssues.push('Dirty integration source: ' + file.path)
    } catch {
      policyIssues.push('Untracked integration source: ' + file.path)
    }
  }
  const remote = git(['remote', 'get-url', 'origin']).toString().trim()
  const repository = remote
    .replace(/^.*github\.com[:/]/, '')
    .replace(/\.git$/, '')
  return {
    accepted,
    policyIssues,
    candidatePolicyDigest: sha256(JSON.stringify(currentPolicy)),
    expected: {
      repository,
      base,
      head: head ? revision(head) : integration,
      integration,
      runId,
      attempt,
      sourceDigest: snapshot.digest,
      configurationDigest: snapshot.configurationDigest,
      lockfileDigest: snapshot.lockfileDigest,
      policyDigest: sha256(JSON.stringify(basePolicy))
    }
  }
}
module.exports = { prepareCIContext, verifierFiles }
