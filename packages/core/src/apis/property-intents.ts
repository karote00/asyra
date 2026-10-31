import type { PropertyMutationReceipt } from '../types/property-mutation-receipt.js'
import type {
  PropsManager,
  PropertyIntent,
  PropertyTarget,
  PreparedPropertyIntentBatch
} from '@asyra/props-manager'
import type { SceneTree } from '@asyra/scene-tree'
import type { EVENT_OPTIONS } from '@asyra/utils'
import type {
  ElementPropertyIntentAPIs,
  ElementPropertyTarget
} from '../types/property-intents.js'

export type ElementPropertyIntentRequests = Pick<
  PropsManager,
  | 'readPropertyTargets'
  | 'preparePropertyIntentBatch'
  | 'prepareSharedPropertySourceBatch'
  | 'preparePropertyMutationBatch'
  | 'applyPreparedPropertyMutationBatch'
> &
  Pick<
    SceneTree,
    | 'resolveElementPropertyBindings'
    | 'prepareElementPropertyBindingMutation'
    | 'applyPreparedElementMutation'
  >

export type PropertyIntentApplyRequests = Pick<
  ElementPropertyIntentRequests,
  | 'prepareElementPropertyBindingMutation'
  | 'applyPreparedElementMutation'
  | 'preparePropertyMutationBatch'
  | 'applyPreparedPropertyMutationBatch'
>

export const applyPreparedPropertyIntent = (
  requests: PropertyIntentApplyRequests,
  prepared: PreparedPropertyIntentBatch,
  options?: EVENT_OPTIONS
): boolean => {
  const scene = prepared.rootBindings.length
    ? requests.prepareElementPropertyBindingMutation(prepared.rootBindings)
    : undefined
  const released = new Set(prepared.releasedRootPropertyIds)
  const orphanRoots =
    scene?.orphanRootPropertyIds.filter((id) => released.has(id)) ?? []
  const created = new Set(prepared.createdPropertyIds)
  const retirement = orphanRoots.length
    ? requests.preparePropertyMutationBatch({
        operations: [
          {
            kind: 'remove-exact-orphan-property-graphs',
            orphanRootPropertyIds: orphanRoots,
            retainedRootPropertyIds: [
              ...new Set([
                ...(scene?.retainedRootPropertyIds ?? []).filter(
                  (id) => !created.has(id)
                ),
                ...prepared.retainedExistingPropertyIds
              ])
            ]
          }
        ],
        options
      })
    : undefined
  const properties = requests.applyPreparedPropertyMutationBatch(
    prepared.properties
  )
  const binding = scene
    ? requests.applyPreparedElementMutation(scene, options)
    : undefined
  const retired = retirement
    ? requests.applyPreparedPropertyMutationBatch(retirement)
    : undefined
  return (
    properties.evidence.length > 0 ||
    !!binding?.evidence.length ||
    !!retired?.evidence.length
  )
}

export const createElementPropertyIntentAPIs = (
  requests: ElementPropertyIntentRequests
): ElementPropertyIntentAPIs => {
  const resolve = (
    targets: readonly ElementPropertyTarget[]
  ): readonly PropertyTarget[] => {
    const roots = requests.resolveElementPropertyBindings(targets)
    return targets.map((target, index) => ({
      root: roots[index].relation,
      sharedRoot: roots[index].shared,
      path: target.path,
      ...(target.expectedPropertyId === undefined
        ? {}
        : { expectedPropertyId: target.expectedPropertyId }),
      ...(target.expectedSourceId === undefined
        ? {}
        : { expectedSourceId: target.expectedSourceId })
    }))
  }
  const apply = (
    targets: readonly ElementPropertyTarget[],
    toIntent: (target: PropertyTarget, index: number) => PropertyIntent,
    options?: EVENT_OPTIONS
  ): PropertyMutationReceipt => {
    if (targets.length === 0) {
      return Object.freeze({ acceptedIds: Object.freeze([]), changed: false })
    }
    const prepared = requests.preparePropertyIntentBatch(
      resolve(targets).map(toIntent),
      options
    )
    const changed = applyPreparedPropertyIntent(requests, prepared, options)
    return Object.freeze({
      acceptedIds: Object.freeze([
        ...new Set(targets.map((target) => target.elementId))
      ]),
      changed
    })
  }
  return {
    readElementPropertyTargets: (targets) =>
      requests.readPropertyTargets(resolve(targets)),
    updateElementPropertyTargets: (updates, options) =>
      apply(
        updates.map((update) => update.target),
        (target, index) => ({
          kind: 'override',
          target,
          values: updates[index].values
        }),
        options
      ),
    resetElementPropertyOverrides: (updates, options) =>
      apply(
        updates.map((update) => update.target),
        (target, index) => ({
          kind: 'reset',
          target,
          keys: updates[index].keys
        }),
        options
      ),
    detachElementPropertyTargets: (targets, options) =>
      apply(targets, (target) => ({ kind: 'detach', target }), options),
    shareElementPropertyTargets: (updates, options) =>
      apply(
        updates.map((update) => update.target),
        (target, index) => ({
          kind: 'share',
          target,
          sourceId: updates[index].sourceId
        }),
        options
      ),
    updateSharedPropertySources: (updates, options) => {
      const prepared = requests.prepareSharedPropertySourceBatch(
        updates,
        options
      )
      const result = requests.applyPreparedPropertyMutationBatch(prepared)
      return Object.freeze({
        acceptedIds: Object.freeze([
          ...new Set(updates.map((update) => update.propertyId))
        ]),
        changed: result.evidence.length > 0
      })
    }
  }
}
