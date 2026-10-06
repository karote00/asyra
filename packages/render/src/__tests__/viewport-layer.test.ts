import { describe, expect, it, vi } from 'vitest'
import { RenderLayer } from '../layers/scene/index.js'
import { ViewportLayer } from '../layers/viewport/index.js'
import type { RenderElementData } from '../types.js'
import { RenderEngineCapabilities } from '@asyra/render-engine'
import { RecordingRenderEngine } from '@asyra/render-engine/testing'
import { RenderContainer, RenderObjectRuntime } from '../types/render-object.js'

describe('ViewportLayer', () => {
  it('isolates camera transforms without grouping ordinary containers or redrawing geometry', () => {
    const engine = new RecordingRenderEngine({ name: 'camera-contract' })
    const initialized = engine.initialize({ host: {}, width: 100, height: 100 })
    const runtime = new RenderObjectRuntime(engine, initialized.root)
    const viewport = new ViewportLayer()
    const overlay = new RenderContainer()
    runtime.attachRoot(viewport.view)
    runtime.attachRoot(overlay)
    expect(viewport.view.getEngineProperties().transformGroup).toBe(true)
    expect(overlay.getEngineProperties().transformGroup).toBe(false)
    const created = engine
      .getOperations()
      .find((operation) => operation.type === 'create-object')
    expect(
      created?.type === 'create-object' &&
        created.command.type === 'create-object' &&
        created.command.properties?.transformGroup
    ).toBe(true)
    viewport.view.transformGroup = false
    const updated = engine.getOperations().at(-1)
    expect(
      updated?.type === 'update-object' &&
        updated.command.type === 'update-object' &&
        updated.command.properties.transformGroup
    ).toBe(false)
    viewport.view.transformGroup = true
    const start = engine.getOperations().length
    viewport.panTo(25, 50)
    viewport.zoomTo(2)
    expect(
      engine
        .getOperations()
        .slice(start)
        .map((command) => command.type)
    ).toEqual(['update-object', 'update-object'])
    expect(overlay.worldTransform.tx).toBe(0)
    expect(viewport.view.worldTransform.apply({ x: 10, y: 20 })).toEqual({
      x: 45,
      y: 90
    })
  })
  it('keeps optional transform hints out of engines that do not advertise them', () => {
    const engine = new RecordingRenderEngine({
      name: 'strict-camera',
      capabilities: [RenderEngineCapabilities.OBJECTS]
    })
    const execute = engine.execute.bind(engine)
    engine.execute = (command) => {
      if (
        command.type === 'create-object' ||
        command.type === 'update-object'
      ) {
        if ('transformGroup' in (command.properties ?? {}))
          throw new Error('Unsupported transformGroup')
      }
      return execute(command)
    }
    const initialized = engine.initialize({ host: {}, width: 100, height: 100 })
    const runtime = new RenderObjectRuntime(engine, initialized.root)
    const viewport = new ViewportLayer()
    runtime.attachRoot(viewport.view)
    const start = engine.getOperations().length
    viewport.view.transformGroup = false
    viewport.view.transformGroup = true
    expect(engine.getOperations()).toHaveLength(start)
    viewport.panTo(25, 50)
    viewport.zoomTo(2)
    expect(
      engine
        .getOperations()
        .slice(start)
        .map((command) => command.type)
    ).toEqual(['update-object', 'update-object'])
    expect(viewport.view.worldTransform.apply({ x: 10, y: 20 })).toEqual({
      x: 45,
      y: 90
    })
  })
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
