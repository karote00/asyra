/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path')
const { directory } = require('./fixtures.cjs')
const { initialize, resolveProject } = require('../project.cjs')
const { openProject } = require('../store.cjs')
test('initialization supports every template and nested discovery without Git or overwrites', (t) => {
  for (const template of [
    'manual',
    'mixed',
    'custom',
    'vitest',
    'playwright'
  ]) {
    const root = directory(t),
      project = initialize(root, template)
    fs.mkdirSync(path.join(root, 'nested folder'))
    assert.equal(
      resolveProject(undefined, path.join(root, 'nested folder')).root,
      root
    )
    assert.equal(
      openProject(project.directory).snapshot().documents[0].projectId,
      'project'
    )
    assert.throws(() => initialize(root, template), /overwrite/)
    assert.equal(fs.existsSync(path.join(root, '.git')), false)
  }
})
test('project admission rejects traversal, symlinks, unknown fields and package data writes', (t) => {
  const root = directory(t)
  initialize(root)
  const file = path.join(root, 'flow-inspector.config.json')
  for (const flows of [
    '../outside',
    'node_modules/flows',
    '/tmp',
    'flows/../flows'
  ]) {
    fs.writeFileSync(
      file,
      JSON.stringify({ schemaVersion: 1, projectId: 'project', flows })
    )
    assert.throws(() => resolveProject(root), /path/)
  }
  fs.symlinkSync('flows', path.join(root, 'linked'))
  fs.writeFileSync(
    file,
    JSON.stringify({ schemaVersion: 1, projectId: 'project', flows: 'linked' })
  )
  assert.throws(() => resolveProject(root), /Symlink/)
  fs.writeFileSync(
    file,
    JSON.stringify({
      schemaVersion: 1,
      projectId: 'project',
      flows: 'flows',
      extra: true
    })
  )
  assert.throws(() => resolveProject(root), /configuration/)
})
