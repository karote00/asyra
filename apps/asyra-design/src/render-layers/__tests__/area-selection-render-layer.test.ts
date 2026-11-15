import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import {
  RenderContainer,
  RenderGraphics,
  type RenderLayerRegistration
} from '@asyra/render'
import type { PositionData } from '@asyra/utils'
import core from '../../contexts'
import type { AreaSelectionState } from '../../common-apis/system-context'
import { registerAreaSelectionRenderLayer } from '../area-selection-render-layer'

const layers: RenderLayerRegistration[] = []
const selection: AreaSelectionState = {
  additive: false,
  dragStart: { x: 10, y: 20 },
  dragCurrent: { x: 30, y: 50 }
}
let scale = 1
let offset = { x: 0, y: 0 }
const project = vi.fn((point: PositionData) => ({
  x: point.x * scale + offset.x,
  y: point.y * scale + offset.y
}))

beforeAll(() => {
  core.defineSystemProperty<AreaSelectionState | null>('areaSelection', null)
})
beforeEach(() => {
  scale = 1
  offset = { x: 0, y: 0 }
  project.mockClear()
  core.setSystemProperty('areaSelection', selection)
  registerAreaSelectionRenderLayer(
    (registration) => {
      layers.push(registration)
    },
    {
      systemProperties: core,
      viewportApis: { getCanvasPositionFromWorkspace: project }
    }
  )
})
afterEach(() => {
  for (const { layer } of layers.splice(0)) {
    if (layer instanceof RenderContainer) {
      layer.destroy({ children: true })
    }
  }

  vi.restoreAllMocks()
})

it.each(['scale', 'pan'] as const)(
  'redraws retained workspace endpoints after viewport %s changes',
  (kind) => {
    const draw = vi.spyOn(RenderGraphics.prototype, 'moveTo')
    const line = vi.spyOn(RenderGraphics.prototype, 'lineTo')
    const update = layers[0].update

    expect(update?.()).toBe(true)
    expect(draw).toHaveBeenCalledWith(10, 20)
    draw.mockClear()
    line.mockClear()
    if (kind === 'scale') {
      scale = 2
    } else {
      offset = { x: 7, y: -4 }
    }

    expect(update?.()).toBe(true)
    expect(draw).toHaveBeenCalledWith(
      kind === 'scale' ? 20 : 17,
      kind === 'scale' ? 40 : 16
    )
    expect(line).toHaveBeenCalledWith(
      kind === 'scale' ? 60 : 37,
      kind === 'scale' ? 100 : 46
    )
    expect(project).toHaveBeenCalledTimes(4)
  }
)

it('reuses unchanged screen geometry and clears ended selections before drawing a new one', () => {
  const clear = vi.spyOn(RenderGraphics.prototype, 'clear')
  const update = layers[0].update

  expect(update?.()).toBe(true)
  clear.mockClear()
  expect(update?.()).toBe(false)
  expect(clear).not.toHaveBeenCalled()
  core.setSystemProperty('areaSelection', null)
  expect(update?.()).toBe(true)
  expect(clear).toHaveBeenCalledOnce()
  expect(update?.()).toBe(false)
  core.setSystemProperty('areaSelection', selection)
  expect(update?.()).toBe(true)
  expect(clear).toHaveBeenCalledTimes(2)
})
