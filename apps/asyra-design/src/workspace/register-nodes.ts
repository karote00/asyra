import core from '../contexts'
import {
  RECTANGLE_COMPONENT_DEFINITION,
  RECTANGLE_RENDER_STRATEGY,
  OVAL_COMPONENT_DEFINITION,
  OVAL_RENDER_STRATEGY
} from '@asyra/preset'
import { rememberNode, type WorkspaceNode } from './nodes'

const identifier = /^[a-zA-Z][a-zA-Z0-9_]*$/
const reserved = new Set([
  'id',
  'name',
  'type',
  'parentId',
  'children',
  'props',
  'lock',
  'visible',
  'constructor',
  'prototype',
  ...RECTANGLE_COMPONENT_DEFINITION.properties.flatMap((property) => [
    property.name,
    ...(property.alias ?? [])
  ])
])

export function registerWorkspaceNodes(
  entries: readonly { id: string; node: WorkspaceNode }[]
) {
  for (const { id, node } of entries) {
    if (
      typeof id !== 'string' ||
      !identifier.test(id) ||
      !node.name?.trim() ||
      (node.shape !== undefined &&
        !['rectangle', 'oval'].includes(node.shape)) ||
      (node.fillColor !== undefined && !/^#[0-9a-f]{6}$/i.test(node.fillColor))
    ) {
      throw new TypeError('Invalid workspace node definition: ' + id)
    }

    const defaults = node.fields ?? {}

    if (typeof defaults !== 'object' || Array.isArray(defaults)) {
      throw new TypeError('Node fields must be a record')
    }

    const keys = Object.keys(defaults)
    const fields = Object.entries(defaults).map(([key, defaultValue]) => {
      const kind = typeof defaultValue

      if (
        !identifier.test(key) ||
        reserved.has(key) ||
        key in Object.prototype ||
        (kind !== 'string' && kind !== 'boolean' && kind !== 'number') ||
        (kind === 'number' && !Number.isFinite(defaultValue))
      ) {
        throw new TypeError('Invalid node field: ' + key)
      }

      return { key, kind, defaultValue } as const
    })
    const property = id + 'Data'
    const oval = node.shape === 'oval'
    const base = oval
      ? OVAL_COMPONENT_DEFINITION
      : RECTANGLE_COMPONENT_DEFINITION

    if (fields.length) {
      core.registerPropertySchema({ type: property, fields })
      core.definePropertyComponent({
        type: property,
        defaults: { ...defaults }
      })
    }

    core.defineComponent({
      type: id,
      idPrefix: id,
      namePrefix: node.name,
      properties: [
        ...base.properties,
        ...(keys.length
          ? [{ name: property, type: property, alias: keys }]
          : [])
      ]
    })
    core.registerRenderStrategy(
      id,
      oval ? OVAL_RENDER_STRATEGY : RECTANGLE_RENDER_STRATEGY
    )
    rememberNode(id, node)
  }
}
