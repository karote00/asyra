/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path')
const { directory } = require('./fixtures.cjs')
const { loadContract } = require('../../control-plane/contracts.cjs')
const { fromContracts, criterionId } = require('../producers.cjs')
const { createFlowService } = require('../service.cjs')
test(
  'real selected Factory case publishes current evidence through the confirmed action',
  { timeout: 120000 },
  async (t) => {
    const root = path.resolve(__dirname, '../../../..'),
      dir = directory(t),
      contract = loadContract(root),
      doc = fromContracts([contract], 'project')[0]
    fs.writeFileSync(
      path.join(dir, doc.flowId + '.flow.json'),
      JSON.stringify(doc)
    )
    const service = createFlowService(root, dir)
    t.after(() => service.close())
    const candidate = contract.cases[0],
      id = criterionId(contract, candidate)
    const preview = service.preview(doc.flowId, candidate.stepId, id)
    const result = await service.rerun({ ...preview, confirm: true })
    assert.equal(
      result.code,
      0,
      result.output +
        '\n' +
        JSON.stringify({
          errors: result.context.errors.map(
            ({ criterionId, summary, details }) => ({
              criterionId,
              summary,
              diagnosticTail: details.join('\n').slice(-6000)
            })
          ),
          warnings: result.context.warnings.map(({ summary }) => summary)
        })
    )
    assert.equal(result.coverageComplete, true, JSON.stringify(result.context))
    const observations = service.snapshot().documents[0].current.observations
    assert.equal(observations.length, 1)
    assert.equal(observations[0].criterionId, id)
    assert.equal(observations[0].status, 'passed')
    assert.deepEqual(service.snapshot().documents[0].current.warnings, [])
    assert.equal(fs.readdirSync(dir).length, 1)
  }
)

test(
  'current flow selected Playwright execution preserves its exact case and owned service context',
  { timeout: 120000 },
  async (t) => {
    const net = require('node:net'),
      { runProcess } = require('../../control-plane/runner.cjs')
    const freePort = async () => {
      const listener = net.createServer()
      await new Promise((resolve) => listener.listen(0, '127.0.0.1', resolve))
      const port = listener.address().port
      await new Promise((resolve) => listener.close(resolve))
      return port
    }
    const root = path.resolve(__dirname, '../../../..'),
      dir = directory(t),
      contract = loadContract(
        root,
        undefined,
        'apps/asyra-design/playwright-collaboration-flow-contracts.json'
      ),
      doc = fromContracts([contract], 'project')[0]
    fs.writeFileSync(
      path.join(dir, doc.flowId + '.flow.json'),
      JSON.stringify(doc)
    )
    const [app, backend, collaboration] = await Promise.all([
      freePort(),
      freePort(),
      freePort()
    ])
    const service = createFlowService(root, dir, {
      execute: (options) =>
        runProcess({
          ...options,
          env: {
            ...options.env,
            APP_URL: 'http://127.0.0.1:' + app,
            E2E_DOCUMENT_BACKEND_URL: 'http://127.0.0.1:' + backend,
            DOCUMENT_BACKEND_PORT: String(backend),
            COLLABORATION_WS_HOST: '127.0.0.1',
            COLLABORATION_WS_PORT: String(collaboration),
            VITE_COLLABORATION_WS_URL:
              'ws://127.0.0.1:' + collaboration + '/collaboration'
          }
        })
    })
    t.after(() => service.close())
    const candidate = contract.cases[0],
      id = criterionId(contract, candidate)
    const result = await service.rerun({
      ...service.preview(doc.flowId, candidate.stepId, id),
      confirm: true
    })
    assert.equal(
      result.code,
      0,
      result.output +
        '\n' +
        JSON.stringify({
          errors: result.context.errors.map(
            ({ criterionId, summary, details }) => ({
              criterionId,
              summary,
              diagnosticTail: details.join('\n').slice(-6000)
            })
          ),
          warnings: result.context.warnings.map(({ summary }) => summary)
        })
    )
    assert.equal(result.coverageComplete, true, JSON.stringify(result.context))
    const current = service.snapshot().documents[0].current
    assert.equal(current.observations.length, 1)
    assert.equal(current.observations[0].criterionId, id)
    assert.equal(current.observations[0].status, 'passed')
    assert.deepEqual(current.warnings, [])
  }
)
