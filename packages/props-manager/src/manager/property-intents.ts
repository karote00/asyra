import {
  id,
  IDTypes,
  isRecord,
  type ElementPropertyRelation,
  type PropertyComponentRawData,
  type PropertyLayerEdit,
  type EVENT_OPTIONS
} from '@asyra/utils'
import * as lodashModule from 'lodash'
import {
  getPropertyComponentConfigDefinition,
  resolvePropertyComponentConfigRoles
} from '../registries/property-component.js'
import { isRuntimePropertyFieldValueValid } from '../registries/property-value-kind.js'
import elementPropertyRegistry from '../registries/property-definition.js'
import { getPropertySchema } from '../registries/property-schema.js'
import { readPropertyInheritanceDependencies } from '../registries/property-inheritance.js'
import type {
  PropsManager,
  PropertyMutation,
  PreparedPropertyMutationBatch,
  PropertyValuesMutation,
  PropertyRecordsMutation
} from './props-manager.js'

const isEqual = (lodashModule.default ?? lodashModule).isEqual
const own = (value: object, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key)
type Raw = PropertyComponentRawData & Record<string, unknown>

export interface PropertyTarget {
  readonly root: ElementPropertyRelation
  readonly sharedRoot: boolean
  readonly path: readonly { readonly key: string; readonly childId: string }[]
  readonly expectedPropertyId?: string
  readonly expectedSourceId?: string
}

export interface PropertyTargetView {
  readonly target: PropertyTarget
  readonly propertyId: string
  readonly type: string
  readonly mode: 'independent' | 'source' | 'source-backed'
  readonly sourceId?: string
  readonly overrides: Readonly<Record<string, unknown>>
  readonly effective: Readonly<Record<string, unknown>>
  readonly children: readonly {
    readonly key: string
    readonly childId: string
    readonly propertyId: string
  }[]
}

export type PropertyIntent =
  | {
      readonly kind: 'records'
      readonly target: PropertyTarget
      readonly key: string
      readonly set?: Readonly<Record<string, Readonly<Record<string, unknown>>>>
      readonly remove?: readonly string[]
    }
  | {
      readonly kind: 'override'
      readonly target: PropertyTarget
      readonly values: Readonly<Record<string, unknown>>
    }
  | {
      readonly kind: 'reset'
      readonly target: PropertyTarget
      readonly keys: readonly string[]
    }
  | { readonly kind: 'detach'; readonly target: PropertyTarget }
  | {
      readonly kind: 'share'
      readonly target: PropertyTarget
      readonly sourceId: string
    }

export interface PropertyRootBindingReplacement {
  readonly elementId: string
  readonly propertyName: string
  readonly propertyType: string
  readonly before: string
  readonly after: string
}

export interface PreparedPropertyIntentBatch {
  readonly properties: PreparedPropertyMutationBatch
  readonly rootBindings: readonly PropertyRootBindingReplacement[]
  readonly releasedRootPropertyIds: readonly string[]
  readonly retainedExistingPropertyIds: readonly string[]
  readonly createdPropertyIds: readonly string[]
}

const fail = (message: string): never => {
  throw new Error(`[PropsManager] ${message}`)
}
const requireCapability = (raw: Raw) => {
  const config = getPropertyComponentConfigDefinition(raw.type)
  const schema = getPropertySchema(raw.type)
  if (!config || !schema) {
    return fail(`Property "${raw.id}" has no declarative intention capability`)
  }
  return { config, schema }
}

