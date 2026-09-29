import { designPreparationExamples } from './design-preparation-examples'
import { operationInputIssue } from './operation-input-schema'
import { designFillSchema } from '../src/ai/design-fill'
import { AiActionNames } from '../src/constants/ai-actions'
import { AiDesignToolIds } from '../src/constants/ai-design'
import {
  DesignPreparationLimits as limits,
  DesignContainerTypes,
  DesignNodeTypes
} from '../src/ai/prepared-design'
import type {
  AiActionBatch,
  AiProviderInput
} from '../src/ai/action-batch-protocol'
import { createDesignPreparationSession } from './design-preparation'
import {
  designConstructionSchema,
  projectedFaceSchema,
  designPatternSchema
} from './design-construction-schema'

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
  fill: designFillSchema
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
const containerConditions = [
  {
    properties: {
      type: { const: 'group' },
      width: false,
      height: false,
      fill: false,
      layout: false,
      padding: false,
      gap: false,
      columns: false,
      align: false
    }
  },
  { properties: { type: { const: 'frame' } }, required: ['width', 'height'] }
]
const draftSchema = {
  anyOf: containerConditions,
  type: 'object',
  additionalProperties: false,
  required: ['name', 'type'],
  properties: {
    ...common,
    ...layout,
    ...designConstructionSchema,
    type: { enum: DesignContainerTypes }
  },
  description:
    'Choose root type explicitly by intent: group organizes children with content-derived bounds; omit width, height, fill and layout fields for groups. Frame owns positive width/height and optional solid or gradient fill and one-time row/column/grid placement. Either container may nest either type. Children share the whole-request node budget.'
}
const nodeSchema = {
  anyOf: [
    ...containerConditions,
    ...['rect', 'oval', 'text', 'vector'].map((type) => ({
      properties: { type: { const: type } },
      required: [
        'width',
        'height',
        ...(type === 'text' ? ['text'] : []),
        ...(type === 'vector' ? ['rings'] : [])
      ]
    }))
  ],
  type: 'object',
  additionalProperties: false,
  required: ['key', 'name', 'type'],
  properties: {
    ...common,
    ...layout,
    key: { type: 'string', minLength: 1, maxLength: 160 },
    type: { enum: DesignNodeTypes },
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
    'Unique key and meaningful name. Groups and frames accept children. Groups omit width/height/fill/layout; bounds follow children. All other nodes require positive width/height. Only frames accept layout fields. Flow children omit x/y. Text uses literal text and typography fields with textColor, not fill. Rect/oval/vector use fill. Vectors use closed rings: each cubic segment pairs the start outControl with the next anchor inControl; omit both for straight edges. Declare bounds containing the curve. No canonical IDs, props, raster images, SVG strings or executable code.'
}
const preparationSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['draft'],
  properties: { draft: draftSchema },
  $defs: {
    node: { anyOf: [nodeSchema, projectedFaceSchema, designPatternSchema] }
  }
}
const referenceSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['artifactId'],
  properties: {
    artifactId: { type: 'string', minLength: 1 },
    response: { type: 'string', enum: ['compact', 'full'] }
  },
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
  session = createDesignPreparationSession(),
  getStructureIssue?: () => string | undefined
) => {
  const enabled = actions.some(
    (a) => a.name === AiActionNames.APPLY_PREPARED_DESIGN
  )
  return {
    definitions: enabled
      ? [
          {
            type: 'function',
            name: AiDesignToolIds.PREPARE_DESIGN,
            description:
              'Prepare a native editable design or original illustration without changing the canvas. Decide content/style/layout yourself; send a semantic draft. Backend validates and builds native group/frame/text/rect/oval/vector objects, returns an opaque artifactId and findings. Fix concrete overflow before application; text-metrics-required remains provisional until actual rendering. Include a brief with viewpoint, source notes, assumptions and measurable checks for substantial designs. Use relations for native layout, shared projection for explicit faces, and pattern templates with translation axes for repeated geometry instead of enumerating vertices. Prepare only changed parts; keep valid artifact IDs and unaffected canvas objects. Returns applicable plus measured review; failed checks/overflow block application. No reference image needed. Containers are selected by intent, not depth. Frame supports independent size and solid or gradient fill; layout is computed once, not live Auto Layout. Clipping, constraints, frame borders and corner radii are unavailable. Never repeat unchanged ineffective inputs.' +
              ` Minimal valid input examples (syntax only, adapt to the request; pattern details still require the existing structure review): ${designPreparationExamples.map((example) => JSON.stringify(example)).join(' ; ')}`,
            inputSchema: preparationSchema
          },
          {
            type: 'function',
            name: AiDesignToolIds.RELEASE_DESIGN_ARTIFACTS,
            description:
              'Release explicitly unneeded prepared design artifact IDs from this request. This frees preparation memory only; it never changes canvas objects or Undo. Retain artifacts still needed for comparison or later use. Released IDs cannot be applied; group releases in native code instead of returning to the model for each artifact.',
            inputSchema: {
              type: 'object',
              additionalProperties: false,
              required: ['artifactIds'],
              properties: {
                artifactIds: {
                  type: 'array',
                  minItems: 1,
                  maxItems: 128,
                  uniqueItems: true,
                  items: { type: 'string', minLength: 1, maxLength: 160 }
                }
              }
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
    resolveTargets: (value: unknown): string[] => {
      if (
        !record(value) ||
        typeof value.artifactId !== 'string' ||
        Object.keys(value).some(
          (key) => !['artifactId', 'keys', 'keyPrefix'].includes(key)
        ) ||
        (value.keys !== undefined && value.keyPrefix !== undefined)
      )
        throw new DesignReferenceError()
      const design = session.resolve(value.artifactId)
      let keys = Object.keys(design.keyToId)
      if (value.keys !== undefined) {
        if (
          !Array.isArray(value.keys) ||
          !value.keys.length ||
          value.keys.some(
            (key) =>
              typeof key !== 'string' || !Object.hasOwn(design.keyToId, key)
          )
        )
          throw new DesignReferenceError()
        keys = value.keys as string[]
      }
      if (value.keyPrefix !== undefined) {
        if (typeof value.keyPrefix !== 'string' || !value.keyPrefix)
          throw new DesignReferenceError()
        keys = keys.filter((key) => key.startsWith(value.keyPrefix as string))
      }
      if (!keys.length) throw new DesignReferenceError()
      return [...new Set(keys.map((key) => design.keyToId[key]))]
    },
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
            Object.keys(args).some(
              (key) => !['artifactId', 'response'].includes(key)
            ) ||
            (args.response !== undefined &&
              args.response !== 'compact' &&
              args.response !== 'full') ||
            typeof args.artifactId !== 'string'
          )
            throw new DesignReferenceError()
          let design
          try {
            design = session.resolve(args.artifactId)
          } catch {
            throw new DesignReferenceError()
          }
          if (design.findings.some((f) => f.kind !== 'text-metrics-required'))
            throw new Error(
              'Resolve preparation findings and unmet requirements before applying this design.'
            )
          return {
            ...action,
            arguments: {
              design,
              ...(args.response === undefined
                ? {}
                : { response: args.response })
            }
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
      if (enabled && name === AiDesignToolIds.RELEASE_DESIGN_ARTIFACTS) {
        if (
          !record(args) ||
          Object.keys(args).length !== 1 ||
          !Array.isArray(args.artifactIds) ||
          !args.artifactIds.length ||
          args.artifactIds.length > 128 ||
          args.artifactIds.some(
            (id) => typeof id !== 'string' || !id.length || id.length > 160
          )
        )
          throw new Error('Provide artifactIds to release.')
        return JSON.stringify(session.release(args.artifactIds as string[]))
      }
      if (!enabled || name !== AiDesignToolIds.PREPARE_DESIGN)
        throw new Error('Design preparation is unavailable')
      if (!record(args) || Object.keys(args).length !== 1 || !('draft' in args))
        return JSON.stringify({
          available: false,
          message: 'Provide one semantic draft. No canvas changes were made.'
        })
      try {
        const draft = args.draft
        if (
          record(draft) &&
          Array.isArray(draft.children) &&
          draft.children.some(
            (child) => record(child) && child.type === 'pattern'
          )
        ) {
          const issue = getStructureIssue?.()
          if (issue)
            return JSON.stringify({
              available: false,
              recovery: 'review_structure',
              nextTool: AiDesignToolIds.RECORD_DESIGN_REVIEW,
              message: `${issue} Inspect the existing structure, then record phase=structure with current inspectionIds. Reuse this draft afterwards; do not search for another reference.`
            })
        }
        const inputIssue = operationInputIssue(args, preparationSchema)
        if (inputIssue)
          return JSON.stringify({
            available: false,
            recovery: 'correct_input',
            message: `${inputIssue}. Correct the listed input fields and resubmit this draft; do not research a new reference. Geometry has not been compiled.`
          })
        if (
          record(draft) &&
          Array.isArray(draft.children) &&
          draft.children.some(
            (child) =>
              record(child) &&
              ['projected-face', 'pattern'].includes(String(child.type))
          ) &&
          (!record(draft.projection) ||
            (draft.layout ?? 'absolute') !== 'absolute')
        )
          return JSON.stringify({
            available: false,
            recovery: 'correct_input',
            message:
              'arguments.draft.projection: provide one shared camera (azimuth, elevation, scale, originX, originY); arguments.draft.layout: projected faces and patterns require absolute layout. Reuse the chosen viewpoint; no new reference search is needed.'
          })
        return JSON.stringify({
          available: true,
          ...session.prepare(args.draft)
        })
      } catch (error) {
        return JSON.stringify({
          available: false,
          recovery: 'correct_input',
          message:
            error instanceof Error
              ? error.message
              : 'The design draft could not be prepared.'
        })
      }
    }
  }
}
