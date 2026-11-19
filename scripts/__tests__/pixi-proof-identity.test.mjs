import { URL } from 'node:url'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { readPixiProofIdentity } from '../pixi-proof-identity.mjs'

test('GPU evidence accepts only the current installed and locked browser SDK', () => {
  const { version } = JSON.parse(
    readFileSync(
      new URL('../../node_modules/pixi.js/package.json', import.meta.url),
      'utf8'
    )
  )
  const identity = readPixiProofIdentity(version)

  assert.equal(identity.browserVersion, identity.installedVersion)
  assert.match(identity.lockfileSha256, /^[a-f0-9]{64}$/)
  assert.match(identity.manifestSha256, /^[a-f0-9]{64}$/)
  assert.throws(
    () => readPixiProofIdentity('0.0.0'),
    /Browser-loaded Pixi differs/
  )
  assert.throws(
    () => readPixiProofIdentity(undefined),
    /Browser-loaded Pixi differs/
  )
})
