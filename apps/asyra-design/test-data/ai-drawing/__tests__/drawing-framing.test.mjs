import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createDrawingFraming } from '../drawing-framing.mjs'

const setup = () => {
  let change, frame
  const state = {
    settled: true,
    bounds: { minX: 10, minY: 10, maxX: 50, maxY: 50 },
    viewport: { x: 0, y: 0, scale: 1 },
    reads: 0,
    fits: 0,
    stops: 0
  }
  const framing = createDrawingFraming({
    observeChanges: (listener) => {
      change = listener

      return () => {
        state.stops++
      }
    },

    observeFrames: (listener) => {
      frame = listener

      return () => {
        state.stops++
      }
    },

    isSettled: () => state.settled,

    readBounds: () => {
      state.reads++

      return state.bounds
    },

    readArea: () => ({ x: 0, y: 0, width: 100, height: 100 }),

    readViewport: () => ({ ...state.viewport }),

    fit: () => {
      state.fits++
      state.viewport = { x: 0, y: 0, scale: 0.001 }
    }
  })

  return {
    state,
    framing,

    change: () => change(),

    frame: () => frame()
  }
}

test('coalesces settled rendered changes, detects same-count movement and skips idle bounds work', () => {
  const f = setup()

  assert.equal(f.framing.tick().status, 'pending')
  assert.equal(f.state.reads, 0)
  f.frame()
  assert.equal(f.framing.tick().status, 'visible')
  for (let i = 0; i < 20; i++) {
    f.framing.tick()
  }

  assert.equal(f.state.reads, 1)
  f.state.bounds.maxY = 500
  f.change()
  f.change()
  f.change()
  assert.equal(f.framing.tick().status, 'pending')
  f.frame()
  f.state.settled = false
  assert.equal(f.framing.tick().status, 'pending')
  f.state.settled = true
  assert.equal(f.framing.tick().status, 'fitted')
  assert.equal(f.state.reads, 2)
  assert.equal(f.state.fits, 1)
  assert.equal(f.framing.tick().status, 'idle')
  f.state.bounds.minX = -1000
  f.change()
  f.frame()
  assert.equal(f.framing.tick().status, 'fitted')
  assert.equal(f.state.reads, 3)
})

test('preserves deliberate detail navigation until explicit resume and detaches on dispose', () => {
  const f = setup()

  f.frame()
  f.framing.tick()
  f.state.viewport.scale = 10
  f.change()
  f.frame()
  assert.equal(f.framing.tick().status, 'paused')
  assert.equal(f.state.reads, 1)
  assert.equal(f.state.fits, 0)
  f.framing.resume()
  assert.equal(f.framing.tick().status, 'fitted')
  f.framing.dispose()
  f.framing.dispose()
  assert.equal(f.state.stops, 2)
  assert.equal(f.framing.tick().status, 'disposed')
})
