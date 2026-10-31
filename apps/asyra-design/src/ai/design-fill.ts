import { FillGradientTypes, type FillGradientData } from '@asyra/utils'

export type DesignGradientData = FillGradientData

const color = { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' }
const unit = { type: 'number', minimum: 0, maximum: 1 }
const handle = { type: 'number', minimum: -10000, maximum: 10000 }
const gradientTypes = [FillGradientTypes.LINEAR]

// App wire admission is intentionally narrower than extensible canonical metadata.
export const designInlineFillSchema = {
  anyOf: [
    color,
    {
      type: 'object',
      additionalProperties: false,
      required: ['gradientType', 'gradientHandles', 'gradientStops'],
      properties: {
        gradientType: { enum: gradientTypes },
        gradientHandles: {
          type: 'array',
          minItems: 2,
          maxItems: 2,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['x', 'y'],
            properties: { x: handle, y: handle }
          }
        },
        gradientStops: {
          type: 'array',
          minItems: 2,
          maxItems: 64,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['position', 'color', 'opacity'],
            properties: { position: unit, color, opacity: unit }
          }
        }
      }
    }
  ],
  description:
    'Solid #RRGGBB or continuous native gradient. Handles: final 2D box (0..1), not world. Stops ascend; ties form hard edges. Patterns repeat gradients per projected box; no automatic 3D lighting.'
}

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
const exact = (v: Record<string, unknown>, keys: string[]) =>
  Object.keys(v).length === keys.length &&
  keys.every((k) => Object.hasOwn(v, k))
const finite = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max
const isColor = (v: unknown): v is string =>
  typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)

export const isDesignGradient = (v: unknown): v is DesignGradientData => {
  if (
    !record(v) ||
    !exact(v, ['gradientType', 'gradientHandles', 'gradientStops']) ||
    !gradientTypes.some((type) => type === v.gradientType) ||
    !Array.isArray(v.gradientHandles) ||
    v.gradientHandles.length !== 2 ||
    !v.gradientHandles.every(
      (p) =>
        record(p) &&
        exact(p, ['x', 'y']) &&
        finite(p.x, -10000, 10000) &&
        finite(p.y, -10000, 10000)
    ) ||
    !Array.isArray(v.gradientStops) ||
    v.gradientStops.length < 2 ||
    v.gradientStops.length > 64
  ) {
    return false
  }
  let previous = -1
  return v.gradientStops.every((s) => {
    if (
      !record(s) ||
      !exact(s, ['position', 'color', 'opacity']) ||
      !finite(s.position, 0, 1) ||
      s.position < previous ||
      !isColor(s.color) ||
      !finite(s.opacity, 0, 1)
    ) {
      return false
    }
    previous = s.position
    return true
  })
}

export const isDesignInlineFill = (
  v: unknown
): v is string | DesignGradientData => isColor(v) || isDesignGradient(v)

export const isDesignSharedFill = (v: unknown): v is { shared: string } =>
  record(v) &&
  exact(v, ['shared']) &&
  typeof v.shared === 'string' &&
  v.shared.trim().length > 0 &&
  v.shared.length <= 160

export const isDesignFillTemplate = (v: unknown): v is { template: string } =>
  record(v) &&
  exact(v, ['template']) &&
  typeof v.template === 'string' &&
  v.template.trim().length > 0 &&
  v.template.length <= 160

export const isDesignFill = (
  v: unknown
): v is
  string | DesignGradientData | { shared: string } | { template: string } =>
  isDesignInlineFill(v) || isDesignSharedFill(v) || isDesignFillTemplate(v)

export const designFillSchema = {
  anyOf: [
    designInlineFillSchema,
    {
      type: 'object',
      additionalProperties: false,
      required: ['template'],
      properties: { template: { type: 'string', minLength: 1, maxLength: 160 } }
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['shared'],
      properties: { shared: { type: 'string', minLength: 1, maxLength: 160 } }
    }
  ],
  description:
    '{shared:key} links a draft.sharedFills definition, not a document ID. Equal inline values stay independent. {template:key} reuses draft.fillTemplates values with independent editable Fill IDs.'
}

export const designSharedFillsSchema = {
  type: 'object',
  propertyNames: { type: 'string', minLength: 1, maxLength: 160 },
  additionalProperties: designInlineFillSchema,
  description:
    'Draft-local: first use creates a Fill; later uses link its ID. Edit via sharedFillIds. No inter-definition references; existing fills use public linking APIs.'
}

export const designFillTemplatesSchema = {
  ...designSharedFillsSchema,
  description:
    'fill:{template:key} creates independent Fill IDs; sharedFills links edits. No inter-definition references.'
}
