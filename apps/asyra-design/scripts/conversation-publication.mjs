import { writeFileSync } from 'node:fs'
import { relative } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  publish
} = require('../../../tools/flow-inspector/flow-files/adapters.cjs')

export function publishConversationGroup({
  project,
  receipt,
  records,
  issues,
  artifact
}) {
  writeFileSync(artifact, JSON.stringify(issues, null, 2) + '\n')

  return publish(
    project,
    receipt,
    records,
    issues.length
      ? issues.length +
          ' findings; complete evidence: ' +
          relative(project.root, artifact)
      : ''
  )
}
