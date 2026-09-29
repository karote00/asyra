// Formal oracle, run outside the candidate workspace. These checks are not editable
// task tests; semantic documentation quality still requires explicit review.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const [caseId, workspace] = process.argv.slice(2)
const load = (file) => import(pathToFileURL(path.join(workspace, file)).href)

if (caseId === 'bugfix-range') {
  const { contains } = await load('src/range.mjs')
  for (const [min, max] of [
    [1, 3],
    [-4, 2],
    [0, 0]
  ]) {
    for (const value of [min - 1, min, (min + max) / 2, max, max + 1]) {
      assert.equal(contains({ min, max }, value), value >= min && value <= max)
    }
  }
} else if (caseId === 'feature-ownership') {
  const { createItem } = await load('src/model.mjs')
  const { displayName } = await load('src/view.mjs')
  for (const name of [
    'Example',
    'User / Name',
    'User \u00b7 Name',
    '  spaced  '
  ]) {
    const item = Object.freeze(createItem(name))
    assert.equal(item.name, name)
    assert.equal(displayName(item), name)
    assert.equal(displayName(item, ''), name)
    assert.equal(displayName(item, 'v2'), `${name} - v2`)
    assert.deepEqual(item, { name })
  }
} else if (caseId === 'docs-routing') {
  const doc = readFileSync(path.join(workspace, 'docs/delivery.md'), 'utf8')
  assert.ok(doc.trim().length > 0, 'Documentation must not be empty')
  // Wording, authority, and preserved semantics are reviewer-owned criteria.
} else {
  throw new Error(`Unknown case: ${caseId}`)
}
console.log('Behavior oracle passed')
