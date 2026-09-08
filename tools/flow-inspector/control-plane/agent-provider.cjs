/* eslint-disable @typescript-eslint/no-require-imports */
const { TASK_POLICY } = require('./agent-contract.cjs')
function reportedUsage(value) {
  if (
    !value ||
    !['inputTokens', 'outputTokens', 'totalTokens'].every(
      (key) => Number.isSafeInteger(value[key]) && value[key] >= 0
    ) ||
    value.totalTokens !== value.inputTokens + value.outputTokens
  )
    return null
  return {
    inputTokens: value.inputTokens,
    outputTokens: value.outputTokens,
    totalTokens: value.totalTokens
  }
}
function providerAdapter(
  task,
  {
    complete,
    signal,
    reserve,
    settle,
    onSpawn,
    sourceIdentity = null,
    previousVerification = null
  }
) {
  const contract = Object.fromEntries(
    [
      'requestId',
      'objective',
      'step',
      'routes',
      'obligations',
      'allowedFiles',
      'forbiddenActions',
      'contractDigest',
      'revision',
      'budgets',
      'flowIds'
    ].map((key) => [key, structuredClone(task[key])])
  )
  contract.sourceBaseline = structuredClone(sourceIdentity)
  const history = []
  return {
    async next(observation) {
      if (signal.aborted) throw new Error('Provider request cancelled')
      const id = reserve()
      let response
      try {
        response = await complete({
          contract,
          observation,
          history: structuredClone(history),
          previousVerification,
          model: task.provider.model,
          signal,
          onSpawn
        })
      } catch {
        settle(id, { state: 'unresolved', usage: null })
        throw new Error('Provider transport failed; remote result unresolved')
      }
      const usage = reportedUsage(response?.usage)
      const state = response?.terminal === true ? 'settled' : 'unresolved'
      settle(id, {
        state,
        usage,
        ...(signal.aborted && response?.interruptionConfirmed === true
          ? { interruptionConfirmed: true }
          : {})
      })
      if (signal.aborted) throw new Error('Provider request cancelled')
      if (state !== 'settled')
        throw new Error('Provider remote result unresolved')
      if (!usage) throw new Error('Provider usage missing or invalid')
      if (
        typeof response.text !== 'string' ||
        Buffer.byteLength(response.text) > TASK_POLICY.maxOutputBytes
      )
        throw new Error('Provider output missing or oversized')
      let operation
      try {
        operation = JSON.parse(response.text)
      } catch {
        throw new Error('Provider output malformed')
      }
      history.push({ observation, operation })
      return operation
    }
  }
}
module.exports = { providerAdapter, reportedUsage }
