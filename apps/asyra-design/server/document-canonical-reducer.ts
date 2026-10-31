import { isRecord, isNonBlankString } from '../src/collaboration/wire-values'
import { DocumentPersistenceError } from './document-persistence-error'
import {
  persistenceSpan,
  type DocumentPersistenceObservation
} from './document-persistence-observation'
import type {
  CanonicalChange,
  AppDocumentData,
  ElementRawData,
  GroupRawData
} from '../src/collaboration/app-protocol-types'

const fail = (message: string): never => {
  throw new DocumentPersistenceError(
    'invalid-operation',
    `[document-canonical-reducer] ${message}`
  )
}

const cloneJson = <Value>(value: Value): Value =>
  JSON.parse(JSON.stringify(value)) as Value

// Compare the durable JSON value: binary -0 and checkpoint 0 are the same
// number, while every field, reference and array position remains significant.
const sameJson = (left: unknown, right: unknown): boolean => {
  if (left === right) {
    return true
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => sameJson(value, right[index]))
    )
  }
  if (!isRecord(left) || !isRecord(right)) {
    return false
  }
  const keys = Object.keys(left)
  return (
    keys.length === Object.keys(right).length &&
    keys.every(
      (key) => Object.hasOwn(right, key) && sameJson(left[key], right[key])
    )
  )
}

const createWorkingDocument = (document: AppDocumentData): AppDocumentData => ({
  ...document,
  sceneTree: {
    ...document.sceneTree,
    workspaceList: [...document.sceneTree.workspaceList],
    elements: { ...document.sceneTree.elements }
  },
  props: { ...document.props },
  ...(document.systemContext === undefined
    ? {}
    : { systemContext: { ...document.systemContext } })
})

const getElement = (
  document: AppDocumentData,
  elementId: string
): ElementRawData | GroupRawData => {
  const element = document.sceneTree.elements[elementId]
  if (!element) {
    fail(`element "${elementId}" is missing`)
  }
  return element
}

const getContainerChildren = (
  document: AppDocumentData,
  parentId: string
): readonly string[] => {
  const parent = getElement(document, parentId) as GroupRawData
  if (!Array.isArray(parent.children)) {
    fail(`parent "${parentId}" is not a container`)
  }
  return parent.children
}

const setContainerChildren = (
  document: AppDocumentData,
  parentId: string,
  children: readonly string[]
): void => {
  const parent = getElement(document, parentId) as GroupRawData
  document.sceneTree.elements[parentId] = {
    ...parent,
    children: [...children]
  }
}

const applyPropertyComponents = (
  document: AppDocumentData,
  change: Extract<CanonicalChange, { kind: 'property-components' }>
): void => {
  for (const component of change.creations ?? []) {
    if (document.props[component.id]) {
      fail(`duplicate property "${component.id}"`)
    }
    document.props[component.id] = cloneJson(component)
  }
  for (const update of change.updates) {
    const component = document.props[update.propertyId]
    if (!component) {
      fail(`property "${update.propertyId}" is missing`)
    }
    if (
      component.inheritance ||
      ['id', 'type', 'inheritance', 'sharedSource'].some((key) =>
        Object.hasOwn(update.values, key)
      )
    ) {
      fail(
        `property "${update.propertyId}" requires a canonical layer operation`
      )
    }
    document.props[update.propertyId] = {
      ...component,
      ...cloneJson(update.values)
    }
  }
  for (const item of change.layers ?? []) {
    const component = document.props[item.propertyId]
    if (!component) {
      fail(`property "${item.propertyId}" is missing`)
    }
    let next = cloneJson(component)
    for (const edit of item.changes) {
      if (edit.layer === 'sharedSource') {
        if (
          edit.key !== 'sharedSource' ||
          next.inheritance ||
          (edit.state.present && edit.state.value !== true)
        ) {
          fail(`invalid shared source layer "${item.propertyId}"`)
        }
        if (edit.state.present) {
          next.sharedSource = true
        } else {
          Reflect.deleteProperty(next, 'sharedSource')
        }
      } else {
        if (
          !isRecord(next.inheritance) ||
          !isRecord(next.inheritance[edit.layer])
        ) {
          fail(`property "${item.propertyId}" has no ${edit.layer} layer`)
        }
        const inheritance = next.inheritance as Record<string, unknown>
        const layer = {
          ...(inheritance[edit.layer] as Record<string, unknown>)
        }
        if (edit.state.present) {
          Object.defineProperty(layer, edit.key, {
            value: cloneJson(edit.state.value),
            enumerable: true,
            writable: true,
            configurable: true
          })
        } else {
          Reflect.deleteProperty(layer, edit.key)
        }
        next = { ...next, inheritance: { ...inheritance, [edit.layer]: layer } }
      }
    }
    document.props[item.propertyId] = next
  }
  const removed = new Set<string>()
  for (const component of change.removals ?? []) {
    if (
      removed.has(component.id) ||
      !sameJson(document.props[component.id], component)
    ) {
      fail(`stale or duplicate property retirement "${component.id}"`)
    }
    removed.add(component.id)
  }
  for (const id of removed) {
    Reflect.deleteProperty(document.props, id)
  }
}

