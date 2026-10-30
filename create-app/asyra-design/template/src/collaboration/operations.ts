import type {
  AddRemoveElementEntry,
  CanonicalChange,
  ElementRawData,
  HierarchyMove,
  PropertyComponentRawData,
  PropertyLayerEdit,
  UpdateElementPropertyBindingsChange,
  SceneTreeRestoreSnapshot,
  SharedPublication,
  SharedPublicationBatch,
  SharedPublicationDelivery,
  SubtreeChange,
  UpdateElementDataChange
} from './app-protocol-types'
import {
  EventTypes,
  SCENE_TREE_ACTIONS,
  SharedDataChannelNames
} from './app-protocol-types'
import { isNonBlankString } from './wire-values'
import {
  decodePublicationFramePublication,
  type DocumentSessionBootstrap
} from './protocol'

type RemoteCanonicalElementRemoval = Extract<
  CanonicalChange,
  { kind: 'element-removal' }
>['removals'][number]

type SharedPublicationSlice = SharedPublication['slices'][number]

export interface OrganizedRemotePublication {
  readonly sourceSlices: readonly SharedPublicationSlice[]
  readonly batches: readonly SharedPublicationBatch[]
  readonly deliveries: readonly Readonly<{
    channel: string
    delivery: SharedPublicationDelivery
  }>[]
  readonly sliceByBatch: ReadonlyMap<
    SharedPublicationBatch,
    SharedPublicationSlice
  >
  readonly batchesBySlice: ReadonlyMap<
    SharedPublicationSlice,
    readonly SharedPublicationBatch[]
  >
}

type CanonicalElementEvidenceDirection = 'add' | 'remove'

const canonicalElementEntriesFromDelivery = (
  delivery: SharedPublicationDelivery,
  direction: CanonicalElementEvidenceDirection
): readonly AddRemoveElementEntry[] | null => {
  const scalarEvent =
    direction === 'add' ? EventTypes.ADD_ELEMENT : EventTypes.REMOVE_ELEMENT
  if (delivery.eventName === scalarEvent) {
    const { data, parentId, index } = delivery.payload as {
      readonly data: ElementRawData
      readonly parentId: string
      readonly index: number
    }
    return [{ data, parentId, index }]
  }

  const batchEvent =
    direction === 'add' ? EventTypes.ADD_ELEMENTS : EventTypes.REMOVE_ELEMENTS
  if (delivery.eventName === batchEvent) {
    return (
      delivery.payload as {
        readonly entries: readonly AddRemoveElementEntry[]
      }
    ).entries
  }
  return null
}

const isAddPropertyDelivery = (
  delivery: SharedPublicationDelivery | undefined
): delivery is SharedPublicationDelivery<
  Readonly<{
    data: readonly PropertyComponentRawData[]
  }>
> => Boolean(delivery && delivery.eventName === EventTypes.ADD_PROPERTY)

const isRemovePropertyDelivery = (
  delivery: SharedPublicationDelivery | undefined
): delivery is SharedPublicationDelivery<
  Readonly<{
    data: readonly PropertyComponentRawData[]
  }>
> => Boolean(delivery && delivery.eventName === EventTypes.REMOVE_PROPERTY)

const sceneDeliveryFamily = (delivery: SharedPublicationDelivery): string => {
  if (
    delivery.eventName === EventTypes.ADD_ELEMENT ||
    delivery.eventName === EventTypes.ADD_ELEMENTS
  )
    return EventTypes.ADD_ELEMENTS
  if (
    delivery.eventName === EventTypes.REMOVE_ELEMENT ||
    delivery.eventName === EventTypes.REMOVE_ELEMENTS
  )
    return EventTypes.REMOVE_ELEMENTS
  return delivery.eventName
}

