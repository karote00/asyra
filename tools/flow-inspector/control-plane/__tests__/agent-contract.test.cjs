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

test('task file authority follows the selected step primary package and exact boundary', () => {
  const cases = [
    [
      require('../../inspectors/network-collaboration-transport-flow-inspector.data.cjs').steps.find(
        (step) => step.id === 'own-collaboration-instance'
      ),
      'packages/collaboration/src/process.ts',
      'packages/factory/src/data-transact.ts'
    ],
    [
      require('../../inspectors/asyra-sim-r0-flow-inspector.data.cjs').steps.find(
        (step) => step.id === 'reset-ui-context'
      ),
      'packages/ui-context/src/property-registry.ts',
      'packages/scene-tree/src/index.ts'
    ]
  ]
  for (const [step, allowed, dependency] of cases) {
    const scopedContract = structuredClone(contract)
    scopedContract.flows[0].steps[0] = step
    const input = {
      ...request(),
      stepId: step.id,
      allowedFiles: [allowed],
      contractDigest: scopedContract.digest
    }
    assert.equal(
      admitTask(input, scopedContract, 1, 'local-developer').step.ownerPackage,
      step.ownerPackage
    )
    assert.throws(
      () =>
        admitTask(
          { ...input, allowedFiles: [dependency] },
          scopedContract,
          1,
          'local-developer'
        ),
      /owner|boundary|runtime/i
    )
    assert.throws(
      () =>
        admitTask(
          {
            ...input,
            allowedFiles: [
              step.implementationBoundary.find((path) =>
                path.includes('/__tests__/')
              )
            ]
          },
          scopedContract,
          1,
          'local-developer'
        ),
      /runtime|canonical/i
    )
  }
})
module.exports = { request }

test('real provider admission binds trusted authorization without accepting caller policy', () => {
  const authorization = {
    id: randomUUID(),
    actor: 'local-developer',
    adapter: 'codex-app-server',
    model: 'gpt-5.6-sol',
    billing: 'chatgpt-subscription',
    maxRequests: 12,
    expiresAt: '2099-01-01T00:00:00.000Z'
  }
  const input = {
    ...request(),
    adapter: 'provider',
    scenario: 'task',
    providerAuthorizationId: authorization.id
  }
  assert.throws(() => admitTask(input, contract, 1, 'local-developer'))
  const task = admitTask(input, contract, 1, 'local-developer', authorization)
  assert.deepEqual(task.provider, authorization)
  assert.equal(task.obligations.length, 6)
  authorization.model = 'changed'
  assert.equal(task.provider.model, 'gpt-5.6-sol')
  for (const change of [
    { id: randomUUID() },
    { actor: 'different' },
    { expiresAt: '2000-01-01T00:00:00.000Z' },
    { expiresAt: 'invalid' },
    { maxRequests: 0 },
    { maxRequests: Infinity },
    { credential: 'must-never-enter-task' },
    { endpoint: 'https://untrusted.invalid' }
  ])
    assert.throws(() =>
      admitTask(input, contract, 1, 'local-developer', {
        ...task.provider,
        ...change
      })
    )
  assert.throws(() =>
    admitTask(
      { ...input, model: 'changed' },
      contract,
      1,
      'local-developer',
      task.provider
    )
  )
})

test('work binding is a detached exact identity, never caller authority or an optional partial binding', () => {
  const workBinding = {
    targetId: randomUUID(),
    workId: randomUUID(),
    admissionId: randomUUID()
  }
  const input = { ...request(), workBinding }
  const value = admitTask(input, contract, 1, 'local-developer')
  assert.deepEqual(value.workBinding, workBinding)
  assert.ok(Object.isFrozen(value.workBinding))
  for (const invalid of [
    null,
    {},
    { ...workBinding, admissionId: 'unknown' },
    { ...workBinding, passed: true }
  ])
    assert.throws(
      () =>
        admitTask(
          { ...request(), workBinding: invalid },
          contract,
          1,
          'local-developer'
        ),
      /binding/i
    )
})
