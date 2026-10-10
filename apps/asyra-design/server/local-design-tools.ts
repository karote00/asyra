import { inspectDesignBudget } from './design-budget'
import { DesignKeyConflictError } from './design-construction'
import { LocalToolInputError } from './local-tool-invocation'
import {
  designPreparationExamples,
  designRepresentationGuidance
} from './design-preparation-examples'
import { LocalToolAccess } from './local-tool-scheduler'
import { operationInputIssue } from './operation-input-schema'
import {
  designFillSchema,
  designFillTemplatesSchema,
  designSharedFillsSchema
} from '../src/ai/design-fill'
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
const position = { ...coordinate, minimum: -limits.dimension }
const color = { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' }
const point = {
  type: 'object',
  additionalProperties: false,
  required: ['x', 'y'],
  properties: {
    x: { ...coordinate, minimum: -limits.dimension },
    y: { ...coordinate, minimum: -limits.dimension }
  },
  description:
    'Absolute local Bezier control coordinates, not offsets. Controls may be negative or outside the rectangle; the actual curve must stay within declared bounds.'
}
const common = {
  name: { type: 'string', minLength: 1, maxLength: 160 },
  width: size,
  height: size,
  x: position,
  y: position,
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
    maxItems: limits.expandedNodes - 1,
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
    sharedFills: designSharedFillsSchema,
    fillTemplates: designFillTemplatesSchema,
    key: { type: 'string', minLength: 1, maxLength: 160 },
    type: { enum: DesignContainerTypes }
  },
  description:
    'Choose root type explicitly by intent: group organizes children with content-derived bounds; omit width, height, fill and layout fields for groups. Frame owns positive width/height and optional solid or gradient fill and one-time row/column/grid placement. Either container may nest either type. Optional key identifies this root in the prepared target map (if omitted, the generated element ID is used); all keys must be unique. It is not a canonical element ID.' +
    ` Source work is automatically partitioned into windows of ${limits.nodes} nodes / ${limits.pathCommands} path commands without changing global hierarchy, layout, keys or relations. Per artifact: ${limits.expandedNodes} expanded objects, ${limits.expandedPathCommands} expanded path commands, depth ${limits.depth}. Each indivisible source primitive must fit one window. No detail is omitted.`
}
const nodeSchema = {
  anyOf: [
    ...containerConditions,
    ...['rect', 'oval', 'text', 'vector'].map((type) => ({
      properties: { type: { const: type } },
      ...(type === 'vector'
        ? {
            anyOf: [
              { required: ['width', 'height'] },
              { properties: { width: false, height: false } }
            ]
          }
        : {}),
      required: [
        ...(type === 'vector' ? [] : ['width', 'height']),
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
    'Vectors may omit both width and height: the preparation owner measures the exact rings and derives dimensions, with x/y as the local placement offset (default zero). If dimensions are supplied, both are required and constrain the curve. Do not calculate bounds yourself when only the geometry is needed. Unique key and meaningful name. Groups and frames accept children. Groups omit width/height/fill/layout; bounds follow children. Signed draft x/y offsets are allowed: Group normalization offsets its origin and makes child positions nonnegative without changing workspace geometry. Rect, oval and text require positive width/height. Only frames accept layout fields. Flow children omit x/y. Text uses literal text and typography fields with textColor, not fill. Rect/oval/vector use fill. Vectors use closed rings: each cubic segment pairs the start outControl with the next anchor inControl; omit both for straight edges. Declare bounds containing the curve. No canonical IDs, props, raster images, SVG strings or executable code.'
}
const vectorPatternSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['key', 'name', 'type', 'template', 'placements'],
  properties: {
    key: { type: 'string', minLength: 1, maxLength: 140 },
    name: { type: 'string', minLength: 1, maxLength: 140 },
    type: { const: 'vector-pattern' },
    template: {
      type: 'object',
      additionalProperties: false,
      required: ['rings'],
      anyOf: [
        { required: ['width', 'height'] },
        { properties: { width: false, height: false } }
      ],
      properties: {
        type: { const: 'vector' },
        width: size,
        height: size,
        fill: designFillSchema,
        rings: nodeSchema.properties.rings
      }
    },
    placements: {
      type: 'array',
      minItems: 1,
      maxItems: limits.expandedNodes - 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['x', 'y'],
        properties: { x: position, y: position, fill: designFillSchema }
      }
    }
  },
  description:
    'Exact repeated 2D vector geometry: supply one template with rings and optional paired width/height and ordered x/y placements (optional fill override). Backend preserves every anchor/control, expands ordinary editable vectors in placement order, keys key-0, key-1 etc. No scaling, rotation, projection or simplified detail. Use absolute-layout containers; bounds and expanded budgets still apply. Template lifetime is this preparation only.'
}
const preparationSchema = {
  type: 'object',
  additionalProperties: false,
  oneOf: [{ required: ['draft'] }, { required: ['repair'] }],
  properties: {
    draft: draftSchema,
    repair: {
      type: 'object',
      additionalProperties: false,
      required: ['draftId', 'replacements'],
      description:
        'Repair a rejected draft retained in this request. Replace only existing fields using JSON Pointer paths relative to the draft; send no old values. Revalidation is mandatory. If the draft reference has expired, resend the complete source.',
      properties: {
        draftId: { type: 'string', minLength: 1, maxLength: 160 },
        replacements: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['path', 'value'],
            properties: { path: { type: 'string', minLength: 1 }, value: {} }
          }
        }
      }
    }
  },
  $defs: {
    node: {
      anyOf: [
        nodeSchema,
        projectedFaceSchema,
        designPatternSchema,
        vectorPatternSchema
      ]
    }
  }
}
const referenceSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['artifactId'],
  properties: {
    artifactId: { type: 'string', minLength: 1 },
    parentId: {
      type: 'string',
      minLength: 1,
      description:
        'Existing editable container ID. Draft coordinates are local to this parent; omit for workspace insertion.'
    },
    response: {
      type: 'string',
      enum: ['compact', 'full'],
      default: 'compact',
      description:
        'Compact receipts keep identity mappings in the prepared artifact. Use artifactId with target keys/keyPrefix for later edits. Request full only when the full mapping is needed.'
    }
  },
  description: 'Use the artifactId returned by prepare_design in this request.'
}

