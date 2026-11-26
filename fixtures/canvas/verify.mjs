import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import flowApi from '../../tools/flow-inspector/flow-files/api.cjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const flow = flowApi.openProject(path.join(root, 'docs/ai/sdk/plans/canvas'))
const { context } = flow.snapshot().evaluation.flows[0].nodes[0]
const temp = path.join(root, 'tmp/canvas')

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
    [
      'turbo',
      'run',
      'build:design',
      'build:simulation',
      'build:design-ui',
      '--concurrency=1',
      '--output-logs=errors-only'
    ],
    options
  )
  execFileSync(
    process.execPath,
    ['--test', 'fixtures/canvas/__tests__/consumer.test.mjs'],
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
      caseId: 'canvas/consumer',
      summary:
        status === 'passed'
          ? 'Separate packed base, design and simulation installations passed type, build and Chromium checks.'
          : 'Build or browser verification failed.',
      at: new Date().toISOString()
    }
  })
}