const splitSceneOperationRuns = (
  batch: SharedPublicationBatch
): SharedPublicationBatch[] => {
  if (batch.channel !== SharedDataChannelNames.SCENE_TREE) return [batch]
  const runs: SharedPublicationDelivery[][] = []
  let previousFamily: string | undefined
  for (const delivery of batch.deliveries) {
    const family = sceneDeliveryFamily(delivery)
    if (
      family !== previousFamily ||
      delivery.eventName === EventTypes.CHANGE_SUBTREE
    )
      runs.push([])
    runs[runs.length - 1].push(delivery)
    previousFamily = family
  }
  return runs.map((deliveries) =>
    Object.freeze({ ...batch, deliveries: Object.freeze(deliveries) })
  )
}

export const organizeRemotePublication = (
  publication: SharedPublication
): OrganizedRemotePublication => {
  const slices = publication.slices
  const batches: SharedPublicationBatch[] = []
  const deliveries: {
    channel: string
    delivery: SharedPublicationDelivery
  }[] = []
  const sliceByBatch = new Map<SharedPublicationBatch, SharedPublicationSlice>()
  const batchesBySlice = new Map<
    SharedPublicationSlice,
    readonly SharedPublicationBatch[]
  >()
  if (slices.length === 0) {
    throw new Error(
      '[collaboration] publication delivery order does not match batch evidence'
    )
  }

  for (const slice of slices) {
    const sliceBatches = slice.batches.flatMap(splitSceneOperationRuns)
    batchesBySlice.set(slice, sliceBatches)
    if (sliceBatches.length === 0) {
      throw new Error(
        '[collaboration] publication contains invalid direct batch evidence'
      )
    }

    for (const batch of sliceBatches) {
      const batchDeliveries = batch.deliveries
      if (batchDeliveries.length === 0) {
        throw new Error(
          '[collaboration] publication contains invalid direct batch evidence'
        )
      }
      sliceByBatch.set(batch, slice)
      batches.push(batch)

      for (const delivery of batchDeliveries) {
        deliveries.push({
          channel: batch.channel,
          delivery
        })
      }
    }
  }

  if (batches.length === 0 || deliveries.length === 0) {
    throw new Error(
      '[collaboration] publication delivery order does not match batch evidence'
    )
  }
  return Object.freeze({
    sourceSlices: slices,
    batches: Object.freeze(batches),
    deliveries: Object.freeze(deliveries.map((entry) => Object.freeze(entry))),
    sliceByBatch,
    batchesBySlice
  })
}

const orderTrustedElementEntries = (
  entries: readonly AddRemoveElementEntry[],
  batch: SharedPublicationBatch
): readonly AddRemoveElementEntry[] => {
  const orderedIds = batch.deliveries.flatMap(({ orderedIds: ids }) => ids)
  if (orderedIds.length === 0) return entries
  const entriesById = new Map(entries.map((entry) => [entry.data.id, entry]))
  const orderedEntries = orderedIds.flatMap((orderedId) => {
    const entry = entriesById.get(orderedId)
    return entry ? [entry] : []
  })
  return orderedEntries.length > 0 ? orderedEntries : entries
}

const classifyPropertyComponentBatch = (
  batch: SharedPublicationBatch
): readonly CanonicalChange[] | null => {
  if (batch.channel !== SharedDataChannelNames.PROPS) return null
  const changes: CanonicalChange[] = []
  let updates = new Map<string, Record<string, unknown>>()
  const flush = (): void => {
    if (updates.size === 0) return
    changes.push({
      kind: 'property-components',
      updates: [...updates].map(([propertyId, values]) => ({
        propertyId,
        values
      }))
    })
    updates = new Map()
  }
  for (const delivery of batch.deliveries) {
    const addition = delivery.eventName === EventTypes.ADD_PROPERTY
    if (isAddPropertyDelivery(delivery) || isRemovePropertyDelivery(delivery)) {
      flush()
      changes.push(
        addition
          ? {
              kind: 'property-components',
              updates: [],
              creations: delivery.payload.data,
              removals: []
            }
          : {
              kind: 'property-components',
              updates: [],
              removals: delivery.payload.data
            }
      )
      continue
    }
    if (delivery.eventName !== EventTypes.UPDATE_PROPERTY)
      throw new Error(
        '[collaboration] invalid property-component batch evidence'
      )
    const payload = delivery.payload as {
      id: string
      key: string
      layer?: PropertyLayerEdit['layer']
      after: unknown
    }
    if (payload.layer !== undefined) {
      flush()
      changes.push({
        kind: 'property-components',
        updates: [],
        removals: [],
        layers: [
          {
            propertyId: payload.id,
            changes: [
              {
                layer: payload.layer,
                key: payload.key,
                state: payload.after as PropertyLayerEdit['state']
              }
            ]
          }
        ]
      })
    } else {
      const values = updates.get(payload.id) ?? {}
      values[payload.key] = payload.after
      updates.set(payload.id, values)
    }
  }
  flush()
  return changes
}