export class DesignReferenceError extends LocalToolInputError {
  constructor() {
    super(
      'Use a valid artifactId returned by prepare_design in this request. Do not send raw design descriptors. No changes were applied by this operation.',
      'REFERENCE_UNAVAILABLE'
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
  return {
    explainInputIssue: (name: string, args: unknown) =>
      enabled && name === AiDesignToolIds.PREPARE_DESIGN && record(args)
        ? inspectDesignBudget(args.draft)
        : undefined,
    definitions: enabled
      ? [
          {
            type: 'function',
            name: AiDesignToolIds.PREPARE_DESIGN,
            executionAccess: LocalToolAccess.INDEPENDENT,
            description:
              designRepresentationGuidance +
              ' ' +
              'Prepare native editable objects without changing the canvas; returns artifactId, applicable and findings. Use prepare_and_apply_design when this part is ready to draw. Keep unaffected objects and valid artifacts. Include a brief with source notes, assumptions and measurable checks when needed. Resolve concrete overflow before applying; text-metrics-required needs actual rendering. Group derives child bounds; Frame owns size and optional fill. Layout is computed once, not live Auto Layout. Clipping, constraints, frame borders and corner radii are unavailable.' +
              ` Minimal valid input examples (syntax only, adapt to the request; ready parts may include repeated geometry; inspect and review each stage): ${designPreparationExamples.map((example) => JSON.stringify(example)).join(' ; ')}`,
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
      let keys: string[]
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
      } else {
        if (
          value.keyPrefix !== undefined &&
          (typeof value.keyPrefix !== 'string' || !value.keyPrefix)
        )
          throw new DesignReferenceError()
        keys = session.selectKeys(
          value.artifactId,
          value.keyPrefix as string | undefined
        )
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
              (key) => !['artifactId', 'response', 'parentId'].includes(key)
            ) ||
            (args.response !== undefined &&
              args.response !== 'compact' &&
              args.response !== 'full') ||
            (args.parentId !== undefined &&
              (typeof args.parentId !== 'string' || !args.parentId.trim())) ||
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
              response: args.response ?? 'compact',
              ...(args.parentId === undefined
                ? {}
                : { parentId: args.parentId })
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
      if (
        !record(args) ||
        Object.keys(args).length !== 1 ||
        (!('draft' in args) && !('repair' in args))
      )
        return JSON.stringify({
          available: false,
          message:
            'Provide one semantic draft or a rejected-draft repair. No canvas changes were made.'
        })
      let draft: unknown
      try {
        draft = 'repair' in args ? session.repairDraft(args.repair) : args.draft
        const budgetIssue = inspectDesignBudget(draft)
        if (budgetIssue) return JSON.stringify(budgetIssue)
        const inputIssue = operationInputIssue({ draft }, preparationSchema)
        if (inputIssue)
          return JSON.stringify({
            available: false,
            recovery: 'correct_input',
            draftId: session.retainRejectedDraft(draft),
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
          ...session.prepare(draft)
        })
      } catch (error) {
        return JSON.stringify({
          available: false,
          recovery: 'correct_input',
          ...(draft === undefined
            ? {}
            : { draftId: session.retainRejectedDraft(draft) }),
          ...(error instanceof DesignKeyConflictError
            ? { conflicts: error.conflicts }
            : {}),
          message:
            error instanceof Error
              ? error.message
              : 'The design draft could not be prepared.'
        })
      }
    }
  }
}