const createDraft = (manager: PropsManager) => {
  const originals = new Map<string, Raw>()
  const drafts = new Map<string, Raw>()
  const created = new Map<string, Raw>()
  const read = (propertyId: string): Raw => {
    const known = drafts.get(propertyId)
    if (known) {
      return known
    }
    const property = manager.getPropertyById(propertyId)
    if (!property) {
      return fail(`Missing property "${propertyId}"`)
    }
    const raw = structuredClone(property.save()) as Raw
    requireCapability(raw)
    originals.set(propertyId, structuredClone(raw))
    drafts.set(propertyId, raw)
    return raw
  }
  const fields = (raw: Raw): Record<string, unknown> => {
    const { config } = requireCapability(raw)
    const basis = raw.inheritance ? read(raw.inheritance.sourceId) : raw
    const result: Record<string, unknown> = {}
    for (const key of resolvePropertyComponentConfigRoles(config).persistKeys) {
      const value =
        raw.inheritance && own(raw.inheritance.overrides, key)
          ? raw.inheritance.overrides[key]
          : basis[key]
      if (value !== undefined) {
        result[key] = structuredClone(value)
      }
    }
    const children = config.children
    if (raw.inheritance && children && Array.isArray(result[children.key])) {
      result[children.key] = (result[children.key] as string[]).map(
        (childId) => raw.inheritance?.childBindings[childId] ?? childId
      )
    }
    return result
  }
  const allocate = (raw: Omit<Raw, 'id'>, requestedId?: string): Raw => {
    if (
      requestedId !== undefined &&
      (!requestedId ||
        manager.getPropertyById(requestedId) ||
        manager.getRestoreComponentById(requestedId) ||
        drafts.has(requestedId))
    ) {
      return fail('Unavailable explicit child identity')
    }
    let propertyId = requestedId ?? id(IDTypes.PROPS)
    while (
      manager.getPropertyById(propertyId) ||
      manager.getRestoreComponentById(propertyId) ||
      drafts.has(propertyId)
    ) {
      propertyId = id(IDTypes.PROPS)
    }
    const value = { ...raw, id: propertyId } as Raw
    created.set(propertyId, value)
    drafts.set(propertyId, value)
    return value
  }
  const inherit = (raw: Raw, isolate = false): Raw => {
    if (raw.inheritance) {
      return isolate
        ? allocate({
            type: raw.type,
            inheritance: structuredClone(raw.inheritance)
          })
        : raw
    }
    raw.sharedSource = true
    return allocate({
      type: raw.type,
      inheritance: { sourceId: raw.id, overrides: {}, childBindings: {} }
    })
  }
  const locate = (
    target: PropertyTarget
  ): { raw: Raw; chain: { parent: Raw; key: string; logicalId: string }[] } => {
    if (
      !isRecord(target) ||
      !isRecord(target.root) ||
      !Array.isArray(target.path)
    ) {
      fail('Invalid property target')
    }
    if (
      typeof target.sharedRoot !== 'boolean' ||
      [
        target.root.componentId,
        target.root.ownerElementId,
        target.root.ownerElementType,
        target.root.ownerPropertyName
      ].some((value) => typeof value !== 'string' || !value)
    ) {
      fail('Invalid canonical owner target')
    }
    let raw = read(target.root.componentId)
    const definition = elementPropertyRegistry.getForComponent(
      target.root.ownerElementType,
      target.root.ownerPropertyName
    )
    if (!definition || definition.type !== raw.type) {
      fail('Target does not match the registered owner property')
    }
    const chain: { parent: Raw; key: string; logicalId: string }[] = []
    for (const step of target.path) {
      const relation = requireCapability(raw).config.children
      if (
        !relation ||
        relation.key !== step.key ||
        typeof step.childId !== 'string'
      ) {
        return fail('Invalid registered child path')
      }
      const basis = raw.inheritance ? read(raw.inheritance.sourceId) : raw
      const childIds =
        raw.inheritance && own(raw.inheritance.overrides, step.key)
          ? raw.inheritance.overrides[step.key]
          : basis[step.key]
      if (!Array.isArray(childIds) || !childIds.includes(step.childId)) {
        fail(`Missing logical child "${step.childId}"`)
      }
      chain.push({ parent: raw, key: step.key, logicalId: step.childId })
      raw = read(raw.inheritance?.childBindings[step.childId] ?? step.childId)
      if (raw.type !== relation.childType) {
        fail('Wrong registered child type')
      }
    }
    if (
      (target.expectedPropertyId !== undefined &&
        target.expectedPropertyId !== raw.id) ||
      (target.expectedSourceId !== undefined &&
        target.expectedSourceId !== raw.inheritance?.sourceId)
    ) {
      fail('Stale retained property target')
    }
    return { raw, chain }
  }
  return { originals, drafts, created, read, fields, allocate, inherit, locate }
}

