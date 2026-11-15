import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  initFeatureSystem: vi.fn(),
  registerAiAgentFeature: vi.fn()
}))

vi.mock('../../../contexts', () => ({
  default: {
    initFeatureSystem: mocks.initFeatureSystem
  },
  inputSystem: {},
  systemContext: {}
}))

vi.mock('../../../features/ai-agent', () => ({
  registerAiAgentFeature: mocks.registerAiAgentFeature
}))

import { initFeatures } from '../init-features'

describe('production Feature initialization', () => {
  beforeEach(() => {
    mocks.initFeatureSystem.mockReset()
    mocks.registerAiAgentFeature.mockReset()
  })

  it('registers the App runtime without repeating Core-owned feature initialization', () => {
    const runtime = {
      run: vi.fn()
    }

    const registration = {
      api: { execute: vi.fn(), cancel: vi.fn() },
      dispose: vi.fn()
    }

    mocks.registerAiAgentFeature.mockReturnValueOnce(registration)
    const initialized = initFeatures({ aiRuntime: runtime })

    expect(initialized.ai).toBe(registration)
    initialized.ai.dispose()
    expect(registration.dispose).toHaveBeenCalledOnce()

    expect(mocks.initFeatureSystem).not.toHaveBeenCalled()
    expect(mocks.registerAiAgentFeature).toHaveBeenCalledOnce()
    expect(mocks.registerAiAgentFeature).toHaveBeenCalledWith(runtime)
  })
})
