import assert from 'node:assert/strict'
import test from 'node:test'
import { getStoryFrame } from '../lib/spatial-story.mjs'

test('every chapter inherits the exact outgoing composition and camera', () => {
  for (let chapter = 0; chapter < 5; chapter++) {
    const before = getStoryFrame(chapter, 1)
    const after = getStoryFrame(chapter + 1, 0)
    assert.deepEqual(
      after.layers,
      before.layers,
      `chapter ${chapter + 1} resets the composition`
    )
    assert.deepEqual(after.camera, before.camera)
  }
})
