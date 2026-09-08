import { hasExactOwnKeys, isPlainRecord } from './records'
import type {
  TrajectoryJointUnit,
  TrajectoryTimeUnit
} from './trajectory-source'

export interface TrajectoryCsvMappingDraft {
  time: { column: string; unit: TrajectoryTimeUnit | '' }
  joints: Readonly<
    Record<string, { column: string; unit: TrajectoryJointUnit | '' }>
  >
}

/** Authored source is document data, including incomplete syntax and declarations. */
export interface TrajectoryInput {
  version: 1
  kind: 'csv' | 'json'
  text: string
  mapping: TrajectoryCsvMappingDraft
}

export function validTrajectoryInput(input: unknown): input is TrajectoryInput {
  if (
    !hasExactOwnKeys(input, ['version', 'kind', 'text', 'mapping']) ||
    input.version !== 1 ||
    (input.kind !== 'csv' && input.kind !== 'json') ||
    typeof input.text !== 'string' ||
    new TextEncoder().encode(input.text).length >
      (input.kind === 'csv' ? 8 : 1) * 1024 * 1024 ||
    !hasExactOwnKeys(input.mapping, ['time', 'joints']) ||
    !isPlainRecord(input.mapping.joints) ||
    Object.keys(input.mapping.joints).length > 256
  )
    return false
  const entry = (value: unknown, units: readonly string[]) =>
    hasExactOwnKeys(value, ['column', 'unit']) &&
    typeof value.column === 'string' &&
    value.column.length <= 1000 &&
    typeof value.unit === 'string' &&
    units.includes(value.unit)
  return (
    entry(input.mapping.time, ['', 's', 'ms']) &&
    Object.entries(input.mapping.joints).every(
      ([id, value]) =>
        id.length > 0 &&
        id.length <= 200 &&
        entry(value, ['', 'rad', 'deg', 'm', 'mm'])
    )
  )
}
