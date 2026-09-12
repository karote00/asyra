/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const { runProcess, runVerification } = require('./runner.cjs')
const {
  safePath,
  sha256,
  createRuntimeSource,
  createVerificationSource,
  createDerivedExecution
} = require('./snapshot.cjs')
const { assessEvidence } = require('./evidence.cjs')
const { writeAtomic } = require('./store.cjs')
const containmentAvailable = (platform = process.platform) =>
  platform === 'darwin' && fs.existsSync('/usr/bin/sandbox-exec')
const literal = (value) => JSON.stringify(fs.realpathSync(value))
function containedProcess(options, { repositoryRoot, readRoots, writeRoot }) {
  if (!containmentAvailable())
    throw new Error('OS containment unavailable; candidate execution denied')
  const dependencies = path.join(repositoryRoot, 'node_modules')
  const node = fs.realpathSync(process.execPath)
  const reads = [...readRoots, dependencies, __dirname]
  const probes = []
  for (let parent = repositoryRoot; ; parent = path.dirname(parent)) {
    probes.push(path.join(parent, 'package.json'))
    if (path.dirname(parent) === parent) break
  }
  const profile = `(version 1)
(deny default)
(allow file-read-metadata)
(allow file-read-data (vnode-type DIRECTORY))
(allow file-map-executable)
(allow sysctl-read)
(allow signal (target same-sandbox))
(allow process-exec (literal ${JSON.stringify(node)}))
(allow file-read* (subpath "/System") (subpath "/usr/lib") (subpath "/usr/share") (literal ${JSON.stringify(node)}) (literal "/dev/null") (literal "/dev/urandom") (literal "/dev/random") (literal "/private/etc/hosts") (literal "/private/etc/resolv.conf") ${reads.map((file) => '(subpath ' + literal(file) + ')').join(' ')})
(allow file-read* file-write* (subpath ${literal(writeRoot)}))
${readRoots.map((file) => '(deny file-write* (subpath ' + literal(file) + '))').join('\n')}
(allow file-read-data ${probes.map((file) => '(literal ' + JSON.stringify(file) + ')').join(' ')})
(allow file-write* (literal "/dev/null"))`
  return runProcess({
    ...options,
    executable: '/usr/bin/sandbox-exec',
    args: ['-p', profile, options.executable, ...options.args]
  })
}
async function verifyCandidate({
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
  const { configuration: configFile, bootstrap: bootstrapFile } =
    generated.executionSource.roles
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
  const result = await runVerification({
    repositoryRoot,
    runDirectory,
    snapshot: candidate,
    contract: { ...contract, configFile },
    scenario: 'baseline',
    flowIds: contract.flows.map((flow) => flow.id),
    signal,
    timeoutMs,
    onSpawn,
    processRunner: (options) =>
      containedProcess(
        {
          ...options,
          args: [
            path.join(sourceRoot, bootstrapFile),
            String(process.pid),
            ...options.args.slice(3),
            '--configLoader',
            'native'
          ],
          cwd: sourceRoot
        },
        {
          repositoryRoot,
          readRoots: [sourceRoot],
          writeRoot: runDirectory
        }
      )
  })
  const evidence = assessEvidence(
    contract,
    candidate,
    result,
    contract.flows.map((flow) => flow.id),
    'baseline',
    undefined,
    { sourceRoot }
  )
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
  return verdict
}
module.exports = { containmentAvailable, containedProcess, verifyCandidate }
