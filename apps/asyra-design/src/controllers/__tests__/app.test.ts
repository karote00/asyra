import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getFeature: vi.fn()
}))

vi.mock('@asyra/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@asyra/core')>()),
  getFeature: mocks.getFeature
}))

import * as appController from '../app'

describe('App controller boundary', () => {
  it('exposes only tool intent and no renderer lifecycle authority', () => {
    expect(Object.keys(appController)).toEqual(['switchPrimaryTool'])
    const switchTool = vi.fn()

    mocks.getFeature.mockReturnValue({ switch: switchTool })
    appController.switchPrimaryTool('select')
    expect(switchTool).toHaveBeenCalledWith('select')
  })

  it('does not expose a local-only document Reset adapter', () => {
    expect(appController).not.toHaveProperty('resetData')
  })
})
