import { URL } from 'node:url'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import yaml from 'js-yaml'

// Shared by App handoff and native GPU proofs; no production dependency.
export function readPixiProofIdentity(browserVersion) {
  const read = (path) =>
    readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

  const manifest = read('packages/render-engine-pixi/package.json')
  const declaredRange = JSON.parse(manifest).dependencies['pixi.js']
  const installedVersion = JSON.parse(
    read('node_modules/pixi.js/package.json')
  ).version
  const lockfile = read('yarn.lock')
  const descriptor = `pixi.js@npm:${declaredRange}`
  const entries = Object.entries(yaml.load(lockfile)).filter(([key]) =>
    key.split(', ').includes(descriptor)
  )

  assert.equal(
    entries.length,
    1,
    'The current Pixi descriptor must have one locked resolution'
  )
  const locked = entries[0][1]

  assert.equal(
    locked.version,
    installedVersion,
    'Installed Pixi differs from the lockfile'
  )
  assert.equal(locked.resolution, `pixi.js@npm:${installedVersion}`)
  assert.equal(
    browserVersion,
    installedVersion,
    'Browser-loaded Pixi differs from the installed SDK'
  )

  const hash = (value) => createHash('sha256').update(value).digest('hex')

  return {
    declaredRange,
    installedVersion,
    browserVersion,
    manifestSha256: hash(manifest),
    lockfileSha256: hash(lockfile)
  }
}