const validatePropertyLinks = (
  document: AppDocumentData,
  changes: readonly CanonicalChange[]
): void => {
  const propertyIds = new Set<string>()
  const elementIds = new Set<string>()
  const invalidatedIds = new Set<string>()
  for (const change of changes) {
    if (change.kind === 'element-property-bindings') {
      change.changes.forEach(({ id }) => elementIds.add(id))
    }
    if (change.kind !== 'property-components') {
      continue
    }
    change.creations?.forEach(({ id }) => propertyIds.add(id))
    change.removals?.forEach(({ id }) => invalidatedIds.add(id))
    change.layers?.forEach(({ propertyId, changes: edits }) => {
      propertyIds.add(propertyId)
      if (
        edits.some(
          (edit) => edit.layer === 'sharedSource' && !edit.state.present
        )
      ) {
        invalidatedIds.add(propertyId)
      }
    })
  }
  if (invalidatedIds.size > 0) {
    for (const element of Object.values(document.sceneTree.elements)) {
      if (
        Object.values(element.props ?? {}).some((id) => invalidatedIds.has(id))
      ) {
        elementIds.add(element.id)
      }
    }
    for (const component of Object.values(document.props)) {
      const inheritance = component.inheritance
      if (
        isRecord(inheritance) &&
        (invalidatedIds.has(inheritance.sourceId as string) ||
          (isRecord(inheritance.childBindings) &&
            Object.entries(inheritance.childBindings).some(
              ([slot, id]) =>
                invalidatedIds.has(slot) || invalidatedIds.has(id as string)
            )))
      ) {
        propertyIds.add(component.id)
      }
    }
  }
  for (const elementId of elementIds) {
    // Ordered binding/removal application already checks existence. Only live
    // owners have outgoing links at the end of a persistence window.
    const element = document.sceneTree.elements[elementId]
    if (!element) {
      continue
    }
    for (const id of Object.values(element.props ?? {})) {
      if (!document.props[id]) {
        fail(`element "${element.id}" references missing property "${id}"`)
      }
    }
  }
  for (const propertyId of propertyIds) {
    const component = document.props[propertyId]
    if (!component) {
      continue
    }
    if (
      component.sharedSource !== undefined &&
      component.sharedSource !== true
    ) {
      fail(`invalid shared source marker "${component.id}"`)
    }
    if (component.inheritance === undefined) {
      continue
    }
    const inheritance = component.inheritance
    if (
      !isRecord(inheritance) ||
      !isNonBlankString(inheritance.sourceId) ||
      !isRecord(inheritance.overrides) ||
      !isRecord(inheritance.childBindings) ||
      Object.keys(inheritance).some(
        (key) => !['sourceId', 'overrides', 'childBindings'].includes(key)
      ) ||
      Object.keys(component).some(
        (key) => !['id', 'type', 'inheritance'].includes(key)
      )
    ) {
      fail(`invalid property inheritance "${component.id}"`)
    }
    const { sourceId, childBindings } = inheritance as {
      sourceId: string
      childBindings: Record<string, unknown>
    }
    const source = document.props[sourceId]
    if (
      !source ||
      source.id === component.id ||
      source.type !== component.type ||
      source.inheritance !== undefined ||
      source.sharedSource !== true
    ) {
      fail(`invalid property source "${component.id}"`)
    }
    const localIds = new Set<string>()
    for (const [slot, id] of Object.entries(childBindings)) {
      if (
        !isNonBlankString(id) ||
        !document.props[id] ||
        !document.props[slot] ||
        document.props[slot].type !== document.props[id].type ||
        localIds.has(id)
      ) {
        fail(`invalid property binding "${component.id}:${slot}"`)
      }
      localIds.add(id as string)
    }
  }
}

