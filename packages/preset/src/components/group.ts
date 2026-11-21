import { deriveGroupBounds, type GroupBounds } from '../group-bounds.js'
import {
  runTransaction,
  type ComponentDefinition,
  type ElementPropertyValuesUpdate,
  type PropertyMutationReceipt,
  type EngineNeutralRenderStrategy
} from '@asyra/core'
import {
  EntityTypes,
  PropertyTypes,
  createDefaultFills,
  type EVENT_OPTIONS,
  type GroupRawData,
  type MoveHierarchyRequest,
  type MoveHierarchyResult,
  type RemoveSubtreeResult,
  type ElementRawData
} from '@asyra/utils'
import { DEFAULT_GROUP_STROKES } from './stroke-defaults.js'
import { PRESET_REGISTRATION } from '../registration.js'

export const GROUP_COMPONENT_DEFINITION: ComponentDefinition = {
  type: EntityTypes.GROUP,
  idPrefix: 'grp',
  namePrefix: 'Group',
  registration: PRESET_REGISTRATION,
  isContainer: true,
  properties: [
    {
      name: PropertyTypes.POSITION,
      type: PropertyTypes.POSITION,
      alias: ['x', 'y', 'rotation', 'scaleX', 'scaleY']
    },
    {
      name: PropertyTypes.DIMENSION,
      type: PropertyTypes.DIMENSION,
      alias: ['width', 'height']
    },
    {
      name: 'fills',
      type: PropertyTypes.FILLS,
      defaultValue: createDefaultFills({ color: '#cccccc', visible: false })
    },
    {
      name: 'strokes',
      type: PropertyTypes.STROKES,
      defaultValue: DEFAULT_GROUP_STROKES
    }
  ]
}

export const GROUP_RENDER_STRATEGY: EngineNeutralRenderStrategy = (
  graphic,
  data
) => {
  graphic.clear()
  graphic.transformGroup = true
  // Group geometry is non-painting; project its complete canonical pose.
  graphic.x = data.x
  graphic.y = data.y
  graphic.rotation = data.rotation ?? 0
  graphic.scale.set(data.scaleX ?? 1, data.scaleY ?? 1)
}

export interface GroupHierarchyReadCore {
  getElementData: (elementId: string) => ElementRawData | undefined
}

export interface GroupGeometryProjectionCore extends GroupHierarchyReadCore {
  getElementComputedData: (
    elementId: string,
    fields?: readonly string[]
  ) => Record<string, unknown> | undefined
}

export interface GroupOperationCore extends GroupGeometryProjectionCore {
  createElementInParent: (
    data: {
      type: string
      x: number
      y: number
      width: number
      height: number
    },
    parentId: string,
    index?: number,
    options?: EVENT_OPTIONS
  ) => string
  moveElements: (
    request: MoveHierarchyRequest,
    options?: EVENT_OPTIONS
  ) => MoveHierarchyResult
  updateElementProperties: (
    updates: readonly ElementPropertyValuesUpdate[],
    options?: EVENT_OPTIONS
  ) => PropertyMutationReceipt
  removeSubtree: (
    elementId: string,
    options?: EVENT_OPTIONS
  ) => RemoveSubtreeResult
}

export interface PreparedGroupOperation {
  readonly kind: 'group'
  readonly parentId: string
  readonly groupIndex: number
  readonly elementIds: readonly string[]
}

export interface PreparedUngroupOperation {
  readonly kind: 'ungroup'
  readonly groupId: string
  readonly parentId: string
  readonly groupIndex: number
  readonly elementIds: readonly string[]
}

export type { GroupBounds } from '../group-bounds.js'

export interface GroupOperationResult {
  readonly groupId: string
  readonly elementIds: readonly string[]
  readonly bounds: GroupBounds
}

export interface UngroupOperationResult {
  readonly groupId: string
  readonly elementIds: readonly string[]
  readonly removed: true
}

export interface NormalizedGroupBounds {
  readonly groupId: string
  readonly bounds: GroupBounds
}

