import {
  EventTypes,
  VECTOR_TOKENS,
  getVectorControlId,
  getVectorNetworkAnchorHandleRefs,
  isVectorAnchorNode,
  isVectorControlNode,
  sortVectorItemsById,
  subscribeToFileLoadComplete,
  uiContext,
  type SelectedVectorPointState,
  type SelectedVectorSegmentState,
  type VectorPointNode,
  type VectorTopology
} from '@asyra/core'
import { isRecord } from '@asyra/utils'
import { subscribeToAppliedEventBatches } from '@asyra/reactive-events'
import { SelectionChannels } from '../selection/channels.js'
import {
  decodeVectorPointSelectionId,
  decodeVectorSegmentSelectionId
} from '../selection/ids.js'
import { PresetSystemPropertyKeys } from '../system-property-keys.js'
import type { PresetCoreAPIs, PresetDependencies } from '../types.js'

/** Derive panel/overlay views from canonical identities, never from App mirrors. */
export const registerVectorSelectionProjection = (
  core: PresetCoreAPIs,
  deps: PresetDependencies
): (() => void) => {
  let disposed = false
  let pending = false
  const selectedElementIds = new Set<string>()
  const pathKey = PresetSystemPropertyKeys.PATH_EDITING_VECTOR_ID
  const pointKey = PresetSystemPropertyKeys.SELECTED_VECTOR_POINT
  const segmentKey = PresetSystemPropertyKeys.SELECTED_VECTOR_SEGMENT

  const publish = <
    T extends SelectedVectorPointState | SelectedVectorSegmentState | null
  >(
    key: string,
    value: T
  ) => {
    const previous = deps.systemContext.getManagedProperty<T>(key)
    const equal =
      previous === value ||
      (previous != null &&
        value != null &&
        Object.keys(previous).length === Object.keys(value).length &&
        Object.keys(value).every((field) => previous[field] === value[field]))

    if (!equal) {
      deps.systemContext.setManagedProperty(key, value)
    }
  }

  const refresh = () => {
    if (disposed) {
      return
    }

    pending = false
    const pathId = deps.systemContext.getManagedProperty<string | null>(pathKey)
    const points = [
      ...(core.getSelection(SelectionChannels.VECTOR_POINT)?.getSelectedIds() ??
        [])
    ]
      .map(decodeVectorPointSelectionId)
      .filter((value) => value !== null)
    const segments = [
      ...(core
        .getSelection(SelectionChannels.VECTOR_SEGMENT)
        ?.getSelectedIds() ?? [])
    ]
      .map(decodeVectorSegmentSelectionId)
      .filter((value) => value !== null)
    const point =
      points.find((value) => value.elementId === pathId) ?? points[0]
    const segment =
      segments.find((value) => value.elementId === pathId) ?? segments[0]

    selectedElementIds.clear()
    if (point) {
      selectedElementIds.add(point.elementId)
    }

    if (segment) {
      selectedElementIds.add(segment.elementId)
    }

    let view: SelectedVectorPointState | null = null

    if (point) {
      const element = deps.sceneTree.getElementById(point.elementId)
      const data = element?.getAllComputedData() as
        Partial<VectorTopology> | undefined

      if (data?.points && data.segments && data.networks) {
        const anchor = data.points[point.pointId]
        const networks = sortVectorItemsById(Object.values(data.networks))
        const anchors = networks.flatMap((network) =>
          network.pointIds.filter((id) => isVectorAnchorNode(data.points?.[id]))
        )
        const index = anchors.indexOf(point.pointId)
        let target: VectorPointNode | undefined = anchor

        if (point.target !== VECTOR_TOKENS.POINT.TARGET.ANCHOR) {
          const network = networks.find((value) =>
            value.pointIds.includes(point.pointId)
          )
          const refs = network
            ? getVectorNetworkAnchorHandleRefs(network, data.segments).get(
                point.pointId
              )
            : undefined
          const incoming = point.target === VECTOR_TOKENS.POINT.TARGET.IN_HANDLE
          const controlId =
            (incoming ? refs?.inControlId : refs?.outControlId) ??
            getVectorControlId(
              point.pointId,
              incoming
                ? VECTOR_TOKENS.CONTROL.ROLE.IN
                : VECTOR_TOKENS.CONTROL.ROLE.OUT
            )
          const control = data.points[controlId]

          target = isVectorControlNode(control) ? control : undefined
        }

        const position = target
          ? deps.render.elementSourceToWorkspace(point.elementId, target)
          : null

        if (isVectorAnchorNode(anchor) && index >= 0 && position) {
          view = {
            ...point,
            index,
            x: position.x,
            y: position.y,
            handleMode: anchor.handleMode
          }
        }
      }
    }

    publish(pointKey, view)
    const segmentData = segment
      ? (deps.sceneTree
          .getElementById(segment.elementId)
          ?.getAllComputedData() as Partial<VectorTopology> | undefined)
      : undefined
    const segmentView: SelectedVectorSegmentState | null =
      segment && segmentData?.segments?.[segment.segmentId] ? segment : null

    publish(segmentKey, segmentView)
  }

  const refreshSelection = () => {
    if (!pending || deps.render.app === null) {
      refresh()
    }
  }

  const pointSubscription = uiContext.onChange<Set<string>>(
    'vectorPointSelection',
    refreshSelection
  )
  const segmentSubscription = uiContext.onChange<Set<string>>(
    'vectorSegmentSelection',
    refreshSelection
  )
  const pathSubscription = core
    .getSystemPropertyObservable<string | null>(pathKey)
    ?.subscribe(refreshSelection)

  const onFrameComplete = () => {
    if (pending) {
      refresh()
    }
  }

  let stopFrame = deps.render.subscribeToFrameComplete(onFrameComplete)
  const loadSubscription = subscribeToFileLoadComplete(() => {
    stopFrame()
    stopFrame = deps.render.subscribeToFrameComplete(onFrameComplete)
    pending = true
    refreshSelection()
  })
  const geometrySubscription = subscribeToAppliedEventBatches((events) => {
    if (!selectedElementIds.size) {
      return
    }

    const affectsSelection = (id: string): boolean => {
      for (const selectedId of selectedElementIds) {
        let currentId: string | undefined = selectedId

        while (currentId) {
          if (currentId === id) {
            return true
          }

          const parentId: unknown = deps.sceneTree
            .getElementById(currentId)
            ?.get('parentId')

          currentId = typeof parentId === 'string' ? parentId : undefined
        }
      }

      return false
    }

    if (
      events.some((event) => {
        if (!('payload' in event) || !isRecord(event.payload)) {
          return false
        }

        if (event.type === EventTypes.SCENE_TREE_CHANGED) {
          return (
            'payload' in event &&
            event.payload.projectionOwner === deps.sceneTree.projectionOwner
          )
        }

        if (
          (event.type === EventTypes.UPDATE_COMPUTED_DATA ||
            event.type === EventTypes.UPDATE_COMPUTED_DATA_PATCH) &&
          'payload' in event
        ) {
          return (
            typeof event.payload.id === 'string' &&
            affectsSelection(event.payload.id)
          )
        }

        return false
      })
    ) {
      pending = true
      if (deps.render.app === null) {
        refresh()
      }
    }
  })

  refresh()

  return () => {
    disposed = true
    pointSubscription()
    segmentSubscription()
    pathSubscription?.unsubscribe()
    loadSubscription.unsubscribe()
    geometrySubscription.unsubscribe()
    stopFrame()
    selectedElementIds.clear()
  }
}
