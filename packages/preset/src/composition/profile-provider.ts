import { createPixiRenderEngine } from '@asyra/render-engine-pixi'
import { PresetCatalog } from '../catalog.js'
import { PRESET_APPLY_ERROR_CODES, PresetProfiles } from '../constants.js'
import type { PresetCoreAPIs, PresetProfile } from '../types.js'
import { PresetApplyError } from './error.js'
import { createSpatialRenderEngine } from '../spatial/lazy-engine.js'
import type { SpatialPresentationOptions } from '../spatial/lighting.js'

export interface PresetProfileProviderResult {
  readonly presetEngineId: string | null
  readonly cleanup: (() => void) | null
}

export const bindPresetProfileProvider = (
  core: Pick<PresetCoreAPIs, 'setRenderEngineProvider'>,
  profile: PresetProfile,
  spatial?: SpatialPresentationOptions
): PresetProfileProviderResult => {
  const descriptor = PresetCatalog.profiles.find(({ id }) => id === profile)
  if (!descriptor?.available) {
    throw new PresetApplyError(
      PRESET_APPLY_ERROR_CODES.UNAVAILABLE_PROFILE,
      `Preset profile "${profile}" is unavailable`
    )
  }

  if (profile === PresetProfiles.CUSTOM) {
    return Object.freeze({ presetEngineId: null, cleanup: null })
  }

  try {
    const spatialProvider = spatial
      ? () => createSpatialRenderEngine({}, spatial)
      : createSpatialRenderEngine
    const cleanup = core.setRenderEngineProvider(
      profile === PresetProfiles['3D']
        ? spatialProvider
        : createPixiRenderEngine
    )
    return Object.freeze({
      presetEngineId: descriptor.presetEngineId,
      cleanup
    })
  } catch (cause) {
    throw new PresetApplyError(
      PRESET_APPLY_ERROR_CODES.ENGINE_PROVIDER_CONFLICT,
      'Core rejected the preset render engine provider',
      { cause }
    )
  }
}
