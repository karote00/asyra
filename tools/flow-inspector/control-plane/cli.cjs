/* global fetch, AbortSignal */
/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path')
const fs = require('node:fs')
const { gzipSync } = require('node:zlib')
const { safePath } = require('./snapshot.cjs')
const { URL } = require('node:url')
const { createService, LOCAL_ACTOR } = require('./service.cjs')
const { startServer, parseLocalUrl } = require('./server.cjs')
const { createGitHubDelivery } = require('./github-delivery.cjs')
const { createProviderTransport } = require('./agent-transport.cjs')
const defaultRoot = path.resolve(__dirname, '../../..')

function describe(record, write) {
  const evidence = record.evidence
  write(
    record.id + ' - ' + record.phase + ' - ' + (evidence?.status ?? 'unknown')
  )
  if (record.snapshot) {
    write(
      'Captured source: ' +
        record.snapshot.digest +
        ' (HEAD ' +
        record.snapshot.head +
        ')'
    )
    write(
      'Mapping: ' +
        record.snapshot.mappingVersion +
        ' - revision ' +
        record.mappingRevision
    )
  }
  for (const flow of evidence?.flows ?? []) write(flow.id + ': ' + flow.status)
  for (const item of evidence?.cases.filter(
    (item) => item.status !== 'passed'
  ) ?? [])
    write(item.id + ' - ' + item.stepId + ' - ' + item.status)
  for (const issue of evidence?.issues ?? []) write(issue)
  if (record.error) write(record.error)
  write(
    'Artifacts: ' +
      (record.artifactDirectory ?? 'tmp/flow-inspector/runs/' + record.id)
  )
}

function serviceOptions(repositoryRoot) {
  const options = { acceptedBase: process.env.FLOW_CI_BASE ?? 'origin/main' }
  if (process.env.FLOW_REVIEW_REPOSITORY)
    options.deliveryAdapter = createGitHubDelivery(repositoryRoot, {
      repository: process.env.FLOW_REVIEW_REPOSITORY,
      base: process.env.FLOW_REVIEW_BASE ?? 'main'
    })
  if (process.env.FLOW_AGENT_AUTHORIZATION) {
    const authorization = JSON.parse(
      fs.readFileSync(
        safePath(repositoryRoot, process.env.FLOW_AGENT_AUTHORIZATION),
        'utf8'
      )
    )
    if (
      !process.env.FLOW_AGENT_EXECUTABLE ||
      !process.env.FLOW_AGENT_CREDENTIAL_FILE
    )
      throw new Error(
        'Explicit provider executable and read-only credential reference required'
      )
    options.agentOptions = {
      providerAuthorization: authorization,
      providerComplete: createProviderTransport({
        repositoryRoot,
        directory: path.join(
          repositoryRoot,
          'tmp/flow-inspector/provider-runtime'
        ),
        executable: process.env.FLOW_AGENT_EXECUTABLE,
        credentialFile: process.env.FLOW_AGENT_CREDENTIAL_FILE
      })
    }
  }
  if (process.env.FLOW_CI_ADMISSION)
    options.ciAdmission = JSON.parse(
      fs.readFileSync(
        safePath(repositoryRoot, process.env.FLOW_CI_ADMISSION),
        'utf8'
      )
    )
  return options
}
async function connect(repositoryRoot, origin) {
  if (!origin) {
    const service = createService(
      repositoryRoot,
      serviceOptions(repositoryRoot)
    )
    return {
      targets: async () => service.targets(),
      getTarget: async (id) => service.getTarget(id),
      decideTarget: async (body) => service.decideTarget(body, LOCAL_ACTOR),
      getReview: async (id) => service.getReview(id),
      reviewTask: (id, body) => service.reviewTask(id, body, LOCAL_ACTOR),
      startTask: async (body) => service.startTask(body, LOCAL_ACTOR),
      getTask: async (id) => service.getTask(id),
      taskChanges: async (id) => service.taskChanges(id),
      controlTask: (id, body) => service.controlTask(id, body, LOCAL_ACTOR),
      waitTask: (id) => service.waitTask(id),
      state: async () => service.state(),
      shared: async () => service.shared(),
      work: async (request) => service.setWork(request, LOCAL_ACTOR),
      artifact: async (id, name) => service.readArtifact(id, name),
      prepareContract: async (request) =>
        service.prepareEvolution(request, LOCAL_ACTOR),
      decideContract: async (request) =>
        service.decideEvolution(request, LOCAL_ACTOR),
      ingest: async (envelope) => service.ingestCI({ envelope }, LOCAL_ACTOR),
      get: async (id) => service.get(id),
      start: async (request) => service.start(request, LOCAL_ACTOR),
      wait: (id) => service.wait(id),
      cancel: (id) => service.cancel(id, LOCAL_ACTOR),
      prepare: async () => service.prepareMapping({}, LOCAL_ACTOR),
      decide: async (request) => service.decideMapping(request, LOCAL_ACTOR),
      close: () => service.close()
    }
  }
  parseLocalUrl(origin)
  let capability
  const request = async (route, body) => {
    const options = { signal: AbortSignal.timeout(10000) }
    if (body !== undefined) {
      options.method = 'POST'
      options.headers = {
        'content-type': 'application/json',
        'x-proof-capability': capability
      }
      options.body = JSON.stringify(body)
    }
    const response = await fetch(new URL(route, origin), options)
    const value = await response.json()
    if (!response.ok)
      throw new Error(value.error ?? 'Proof service request failed')
    return value
  }
  capability = (await request('/api/session')).capability
  const get = (id) => request('/api/runs/' + encodeURIComponent(id))
  return {
    targets: () => request('/api/targets'),
    getTarget: (id) => request('/api/targets/' + encodeURIComponent(id)),
    decideTarget: (body) => request('/api/targets/decide', body),
    getReview: (id) =>
      request('/api/tasks/' + encodeURIComponent(id) + '/review'),
    reviewTask: (id, body) =>
      request('/api/tasks/' + encodeURIComponent(id) + '/review', body),
    startTask: async (body) => (await request('/api/tasks', body)).id,
    getTask: (id) => request('/api/tasks/' + encodeURIComponent(id)),
    taskChanges: (id) =>
      request('/api/tasks/' + encodeURIComponent(id) + '/changes'),
    controlTask: (id, body) =>
      request('/api/tasks/' + encodeURIComponent(id) + '/control', body),
    async waitTask(id) {
      for (;;) {
        const record = await request('/api/tasks/' + encodeURIComponent(id))
        if (record.phase !== 'running') return record
        await new Promise((resolve) => setTimeout(resolve, 250))
      }
    },
    state: () => request('/api/state'),
    shared: () => request('/api/shared'),
    work: (body) => request('/api/work', body),
    artifact: async (id, name) =>
      Buffer.from(
        JSON.stringify(await request('/api/runs/' + id + '/artifacts/' + name))
      ),
    prepareContract: (body) => request('/api/contracts/prepare', body),
    decideContract: (body) => request('/api/contracts/decide', body),
    ingest: (envelope) => request('/api/ci/ingest', { envelope }),
    get,
    start: async (body) => (await request('/api/runs', body)).id,
    async wait(id) {
      const deadline = Date.now() + 45000
      while (Date.now() < deadline) {
        const record = await get(id)
        if (record.phase !== 'running') return record
        await new Promise((resolve) => setTimeout(resolve, 250))
      }
      throw new Error(
        'Stopped waiting for the bounded runner; inspect its retained attempt'
      )
    },
    cancel: (id) =>
      request('/api/runs/' + encodeURIComponent(id) + '/cancel', {}),
    prepare: () => request('/api/mapping/prepare', {}),
    decide: (body) => request('/api/mapping/decide', body),
    close: () => Promise.resolve()
  }
}

