import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assertStarterBuildArtifacts,
  countUtilsBuildExecutions,
  runOwnedBuildCommand
} from './workspace-build-validation-helpers.mjs'

test(
  'CI direct Starter build runs Framework dependencies once and emits valid artifacts',
  { timeout: 125_000 },
  async () => {
    const result = await runOwnedBuildCommand(
      'yarn',
      ['workspace', '@asyra/starter-app', 'build'],
      { githubActions: true, timeoutMs: 120_000 }
    )
    assert.equal(result.code, 0, result.output.slice(-4000))
    assert.equal(countUtilsBuildExecutions(result.output), 1)
    await assertStarterBuildArtifacts()
  }
)
