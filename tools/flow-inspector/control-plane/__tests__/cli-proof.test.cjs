/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const { startServer } = require('../server.cjs')
const { main } = require('../cli.cjs')
const { loadContract } = require('../contracts.cjs')

// One real proof owns the complete scenario chain. The transport-authority
// test owns one action; runner unit tests own process isolation and cleanup.
test(
  'CLI proof runs every real negative once and recovers the same captured source',
  { timeout: 30000 },
  async (t) => {
    const root = path.resolve(__dirname, '../../../..')
    const parent = path.join(root, 'tmp/flow-inspector/cli-proofs')

    fs.mkdirSync(parent, { recursive: true })
    const directory = fs.mkdtempSync(path.join(parent, 'proof-'))
    const contract = loadContract(root)
    const server = await startServer(root, {
      url: 'http://127.0.0.1:0',
      serviceOptions: { directory }
    })
    const messages = []

    try {
      assert.equal(
        await main(['--url', server.origin, 'prove'], {
          write: (value) => messages.push(value)
        }),
        0
      )
      const records = server.service.state().runs.slice().reverse()
      const scenarios = [
        contract.scenarios.find((scenario) => scenario.id === 'baseline'),
        ...contract.scenarios.filter((scenario) => scenario.id !== 'baseline'),
        contract.scenarios.find((scenario) => scenario.id === 'baseline')
      ]

      assert.equal(records.length, scenarios.length)
      assert.deepEqual(
        records.map((record) => record.scenario),
        scenarios.map((scenario) => scenario.id)
      )
      const baselineDigest = records[0].digest

      for (const [index, summary] of records.entries()) {
        const scenario = scenarios[index]
        const record = server.service.get(summary.id)
        const { snapshot, runner, evidence } = record

        assert.equal(record.phase, 'completed', scenario.id)
        assert.equal(snapshot.digest, baselineDigest, scenario.id)
        assert.equal(
          runner.identity.runtimeSourceDigest,
          snapshot.runtimeSource.digest
        )
        assert.equal(
          runner.identity.runtimeAuthorityDigest,
          snapshot.runtimeAuthority.digest
        )
        assert.equal(
          runner.identity.contractScopeDigest,
          snapshot.runtimeAuthority.contractScopeDigest
        )
        assert.equal(runner.identity.lockfileDigest, snapshot.lockfileDigest)
        assert.equal(runner.identity.sourceDigest, snapshot.digest)
        assert.equal(runner.identity.mappingVersion, contract.mappingVersion)
        assert.equal(runner.environment.node, process.version)
        assert.equal(runner.environment.vitest, runner.version)
        assert.match(runner.reportDigest, /^[a-f0-9]{64}$/)
        assert.deepEqual(evidence.issues, [], scenario.id)
        assert.deepEqual(
          evidence.cases
            .filter((item) => item.status === 'failed')
            .map((item) => item.id)
            .sort(),
          scenario.expectedFailedCaseIds.slice().sort(),
          scenario.id
        )
        assert.equal(
          evidence.passedCount,
          contract.cases.length - scenario.expectedFailedCaseIds.length,
          scenario.id
        )
        assert.equal(runner.code === 0, scenario.id === 'baseline', scenario.id)
      }

      assert.match(messages.join('\n'), /Core proof passed/)
    } finally {
      // Keep the pending/finished owner visible if a bounded run fails. Never
      // diagnose a missing final assertion as a specific runner failure.
      t.diagnostic(
        JSON.stringify(
          server.service.state().runs.map((record) => ({
            scenario: record.scenario,
            phase: record.phase,
            startedAt: record.startedAt,
            finishedAt: record.finishedAt
          }))
        )
      )
      await server.close()
      fs.rmSync(directory, { recursive: true, force: true })
    }
  }
)
