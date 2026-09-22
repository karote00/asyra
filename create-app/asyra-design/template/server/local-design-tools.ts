import { AiActionNames } from '../src/constants/ai-actions'
import { AiDesignToolIds } from '../src/constants/ai-design'
import { DesignPreparationLimits as limits } from '../src/ai/prepared-design'
import type {
  AiActionBatch,
  AiProviderInput
} from '../src/ai/action-batch-protocol'
import { createDesignPreparationSession } from './design-preparation'

const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const size = { type: 'number', exclusiveMinimum: 0, maximum: limits.dimension }
const coordinate = { type: 'number', minimum: 0, maximum: limits.dimension }
const color = { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' }
const point = {
  type: 'object',
  additionalProperties: false,
  required: ['x', 'y'],
  properties: { x: coordinate, y: coordinate }
}
const common = {
  name: { type: 'string', minLength: 1, maxLength: 160 },
  width: size,
  height: size,
  x: coordinate,
  y: coordinate,
  fill: color
}
const layout = {
  layout: { enum: ['absolute', 'row', 'column', 'grid'] },
  padding: coordinate,
  gap: coordinate,
  columns: { type: 'integer', minimum: 1, maximum: 24 },
  align: { enum: ['start', 'center', 'end'] },
  children: {
    type: 'array',
    maxItems: limits.nodes - 1,
    items: { $ref: '#/$defs/node' }
  }
}
const draftSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'width', 'height'],
  properties: { ...common, ...layout },
  description:
    'Root frame. AI chooses content, visual style and dimensions. Children use parent-local absolute coordinates or declared row/column/grid layout. Frame children share the whole-request node budget.'
}
const nodeSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['key', 'name', 'type', 'width', 'height'],
  properties: {
    ...common,
    ...layout,
    key: { type: 'string', minLength: 1, maxLength: 160 },
    type: { enum: ['frame', 'rect', 'oval', 'text', 'vector'] },
    text: { type: 'string', maxLength: limits.textCharacters },
    fontFamily: { type: 'string', minLength: 1, maxLength: 128 },
    fontSize: { type: 'number', exclusiveMinimum: 0, maximum: 4096 },
    fontWeight: { enum: ['normal', 'bold'] },
    fontStyle: { enum: ['normal', 'italic'] },
    textAlign: { enum: ['left', 'center', 'right'] },
    lineHeight: { type: 'number', exclusiveMinimum: 0, maximum: 8192 },
    letterSpacing: { type: 'number', minimum: -100, maximum: 100 },
    textColor: color,
    rings: {
      type: 'array',
      minItems: 1,
      maxItems: limits.pathCommands / 2,
      items: {
        type: 'array',
        minItems: 2,
        maxItems: limits.pathCommands,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['x', 'y'],
          properties: {
            x: coordinate,
            y: coordinate,
            inControl: point,
            outControl: point
          }
        }
      }
    }
  },
  description:
    'Unique key and meaningful name. Only frames accept children/layout fields. Flow children omit x/y. Text uses literal text and typography fields with textColor, not fill. Rect/oval/vector use fill. Vectors use closed rings: each cubic segment pairs the start outControl with the next anchor inControl; omit both for straight edges. Declare bounds containing the curve. No canonical IDs, props, raster images, SVG strings or executable code.'
}
const referenceSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['artifactId'],
  properties: { artifactId: { type: 'string', minLength: 1 } },
  description: 'Use the artifactId returned by prepare_design in this request.'
}

export class DesignReferenceError extends Error {
  constructor() {
    super(
      'Use a valid artifactId returned by prepare_design in this request. Do not send raw design descriptors. No changes were applied by this operation.'
    )
    this.name = 'DesignReferenceError'
  }
}

export const createLocalDesignTools = (
  actions: AiProviderInput['actions'],
  session = createDesignPreparationSession()
) => {
  const enabled = actions.some(
    (a) => a.name === AiActionNames.APPLY_PREPARED_DESIGN
  )
  let attempts = 0
  return {
    definitions: enabled
      ? [
          {
            type: 'function',
            name: AiDesignToolIds.PREPARE_DESIGN,
            description:
              'Prepare a native editable design or original illustration without changing the canvas. Decide content/style/layout yourself; send a semantic draft. Backend validates and builds native frame/text/rect/oval/vector objects, returns an opaque artifactId and findings. Fix concrete overflow before application; text-metrics-required remains provisional until actual rendering. No reference image needed. At most eight attempts per request, including invalid drafts. Never repeat unchanged ineffective inputs.',
            inputSchema: {
              type: 'object',
              additionalProperties: false,
              required: ['draft'],
              properties: { draft: draftSchema },
              $defs: { node: nodeSchema }
            }
          }
        ]
      : [],
    modelActions: (
      available: AiProviderInput['actions']
    ): AiProviderInput['actions'] =>
      available.map((action) =>
        action.name === AiActionNames.APPLY_PREPARED_DESIGN
          ? {
              ...action,
              inputSchema: referenceSchema,
              description:
                'Apply the artifactId returned by prepare_design. The backend resolves native editable objects. Review the actual rendered result and use returned IDs for targeted corrections.'
            }
          : action
      ),
    resolveBatch: (value: unknown): AiActionBatch => {
      if (!record(value) || !Array.isArray(value.actions))
        throw new Error('Invalid action batch')
      return {
        ...value,
        actions: value.actions.map((action) => {
          if (!record(action)) throw new Error('Invalid action')
          if (action.name !== AiActionNames.APPLY_PREPARED_DESIGN) return action
          const args = action.arguments
          if (
            !enabled ||
            !record(args) ||
            Object.keys(args).length !== 1 ||
            typeof args.artifactId !== 'string'
          )
            throw new DesignReferenceError()
          try {
            return {
              ...action,
              arguments: { design: session.resolve(args.artifactId) }
            }
          } catch {
            throw new DesignReferenceError()
          }
        })
      } as unknown as AiActionBatch
    },
    call: async (
      name: string,
      args: unknown,
      signal: AbortSignal
    ): Promise<string> => {
      if (signal.aborted) throw new Error('Design preparation cancelled')
      if (!enabled || name !== AiDesignToolIds.PREPARE_DESIGN)
        throw new Error('Design preparation is unavailable')
      if (attempts >= limits.artifacts)
        return JSON.stringify({
          available: false,
          exhausted: true,
          message:
            'Design preparation limit reached. Explain remaining limitations and keep any work already applied.'
        })
      attempts++
      if (!record(args) || Object.keys(args).length !== 1 || !('draft' in args))
        return JSON.stringify({
          available: false,
          message: 'Provide one semantic draft. No canvas changes were made.'
        })
      try {
        return JSON.stringify({
          available: true,
          ...session.prepare(args.draft)
        })
      } catch (error) {
        return JSON.stringify({
          available: false,
          message:
            error instanceof Error
              ? error.message
              : 'The design draft could not be prepared.',
          remainingAttempts: limits.artifacts - attempts
        })
      }
    }
  }
}
