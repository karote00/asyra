import core from '../../contexts'
import type {
  ActiveGradientFillState,
  GradientHandleState,
  GradientStopState
} from '../../common-apis/system-context'
import { registerGradientFillHandlesRenderLayer } from '../../render-layers/gradient-fill-handles-render-layer'

let hasInit = false

export const initGradientFillEditing = () => {
  if (hasInit) {
    return
  }

  core.defineSystemProperty<ActiveGradientFillState | null>(
    'activeGradientFill',
    null
  )
  core.defineSystemProperty<GradientHandleState | null>(
    'hoveredGradientHandle',
    null
  )
  core.defineSystemProperty<GradientHandleState | null>(
    'selectedGradientHandle',
    null
  )

  core.defineSystemProperty<GradientStopState | null>(
    'hoveredGradientStop',
    null
  )
  core.defineSystemProperty<GradientStopState | null>(
    'selectedGradientStop',
    null
  )

  registerGradientFillHandlesRenderLayer(
    (registration, options) => core.registerRenderLayer(registration, options),
    {
      systemProperties: core
    }
  )

  hasInit = true
}