async function main(
  args = process.argv.slice(2),
  { repositoryRoot = defaultRoot, write = console.log } = {}
) {
  args = args.slice()
  let origin
  if (args[0] === '--url') {
    origin = args[1]
    args = args.slice(2)
    parseLocalUrl(origin)
  }
  const [command, ...parameters] = args
  const arity = {
    'pr-prepare': [1],
    'pr-show': [1],
    'pr-confirm': [3],
    'pr-refresh': [1],
    'task-start': [1],
    'task-show': [1],
    'task-changes': [1],
    'task-wait': [1],
    'task-cancel': [1],
    'task-stop': [1],
    'task-handoff': [1],
    'task-revoke': [1],
    'task-resume': [2],
    targets: [0],
    'target-show': [1],
    'target-decide': [1],
    serve: [0],
    candidate: [0],
    ci: [0],
    'ci-trial': [0],
    'ci-demo': [0, 1],
    shared: [0],
    work: [3],
    'ci-ingest': [1],
    'contract-diff': [1, 2],
    'contract-accept': [2, 3],
    'contract-reject': [2],
    verify: [0, 1],
    negative: [0, 1],
    scenario: [1, 2],
    prove: [0],
    status: [0],
    show: [1],
    cancel: [1],
    'mapping-diff': [0],
    'mapping-accept': [2],
    'mapping-reject': [2]
  }
  if (
    !Object.hasOwn(arity, command) ||
    !arity[command].includes(parameters.length) ||
    (command === 'serve' && origin)
  )
    throw new Error(
      'Usage: cli.cjs [--url loopback-origin] serve | targets | target-show target-id | target-decide request.json | verify [flow-id] | negative [flow-id] | scenario scenario-id [flow-id] | prove | status | show attempt-id | cancel attempt-id | mapping-diff | mapping-accept review-id reason | mapping-reject review-id reason | candidate | ci | ci-trial | ci-demo [scenario-id] | pr-prepare task-id | pr-show task-id | pr-confirm task-id preview-digest confirm | pr-refresh task-id | task-start request.json | task-show task-id | task-changes task-id | task-wait task-id | task-cancel task-id | task-stop task-id | task-handoff task-id | task-revoke task-id | task-resume task-id scenario | shared | ci-ingest envelope.json | contract-diff attempt-id [relations.json] | contract-accept review-id reason [retirement.json] | contract-reject review-id reason'
    )
  if (command === 'serve') {
    const server = await startServer(repositoryRoot, {
      serviceOptions: serviceOptions(repositoryRoot)
    })
    write('Flow Inspector: ' + server.origin)
    write('Local trusted workspace - Ctrl+C stops and settles active work.')
    let stopping = false
    const stop = async () => {
      if (stopping) return
      stopping = true
      await server.close()
    }
    for (const signal of ['SIGINT', 'SIGTERM'])
      process.once(signal, () =>
        stop().catch((error) => {
          console.error(error.message)
          process.exitCode = 1
        })
      )
    return 0
  }
  const client = await connect(repositoryRoot, origin)
  try {
    const inputFile = (filename) => {
      const file = safePath(repositoryRoot, filename)
      if (fs.statSync(file).size > 2097152)
        throw new Error('Input artifact exceeds size limit')
      return JSON.parse(fs.readFileSync(file, 'utf8'))
    }
    if (['targets', 'target-show', 'target-decide'].includes(command)) {
      let value
      if (command === 'targets') value = await client.targets()
      if (command === 'target-show')
        value = await client.getTarget(parameters[0])
      if (command === 'target-decide')
        value = await client.decideTarget(inputFile(parameters[0]))
      write(JSON.stringify(value, null, 2))
      return 0
    }
    if (command.startsWith('pr-')) {
      let value
      if (command === 'pr-show') value = await client.getReview(parameters[0])
      else {
        const action = command.slice(3)
        if (action === 'confirm' && parameters[2] !== 'confirm')
          throw new Error(
            'Explicit confirm literal required after preview digest'
          )
        value = await client.reviewTask(parameters[0], {
          action,
          ...(action === 'confirm'
            ? { previewDigest: parameters[1], confirm: true }
            : {})
        })
      }
      write(JSON.stringify(value, null, 2))
      return ['blocked', 'uncertain'].includes(value?.state) ? 1 : 0
    }
    if (command.startsWith('task-')) {
      let value
      if (command === 'task-start') {
        const id = await client.startTask(inputFile(parameters[0]))
        value = { id }
        // A detached task needs a live service owner. Direct CLI waits before closing.
        if (!origin) value = await client.waitTask(id)
      } else if (command === 'task-show')
        value = await client.getTask(parameters[0])
      else if (command === 'task-changes')
        value = await client.taskChanges(parameters[0])
      else if (command === 'task-wait')
        value = await client.waitTask(parameters[0])
      else {
        value = await client.controlTask(parameters[0], {
          action: command.slice(5),
          ...(command === 'task-resume' ? { scenario: parameters[1] } : {})
        })
        if (!origin && command === 'task-resume')
          value = await client.waitTask(parameters[0])
      }
      write(JSON.stringify(value, null, 2))
      if (
        command === 'task-wait' ||
        (!origin && ['task-start', 'task-resume'].includes(command))
      )
        return value.verificationStatus === 'passed' ? 0 : 1
      return 0
    }
    if (command === 'work') {
      write(
        JSON.stringify(
          await client.work({
            stepId: parameters[0],
            status: parameters[1],
            reason: parameters[2]
          }),
          null,
          2
        )
      )
      return 0
    }
    if (command === 'shared') {
      write(JSON.stringify(await client.shared(), null, 2))
      return 0
    }
    if (command === 'ci-ingest') {
      const result = await client.ingest(inputFile(parameters[0]))
      write(JSON.stringify(result, null, 2))
      return result.result.deliveryStatus === 'eligible' ? 0 : 1
    }
    if (command === 'contract-diff') {
      write(
        JSON.stringify(
          await client.prepareContract({
            attemptId: parameters[0],
            relations: parameters[1] ? inputFile(parameters[1]) : []
          }),
          null,
          2
        )
      )
      return 0
    }
    if (command === 'contract-accept' || command === 'contract-reject') {
      write(
        JSON.stringify(
          await client.decideContract({
            id: parameters[0],
            decision: command === 'contract-accept' ? 'accept' : 'reject',
            reason: parameters[1],
            retirement: parameters[2] ? inputFile(parameters[2]) : []
          }),
          null,
          2
        )
      )
      return 0
    }
    if (['candidate', 'ci', 'ci-trial', 'ci-demo'].includes(command)) {
      const record = await client.wait(
        await client.start({
          mode: command === 'ci-trial' ? 'ci' : command,
          ...(command === 'ci-demo'
            ? {
                scenario:
                  parameters[0] ??
                  (await client.state()).contract.defaultNegativeScenario
              }
            : {})
        })
      )
      describe(record, write)
      if (record.ci) write(JSON.stringify(record.ci, null, 2))
      if (command === 'ci-trial') {
        write(
          'CI trial - behavioral proof only, not a required or protected delivery check'
        )
        if (
          process.env.FLOW_CI_EMIT_EVIDENCE === '1' &&
          record.ciEnvelopeDigest
        )
          write(
            'FLOW_CI_ENVELOPE=' +
              gzipSync(
                await client.artifact(record.id, 'ci-envelope')
              ).toString('base64')
          )
        return record.ci?.evidence.status === 'passed' ? 0 : 1
      }
      if (command === 'ci' || command === 'ci-demo')
        return record.ci?.deliveryStatus === 'eligible' ? 0 : 1
      return record.evidence?.status === 'passed' ? 0 : 1
    }
    if (command === 'status') {
      const state = await client.state()
      write(
        JSON.stringify(
          {
            tasks: state.tasks,
            activeRunId: state.activeRunId,
            evolution: state.evolution,
            ci: state.ci,
            shared: state.shared,
            mapping: state.mapping,
            runs: state.runs
          },
          null,
          2
        )
      )
      return 0
    }
    if (command === 'show') {
      describe(await client.get(parameters[0]), write)
      return 0
    }
    if (command === 'cancel') {
      await client.cancel(parameters[0])
      return 0
    }
    if (command === 'mapping-diff') {
      write(JSON.stringify(await client.prepare(), null, 2))
      return 0
    }
    if (command === 'mapping-accept' || command === 'mapping-reject') {
      write(
        JSON.stringify(
          await client.decide({
            id: parameters[0],
            decision: command === 'mapping-accept' ? 'accept' : 'reject',
            reason: parameters[1]
          }),
          null,
          2
        )
      )
      return 0
    }
    const contract = (await client.state()).contract
    const run = async (scenario, flowId) => {
      const request = { scenario }
      if (flowId) request.flowIds = [flowId]
      const record = await client.wait(await client.start(request))
      describe(record, write)
      return record
    }
    if (command === 'prove') {
      const started = Date.now()
      const baseline = await run('baseline')
      if (baseline.evidence?.status !== 'passed')
        throw new Error('Baseline proof failed')
      const negatives = contract.scenarios.filter(
        (scenario) => scenario.id !== 'baseline'
      )
      for (const scenario of negatives) {
        const negative = await run(scenario.id)
        const failed = negative.evidence?.cases
          .filter((item) => item.status === 'failed')
          .map((item) => item.id)
          .sort()
        if (
          negative.phase !== 'completed' ||
          negative.runner.code === 0 ||
          negative.evidence.issues.length ||
          JSON.stringify(failed) !==
            JSON.stringify(scenario.expectedFailedCaseIds.slice().sort()) ||
          negative.evidence.passedCount !==
            contract.cases.length - scenario.expectedFailedCaseIds.length ||
          negative.snapshot.digest !== baseline.snapshot.digest
        )
          throw new Error(
            'Negative proof did not produce the exact expected violation: ' +
              scenario.id
          )
      }
      const recovered = await run('baseline')
      if (
        recovered.evidence?.status !== 'passed' ||
        baseline.snapshot.digest !== recovered.snapshot.digest
      )
        throw new Error(
          'Baseline recovery failed or source changed during proof'
        )
      write(
        'Core proof passed - ' +
          contract.flows.length +
          ' flows - ' +
          negatives.length +
          ' negative scenarios - ' +
          contract.cases.length +
          ' obligations - ' +
          (Date.now() - started) +
          ' ms'
      )
      return 0
    }
    let scenario = 'baseline'
    let flowId = parameters[0]
    if (command === 'negative') scenario = contract.defaultNegativeScenario
    if (command === 'scenario') {
      scenario = parameters[0]
      flowId = parameters[1]
    }
    const record = await run(scenario, flowId)
    return record.phase === 'completed' && record.evidence?.status === 'passed'
      ? 0
      : 1
  } finally {
    await client.close()
  }
}
if (require.main === module)
  main()
    .then((code) => {
      process.exitCode = code
    })
    .catch((error) => {
      console.error(error.message)
      process.exitCode = 1
    })
module.exports = { main }