const classifyElementDataBatch = (
  batch: SharedPublicationBatch
): readonly UpdateElementDataChange[] | null => {
  if (
    !batch.deliveries.some(
      ({ eventName }) => eventName === EventTypes.UPDATE_ELEMENT_DATA
    )
  ) {
    return null
  }
  if (batch.channel !== SharedDataChannelNames.SCENE_TREE) {
    throw new Error('[collaboration] invalid element-data batch evidence')
  }
  return Object.freeze(
    batch.deliveries.map(({ payload }) => payload as UpdateElementDataChange)
  )
}

const hierarchyMoveFromDelivery = (
  delivery: SharedPublicationDelivery
): Extract<CanonicalChange, { kind: 'hierarchy-moves' }> =>
  Object.freeze({
    kind: 'hierarchy-moves',
    moves: (delivery.payload as { readonly moves: readonly HierarchyMove[] })
      .moves
  })

const classifyHierarchyMoveBatch = (
  batch: SharedPublicationBatch
): readonly Extract<CanonicalChange, { kind: 'hierarchy-moves' }>[] | null => {
  if (
    !batch.deliveries.some(
      ({ eventName }) => eventName === EventTypes.MOVE_ELEMENTS
    )
  ) {
    return null
  }
  if (batch.channel !== SharedDataChannelNames.SCENE_TREE) {
    throw new Error('[collaboration] invalid hierarchy-move batch evidence')
  }
  return Object.freeze(batch.deliveries.map(hierarchyMoveFromDelivery))
}

const classifySubtreeRemovalBatch = (
  batches: readonly SharedPublicationBatch[],
  startBatchIndex: number
): Readonly<{
  change: SubtreeChange
  consumedBatchCount: number
}> | null => {
  const sceneBatch = batches[startBatchIndex]
  const sceneDelivery = sceneBatch?.deliveries[0]
  if (
    !sceneBatch ||
    sceneBatch.channel !== SharedDataChannelNames.SCENE_TREE ||
    sceneDelivery?.eventName !== EventTypes.CHANGE_SUBTREE ||
    (sceneDelivery.payload as { readonly action?: unknown }).action !==
      SCENE_TREE_ACTIONS.REMOVE_SUBTREE
  ) {
    return null
  }
  if (sceneBatch.deliveries.length !== 1) {
    throw new Error('[collaboration] invalid subtree removal Scene evidence')
  }
  const payload = sceneDelivery.payload as SubtreeChange
  return Object.freeze({
    change: Object.freeze({
      action: payload.action,
      undoAction: payload.undoAction,
      eventName: payload.eventName,
      elementId: payload.elementId,
      removed: payload.removed,
      rootParentChildrenAfter: payload.rootParentChildrenAfter
    }),
    consumedBatchCount: 1
  })
}