interface ElementRectangle extends GroupBounds {
  readonly id: string
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

type GroupHierarchyReader = (elementId: string) => ElementRawData | undefined

// A read scope never crosses a canonical mutation. Do not serialize the scene.
const createGroupHierarchyReader = (
  core: GroupHierarchyReadCore
): GroupHierarchyReader => {
  const elements = new Map<string, ElementRawData | undefined>()

  return (elementId) => {
    if (!elements.has(elementId)) {
      elements.set(elementId, core.getElementData(elementId))
    }

    return elements.get(elementId)
  }
}

interface GroupGeometryProjection {
  readonly core: GroupGeometryProjectionCore
  readonly projectedValues: Map<string, Record<string, unknown>>
  readonly updatesByElementId: Map<string, Record<string, unknown>>
  readonly orderedElementIds: string[]
}

const createGroupGeometryProjection = (
  core: GroupGeometryProjectionCore
): GroupGeometryProjection => ({
  core,
  projectedValues: new Map(),
  updatesByElementId: new Map(),
  orderedElementIds: []
})

const failGroupPreparation = (message: string): never => {
  throw new Error(
    `[Preset] Cannot prepare official Group operation: ${message}`
  )
}

const getContainerChildren = (
  data: GroupHierarchyReader,
  parentId: string
): readonly string[] => {
  const parent = data(parentId) as GroupRawData | undefined

  if (!parent || !Array.isArray(parent.children)) {
    return failGroupPreparation(
      `parent "${parentId}" is not a canonical container`
    )
  }

  return parent.children
}

const normalizeGroupBoundsInTransaction = (
  projection: GroupGeometryProjection,
  data: GroupHierarchyReader,
  groupId: string
): NormalizedGroupBounds => {
  const group = data(groupId) as GroupRawData | undefined

  if (
    !group ||
    group.type !== EntityTypes.GROUP ||
    !Array.isArray(group.children)
  ) {
    return failGroupPreparation(`"${groupId}" is not an official Group`)
  }

  const groupRectangle = readRectangle(projection, groupId)
  const childRectangles = group.children.map((elementId) =>
    readRectangle(projection, elementId, data(elementId)?.type)
  )
  const childBounds = deriveGroupBounds(childRectangles)
  const offset = transformOffset(groupRectangle, childBounds, false)
  const nextBounds =
    childRectangles.length === 0
      ? Object.freeze({
          x: groupRectangle.x,
          y: groupRectangle.y,
          width: 0,
          height: 0
        })
      : Object.freeze({
          x: groupRectangle.x + offset.x,
          y: groupRectangle.y + offset.y,
          width: childBounds.width,
          height: childBounds.height
        })

  stageGeometryValues(projection, groupId, nextBounds)
  if (childRectangles.length > 0) {
    childRectangles.forEach(({ id: elementId, x, y }) => {
      stageGeometryValues(projection, elementId, {
        x: x - childBounds.x,
        y: y - childBounds.y
      })
    })
  }

  return Object.freeze({
    groupId,
    bounds: nextBounds
  })
}

const failGroupGeometry = (message: string): never => {
  throw new Error(
    `[Preset] Group operation requires finite 2D geometry: ${message}`
  )
}

const readFiniteNumber = (
  data: Record<string, unknown>,
  key: 'x' | 'y' | 'width' | 'height',
  elementId: string
): number => {
  const value = data[key]

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return failGroupGeometry(`"${elementId}.${key}" is invalid`)
  }

  return value
}

const getComputedData = (
  projection: GroupGeometryProjection,
  elementId: string
): Record<string, unknown> => {
  const projectedValues = projection.projectedValues.get(elementId)

  if (projectedValues) {
    return projectedValues
  }

  const data = projection.core.getElementComputedData(elementId, [
    'x',
    'y',
    'width',
    'height',
    'rotation',
    'scaleX',
    'scaleY'
  ])

  if (!data) {
    return failGroupGeometry(`element "${elementId}" has no computed data`)
  }

  const values = { ...data }

  projection.projectedValues.set(elementId, values)

  return values
}