export const readPropertyTargets = (
  manager: PropsManager,
  targets: readonly PropertyTarget[]
): readonly PropertyTargetView[] => {
  const draft = createDraft(manager)
  return targets.map((target) => {
    const { raw } = draft.locate(target)
    let mode: PropertyTargetView['mode'] = 'independent'
    if (raw.sharedSource) {
      mode = 'source'
    }
    if (raw.inheritance) {
      mode = 'source-backed'
    }
    const relation = requireCapability(raw).config.children
    const basis = raw.inheritance ? draft.read(raw.inheritance.sourceId) : raw
    let members: unknown = []
    if (relation) {
      members = basis[relation.key]
      if (raw.inheritance && own(raw.inheritance.overrides, relation.key)) {
        members = raw.inheritance.overrides[relation.key]
      }
    }
    const children =
      relation && Array.isArray(members)
        ? (members as string[]).map((childId) => ({
            key: relation.key,
            childId,
            propertyId: raw.inheritance?.childBindings[childId] ?? childId
          }))
        : []
    return {
      target: structuredClone(target),
      propertyId: raw.id,
      type: raw.type,
      mode,
      ...(raw.inheritance ? { sourceId: raw.inheritance.sourceId } : {}),
      overrides: structuredClone(raw.inheritance?.overrides ?? {}),
      effective: draft.fields(raw),
      children
    }
  })
}

