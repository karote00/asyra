/* eslint-disable @typescript-eslint/no-require-imports */
const { TASK_POLICY } = require('./agent-contract.cjs')
function demonstrationAdapter(task, scenario, contract) {
  if (!TASK_POLICY.scenarios.includes(scenario))
    throw new Error('Unknown demonstration')
  let turn = 0
  const file = task.allowedFiles[0]
  const mutation = contract.definition.scenarios.find(
    (item) => item.id === 'inverse-regression'
  ).mutation
  return {
    async next(observation) {
      if (scenario === 'stall') return new Promise(() => undefined)
      if (scenario === 'scope-violation')
        return { tool: 'shell', command: 'git merge main' }
      if (scenario === 'tool-limit') return { tool: 'read', path: file }
      turn++
      if (turn === 1) return { tool: 'read', path: file }
      if (turn > 2) return { tool: 'finish' }
      if (scenario === 'regression')
        return {
          tool: 'replace',
          path: file,
          digest: observation.digest,
          before: mutation.from,
          after: mutation.to
        }
      if (observation.content.includes(mutation.to))
        return {
          tool: 'replace',
          path: file,
          digest: observation.digest,
          before: mutation.to,
          after: mutation.from
        }
      return {
        tool: 'replace',
        path: file,
        digest: observation.digest,
        before: observation.content,
        after: '// Local candidate for human review\n' + observation.content
      }
    }
  }
}
module.exports = { demonstrationAdapter }
