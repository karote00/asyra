import type { PropertyMutationReceipt } from '../types/property-mutation-receipt.js'
import type { PropsManager } from '@asyra/props-manager'
import type {
  SceneTree,
  ResolvedElementPropertyTargets,
  ElementPropertyTargetRequest
} from '@asyra/scene-tree'
import {
  applyPreparedPropertyIntent,
  type PropertyIntentApplyRequests
} from './property-intents.js'
import type { EVENT_OPTIONS } from '@asyra/utils'
import type {
  ElementPropertyAPIs,
  ElementPropertyPatchUpdate,
  ElementPropertyValuesUpdate
} from '../types/element-properties.js'

export type ElementPropertyRequests = PropertyIntentApplyRequests &
  Pick<
    SceneTree,
    'resolveElementPropertyTargets' | 'resolveElementPropertyBindings'
  > &
  Pick<PropsManager, 'prepareOwnerPropertyMutations'>

const freezeOrderedElementIds = (
  resolvedTargets: ResolvedElementPropertyTargets
): readonly string[] => Object.freeze([...resolvedTargets.orderedElementIds])

export const createElementPropertyAPIs = (
  requests: ElementPropertyRequests
): Pick<
  ElementPropertyAPIs,
  'updateElementProperties' | 'patchElementProperties'
> => {
  const applyResolvedTargets = (
    targetRequests: readonly ElementPropertyTargetRequest[],
    options?: EVENT_OPTIONS
  ): PropertyMutationReceipt => {
    if (targetRequests.length === 0) {
      return Object.freeze({ acceptedIds: Object.freeze([]), changed: false })
    }
    const resolvedTargets =
      requests.resolveElementPropertyTargets(targetRequests)
    const roots = requests.resolveElementPropertyBindings(
      resolvedTargets.relations.map((relation) => ({
        elementId: relation.ownerElementId,
        propertyName: relation.ownerPropertyName,
        expectedRootId: relation.componentId
      }))
    )
    const prepared = requests.prepareOwnerPropertyMutations(
      resolvedTargets.mutations.map((mutation, index) => ({
        target: {
          root: roots[index].relation,
          sharedRoot: roots[index].shared,
          path: []
        },
        mutation
      })),
      options
    )
    const changed = applyPreparedPropertyIntent(requests, prepared, options)
    return Object.freeze({
      acceptedIds: freezeOrderedElementIds(resolvedTargets),
      changed
    })
  }

  return {
    updateElementProperties(
      updates: readonly ElementPropertyValuesUpdate[],
      options?: EVENT_OPTIONS
    ) {
      return applyResolvedTargets(
        updates.map(({ elementId, values }) => ({
          kind: 'values',
          elementId,
          values
        })),
        options
      )
    },
    patchElementProperties(
      patches: readonly ElementPropertyPatchUpdate[],
      options?: EVENT_OPTIONS
    ) {
      return applyResolvedTargets(
        patches.map(({ elementId, values, records }) => ({
          kind: 'records',
          elementId,
          ...(values === undefined ? {} : { values }),
          records
        })),
        options
      )
    }
  }
}
