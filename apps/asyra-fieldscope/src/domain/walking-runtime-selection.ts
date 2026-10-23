import {
  readActiveWalkingRobotDefinition,
  type WalkingRobotDefinition
} from './walking-robot-definition'

export const WALKING_RUNTIME_SELECTION_FORMAT =
  'walking-runtime-selection/1' as const

export type WalkingRuntimeSelection =
  | Readonly<{
      format: typeof WALKING_RUNTIME_SELECTION_FORMAT
      mode: 'legacy-view'
    }>
  | Readonly<{
      format: typeof WALKING_RUNTIME_SELECTION_FORMAT
      mode: 'walking-active'
      definition: WalkingRobotDefinition
    }>

export type ActiveWalkingRuntimeSelection = Extract<
  WalkingRuntimeSelection,
  { mode: 'walking-active' }
>

const admitted = new WeakSet<object>()
const invalid = (): never => {
  throw new Error('Invalid walking runtime selection')
}
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const exact = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key))

export const DEFAULT_WALKING_RUNTIME_SELECTION: WalkingRuntimeSelection =
  Object.freeze({
    format: WALKING_RUNTIME_SELECTION_FORMAT,
    mode: 'legacy-view'
  })

admitted.add(DEFAULT_WALKING_RUNTIME_SELECTION)

export function createWalkingRuntimeSelection(
  definition: WalkingRobotDefinition
): ActiveWalkingRuntimeSelection {
  const selection = Object.freeze({
    format: WALKING_RUNTIME_SELECTION_FORMAT,
    mode: 'walking-active' as const,
    definition: readActiveWalkingRobotDefinition(definition)
  })
  admitted.add(selection)
  return selection
}

export function readWalkingRuntimeSelection(
  raw: unknown
): WalkingRuntimeSelection {
  if (record(raw) && admitted.has(raw)) return raw as WalkingRuntimeSelection
  if (
    !record(raw) ||
    raw.format !== WALKING_RUNTIME_SELECTION_FORMAT ||
    (raw.mode !== 'legacy-view' && raw.mode !== 'walking-active')
  )
    return invalid()
  if (raw.mode === 'legacy-view') {
    if (!exact(raw, ['format', 'mode'])) return invalid()
    return DEFAULT_WALKING_RUNTIME_SELECTION
  }
  if (!exact(raw, ['format', 'mode', 'definition'])) return invalid()
  const selection = Object.freeze({
    format: WALKING_RUNTIME_SELECTION_FORMAT,
    mode: 'walking-active' as const,
    definition: readActiveWalkingRobotDefinition(raw.definition)
  })
  admitted.add(selection)
  return selection
}
