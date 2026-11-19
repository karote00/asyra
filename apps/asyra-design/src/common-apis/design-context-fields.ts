import type { Rect } from '@asyra/utils'

export interface DesignContextQuery {
  scope: 'selection' | 'children' | 'ids' | 'region'
  expectedCount?: number
  allMatches?: boolean
  result?: 'elements' | 'ids'
  bounds?: Rect
  filter?: {
    name?: { equals?: string; prefix?: string; suffix?: string }
    type?: string
    parentId?: string
    ancestorId?: string
    locked?: boolean
  }
  elementIds?: string[]
  fields?: string[]
  parentId?: string
  offset?: number
  limit?: number
}
/** Canonical context column and page limits shared by browser and server admission. */
export const designContextPageLimit = 200

export const designContextFields = Object.freeze([
  'x',
  'y',
  'width',
  'height',
  'rotation',
  'text',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'textAlign',
  'lineHeight',
  'letterSpacing',
  'fills',
  'strokes'
])
