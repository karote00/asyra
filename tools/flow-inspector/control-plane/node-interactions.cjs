/* global AbortController */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')
const { loadContract } = require('./contracts.cjs')
const { writeAtomic, validId } = require('./store.cjs')
const { safePath, sha256 } = require('./snapshot.cjs')
const localization = require('./localization.cjs')
const playwright = require('./playwright-results.cjs')
const { runProcess } = require('./runner.cjs')
const escapePattern = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const registeredManifests = new Set([
  ...localization.DEFAULT_MANIFESTS,
  ...['functional', 'status', 'collaboration'].flatMap(
    playwright.sourceManifestPaths
  )
])

function selectedPlaywrightConfig(root, contract, command) {
  const appRoot = path.resolve(root, command.cwd)
  return [
    'import config from ' + JSON.stringify(safePath(root, contract.configFile)),
    "import path from 'node:path'",
    'const base = ' + JSON.stringify(appRoot),
    "export default { ...config, testDir: path.resolve(base, config.testDir || '.'), outputDir: path.join(base, 'test-results'), webServer: (Array.isArray(config.webServer) ? config.webServer : config.webServer ? [config.webServer] : []).map(server => ({ ...server, cwd: base, reuseExistingServer: false })) }"
  ].join('\n')
}

function selectedCommand(root, { item, contract }) {
  const isPlaywright = contract.runner === 'playwright'
  const cwd = isPlaywright ? path.dirname(contract.configFile) : '.'
  const relative = (input) =>
    path.relative(path.resolve(root, cwd), safePath(root, input))
  const args = isPlaywright
    ? [
        'test',
        escapePattern(relative(item.file)),
        '--config',
        relative(contract.configFile),
        '--project',
        item.projectName,
        '--grep',
        '^' +
          escapePattern(
            item.projectName +
              ' ' +
              path.relative('apps/asyra-design/e2e', item.file) +
              ' ' +
              item.testName
          ) +
          '$',
        '--workers=1',
        '--reporter=line,json'
      ]
    : [
        'run',
        safePath(root, item.file),
        '--config',
        contract.configFile,
        '--testNamePattern',
        '^' + escapePattern(item.testName) + '$',
        '--no-file-parallelism',
        '--reporter=json'
      ]
  if (!isPlaywright && item.projectName)
    args.push('--project', item.projectName)
  return { runner: isPlaywright ? 'playwright' : 'vitest', cwd, args }
}