const classifyCanonicalCreationBatch = (
  organization: OrganizedRemotePublication,
  startBatchIndex: number
): Readonly<{
  changes: readonly CanonicalChange[]
  consumedBatchCount: number
}> | null => {
  const { batches, sliceByBatch } = organization
  const propertyBatch = batches[startBatchIndex]
  const sceneBatch = batches[startBatchIndex + 1]
  if (
    !propertyBatch ||
    !sceneBatch ||
    propertyBatch.channel !== SharedDataChannelNames.PROPS ||
    sceneBatch.channel !== SharedDataChannelNames.SCENE_TREE ||
    sliceByBatch.get(propertyBatch) !== sliceByBatch.get(sceneBatch)
  ) {
    return null
  }

  const propertyDeliveries = propertyBatch.deliveries
  if (!isAddPropertyDelivery(propertyDeliveries[0])) {
    return null
  }
  const properties = propertyDeliveries.flatMap(
    ({ payload }) =>
      (
        payload as {
          readonly data: readonly PropertyComponentRawData[]
        }
      ).data
  )
  let observedPropertyOwnerCount = 0
  const sourceEntries: AddRemoveElementEntry[] = []
  const hierarchyMoves: Extract<
    CanonicalChange,
    { kind: 'hierarchy-moves' }
  >[] = []
  let hierarchyMoveObserved = false

  for (const delivery of sceneBatch.deliveries) {
    const entries = canonicalElementEntriesFromDelivery(delivery, 'add')
    if (entries) {
      if (hierarchyMoveObserved) return null
      sourceEntries.push(...entries)
      continue
    }
    if (delivery.eventName !== EventTypes.MOVE_ELEMENTS) {
      return null
    }
    hierarchyMoveObserved = true
    hierarchyMoves.push(hierarchyMoveFromDelivery(delivery))
  }
  const entries = orderTrustedElementEntries(sourceEntries, sceneBatch)
  for (const entry of entries) {
    const elementData = entry.data as unknown as {
      readonly props: Readonly<Record<string, string>>
    }

    const propertyOwnerIds = Object.values(elementData.props)
    observedPropertyOwnerCount += propertyOwnerIds.length
  }

  if (entries.length === 0 || observedPropertyOwnerCount === 0) {
    return null
  }

  const changes: CanonicalChange[] = [
    Object.freeze({
      kind: 'element-creation',
      entries: Object.freeze(entries),
      properties: Object.freeze(properties)
    })
  ]
  if (hierarchyMoves.length > 0) {
    changes.push(...hierarchyMoves)
  }
  return Object.freeze({
    changes: Object.freeze(changes),
    consumedBatchCount: 2
  })
}

const classifyCanonicalRemovalBatch = (
  organization: OrganizedRemotePublication,
  startBatchIndex: number
): Readonly<{
  changes: readonly CanonicalChange[]
  consumedBatchCount: number
}> | null => {
  const { batches } = organization
  const sceneBatch = batches[startBatchIndex]
  if (!sceneBatch || sceneBatch.channel !== SharedDataChannelNames.SCENE_TREE) {
    return null
  }

  const removals: RemoteCanonicalElementRemoval[] = []
  const sourceEntries: AddRemoveElementEntry[] = []
  const hierarchyMoves: Extract<
    CanonicalChange,
    { kind: 'hierarchy-moves' }
  >[] = []
  let removalObserved = false
  for (const delivery of sceneBatch.deliveries) {
    const entries = canonicalElementEntriesFromDelivery(delivery, 'remove')
    if (entries) {
      removalObserved = true
      sourceEntries.push(...entries)
      continue
    }
    if (removalObserved || delivery.eventName !== EventTypes.MOVE_ELEMENTS) {
      return null
    }
    hierarchyMoves.push(hierarchyMoveFromDelivery(delivery))
  }
  for (const entry of orderTrustedElementEntries(sourceEntries, sceneBatch)) {
    removals.push(
      Object.freeze({
        data: entry.data,
        parentId: entry.parentId,
        index: entry.index
      })
    )
  }

  if (removals.length === 0) return null

  const changes: CanonicalChange[] = []
  if (hierarchyMoves.length > 0) {
    changes.push(...hierarchyMoves)
  }
  changes.push(
    Object.freeze({
      kind: 'element-removal',
      removals: Object.freeze(removals)
    })
  )
  return Object.freeze({
    changes: Object.freeze(changes),
    consumedBatchCount: 1
  })
}

const appendRemoteCanonicalChange = (
  changes: CanonicalChange[],
  change: CanonicalChange
): void => {
  const previous = changes.at(-1)
  if (
    previous?.kind === 'element-removal' &&
    change.kind === 'element-removal' &&
    !previous.removals.some(({ data }) =>
      Array.isArray((data as { children?: unknown }).children)
    ) &&
    !change.removals.some(({ data }) =>
      Array.isArray((data as { children?: unknown }).children)
    )
  ) {
    changes[changes.length - 1] = Object.freeze({
      kind: 'element-removal',
      removals: Object.freeze([...previous.removals, ...change.removals])
    })
    return
  }
  changes.push(change)
}