export const preparePropertyIntentBatch = (
  manager: PropsManager,
  intents: readonly PropertyIntent[],
  options: EVENT_OPTIONS | undefined,
  hasOtherOwners: (propertyId: string, parentId: string) => boolean,
  directOperations: readonly PropertyMutation[] = []
): PreparedPropertyIntentBatch => {
  const draft = createDraft(manager)
  const roots = new Map<
    string,
    { target: PropertyTarget; before: Raw; after: Raw }
  >()
  const writes = new Map<string, unknown>()
  const identity = (target: PropertyTarget) =>
    JSON.stringify([target.root.ownerElementId, target.root.ownerPropertyName])
  // Resolve every original target before allocating or changing the transient draft.
  const kindsByTarget = new Map<string, Set<string>>()
  intents.forEach((intent) => {
    draft.locate(intent.target)
    const key = JSON.stringify([identity(intent.target), intent.target.path])
    const kinds = kindsByTarget.get(key) ?? new Set<string>()
    kinds.add(intent.kind)
    if (kinds.size > 1 && (kinds.has('detach') || kinds.has('share'))) {
      fail('Conflicting identity and field intentions')
    }
    kindsByTarget.set(key, kinds)
  })
  const isolated = (target: PropertyTarget, leafBinding: boolean) => {
    const key = identity(target)
    let root = roots.get(key)
    if (!root) {
      const before = draft.read(target.root.componentId)
      root = { target, before, after: before }
      roots.set(key, root)
    } else if (root.target.root.componentId !== target.root.componentId) {
      fail('Conflicting owner root identities')
    }
    if (
      target.path.length ||
      (leafBinding && (target.sharedRoot || root.after.sharedSource))
    ) {
      root.after = draft.inherit(
        root.after,
        target.sharedRoot && root.after === root.before
      )
    }
    let current = root.after
    let parent: Raw | undefined
    let logicalId: string | undefined
    for (let i = 0; i < target.path.length; i++) {
      const step = target.path[i]
      parent = current
      logicalId = step.childId
      const child = draft.read(
        current.inheritance?.childBindings[step.childId] ?? step.childId
      )
      const mustBind = i < target.path.length - 1 || leafBinding
      const ownedChild =
        current.inheritance?.childBindings[step.childId] === child.id
      const sharedChild = hasOtherOwners(child.id, current.id)
      if (!mustBind) {
        current = child
      } else if (
        ownedChild &&
        !sharedChild &&
        !child.sharedSource &&
        !child.inheritance &&
        i === target.path.length - 1
      ) {
        current = child
      } else {
        current = draft.inherit(child, !ownedChild || sharedChild)
      }
      if (current !== child) {
        if (!parent.inheritance) {
          return fail('Local child edit requires an isolated parent')
        }
        parent.inheritance.childBindings[step.childId] = current.id
      }
    }
    return { root, raw: current, parent, logicalId }
  }
  const pending = [...intents]
  for (const intent of pending) {
    const targetKey = JSON.stringify([
      identity(intent.target),
      intent.target.path
    ])
    const registerWrite = (key: string, value: unknown) => {
      const token = JSON.stringify([targetKey, key])
      if (writes.has(token) && !isEqual(writes.get(token), value)) {
        fail('Conflicting local property writes')
      }
      writes.set(token, value)
    }
    if (intent.kind === 'records') {
      const currentTarget = {
        ...intent.target,
        root: {
          ...intent.target.root,
          componentId:
            roots.get(identity(intent.target))?.after.id ??
            intent.target.root.componentId
        },
        expectedPropertyId: undefined,
        expectedSourceId: undefined
      }
      const current = draft.locate(currentTarget).raw
      const relation = requireCapability(current).config.children
      if (
        !relation ||
        relation.key !== intent.key ||
        relation.collection !== 'array-or-record'
      ) {
        fail('Invalid registered record relationship')
      }
      if (!relation) {
        return fail('Missing registered record relationship')
      }
      const set = intent.set ?? {},
        remove = intent.remove ?? []
      if (
        !isRecord(set) ||
        !Array.isArray(remove) ||
        remove.some((id) => typeof id !== 'string' || !id) ||
        new Set(remove).size !== remove.length
      ) {
        fail('Invalid record patch')
      }
      const basis = current.inheritance
        ? draft.read(current.inheritance.sourceId)
        : current
      const membership =
        current.inheritance && own(current.inheritance.overrides, relation.key)
          ? current.inheritance.overrides[relation.key]
          : basis[relation.key]
      if (
        !Array.isArray(membership) ||
        membership.some((id) => typeof id !== 'string')
      ) {
        fail('Invalid canonical record membership')
      }
      const members = [...(membership as string[])]
      const logical = (id: string) => {
        const matches = members.filter(
          (member) =>
            member === id || current.inheritance?.childBindings[member] === id
        )
        if (matches.length > 1) {
          fail('Ambiguous record identity')
        }
        return matches[0]
      }
      const removed = new Set(
        remove.map((id) => logical(id) ?? fail(`Missing local record "${id}"`))
      )
      const next = members.filter((id) => !removed.has(id))
      const fieldIntents: PropertyIntent[] = []
      for (const [recordId, recordValues] of Object.entries(set)) {
        if (!recordId || !isRecord(recordValues) || remove.includes(recordId)) {
          fail('Invalid or conflicting record patch')
        }
        const mapped = relation.toChildData
          ? relation.toChildData(
              recordValues as Record<string, unknown>,
              recordId
            )
          : recordValues
        if (
          !isRecord(mapped) ||
          (mapped.id !== undefined && mapped.id !== recordId) ||
          (mapped.type !== undefined && mapped.type !== relation.childType)
        ) {
          return fail('Invalid mapped record identity')
        }
        const values = Object.fromEntries(
          Object.entries(mapped).filter(
            ([key]) => key !== 'id' && key !== 'type'
          )
        )
        const member = logical(recordId)
        if (member) {
          if (removed.has(member)) {
            fail('Conflicting local record operations')
          }
          fieldIntents.push({
            kind: 'override',
            target: {
              ...intent.target,
              path: [
                ...intent.target.path,
                { key: relation.key, childId: member }
              ],
              expectedPropertyId: undefined,
              expectedSourceId: undefined
            },
            values
          })
        } else {
          const config = getPropertyComponentConfigDefinition(
            relation.childType
          )
          if (!config || !getPropertySchema(relation.childType)) {
            fail('New local record requires registered declarative capability')
          }
          if (!config) {
            return fail('Missing child capability')
          }
          const roles = resolvePropertyComponentConfigRoles(config)
          const defaults = Object.fromEntries(
            roles.persistKeys
              .filter((key) => roles.defaults[key] !== undefined)
              .map((key) => [key, structuredClone(roles.defaults[key])])
          )
          const child = draft.allocate(
            {
              ...defaults,
              ...structuredClone(values),
              type: relation.childType
            },
            recordId
          )
          const { schema } = requireCapability(child)
          for (const [key, value] of Object.entries(values)) {
            const field = schema.fields.find((field) => field.key === key)
            if (!field || !isRuntimePropertyFieldValueValid(field, value)) {
              fail(`Invalid new record field "${key}"`)
            }
          }
          next.push(child.id)
        }
      }
      if (!isEqual(next, members)) {
        registerWrite(relation.key, { kind: 'membership', value: next })
        const raw = isolated(intent.target, true).raw
        if (raw.inheritance) {
          raw.inheritance.overrides[relation.key] = next
          for (const childId of removed) {
            Reflect.deleteProperty(raw.inheritance.childBindings, childId)
          }
        } else {
          raw[relation.key] = next
        }
      }
      pending.push(...fieldIntents)
    } else if (intent.kind === 'override') {
      if (!isRecord(intent.values)) {
        fail('Invalid local values')
      }
      if (Object.keys(intent.values).length === 0) {
        continue
      }
      const original = draft.locate({
        ...intent.target,
        root: {
          ...intent.target.root,
          componentId:
            roots.get(identity(intent.target))?.after.id ??
            intent.target.root.componentId
        },
        expectedPropertyId: undefined,
        expectedSourceId: undefined
      }).raw
      const { schema, config } = requireCapability(original)
      const values = structuredClone(intent.values) as Record<string, unknown>
      const relation = config.children
      if (
        relation &&
        Array.isArray(values[relation.key]) &&
        original.inheritance
      ) {
        const links = original.inheritance.childBindings
        values[relation.key] = (values[relation.key] as unknown[]).map(
          (value) => {
            const logical = Object.keys(links).filter(
              (key) => links[key] === value
            )
            if (logical.length > 1) {
              fail('Ambiguous local membership identity')
            }
            return logical[0] ?? value
          }
        )
      }
      for (const [key, value] of Object.entries(values)) {
        const field = schema.fields.find((field) => field.key === key)
        if (!field || !isRuntimePropertyFieldValueValid(field, value)) {
          fail(`Unknown or invalid property field "${key}"`)
        }
        registerWrite(key, { kind: intent.kind, value })
      }
      const { raw } = isolated(intent.target, true)
      for (const [key, value] of Object.entries(values)) {
        if (raw.inheritance) {
          raw.inheritance.overrides[key] = value
          if (key === relation?.key && Array.isArray(value)) {
            for (const childId of Object.keys(raw.inheritance.childBindings)) {
              if (!value.includes(childId)) {
                Reflect.deleteProperty(raw.inheritance.childBindings, childId)
              }
            }
          }
        } else {
          raw[key] = value
        }
      }
    } else if (intent.kind === 'reset') {
      const { raw } = draft.locate({
        ...intent.target,
        root: {
          ...intent.target.root,
          componentId:
            roots.get(identity(intent.target))?.after.id ??
            intent.target.root.componentId
        },
        expectedPropertyId: undefined,
        expectedSourceId: undefined
      })
      const { schema } = requireCapability(raw)
      for (const key of intent.keys) {
        if (!schema.fields.some((field) => field.key === key)) {
          fail(`Unknown override field "${key}"`)
        }
        registerWrite(key, { kind: intent.kind })
      }
      if (
        raw.inheritance &&
        intent.keys.some((key) => own(raw.inheritance?.overrides ?? {}, key))
      ) {
        const isolatedRaw = isolated(intent.target, true).raw
        for (const key of intent.keys) {
          if (isolatedRaw.inheritance) {
            Reflect.deleteProperty(isolatedRaw.inheritance.overrides, key)
          }
        }
      }
    } else if (intent.kind === 'detach' || intent.kind === 'share') {
      registerWrite('$binding', intent)
      const located = isolated(intent.target, false)
      let replacement: Raw
      if (intent.kind === 'detach') {
        if (
          !located.parent &&
          !located.raw.inheritance &&
          !located.raw.sharedSource &&
          !intent.target.sharedRoot
        ) {
          continue
        }
        replacement = draft.allocate({
          type: located.raw.type,
          ...draft.fields(located.raw)
        })
      } else {
        if (
          located.raw.inheritance &&
          (Object.keys(located.raw.inheritance.overrides).length > 0 ||
            Object.keys(located.raw.inheritance.childBindings).length > 0)
        ) {
          fail('Reset or detach local overrides before sharing another source')
        }
        const source = draft.read(intent.sourceId)
        if (source.inheritance || source.type !== located.raw.type) {
          fail('Shared source must be independent and match the target type')
        }
        replacement = draft.inherit(source)
      }
      if (located.parent && located.logicalId) {
        if (!located.parent.inheritance) {
          return fail('Local child edit requires an isolated parent')
        }
        located.parent.inheritance.childBindings[located.logicalId] =
          replacement.id
      } else {
        located.root.after = replacement
      }
    } else {
      fail('Unknown property intention')
    }
  }
  const operations: PropertyMutation[] = [...directOperations]
  for (const [propertyId, original] of draft.originals) {
    const current = draft.read(propertyId)
    const changes: PropertyLayerEdit[] = []
    if (original.sharedSource !== current.sharedSource) {
      changes.push({
        layer: 'sharedSource',
        key: 'sharedSource',
        state: current.sharedSource
          ? { present: true, value: true }
          : { present: false }
      })
    }
    if (original.inheritance && current.inheritance) {
      for (const layer of ['overrides', 'childBindings'] as const) {
        for (const key of new Set([
          ...Object.keys(original.inheritance[layer]),
          ...Object.keys(current.inheritance[layer])
        ])) {
          if (
            own(original.inheritance[layer], key) ===
              own(current.inheritance[layer], key) &&
            isEqual(
              original.inheritance[layer][key],
              current.inheritance[layer][key]
            )
          ) {
            continue
          }
          changes.push({
            layer,
            key,
            state: own(current.inheritance[layer], key)
              ? { present: true, value: current.inheritance[layer][key] }
              : { present: false }
          })
        }
      }
    }
    if (changes.length) {
      operations.push({ kind: 'layers', propertyId, changes })
    }
    if (!current.inheritance) {
      const values = Object.fromEntries(
        Object.entries(current).filter(
          ([key, value]) =>
            !['id', 'type', 'sharedSource'].includes(key) &&
            !isEqual(value, original[key])
        )
      )
      if (Object.keys(values).length) {
        operations.push({ kind: 'values', propertyId, values })
      }
    }
  }
  const rootBindings = [...roots.values()]
    .filter((root) => root.before.id !== root.after.id)
    .map(({ target, before, after }) => ({
      elementId: target.root.ownerElementId,
      propertyName: target.root.ownerPropertyName,
      propertyType: before.type,
      before: before.id,
      after: after.id
    }))
  if (draft.created.size) {
    operations.push({
      kind: 'create-exact-property-graph',
      ownerRelations: [...roots.values()].map(({ target, after }) => ({
        ...target.root,
        componentId: after.id
      })),
      components: [...draft.created.values()]
    })
  }
  const retainedExistingPropertyIds = new Set<string>()
  for (const raw of draft.created.values()) {
    const relation = requireCapability(raw).config.children
    const dependencies =
      readPropertyInheritanceDependencies(raw, relation?.key) ??
      (relation && Array.isArray(raw[relation.key])
        ? (raw[relation.key] as string[])
        : [])
    for (const propertyId of dependencies) {
      if (!draft.created.has(propertyId)) {
        retainedExistingPropertyIds.add(propertyId)
      }
    }
  }
  const properties = manager.preparePropertyMutationBatch({
    operations,
    options
  })
  return {
    properties,
    rootBindings,
    releasedRootPropertyIds: rootBindings
      .filter((binding) => !draft.read(binding.before).sharedSource)
      .map((binding) => binding.before),
    retainedExistingPropertyIds: [...retainedExistingPropertyIds],
    createdPropertyIds: [...draft.created.keys()]
  }
}

