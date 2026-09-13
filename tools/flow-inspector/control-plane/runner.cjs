/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { createRequire } = require('node:module')
const { createHash } = require('node:crypto')
const { setInterval, clearInterval } = require('node:timers')

function runProcess({
  executable,
  args,
  cwd,
  env,
  signal,
  timeoutMs = 30000,
  maxOutputBytes = 262144,
  onSpawn
}) {
  if (signal?.aborted)
    return Promise.resolve({
      code: null,
      reason: 'cancelled',
      output: '',
      pid: null
    })
  if (process.platform === 'win32')
    throw new Error(
      'The core proof runner requires macOS or Linux process groups'
    )
  return new Promise((resolve) => {
    let reason = null
    let output = ''
    let outputBytes = 0
    let forceTimer
    let spawnError
    const child = spawn(executable, args, {
      cwd,
      env,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    })
    const kill = (signalName) => {
      if (!child.pid) return
      try {
        process.kill(-child.pid, signalName)
      } catch (error) {
        if (error.code !== 'ESRCH') spawnError = error.message
      }
    }
    const stop = (why) => {
      if (reason) return
      reason = why
      kill('SIGTERM')
      forceTimer = setTimeout(() => kill('SIGKILL'), 250)
    }
    const cancel = () => stop('cancelled')
    const timer = setTimeout(() => stop('timeout'), timeoutMs)
    signal?.addEventListener('abort', cancel, { once: true })
    child.once('spawn', () => {
      onSpawn?.(child.pid)
      if (signal?.aborted) cancel()
    })
    child.once('error', (error) => {
      spawnError = error.message
    })
    const collect = (bytes) => {
      const remaining = Math.max(0, maxOutputBytes - outputBytes)
      output += bytes.subarray(0, remaining).toString()
      outputBytes += bytes.length
      if (outputBytes > maxOutputBytes) stop('output-limit')
    }
    child.stdout.on('data', collect)
    child.stderr.on('data', collect)
    child.once('close', (code, exitSignal) => {
      clearTimeout(timer)
      clearTimeout(forceTimer)
      signal?.removeEventListener('abort', cancel)
      // Also settle descendants that outlived a successful leader.
      kill('SIGKILL')
      if (!reason && spawnError) reason = 'spawn-error'
      if (!reason && exitSignal) reason = 'signal'
      resolve({
        code,
        reason,
        error: spawnError,
        exitSignal,
        output,
        pid: child.pid ?? null
      })
    })
  })
}

function runnerEnvironment(sourceRoot, scenario, temporaryDirectory) {
  return {
    PATH: process.env.PATH ?? '',
    LANG: 'C.UTF-8',
    CI: 'true',
    TMPDIR: temporaryDirectory,
    FLOW_PROOF_SOURCE: sourceRoot,
    FLOW_PROOF_SCENARIO: scenario
  }
}

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
async function runContainedVerification(options) {
  const keys = [
    'repositoryRoot',
    'runDirectory',
    'snapshot',
    'contract',
    'scenario',
    'flowIds',
    'signal',
    'timeoutMs',
    'onSpawn'
  ]
  if (
    !options ||
    typeof options !== 'object' ||
    Array.isArray(options) ||
    Object.keys(options).some((key) => !keys.includes(key))
  )
    throw new Error('Invalid contained execution option override')
  const { repositoryRoot, runDirectory, snapshot, contract } = options
  const canonical = (value) =>
    typeof value === 'string' &&
    path.isAbsolute(value) &&
    value === path.resolve(value) &&
    value === fs.realpathSync(value)
  try {
    if (
      !canonical(repositoryRoot) ||
      !canonical(runDirectory) ||
      !canonical(snapshot?.sourceRoot) ||
      runDirectory === repositoryRoot ||
      path
        .relative(repositoryRoot, runDirectory)
        .split(path.sep)
        .includes('..') ||
      snapshot.sourceRoot !== path.join(runDirectory, 'source')
    )
      throw new Error('Invalid location')
  } catch {
    throw new Error('Invalid contained execution location')
  }
  const execution = snapshot.executionSource
  if (
    !Object.hasOwn(snapshot, 'executionSource') ||
    !execution ||
    typeof execution !== 'object' ||
    Array.isArray(execution) ||
    execution.format !== 1 ||
    execution.policy !== 'contained-native-typescript-v1' ||
    execution.roles?.configuration !==
      'tools/flow-inspector/control-plane/candidate-config.mjs' ||
    execution.roles?.bootstrap !==
      'tools/flow-inspector/control-plane/candidate-bootstrap.cjs' ||
    !/^[a-f0-9]{64}$/.test(execution.digest ?? '') ||
    snapshot.configurationDigest !== execution.digest ||
    !snapshot.verificationSource ||
    !/^[a-f0-9]{64}$/.test(execution.verificationSourceDigest ?? '') ||
    execution.verificationSourceDigest !== snapshot.verificationSource.digest
  )
    throw new Error('Invalid contained execution closure')
  if (!containmentAvailable())
    throw new Error('OS containment unavailable; derived execution denied')
  return runVerification({
    ...options,
    contract: { ...contract, configFile: execution.roles.configuration },
    processRunner: (processOptions) =>
      containedProcess(
        {
          ...processOptions,
          args: [
            path.join(snapshot.sourceRoot, execution.roles.bootstrap),
            String(process.pid),
            ...processOptions.args.slice(3),
            '--configLoader',
            'native'
          ],
          cwd: snapshot.sourceRoot
        },
        {
          repositoryRoot,
          readRoots: [snapshot.sourceRoot],
          writeRoot: runDirectory
        }
      )
  })
}

