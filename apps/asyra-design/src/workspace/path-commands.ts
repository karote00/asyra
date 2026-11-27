import {
  runTransaction,
  VECTOR_ANCHOR_ID_TYPE,
  type VectorHandleMode
} from '@asyra/core'
import { id, type PositionData } from '@asyra/utils'
import { isVectorHandleMode } from '../constants'
import { elementApis } from '../common-apis/element'
import { vectorApis } from '../common-apis/element/vector-apis'
import { selectionApis } from '../common-apis/selection'
import { systemContextApis } from '../common-apis/system-context'
import {
  createVectorTopologyFromSinglePoint,
  appendAnchorPointToTopology,
  setTopologyClosed
} from '../common-apis/element/vector-topology'
import { edit, enabled, editable, position } from './command-inputs'

function vectorEdit<T>(elementId: string, apply: () => T) {
  enabled('pen')
  editable(elementId)
  if (elementApis.getElementType(elementId) !== 'vector') {
    throw new Error('Expected a vector')
  }

  return runTransaction(apply)
}

export const pathCommands = {
  createPath(points: readonly PositionData[], closed = false) {
    enabled('pen')
    if (
      !Array.isArray(points) ||
      !points.length ||
      (closed && points.length < 2)
    ) {
      throw new TypeError('Invalid path')
    }

    const [first, ...rest] = points.map(position)
    let topology = createVectorTopologyFromSinglePoint(
      id(VECTOR_ANCHOR_ID_TYPE),
      first
    )

    for (const point of rest) {
      topology = appendAnchorPointToTopology(
        topology,
        id(VECTOR_ANCHOR_ID_TYPE),
        point
      )
    }

    if (closed) {
      topology = setTopologyClosed(topology, true)
    }

    return runTransaction(() =>
      vectorApis.createVectorElement(
        { type: 'vector', ...topology, closed },
        edit
      )
    )
  },

  getPath(elementId: string) {
    if (elementApis.getElementType(elementId) !== 'vector') {
      return null
    }

    const { points, segments, networks } =
      vectorApis.getVectorTopology(elementId)
    const anchors = vectorApis
      .getVectorAnchorPoints(elementId)
      .map((anchor) => ({
        ...anchor,
        handleMode: points[anchor.id]?.handleMode ?? 'none'
      }))

    return structuredClone({ anchors, segments, networks })
  },

  editPath(elementId: string | null) {
    enabled('pen')
    if (elementId === null) {
      systemContextApis.exitPathEditingMode()

      return
    }

    editable(elementId)
    if (elementApis.getElementType(elementId) !== 'vector') {
      throw new Error('Expected a vector')
    }

    selectionApis.selectElements([elementId], { undoable: false })
    systemContextApis.enterPathEditingMode(elementId)
  },

  selectPathPoint(
    elementId: string,
    pointId: string,
    target: 'anchor' | 'inHandle' | 'outHandle' = 'anchor'
  ) {
    enabled('pen')
    const point = vectorApis.getVectorAnchorPointById(elementId, pointId)

    if (
      !point ||
      (target !== 'anchor' && target !== 'inHandle' && target !== 'outHandle')
    ) {
      throw new TypeError('Unknown path point or handle')
    }

    selectionApis.selectVectorPoint(
      { elementId, pointId, target },
      { undoable: false }
    )
  },

  selectPathSegment(elementId: string, segmentId: string) {
    enabled('pen')
    if (
      !Object.hasOwn(
        vectorApis.getVectorTopology(elementId).segments,
        segmentId
      )
    ) {
      throw new TypeError('Unknown path segment')
    }

    selectionApis.selectVectorSegment(
      { elementId, segmentId },
      { undoable: false }
    )
  },

  appendAnchor(
    elementId: string,
    point: PositionData,
    startNewSubpath = false
  ) {
    return vectorEdit(
      elementId,
      () =>
        vectorApis.appendVectorAnchorPoint(
          elementId,
          {
            ...position(point),
            id: id(VECTOR_ANCHOR_ID_TYPE),
            type: 'sharp',
            inHandle: null,
            outHandle: null
          },
          { ...edit, startNewSubpath }
        ).value?.point.id ?? null
    )
  },

  moveAnchor(elementId: string, anchorId: string, point: PositionData) {
    return vectorEdit(
      elementId,
      () =>
        vectorApis.updateVectorAnchorPointPosition(
          elementId,
          anchorId,
          position(point),
          edit
        ).changed
    )
  },

  removeAnchor(elementId: string, anchorId: string) {
    return vectorEdit(
      elementId,
      () => vectorApis.removeVectorAnchorPoint(elementId, anchorId).changed
    )
  },

  splitSegment(elementId: string, segmentId: string, point: PositionData) {
    return vectorEdit(
      elementId,
      () =>
        vectorApis.splitVectorSegmentAtWorkspacePos(
          elementId,
          segmentId,
          position(point)
        ).value?.point.id ?? null
    )
  },

  setAnchorType(elementId: string, anchorId: string, type: 'sharp' | 'smooth') {
    if (type !== 'sharp' && type !== 'smooth') {
      throw new TypeError('Unknown anchor type')
    }

    return vectorEdit(
      elementId,
      () =>
        vectorApis.updateVectorAnchorPointType(elementId, anchorId, type)
          .changed
    )
  },

  setHandleMode(elementId: string, anchorId: string, mode: VectorHandleMode) {
    if (!isVectorHandleMode(mode)) {
      throw new TypeError('Unknown handle mode')
    }

    return vectorEdit(
      elementId,
      () =>
        vectorApis.setVectorAnchorPointHandleMode(elementId, anchorId, mode)
          .changed
    )
  },

  moveHandle(
    elementId: string,
    anchorId: string,
    handle: 'inHandle' | 'outHandle',
    point: PositionData
  ) {
    if (handle !== 'inHandle' && handle !== 'outHandle') {
      throw new TypeError('Unknown control handle')
    }

    return vectorEdit(
      elementId,
      () =>
        vectorApis.updateVectorAnchorPointHandlePosition(
          elementId,
          anchorId,
          handle,
          position(point),
          edit
        ).changed
    )
  },

  connectAnchors(elementId: string, from: string, to: string) {
    return vectorEdit(
      elementId,
      () => vectorApis.connectVectorAnchorPoints(elementId, from, to).changed
    )
  },

  setPathClosed(elementId: string, closed: boolean) {
    return vectorEdit(
      elementId,
      () => vectorApis.setVectorClosed(elementId, closed).changed
    )
  }
}