export interface SharedPropertySourceUpdate {
  readonly propertyId: string
  readonly values: Readonly<Record<string, unknown>>
}

export const prepareSharedPropertySourceBatch = (
  manager: PropsManager,
  updates: readonly SharedPropertySourceUpdate[],
  options?: EVENT_OPTIONS
): PreparedPropertyMutationBatch => {
  const draft = createDraft(manager)
  const valuesById = new Map<string, Record<string, unknown>>()
  for (const update of updates) {
    const source = draft.read(update.propertyId)
    if (source.inheritance || !source.sharedSource) {
      fail('Explicit source mutation requires an independent shared source')
    }
    const values = valuesById.get(source.id) ?? {}
    if (!isRecord(update.values)) {
      fail('Invalid shared source values')
    }
    const { schema } = requireCapability(source)
    for (const [key, value] of Object.entries(update.values)) {
      const field = schema.fields.find((field) => field.key === key)
      if (!field || !isRuntimePropertyFieldValueValid(field, value)) {
        fail(`Unknown or invalid source field "${key}"`)
      }
      if (own(values, key) && !isEqual(values[key], value)) {
        fail('Conflicting shared source writes')
      }
      values[key] = structuredClone(value)
    }
    valuesById.set(source.id, values)
  }
  return manager.preparePropertyMutationBatch({
    operations: [...valuesById]
      .filter(([, values]) => Object.keys(values).length > 0)
      .map(([propertyId, values]) => ({ kind: 'values', propertyId, values })),
    options
  })
}

