import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createScrollDriver,
  getStoryFrame,
  layerTransform
} from '../lib/spatial-story.mjs'

test('the cumulative scene is finite, continuous and reversible at every sampled depth', () => {
  let previous = getStoryFrame(0, 0)
  for (let step = 0; step <= 6000; step++) {
    const time = step / 1000
    const chapter = Math.min(5, Math.floor(time))
    const frame = getStoryFrame(chapter, time - chapter)
    assert.ok(frame.camera.every(Number.isFinite))
    for (const [id, pose] of Object.entries(frame.layers)) {
      assert.ok(pose.every(Number.isFinite))
      assert.ok(pose[7] >= 0 && pose[7] <= 1)
      for (let axis = 0; axis < 3; axis++)
        assert.ok(
          Math.abs(pose[axis] - previous.layers[id][axis]) < 5,
          `${id} jumps at ${time}`
        )
      assert.match(layerTransform(pose), /rotateX/)
    }
    previous = frame
  }
  const a = getStoryFrame(3, 0.52)
  getStoryFrame(5, 0.9)
  assert.deepEqual(getStoryFrame(3, 0.52), a)
})

test('static snapshots show the complete local result', () => {
  for (let chapter = 0; chapter < 6; chapter++)
    assert.deepEqual(getStoryFrame(chapter, 0, true), getStoryFrame(chapter, 1))
})

function harness() {
  const queue = new Map()
  const frames = []
  let identifier = 0
  const driver = createScrollDriver({
    requestFrame: (callback) => {
      queue.set(++identifier, callback)
      return identifier
    },
    cancelFrame: (id) => queue.delete(id),
    render: (frame) => frames.push(frame)
  })
  return {
    driver,
    frames,
    queue,
    flush() {
      const callbacks = [...queue.values()]
      queue.clear()
      callbacks.forEach((f) => f())
    }
  }
}
test('one scene renders only the latest input once per frame, stays idle and retraces chapters', () => {
  const h = harness()
  h.driver.update(0, 0.2)
  h.flush()
  for (let i = 0; i < 100; i++) h.driver.update(2, i / 100)
  assert.equal(h.queue.size, 1)
  h.flush()
  assert.equal(h.frames.length, 2)
  assert.deepEqual(h.frames.at(-1), getStoryFrame(2, 0.99))
  h.driver.update(2, 0.99)
  assert.equal(h.queue.size, 0)
  h.driver.update(0, 0.2)
  h.flush()
  assert.equal(h.frames.length, 3)
  assert.deepEqual(h.frames.at(-1), getStoryFrame(0, 0.2))
  h.driver.update(4, 0.5)
  h.driver.update(0, 0.2)
  h.flush()
  assert.deepEqual(h.frames.at(-1), getStoryFrame(0, 0.2))
})
test('retired drivers cancel pending work and reject late callbacks', () => {
  const h = harness()
  h.driver.update(0, 0.5)
  const late = [...h.queue.values()][0]
  h.driver.dispose()
  late()
  h.driver.update(1, 0.7)
  assert.equal(h.frames.length, 0)
  assert.equal(h.queue.size, 0)
})

test('a shared boundary retains the visual pose while advancing the semantic chapter', () => {
  const h = harness()
  h.driver.update(2, 1)
  h.flush()
  h.driver.update(3, 0)
  h.flush()
  assert.equal(h.frames.length, 2)
  assert.equal(h.frames.at(-1).chapter, 3)
  assert.deepEqual(h.frames[0].layers, h.frames[1].layers)
})
