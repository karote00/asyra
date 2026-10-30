import type { CanonicalChange, SharedPublication } from './app-protocol-types'
import { DocumentPublicationContract } from './app-protocol-types'
import {
  canonicalChangesFromOrganizedPublication,
  organizeRemotePublication,
  organizeSourceSlice
} from './operations'
import { isFiniteTransportValue, isSharedPublication } from './protocol'
import { isNonBlankString, isRecord } from './wire-values'

export class DocumentPublicationValidationError extends Error {
  constructor(message: string) {
    super(`[document-publication] ${message}`)
    this.name = 'DocumentPublicationValidationError'
  }
}

const invalid = (path: string): never => {
  throw new DocumentPublicationValidationError(
    `Invalid canonical operation at ${path}`
  )
}
const fields = (
  value: unknown,
  required: string[],
  optional: string[] = []
): value is Record<string, unknown> =>
  isRecord(value) &&
  required.every((key) => Object.hasOwn(value, key)) &&
  Object.keys(value).every(
    (key) => required.includes(key) || optional.includes(key)
  )
const array = (value: unknown, check: (entry: unknown) => boolean): boolean =>
  Array.isArray(value) && value.every(check)
const strings = (value: unknown): boolean => array(value, isNonBlankString)
const index = (value: unknown): boolean =>
  Number.isSafeInteger(value) && Number(value) >= 0
const location = (value: unknown): boolean =>
  fields(value, ['parentId', 'index']) &&
  isNonBlankString(value.parentId) &&
  index(value.index)
const component = (value: unknown): boolean =>
  isRecord(value) && isNonBlankString(value.id) && isNonBlankString(value.type)
const element = (value: unknown): boolean =>
  component(value) &&
  isRecord(value) &&
  (value.props === undefined ||
    (isRecord(value.props) &&
      Object.values(value.props).every(isNonBlankString))) &&
  (value.children === undefined || strings(value.children))
const entry = (value: unknown): boolean =>
  fields(value, ['data', 'parentId', 'index']) &&
  element(value.data) &&
  isNonBlankString(value.parentId) &&
  index(value.index)
const removed = (value: unknown): boolean =>
  fields(value, ['data', 'elementId', 'parentId', 'index']) &&
  element(value.data) &&
  isRecord(value.data) &&
  value.elementId === value.data.id &&
  isNonBlankString(value.parentId) &&
  index(value.index)
const scene = (value: unknown): boolean =>
  fields(value, ['elementId', 'removed', 'rootParentChildrenAfter']) &&
  isNonBlankString(value.elementId) &&
  array(value.removed, removed) &&
  strings(value.rootParentChildrenAfter)
const dataChange = (value: unknown): boolean =>
  fields(value, ['action', 'eventName', 'id', 'changes']) &&
  value.action === 'updateElementData' &&
  value.eventName === 'updateElementData' &&
  isNonBlankString(value.id) &&
  array(
    value.changes,
    (field) =>
      fields(field, ['key', 'before', 'after']) &&
      (field.key === 'name'
        ? typeof field.before === 'string' && typeof field.after === 'string'
        : (field.key === 'visible' || field.key === 'lock') &&
          typeof field.before === 'boolean' &&
          typeof field.after === 'boolean')
  )

const isCanonicalChange = (value: unknown): value is CanonicalChange => {
  if (!isRecord(value)) {
    return false
  }
  switch (value.kind) {
    case 'property-components':
      return (
        fields(
          value,
          ['kind', 'updates'],
          ['creations', 'removals', 'layers']
        ) &&
        array(
          value.updates,
          (update) =>
            fields(update, ['propertyId', 'values']) &&
            isNonBlankString(update.propertyId) &&
            isRecord(update.values) &&
            !Object.hasOwn(update.values, 'id') &&
            !Object.hasOwn(update.values, 'type')
        ) &&
        (value.creations === undefined || array(value.creations, component)) &&
        (value.removals === undefined || array(value.removals, component)) &&
        (value.layers === undefined ||
          array(
            value.layers,
            (item) =>
              fields(item, ['propertyId', 'changes']) &&
              isNonBlankString(item.propertyId) &&
              array(
                item.changes,
                (edit) =>
                  fields(edit, ['layer', 'key', 'state']) &&
                  ['overrides', 'childBindings', 'sharedSource'].includes(
                    edit.layer as string
                  ) &&
                  isNonBlankString(edit.key) &&
                  isRecord(edit.state) &&
                  (edit.state.present === false
                    ? fields(edit.state, ['present'])
                    : edit.state.present === true &&
                      fields(edit.state, ['present', 'value']))
              )
          ))
      )
    case 'element-property-bindings':
      return (
        fields(value, ['kind', 'changes']) &&
        array(
          value.changes,
          (item) =>
            fields(item, ['action', 'eventName', 'id', 'changes']) &&
            item.action === 'updateElementPropertyBindings' &&
            item.eventName === 'updateElementPropertyBindings' &&
            isNonBlankString(item.id) &&
            array(
              item.changes,
              (binding) =>
                fields(binding, ['key', 'before', 'after']) &&
                isNonBlankString(binding.key) &&
                isNonBlankString(binding.before) &&
                isNonBlankString(binding.after)
            )
        )
      )
    case 'element-data':
      return (
        fields(value, ['kind', 'changes']) && array(value.changes, dataChange)
      )
    case 'hierarchy-moves':
      return (
        fields(value, ['kind', 'moves']) &&
        array(
          value.moves,
          (move) =>
            fields(move, ['elementId', 'before', 'after']) &&
            isNonBlankString(move.elementId) &&
            location(move.before) &&
            location(move.after)
        )
      )
    case 'element-creation':
      return (
        fields(value, ['kind', 'entries', 'properties']) &&
        array(value.entries, entry) &&
        array(value.properties, component)
      )
    case 'element-removal':
      return fields(value, ['kind', 'removals']) && array(value.removals, entry)
    case 'subtree-restore':
      return (
        fields(value, ['kind', 'sceneSnapshot', 'propsSnapshot']) &&
        scene(value.sceneSnapshot) &&
        fields(value.propsSnapshot, ['components']) &&
        array(value.propsSnapshot.components, component)
      )
    case 'subtree-removal': {
      if (
        !fields(value, ['kind', 'change']) ||
        !fields(value.change, [
          'action',
          'undoAction',
          'eventName',
          'elementId',
          'removed',
          'rootParentChildrenAfter'
        ])
      ) {
        return false
      }
      const { action, undoAction, eventName, ...snapshot } = value.change
      return (
        action === 'removeSubtree' &&
        undoAction === 'restoreSubtree' &&
        eventName === 'changeSubtree' &&
        scene(snapshot)
      )
    }
    default:
      return false
  }
}

