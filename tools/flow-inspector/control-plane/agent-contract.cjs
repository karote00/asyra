/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path')
const { validId } = require('./store.cjs')
const freeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}
const TASK_POLICY = freeze({
  format: 1,
  maximums: { elapsedMs: 300000, toolCalls: 100, attempts: 5 },
  maxFileBytes: 262144,
  maxOutputBytes: 524288,
  operations: ['read', 'replace', 'finish'],
  scenarios: ['repair', 'regression', 'scope-violation', 'tool-limit', 'stall'],
  forbiddenActions: [
    'shell',
    'process',
    'network',
    'secrets',
    'merge',
    'publish',
    'accept-baseline',
    'change-protection'
  ]
})
function requireTask(condition, message) {
  if (!condition) throw new Error('Task admission: ' + message)
}
function canonicalFile(file) {
  return (
    typeof file === 'string' &&
    /^[a-zA-Z0-9_./-]+$/.test(file) &&
    !path.posix.isAbsolute(file) &&
    path.posix.normalize(file) === file &&
    !file.split('/').some((part) => !part || part === '.' || part === '..')
  )
}
function admitTask(request, contract, revision, actor) {
  requireTask(
    request && typeof request === 'object' && !Array.isArray(request),
    'invalid request'
  )
  requireTask(
    Object.keys(request).every((key) =>
      [
        'requestId',
        'stepId',
        'objective',
        'allowedFiles',
        'adapter',
        'scenario',
        'budgets',
        'contractDigest',
        'revision'
      ].includes(key)
    ),
    'unknown field'
  )
  requireTask(validId(request.requestId), 'invalid task identity')
  requireTask(typeof actor === 'string' && actor.trim(), 'missing actor')
  requireTask(
    request.contractDigest === contract.digest && request.revision === revision,
    'stale accepted baseline'
  )
  const step = contract.flows
    .flatMap((flow) => flow.steps)
    .find((value) => value.id === request.stepId)
  requireTask(step, 'unknown concrete step')
  for (const key of [
    'inputs',
    'outputs',
    'conditions',
    'bypasses',
    'allowedContributors',
    'forbiddenContributors',
    'implementationBoundary',
    'specRefs'
  ])
    requireTask(
      Array.isArray(step[key]) && step[key].length,
      'incomplete step ' + key
    )
  requireTask(
    step.failureOwnerStepId && step.ownerPackage,
    'missing failure owner'
  )
  requireTask(
    typeof request.objective === 'string' &&
      request.objective.trim().length > 0 &&
      request.objective.length <= 2000,
    'invalid objective'
  )
  requireTask(request.adapter === 'demonstration', 'unsupported adapter')
  requireTask(
    TASK_POLICY.scenarios.includes(request.scenario),
    'unknown demonstration'
  )
  const files = request.allowedFiles
  requireTask(
    Array.isArray(files) &&
      files.length > 0 &&
      files.length <= 10 &&
      new Set(files).size === files.length,
    'invalid file scope'
  )
  for (const file of files) {
    requireTask(
      canonicalFile(file) &&
        /^packages\/factory\/src\/.+\.ts$/.test(file) &&
        !file.includes('/__tests__/'),
      'non-runtime or noncanonical path'
    )
    requireTask(
      step.implementationBoundary.some(
        (boundary) =>
          boundary === file ||
          (boundary.endsWith('/**') && file.startsWith(boundary.slice(0, -2)))
      ),
      'file outside owner boundary'
    )
  }
  const budgets = request.budgets
  requireTask(
    budgets &&
      Object.keys(budgets).length === 3 &&
      Object.keys(budgets).every((key) => key in TASK_POLICY.maximums),
    'unsupported budget; token and cost telemetry are unknown'
  )
  for (const [key, max] of Object.entries(TASK_POLICY.maximums))
    requireTask(
      Number.isSafeInteger(budgets[key]) &&
        budgets[key] > 0 &&
        budgets[key] <= max,
      'invalid ' + key
    )
  const routes = contract.architectureDefinition.routes.filter(
    (route) => route.from === step.id || route.to === step.id
  )
  return freeze(
    structuredClone({
      format: TASK_POLICY.format,
      ...request,
      actor,
      step,
      routes,
      flowIds: contract.flows.map((flow) => flow.id),
      obligations: contract.cases,
      forbiddenActions: TASK_POLICY.forbiddenActions,
      usage: {
        elapsedMs: 0,
        toolCalls: 0,
        attempts: 0,
        tokens: null,
        cost: null
      }
    })
  )
}
module.exports = { admitTask, TASK_POLICY, canonicalFile, freeze }
