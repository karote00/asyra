import type { PreparedElementDescriptor } from '../common-apis/element/types'

export const PREPARED_DESIGN_VERSION = 1 as const
export const DesignPreparationLimits = Object.freeze({
  nodes: 1000,
  depth: 12,
  textCharacters: 100000,
  pathCommands: 20000,
  dimension: 100000,
  artifacts: 8
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
export interface PreparedDesign {
  readonly version: typeof PREPARED_DESIGN_VERSION
  readonly rootId: string
  readonly entries: readonly PreparedDesignEntry[]
  readonly keyToId: Readonly<Record<string, string>>
  readonly findings: readonly DesignFinding[]
}

// Semantic draft defaults are wire values, independent of Framework runtime
// installation. Browser admission remains the canonical schema authority.
export const DesignTextDefaults = Object.freeze({
  text: '',
  fontFamily: 'sans-serif',
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'left',
  lineHeight: 20,
  letterSpacing: 0,
  textColor: '#000000'
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
  fontFamily: (value: unknown) =>
    typeof value === 'string' && value.trim().length > 0 && value.length <= 128,
  fontSize: (value: unknown) => finiteTextRange(value, Number.MIN_VALUE, 4096),
  fontWeight: (value: unknown) => value === 'normal' || value === 'bold',
  fontStyle: (value: unknown) => value === 'normal' || value === 'italic',
  textAlign: (value: unknown) =>
    value === 'left' || value === 'center' || value === 'right',
  lineHeight: (value: unknown) =>
    finiteTextRange(value, Number.MIN_VALUE, 8192),
  letterSpacing: (value: unknown) => finiteTextRange(value, -100, 100),
  textColor: (value: unknown) =>
    typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
})
