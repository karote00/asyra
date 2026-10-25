import { createElementPropertyIntentAPIs } from './property-intents.js'
import {
  SceneTree,
  componentRegistry,
  type CanonicalElementRemoval,
  type PreparedElementMutation,
  type PreparedSubtreeRemoval
} from '@asyra/scene-tree'
import {
  Render,
  createRenderGradientFillStyle,
  createEvenOddFillStyle,
  createMeshProjection
} from '@asyra/render'
import type {
  PreparedPropertyMutationBatch,
  PropertyMutation,
  PropsManager
} from '@asyra/props-manager'
import type { SelectionManager } from '@asyra/selection'
import type { Factory } from '@asyra/factory'
import {
  type EVENT_OPTIONS,
  type MoveHierarchyRequest,
  type GroupInstanceTypes,
  type PropsComponentRawData,
  EntityTypes
} from '@asyra/utils'

import { createPropsAPIs, type PropsRequests } from './props.js'
import { createRenderAPIs, type RenderRequests } from './render.js'
import { createSceneTreeAPIs, type SceneTreeRequests } from './scene-tree.js'
import { createElementSelectionAPIs } from './element-selection.js'
import { createInputSystemAPIs } from './input-system.js'
import { createFeatureSystemAPIs } from './feature-system.js'
import { createUIContextAPIs } from './ui-context.js'
import { createSystemPropertyAPIs } from './system-properties.js'
import { createElementPropertyAPIs } from './element-properties.js'
import { getAllElementsWorldBounds } from './scene-bounds.js'
import type { CanonicalChange, CoreAPIs } from '../types/index.js'