/** Validate the App document contract; never infer operations from owner batches. */
export const readDocumentPublicationSlices = (
  publication: SharedPublication
): readonly (readonly CanonicalChange[])[] => {
  if (!isSharedPublication(publication)) {
    invalid('envelope')
  }
  return Object.freeze(
    publication.slices.map((slice) =>
      Object.freeze(
        slice.batches.flatMap((batch) => {
          if (batch.channel !== DocumentPublicationContract.channel) {
            invalid(`slice ${slice.sliceId}/channel`)
          }
          return batch.deliveries.flatMap((delivery) => {
            const payload = delivery.payload
            if (
              delivery.eventName !== DocumentPublicationContract.event ||
              delivery.compensatesDeliveryId !== undefined ||
              !fields(payload, ['version', 'changes']) ||
              payload.version !== DocumentPublicationContract.version ||
              !Array.isArray(payload.changes) ||
              payload.changes.length === 0 ||
              !isFiniteTransportValue(payload)
            ) {
              return invalid(`delivery ${delivery.deliveryId}`)
            }
            return payload.changes.map((change, position) => {
              if (!isCanonicalChange(change)) {
                invalid(`delivery ${delivery.deliveryId}/changes/${position}`)
              }
              return change
            })
          })
        })
      )
    )
  )
}

// Execution options belong to the source transaction, never to remote history.
const documentChange = (change: CanonicalChange): CanonicalChange => {
  if (change.kind === 'element-data') {
    return Object.freeze({
      kind: change.kind,
      changes: Object.freeze(
        change.changes.map(({ action, eventName, id, changes }) =>
          Object.freeze({ action, eventName, id, changes })
        )
      )
    })
  }
  if (change.kind === 'subtree-removal') {
    const {
      action,
      undoAction,
      eventName,
      elementId,
      removed,
      rootParentChildrenAfter
    } = change.change
    return Object.freeze({
      kind: change.kind,
      change: Object.freeze({
        action,
        undoAction,
        eventName,
        elementId,
        removed,
        rootParentChildrenAfter
      })
    })
  }
  return change
}

/** The sole producer translation. Factory remains the owner of local history. */
export const prepareDocumentPublication = (
  source: SharedPublication
): SharedPublication => {
  const organization = organizeRemotePublication(source)
  const publication: SharedPublication = Object.freeze({
    publicationId: source.publicationId,
    artifactId: source.artifactId,
    transactionId: source.transactionId,
    origin: source.origin,
    mode: source.mode,
    ...(source.compensatesPublicationId
      ? { compensatesPublicationId: source.compensatesPublicationId }
      : {}),
    slices: Object.freeze(
      organization.sourceSlices.map((slice) => {
        const changes = canonicalChangesFromOrganizedPublication(
          organizeSourceSlice(slice, organization)
        )
        const deliveryId = `${slice.sliceId}:document`
        return Object.freeze({
          sliceId: slice.sliceId,
          orderedIds: Object.freeze([deliveryId]),
          batches: Object.freeze([
            Object.freeze({
              batchId: deliveryId,
              channel: DocumentPublicationContract.channel,
              deliveries: Object.freeze([
                Object.freeze({
                  deliveryId,
                  orderedIds: Object.freeze([deliveryId]),
                  eventName: DocumentPublicationContract.event,
                  payload: Object.freeze({
                    version: DocumentPublicationContract.version,
                    changes: Object.freeze(changes.map(documentChange))
                  })
                })
              ])
            })
          ])
        })
      })
    )
  })
  return publication
}
