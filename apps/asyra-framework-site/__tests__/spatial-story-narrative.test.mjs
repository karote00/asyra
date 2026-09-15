import assert from 'node:assert/strict'
import test from 'node:test'
import { getStoryFrame, storyChapters } from '../lib/spatial-story.mjs'

test('six chapters follow a concrete example and explicitly identify infrastructure', () => {
  assert.equal(new Set(storyChapters.map((c) => c.id)).size, 6)
  assert.match(storyChapters[0].detail, /software infrastructure/)
  assert.match(storyChapters[4].detail, /same code/)
  assert.match(storyChapters[5].detail, /one example/)
})
test('the notebook stays present after its overlay registration throughout the whole story', () => {
  for (let i = 250; i <= 6000; i++) {
    const time = i / 1000
    const chapter = Math.min(5, Math.floor(time))
    assert.equal(getStoryFrame(chapter, time - chapter).layers.notebook[7], 1)
  }
})
test('the same notebook lifts to reveal its infrastructure with actual depth and tilt', () => {
  const paper = getStoryFrame(0, 1)
  const layers = getStoryFrame(1, 1)
  assert.ok(layers.camera[3] >= 30)
  assert.ok(layers.layers.notebook[2] > paper.layers.notebook[2])
  assert.ok(layers.layers.notebook[2] > layers.layers.feature[2])
  assert.ok(layers.layers.feature[2] > layers.layers.transaction[2])
  assert.ok(layers.layers.transaction[2] > layers.layers.state[2])
})
test('an action reaches feature then transaction then state before the projection reports a saved result', () => {
  assert.equal(getStoryFrame(2, 0.3).effects.feature, 1)
  assert.equal(getStoryFrame(2, 0.3).effects.saved, 0)
  assert.equal(getStoryFrame(2, 0.46).effects.transaction, 1)
  assert.equal(getStoryFrame(2, 0.46).effects.saved, 0)
  assert.equal(getStoryFrame(2, 0.62).effects.saved, 1)
  assert.equal(getStoryFrame(2, 0.62).effects.result, 0)
  assert.equal(getStoryFrame(2, 0.94).effects.result, 1)
})
test('replacing behavior leaves the state, transaction and saved notebook exactly intact', () => {
  const before = getStoryFrame(3, 0)
  const during = getStoryFrame(3, 0.3)
  const after = getStoryFrame(3, 1)
  for (const id of ['notebook', 'transaction', 'state']) {
    assert.deepEqual(before.layers[id], during.layers[id])
    assert.deepEqual(before.layers[id], after.layers[id])
  }
  assert.deepEqual(after.layers.replacement, before.layers.feature)
  assert.ok(during.layers.feature[0] < -500)
  assert.ok(during.layers.replacement[0] > 500)
  assert.equal(after.effects.saved, 1)
})
test('growth adds two different capabilities sequentially and retains the created building', () => {
  assert.equal(getStoryFrame(4, 0).layers.history[7], 0)
  assert.equal(getStoryFrame(4, 0.23).layers.history[7], 1)
  assert.equal(getStoryFrame(4, 0.23).layers.collection[7], 0)
  const result = getStoryFrame(4, 1)
  assert.equal(result.layers.collection[7], 1)
  assert.equal(result.effects.saved, 1)
  assert.equal(result.effects.tower, 1)
})

test('the projected saved result survives adaptation, growth and the ending', () => {
  for (let chapter = 3; chapter < 6; chapter++) {
    for (const progress of [0, 0.5, 1])
      assert.equal(getStoryFrame(chapter, progress).effects.published, 1)
  }
})

test('replacement changes the drawing only after the new behavior has seated', () => {
  assert.equal(getStoryFrame(3, 0).effects.tower, 0)
  assert.equal(getStoryFrame(3, 0.45).effects.tower, 0)
  assert.equal(getStoryFrame(3, 0.45).layers.replacement[0], 0)
  assert.equal(getStoryFrame(3, 0.83).effects.tower, 1)
  assert.equal(getStoryFrame(3, 1).effects.tower, 1)
  assert.equal(getStoryFrame(4, 1).effects.tower, 1)
  assert.equal(getStoryFrame(5, 1).effects.tower, 1)
})
