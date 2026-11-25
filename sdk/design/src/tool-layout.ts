import type { Point, ToolGroup, ToolLayout, ToolPlacement } from './index.js'
export type Layout = Record<ToolPlacement, string[]> & {
  floating?: Record<string, Point>
}

export function dockedLayout(): Record<ToolPlacement, string[]> {
  return {
    'toolbar.top': [],
    'properties.top': [],
    selectionMenu: [],
    manual: []
  }
}

export const slots = ['toolbar.top', 'properties.top', 'selectionMenu'] as const
export const placements: readonly ToolPlacement[] = [...slots, 'manual']

export function resolveLayout(
  groups: ReadonlyMap<string, ToolGroup>,
  input: ToolLayout = {},
  targets: ReadonlyMap<string, HTMLElement>
): Layout {
  const result: Layout = dockedLayout()
  const seen = new Set<string>()

  const floating = new Map<string, Point>()

  for (const [slot, value] of Object.entries(input)) {
    const free = slot === 'floating'

    if (
      free
        ? !value || typeof value !== 'object' || Array.isArray(value)
        : !placements.includes(slot as ToolPlacement) || !Array.isArray(value)
    ) {
      throw new TypeError('Invalid tool layout')
    }

    for (const id of free ? Object.keys(value) : (value as readonly string[])) {
      if (!groups.has(id)) {
        continue
      }

      if (seen.has(id)) {
        throw new TypeError('Repeated tool group: ' + id)
      }

      seen.add(id)
      if (free) {
        const point = input.floating?.[id]

        if (!point || !Number.isFinite(point.x) || !Number.isFinite(point?.y)) {
          throw new TypeError('Expected a floating tool position')
        }

        floating.set(id, { x: point.x, y: point.y })
      } else {
        result[slot as ToolPlacement].push(id)
      }
    }
  }

  if (floating.size) {
    result.floating = Object.fromEntries(floating)
  }

  for (const group of groups.values()) {
    if (!seen.has(group.id)) {
      result[targets.has(group.id) ? 'manual' : group.placement].push(group.id)
    }
  }

  return result
}
