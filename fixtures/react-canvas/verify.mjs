import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import flowApi from '../../tools/flow-inspector/flow-files/api.cjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const flow = flowApi.openProject(
  path.join(root, 'docs/ai/framework/plans/react-canvas')
)
const { context } = flow.snapshot().evaluation.flows[0].nodes[0]
const temp = path.join(root, 'tmp/react-canvas')

mkdirSync(temp, { recursive: true })
const options = {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, TMPDIR: temp, TURBO_TELEMETRY_DISABLED: '1' }
}
let status = 'failed'

try {
  execFileSync(
    'yarn',
    ['turbo', 'run', 'build:react', '--output-logs=errors-only'],
    options
  )
  execFileSync(
    process.execPath,
    [
      '--test',
      'fixtures/react-canvas/__tests__/realm.test.mjs',
      'fixtures/react-canvas/__tests__/consumer.test.mjs'
    ],
    options
  )
  status = 'passed'
} finally {
  flow.update(context.flowId, {
    expectedRevision: context.revision,
    kind: 'observation',
    value: {
      nodeId: context.nodeId,
      criterionId: 'consumer',
      kind: 'automated',
      status,
      binding: context.criteria[0].binding,
      actor: 'packed-consumer',
      executionId: randomUUID(),
      caseId: 'react-canvas/consumer',
      summary:
        status === 'passed'
          ? 'Packed React editor passed type, production build, isolation and Chromium interaction checks.'
          : 'Build or browser verification failed.',
      at: new Date().toISOString()
    }
  })
}
