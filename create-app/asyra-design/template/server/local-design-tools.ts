import { isReservedDraftRepairKey } from './design-draft-repair'
import {
  toolResultBoolean,
  toolResultIds,
  toolResultObject,
  toolRequestReference,
  toolSemantics
} from '../src/ai/tool-contract'
import { inspectDesignBudget } from './design-budget'
import { DesignGeometryError } from './design-construction'
import { DesignKeyConflictError } from './design-face'
import { LocalToolInputError } from './local-tool-invocation'
import {
  designPreparationExamples,
  designRepresentationGuidance
} from './design-preparation-examples'
import { LocalToolAccess } from './local-tool-scheduler'
import {
  operationInputIssue,
  operationInputIssues,
  formatOperationInputIssues,
  type OperationInputIssue
} from './operation-input-schema'
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
  DesignNodeTypes,
  DesignTextSizingModes,
  deliverPreparedDesign
} from '../src/ai/prepared-design'
import type {
  AiActionBatch,
  AiProviderInput
} from '../src/ai/action-batch-protocol'
import {
  createDesignPreparationSession,
  designNodeInputFields
} from './design-preparation'
import {
  designConstructionSchema,
  projectedFaceSchema,
  surfaceGridSchema,
  surfaceMotifsSchema,
  designPatternSchema
} from './design-construction-schema'

const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const size = { type: 'number', exclusiveMinimum: 0, maximum: limits.dimension }
const coordinate = { type: 'number', minimum: 0, maximum: limits.dimension }
const position = { ...coordinate, minimum: -limits.dimension }
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
const describeArtifactBudget = (expandedNodeLimit: number) =>
  ` Source windows: ${limits.nodes} nodes/${limits.pathCommands} commands; indivisible primitives must fit. Artifact: ${expandedNodeLimit} expanded objects/${limits.expandedPathCommands} commands, depth ${limits.depth}. Count root and nested containers; windows/templates do not increase artifact capacity. Keep hierarchy/layout/keys/relations/detail.`
