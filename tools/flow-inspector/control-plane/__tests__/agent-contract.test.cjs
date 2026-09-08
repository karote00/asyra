/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const { loadContract } = require('../contracts.cjs')
const { admitTask, TASK_POLICY } = require('../agent-contract.cjs')
const root = path.resolve(__dirname, '../../../..')
const contract = loadContract(root)
const request = () => ({
  requestId: randomUUID(),
  stepId: 'finalize-transaction-state',
  objective: 'Restore inverse replay without weakening retained obligations',
  allowedFiles: ['packages/factory/src/data-transact.ts'],
  adapter: 'demonstration',
  scenario: 'repair',
  budgets: { elapsedMs: 60000, toolCalls: 20, attempts: 3 },
  contractDigest: contract.digest,
  revision: 1
})
test('admission binds the exact concrete owner, adjacent contracts and retained obligations', () => {
  const input = request()
  const task = admitTask(input, contract, 1, 'local-developer')
  assert.equal(task.step.id, input.stepId)
  assert.equal(task.obligations.length, 6)
  assert.equal(task.flowIds.length, 2)
  assert.ok(task.routes.length)
  assert.equal(task.actor, 'local-developer')
  assert.equal(task.usage.tokens, null)
  assert.equal(task.usage.cost, null)
  input.allowedFiles.push('secrets')
  assert.equal(task.allowedFiles.length, 1)
  assert.ok(Object.isFrozen(task.step))
  assert.deepEqual(task.forbiddenActions, TASK_POLICY.forbiddenActions)
})
test('admission refuses missing, stale, unmeasurable and out-of-owner requests before capture', () => {
  for (const change of [
    { allowedFiles: [] },
    { allowedFiles: ['../outside.ts'] },
    { allowedFiles: ['/tmp/outside.ts'] },
    { allowedFiles: ['packages/factory/src/../src/data-transact.ts'] },
    { allowedFiles: ['packages/factory/src/__tests__/flow-proof.test.ts'] },
    { allowedFiles: ['packages/utils/src/index.ts'] },
    { allowedFiles: ['packages/factory/flow-contracts.json'] },
    { stepId: 'unknown' },
    { objective: '' },
    { revision: 2 },
    { contractDigest: '0'.repeat(64) },
    { adapter: 'shell' },
    { budgets: { elapsedMs: 60000, toolCalls: 20, attempts: 3, tokens: 100 } },
    { budgets: { elapsedMs: 60000, toolCalls: 20, attempts: 3, cost: 1 } },
    { budgets: { elapsedMs: Infinity, toolCalls: 20, attempts: 3 } },
    { command: 'git merge main' },
    { scenario: 'unknown' }
  ])
    assert.throws(() =>
      admitTask({ ...request(), ...change }, contract, 1, 'local-developer')
    )
})
module.exports = { request }
