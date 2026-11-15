import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'

const docs = resolve(import.meta.dirname, '../../../docs/ai/apps/asyra-design')

const read = (file) => readFileSync(resolve(docs, file), 'utf8')

test('tool switching docs preserve current Canvas Text and T-key capability', () => {
  const source = read('features/switch-primary-tool.md')

  assert.doesNotMatch(
    source,
    /Canvas Text creation\/editing[\s\S]*?are deferred/
  )
  assert.match(source, /editable-text\.md/)
  assert.match(
    read('specs/editable-text.md'),
    /Text content is edited directly on Canvas/
  )
})

test('controller guidance writes canonical properties instead of computed output', () => {
  const source = read('modules/controllers-and-state.md')

  assert.doesNotMatch(source, /changeComputedData|element computed-data writes/)
  assert.match(source, /updateElementProperties/)
})

test('selection docs distinguish canonical intent from frame-aligned read projections', () => {
  for (const file of ['features/pen-tool.md', 'API_SURFACES.md']) {
    const source = read(file)

    assert.doesNotMatch(source, /compatibility mirror/)
    assert.match(source, /frame-aligned/)
    assert.match(source, /getSelectedVectorPoints/)
  }
})

test('current ownership docs do not retain removed App state or point-selection mirrors', () => {
  assert.doesNotMatch(
    read('modules/source-coverage.md'),
    /src\/states\/app\.ts/
  )
  assert.doesNotMatch(
    read('features/delete-vector-point.md'),
    /Compatibility selected/
  )
  assert.match(read('features/delete-vector-point.md'), /canonical.*selection/i)
})

test('delete and hover documents name one current controller policy', () => {
  for (const file of [
    'features/delete-element.md',
    'features/hover-element.md'
  ]) {
    assert.match(read(file), /controllers\/hover-target\.ts/)
    assert.doesNotMatch(read(file), /\.reEvaluate\(/)
  }
})
