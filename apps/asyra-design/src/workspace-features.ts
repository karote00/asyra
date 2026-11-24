import { PrimaryToolType } from './constants/tools'
// Each embedded workspace has its own app module graph and Core instance.
let disabled = new Set<string>()
export let defaultPrimaryTool: string = PrimaryToolType.SELECT

export type DisabledCommandBehavior = 'ignore' | 'reject'

export function featureEnabled(
  id: string,
  behavior: DisabledCommandBehavior = 'ignore'
) {
  if (!disabled.has(id)) {
    return true
  }

  if (behavior === 'reject') {
    throw new Error('Disabled Design feature: ' + id)
  }

  return false
}

export const toolId = (tool: string) =>
  tool === PrimaryToolType.RECTANGLE ? 'rectangle' : tool

export function setDisabledFeatures(ids: readonly string[]) {
  disabled = new Set(ids)
  defaultPrimaryTool = disabled.has(PrimaryToolType.SELECT)
    ? 'none'
    : PrimaryToolType.SELECT
}
