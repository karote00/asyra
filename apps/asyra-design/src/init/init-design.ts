import { applyPreset } from '@asyra/preset'
import { initText } from './capabilities/init-text'
import core from '../contexts'
import { initAreaSelection } from './capabilities/init-area-selection'
import { initGradientFillEditing } from './capabilities/init-gradient-fill-editing'
import { initVectorIconData } from './capabilities/init-vector-icon-data'
import { initLoadDiagnostics } from './diagnostics/init-load-diagnostics'
import { initCanvasPipelineDebugger } from './diagnostics/init-canvas-pipeline-debugger'
import { initPathEditingContinuation } from './derived-state/init-path-editing-continuation'
import { initInputSystem } from './foundation/init-input-system'
import { configureWorkspaceFeatures } from './workspace-features'
import '../features'

interface DesignComposition {
  disabledFeatures?: readonly string[]
  initProgress?: () => void
}

export function initDesign({
  disabledFeatures,
  initProgress
}: DesignComposition = {}) {
  applyPreset(core)
  initText(core)

  // DEV runtime diagnostics are loaded from an optional package subpath.
  void initCanvasPipelineDebugger()

  // Diagnostics: subscribe once to core load diagnostics and route reports to app-level handlers.
  initLoadDiagnostics()

  // Derived-state syncs.
  // Derive Pen continuation from canonical selection and topology.
  initPathEditingContinuation()

  // Capability init.
  initAreaSelection()
  initProgress?.()
  initGradientFillEditing()
  initVectorIconData()

  // Foundation init.
  initInputSystem()
  if (disabledFeatures?.length) {
    configureWorkspaceFeatures(disabledFeatures)
  }
}
