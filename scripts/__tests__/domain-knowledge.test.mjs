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
  'illustration.architecture',
  'illustration.architecture.spatial',
  'illustration.architecture.projection',
  'illustration.architecture.repetition',
  'illustration.architecture.materials',
  'illustration.architecture.materials.method',
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
    for (const reference of [
      ...(metadata.references ?? []),
      ...(metadata.children ?? [])
    ])
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

test('architectural methods stay portable and contain no App execution contract', () => {
  const text = ids
    .filter((id) => id.startsWith('illustration.architecture'))
    .map((id) => fs.readFileSync(path.join(directory, `${id}.md`), 'utf8'))
    .join('\n')
  for (const forbidden of [
    'Asyra',
    'Taipei',
    '101',
    'prepare_and_apply_design',
    'describe_design_apis',
    'map_retained_fills',
    'fillTemplates',
    'schemaPaths',
    'execute_design_batch',
    'read_design_checks',
    'Code Mode'
  ]) {
    assert.equal(
      text.includes(forbidden),
      false,
      `Shared advice leaked ${forbidden}`
    )
  }
  for (const topic of [
    'Applicability',
    'Decisions',
    'Representation',
    'Early check',
    'Revision'
  ]) {
    assert.ok(text.includes(`**${topic}:**`), `Missing domain method ${topic}`)
  }
  assert.ok(text.includes('requested style takes precedence'))
  assert.ok(text.includes('not every unrelated part'))
})

test('architectural navigation does not eagerly compose descendants', () => {
  const entries = new Map(
    ids.map((id) => {
      const text = fs.readFileSync(path.join(directory, `${id}.md`), 'utf8')
      return [id, JSON.parse(/^---\n([\s\S]*?)\n---\n/.exec(text)[1])]
    })
  )
  const root = entries.get('illustration.architecture')
  assert.equal(root.references, undefined)
  assert.ok(root.children.includes('illustration.architecture.materials'))
  const material = entries.get('illustration.architecture.materials')
  assert.deepEqual(material.references, ['illustration.architecture'])
  assert.deepEqual(material.children, [
    'illustration.architecture.materials.method'
  ])
  assert.deepEqual(entries.get(material.children[0]).references, [
    'illustration.architecture.materials'
  ])
})
