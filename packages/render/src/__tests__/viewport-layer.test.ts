import { describe, expect, it, vi } from 'vitest'
import { RenderLayer } from '../layers/scene/index.js'
import { ViewportLayer } from '../layers/viewport/index.js'
import type { RenderElementData } from '../types.js'

describe('ViewportLayer', () => {
  it('reports the exact number of projected RenderLayer elements without exposing the map', () => {
    const projectedElements = new Map([
      ['group-1', {}],
      ['vector-1', {}]
    ])
    const getAllElementsSpy = vi
      .spyOn(RenderLayer.prototype, 'getAllElements')
      .mockReturnValue(projectedElements as never)
    const viewport = new ViewportLayer()

    expect(viewport.getProjectedElementCount()).toBe(2)
    expect(getAllElementsSpy).toHaveBeenCalledOnce()
  })

  it('forwards the committed sibling index when adding an element', () => {
    const data = {
      id: 'indexed-element',
      type: 'rectangle',
      visible: true
    } as unknown as RenderElementData
    const addElementSpy = vi
      .spyOn(RenderLayer.prototype, 'addElement')
      .mockReturnValue(undefined)
    const viewport = new ViewportLayer()

    viewport.addElement(data, 2)

    expect(addElementSpy).toHaveBeenCalledWith(data, 2)
  })
})

describe('ViewportLayer fitBounds', () => {
  it.each([
    { name: 'portrait', width: 100, height: 1000 },
    { name: 'landscape', width: 1000, height: 100 }
  ])('centers $name content in the visible viewport', ({ width, height }) => {
    const viewport = new ViewportLayer()
    viewport.fitBounds(
      { minX: -350, minY: 120, maxX: -350 + width, maxY: 120 + height },
      { minX: 240, minY: 48, maxX: 1440, maxY: 848 },
      20
    )
    const scale = viewport.getScale()
    const position = viewport.getPosition()
    expect((-350 + width / 2) * scale + position.x).toBeCloseTo(840)
    expect((120 + height / 2) * scale + position.y).toBeCloseTo(448)
    expect(scale).toBeCloseTo(Math.min(1160 / width, 760 / height))
  })
})