const stageGeometryValues = (
  projection: GroupGeometryProjection,
  elementId: string,
  values: Readonly<Record<string, number>>
): void => {
  const projectedValues = getComputedData(projection, elementId)

  projection.projectedValues.set(elementId, {
    ...projectedValues,
    ...values
  })

  const existingUpdate = projection.updatesByElementId.get(elementId)

  if (!existingUpdate) {
    projection.orderedElementIds.push(elementId)
  }

  projection.updatesByElementId.set(elementId, {
    ...existingUpdate,
    ...values
  })
}

const getProjectedPropertyUpdates = (
  projection: GroupGeometryProjection
): readonly ElementPropertyValuesUpdate[] =>
  Object.freeze(
    projection.orderedElementIds.map((elementId) =>
      Object.freeze({
        elementId,
        values: Object.freeze({
          ...projection.updatesByElementId.get(elementId)
        })
      })
    )
  )

const applyGeometryProjection = (
  core: Pick<GroupOperationCore, 'updateElementProperties'>,
  projection: GroupGeometryProjection,
  options?: EVENT_OPTIONS
): void => {
  if (projection.orderedElementIds.length === 0) {
    return
  }

  core.updateElementProperties(getProjectedPropertyUpdates(projection), options)
}

// Parent-local translation and physical scale share Render's rotate-after-scale order.
const transformOffset = (
  pose: Pick<GroupBounds, 'rotation' | 'scaleX' | 'scaleY'>,
  point: Readonly<{ x: number; y: number }>,
  inverse: boolean
) => {
  const angle = pose.rotation ?? 0
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const sx = pose.scaleX ?? 1
  const sy = pose.scaleY ?? 1

  return inverse
    ? {
        x: (c * point.x + s * point.y) / sx,
        y: (-s * point.x + c * point.y) / sy
      }
    : {
        x: c * sx * point.x - s * sy * point.y,
        y: s * sx * point.x + c * sy * point.y
      }
}

const readRectangle = (
  projection: GroupGeometryProjection,
  elementId: string,
  type?: string
): ElementRectangle => {
  const data = getComputedData(projection, elementId)

  return Object.freeze({
    id: elementId,
    type,
    rotation: typeof data.rotation === 'number' ? data.rotation : 0,
    scaleX: typeof data.scaleX === 'number' ? data.scaleX : 1,
    scaleY: typeof data.scaleY === 'number' ? data.scaleY : 1,
    x: readFiniteNumber(data, 'x', elementId),
    y: readFiniteNumber(data, 'y', elementId),
    width: readFiniteNumber(data, 'width', elementId),
    height: readFiniteNumber(data, 'height', elementId)
  })
}

const readPosition = (
  projection: GroupGeometryProjection,
  elementId: string
): Readonly<{ x: number; y: number }> => {
  const data = getComputedData(projection, elementId)

  return Object.freeze({
    x: readFiniteNumber(data, 'x', elementId),
    y: readFiniteNumber(data, 'y', elementId)
  })
}

const createHierarchyPointTransform = (
  projection: GroupGeometryProjection,
  data: GroupHierarchyReader,
  elementId: string,
  inverse: boolean
) => {
  let currentId = elementId
  const poses: ElementRectangle[] = []
  const visited = new Set<string>()

  while (currentId) {
    if (visited.has(currentId)) {
      return failGroupGeometry(`hierarchy cycle reaches "${currentId}"`)
    }

    visited.add(currentId)
    const element = data(currentId)

    if (!element) {
      return failGroupGeometry(`element "${currentId}" is missing`)
    }

    if (element.type === EntityTypes.WORKSPACE) {
      break
    }

    poses.push(readRectangle(projection, currentId))
    currentId = element.parentId ?? ''
  }

  if (inverse) {
    poses.reverse()
  }

  return (point: Readonly<{ x: number; y: number }>) =>
    poses.reduce((value, pose) => {
      if (inverse) {
        return transformOffset(
          pose,
          { x: value.x - pose.x, y: value.y - pose.y },
          true
        )
      }

      const offset = transformOffset(pose, value, false)

      return { x: pose.x + offset.x, y: pose.y + offset.y }
    }, point)
}

const getHierarchyDepth = (
  data: GroupHierarchyReader,
  elementId: string
): number => {
  let depth = 0
  let element = data(elementId)
  const visited = new Set<string>()

  while (element?.parentId) {
    if (visited.has(element.id)) {
      return failGroupPreparation(`hierarchy cycle reaches "${element.id}"`)
    }

    visited.add(element.id)
    depth += 1
    element = data(element.parentId)
  }

  return depth
}

