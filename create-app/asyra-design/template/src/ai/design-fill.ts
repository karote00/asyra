import { FillGradientTypes, type FillGradientData } from '@asyra/utils'

const color = { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' }
const unit = { type: 'number', minimum: 0, maximum: 1 }
const handle = { type: 'number', minimum: -10000, maximum: 10000 }
const gradientTypes = [FillGradientTypes.LINEAR]

// App wire admission is intentionally narrower than extensible canonical metadata.
export const designFillSchema = {
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
    'Solid #RRGGBB or native gradient data. Handles are normalized to the final 2D element bounds (0..1 spans its box), not world-space coordinates. Stops must be ordered by position; equal positions allow hard edges. Use native gradients for continuous shading rather than many thin shapes. Pattern face gradients repeat in each projected element box; they are not automatic 3D lighting.'
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

export const isDesignGradient = (v: unknown): v is FillGradientData => {
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
  )
    return false
  let previous = -1
  return v.gradientStops.every((s) => {
    if (
      !record(s) ||
      !exact(s, ['position', 'color', 'opacity']) ||
      !finite(s.position, 0, 1) ||
      s.position < previous ||
      !isColor(s.color) ||
      !finite(s.opacity, 0, 1)
    )
      return false
    previous = s.position
    return true
  })
}

export const isDesignFill = (v: unknown): v is string | FillGradientData =>
  isColor(v) || isDesignGradient(v)
