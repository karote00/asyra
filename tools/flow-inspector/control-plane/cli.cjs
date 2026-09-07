/* global fetch, AbortSignal */
/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path')
const { URL } = require('node:url')
const { createService, LOCAL_ACTOR } = require('./service.cjs')
const { startServer, parseLocalUrl } = require('./server.cjs')
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

async function connect(repositoryRoot, origin) {
  if (!origin) {
    const service = createService(repositoryRoot)
    return {
      state: async () => service.state(),
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
    state: () => request('/api/state'),
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
    serve: [0],
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
      'Usage: cli.cjs [--url loopback-origin] serve | verify [flow-id] | negative [flow-id] | scenario scenario-id [flow-id] | prove | status | show attempt-id | cancel attempt-id | mapping-diff | mapping-accept review-id reason | mapping-reject review-id reason'
    )
  if (command === 'serve') {
    const server = await startServer(repositoryRoot)
    write('Flow Inspector Phase 3: ' + server.origin)
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
    if (command === 'status') {
      const state = await client.state()
      write(
        JSON.stringify(
          {
            activeRunId: state.activeRunId,
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