const classifySubtreeRestoreBatch = (
  organization: OrganizedRemotePublication,
  startBatchIndex: number
): Readonly<{ change: CanonicalChange; consumedBatchCount: number }> | null => {
  const { batches, sliceByBatch } = organization
  const first = batches[startBatchIndex]
  const sourceSlice = first && sliceByBatch.get(first)
  const components: PropertyComponentRawData[] = []
  let index = startBatchIndex
  while (batches[index]?.channel === SharedDataChannelNames.PROPS) {
    const batch = batches[index]
    if (
      !batch ||
      sliceByBatch.get(batch) !== sourceSlice ||
      !batch.deliveries.every(isAddPropertyDelivery)
    )
      return null
    for (const delivery of batch.deliveries) {
      if (!isAddPropertyDelivery(delivery)) return null
      components.push(...delivery.payload.data)
    }
    index += 1
  }
  const scene = batches[index]
  const delivery = scene?.deliveries[0]
  if (
    !scene ||
    scene.channel !== SharedDataChannelNames.SCENE_TREE ||
    sliceByBatch.get(scene) !== sourceSlice ||
    scene.deliveries.length !== 1 ||
    delivery?.eventName !== EventTypes.CHANGE_SUBTREE ||
    (delivery.payload as SubtreeChange).action !==
      SCENE_TREE_ACTIONS.RESTORE_SUBTREE
  )
    return null
  const payload = delivery.payload as SubtreeChange
  return Object.freeze({
    change: Object.freeze({
      kind: 'subtree-restore',
      sceneSnapshot: {
        elementId: payload.elementId as string,
        removed: payload.removed as SceneTreeRestoreSnapshot['removed'],
        rootParentChildrenAfter:
          payload.rootParentChildrenAfter as readonly string[]
      },
      propsSnapshot: { components }
    }),
    consumedBatchCount: index - startBatchIndex + 1
  })
}

const createRemoteApplySteps = (
  organization: OrganizedRemotePublication
): readonly CanonicalChange[] => {
  const changes: CanonicalChange[] = []
  const { batches } = organization
  let batchIndex = 0
  while (batchIndex < batches.length) {
    const restore = classifySubtreeRestoreBatch(organization, batchIndex)
    if (restore) {
      changes.push(restore.change)
      batchIndex += restore.consumedBatchCount
      continue
    }
    const creation = classifyCanonicalCreationBatch(organization, batchIndex)
    if (creation) {
      changes.push(...creation.changes)
      batchIndex += creation.consumedBatchCount
      continue
    }
    const removal = classifyCanonicalRemovalBatch(organization, batchIndex)
    if (removal) {
      removal.changes.forEach((change) =>
        appendRemoteCanonicalChange(changes, change)
      )
      batchIndex += removal.consumedBatchCount
      continue
    }
    const batch = batches[batchIndex] as SharedPublicationBatch
    const propertyComponents = classifyPropertyComponentBatch(batch)
    if (propertyComponents) {
      changes.push(...propertyComponents)
      batchIndex += 1
      continue
    }
    if (
      batch.channel === SharedDataChannelNames.SCENE_TREE &&
      batch.deliveries.every(
        ({ eventName }) =>
          eventName === EventTypes.UPDATE_ELEMENT_PROPERTY_BINDINGS
      )
    ) {
      changes.push({
        kind: 'element-property-bindings',
        changes: batch.deliveries.map(({ payload }) => {
          const { action, eventName, id, changes } =
            payload as UpdateElementPropertyBindingsChange
          return { action, eventName, id, changes }
        })
      })
      batchIndex += 1
      continue
    }
    const elementDataChanges = classifyElementDataBatch(batch)
    if (elementDataChanges) {
      changes.push(
        Object.freeze({
          kind: 'element-data',
          changes: elementDataChanges
        })
      )
      batchIndex += 1
      continue
    }
    const hierarchyMoves = classifyHierarchyMoveBatch(batch)
    if (hierarchyMoves) {
      changes.push(...hierarchyMoves)
      batchIndex += 1
      continue
    }
    const subtreeRemoval = classifySubtreeRemovalBatch(batches, batchIndex)
    if (subtreeRemoval) {
      changes.push(
        Object.freeze({
          kind: 'subtree-removal',
          change: subtreeRemoval.change
        })
      )
      batchIndex += subtreeRemoval.consumedBatchCount
      continue
    }
    throw new Error(
      `[collaboration] unsupported canonical publication batch evidence at batch ${batchIndex} ${batch.channel}/${batch.deliveries.map(({ eventName }) => eventName).join(',')}`
    )
  }
  return Object.freeze(changes)
}