export interface OwnerPropertyMutation {
  readonly target: PropertyTarget
  readonly mutation: PropertyValuesMutation | PropertyRecordsMutation
}

export const prepareOwnerPropertyMutations = (
  manager: PropsManager,
  updates: readonly OwnerPropertyMutation[],
  options: EVENT_OPTIONS | undefined,
  hasOtherOwners: (propertyId: string, parentId: string) => boolean
): PreparedPropertyIntentBatch => {
  const intents: PropertyIntent[] = []
  const direct: PropertyMutation[] = []
  for (const { target, mutation } of updates) {
    if (
      target.path.length !== 0 ||
      target.root.componentId !== mutation.propertyId
    ) {
      fail('Owner mutation requires its exact root target')
    }
    const component = manager.getPropertyById(mutation.propertyId)
    if (!component) {
      return fail('Missing owner property')
    }
    const raw = component.save() as Raw
    let isolated =
      target.sharedRoot || !!raw.inheritance || raw.sharedSource === true
    if (!isolated && mutation.kind === 'records') {
      const relation = getPropertyComponentConfigDefinition(raw.type)?.children
      const members =
        relation && Array.isArray(raw[relation.key])
          ? (raw[relation.key] as string[])
          : []
      isolated = Object.keys(mutation.set ?? {}).some((childId) => {
        if (!members.includes(childId)) {
          return false
        }
        const child = manager.getPropertyById(childId)?.save()
        return (
          !!child?.inheritance ||
          child?.sharedSource === true ||
          hasOtherOwners(childId, raw.id)
        )
      })
    }
    if (!isolated) {
      direct.push(mutation)
      continue
    }
    if (mutation.values && Object.keys(mutation.values).length) {
      intents.push({ kind: 'override', target, values: mutation.values })
    }
    if (mutation.kind === 'records') {
      intents.push({
        kind: 'records',
        target,
        key: mutation.key,
        set: mutation.set,
        remove: mutation.remove
      })
    }
  }
  return preparePropertyIntentBatch(
    manager,
    intents,
    options,
    hasOtherOwners,
    direct
  )
}
