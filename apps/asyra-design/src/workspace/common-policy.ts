import { DEFAULT_TEXT_DATA } from '@asyra/preset'
import { VECTOR_TOPOLOGY_DATA_KEYS } from '../common-apis/element/vector-topology'
import { toolId } from '../workspace-features'
import type { common } from './common'

type Calls = typeof common
type Policy =
  string | readonly string[] | ((...args: never[]) => readonly string[])
type Policies = { [G in keyof Calls]?: Partial<Record<keyof Calls[G], Policy>> }

const properties = new Map<string, string>([
  ...Object.keys(DEFAULT_TEXT_DATA).map((key): [string, string] => [
    key,
    'text'
  ]),
  ...VECTOR_TOPOLOGY_DATA_KEYS.map((key): [string, string] => [key, 'pen']),
  ...[
    'x',
    'y',
    'width',
    'height',
    'rotation',
    'scaleX',
    'scaleY',
    'skewX',
    'skewY'
  ].map((key): [string, string] => [key, 'geometry']),
  ['closed', 'pen'],
  ['pointCoordinateSpace', 'pen'],
  ['fills', 'fills'],
  ['strokes', 'strokes'],
  ['name', 'rename'],
  ['lock', 'lock'],
  ['visible', 'visibility']
])

function fields(keys: string[]) {
  return keys.flatMap((key) => properties.get(key) ?? [])
}

interface ElementInput {
  type: string
  fills?: unknown
  strokes?: unknown
}

function creation(input: ElementInput) {
  const features = [input.type === 'vector' ? 'pen' : toolId(input.type)]

  if (input.fills !== undefined) {
    features.push('fills')
  }

  if (input.strokes !== undefined) {
    features.push('strokes')
  }

  return features
}

export const commonPolicies = {
  viewport: { zoomToCenter: 'zoom', panTo: 'pan', zoomFit: 'zoomFit' },
  history: { undo: 'undo', redo: 'redo' },
  hierarchy: {
    groupElements: 'group',
    ungroupElement: 'ungroup',
    removeSubtree: 'deleteSelectedElement',
    moveElements: 'moveLayerHierarchy',
    moveElementsRelative: 'moveLayerHierarchy'
  },
  selection: {
    clearSelection: 'select',
    toggleSelection: 'select',
    selectElements: 'select',
    selectVectorPoint: 'pen',
    selectVectorPoints: 'pen',
    clearVectorPointSelection: 'pen',
    selectVectorSegment: 'pen',
    selectVectorSegments: 'pen',
    clearVectorSegmentSelection: 'pen'
  },
  systemContext: {
    switchPrimaryTool: (tool: string) => [toolId(tool)],

    updateHoveredElementId: 'hoverElement',
    setAreaSelection: 'select',
    clearAreaSelection: 'select',
    setPathEditingMode: 'pen',
    setPathEditingVectorId: 'pen',
    setPathEditingStartNewSubpath: 'pen',
    setHoveredVectorPoint: 'pen',
    setHoveredVectorSegment: 'pen',
    setHoveredVectorSegmentInsertPoint: 'pen',
    clearVectorPointState: 'pen',
    enterPathEditingMode: 'pen',
    exitPathEditingMode: 'pen',
    setPathEditingContinuation: 'pen',
    setActiveGradientFill: 'fills',
    setHoveredGradientHandle: 'fills',
    setSelectedGradientHandle: 'fills',
    setHoveredGradientStop: 'fills',
    setSelectedGradientStop: 'fills',
    clearGradientFillEditingState: 'fills'
  },
  text: {
    beginCreate: 'text',
    beginEdit: 'text',
    updateDraft: 'text',
    finish: 'text',
    cancel: 'text',
    createWorkspaceText: 'text'
  },
  fills: {
    addFill: 'fills',
    addFills: 'fills',
    removeFill: 'fills',
    removeFills: 'fills',
    updateGradientHandleAtClientPosition: 'fills',
    updatePrimaryFillColors: 'fills',
    updatePrimaryFillColor: 'fills',
    updateFillsAtIndex: 'fills',
    shareFillAtIndex: 'fills',
    detachFillsAtIndex: 'fills',
    updateFillFieldsBatch: 'fills',
    updateFillFields: 'fills',
    updateFillField: 'fills'
  },
  strokes: {
    addStroke: 'strokes',
    removeStroke: 'strokes',
    updatePrimaryStrokeColors: 'strokes',
    updatePrimaryStrokeColor: 'strokes',
    updateStrokeFieldsBatch: 'strokes',
    updateStrokeFields: 'strokes',
    updateStrokeField: 'strokes'
  },
  element: {
    setElementLock: 'lock',
    toggleElementLock: 'lock',
    setElementVisible: 'visibility',
    setElementsVisible: 'visibility',
    toggleElementVisible: 'visibility',
    deleteElement: 'deleteSelectedElement',
    deleteElements: 'deleteSelectedElement',
    resetElementSize: 'geometry',
    scaleElementAroundCenter: 'geometry',

    changeElementGeometry: (_id: string, values: object) => [
      'geometry',
      ...fields(Object.keys(values))
    ],

    normalizeGroupGeometryForElements: 'geometry',
    setElementPositions: 'moveElements',
    createElement: creation,

    createElements: (entries: ElementInput[]) => entries.flatMap(creation),

    createElementsInParent: (entries: ElementInput[]) =>
      entries.flatMap(creation),

    updateElementProperties: (_ids: string[], values: object) =>
      fields(Object.keys(values)),

    patchElementProperties: (
      updates: Parameters<Calls['element']['patchElementProperties']>[0]
    ) =>
      updates.flatMap((update) =>
        fields([
          ...Object.keys(update.values ?? {}),
          ...update.records.map((entry) => entry.key)
        ])
      ),

    discardTransientVectorPreviews: 'pen',
    scaleVectorElementAroundCenter: ['pen', 'geometry'],
    appendVectorAnchorPoint: 'pen',
    connectVectorAnchorEndpoints: 'pen',
    connectVectorAnchorPoints: 'pen',
    removeLastSinglePointSubpath: 'pen',
    removeVectorAnchorPoint: 'pen',
    splitVectorSegmentAtWorkspacePos: 'pen',
    setVectorClosed: 'pen',
    updateVectorAnchorPointPosition: 'pen',
    setVectorElementPositions: 'moveElements',
    setVectorElementPosition: 'moveElements',
    updateVectorAnchorPointType: 'pen',
    setVectorAnchorPointHandleMode: 'pen',
    updateVectorAnchorPointHandlePosition: 'pen',
    updateVectorAnchorPointHandles: 'pen',

    createVectorElement: (input: ElementInput) => ['pen', ...creation(input)],

    createVectorElementsInParent: (entries: ElementInput[]) => [
      'pen',
      ...entries.flatMap(creation)
    ],

    createVectorElementFromSinglePoint: 'pen'
  },
  design: {
    arrangeDesign: 'moveElements',

    organizeDesign: (
      request: Parameters<Calls['design']['organizeDesign']>[0]
    ) => [
      request.operation === 'reorder'
        ? 'moveLayerHierarchy'
        : request.operation,
      ...(request.name === undefined ? [] : ['rename'])
    ]
  }
} satisfies Policies

export function commonPolicy(
  group: string,
  method: string
): Policy | undefined {
  const groups: Record<string, Record<string, Policy>> = commonPolicies

  return groups[group]?.[method]
}
