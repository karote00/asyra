/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const {
  runContainedVerification,
  containedProcess,
  containmentAvailable
} = require('./runner.cjs')
const {
  safePath,
  sha256,
  createRuntimeSource,
  createVerificationSource,
  createDerivedExecution
} = require('./snapshot.cjs')
const { assessSourceEvidence } = require('./evidence.cjs')
const { writeAtomic } = require('./store.cjs')
async function produceCandidateProof({
  repositoryRoot,
  directory,
  contract,
  snapshot,
  candidateRoot,
  allowedFiles,
  attemptId,
  signal,
  timeoutMs,
  onSpawn
}) {
  if (!containmentAvailable())
    throw new Error('OS containment unavailable; candidate execution denied')
  if (!/^[a-zA-Z0-9-]+$/.test(attemptId))
    throw new Error('Invalid verification attempt')
  if (
    snapshot.digest !== sha256(JSON.stringify(snapshot.files)) ||
    snapshot.contractDigest !== contract.digest ||
    snapshot.mappingVersion !== contract.mappingVersion ||
    snapshot.architectureVersion !== contract.architectureVersion
  )
    throw new Error('Baseline source identity mismatch')
  const runDirectory = safePath(
    repositoryRoot,
    path.relative(
      repositoryRoot,
      path.join(directory, 'verification', attemptId)
    )
  )
  fs.mkdirSync(runDirectory, { recursive: true })
  const sourceRoot = path.join(runDirectory, 'source')
  const files = []
  for (const entry of snapshot.files) {
    const original = safePath(snapshot.sourceRoot, entry.path)
    if (sha256(fs.readFileSync(original)) !== entry.digest)
      throw new Error('Baseline source changed')
    const source = allowedFiles.includes(entry.path)
      ? safePath(candidateRoot, entry.path)
      : original
    const bytes = fs.readFileSync(source)
    const destination = path.join(sourceRoot, entry.path)
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.writeFileSync(destination, bytes, { flag: 'wx', mode: 0o444 })
    files.push({ path: entry.path, size: bytes.length, digest: sha256(bytes) })
  }
  const verificationSource = Object.hasOwn(snapshot, 'verificationSource')
    ? structuredClone(snapshot.verificationSource)
    : createVerificationSource(snapshot.files, contract)
  const generated = createDerivedExecution({ sourceRoot, verificationSource })
  for (const { path: file, content } of generated.files) {
    const destination = path.join(sourceRoot, file)
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.writeFileSync(destination, content, { flag: 'wx', mode: 0o444 })
    files.push({
      ...generated.executionSource.files.find((entry) => entry.path === file)
    })
  }
  files.sort((a, b) => a.path.localeCompare(b.path))
  const manifestPath = path.join(runDirectory, 'source-manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(files), {
    flag: 'wx',
    mode: 0o444
  })
  const candidate = {
    ...snapshot,
    runtimeSource: createRuntimeSource(files),
    verificationSource,
    executionSource: generated.executionSource,
    sourceRoot,
    files,
    configurationDigest: generated.executionSource.digest,
    digest: sha256(JSON.stringify(files)),
    manifestPath: path.relative(repositoryRoot, manifestPath)
  }
  const result = await runContainedVerification({
    repositoryRoot,
    runDirectory,
    snapshot: candidate,
    contract,
    scenario: 'baseline',
    flowIds: contract.flows.map((flow) => flow.id),
    signal,
    timeoutMs,
    onSpawn
  })
  const assessed = assessSourceEvidence(
    contract,
    candidate,
    result,
    contract.flows.map((flow) => flow.id),
    'baseline',
    undefined,
    { sourceRoot }
  )
  const evidence = assessed.evidence
  let source = assessed.source
  if (
    files.some((entry) => {
      try {
        return (
          sha256(fs.readFileSync(safePath(sourceRoot, entry.path))) !==
          entry.digest
        )
      } catch {
        return true
      }
    })
  ) {
    source = null
    evidence.status = 'unknown'
    evidence.issues.push(
      'Frozen verification source was modified during execution'
    )
  }
  const verdict = {
    evidence,
    sourceDigest: candidate.digest,
    runtimeSource: candidate.runtimeSource,
    verificationSource: candidate.verificationSource,
    executionSource: candidate.executionSource,
    configurationDigest: candidate.configurationDigest,
    baselineDigest: snapshot.digest,
    files,
    runner: { ...result, report: undefined },
    artifactDirectory: path.relative(repositoryRoot, runDirectory),
    containment: 'macos-sandbox-no-fork',
    deliveryStatus: 'not-delivered'
  }
  writeAtomic(path.join(runDirectory, 'verdict.json'), verdict)
  return { verdict, source }
}
async function verifyCandidate(options) {
  return (await produceCandidateProof(options)).verdict
}
module.exports = {
  containmentAvailable,
  containedProcess,
  verifyCandidate,
  produceCandidateProof
}
