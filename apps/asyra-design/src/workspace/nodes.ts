import core from '../contexts'
import { featureEnabled, hasDisabledFeatures } from '../workspace-features'

type Field = string | number | boolean
export interface WorkspaceNode {
  /** The extension ID is also the stable document type. */
  name: string
  shape?: 'rectangle' | 'oval'
  fillColor?: string
  /** Field names and scalar defaults form this node's persisted schema. */
  fields?: Readonly<Record<string, Field>>
}

// Each embedded editor owns its own app realm and registration graph.
const nodes = new Map<string, WorkspaceNode>()

export function rememberNode(id: string, node: WorkspaceNode) {
  nodes.set(id, node)
}

export function nodeCreation(
  type: string,
  values?: Readonly<Record<string, Field>>
) {
  const node = nodes.get(type)

  if (node) {
    featureEnabled(type, 'reject')
  }

  if (values) {
    for (const [key, value] of Object.entries(values)) {
      if (
        !node?.fields ||
        !Object.hasOwn(node.fields, key) ||
        typeof value !== typeof node.fields[key] ||
        (typeof value === 'number' && !Number.isFinite(value))
      ) {
        throw new TypeError('Invalid node field: ' + key)
      }
    }
  }

  return node?.fillColor
}

export function requireNodeFields(
  elementIds: readonly string[],
  values?: Readonly<Record<string, unknown>>,
  recordKeys?: readonly string[]
) {
  if (!nodes.size || !hasDisabledFeatures()) {
    return
  }

  const keys = [...Object.keys(values ?? {}), ...(recordKeys ?? [])]

  for (const elementId of elementIds) {
    const type = core.getElementMetadata(elementId)?.type
    const fields = type && nodes.get(type)?.fields

    if (
      type &&
      fields &&
      keys.some((key) => key === type + 'Data' || Object.hasOwn(fields, key))
    ) {
      featureEnabled(type, 'reject')
    }
  }
}