async function runVerification({
  repositoryRoot,
  runDirectory,
  snapshot,
  contract,
  scenario,
  flowIds,
  signal,
  timeoutMs,
  onSpawn,
  processRunner = runProcess
}) {
  if (!contract.scenarios.some((item) => item.id === scenario))
    throw new Error('Unknown proof scenario')
  const requireFromRepository = createRequire(
    path.join(repositoryRoot, 'package.json')
  )
  const runnerPackage = requireFromRepository.resolve('vitest/package.json')
  const version = JSON.parse(fs.readFileSync(runnerPackage, 'utf8')).version
  const reportPath = path.join(runDirectory, 'vitest.json')
  const temporaryDirectory = path.join(runDirectory, 'tmp')
  fs.mkdirSync(temporaryDirectory, { recursive: true })
  const names = contract.cases
    .filter((item) => flowIds.includes(item.flowId))
    .map((item) => item.testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const result = await processRunner({
    executable: process.execPath,
    args: [
      __filename,
      'child',
      String(process.pid),
      path.join(path.dirname(runnerPackage), 'vitest.mjs'),
      'run',
      '--config',
      path.join(snapshot.sourceRoot, contract.configFile),
      '--reporter=json',
      '--outputFile=' + reportPath,
      '--testNamePattern=^(' + names.join('|') + ')$'
    ],
    cwd: repositoryRoot,
    env: runnerEnvironment(snapshot.sourceRoot, scenario, temporaryDirectory),
    signal,
    timeoutMs,
    onSpawn
  })
  let report = null
  let reportError = null
  let reportDigest = null
  try {
    if (fs.statSync(reportPath).size > 2097152)
      throw new Error('Runner report exceeds size limit')
    const bytes = fs.readFileSync(reportPath)
    reportDigest = createHash('sha256').update(bytes).digest('hex')
    report = JSON.parse(bytes.toString())
  } catch (error) {
    reportError = error.message
  }
  return {
    ...result,
    version,
    report,
    reportError,
    reportPath,
    reportDigest,
    environment: {
      node: process.version,
      platform: process.platform,
      architecture: process.arch,
      vitest: version
    },
    identity: {
      sourceDigest: snapshot.digest,
      ...(snapshot.runtimeSource
        ? { runtimeSourceDigest: snapshot.runtimeSource.digest }
        : {}),
      lockfileDigest: snapshot.lockfileDigest,
      contractDigest: contract.digest,
      mappingVersion: contract.mappingVersion,
      architectureVersion: contract.architectureVersion,
      configurationDigest: snapshot.configurationDigest,
      scenario,
      flowIds: [...flowIds]
    }
  }
}

module.exports = {
  runProcess,
  runVerification,
  runContainedVerification,
  containedProcess,
  containmentAvailable,
  runnerEnvironment
}

// The group leader also watches its owner: an abrupt server death must not
// leave a detached test tree running after the owner's deadline disappears.
if (require.main === module) {
  const [, , mode, owner, ...args] = process.argv
  if (mode !== 'child' || !/^\d+$/.test(owner ?? '') || !args.length)
    process.exit(2)
  const guard = setInterval(() => {
    if (process.ppid !== Number(owner)) process.kill(-process.pid, 'SIGKILL')
  }, 100)
  const child = spawn(process.execPath, args, { stdio: 'inherit' })
  child.once('error', () => {
    clearInterval(guard)
    process.exit(2)
  })
  child.once('close', (code, signal) => {
    clearInterval(guard)
    if (signal) process.kill(process.pid, signal)
    else process.exit(code ?? 2)
  })
}
