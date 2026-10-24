import type { PreparedElementDescriptor } from '../common-apis/element/types'

// Supported semantic wire kinds, not a replacement for Core's runtime capability
// registry. Extending this format requires preparation and admission support.
export const DesignContainerTypes = ['group', 'frame'] as const
export const DesignNodeTypes = [
  ...DesignContainerTypes,
  'rect',
  'oval',
  'text',
  'vector'
] as const
export const isDesignContainerType = (type: unknown): boolean =>
  DesignContainerTypes.some((kind) => kind === type)

export const PREPARED_DESIGN_VERSION = 1 as const
export const DesignPreparationLimits = Object.freeze({
  nodes: 1000,
  expandedNodes: 10000,
  expandedPathCommands: 200000,
  depth: 12,
  textCharacters: 100000,
  pathCommands: 20000,
  dimension: 100000,
  relations: 256,
  checks: 64,
  retainedTargetBytes: 8 * 1024 * 1024,
  retainedDrafts: 4,
  recoveryParts: 128,
  retainedDraftBytes: 8 * 1024 * 1024
})
export interface PreparedDesignEntry {
  readonly key: string
  readonly parentId: string | null
  readonly descriptor: PreparedElementDescriptor
}
export type DesignFinding =
  | Readonly<{
      kind: 'overflow'
      key: string
      left: number
      top: number
      right: number
      bottom: number
    }>
  | Readonly<{ kind: 'text-metrics-required'; key: string }>
  | Readonly<{
      kind: 'requirement'
      key: string
      property: string
      expected: number
      actual: number
      tolerance: number
    }>
export interface PreparedDesign {
  readonly continuation?: Readonly<{
    anchor: Readonly<{ id: string; x: number; y: number; rotation?: number }>
  }>
  readonly version: typeof PREPARED_DESIGN_VERSION
  readonly rootId: string
  readonly entries: readonly PreparedDesignEntry[]
  readonly keyToId: Readonly<Record<string, string>>
  readonly findings: readonly DesignFinding[]
}

export const PREPARED_DESIGN_DELIVERY_VERSION = 3 as const
export const PreparedVectorRecordFields = [
  'points',
  'segments',
  'networks'
] as const
type PreparedVectorRecordDelivery = Readonly<Record<string, unknown>> & {
  readonly id?: never
}

function deliverVectorRecords(
  input: unknown
): Record<string, PreparedVectorRecordDelivery> {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Prepared vector identity map is invalid.')
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => {
      if (
        !value ||
        typeof value !== 'object' ||
        Array.isArray(value) ||
        value.id !== key
      )
        throw new Error('Prepared vector identity is inconsistent.')
      const { id: _id, ...record } = value
      return [key, record]
    })
  )
}
export interface PreparedDesignDelivery extends Omit<
  PreparedDesign,
  'version' | 'entries' | 'keyToId'
> {
  readonly version: typeof PREPARED_DESIGN_DELIVERY_VERSION
  readonly entries: readonly (Omit<PreparedDesignEntry, 'descriptor'> & {
    readonly descriptor: Omit<PreparedElementDescriptor, 'props'> & {
      readonly props: readonly string[]
    }
  })[]
}

/** Project identities without cloning retained values or recompiling geometry. */
export function deliverPreparedDesign(
  design: PreparedDesign
): PreparedDesignDelivery {
  const { keyToId, entries, ...rest } = design
  if (Object.keys(keyToId).length !== entries.length)
    throw new Error('Prepared design identity map is inconsistent.')
  const keys = new Set<string>()
  return {
    ...rest,
    version: PREPARED_DESIGN_DELIVERY_VERSION,
    entries: entries.map((entry) => {
      const { props, ...descriptor } = entry.descriptor
      if (keys.has(entry.key) || keyToId[entry.key] !== descriptor.id)
        throw new Error('Prepared design identity map is inconsistent.')
      keys.add(entry.key)
      const names = Object.keys(props)
      if (names.some((name) => props[name] !== `${descriptor.id}-${name}`))
        throw new Error('Prepared design property identity is inconsistent.')
      const vector =
        descriptor.type === 'vector'
          ? Object.fromEntries(
              PreparedVectorRecordFields.map((field) => [
                field,
                deliverVectorRecords(descriptor[field])
              ])
            )
          : {}
      return {
        ...entry,
        descriptor: { ...descriptor, ...vector, props: names }
      }
    })
  }
}

// Semantic draft defaults are wire values, independent of Framework runtime
// installation. Browser admission remains the canonical schema authority.
export const DesignTextDefaults = Object.freeze({
  text: '',
  textSizing: 'fixed',
  fontFamily: 'sans-serif',
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'left',
  lineHeight: 20,
  letterSpacing: 0
})
const finiteTextRange = (value: unknown, min: number, max: number) =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max
export const DesignTextValidators: Readonly<
  Record<keyof typeof DesignTextDefaults, (value: unknown) => boolean>
> = Object.freeze({
  text: (value: unknown) =>
    typeof value === 'string' &&
    value.length <= DesignPreparationLimits.textCharacters,
  textSizing: (value: unknown) =>
    value === 'fixed' || value === 'auto-width' || value === 'auto-height',
  fontFamily: (value: unknown) =>
    typeof value === 'string' && value.trim().length > 0 && value.length <= 128,
  fontSize: (value: unknown) => finiteTextRange(value, Number.MIN_VALUE, 4096),
  fontWeight: (value: unknown) => value === 'normal' || value === 'bold',
  fontStyle: (value: unknown) => value === 'normal' || value === 'italic',
  textAlign: (value: unknown) =>
    value === 'left' || value === 'center' || value === 'right',
  lineHeight: (value: unknown) =>
    finiteTextRange(value, Number.MIN_VALUE, 8192),
  letterSpacing: (value: unknown) => finiteTextRange(value, -100, 100)
})
