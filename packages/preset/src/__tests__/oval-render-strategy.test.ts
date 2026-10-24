import { expect, it } from 'vitest'
import { RenderGraphics } from '@asyra/render'
import { createDefaultFill, getElementGeometryLocalBounds } from '@asyra/utils'
import { OVAL_RENDER_STRATEGY } from '../components/oval.js'

it('renders canonical oval rotation and retains analytic local selection and hit geometry', () => {
  const graphic = new RenderGraphics()
  const data = {
    id: 'oval',
    type: 'oval',
    name: 'Oval',
    parentId: 'workspace',
    visible: true,
    lock: false,
    x: 12,
    y: 20,
    width: 80,
    height: 30,
    rotation: 0.63,
    fills: [createDefaultFill({ color: '#123456' })],
    strokes: []
  }
  OVAL_RENDER_STRATEGY(graphic, data)
  expect(graphic.rotation).toBe(data.rotation)
  expect(graphic.x).toBe(data.x)
  expect(graphic.y).toBe(data.y)
  expect(getElementGeometryLocalBounds(graphic)).toEqual({
    x: 0,
    y: 0,
    width: 80,
    height: 30
  })
  expect(graphic.hitArea?.contains(40, 15)).toBe(true)
  expect(graphic.hitArea?.contains(0, 0)).toBe(false)
  OVAL_RENDER_STRATEGY(graphic, { ...data, rotation: 0 })
  expect(graphic.rotation).toBe(0)
})