const applyElementPropertyBindings = (
  document: AppDocumentData,
  change: Extract<CanonicalChange, { kind: 'element-property-bindings' }>
): void => {
  for (const entry of change.changes) {
    const element = getElement(document, entry.id)
    const properties = { ...element.props }
    for (const binding of entry.changes) {
      if (properties[binding.key] !== binding.before) {
        fail(`stale element property binding "${entry.id}:${binding.key}"`)
      }
      const before = document.props[binding.before],
        after = document.props[binding.after]
      if (!before || !after || before.type !== after.type) {
        fail(`invalid element property binding "${entry.id}:${binding.key}"`)
      }
      Object.defineProperty(properties, binding.key, {
        value: binding.after,
        enumerable: true,
        writable: true,
        configurable: true
      })
    }
    document.sceneTree.elements[entry.id] = { ...element, props: properties }
  }
}

const applyElementData = (
  document: AppDocumentData,
  change: Extract<CanonicalChange, { kind: 'element-data' }>
): void => {
  for (const entry of change.changes) {
    const element = getElement(document, entry.id)
    const next = { ...element }
    for (const field of entry.changes) {
      if (next[field.key] !== field.before) {
        fail(`element "${entry.id}" data evidence is stale`)
      }
      Object.assign(next, { [field.key]: field.after })
    }
    document.sceneTree.elements[entry.id] = next
  }
}

const applyHierarchyMoves = (
  document: AppDocumentData,
  change: Extract<CanonicalChange, { kind: 'hierarchy-moves' }>
): void => {
  const movingIds = new Set(change.moves.map(({ elementId }) => elementId))
  if (movingIds.size !== change.moves.length) {
    fail('hierarchy moves contain duplicate elements')
  }
  const beforeParents = new Map<string, readonly string[]>()
  for (const move of change.moves) {
    getElement(document, move.elementId)
    const children =
      beforeParents.get(move.before.parentId) ??
      getContainerChildren(document, move.before.parentId)
    beforeParents.set(move.before.parentId, children)
    if (children[move.before.index] !== move.elementId) {
      fail(`hierarchy move evidence for "${move.elementId}" is stale`)
    }
  }

  const nextChildren = new Map<string, string[]>()
  for (const [parentId, children] of beforeParents) {
    nextChildren.set(
      parentId,
      children.filter((elementId) => !movingIds.has(elementId))
    )
  }
  const afterParents = new Set(
    change.moves.map(({ after: { parentId } }) => parentId)
  )
  for (const parentId of afterParents) {
    if (!nextChildren.has(parentId)) {
      nextChildren.set(parentId, [...getContainerChildren(document, parentId)])
    }
    const parentMoves = change.moves
      .filter(({ after }) => after.parentId === parentId)
      .sort((left, right) => left.after.index - right.after.index)
    const children =
      nextChildren.get(parentId) ??
      fail(`hierarchy parent "${parentId}" is missing`)
    for (const move of parentMoves) {
      if (move.after.index < 0 || move.after.index > children.length) {
        fail(`hierarchy target for "${move.elementId}" is invalid`)
      }
      children.splice(move.after.index, 0, move.elementId)
    }
  }
  nextChildren.forEach((children, parentId) =>
    setContainerChildren(document, parentId, children)
  )
  for (const move of change.moves) {
    document.sceneTree.elements[move.elementId] = {
      ...getElement(document, move.elementId),
      parentId: move.after.parentId
    }
  }
}

const applySubtreeRemoval = (
  document: AppDocumentData,
  change: Extract<CanonicalChange, { kind: 'subtree-removal' }>
): void => {
  const { removed, elementId, rootParentChildrenAfter } = change.change
  const root =
    removed.find((entry) => entry.elementId === elementId) ??
    fail(`subtree root "${elementId}" is missing`)
  for (const entry of removed) {
    const current = getElement(document, entry.elementId)
    if (!sameJson(current, entry.data)) {
      fail(`subtree evidence for "${entry.elementId}" is stale`)
    }
  }
  const expectedRootParentChildren = getContainerChildren(
    document,
    root.parentId
  ).filter((id) => id !== elementId)
  if (!sameJson(expectedRootParentChildren, rootParentChildrenAfter)) {
    fail(`subtree root parent evidence for "${elementId}" is stale`)
  }

  removed.forEach(({ elementId: removedId }) => {
    Reflect.deleteProperty(document.sceneTree.elements, removedId)
  })
  setContainerChildren(document, root.parentId, rootParentChildrenAfter)
}