const getAffectedGroupIds = (
  data: GroupHierarchyReader,
  elementIds: readonly string[]
): readonly string[] => {
  const groupIds = new Set<string>()

  elementIds.forEach((elementId) => {
    let element = data(elementId)

    if (!element) {
      return failGroupPreparation(`element "${elementId}" is missing`)
    }

    if (element.type === EntityTypes.GROUP) {
      groupIds.add(element.id)
    }

    const visited = new Set<string>()

    while (element.parentId) {
      if (visited.has(element.id)) {
        return failGroupPreparation(`hierarchy cycle reaches "${element.id}"`)
      }

      visited.add(element.id)
      const parent = data(element.parentId)

      if (!parent) {
        return failGroupPreparation(
          `parent "${element.parentId}" of "${element.id}" is missing`
        )
      }

      if (parent.type === EntityTypes.GROUP) {
        groupIds.add(parent.id)
      }

      element = parent
    }
  })

  return [...groupIds].sort(
    (first, second) =>
      getHierarchyDepth(data, second) - getHierarchyDepth(data, first)
  )
}

const GROUP_GEOMETRY_PROPERTY_KEYS = new Set(['x', 'y', 'width', 'height'])

const stageInitialPropertyUpdates = (
  projection: GroupGeometryProjection,
  updates: readonly ElementPropertyValuesUpdate[]
): readonly string[] => {
  const requestedElementIds = new Set<string>()
  const geometryElementIds: string[] = []

  updates.forEach((update) => {
    if (
      !update ||
      typeof update !== 'object' ||
      typeof update.elementId !== 'string' ||
      update.elementId.length === 0 ||
      requestedElementIds.has(update.elementId) ||
      !update.values ||
      typeof update.values !== 'object' ||
      Array.isArray(update.values)
    ) {
      return failGroupPreparation(
        'property updates require unique element ids and value records'
      )
    }

    requestedElementIds.add(update.elementId)
    projection.orderedElementIds.push(update.elementId)
    projection.updatesByElementId.set(update.elementId, {
      ...update.values
    })

    const stagedGeometryValues = Object.fromEntries(
      Object.entries(update.values).filter(([key]) =>
        GROUP_GEOMETRY_PROPERTY_KEYS.has(key)
      )
    )

    if (Object.keys(stagedGeometryValues).length === 0) {
      return
    }

    geometryElementIds.push(update.elementId)
  })

  return Object.freeze(geometryElementIds)
}

// Derive live dimensions bottom-up before assigning proportional local boxes.
const resizeGroupContents = (
  projection: GroupGeometryProjection,
  data: GroupHierarchyReader,
  groupId: string,
  requested: Readonly<Record<string, unknown>>
): void => {
  const nodes = [groupId]
  const seen = new Set<string>()
  const groups: string[] = []

  for (const id of nodes) {
    const node = data(id)

    if (!node || seen.has(id)) {
      return failGroupGeometry(`invalid subtree at "${id}"`)
    }

    seen.add(id)
    if (
      node.type === EntityTypes.FRAME ||
      node.type === EntityTypes.WORKSPACE
    ) {
      throw new RangeError('Frame and Workspace size edits are unavailable')
    }

    if (node.type === EntityTypes.GROUP) {
      groups.push(id)
      for (const child of getContainerChildren(data, id)) {
        nodes.push(child)
      }
    }
  }

  for (const id of groups.reverse()) {
    normalizeGroupBoundsInTransaction(projection, data, id)
  }

  const current = readRectangle(projection, groupId)

  const ratio = (key: 'width' | 'height') => {
    const value = requested[key]

    if (value === undefined || value === current[key]) {
      return 1
    }

    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < 0 ||
      current[key] === 0
    ) {
      throw new RangeError(
        `Cannot resize ${groupId}.${key} from ${current[key]} to ${value}`
      )
    }

    return value / current[key]
  }

  const sx = ratio('width')
  const sy = ratio('height')

  for (const id of nodes) {
    const rect = readRectangle(projection, id)
    const values = {
      x: id === groupId ? rect.x : rect.x * sx,
      y: id === groupId ? rect.y : rect.y * sy,
      width: rect.width * sx,
      height: rect.height * sy
    }

    if (!Object.values(values).every(Number.isFinite)) {
      throw new RangeError(`Resized bounds overflow at "${id}"`)
    }

    stageGeometryValues(projection, id, values)
  }
}

