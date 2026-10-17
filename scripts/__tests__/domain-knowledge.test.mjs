import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const directory = path.join(root, 'domain-knowledge')
const ids = [
  'colors',
  'components.button',
  'design.landing-page',
  'icons',
  'typography'
]

test('shared knowledge is a flat data-only root workspace', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(directory, 'package.json'))
  )
  const workspace = JSON.parse(fs.readFileSync(path.join(root, 'package.json')))
  assert.equal(manifest.name, '@asyra/domain-knowledge')
  assert.equal(manifest.contentOnly, true)
  assert.ok(workspace.workspaces.includes('domain-knowledge'))
  for (const field of [
    'main',
    'module',
    'types',
    'scripts',
    'dependencies',
    'devDependencies',
    'peerDependencies'
  ])
    assert.equal(manifest[field], undefined, field)
  assert.deepEqual(
    fs.readdirSync(directory).sort(),
    [...ids.map((id) => `${id}.md`), 'package.json'].sort()
  )
  assert.deepEqual(manifest.files, ['*.md'])
})

test('shared advice has provenance, practical guidance and resolvable composition', () => {
  for (const id of ids) {
    const text = fs.readFileSync(path.join(directory, `${id}.md`), 'utf8')
    const match = /^---\n([\s\S]*?)\n---\n/.exec(text)
    assert.ok(match, id)
    const metadata = JSON.parse(match[1])
    assert.ok(metadata.description.length > 20)
    assert.ok(metadata.provenance.length > 0)
    for (const reference of metadata.references ?? [])
      assert.ok(ids.includes(reference))
    for (const heading of [
      'What',
      'Why',
      'How',
      'Provenance',
      'Evaluation Guidance'
    ])
      assert.ok(text.includes(`## ${heading}\n`), `${id}: ${heading}`)
    assert.ok(text.length > 700, `${id} contains usable advice`)
  }
})