export const createAPIs = (
  sceneTree: SceneTree,
  render: Render,
  selection: SelectionManager,
  props: PropsManager,
  factory: Factory
): CoreAPIs => {
  const requireContainerParent = (parentId: string): GroupInstanceTypes => {
    const parent = sceneTree.getElementById(parentId)
    const parentType = parent?.get('type')
    const parentIsContainer =
      parentType === EntityTypes.WORKSPACE ||
      parentType === EntityTypes.FRAME ||
      parentType === EntityTypes.GROUP ||
      (typeof parentType === 'string' &&
        componentRegistry.get(parentType)?.isContainer === true)
    if (!parent || !parentIsContainer) {
      throw new Error(
        `[Core] Cannot create element batch: parent "${parentId}" is unavailable`
      )
    }
    return parent as GroupInstanceTypes
  }

  const freezeOrderedElementIds = (
    elementIds: readonly string[]
  ): readonly string[] => Object.freeze([...elementIds])

  const requireOrderedIds = (
    owner: string,
    actual: readonly string[],
    expected: readonly string[]
  ): void => {
    if (
      actual.length !== expected.length ||
      actual.some((elementId, index) => elementId !== expected[index])
    ) {
      throw new Error(
        `[Core] ${owner} returned canonical ids that do not match the requested order`
      )
    }
  }

  const prepareOrphanPropertyMutation = (
    preparedSceneRemoval: Pick<
      PreparedSubtreeRemoval,
      'orphanRootPropertyIds' | 'retainedRootPropertyIds'
    >,
    options?: EVENT_OPTIONS
  ): PreparedPropertyMutationBatch | undefined => {
    if (preparedSceneRemoval.orphanRootPropertyIds.length === 0) {
      return undefined
    }
    return props.preparePropertyMutationBatch({
      operations: [
        {
          kind: 'remove-exact-orphan-property-graphs',
          orphanRootPropertyIds: preparedSceneRemoval.orphanRootPropertyIds,
          retainedRootPropertyIds: preparedSceneRemoval.retainedRootPropertyIds
        }
      ],
      options
    })
  }

  const applyFullRemoval = (
    preparedSceneRemoval: PreparedElementMutation &
      Pick<
        PreparedSubtreeRemoval,
        'orphanRootPropertyIds' | 'retainedRootPropertyIds'
      >,
    preparedProperties: PreparedPropertyMutationBatch | undefined,
    options?: EVENT_OPTIONS
  ): readonly string[] => {
    const sceneResult = sceneTree.applyPreparedElementMutation(
      preparedSceneRemoval,
      options
    )
    if (preparedProperties) {
      props.applyPreparedPropertyMutationBatch(preparedProperties)
    }
    return freezeOrderedElementIds(sceneResult.orderedElementIds)
  }

  const applyCanonicalInsertion = (
    change: Extract<CanonicalChange, { kind: 'element-creation' }>,
    options?: EVENT_OPTIONS
  ): readonly string[] => {
    const { entries, properties } = change
    const preparedSceneInsertion = sceneTree.prepareCanonicalElementInsertion({
      entries
    })
    const preparedProperties =
      preparedSceneInsertion.ownerRelations.length > 0 || properties.length > 0
        ? props.preparePropertyMutationBatch({
            operations: [
              {
                kind: 'create-exact-property-graph',
                ownerRelations: preparedSceneInsertion.ownerRelations,
                components: properties
              }
            ],
            options
          })
        : undefined
    if (preparedProperties) {
      props.applyPreparedPropertyMutationBatch(preparedProperties)
    }
    const sceneResult = sceneTree.applyPreparedElementMutation(
      preparedSceneInsertion,
      options
    )
    return freezeOrderedElementIds(sceneResult.orderedElementIds)
  }

  const applyPreparedSubtreeRemoval = (
    preparedSceneRemoval: PreparedSubtreeRemoval,
    options?: EVENT_OPTIONS
  ) => {
    const preparedProperties = prepareOrphanPropertyMutation(
      preparedSceneRemoval,
      options
    )
    applyFullRemoval(preparedSceneRemoval, preparedProperties, options)
    const evidence = preparedSceneRemoval.evidence[0]
    if (!evidence) {
      throw new Error(
        '[Core] Subtree removal requires one Scene-owned subtree result'
      )
    }
    return Object.freeze({
      elementId: evidence.elementId,
      removed: evidence.removed,
      rootParentChildrenAfter: evidence.rootParentChildrenAfter
    })
  }

  const sceneTreeRequests: SceneTreeRequests = {
    sceneTreeSaveData: () => sceneTree.save(),
    getCurrentWorkspaceId: () => sceneTree.workspace,
    getElementComputedData: (elementId: string, fields?: readonly string[]) =>
      sceneTree.getElementById(elementId)?.getAllComputedData(fields) as
        Record<string, unknown> | undefined,
    moveElements: (request: MoveHierarchyRequest, options?: EVENT_OPTIONS) =>
      sceneTree.moveElements(request, options),
    applyHierarchyMoves: (moves, options) =>
      sceneTree.applyHierarchyMoves(moves, options),
    applyElementDataChanges: (changes, options) => {
      const preparedSceneMutation =
        sceneTree.prepareCanonicalElementDataMutation(changes)
      return freezeOrderedElementIds(
        sceneTree.applyPreparedElementMutation(preparedSceneMutation, options)
          .orderedElementIds
      )
    },
    removeSubtrees: (elementIds, options) => {
      const prepared = sceneTree.prepareSubtreesRemoval(elementIds)
      const properties = prepareOrphanPropertyMutation(prepared, options)
      return applyFullRemoval(prepared, properties, options)
    },
    removeSubtree: (elementId: string, options?: EVENT_OPTIONS) =>
      applyPreparedSubtreeRemoval(
        sceneTree.prepareSubtreeRemoval(elementId),
        options
      ),
    removeSubtreeFromCanonicalData: (change, options) =>
      applyPreparedSubtreeRemoval(
        sceneTree.prepareCanonicalSubtreeRemoval(change),
        options
      ),
    removeElementsFromCanonicalData: (
      removals: readonly CanonicalElementRemoval[],
      options?: EVENT_OPTIONS
    ) => {
      if (removals.length === 0) {
        return Object.freeze([])
      }
      const preparedSceneRemoval =
        sceneTree.prepareCanonicalElementRemoval(removals)
      const preparedProperties = prepareOrphanPropertyMutation(
        preparedSceneRemoval,
        options
      )
      return applyFullRemoval(preparedSceneRemoval, preparedProperties, options)
    },
    preflightRestoreSubtree: (snapshot, options) =>
      options === undefined
        ? sceneTree.preflightRestoreSubtree(snapshot)
        : sceneTree.preflightRestoreSubtree(snapshot, options),
    applyRestoreSubtree: (preparedRestore, options) =>
      sceneTree.applyRestoreSubtree(preparedRestore, options),
    createElementsInParent: (data, parentId, index, options) => {
      const parent = requireContainerParent(parentId)
      return freezeOrderedElementIds(
        sceneTree.addNewElements(data, parent, index ?? -1, options)
      )
    },
    createElementsInParentFromCanonicalData: (
      elements,
      properties,
      parentId,
      index,
      options
    ) => {
      const parent = requireContainerParent(parentId)
      const parentChildren = parent.get('children')
      const insertionIndex = index === undefined ? parentChildren.length : index
      return applyCanonicalInsertion(
        {
          kind: 'element-creation',
          entries: elements.map((data, offset) => ({
            data,
            parentId,
            index: insertionIndex + offset
          })),
          properties
        },
        options
      )
    },
    updateLocalComputedData: (updates) =>
      sceneTree.updateLocalComputedData(updates),
    patchLocalComputedData: (updates) =>
      sceneTree.patchLocalComputedData(updates),
    projectLocalComputedDataFromPropertyIds: (propertyIds) =>
      sceneTree.projectLocalComputedDataFromPropertyIds(propertyIds),
    isContainerType: (type: string) => {
      if (
        type === EntityTypes.WORKSPACE ||
        type === EntityTypes.FRAME ||
        type === EntityTypes.GROUP
      ) {
        return true
      }

      return componentRegistry.get(type)?.isContainer ?? false
    },
    getAllElementsBounds: () => getAllElementsWorldBounds(sceneTree)
  }

  const renderRequests: RenderRequests = {
    getElementIdsInBounds: (bounds) => render.getElementIdsInBounds(bounds),
    suspendElementPresentation: (elementId) =>
      render.suspendElementPresentation(elementId),
    measureText: (layout) => render.measureText(layout),
    measureElementContentBounds: (elementIds) =>
      render.measureElementContentBounds(elementIds),
    captureElementSnapshot: (elementId, maxDimension, options) =>
      render.captureElementSnapshot(elementId, maxDimension, options),
    initRender: (width: number, height: number, color: number) =>
      render.init(width, height, color),
    getViewportPosition: () => render.getViewportPosition(),
    getViewportScale: () => render.getViewportScale(),
    registerRenderLayer: (registration, options) =>
      render.registerLayer(registration, options),
    unregisterRenderLayer: (name: string) => render.unregisterLayer(name),
    createRenderGradientFillStyle,
    createEvenOddFillStyle,
    createMeshProjection,
    registerRenderInteractionTargets: (targets, options) =>
      render.registerInteractionTargets(targets, options),
    updateRenderInteractionTarget: (targetId, patch) =>
      render.updateInteractionTarget(targetId, patch),
    unregisterRenderInteractionTarget: (targetId) =>
      render.unregisterInteractionTarget(targetId),
    clearRenderInteractionTargets: () => render.clearInteractionTargets(),
    registerRenderInteractionHandler: (targetId, registration) =>
      render.registerInteractionHandler(targetId, registration),
    unregisterRenderInteractionHandler: (targetId, eventType) =>
      render.unregisterInteractionHandler(targetId, eventType)
  }

  const propsRequests: PropsRequests = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    propsLoadData: (data: unknown) => props.load(data as any),
    propsSaveData: () => props.save() as PropsComponentRawData,
    preflightRestoreProperties: (snapshot, ownerRelations) =>
      props.preflightRestoreProperties(snapshot, ownerRelations),
    applyRestoreProperties: (preparedRestore, options) =>
      props.applyRestoreProperties(preparedRestore, options),
    preparePropertyMutationBatch: (request) =>
      props.preparePropertyMutationBatch(request),
    applyPreparedPropertyMutationBatch: (preparedBatch) =>
      props.applyPreparedPropertyMutationBatch(preparedBatch)
  }

  const propsAPIs = createPropsAPIs(propsRequests)
  const sceneTreeAPIs = createSceneTreeAPIs(sceneTreeRequests)

  const applyCanonicalChanges = (changes: readonly CanonicalChange[]): void => {
    for (const change of changes) {
      switch (change.kind) {
        case 'property-components': {
          const layers = change.layers ?? []
          const orderedPropertyIds: string[] = []
          const seenPropertyIds = new Set<string>()
          const operations: PropertyMutation[] = []
          const includeIds = (ids: readonly string[]): void => {
            for (const id of ids)
              if (!seenPropertyIds.has(id)) {
                seenPropertyIds.add(id)
                orderedPropertyIds.push(id)
              }
          }
          if (change.creations !== undefined) {
            includeIds(change.creations.map(({ id }) => id))
            operations.push({
              kind: 'create-exact-property-records',
              components: change.creations
            })
          }
          for (const { id } of change.removals ?? []) {
            if (sceneTree.getElementPropertyRelations(id).length > 0)
              throw new Error(
                `[Core] Cannot retire property record "${id}" retained by an element`
              )
          }
          change.updates.forEach(({ propertyId, values }) => {
            if (!seenPropertyIds.has(propertyId)) {
              seenPropertyIds.add(propertyId)
              orderedPropertyIds.push(propertyId)
            }
            operations.push({
              kind: 'values',
              propertyId,
              values
            })
          })
          layers.forEach(({ propertyId, changes }) => {
            if (!seenPropertyIds.has(propertyId)) {
              seenPropertyIds.add(propertyId)
              orderedPropertyIds.push(propertyId)
            }
            operations.push({ kind: 'layers', propertyId, changes })
          })
          includeIds((change.removals ?? []).map(({ id }) => id))
          operations.push({
            kind: 'remove-exact-property-records',
            components: change.removals ?? []
          })
          const preparedBatch = props.preparePropertyMutationBatch({
            operations
          })
          const result = props.applyPreparedPropertyMutationBatch(preparedBatch)
          requireOrderedIds(
            'property-component owner',
            result.orderedPropertyIds,
            orderedPropertyIds
          )
          break
        }
        case 'element-property-bindings': {
          const prepared =
            sceneTree.prepareCanonicalElementPropertyBindingMutation(
              change.changes
            )
          sceneTree.applyPreparedElementMutation(prepared)
          break
        }
        case 'element-data': {
          const elementIds = sceneTreeAPIs.applyElementDataChanges(
            change.changes
          )
          requireOrderedIds(
            'element-data owner',
            elementIds,
            change.changes.map(({ id: elementId }) => elementId)
          )
          break
        }
        case 'hierarchy-moves': {
          if (
            change.moves.length > 0 &&
            !sceneTreeAPIs.applyHierarchyMoves(change.moves)
          ) {
            throw new Error(
              '[Core] Hierarchy owner rejected a non-empty canonical move batch'
            )
          }
          break
        }
        case 'subtree-removal': {
          const prepared = sceneTree.prepareCanonicalSubtreeRemoval(
            change.change
          )
          sceneTree.applyPreparedElementMutation(prepared)
          break
        }
        case 'subtree-restore': {
          const preparedSceneRestore = sceneTreeAPIs.preflightRestoreSubtree(
            change.sceneSnapshot,
            { propertyState: 'pending-restore' }
          )
          const preparedPropsRestore = propsAPIs.preflightRestoreProperties(
            change.propsSnapshot,
            preparedSceneRestore.propertyOwnerRelations
          )
          propsAPIs.applyRestoreProperties(preparedPropsRestore)
          const result = sceneTreeAPIs.applyRestoreSubtree(preparedSceneRestore)
          if (result.elementId !== change.sceneSnapshot.elementId) {
            throw new Error(
              '[Core] Restore owner returned a different canonical root id'
            )
          }
          break
        }
        case 'element-creation': {
          const elementIds = applyCanonicalInsertion(change)
          requireOrderedIds(
            'element-creation owner',
            elementIds,
            change.entries.map(({ data }) => data.id)
          )
          break
        }
        case 'element-removal': {
          const prepared = sceneTree.prepareCanonicalElementRemoval(
            change.removals
          )
          const result = sceneTree.applyPreparedElementMutation(prepared)
          requireOrderedIds(
            'element-removal owner',
            result.orderedElementIds,
            change.removals.map(({ data }) => data.id)
          )
          break
        }
      }
    }
  }

  return {
    ...createInputSystemAPIs(),
    ...createFeatureSystemAPIs(),
    ...propsAPIs,
    ...createRenderAPIs(renderRequests),
    ...sceneTreeAPIs,
    ...createElementPropertyIntentAPIs({
      resolveElementPropertyBindings: (requests) =>
        sceneTree.resolveElementPropertyBindings(requests),
      prepareElementPropertyBindingMutation: (requests) =>
        sceneTree.prepareElementPropertyBindingMutation(requests),
      applyPreparedElementMutation: (prepared, options) =>
        sceneTree.applyPreparedElementMutation(prepared, options),
      readPropertyTargets: (targets) => props.readPropertyTargets(targets),
      preparePropertyIntentBatch: (intents, options) =>
        props.preparePropertyIntentBatch(intents, options),
      prepareSharedPropertySourceBatch: (updates, options) =>
        props.prepareSharedPropertySourceBatch(updates, options),
      preparePropertyMutationBatch: (request) =>
        props.preparePropertyMutationBatch(request),
      applyPreparedPropertyMutationBatch: (prepared) =>
        props.applyPreparedPropertyMutationBatch(prepared)
    }),
    ...createElementPropertyAPIs({
      resolveElementPropertyTargets: (requests) =>
        sceneTree.resolveElementPropertyTargets(requests),
      resolveElementPropertyBindings: (requests) =>
        sceneTree.resolveElementPropertyBindings(requests),
      prepareOwnerPropertyMutations: (updates, options) =>
        props.prepareOwnerPropertyMutations(updates, options),
      prepareElementPropertyBindingMutation: (requests) =>
        sceneTree.prepareElementPropertyBindingMutation(requests),
      applyPreparedElementMutation: (prepared, options) =>
        sceneTree.applyPreparedElementMutation(prepared, options),
      preparePropertyMutationBatch: (request) =>
        props.preparePropertyMutationBatch(request),
      applyPreparedPropertyMutationBatch: (preparedBatch) =>
        props.applyPreparedPropertyMutationBatch(preparedBatch)
    }),
    ...createElementSelectionAPIs(selection, factory),
    ...createUIContextAPIs(),
    ...createSystemPropertyAPIs(),
    applyCanonicalChanges,
    isTransactionBoundaryIdle: () => factory.isTransactionBoundaryIdle(),
    startHistoryGroup: (options) => factory.startHistoryGroup(options),
    updateHistoryGroup: (handle, mutate) =>
      factory.updateHistoryGroup(handle, mutate),
    endHistoryGroup: (handle) => factory.endHistoryGroup(handle),
    getHistoryGroupStatus: (handle) => factory.getHistoryGroupStatus(handle)
  }
}