export const projectGroupGeometryPropertyUpdates = (
  core: GroupGeometryProjectionCore,
  initialUpdates: readonly ElementPropertyValuesUpdate[],
  explicitGroupElementIds: readonly string[] = []
): readonly ElementPropertyValuesUpdate[] => {
  if (!Array.isArray(initialUpdates)) {
    return failGroupPreparation('property updates must be an array')
  }

  if (initialUpdates.length === 0) {
    return Object.freeze([])
  }

  const projection = createGroupGeometryProjection(core)
  const geometryElementIds = stageInitialPropertyUpdates(
    projection,
    initialUpdates
  )

  if (geometryElementIds.length === 0 || explicitGroupElementIds.length === 0) {
    return getProjectedPropertyUpdates(projection)
  }

  const geometryElementIdSet = new Set(geometryElementIds)
  const groupGeometryElementIds = [...new Set(explicitGroupElementIds)]

  if (
    groupGeometryElementIds.length !== explicitGroupElementIds.length ||
    groupGeometryElementIds.some(
      (elementId) => !geometryElementIdSet.has(elementId)
    )
  ) {
    return failGroupPreparation(
      'explicit Group ids must be unique geometry update targets'
    )
  }

  const data = createGroupHierarchyReader(core)

  groupGeometryElementIds.forEach((elementId) => {
    if (data(elementId)?.type !== EntityTypes.GROUP) {
      return failGroupPreparation(
        `explicit geometry target "${elementId}" is not an official Group`
      )
    }
  })

  geometryElementIds.forEach((elementId) => {
    const currentValues = getComputedData(projection, elementId)
    const stagedValues = projection.updatesByElementId.get(elementId) ?? {}
    const stagedGeometryValues = Object.fromEntries(
      Object.entries(stagedValues).filter(([key]) =>
        GROUP_GEOMETRY_PROPERTY_KEYS.has(key)
      )
    )

    projection.projectedValues.set(elementId, {
      ...currentValues,
      ...stagedGeometryValues
    })
  })

  for (const id of groupGeometryElementIds) {
    const values = projection.updatesByElementId.get(id)

    if (values && ('width' in values || 'height' in values)) {
      resizeGroupContents(projection, data, id, values)
    }
  }

  getAffectedGroupIds(data, groupGeometryElementIds).forEach((groupId) => {
    normalizeGroupBoundsInTransaction(projection, data, groupId)
  })

  return getProjectedPropertyUpdates(projection)
}

export { deriveGroupBounds } from '../group-bounds.js'

const readGroupOperation = (
  core: GroupHierarchyReadCore,
  elementIds: readonly string[]
): { operation: PreparedGroupOperation; data: GroupHierarchyReader } => {
  if (
    !Array.isArray(elementIds) ||
    elementIds.length === 0 ||
    elementIds.some(
      (elementId) => typeof elementId !== 'string' || elementId.length === 0
    )
  ) {
    return failGroupPreparation('element ids must be a non-empty string list')
  }

  if (new Set(elementIds).size !== elementIds.length) {
    return failGroupPreparation('element ids must be unique')
  }

  const data = createGroupHierarchyReader(core)
  const elements = elementIds.map((elementId) => {
    const element = data(elementId)

    if (!element) {
      return failGroupPreparation(`element "${elementId}" is missing`)
    }

    return element
  })
  const parentId = elements[0].parentId ?? ''

  if (
    parentId.length === 0 ||
    elements.some((element) => element.parentId !== parentId)
  ) {
    return failGroupPreparation(
      'element ids must resolve to one canonical parent'
    )
  }

  const selectedIds = new Set(elementIds)
  const children = getContainerChildren(data, parentId)
  const canonicalIds = children.filter((childId) => selectedIds.has(childId))

  if (canonicalIds.length !== elementIds.length) {
    return failGroupPreparation(
      'element ids must each have one canonical parent membership'
    )
  }

  return {
    data,
    operation: Object.freeze({
      kind: 'group',
      parentId,
      groupIndex: children.indexOf(canonicalIds[0]),
      elementIds: Object.freeze([...canonicalIds])
    })
  }
}

