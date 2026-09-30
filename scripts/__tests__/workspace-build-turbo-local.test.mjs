import assert from 'node:assert/strict'
import test from 'node:test'
import {
  countUtilsBuildExecutions,
  runOwnedBuildCommand
} from './workspace-build-validation-helpers.mjs'

test(
  'local Turbo Starter build runs Framework dependencies once',
  { timeout: 80_000 },
  async () => {
    const result = await runOwnedBuildCommand(
      'yarn',
      [
        'turbo',
        'run',
        'react:build',
        '--filter',
        '@asyra/starter-app',
        '--concurrency=1',
        '--log-order=stream',
        '--log-prefix=task'
      ],
      { githubActions: false, timeoutMs: 75_000 }
    )
    assert.equal(result.code, 0, result.output.slice(-4000))
    assert.equal(countUtilsBuildExecutions(result.output), 1)
  }
)
