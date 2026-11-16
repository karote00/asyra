import { writeFileSync } from 'node:fs'
import { relative } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  publish,
  admitCompleteReport
} = require('../../../tools/flow-inspector/flow-files/adapters.cjs')

export function publishConversationGroup({
  project,
  receipt,
  report,
  scope,
  requiredFiles,
  requiredCases,
  issues: executionIssues,
  artifact
}) {
  const admitted = admitCompleteReport(
    project,
    report,
    scope,
    requiredFiles,
    requiredCases
  )
  const issues = [...new Set([...executionIssues, ...admitted.issues])]

  writeFileSync(artifact, JSON.stringify(issues, null, 2) + '\n')

  const publication = publish(
    project,
    receipt,
    admitted.records,
    issues.length
      ? issues.length +
          ' findings; complete evidence: ' +
          relative(project.root, artifact)
      : ''
  )

  return { records: admitted.records, issues, publication }
}
