import type { FillAttrs } from '@asyra/utils'

export const FILL_PATCH_KEYS = [
  'kind',
  'defaultColorFormat',
  'colorFormat',
  'color',
  'opacity',
  'visible',
  'gradient'
] as const satisfies readonly Exclude<keyof FillAttrs, 'id' | 'type'>[]

export type FillWritableKey = (typeof FILL_PATCH_KEYS)[number]