export const canonicalChangesFromOrganizedPublication = (
  organization: OrganizedRemotePublication
): readonly CanonicalChange[] => createRemoteApplySteps(organization)

export const organizeSourceSlice = (
  slice: SharedPublicationSlice,
  publication: OrganizedRemotePublication
): OrganizedRemotePublication => {
  const batches = [...(publication.batchesBySlice.get(slice) ?? [])]
  const sliceByBatch = new Map<SharedPublicationBatch, SharedPublicationSlice>()
  const batchesBySlice = new Map<
    SharedPublicationSlice,
    readonly SharedPublicationBatch[]
  >([[slice, batches]])
  batches.forEach((batch) => sliceByBatch.set(batch, slice))
  return Object.freeze({
    sourceSlices: Object.freeze([slice]),
    batches: Object.freeze(batches),
    deliveries: Object.freeze(
      batches.flatMap((batch) =>
        batch.deliveries.map((delivery) =>
          Object.freeze({ channel: batch.channel, delivery })
        )
      )
    ),
    sliceByBatch,
    batchesBySlice
  })
}

export const decodeDocumentPublication = (
  publication: SharedPublication
): readonly CanonicalChange[] => {
  const organization = organizeRemotePublication(publication)
  return Object.freeze(
    organization.sourceSlices.flatMap((slice) =>
      canonicalChangesFromOrganizedPublication(
        organizeSourceSlice(slice, organization)
      )
    )
  )
}

export interface ApplyDocumentSessionBootstrapTailOptions {
  readonly bootstrap: DocumentSessionBootstrap
  readonly applyPublication: (
    publication: SharedPublication
  ) => void | Promise<void>
}

const decodeBase64PublicationFrame = (encoded: string): Uint8Array => {
  const binary = globalThis.atob(encoded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

export const applyDocumentSessionBootstrapTail = async ({
  bootstrap,
  applyPublication
}: ApplyDocumentSessionBootstrapTailOptions): Promise<number> => {
  const { durableSequence, headSequence, pendingTail } = bootstrap
  if (
    !Number.isSafeInteger(durableSequence) ||
    durableSequence < 0 ||
    !Number.isSafeInteger(headSequence) ||
    headSequence < durableSequence ||
    !Array.isArray(pendingTail) ||
    pendingTail.length !== headSequence - durableSequence
  ) {
    throw new Error(
      '[collaboration] document bootstrap sequence range is invalid'
    )
  }

  const publicationIds = new Set<string>()
  const decodedPublications = pendingTail.map(
    (
      { sequence, publicationId, encodedPublicationFrames, fromActorId },
      index
    ) => {
      const decoded = decodePublicationFramePublication(
        encodedPublicationFrames.map(decodeBase64PublicationFrame)
      ).publication
      if (
        sequence !== durableSequence + index + 1 ||
        !isNonBlankString(fromActorId) ||
        decoded.publicationId !== publicationId ||
        publicationIds.has(publicationId)
      ) {
        throw new Error(
          '[collaboration] document bootstrap tail is gapped or duplicated'
        )
      }
      publicationIds.add(publicationId)
      return decoded
    }
  )

  for (const publication of decodedPublications) {
    await applyPublication(publication)
  }
  return headSequence
}
