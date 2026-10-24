import { expect, it } from 'vitest'
import { RecordingRenderEngine } from '../testing/recording-render-engine.js'
import { UnsupportedRenderEngineCapabilityError } from '../errors.js'
import { isSpatialQuery } from '../spatial.js'
it('keeps spatial queries distinct and rejects them on the non-spatial recording engine', () => {
  const engine = new RecordingRenderEngine({ name: 'query-test' })
  engine.initialize({ host: {}, width: 100, height: 100 })
  expect(isSpatialQuery({ type: 'spatial-project', point: [0, 0, 0] })).toBe(
    true
  )
  expect(isSpatialQuery({ type: 'hit-test', point: { x: 0, y: 0 } })).toBe(
    false
  )
  expect(() =>
    engine.query({ type: 'spatial-project', point: [0, 0, 0] })
  ).toThrow(UnsupportedRenderEngineCapabilityError)
  expect(
    engine.query({ type: 'hit-test', point: { x: 0, y: 0 } })
  ).toMatchObject({ type: 'hit', target: null })
  engine.destroy()
})