const applySubtreeRestore = (
  document: AppDocumentData,
  change: Extract<CanonicalChange, { kind: 'subtree-restore' }>
): void => {
  const { removed, elementId, rootParentChildrenAfter } = change.sceneSnapshot
  const root =
    removed.find((entry) => entry.elementId === elementId) ??
    fail(`subtree restore root "${elementId}" is missing`)
  for (const component of change.propsSnapshot.components) {
    if (document.props[component.id]) {
      fail(`restored property "${component.id}" already exists`)
    }
    document.props[component.id] = cloneJson(component)
  }
  for (const entry of removed) {
    if (document.sceneTree.elements[entry.elementId]) {
      fail(`restored element "${entry.elementId}" already exists`)
    }
    document.sceneTree.elements[entry.elementId] = cloneJson(entry.data)
  }
  const rootParentChildren = [...rootParentChildrenAfter]
  rootParentChildren.splice(root.index, 0, elementId)
  setContainerChildren(document, root.parentId, rootParentChildren)
}

const applyElementCreation = (
  document: AppDocumentData,
  change: Extract<CanonicalChange, { kind: 'element-creation' }>
): void => {
  const elementIds = new Set<string>()
  const entriesByParent = new Map<string, (typeof change.entries)[number][]>()
  for (const entry of change.entries) {
    const { data: element, parentId } = entry
    if (elementIds.has(element.id) || document.sceneTree.elements[element.id]) {
      fail(`created element "${element.id}" already exists`)
    }
    elementIds.add(element.id)
    const entries = entriesByParent.get(parentId) ?? []
    entries.push(entry)
    entriesByParent.set(parentId, entries)
  }
  for (const component of change.properties) {
    if (document.props[component.id]) {
      fail(`created property "${component.id}" already exists`)
    }
    document.props[component.id] = cloneJson(component)
  }
  for (const { data } of change.entries) {
    document.sceneTree.elements[data.id] = cloneJson(data)
  }
  for (const [parentId, entries] of entriesByParent) {
    const children = [...getContainerChildren(document, parentId)]
    const usedIndexes = new Set<number>()
    for (const { data, index } of entries.sort(
      (left, right) => left.index - right.index
    )) {
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index > children.length ||
        usedIndexes.has(index)
      ) {
        fail('element creation index is invalid')
      }
      usedIndexes.add(index)
      children.splice(index, 0, data.id)
    }
    setContainerChildren(document, parentId, children)
  }
}

const applyElementRemoval = (
  document: AppDocumentData,
  change: Extract<CanonicalChange, { kind: 'element-removal' }>
): void => {
  const removalIds = new Set<string>()
  const parentChildren = new Map<string, readonly string[]>()
  for (const removal of change.removals) {
    const elementId = removal.data.id
    if (removalIds.has(elementId)) {
      fail(`element removal "${elementId}" is duplicated`)
    }
    removalIds.add(elementId)
    const current = getElement(document, elementId)
    if (!sameJson(current, removal.data)) {
      fail(`element removal evidence for "${elementId}" is stale`)
    }
    const children =
      parentChildren.get(removal.parentId) ??
      getContainerChildren(document, removal.parentId)
    parentChildren.set(removal.parentId, children)
    if (children[removal.index] !== elementId) {
      fail(`element removal location for "${elementId}" is stale`)
    }
  }
  change.removals.forEach(({ data }) => {
    Reflect.deleteProperty(document.sceneTree.elements, data.id)
  })
  parentChildren.forEach((children, parentId) => {
    setContainerChildren(
      document,
      parentId,
      children.filter((id) => !removalIds.has(id))
    )
  })
}

export const applyCanonicalChangesToDocument = (
  document: AppDocumentData,
  changes: readonly CanonicalChange[],
  observation?: DocumentPersistenceObservation
): AppDocumentData => {
  const endPreparation = persistenceSpan(observation, 'working-map-preparation')
  let working: AppDocumentData
  try {
    working = createWorkingDocument(document)
  } finally {
    endPreparation()
  }
  for (const change of changes) {
    switch (change.kind) {
      case 'property-components':
        applyPropertyComponents(working, change)
        break
      case 'element-property-bindings':
        applyElementPropertyBindings(working, change)
        break
      case 'element-data':
        applyElementData(working, change)
        break
      case 'hierarchy-moves':
        applyHierarchyMoves(working, change)
        break
      case 'subtree-removal':
        applySubtreeRemoval(working, change)
        break
      case 'subtree-restore':
        applySubtreeRestore(working, change)
        break
      case 'element-creation':
        applyElementCreation(working, change)
        break
      case 'element-removal':
        applyElementRemoval(working, change)
        break
    }
  }
  if (
    changes.some(
      (change) =>
        change.kind === 'element-property-bindings' ||
        (change.kind === 'property-components' &&
          (change.creations !== undefined ||
            change.removals !== undefined ||
            change.layers !== undefined))
    )
  ) {
    validatePropertyLinks(working, changes)
  }
  return working
}
