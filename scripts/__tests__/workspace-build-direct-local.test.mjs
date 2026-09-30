import assert from 'node:assert/strict'
import test from 'node:test'
import {
  countUtilsBuildExecutions,
  runOwnedBuildCommand
} from './workspace-build-validation-helpers.mjs'

test(
  'local direct Starter build runs Framework dependencies once',
  { timeout: 125_000 },
  async () => {
    const result = await runOwnedBuildCommand(
      'yarn',
      ['workspace', '@asyra/starter-app', 'build'],
      { githubActions: false, timeoutMs: 120_000 }
    )
    assert.equal(result.code, 0, result.output.slice(-4000))
    assert.equal(countUtilsBuildExecutions(result.output), 1)
  }
)