export const prepareGroupOperation = (
  core: GroupHierarchyReadCore,
  elementIds: readonly string[]
): PreparedGroupOperation => readGroupOperation(core, elementIds).operation

export const prepareUngroupOperation = (
  core: GroupHierarchyReadCore,
  groupId: string
): PreparedUngroupOperation => {
  const data = createGroupHierarchyReader(core)
  const group = data(groupId) as GroupRawData | undefined

  if (
    !group ||
    group.type !== EntityTypes.GROUP ||
    !Array.isArray(group.children)
  ) {
    throw new Error(
      `[Preset] Cannot prepare ungroup: "${groupId}" is not an official Group`
    )
  }

  const parentId = group.parentId ?? ''
  const siblings = getContainerChildren(data, parentId)
  const groupIndex = siblings.indexOf(groupId)

  if (groupIndex < 0 || siblings.lastIndexOf(groupId) !== groupIndex) {
    return failGroupPreparation(
      `Group "${groupId}" must have one canonical parent membership`
    )
  }

  return Object.freeze({
    kind: 'ungroup',
    groupId,
    parentId,
    groupIndex,
    elementIds: Object.freeze([...group.children])
  })
}

export const groupElements = (
  core: GroupOperationCore,
  elementIds: readonly string[],
  options?: EVENT_OPTIONS
): GroupOperationResult => {
  const { operation: preparedGroup, data } = readGroupOperation(
    core,
    elementIds
  )
  const geometryProjection = createGroupGeometryProjection(core)
  const rectangles = preparedGroup.elementIds.map((elementId) =>
    readRectangle(geometryProjection, elementId, data(elementId)?.type)
  )
  const bounds = deriveGroupBounds(rectangles)

  const groupId = runTransaction(() => {
    const createdGroupId = core.createElementInParent(
      {
        type: EntityTypes.GROUP,
        ...bounds
      },
      preparedGroup.parentId,
      preparedGroup.groupIndex,
      options
    )

    if (!createdGroupId) {
      throw new Error('[Preset] Official Group creation failed')
    }

    core.moveElements(
      {
        elementIds: [...preparedGroup.elementIds],
        targetParentId: createdGroupId,
        targetIndex: 0
      },
      options
    )
    rectangles.forEach(({ id: elementId, x, y }) => {
      stageGeometryValues(geometryProjection, elementId, {
        x: x - bounds.x,
        y: y - bounds.y
      })
    })
    applyGeometryProjection(core, geometryProjection, options)

    return createdGroupId
  })

  return Object.freeze({
    groupId,
    elementIds: Object.freeze([...preparedGroup.elementIds]),
    bounds
  })
}

export const ungroupElement = (
  core: GroupOperationCore,
  groupId: string,
  options?: EVENT_OPTIONS
): UngroupOperationResult => {
  const preparedUngroup = prepareUngroupOperation(core, groupId)
  const geometryProjection = createGroupGeometryProjection(core)
  const groupPosition =
    preparedUngroup.elementIds.length > 0
      ? readRectangle(geometryProjection, groupId)
      : undefined
  const childPositions = preparedUngroup.elementIds.map((elementId) => ({
    elementId,
    ...readPosition(geometryProjection, elementId)
  }))

  runTransaction(() => {
    if (childPositions.length > 0 && groupPosition) {
      core.moveElements(
        {
          elementIds: [...preparedUngroup.elementIds],
          targetParentId: preparedUngroup.parentId,
          targetIndex: preparedUngroup.groupIndex
        },
        options
      )
      childPositions.forEach(({ elementId, x, y }) => {
        const offset = transformOffset(groupPosition, { x, y }, false)

        stageGeometryValues(geometryProjection, elementId, {
          x: offset.x + groupPosition.x,
          y: offset.y + groupPosition.y
        })
      })
      applyGeometryProjection(core, geometryProjection, options)
    }

    core.removeSubtree(groupId, options)
  })

  return Object.freeze({
    groupId,
    elementIds: Object.freeze([...preparedUngroup.elementIds]),
    removed: true
  })
}

