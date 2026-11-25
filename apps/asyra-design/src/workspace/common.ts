import type { RunTransactionOptions } from '@asyra/core'
// This is the callable catalog of the Design workspace. Each workspace loads
// these owners in its own realm. The SDK binds them to that editor's lifetime.
import {
  cursorApis,
  elementApis,
  fillApis,
  hierarchyApis,
  historyApis,
  inspectionApis,
  renderLayerApis,
  selectionApis,
  strokeApis,
  systemContextApis,
  transactionApis,
  vectorGeometry,
  viewportApis
} from '../common-apis'
import * as geometryPolicy from '../common-apis/element/geometry-policy'
import { scaleElementAroundCenter } from '../common-apis/element/scale'
import { createWorkspaceText, textCanvasApis } from '../common-apis/text-canvas'
import {
  arrangeDesign,
  createDesignArranger
} from '../common-apis/design-arrangement'
import {
  organizeDesign,
  createDesignOrganizer
} from '../common-apis/design-organization'
import {
  editDesignElement,
  prepareDesignElementEdit,
  requireEditableElement,
  createDesignElementEditor,
  createDesignElementEditPreparer
} from '../common-apis/design-edit'
import {
  readDesignContext,
  createDesignContextReader,
  validateDesignContextFilter,
  validateDesignContextQuery,
  assertDesignContextCount,
  matchesDesignContextFilter
} from '../common-apis/design-context'
import {
  createDesignReviewer,
  reviewDesign,
  observeDesignChanges
} from '../common-apis/design-review'
import {
  createInspectionEvidence,
  observeInspectionChanges
} from '../common-apis/inspection-evidence'
import { createInspectionDependencies } from '../common-apis/inspection-dependencies'
import { createRetainedDesignContext } from '../common-apis/retained-design-context'
import * as bezier from '../common-apis/element/bezier-adapter'
import * as handles from '../common-apis/element/handle-mode'
import * as topology from '../common-apis/element/vector-topology'
import * as consistency from '../common-apis/element/vector-consistency'
import * as bounds from '../common-apis/element/vector-geometry'
import {
  prepareVectorElementData,
  createVectorComputedPatchFromTopologyChange,
  createValidatedVectorComputedPatchRequest
} from '../common-apis/element/vector-apis'
import * as gradient from '../common-apis/gradient-handle-geometry'
import * as layout from '../common-apis/text-layout'
import { getChangedDefinedPatchEntries } from '../common-apis/property-patch'
import { mutationReceipt } from '../common-apis/mutation-receipt'
import {
  encodeVectorPointSelectionId,
  decodeVectorPointSelectionId,
  encodeVectorSegmentSelectionId,
  decodeVectorSegmentSelectionId
} from '../common-apis/selection'
import { createAiHistoryProjection } from '../common-apis/history'
import {
  isAiDrawingProgressState,
  isAiDrawingProgressStateOrNull
} from '../common-apis/system-context'
import core from '../contexts'

const { VECTOR_TOPOLOGY_DATA_KEYS: _keys, ...topologyFunctions } = topology
const { vectorGeometry: _geometry, ...vectorFunctions } = consistency

interface RunCommonTransaction {
  <T>(callback: () => Promise<T>, options?: RunTransactionOptions): Promise<T>
  <T>(callback: () => T, options?: RunTransactionOptions): T
}
const runTransaction: RunCommonTransaction = transactionApis.runTransaction

export const common = {
  element: { ...elementApis, ...geometryPolicy, scaleElementAroundCenter },
  viewport: viewportApis,
  selection: {
    ...selectionApis,
    encodeVectorPointSelectionId,
    decodeVectorPointSelectionId,
    encodeVectorSegmentSelectionId,
    decodeVectorSegmentSelectionId
  },
  hierarchy: hierarchyApis,
  fills: fillApis,
  strokes: strokeApis,
  systemContext: {
    ...systemContextApis,
    isAiDrawingProgressState,
    isAiDrawingProgressStateOrNull
  },
  transaction: { ...transactionApis, runTransaction },
  history: { ...historyApis, createAiHistoryProjection },
  renderLayer: renderLayerApis,
  cursor: cursorApis,
  text: { ...textCanvasApis, createWorkspaceText, ...layout },
  inspection: {
    ...inspectionApis,
    createInspectionEvidence,
    observeInspectionChanges,
    createInspectionDependencies
  },
  design: {
    arrangeDesign,
    organizeDesign,
    editDesignElement,
    prepareDesignElementEdit,
    readDesignContext,
    observeDesignChanges,
    validateDesignContextQuery,
    validateDesignContextFilter,
    matchesDesignContextFilter,
    assertDesignContextCount,
    requireEditableElement,
    createDesignArranger,
    createDesignOrganizer,
    createDesignElementEditor,
    createDesignElementEditPreparer,
    createDesignReviewer,

    createDesignContextReader: (
      source = core as Parameters<typeof createDesignContextReader>[0]
    ) => createDesignContextReader(source),

    createRetainedDesignContext: (
      source = core as Parameters<typeof createRetainedDesignContext>[0],
      observe = observeDesignChanges,
      options?: { maxBytes?: number }
    ) => createRetainedDesignContext(source, observe, options)
  },
  review: {
    reviewDesign: (...args: Parameters<typeof reviewDesign>) =>
      reviewDesign(...args),

    ...reviewDesign
  },
  vectorGeometry,
  topology: topologyFunctions,
  vector: {
    ...vectorFunctions,
    ...bounds,
    ...handles,
    ...bezier,
    prepareVectorElementData,
    createVectorComputedPatchFromTopologyChange,
    createValidatedVectorComputedPatchRequest
  },
  gradient,
  properties: { getChangedDefinedPatchEntries, mutationReceipt }
}

export type { WorkspaceNode } from './nodes'