function createNodeInteractions(
  root,
  { directory, observations, requireIdle, ErrorType, execute = runProcess }
) {
  const file = path.join(directory, 'node-interactions.json')
  let active = null
  let closed = false
  const storageErrors = new Map()
  const fail = (status, message) => {
    throw new ErrorType(status, message)
  }
  const read = () => {
    if (!fs.existsSync(file)) return { format: 1, comments: [], actions: [] }
    if (fs.statSync(file).size > 4 * 1024 * 1024)
      fail(503, 'Interaction store exceeds its limit')
    const state = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (
      state.format !== 1 ||
      !Array.isArray(state.comments) ||
      !Array.isArray(state.actions)
    )
      fail(503, 'Interaction store is invalid')
    const validContext = (value) =>
      value &&
      validId(value.id) &&
      validId(value.runId) &&
      typeof value.caseId === 'string' &&
      new RegExp('^' + value.runId + ':[0-9]+$').test(value.caseId) &&
      typeof value.actor === 'string' &&
      value.actor.trim() &&
      value.node &&
      typeof value.node.stepId === 'string' &&
      typeof value.node.targetId === 'string'
    if (
      state.comments.some(
        (value) =>
          !validContext(value) ||
          typeof value.text !== 'string' ||
          !value.text.trim() ||
          value.text.length > 2000 ||
          typeof value.createdAt !== 'string'
      ) ||
      state.actions.some(
        (value) =>
          !validContext(value) ||
          !['running', 'completed', 'failed', 'cancelled'].includes(
            value.status
          ) ||
          (value.runnerPid !== undefined &&
            (!Number.isSafeInteger(value.runnerPid) || value.runnerPid <= 0)) ||
          typeof value.previewDigest !== 'string' ||
          typeof value.startedAt !== 'string'
      ) ||
      new Set(state.comments.map((value) => value.id)).size !==
        state.comments.length ||
      new Set(state.actions.map((value) => value.id)).size !==
        state.actions.length
    )
      fail(503, 'Interaction store is invalid')
    // A prior service cannot still own execution after its exclusive store lock ends.
    return state
  }
  const save = (state) => {
    if (Buffer.byteLength(JSON.stringify(state, null, 2)) > 4 * 1024 * 1024)
      fail(503, 'Interaction store exceeds its limit')
    writeAtomic(file, state)
  }
  const object = (value, keys) => {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      Object.keys(value).some((key) => !keys.includes(key))
    )
      fail(400, 'Invalid node interaction request')
  }
  const selected = (runId, caseId) => {
    if (!validId(runId) || typeof caseId !== 'string')
      fail(400, 'Invalid node context')
    let record
    try {
      record = observations.get(runId)
    } catch {
      fail(404, 'Observation unavailable')
    }
    const item = record.cases.find((item) => item.id === caseId)
    if (!item) fail(404, 'Observed case unavailable')
    if (item.resolution !== 'mapped' || item.locations.length !== 1)
      fail(409, 'Node context is unresolved')
    return { record, item, location: item.locations[0] }
  }
  const resolve = (runId, caseId, supplied) => {
    const selection = supplied ?? selected(runId, caseId)
    const { record, item, location } = selection
    const candidates = record.contracts.filter(
      (contract) =>
        contract.digest === location.contractDigest &&
        registeredManifests.has(contract.manifestPath)
    )
    if (candidates.length !== 1) fail(409, 'Mapping is unavailable')
    const contract = loadContract(root, undefined, candidates[0].manifestPath)
    if (contract.digest !== location.contractDigest)
      fail(409, 'Mapping changed; retain this context as history')
    const cases = contract.cases.filter(
      (candidate) =>
        (candidate.testFile ?? contract.testFile) === item.file &&
        candidate.testName === item.testName &&
        (candidate.projectName ?? '') === item.projectName
    )
    if (cases.length !== 1 || cases[0].id !== location.caseId)
      fail(409, 'Exact test mapping is unavailable')
    return { ...selection, contract }
  }
  const commandFor = (selection) => selectedCommand(root, selection)

  const preview = (request) => {
    object(request, ['runId', 'caseId'])
    if (closed) fail(409, 'Service is closing')
    const selection = resolve(request.runId, request.caseId)
    const manifests =
      selection.contract.runner === 'playwright'
        ? playwright.sourceManifestPaths(
            ['functional', 'status', 'collaboration'].find((source) =>
              playwright
                .sourceManifestPaths(source)
                .includes(selection.contract.manifestPath)
            )
          )
        : [selection.contract.manifestPath]
    const source = localization.sourceFingerprint(
      root,
      manifests.map((manifest) => loadContract(root, undefined, manifest))
    )
    const value = {
      runId: request.runId,
      caseId: request.caseId,
      sourceDigest: source.digest,
      originalSourceDigest: selection.record.source?.digest ?? null,
      contractDigest: selection.contract.digest,
      command: commandFor(selection),
      node: selection.location,
      test: {
        file: selection.item.file,
        name: selection.item.testName,
        project: selection.item.projectName
      }
    }
    return { ...value, previewDigest: sha256(JSON.stringify(value)) }
  }
  const runnerAlive = (pid) => {
    if (!Number.isSafeInteger(pid) || pid <= 0) return false
    for (const identity of [pid, -pid]) {
      try {
        process.kill(identity, 0)
        return true
      } catch (error) {
        if (error.code !== 'ESRCH') return true
      }
    }
    return false
  }
  const hasLiveInterruptedRunner = () =>
    read().actions.some(
      (action) =>
        action.status === 'running' &&
        action.id !== active?.id &&
        runnerAlive(action.runnerPid)
    )
  const actionView = (action) => {
    if (storageErrors.has(action.id))
      return {
        ...action,
        status: 'failed',
        error: storageErrors.get(action.id)
      }
    if (action.status === 'running' && active?.id !== action.id)
      return {
        ...action,
        status: 'interrupted',
        error: runnerAlive(action.runnerPid)
          ? 'Execution owner ended; recorded runner may still be alive and blocks new execution'
          : 'Execution owner ended; rerun requires a new request'
      }
    return action
  }
  const summary = (runId, caseId) => {
    const evidenceUrl = '/api/test-results/' + runId
    const truncatedFields = []
    let remainingBytes = 16000
    const bounded = (value, field, limit = 2000) => {
      let result = value.slice(0, Math.min(limit, remainingBytes))
      while (
        Buffer.byteLength(JSON.stringify(result)) > remainingBytes &&
        result.length
      )
        result = result.slice(0, Math.floor(result.length / 2))
      if (result !== value) truncatedFields.push(field)
      remainingBytes = Math.max(
        0,
        remainingBytes - Buffer.byteLength(JSON.stringify(result))
      )
      return result
    }
    const boundedObject = (value, field, limit = 12000) => {
      const bytes = Buffer.byteLength(JSON.stringify(value))
      if (value === null) return null
      if (bytes <= Math.min(limit, remainingBytes)) {
        remainingBytes -= bytes
        return value
      }
      truncatedFields.push(field)
      return null
    }
    let input,
      node = null,
      reference = 'available',
      selectedCommand = null
    try {
      input = observations.caseContext(runId, caseId)
      const { record, item } = input
      if (item.resolution !== 'mapped' || item.locations.length !== 1)
        throw new Error('Node context is unresolved: ' + item.resolution)
      const resolved = resolve(runId, caseId, {
        record,
        item,
        location: item.locations[0]
      })
      node = resolved.location
      selectedCommand = commandFor(resolved)
    } catch (error) {
      reference = error.message
    }
    const { record, item } = input ?? {}
    const current = observations.list({ caseIdentityOnly: true }).currentCases
    const sameTest = current.filter(
      (candidate) =>
        item &&
        candidate.file === item.file &&
        candidate.testName === item.testName &&
        candidate.projectName === item.projectName
    )
    let status = 'unavailable'
    if (item)
      status = sameTest.some((candidate) => candidate.id === caseId)
        ? 'current'
        : 'superseded'
    if (item && !sameTest.length) status = 'historical'
    const errors = item?.failureDetails?.length
      ? item.failureDetails
      : (item?.failures ?? []).map((message) => ({ message }))
    if (errors.length > 3) truncatedFields.push('errors')
    const compactNode = boundedObject(node, 'node')
    const compactCommand = boundedObject(
      selectedCommand,
      'rerun.selectedCommand'
    )
    const originalInvocation = boundedObject(
      record?.command ?? null,
      'rerun.originalInvocation',
      4000
    )
    const warnings = observations.warningContext(runId)
    if (warnings.total > warnings.items.length)
      truncatedFields.push('warnings.items')
    const result = {
      format: 1,
      runId,
      caseId,
      reference: bounded(reference, 'reference'),
      evidenceUrl,
      warnings: boundedObject(warnings, 'warnings', 2000),
      observedAt: record?.startedAt ?? null,
      observedSource: record
        ? { head: record.head, digest: record.source.digest }
        : null,
      currentness: {
        status,
        meaning:
          'Latest observed test result, not current working-tree verification',
        latest: sameTest.slice(0, 10).map((value) => ({
          runId: value.runId,
          caseId: value.id,
          status: value.status,
          resolution: value.resolution,
          contextUrl: value.contextUrl
        }))
      },
      test: item
        ? {
            file: bounded(item.file, 'test.file'),
            name: bounded(item.testName, 'test.name'),
            project: bounded(item.projectName, 'test.project'),
            status: item.status,
            resolution: item.resolution,
            assertionLocation: boundedObject(
              item.assertionLocation ?? null,
              'test.assertionLocation'
            )
          }
        : null,
      errors: errors
        .slice(0, 3)
        .map((error, index) =>
          Object.fromEntries(
            localization.FAILURE_DETAIL_FIELDS.filter(
              (key) => typeof error[key] === 'string'
            ).map((key) => [
              key,
              bounded(error[key], 'errors.' + index + '.' + key)
            ])
          )
        ),
      node: compactNode,
      rerun: {
        originalInvocation,
        originalInvocationExecutable: false,
        selectedCommand: compactCommand,
        previewAvailable: selectedCommand !== null,
        confirmationRequired: true,
        previewUrl: '/api/node-reruns/preview',
        previewRequest: { runId, caseId },
        reason: selectedCommand
          ? 'Permission, fresh source-bound preview and confirmation are required before execution'
          : bounded(reference, 'rerun.reason')
      },
      truncatedFields
    }
    if (sameTest.length > 10) truncatedFields.push('currentness.latest')
    return result
  }
  const context = (runId, caseId, compact = false) => {
    if (
      !validId(runId) ||
      typeof caseId !== 'string' ||
      !new RegExp('^' + runId + ':[0-9]+$').test(caseId)
    )
      fail(400, 'Invalid node context')
    if (compact) return summary(runId, caseId)
    const state = read()
    let reference = 'available',
      node = null
    try {
      node = resolve(runId, caseId).location
    } catch (error) {
      reference = error.message
    }
    return {
      runId,
      caseId,
      reference,
      node,
      evidenceUrl: '/api/test-results/' + runId,
      comments: state.comments.filter(
        (comment) => comment.runId === runId && comment.caseId === caseId
      ),
      actions: state.actions
        .filter((action) => action.runId === runId && action.caseId === caseId)
        .map(actionView)
    }
  }
  const comment = (request, actor) => {
    object(request, ['requestId', 'runId', 'caseId', 'text'])
    if (closed) fail(409, 'Service is closing')
    if (
      !validId(request.requestId) ||
      typeof request.text !== 'string' ||
      !request.text.trim() ||
      request.text.length > 2000
    )
      fail(400, 'Comment must contain 1-2000 characters and a request UUID')
    const state = read()
    const prior = state.comments.find((item) => item.id === request.requestId)
    if (prior) {
      if (
        prior.actor !== actor ||
        prior.text !== request.text ||
        prior.runId !== request.runId ||
        prior.caseId !== request.caseId
      )
        fail(409, 'Conflicting comment request')
      return prior
    }
    const { record, location } = selected(request.runId, request.caseId)
    const value = {
      id: request.requestId,
      runId: request.runId,
      caseId: request.caseId,
      text: request.text,
      actor,
      createdAt: new Date().toISOString(),
      node: location,
      sourceDigest: record.source?.digest ?? null
    }
    state.comments.push(value)
    save(state)
    return value
  }
  const start = (request, actor) => {
    request = structuredClone(request)
    object(request, ['requestId', 'runId', 'caseId', 'previewDigest'])
    if (
      !validId(request.requestId) ||
      typeof request.previewDigest !== 'string'
    )
      fail(400, 'Invalid rerun confirmation')
    if (closed) fail(409, 'Service is closing')
    const state = read()
    const prior = state.actions.find((item) => item.id === request.requestId)
    if (prior) {
      if (
        prior.actor !== actor ||
        prior.runId !== request.runId ||
        prior.caseId !== request.caseId ||
        prior.previewDigest !== request.previewDigest
      )
        fail(409, 'Conflicting rerun request')
      return actionView(prior)
    }
    requireIdle()
    const current = preview({ runId: request.runId, caseId: request.caseId })
    if (current.previewDigest !== request.previewDigest)
      fail(409, 'Rerun preview is stale; preview again')
    const value = {
      ...current,
      id: request.requestId,
      actor,
      status: 'running',
      startedAt: new Date().toISOString()
    }
    state.actions.push(value)
    save(state)
    const controller = new AbortController()
    active = { id: value.id, controller, promise: null }
    active.promise = Promise.resolve().then(async () => {
      let result
      try {
        const { contract, location } = resolve(request.runId, request.caseId)
        const output = safePath(
          root,
          path.relative(root, path.join(directory, 'node-reruns', value.id))
        )
        fs.mkdirSync(output, { recursive: true })
        const report = path.join(output, 'report.json')
        const command = current.command
        const isPlaywright = command.runner === 'playwright'
        const env = {
          PATH: process.env.PATH ?? '',
          LANG: 'C.UTF-8',
          TMPDIR: output,
          FLOW_LOCALIZATION_ROOT: root,
          FLOW_PROOF_SOURCE: root,
          FLOW_PROOF_SCENARIO: 'baseline'
        }
        const runtimeRequire = createRequire(path.join(root, 'package.json'))
        const cli = isPlaywright
          ? runtimeRequire.resolve('@playwright/test/cli')
          : runtimeRequire.resolve('vitest/vitest.mjs')
        const args = [cli, ...command.args]
        let executionConfig
        if (isPlaywright) {
          const configPath = path.join(output, 'selected.config.ts')
          fs.writeFileSync(
            configPath,
            selectedPlaywrightConfig(root, contract, command)
          )
          executionConfig = {
            path: path.relative(root, configPath),
            digest: sha256(fs.readFileSync(configPath)),
            originalConfigFile: contract.configFile
          }
          args[args.indexOf('--config') + 1] = configPath
          env.PLAYWRIGHT_JSON_OUTPUT_NAME = report
          env.E2E_SKIP_PERFORMANCE = 'true'
          env.E2E_OWN_SERVERS = '1'
        } else {
          const configPath = path.join(output, 'selected.config.ts')
          const selectedFile = safePath(root, current.test.file)
          const exactGlob = selectedFile.replace(
            /[?*{}[\]]/g,
            (character) => '[' + character + ']'
          )
          fs.writeFileSync(
            configPath,
            [
              'import original from ' +
                JSON.stringify(safePath(root, contract.configFile)),
              'export default async (environment) => {',
              'const config = await (typeof original === "function" ? original(environment) : original)',
              'return { ...config, test: { ...config.test, include: ' +
                JSON.stringify([exactGlob]) +
                ' } }',
              '}'
            ].join('\n')
          )
          args[args.indexOf('--config') + 1] = configPath
          args.push('--outputFile', report)
        }
        const source = ['functional', 'status', 'collaboration'].find(
          (source) =>
            playwright
              .sourceManifestPaths(source)
              .includes(contract.manifestPath)
        )
        const commandRecord = {
          cwd: command.cwd,
          argv: [process.execPath, ...args]
        }
        const observationRequest = {
          version: 1,
          manifestPath: contract.manifestPath,
          caseIds: [location.caseId],
          predecessorId: request.runId,
          reason: 'Explicit selected-case rerun'
        }
        const observation = isPlaywright
          ? playwright.begin(
              root,
              path.relative(root, report),
              env,
              commandRecord,
              source,
              executionConfig,
              observationRequest
            )
          : localization.beginObservation(root, {
              manifestPaths: [contract.manifestPath],
              command: commandRecord,
              request: observationRequest
            })
        if (observation.source?.digest !== current.sourceDigest) {
          localization.completeObservation(root, observation, null, {
            errors: ['Confirmed source changed before runner handoff']
          })
          throw new Error('Confirmed source changed before runner handoff')
        }
        if (isPlaywright) env.FLOW_OBSERVATION_ID = observation.id
        let processResult
        try {
          processResult = await execute({
            executable: process.execPath,
            args,
            cwd: path.resolve(root, command.cwd),
            env,
            signal: controller.signal,
            timeoutMs: isPlaywright ? 180000 : 60000,
            maxOutputBytes: 262144,
            onSpawn(pid) {
              try {
                const latest = read()
                latest.actions.find((item) => item.id === value.id).runnerPid =
                  pid
                save(latest)
              } catch (error) {
                storageErrors.set(
                  value.id,
                  'Unable to retain runner identity: ' + error.message
                )
                controller.abort()
              }
            }
          })
        } catch (error) {
          processResult = { code: null, reason: error.message, output: '' }
        }
        let retained
        if (isPlaywright)
          retained = playwright.complete(root, path.relative(root, report))
        else {
          let parsed = null
          const errors = []
          try {
            if (fs.statSync(report).size > 4 * 1024 * 1024)
              throw new Error('Report exceeds 4 MiB')
            parsed = JSON.parse(fs.readFileSync(report, 'utf8'))
          } catch (error) {
            errors.push('Rerun report unavailable: ' + error.message)
          }
          if (processResult.reason) errors.push(processResult.reason)
          retained = localization.completeObservation(
            root,
            observation,
            parsed,
            {
              errors,
              projects: (parsed?.testResults ?? []).map(
                () => current.test.project
              )
            }
          )
        }
        const executed = retained.cases.filter(
          (item) =>
            item.file === current.test.file &&
            item.testName === current.test.name &&
            item.projectName === current.test.project
        )
        result = {
          status:
            processResult.reason === 'cancelled' ? 'cancelled' : 'completed',
          resultRunId: retained.id,
          process: processResult,
          observedStatus:
            executed.length === 1 ? executed[0].status : 'unavailable',
          resolution:
            executed.length === 1 ? executed[0].resolution : 'unavailable',
          issues: retained.issues
        }
      } catch (error) {
        result = { status: 'failed', error: error.message }
      }
      try {
        const latest = read()
        Object.assign(
          latest.actions.find((item) => item.id === value.id),
          result,
          { finishedAt: new Date().toISOString() }
        )
        save(latest)
      } catch (error) {
        storageErrors.set(
          value.id,
          'Unable to retain action result: ' + error.message
        )
      } finally {
        active = null
      }
    })
    return structuredClone(value)
  }
  return {
    context,
    preview,
    comment,
    start,
    isActive: () => Boolean(active) || hasLiveInterruptedRunner(),
    async cancel(id) {
      if (!validId(id) || active?.id !== id) fail(409, 'Rerun is not active')
      active.controller.abort()
      await active.promise
      return actionView(read().actions.find((item) => item.id === id))
    },
    async close() {
      closed = true
      if (active) {
        active.controller.abort()
        await active.promise
      }
    }
  }
}
module.exports = {
  createNodeInteractions,
  selectedCommand,
  selectedPlaywrightConfig
}