export const normalizeGroupsForElements = (
  core: GroupOperationCore,
  elementIds: readonly string[],
  options?: EVENT_OPTIONS
): readonly NormalizedGroupBounds[] => {
  const data = createGroupHierarchyReader(core)
  const geometryProjection = createGroupGeometryProjection(core)
  const deepestFirstGroupIds = getAffectedGroupIds(data, elementIds)

  return runTransaction(() => {
    const results = deepestFirstGroupIds.map((groupId) =>
      normalizeGroupBoundsInTransaction(geometryProjection, data, groupId)
    )

    applyGeometryProjection(core, geometryProjection, options)

    return Object.freeze(results)
  })
}

export const moveElementsWithGroupGeometry = (
  core: GroupOperationCore,
  request: MoveHierarchyRequest,
  options?: EVENT_OPTIONS
): MoveHierarchyResult => {
  const beforeData = createGroupHierarchyReader(core)
  const geometryProjection = createGroupGeometryProjection(core)
  const beforePositions = new Map<string, Readonly<{ x: number; y: number }>>()

  if (Array.isArray(request?.elementIds)) {
    const toWorldByParent = new Map<
      string,
      ReturnType<typeof createHierarchyPointTransform>
    >()

    request.elementIds.forEach((elementId) => {
      const element = beforeData(elementId)
      const sourceIsGroup =
        element?.parentId &&
        beforeData(element.parentId)?.type === EntityTypes.GROUP
      const targetIsGroup =
        beforeData(request.targetParentId)?.type === EntityTypes.GROUP

      if (element?.parentId && (sourceIsGroup || targetIsGroup)) {
        let toWorld = toWorldByParent.get(element.parentId)

        if (!toWorld) {
          toWorld = createHierarchyPointTransform(
            geometryProjection,
            beforeData,
            element.parentId,
            false
          )
          toWorldByParent.set(element.parentId, toWorld)
        }

        beforePositions.set(
          elementId,
          toWorld(readPosition(geometryProjection, elementId))
        )
      }
    })
  }

  return runTransaction(() => {
    const result = core.moveElements(request, options)

    if (result.moves.length === 0) {
      return result
    }

    const sourceParentId = result.moves[0].before.parentId
    const targetParentId = result.moves[0].after.parentId
    const afterData = createGroupHierarchyReader(core)
    const sourceIsGroup = beforeData(sourceParentId)?.type === EntityTypes.GROUP
    const targetIsGroup = afterData(targetParentId)?.type === EntityTypes.GROUP

    if (!sourceIsGroup && !targetIsGroup) {
      return result
    }

    const worldPositions = result.elementIds.map((elementId) => {
      const position = beforePositions.get(elementId)

      if (!position) {
        return failGroupGeometry(`missing before position for "${elementId}"`)
      }

      return { elementId, ...position }
    })
    const toParent = createHierarchyPointTransform(
      geometryProjection,
      afterData,
      targetParentId,
      true
    )

    worldPositions.forEach(({ elementId, x, y }) => {
      const local = toParent({ x, y })

      stageGeometryValues(geometryProjection, elementId, local)
    })

    const groupIds = new Set<string>()
    const affectedParentIds = [sourceParentId, targetParentId]

    affectedParentIds.forEach((parentId) => {
      let element: ElementRawData | undefined = afterData(parentId)

      while (element) {
        if (element.type === EntityTypes.GROUP) {
          groupIds.add(element.id)
        }

        element = element.parentId ? afterData(element.parentId) : undefined
      }
    })
    const deepestFirstGroupIds = [...groupIds].sort(
      (first, second) =>
        getHierarchyDepth(afterData, second) -
        getHierarchyDepth(afterData, first)
    )

    deepestFirstGroupIds.forEach((groupId) => {
      normalizeGroupBoundsInTransaction(geometryProjection, afterData, groupId)
    })
    applyGeometryProjection(core, geometryProjection, options)

    return result
  })
}
