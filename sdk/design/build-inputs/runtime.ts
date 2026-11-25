import { start } from './canvas-engine.js'

// The build bundles this factory inside a fresh module scope for each borrowed canvas.
export function createRuntime() {
  return { start }
}
