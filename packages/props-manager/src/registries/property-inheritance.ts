import {
  isRecord,
  type PropertyInheritance,
  type PropertyComponentRawData
} from '@asyra/utils'
import {
  getPropertyComponentConfigDefinition,
  resolvePropertyComponentConfigRoles
} from './property-component.js'
import { getPropertySchema } from './property-schema.js'
import { isRuntimePropertyFieldValueValid } from './property-value-kind.js'

const own = (value: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key)
function invalid(id: string, reason: string): never {
  throw new Error(
    `[PropsManager] Invalid property inheritance "${id}": ${reason}`
  )
}

export const readPropertyInheritance = (
  raw: Readonly<Record<string, unknown>>
): PropertyInheritance | undefined => {
  if (!own(raw, 'inheritance')) {
    return undefined
  }
  const data = raw.inheritance
  const id = String(raw.id)
  if (
    !isRecord(data) ||
    typeof data.sourceId !== 'string' ||
    !data.sourceId ||
    !isRecord(data.overrides) ||
    !isRecord(data.childBindings) ||
    Object.keys(data).some(
      (key) => !['sourceId', 'overrides', 'childBindings'].includes(key)
    )
  ) {
    return invalid(id, 'expected sourceId, overrides and childBindings')
  }
  if (
    Object.entries(data.childBindings).some(
      ([key, value]) => !key || typeof value !== 'string' || !value
    )
  ) {
    return invalid(id, 'invalid child binding identity')
  }
  if (raw.sharedSource !== undefined) {
    return invalid(id, 'an inherited record cannot be a shared source')
  }
  if (
    Object.keys(raw).some((key) => !['id', 'type', 'inheritance'].includes(key))
  ) {
    return invalid(
      id,
      'inherited values must not be flattened into canonical fields'
    )
  }
  return data as unknown as PropertyInheritance
}

/** Validate structural inheritance before replacing the current graph. */
export const validatePropertyInheritanceGraph = (
  records: Readonly<Record<string, PropertyComponentRawData>>,
  resolve: (id: string) => PropertyComponentRawData | undefined = (id) =>
    records[id]
): void => {
  for (const [id, record] of Object.entries(records)) {
    const raw = record as unknown as Readonly<Record<string, unknown>>
    if (raw.sharedSource !== undefined && raw.sharedSource !== true) {
      invalid(id, 'sharedSource must be true when present')
    }
    if (
      raw.sharedSource === true &&
      (!getPropertyComponentConfigDefinition(record.type) ||
        !getPropertySchema(record.type))
    ) {
      invalid(id, 'shared source requires declarative property capability')
    }
    const binding = readPropertyInheritance(raw)
    if (!binding) {
      continue
    }
    const config = getPropertyComponentConfigDefinition(record.type)
    const schema = getPropertySchema(record.type)
    if (!config || !schema) {
      invalid(id, 'declarative property capability is required')
    }
    const source = resolve(binding.sourceId)
    if (
      !source ||
      source.id === id ||
      source.type !== record.type ||
      source.inheritance ||
      source.sharedSource !== true
    ) {
      invalid(id, 'source must be an independent same-type shared property')
    }
    const roles = resolvePropertyComponentConfigRoles(config)
    for (const [key, value] of Object.entries(binding.overrides)) {
      const field = schema.fields.find((field) => field.key === key)
      if (
        !roles.persistKeys.includes(key) ||
        !field ||
        !isRuntimePropertyFieldValueValid(field, value)
      ) {
        invalid(id, `unknown or invalid override field ${key}`)
      }
    }
    const relation = config.children
    if (!relation && Object.keys(binding.childBindings).length) {
      invalid(id, 'property has no registered child relationship')
    }
    if (!relation) {
      continue
    }
    const sourceChildren = (source as unknown as Record<string, unknown>)[
      relation.key
    ]
    const children = own(binding.overrides, relation.key)
      ? binding.overrides[relation.key]
      : sourceChildren
    if (
      !Array.isArray(children) ||
      children.some((child) => typeof child !== 'string') ||
      new Set(children).size !== children.length
    ) {
      invalid(id, 'invalid source membership')
    }
    for (const [childId, localId] of Object.entries(binding.childBindings)) {
      const child = resolve(childId),
        local = resolve(localId)
      if (
        !(children as string[]).includes(childId) ||
        !child ||
        !local ||
        child.type !== relation.childType ||
        local.type !== relation.childType ||
        localId === id ||
        localId === childId
      ) {
        invalid(id, 'child binding must address a current registered child')
      }
    }
    const resolved = (children as string[]).map(
      (child) => binding.childBindings[child] ?? child
    )
    if (new Set(resolved).size !== resolved.length) {
      invalid(id, 'resolved membership contains duplicate children')
    }
  }
}

/** Load-time cycle validation; ordinary value edits use the existing indexed graph. */
export const validatePropertyInheritanceCycles = (
  records: Readonly<Record<string, PropertyComponentRawData>>
): void => {
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (id: string): void => {
    if (visiting.has(id)) {
      invalid(id, 'dependency cycle')
    }
    if (visited.has(id)) {
      return
    }
    const record = records[id]
    if (!record) {
      return
    }
    visiting.add(id)
    const inheritance = record.inheritance
    const relation = getPropertyComponentConfigDefinition(record.type)?.children
    if (inheritance) {
      visit(inheritance.sourceId)
      Object.values(inheritance.childBindings).forEach(visit)
      if (relation && Array.isArray(inheritance.overrides[relation.key])) {
        ;(inheritance.overrides[relation.key] as string[]).forEach(visit)
      }
    } else if (relation) {
      const children = (record as unknown as Record<string, unknown>)[
        relation.key
      ]
      if (Array.isArray(children)) {
        children
          .filter((child): child is string => typeof child === 'string')
          .forEach(visit)
      }
    }
    visiting.delete(id)
    visited.add(id)
  }
  Object.values(records)
    .filter((record) => record.inheritance)
    .forEach((record) => visit(record.id))
}

/** Canonical dependency identities; source links are dependencies, not owned children. */
export const readPropertyInheritanceDependencies = (
  raw: Readonly<Record<string, unknown>>,
  childKey?: string
): readonly string[] | undefined => {
  const inheritance = readPropertyInheritance(raw)
  if (!inheritance) {
    return undefined
  }
  const explicitChildren = childKey
    ? inheritance.overrides[childKey]
    : undefined
  return [
    ...new Set([
      inheritance.sourceId,
      ...Object.values(inheritance.childBindings),
      ...(Array.isArray(explicitChildren) ? (explicitChildren as string[]) : [])
    ])
  ]
}