const describeDraftContract = (expandedNodeLimit: number) =>
  'Root group derives bounds; no size/fill/layout. Frame has size, solid/gradient fill, one-time row/column/grid layout. Containers nest. Root target-map key is unique and draft-local; omitted=generated ID. Authored keys are not document IDs.' +
  describeArtifactBudget(expandedNodeLimit)
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
  description: describeDraftContract(limits.expandedNodes)
}
const nodeSchema = {
  anyOf: [
    ...containerConditions.map((condition) => ({
      ...condition,
      properties: { ...condition.properties }
    })),
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
    rotation: position,
    text: { type: 'string', maxLength: limits.textCharacters },
    textSizing: { enum: DesignTextSizingModes },
    fontFamily: { type: 'string', minLength: 1, maxLength: 128 },
    fontSize: { type: 'number', exclusiveMinimum: 0, maximum: 4096 },
    fontWeight: { enum: ['normal', 'bold'] },
    fontStyle: { enum: ['normal', 'italic'] },
    textAlign: { enum: ['left', 'center', 'right'] },
    lineHeight: { type: 'number', exclusiveMinimum: 0, maximum: 8192 },
    letterSpacing: { type: 'number', minimum: -100, maximum: 100 },
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
    'Vectors may omit both width and height: the preparation owner measures the exact rings and derives dimensions, with x/y as the local placement offset (default zero). If dimensions are supplied, both are required and constrain the curve. Do not calculate bounds yourself when only the geometry is needed. Unique key and meaningful name. Groups and frames accept children. Groups omit width/height/fill/layout; bounds follow children. Signed draft x/y offsets are allowed: Group normalization preserves workspace geometry; rotated oval origins may be negative while their extents remain inside the group. Rect, oval and text require positive width/height. Only frames accept layout fields. Flow children omit x/y. Text uses literal text and typography fields. Text/rect/oval/vector use fill. Vectors use closed rings: each cubic segment pairs the start outControl with the next anchor inControl; omit both for straight edges. Declare bounds containing the curve. No canonical IDs, props, raster images, SVG strings or executable code.'
}
// Field eligibility belongs to preparation, including native oval rotation.
// Every selected type inherits the same exclusions before any geometry work.
for (const branch of nodeSchema.anyOf) {
  const allowed = designNodeInputFields(branch.properties.type.const)
  Object.assign(
    branch.properties,
    Object.fromEntries(
      Object.keys(nodeSchema.properties)
        .filter((field) => !allowed.includes(field))
        .map((field) => [field, false])
    )
  )
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
  examples: designPreparationExamples,
  type: 'object',
  additionalProperties: false,
  oneOf: [{ required: ['draft'] }, { required: ['repair'] }],
  properties: {
    draft: draftSchema,
    materialSourceId: {
      ...toolRequestReference,
      description:
        'Use the retained source or material revision linearFields for this new draft; omit draft.linearFields. Does not copy geometry or approve the material.'
    },
    repair: {
      type: 'object',
      additionalProperties: false,
      required: ['draftId'],
      oneOf: [
        {
          required: ['replacements'],
          properties: { partition: false, continueFromArtifact: false }
        },
        { required: ['partition'], properties: { replacements: false } }
      ],
      description:
        'Repair a rejected draft retained in this request. Execute returned partition references without resending geometry; later partitions require the first artifact. Replace fields or add missing allowed fields via draft-relative JSON Pointers; empty replacements reuse valid retained source. Send no old values. The complete input is revalidated; unknown fields, prototype paths and new array slots reject. If the draft reference has expired, resend the complete source.',
      properties: {
        draftId: { ...toolRequestReference, maxLength: 160 },
        partition: {
          type: 'integer',
          minimum: 0,
          maximum: limits.recoveryParts - 1
        },
        continueFromArtifact: toolRequestReference,
        replacements: {
          type: 'array',
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
    surfaceMotifs: surfaceMotifsSchema,
    node: {
      anyOf: [
        nodeSchema,
        projectedFaceSchema,
        surfaceGridSchema,
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
    artifactId: toolRequestReference,
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
  const expandedNodeLimit = session.expandedNodeLimit
  const effectivePreparationSchema = {
    ...preparationSchema,
    properties: {
      ...preparationSchema.properties,
      draft: {
        ...draftSchema,
        description: describeDraftContract(expandedNodeLimit)
      }
    }
  }
  const preparedOutputSchema = toolResultObject({
    available: { const: true },
    artifactId: toolRequestReference,
    applicable: toolResultBoolean,
    elementCount: { type: 'integer', minimum: 1 },
    findings: { type: 'array' }
  })
  const capacityOutputSchema = {
    anyOf: [
      preparedOutputSchema,
      toolResultObject({
        available: { const: true },
        draftId: toolRequestReference,
        retainedDraft: toolResultObject({
          draftId: toolRequestReference,
          partitions: {
            type: 'array',
            minItems: 2,
            maxItems: limits.recoveryParts,
            items: { type: 'object' }
          }
        }),
        budget: { type: 'object' }
      })
    ]
  }
  const enabled = actions.some(
    (a) => a.name === AiActionNames.APPLY_PREPARED_DESIGN
  )
  const resolveTargets = (value: unknown): string[] => {
    if (
      !record(value) ||
      typeof value.artifactId !== 'string' ||
      Object.keys(value).some(
        (key) =>
          !['artifactId', 'keys', 'keyPrefix', 'targetSetId'].includes(key)
      ) ||
      (value.keys !== undefined && value.keyPrefix !== undefined)
    )
      throw new DesignReferenceError()
    if (value.targetSetId !== undefined) {
      if (
        typeof value.targetSetId !== 'string' ||
        value.keys !== undefined ||
        value.keyPrefix !== undefined
      )
        throw new DesignReferenceError()
      return session.resolveTargetSet(value.artifactId, value.targetSetId)
    }
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
  }
  const retainDraft = (draft: unknown) => {
    const draftId = session.retainRejectedDraft(draft)
    return draftId
      ? { draftId, retainedDraft: session.describeRejectedDraft(draftId) }
      : {
          retention: 'unavailable',
          nextStep:
            'Rejected source exceeds retention limits; resend corrected source rather than using an unavailable draft ID.'
        }
  }
  const retainInputFailure = (
    draft: unknown,
    issues: readonly OperationInputIssue[]
  ) => {
    const retained = retainDraft(draft)
    const fieldIssues = issues.filter(
      (issue) => !['anyOf', 'oneOf', 'allOf'].includes(issue.keyword)
    )
    const complete = fieldIssues.every(
      (issue) =>
        issue.instancePath.startsWith('/draft/') &&
        !['diagnosticLimit', 'additionalProperties'].includes(issue.keyword) &&
        !issue.instancePath
          .split('/')
          .slice(2)
          .some((part) =>
            isReservedDraftRepairKey(
              part.replace(/~1/g, '/').replace(/~0/g, '~')
            )
          )
    )
    const paths = [
      ...new Set(
        fieldIssues.map((issue) => issue.instancePath.slice('/draft'.length))
      )
    ]
    return {
      ...retained,
      ...(complete && retained.draftId && paths.length && paths.length <= 12
        ? {
            repairGuide: {
              tool: AiDesignToolIds.PREPARE_DESIGN,
              arguments: {
                repair: {
                  draftId: retained.draftId,
                  replacements: paths.map((path) => ({ path }))
                }
              },
              instructions:
                'Supply your corrected value for each returned JSON Pointer in repair.replacements, then invoke the returned tool with arguments. Do not resend geometry. Missing declared object fields are admitted only after complete source revalidation. Preserve workflow options and completed work; never replay writes. Expired source requires fresh preparation.'
            }
          }
        : {})
    }
  }
  return {
    expandedNodeLimit,
    capacityOutputSchema,
    checkResults: session.checkResults,
    resolveRecipe: session.recipe,
    rejectInput: (
      name: string,
      args: unknown,
      issues: readonly OperationInputIssue[] = []
    ) => {
      if (
        !enabled ||
        name !== AiDesignToolIds.PREPARE_DESIGN ||
        !record(args) ||
        !('draft' in args)
      )
        return
      const budget = inspectDesignBudget(args.draft, expandedNodeLimit)?.budget
      return {
        recovery: 'correct_input',
        ...retainInputFailure(args.draft, issues),
        ...(budget ? { budget } : {})
      }
    },
    resultIssue: (name: string, value: unknown): string | undefined => {
      if (!record(value)) return 'Expected a structured preparation result.'
      if (value.available === false || value.applicable === false) return
      if (name === AiDesignToolIds.RETAIN_DESIGN_TARGETS) {
        if (
          value.available !== true ||
          !Array.isArray(value.targets) ||
          !value.targets.length
        )
          return 'Target retention omitted its handles.'
        for (const target of value.targets) {
          if (
            !record(target) ||
            typeof target.artifactId !== 'string' ||
            typeof target.targetSetId !== 'string' ||
            !Number.isSafeInteger(target.count) ||
            Number(target.count) < 1
          )
            return 'Target retention returned an invalid handle.'
          try {
            if (
              session.resolveTargetSet(target.artifactId, target.targetSetId)
                .length !== target.count
            )
              return 'Target count disagrees with retained identities.'
          } catch {
            return 'Retained target identity is unavailable.'
          }
        }
      }
      if (name === AiDesignToolIds.PREPARE_MATERIAL_REVISION) {
        if (
          typeof value.materialRevisionId !== 'string' ||
          value.applied !== false
        )
          return 'Material preparation requires an unapplied owned revision.'
        try {
          session.materialRevision(value.materialRevisionId)
        } catch {
          return 'Material revision is unavailable.'
        }
      }
      if (name === AiDesignToolIds.PREPARE_DESIGN) {
        if (value.retainedDraft !== undefined) {
          const retained =
            typeof value.draftId === 'string'
              ? session.describeRejectedDraft(value.draftId)
              : undefined
          if (
            !retained?.partitions ||
            retained.partitions.length < 2 ||
            JSON.stringify(retained) !== JSON.stringify(value.retainedDraft)
          )
            return 'Partition plan is unavailable or not owned by this request.'
          if (
            value.available !== true ||
            value.artifactId !== undefined ||
            value.applicable !== undefined
          )
            return 'Partition plan is not a compiled or applied artifact.'
          return
        }
        if (
          value.available !== true ||
          typeof value.artifactId !== 'string' ||
          !value.artifactId ||
          !Number.isSafeInteger(value.elementCount) ||
          Number(value.elementCount) < 1 ||
          typeof value.applicable !== 'boolean' ||
          !Array.isArray(value.findings)
        )
          return 'Prepared result requires artifactId, elementCount, applicable and findings.'
        try {
          session.resolve(value.artifactId)
        } catch {
          return 'Prepared artifact identity is unavailable in this request.'
        }
      }
      if (
        name === AiDesignToolIds.RELEASE_DESIGN_ARTIFACTS &&
        (!Array.isArray(value.releasedArtifactIds) ||
          !Array.isArray(value.missingArtifactIds))
      )
        return 'Release result requires released and missing artifact identities.'
    },
    explainInputIssue: (name: string, args: unknown) =>
      enabled && name === AiDesignToolIds.PREPARE_DESIGN && record(args)
        ? inspectDesignBudget(args.draft, expandedNodeLimit)
        : undefined,
    definitions: enabled
      ? [
          ...(actions.some(
            (action) => action.name === AiActionNames.APPLY_PREPARED_MATERIAL
          )
            ? [
                {
                  type: 'function' as const,
                  ...toolSemantics(
                    toolResultObject({
                      available: { const: true },
                      materialRevisionId: toolRequestReference,
                      applied: { const: false },
                      elementCount: { type: 'integer', minimum: 1 }
                    }),
                    'prepare',
                    ['request-artifacts'],
                    'request-artifact'
                  ),
                  composition: 'allowed' as const,
                  name: AiDesignToolIds.PREPARE_MATERIAL_REVISION,
                  executionAccess: LocalToolAccess.INDEPENDENT,
                  description:
                    'Recompile an existing explicit world linear field from its owned source, preserving projection, geometry and creation IDs. Supply the existing field key and complete new field definition. Returns an unapplied materialRevisionId: use apply_prepared_material to update the original members only. Later prepare_design or prepare_and_apply_design accepts materialSourceId to reuse these fields with new geometry. No native-gradient guesses, canvas changes or visual approval occur here.',
                  inputSchema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['artifactId', 'field', 'definition'],
                    examples: [
                      {
                        artifactId: 'example-source',
                        field: 'glass',
                        definition: {
                          frame: 'world',
                          start: { x: 0, y: 0, z: 0 },
                          end: { x: 0, y: 0, z: 100 },
                          gradientStops: [
                            { position: 0, color: '#204050', opacity: 1 },
                            { position: 1, color: '#90b0c0', opacity: 1 }
                          ]
                        }
                      }
                    ],
                    properties: {
                      artifactId: toolRequestReference,
                      field: { type: 'string', minLength: 1 },
                      definition:
                        designConstructionSchema.linearFields
                          .additionalProperties
                    }
                  }
                }
              ]
            : []),
          {
            type: 'function',
            ...toolSemantics(
              preparedOutputSchema,
              'prepare',
              ['request-artifacts'],
              'request-artifact'
            ),
            composition: 'allowed' as const,
            recoveryOutputSchema: {
              anyOf: [
                preparedOutputSchema,
                toolResultObject({ available: { const: false } })
              ]
            },
            name: AiDesignToolIds.PREPARE_DESIGN,
            executionAccess: LocalToolAccess.INDEPENDENT,
            description:
              designRepresentationGuidance +
              ' ' +
              'Prepare native editable objects without changing the canvas; returns artifactId, applicable and findings. This single-artifact API rejects excess; the main tool handles safely partitionable excess in one invocation. Use prepare_and_apply_design when this part is ready to draw. Keep unaffected objects and valid artifacts. Include a brief with source notes, assumptions and measurable checks when needed. Resolve concrete overflow before applying; text-metrics-required needs actual rendering. Group derives child bounds; Frame owns size and optional fill. Layout is computed once, not live Auto Layout. Clipping, constraints, frame borders and corner radii are unavailable. Canonical input examples illustrate syntax; adapt them to the request and inspect each stage.',
            inputSchema: effectivePreparationSchema
          },
          {
            type: 'function',
            ...toolSemantics(
              toolResultObject({
                available: { const: true },
                targets: {
                  type: 'array',
                  minItems: 1,
                  items: toolResultObject({
                    artifactId: toolRequestReference,
                    targetSetId: toolRequestReference,
                    count: { type: 'integer', minimum: 1 }
                  })
                }
              }),
              'prepare',
              ['request-artifacts'],
              'request-artifact'
            ),
            composition: 'allowed' as const,
            name: AiDesignToolIds.RETAIN_DESIGN_TARGETS,
            executionAccess: LocalToolAccess.INDEPENDENT,
            description:
              'Retain a batch of artifact selections once for repeated reads or edits. Returns artifactId, targetSetId and count only. Use target={field:elementIds,artifactId,targetSetId} in later batches instead of resending keys. Members retain creation identity/order, not live group membership; canonical APIs recheck existence and locks. Artifact release invalidates its sets.',
            inputSchema: {
              type: 'object',
              additionalProperties: false,
              required: ['targets'],
              properties: {
                targets: {
                  type: 'array',
                  minItems: 1,
                  maxItems: 128,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['artifactId'],
                    properties: {
                      artifactId: {
                        ...toolRequestReference,
                        maxLength: 160
                      },
                      keys: {
                        type: 'array',
                        minItems: 1,
                        items: { type: 'string', minLength: 1 }
                      },
                      keyPrefix: { type: 'string', minLength: 1 }
                    }
                  }
                }
              }
            }
          },
          {
            type: 'function',
            ...toolSemantics(
              toolResultObject({
                releasedArtifactIds: toolResultIds,
                missingArtifactIds: toolResultIds
              }),
              'prepare',
              ['request-artifacts']
            ),
            composition: 'control-plane' as const,
            name: AiDesignToolIds.RELEASE_DESIGN_ARTIFACTS,
            executionAccess: LocalToolAccess.EXCLUSIVE,
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
                  items: { ...toolRequestReference, maxLength: 160 }
                }
              }
            }
          }
        ]
      : [],
    modelActions: (
      available: AiProviderInput['actions']
    ): AiProviderInput['actions'] =>
      available.map((action) => {
        if (action.name === AiActionNames.APPLY_PREPARED_MATERIAL)
          return {
            ...action,
            inputSchema: {
              type: 'object',
              additionalProperties: false,
              required: ['materialRevisionId'],
              examples: [{ materialRevisionId: 'example-material-revision' }],
              properties: { materialRevisionId: toolRequestReference }
            },
            description:
              'Apply the owned materialRevisionId from prepare_material_revision to its original members. Geometry, placement and Fill binding must still match creation provenance. Produces local overrides only, without recreation or implicit visual approval.'
          }
        if (action.name === AiActionNames.APPLY_PREPARED_DESIGN)
          return {
            ...action,
            inputSchema: referenceSchema,
            description:
              'Apply the artifactId returned by prepare_design. The backend resolves native editable objects. Review the actual rendered result and use returned IDs for targeted corrections.'
          }
        return action
      }),
    resolveTargets,
    resolveBatch: (value: unknown): AiActionBatch => {
      if (!record(value) || !Array.isArray(value.actions))
        throw new Error('Invalid action batch')
      return {
        ...value,
        actions: value.actions.map((action) => {
          if (!record(action)) throw new Error('Invalid action')
          if (action.name === AiActionNames.APPLY_PREPARED_MATERIAL) {
            if (
              !record(action.arguments) ||
              Object.keys(action.arguments).length !== 1 ||
              typeof action.arguments.materialRevisionId !== 'string'
            )
              throw new DesignReferenceError()
            const { rootId, updates } = session.materialRevision(
              action.arguments.materialRevisionId
            )
            return { ...action, arguments: { rootId, updates } }
          }
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
          if (session.isMaterialRevision(args.artifactId))
            throw new LocalToolInputError(
              'Material revisions cannot create geometry; use apply_prepared_material.'
            )
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
          const materialElementIds = session.materialMembers(args.artifactId)
          return {
            ...action,
            arguments: {
              design: deliverPreparedDesign(design),
              ...(materialElementIds.length ? { materialElementIds } : {}),
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
      signal: AbortSignal,
      capacityContinuation = false
    ): Promise<string> => {
      if (signal.aborted) throw new Error('Design preparation cancelled')
      if (enabled && name === AiDesignToolIds.RETAIN_DESIGN_TARGETS) {
        if (
          !record(args) ||
          Object.keys(args).length !== 1 ||
          !Array.isArray(args.targets) ||
          !args.targets.length ||
          args.targets.length > 128
        )
          throw new LocalToolInputError('Provide a bounded targets array.')
        const selections = args.targets.map((target) => {
          if (
            !record(target) ||
            typeof target.artifactId !== 'string' ||
            target.targetSetId !== undefined
          )
            throw new DesignReferenceError()
          return { artifactId: target.artifactId, ids: resolveTargets(target) }
        })
        return JSON.stringify({
          available: true,
          targets: session.retainTargetSets(selections)
        })
      }
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
      if (enabled && name === AiDesignToolIds.PREPARE_MATERIAL_REVISION) {
        const definition = actions.some(
          (action) => action.name === AiActionNames.APPLY_PREPARED_MATERIAL
        )
        if (
          !definition ||
          !record(args) ||
          typeof args.artifactId !== 'string' ||
          typeof args.field !== 'string' ||
          !Object.hasOwn(args, 'definition') ||
          Object.keys(args).length !== 3
        )
          throw new LocalToolInputError(
            'Provide artifactId, field and definition for the available material consumer.'
          )
        return JSON.stringify({
          available: true,
          ...(await session.reviseMaterial(
            args.artifactId,
            args.field,
            args.definition,
            signal
          ))
        })
      }
      if (!enabled || name !== AiDesignToolIds.PREPARE_DESIGN)
        throw new Error('Design preparation is unavailable')
      if (
        !record(args) ||
        Object.keys(args).some(
          (key) => !['draft', 'repair', 'materialSourceId'].includes(key)
        ) ||
        'draft' in args === 'repair' in args ||
        (args.materialSourceId !== undefined &&
          typeof args.materialSourceId !== 'string')
      )
        return JSON.stringify({
          available: false,
          message:
            'Provide one semantic draft or a rejected-draft repair. No canvas changes were made.'
        })
      let draft: unknown
      try {
        draft =
          'repair' in args
            ? session.repairDraft(
                args.repair,
                (candidate) =>
                  !operationInputIssue(
                    { draft: candidate },
                    effectivePreparationSchema
                  )
              )
            : args.draft
        if (typeof args.materialSourceId === 'string')
          draft = session.withMaterialSource(draft, args.materialSourceId)
        const budgetIssue = inspectDesignBudget(draft, expandedNodeLimit)
        if (budgetIssue) {
          const retained = retainDraft(draft)
          if (
            capacityContinuation &&
            retained.retainedDraft?.partitions &&
            !operationInputIssue({ draft }, effectivePreparationSchema)
          ) {
            return JSON.stringify({
              available: true,
              ...retained,
              budget: budgetIssue.budget,
              nextStep:
                'The main tool executes these retained-source parts in order. Preparation has not compiled geometry or changed the canvas.'
            })
          }
          return JSON.stringify({
            ...budgetIssue,
            settlement: 'not-started',
            ...retained,
            ...(retained.retainedDraft?.partitionLimitation
              ? {
                  message: `${budgetIssue.message} Partition limitation: ${retained.retainedDraft.partitionLimitation.message}`
                }
              : {})
          })
        }
        const inputIssues = operationInputIssues(
          { draft },
          effectivePreparationSchema
        )
        if (inputIssues)
          return JSON.stringify({
            available: false,
            settlement: 'not-started',
            recovery: 'correct_input',
            ...retainInputFailure(draft, inputIssues),
            message: `${formatOperationInputIssues(inputIssues)}. Correct the listed fields; use the retained repair guide when provided. Geometry has not been compiled.`
          })
        if (
          record(draft) &&
          Array.isArray(draft.children) &&
          draft.children.some(
            (child) =>
              record(child) &&
              ['projected-face', 'pattern', 'surface-grid'].includes(
                String(child.type)
              )
          ) &&
          (!record(draft.projection) ||
            (draft.layout ?? 'absolute') !== 'absolute')
        )
          return JSON.stringify({
            available: false,
            settlement: 'not-started',
            recovery: 'correct_input',
            message:
              'arguments.draft.projection: provide one shared camera (azimuth, elevation, scale, originX, originY); arguments.draft.layout: projected faces and patterns require absolute layout. Reuse the chosen viewpoint; no new reference search is needed.'
          })
        return JSON.stringify({
          available: true,
          ...(await session.prepareAsync(
            draft,
            signal,
            record(args.repair) &&
              typeof args.repair.draftId === 'string' &&
              typeof args.repair.partition === 'number'
              ? {
                  draftId: args.repair.draftId,
                  partition: args.repair.partition,
                  ...(typeof args.repair.continueFromArtifact === 'string'
                    ? { continueFromArtifact: args.repair.continueFromArtifact }
                    : {})
                }
              : undefined
          )),
          preparationInput:
            record(args.repair) && typeof args.repair.draftId === 'string'
              ? {
                  kind: 'retained-repair',
                  ...session.describeRejectedDraft(args.repair.draftId),
                  replacementCount: Array.isArray(args.repair.replacements)
                    ? args.repair.replacements.length
                    : 0
                }
              : { kind: 'source' }
        })
      } catch (error) {
        signal.throwIfAborted()
        const retained = draft === undefined ? undefined : retainDraft(draft)
        return JSON.stringify({
          available: false,
          settlement: 'not-started',
          recovery: 'correct_input',
          ...retained,
          ...(error instanceof DesignGeometryError
            ? {
                geometryIssue: error.issue,
                ...(retained?.draftId
                  ? {
                      repairGuide: {
                        tool: AiDesignToolIds.PREPARE_DESIGN,
                        arguments: {
                          repair: {
                            draftId: retained.draftId,
                            replacements: [{ path: error.issue.path }]
                          }
                        },
                        instructions:
                          'Set each replacement value to your corrected complete field value, then call the returned tool with arguments. Keep the returned workflow options unchanged. Revalidation is mandatory. Do not resend geometry or replay earlier completed parts. This source remains request-local; an expired reference requires the source again.'
                      }
                    }
                  : {})
              }
            : {}),
          ...(error instanceof DesignKeyConflictError
            ? {
                conflicts: error.conflicts,
                ...(retained?.draftId
                  ? {
                      repairGuide: {
                        tool: AiDesignToolIds.PREPARE_DESIGN,
                        arguments: {
                          repair: {
                            draftId: retained.draftId,
                            replacements: []
                          }
                        },
                        instructions:
                          'Choose unique keys at the reported paths and put only changed fields in repair.replacements as {path,value}. Preserve the intended referenced face key or explicitly update its boundary.face references. Do not guess a target or resend geometry. Call the returned tool with arguments; revalidation is mandatory. Do not replay completed parts. An expired source requires resubmission.'
                      }
                    }
                  : {})
              }
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
