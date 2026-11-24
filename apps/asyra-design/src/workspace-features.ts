import { PrimaryToolType } from './constants/tools'
// Each embedded workspace has its own app module graph and Core instance.
let disabled = new Set<string>()

export const featureEnabled = (id: string) => !disabled.has(id)

export function requireFeature(id: string) {
  if (!featureEnabled(id)) {
    throw new Error('Disabled Design feature: ' + id)
  }
}

export const toolId = (tool: string) =>
  tool === PrimaryToolType.RECTANGLE ? 'rectangle' : tool

export function setDisabledFeatures(ids: readonly string[]) {
  disabled = new Set(ids)
}
